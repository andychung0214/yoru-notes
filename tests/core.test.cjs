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
  assert.deepEqual(core.parseLyrics('[{"ja":" <b>夜</b> ","zh":"夜晚"}]'), [{ja:'<b>夜</b>',zh:'夜晚'}]);
  assert.deepEqual(core.parseLyrics('[{"ja":"日文"}]'), [{ja:'日文',zh:''}]);
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
