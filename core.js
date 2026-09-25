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
    bulkImportLimit(songs) { return songs.length * 210000 + 1000; },
    createLyricsTemplate(songs) {
      return {
        version:1,
        instructions:'將 rowTemplate 複製到各首 rows 陣列中，填入每行文字。rows 為空陣列的歌曲略過；id 請勿更改。',
        rowTemplate:{ja:'',kanji:'',hiragana:'',katakana:'',zh:'',en:''},
        songs:songs.map(song => ({id:song.id,title:song.title,rows:[]}))
      };
    },
    parseBulkLyrics(text, songs) {
      if (new TextEncoder().encode(text).length > api.bulkImportLimit(songs)) throw Error('整批檔案超過容量上限，請分批匯入。');
      let data;
      try { data = JSON.parse(text.replace(/^\uFEFF/, '')); } catch { throw Error('無法解析 JSON，請檢查括號與引號。'); }
      if (!data || data.version !== 1 || !Array.isArray(data.songs) || !data.songs.length || data.songs.length > songs.length) {
        throw Error(`請使用 version: 1 並提供 songs 陣列（1 至 ${songs.length} 首），可下載範本。`);
      }
      const catalog = new Map(songs.map(song => [song.id, song]));
      const seen = new Set();
      const entries = {};
      let skipped = 0;
      for (const item of data.songs) {
        if (!item || typeof item.id !== 'string' || !catalog.has(item.id)) throw Error(`未知歌曲 ID：${typeof item?.id === 'string' ? item.id : '未提供有效 id'}，請對照最新範本。`);
        if (seen.has(item.id)) throw Error(`歌曲 ID 重複：${item.id}。`);
        seen.add(item.id);
        if (Array.isArray(item.rows) && item.rows.length === 0) { skipped++; continue; }
        try {
          entries[item.id] = {rows:api.parseLyrics(JSON.stringify(item.rows)),demo:false};
        } catch (error) { throw Error(`〈${catalog.get(item.id).title}〉（${item.id}）：${error.message}`); }
      }
      if (!Object.keys(entries).length) throw Error('沒有可匯入的歌詞。請先在至少一首歌曲的 rows 填入文字。');
      return {entries,skipped};
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
