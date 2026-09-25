const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const songs = require('../data.js');

test('曲目 id 唯一，每首皆有可追溯 HTTPS 來源', () => {
  assert.equal(songs.length, 16);
  assert.equal(new Set(songs.map(s => s.id)).size, 16);
  songs.forEach(s => assert.match(s.source, /^https:\/\//));
});
test('搜尋支援中文、日文、原作及空白與大小寫', () => {
  assert.equal(core.filterSongs(songs, '  IDOL ', 'all', []).length, 1);
  assert.equal(core.filterSongs(songs, '芙莉蓮', 'all', [])[0].id, 'yuusha');
  assert.equal(core.filterSongs(songs, 'ユーレイ', 'novel', [])[0].id, 'umi');
  assert.equal(core.filterSongs(songs, '不存在', 'all', []).length, 0);
});
test('分類與收藏組合篩選', () => {
  assert.equal(core.filterSongs(songs, '', 'novel', []).length, 11);
  assert.equal(core.filterSongs(songs, '', 'anime', []).length, 5);
  assert.equal(core.filterSongs(songs, '', 'favorites', ['idol']).length, 1);
  assert.equal(core.filterSongs(songs, '', 'favorites', []).length, 0);
});
test('八首新增曲目可依中文與原作搜尋，資料欄位齊全', () => {
  for (const id of ['anoyume','halzion','tabun','haruka','encore','kaibutsu','suisei','sangenshoku']) {
    const song = songs.find(item => item.id === id);
    assert.ok(song, id);
    for (const field of ['title','zh','roman','year','story','author','tie','note','summary','sourceLabel','motif']) assert.ok(song[field]?.trim(), `${id}.${field}`);
    assert.ok(core.filterSongs(songs, song.zh, 'all', []).some(item => item.id === id));
    assert.ok(core.filterSongs(songs, song.story, song.category, []).some(item => item.id === id));
    assert.match(song.listen, /^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/);
  }
});
test('合法雙語與單語匯入，HTML 保留為純文字', () => {
  assert.deepEqual(core.parseLyrics('[{"ja":" <b>夜</b> ","zh":"夜晚"}]'), [{ja:'<b>夜</b>',zh:'夜晚',en:'',hiragana:'',katakana:'',kanji:''}]);
  assert.deepEqual(core.parseLyrics('[{"ja":"日文"}]'), [{ja:'日文',zh:'',en:'',hiragana:'',katakana:'',kanji:''}]);
});
test('英文單語與三語匯入，英文套用相同限制', () => {
  assert.deepEqual(core.parseLyrics('[{"en":" Example "}]'), [{ja:'',zh:'',en:'Example',hiragana:'',katakana:'',kanji:''}]);
  assert.deepEqual(core.parseLyrics('[{"ja":"例","zh":"範例","en":"Example"}]'), [{ja:'例',zh:'範例',en:'Example',hiragana:'',katakana:'',kanji:''}]);
  for (const en of [null, 12, {}, ' ', 'x'.repeat(1001)]) assert.throws(() => core.parseLyrics(JSON.stringify([{en}])));
});
test('拒絕不合法、空白、超長與錯誤型別', () => {
  for (const input of ['bad', '{}', '[]', '[null]', '[{"ja":1}]', '[{"ja":" "}]', JSON.stringify([{zh:'x'.repeat(1001)}]), JSON.stringify(Array(501).fill({ja:'a'}))]) {
    assert.throws(() => core.parseLyrics(input));
  }
});
test('儲存損壞／拒絕時回復預設，儲存結果可供提示', () => {
  assert.deepEqual(core.readJSON({getItem:()=>'broken'}, 'x', []), []);
  assert.equal(core.saveJSON({setItem:()=>{throw Error('denied')}}, 'x', {}), false);
  assert.equal(core.saveJSON({setItem:()=>{}}, 'x', {}), true);
});
test('損壞資料回報錯誤，但首次空儲存不誤報', () => {
  let count = 0;
  core.readJSON({getItem:()=>'{broken'}, 'x', [], () => count++);
  core.readJSON({getItem:()=>null}, 'x', [], () => count++);
  assert.equal(count, 1);
});

test('假名單欄可匯入，欄位限制與其他語言一致', () => {
 for (const key of ['hiragana','katakana']) {
  const sample = key === 'hiragana' ? 'れいぶん' : 'レイブン';
  const expected = {ja:'',zh:'',en:'',hiragana:'',katakana:'',kanji:'',[key]:sample};
  assert.deepEqual(core.parseLyrics(JSON.stringify([{[key]:' '+sample+' '}])), [expected]);
  for (const value of [null, 1, {}, ' ', 'x'.repeat(1001)]) assert.throws(() => core.parseLyrics(JSON.stringify([{[key]:value}])));
 }
});

test('漢字單欄匯入與欄位限制', () => {
 assert.equal(core.parseLyrics('[{"kanji":" 例文 "}]')[0].kanji, '例文');
 for (const kanji of [null, 1, {}, ' ', 'x'.repeat(1001)]) assert.throws(() => core.parseLyrics(JSON.stringify([{kanji}])));
});

test('接近上限的合法匯入標準化後仍可讀取儲存資料', () => {
 const input = JSON.stringify(Array.from({length:500}, () => ({ja:'a'.repeat(350)})));
 const rows = core.parseLyrics(input);
 assert.ok(Buffer.byteLength(input) < 200000);
 assert.ok(Buffer.byteLength(JSON.stringify(rows)) > 200000);
 assert.deepEqual(core.validateLyricsRows(rows), rows);
 assert.throws(() => core.parseLyrics(JSON.stringify(rows)));
 assert.throws(() => core.validateLyricsRows([{kanji:12}]));
});

const bulkText = entries => JSON.stringify({version:1,songs:entries});
test('整批匯入全部曲目與六欄，支援新增曲目而不寫死16', () => {
 const catalog = [...songs, {id:'future',title:'未來曲目'}];
 const row = {ja:'例文',zh:'範例',en:'Example',hiragana:'れいぶん',katakana:'レイブン',kanji:'例文'};
 const result = core.parseBulkLyrics(bulkText(catalog.map(song => ({id:song.id,rows:[row]}))), catalog);
 assert.equal(Object.keys(result.entries).length, 17);
 assert.deepEqual(result.entries.future.rows, [row]);
 assert.equal(result.entries.future.demo, false);
 assert.equal(result.skipped, 0);
});
test('整批範本依曲目產生，空歌曲不覆寫，允許部分更新', () => {
 const template = core.createLyricsTemplate(songs);
 assert.deepEqual(template.songs.map(song => song.id), songs.map(song => song.id));
 assert.equal(Object.keys(template.rowTemplate).length, 6);
 assert.ok(template.songs.every(song => song.rows.length === 0 && song.title));
 assert.throws(() => core.parseBulkLyrics(JSON.stringify(template), songs), /沒有可匯入/);
 template.songs[0].rows = [{en:'Example'}];
 const result = core.parseBulkLyrics(JSON.stringify(template), songs);
 assert.deepEqual(Object.keys(result.entries), [songs[0].id]);
 assert.equal(result.skipped, songs.length - 1);
 assert.equal(core.parseBulkLyrics(bulkText([{id:songs[1].id,rows:[{kanji:'例'}]}]), songs).entries[songs[1].id].rows[0].kanji, '例');
});
test('整批拒絕未知ID、重複ID、無效版本與任何歌曲錯誤', () => {
 const valid = {id:songs[0].id,rows:[{ja:'例文'}]};
 for (const text of ['[]','null','{}','bad',JSON.stringify({version:2,songs:[valid]}),bulkText([]),bulkText([valid,valid]),bulkText([{id:'unknown',rows:[]}]),bulkText([{id:'__proto__',rows:[{ja:'例'}]}]),bulkText([null]),bulkText([{id:3,rows:[]}]),bulkText([valid,{id:songs[1].id,rows:[{en:12}]}]),bulkText([{id:songs[0].id,rows:null}])]) {
  assert.throws(() => core.parseBulkLyrics(text, songs));
 }
 assert.throws(() => core.parseBulkLyrics(bulkText([{id:songs[1].id,rows:[{en:12}]}]), songs), new RegExp(songs[1].id));
});
test('整批容量依曲目成長，每曲仍有行數、欄位與200KB限制', () => {
 assert.ok(core.bulkImportLimit([...songs,{id:'future'}]) > core.bulkImportLimit(songs));
 assert.throws(() => core.parseBulkLyrics(' '.repeat(core.bulkImportLimit(songs) + 1), songs), /上限/);
 for (const rows of [Array(501).fill({ja:'a'}),[{en:'a'.repeat(1001)}],Array(500).fill({ja:'a'.repeat(450)})]) {
  assert.throws(() => core.parseBulkLyrics(bulkText([{id:songs[0].id,rows}]), songs));
 }
});
