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
      try { validatedLibrary[song.id] = {rows:core.validateLyricsRows(library[song.id].rows), demo:library[song.id].demo === true}; } catch { readFailed(); }
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
      const visibleLanguages = language === 'complete' ? ['ja', 'kanji', 'hiragana', 'katakana', 'zh', 'en'] : language === 'all' ? ['ja', 'zh', 'en'] : language === 'both' ? ['ja', 'zh'] : [language];
      const labels = {ja:'日文', zh:'中文', en:'英文', hiragana:'平假名', katakana:'片假名', kanji:'漢字'};
      const languageTags = {ja:'ja', zh:'zh-Hant', en:'en', hiragana:'ja', katakana:'ja', kanji:'ja'};
      for (const key of visibleLanguages) {
        const text = el('p', `lyric-${key}`, row[key] || `（此行未提供${labels[key]}）`);
        text.lang = row[key] ? languageTags[key] : 'zh-Hant';
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
  const singlePlaceholder = $('#lyrics-input').placeholder;
  function updateImportPreview() {
    const preview = $('#bulk-preview');
    preview.textContent = '';
    if ($('#import-mode').value !== 'bulk' || !$('#lyrics-input').value.trim()) return;
    try {
      const result = core.parseBulkLyrics($('#lyrics-input').value, songs);
      const ids = Object.keys(result.entries);
      const overwrite = ids.filter(id => library[id]).length;
      preview.textContent = `待匯入 ${ids.length} 首，其中 ${overwrite} 首將取代已有內容；略過 ${result.skipped} 首空資料。目前曲目共 ${songs.length} 首。`;
    } catch (error) { preview.textContent = error.message; }
  }
  function setImportMode(mode) {
    fileReadVersion++;
    const bulk = mode === 'bulk';
    $('#import-mode').value = bulk ? 'bulk' : 'single';
    $('#single-import-help').hidden = bulk;
    $('#bulk-import-help').hidden = !bulk;
    $('#bulk-preview').hidden = !bulk;
    $('#load-example').hidden = bulk;
    $('#lyrics-input').value = '';
    $('#lyrics-input').placeholder = bulk ? '{"version":1,"songs":[{"id":"yoru","rows":[{"ja":"例文","zh":"範例"}]}]}' : singlePlaceholder;
    $('#lyrics-file').value = '';
    $('#import-error').textContent = '';
    $('#lyrics-file-label').textContent = bulk ? `選擇整批 JSON（上限 ${(core.bulkImportLimit(songs) / 1000000).toFixed(3)} MB，每首 200 KB）` : '選擇 JSON 檔案（200 KB 以內）';
    $('#download-lyrics-template').textContent = `下載全部 ${songs.length} 首 JSON 範本`;
    $('#import-form button[type=submit]').disabled = false;
    $('#import-form button[type=submit]').textContent = bulk ? '整批儲存歌詞' : '儲存並開始閱讀';
    demoText = '';
    updateImportPreview();
  }
  function openImport(mode = 'single') {
    importTrigger = document.activeElement;
    importTarget = active.id;
    setImportMode(mode);
    $('#import-song').textContent = active.title;
    if ($('#import-mode').value === 'single') {
      $('#lyrics-input').value = library[active.id] ? JSON.stringify(library[active.id].rows, null, 2) : '';
      demoText = library[active.id]?.demo ? $('#lyrics-input').value : '';
    }
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
  $('#open-bulk-import').addEventListener('click', () => openImport('bulk'));
  $('#import-mode').addEventListener('change', event => setImportMode(event.target.value));
  $('#lyrics-input').addEventListener('input', () => {
    fileReadVersion++;
    $('#import-form button[type=submit]').disabled = false;
    $('#import-error').textContent = '';
    demoText = '';
    updateImportPreview();
  });
  $('#download-lyrics-template').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(core.createLyricsTemplate(songs), null, 2)], {type:'application/json;charset=utf-8'}));
    const link = el('a');
    link.href = url;
    link.download = 'yoru-notes-all-songs.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('#close-import').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    fileReadVersion++;
    $('#import-form button[type=submit]').disabled = false;
    (importTrigger?.isConnected ? importTrigger : $('#open-import')).focus();
  });
  $('#load-example').addEventListener('click', () => {
    fileReadVersion++;
    $('#import-form button[type=submit]').disabled = false;
    demoText = JSON.stringify([{kanji:'これは表示を確かめるための例文です。',ja:'これは表示を確かめるための例文です。',zh:'這是用來確認顯示效果的範例句子。',en:'This is a sample sentence to check the display.',hiragana:'これはひょうじをたしかめるためのれいぶんです。',katakana:'コレハヒョウジヲタシカメルタメノレイブンデス。'},{kanji:'ここに自分のテキストを入れます。',ja:'ここに自分のテキストを入れます。',zh:'在這裡放入自己的文字。',en:'Place your own text here.',hiragana:'ここにじぶんのてきすとをいれます。',katakana:'ココニジブンノテキストヲイレマス。'}], null, 2);
    $('#lyrics-input').value = demoText;
    $('#import-error').textContent = '';
  });
  $('#lyrics-file').addEventListener('change', async event => {
    const version = ++fileReadVersion;
    const file = event.target.files[0];
    const submit = $('#import-form button[type=submit]');
    submit.disabled = false;
    $('#lyrics-input').value = '';
    demoText = '';
    $('#import-error').textContent = '';
    updateImportPreview();
    if (!file) return;
    const limit = $('#import-mode').value === 'bulk' ? core.bulkImportLimit(songs) : 200000;
    if (file.size > limit) { $('#import-error').textContent = `檔案超過上限（${limit.toLocaleString()} bytes）。請分批匯入。`; return; }
    submit.disabled = true;
    try {
      const value = await file.text();
      if (version === fileReadVersion && dialog.open) { $('#lyrics-input').value = value; updateImportPreview(); }
    } catch { if (version === fileReadVersion) $('#import-error').textContent = '無法讀取檔案，請重新選擇或貼上內容。'; }
    finally { if (version === fileReadVersion) submit.disabled = false; }
  });
  $('#import-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const text = $('#lyrics-input').value;
      if ($('#import-mode').value === 'bulk') {
        const result = core.parseBulkLyrics(text, songs);
        const nextLibrary = {...library, ...result.entries};
        if (!core.saveJSON(storage, 'yoru.lyrics', nextLibrary)) throw Error('瀏覽器無法儲存整批內容，可能是容量不足或儲存權限遭拒。此次未變更任何歌曲，請縮小檔案或分批匯入。');
        library = nextLibrary;
        dialog.close();
        renderLyrics();
        notify(`已整批儲存 ${Object.keys(result.entries).length} 首歌曲；其餘歌曲保持原內容。`);
        return;
      }
      library[importTarget] = {rows:core.parseLyrics(text),demo:!!demoText && text === demoText};
      const persisted = save('yoru.lyrics', library);
      dialog.close();
      renderLyrics();
      if (persisted) notify('已儲存個人內容，可以切換語言、假名讀音或全部對照。');
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
