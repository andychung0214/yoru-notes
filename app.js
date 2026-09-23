(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const songs = window.YoruSongs;
  const core = window.YoruCore;
  let storage;
  let storageReadFailed = false;
  const readFailed = () => { storageReadFailed = true; };
  try { storage = window.localStorage; } catch { storage = null; }
  let favorites = core.readJSON(storage, 'yoru.favorites', [], readFailed);
  if (!Array.isArray(favorites)) { favorites = []; readFailed(); }
  favorites = favorites.filter(id => songs.some(song => song.id === id));
  let library = core.readJSON(storage, 'yoru.lyrics', {}, readFailed);
  if (!library || typeof library !== 'object' || Array.isArray(library)) { library = {}; readFailed(); }
  const validatedLibrary = {};
  for (const song of songs) {
    if (library[song.id]) {
      try { validatedLibrary[song.id] = {rows:core.parseLyrics(JSON.stringify(library[song.id].rows)), demo:library[song.id].demo === true}; } catch { readFailed(); }
    }
  }
  library = validatedLibrary;
  let active = songs[0];
  let category = 'all';
  let panel = 'story';
  let language = 'both';
  let toastTimer;
  let demoText = '';
  let importTarget = active.id;
  let fileReadVersion = 0;
  let importTrigger = null;
  const dialog = $('#import-dialog');
  function notify(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5500);
  }
  function save(key, value) {
    if (!core.saveJSON(storage, key, value)) { notify('瀏覽器無法儲存；本次操作仍有效，重新整理後可能遺失。'); return false; }
    return true;
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function renderList() {
    const focusedSong = document.activeElement.closest('.song-item')?.getAttribute('href');
    const found = core.filterSongs(songs, $('#search').value, category, favorites);
    $('#song-count').textContent = `${String(found.length).padStart(2, '0')} TRACKS`;
    $('#song-list').replaceChildren();
    $('#empty-list').hidden = found.length > 0;
    found.forEach(song => {
      const link = el('a', 'song-item');
      link.href = `#song/${song.id}`;
      if (song.id === active.id && location.hash !== '#ikura') link.setAttribute('aria-current', 'page');
      link.append(el('span', 'track-number', String(songs.indexOf(song) + 1).padStart(2, '0')));
      const copy = el('span');
      const title = el('strong', '', song.title);
      title.lang = 'ja';
      copy.append(title, el('small', '', `${song.zh} · ${song.year}`));
      link.append(copy, el('span', 'track-arrow', favorites.includes(song.id) ? '♥' : '↗'));
      $('#song-list').append(link);
    });
    if (focusedSong) {
      const replacement = $$('.song-item').find(link => link.getAttribute('href') === focusedSong);
      if (replacement) replacement.focus({preventScroll:true});
    }
  }
  function renderFavorite() {
    const included = favorites.includes(active.id);
    $('#favorite').setAttribute('aria-pressed', String(included));
    $('#favorite').textContent = included ? '♥ 已收藏' : '＋ 加入收藏';
  }
  function renderLyrics() {
    const content = $('#lyrics-content');
    content.replaceChildren();
    const entry = library[active.id];
    $('#lyrics-controls').hidden = !entry;
    if (!entry) {
      const empty = el('div', 'lyrics-empty');
      empty.append(el('div', 'empty-symbol', '文 / あ'), el('h3', '', '為這首歌，放入你的閱讀版本。'), el('p', '', '本站未收錄受版權保護的完整歌詞與翻譯。你可以匯入有權使用的日中英對照內容，或前往官方 MV 查看其說明與字幕（若有提供）。'));
      const button = el('button', 'button dark-button', '匯入我的歌詞');
      button.addEventListener('click', openImport);
      empty.append(button);
      content.append(empty);
      return;
    }
    entry.rows.forEach((row, index) => {
      const line = el('div', 'lyric-row');
      line.append(el('span', 'line-number', String(index + 1).padStart(2, '0')));
      const copy = el('div');
      const visibleLanguages = language === 'all' ? ['ja', 'zh', 'en'] : language === 'both' ? ['ja', 'zh'] : [language];
      const labels = {ja:'日文', zh:'中文', en:'英文'};
      for (const key of visibleLanguages) {
        const text = el('p', `lyric-${key}`, row[key] || `（此行未提供${labels[key]}）`);
        text.lang = row[key] ? (key === 'zh' ? 'zh-Hant' : key) : 'zh-Hant';
        copy.append(text);
      }
      line.append(copy);
      content.append(line);
    });
    $('#lyrics-origin').textContent = entry.demo ? '原創介面示範文字 · 並非 YOASOBI 歌詞' : '個人匯入內容 · 僅儲存於此瀏覽器';
  }
  function showPanel(value) {
    panel = value;
    $$('[data-panel]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.panel === panel)));
    $('#story-panel').hidden = panel !== 'story';
    $('#lyrics-panel').hidden = panel !== 'lyrics';
    if (panel === 'lyrics') renderLyrics();
  }
  function route() {
    const isArtist = location.hash === '#ikura';
    $('#artist-page').hidden = !isArtist;
    $('#song-page').hidden = isArtist;
    if (isArtist) { document.title = 'ikura｜YORU Notes 夜讀音樂室'; renderList(); return; }
    const id = location.hash.replace('#song/', '');
    active = songs.find(song => song.id === id) || songs[0];
    const fields = {'song-title':active.title,'song-zh':active.zh,'song-roman':active.roman,'song-note':active.note,'hero-year':active.year,'hero-category':active.category === 'anime' ? 'ANIME & ORIGINAL STORY' : 'NOVEL INTO MUSIC','record-motif':active.motif,'credit-author':active.author,'story-title':active.story,'story-author':`原作・${active.author}`,'story-summary':active.summary,'story-tie':active.tie};
    Object.entries(fields).forEach(([id, value]) => { document.getElementById(id).textContent = value; });
    $('#listen').href = active.listen;
    $('#story-source').href = active.source;
    $('#story-source').textContent = `${active.sourceLabel} ↗`;
    document.title = `${active.title}｜YORU Notes 夜讀音樂室`;
    renderFavorite(); renderList(); showPanel(panel);
  }
  function openImport() {
    importTrigger = document.activeElement;
    importTarget = active.id;
    fileReadVersion++;
    $('#import-song').textContent = active.title;
    $('#lyrics-input').value = library[active.id] ? JSON.stringify(library[active.id].rows, null, 2) : '';
    demoText = library[active.id]?.demo ? $('#lyrics-input').value : '';
    $('#lyrics-file').value = '';
    $('#import-error').textContent = '';
    dialog.showModal();
  }
  function setTheme(theme, persist) {
    if (!['forest', 'wine'].includes(theme)) theme = 'forest';
    document.body.dataset.theme = theme;
    $$('[data-theme]').filter(node => node.tagName === 'BUTTON').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === theme)));
    if (persist) save('yoru.theme', theme);
  }
  $('#search').addEventListener('input', renderList);
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    $('#main').focus({preventScroll:true});
    $('#main').scrollIntoView();
  });
  $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderList();
  }));
  $('#reset-filters').addEventListener('click', () => { $('#search').value = ''; $('[data-filter=all]').click(); $('#search').focus(); });
  $('#favorite').addEventListener('click', () => {
    const id = active.id;
    favorites = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
    if (save('yoru.favorites', favorites)) notify(favorites.includes(id) ? '已加入你的收藏。' : '已從收藏移除。');
    renderFavorite(); renderList();
  });
  $$('[data-panel]').forEach(button => button.addEventListener('click', () => showPanel(button.dataset.panel)));
  $$('[data-language]').forEach(button => button.addEventListener('click', () => {
    language = button.dataset.language;
    $$('[data-language]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderLyrics();
  }));
  $$('button[data-theme]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme, true)));
  $('#open-import').addEventListener('click', openImport);
  $('#close-import').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    fileReadVersion++;
    $('#import-form button[type=submit]').disabled = false;
    (importTrigger?.isConnected ? importTrigger : $('#open-import')).focus();
  });
  $('#load-example').addEventListener('click', () => {
    fileReadVersion++;
    $('#import-form button[type=submit]').disabled = false;
    demoText = JSON.stringify([{ja:'これは表示を確かめるための例文です。',zh:'這是用來確認顯示效果的範例句子。',en:'This is a sample sentence to check the display.'},{ja:'ここに自分のテキストを入れます。',zh:'在這裡放入自己的文字。',en:'Place your own text here.'}], null, 2);
    $('#lyrics-input').value = demoText;
    $('#import-error').textContent = '';
  });
  $('#lyrics-file').addEventListener('change', async event => {
    const version = ++fileReadVersion;
    const file = event.target.files[0];
    if (!file) return;
    $('#import-error').textContent = '';
    if (file.size > 200000) { $('#import-error').textContent = '檔案上限為 200 KB。'; return; }
    const submit = $('#import-form button[type=submit]');
    submit.disabled = true;
    try {
      const value = await file.text();
      if (version === fileReadVersion && dialog.open) { $('#lyrics-input').value = value; demoText = ''; }
    } catch { if (version === fileReadVersion) $('#import-error').textContent = '無法讀取檔案，請重新選擇或貼上內容。'; }
    finally { if (version === fileReadVersion) submit.disabled = false; }
  });
  $('#import-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const text = $('#lyrics-input').value;
      library[importTarget] = {rows:core.parseLyrics(text),demo:!!demoText && text === demoText};
      const persisted = save('yoru.lyrics', library);
      dialog.close();
      renderLyrics();
      if (persisted) notify('已儲存個人內容，可以切換日文、中文、英文或對照閱讀。');
    } catch (error) { $('#import-error').textContent = error.message; }
  });
  $('#delete-lyrics').addEventListener('click', () => {
    delete library[active.id];
    if (save('yoru.lyrics', library)) notify('已清除這首歌曲的匯入內容。');
    renderLyrics();
  });
  window.addEventListener('hashchange', route);
  setTheme(core.readJSON(storage, 'yoru.theme', 'forest', readFailed), false);
  route();
  if (storageReadFailed) notify('部分本機資料無法讀取，已使用可用內容。請保留原始歌詞檔案，必要時重新匯入。');
})();
