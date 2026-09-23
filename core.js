(function (root) {
  'use strict';
  const api = {
    filterSongs(songs, query, category, favorites) {
      const term = query.trim().normalize('NFKC').toLowerCase();
      return songs.filter(song => {
        const match = category === 'all' || (category === 'favorites' ? favorites.includes(song.id) : song.category === category);
        return match && [song.title, song.zh, song.roman, song.story, song.author, song.tie].join(' ').normalize('NFKC').toLowerCase().includes(term);
      });
    },
    parseLyrics(text) {
      if (new TextEncoder().encode(text).length > 200000) throw Error('檔案上限為 200 KB。');
      let rows;
      try { rows = JSON.parse(text); } catch { throw Error('無法解析 JSON，請檢查括號與引號。'); }
      return api.validateLyricsRows(rows);
    },
    validateLyricsRows(rows) {
      if (!Array.isArray(rows) || !rows.length || rows.length > 500) throw Error('請提供包含 1 至 500 行的陣列。');
      return rows.map((row, index) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) throw Error(`第 ${index + 1} 行格式錯誤。`);
        const line = {};
        for (const key of ['ja', 'zh', 'en', 'hiragana', 'katakana', 'kanji']) {
          if (row[key] !== undefined && typeof row[key] !== 'string') throw Error(`第 ${index + 1} 行的 ${key} 必須是文字。`);
          line[key] = (row[key] || '').trim();
          if (line[key].length > 1000) throw Error(`第 ${index + 1} 行文字過長。`);
        }
        if (!Object.values(line).some(Boolean)) throw Error(`第 ${index + 1} 行至少需要一個文字或讀音欄位。`);
        return line;
      });
    },
    readJSON(storage, key, fallback, onError = () => {}) {
      try { const raw = storage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { onError(); return fallback; }
    },
    saveJSON(storage, key, value) {
      try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.YoruCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
