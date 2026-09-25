const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const songs = require('../data.js');

module.exports = async function testBulk({browser,url,root,check}) {
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const payload = entries => JSON.stringify({version:1,songs:entries});
  const getStored = () => page.evaluate(() => localStorage.getItem('yoru.lyrics'));
  const submit = () => page.locator('#import-form button[type=submit]').click();
  const fill = text => page.locator('#lyrics-input').fill(text);
  try {
    await page.goto(url + '/#song/yoru');
    await page.locator('[data-panel=lyrics]').click();
    await page.locator('#open-bulk-import').click();
    check('整批入口與目前曲目範本數量', await page.locator('#import-mode').inputValue() === 'bulk' && (await page.locator('#download-lyrics-template').textContent()).includes(String(songs.length)));
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#download-lyrics-template').click();
    const download = await downloadEvent;
    const template = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    check('下載範本含全部歌曲ID與六欄格式', template.version === 1 && template.songs.length === songs.length && songs.every(song => template.songs.some(entry => entry.id === song.id && entry.rows.length === 0)) && Object.keys(template.rowTemplate).length === 6);
    const entries = songs.map(song => ({id:song.id,rows:[{ja:`例文 ${song.id}`,kanji:`漢字 ${song.id}`,hiragana:`れいぶん ${song.id}`,katakana:`レイブン ${song.id}`,zh:`範例 ${song.id}`,en:`Example ${song.id}`}]}));
    const text = payload(entries);
    await page.locator('#lyrics-file').setInputFiles({name:'all.json',mimeType:'application/json',buffer:Buffer.from(text)});
    await page.waitForFunction(value => document.querySelector('#lyrics-input').value === value, text);
    check('選擇單一檔案預覽16首匯入', (await page.locator('#bulk-preview').textContent()).includes(`待匯入 ${songs.length} 首`));
    await submit();
    check('整批儲存成功提示', !(await page.locator('#import-dialog').isVisible()) && (await page.locator('#toast').textContent()).includes(`已整批儲存 ${songs.length} 首`));
    await page.reload();
    await page.locator('[data-panel=lyrics]').click();
    await page.locator('[data-language=complete]').click();
    for (const entry of entries) {
      await page.evaluate(id => {location.hash = '#song/' + id;}, entry.id);
      await page.waitForFunction(id => document.querySelector('.lyric-ja')?.textContent === `例文 ${id}`, entry.id);
      for (const [key,value] of Object.entries(entry.rows[0])) assert.equal(await page.locator(`.lyric-${key}`).textContent(), value);
      check(`整批 ${entry.id} 六欄重新整理後正確`, true);
    }
    const beforePartial = JSON.parse(await getStored());
    await page.locator('#open-bulk-import').click();
    await fill(payload([{id:songs[0].id,rows:[{en:'Updated'}]},{id:songs[1].id,rows:[]}]));
    check('整批預覽覆寫與略過首數', (await page.locator('#bulk-preview').textContent()).includes('其中 1 首') && (await page.locator('#bulk-preview').textContent()).includes('略過 1 首'));
    await submit();
    const afterPartial = JSON.parse(await getStored());
    assert.equal(afterPartial[songs[0].id].rows[0].en, 'Updated');
    assert.equal(afterPartial[songs[0].id].rows[0].ja, '');
    for (const song of songs.slice(1)) assert.deepEqual(afterPartial[song.id], beforePartial[song.id]);
    check('部分匯入只取代有內容歌曲，空與缺席曲目保留', true);
    const original = await getStored();
    await page.locator('#open-bulk-import').click();
    for (const invalid of [payload([entries[0],{id:'unknown',rows:[{ja:'錯誤'}]}]),payload([entries[0],entries[0]]),payload([entries[0],{id:songs[1].id,rows:[{en:12}]}]),JSON.stringify(template)]) {
      await fill(invalid);
      await submit();
      assert.equal(await getStored(), original);
      assert.ok(await page.locator('#import-dialog').isVisible());
      assert.ok((await page.locator('#import-error').textContent()).length > 0);
    }
    check('未知ID重複ID格式錯誤及空範本皆整批拒絕且不覆寫', true);
    await fill(text);
    await page.locator('#lyrics-file').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(songs.length * 210000 + 1002, 32)});
    check('超大新檔清除舊待匯入內容', await page.locator('#lyrics-input').inputValue() === '' && (await page.locator('#import-error').textContent()).includes('上限'));
    await submit();
    assert.equal(await getStored(), original);

    // 控制讀取完成時機，確認模式切換與手動輸入不會被晚到的檔案覆蓋。
    await page.evaluate(() => {
      window.originalFileText = File.prototype.text;
      File.prototype.text = function () { return new Promise(resolve => {window.finishFileRead = resolve;}); };
    });
    await page.locator('#lyrics-file').setInputFiles({name:'slow.json',mimeType:'application/json',buffer:Buffer.from(text)});
    await page.waitForFunction(() => typeof window.finishFileRead === 'function');
    await page.locator('#import-mode').selectOption('single');
    await page.evaluate(text => window.finishFileRead(text), text);
    check('切換模式忽略尚未完成的整批檔案', await page.locator('#lyrics-input').inputValue() === '' && await page.locator('#import-form button[type=submit]').isEnabled());
    await page.locator('#import-mode').selectOption('bulk');
    await page.locator('#lyrics-file').setInputFiles({name:'slow2.json',mimeType:'application/json',buffer:Buffer.from(text)});
    await fill(payload([entries[0]]));
    await page.evaluate(text => window.finishFileRead(text), text);
    check('手動貼上優先於晚到的檔案讀取', await page.locator('#lyrics-input').inputValue() === payload([entries[0]]));
    await page.evaluate(() => {File.prototype.text = window.originalFileText;});

    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key,value) {if (key === 'yoru.lyrics') throw new DOMException('Full','QuotaExceededError'); return original.call(this,key,value);};
    });
    await fill(text);
    await submit();
    check('容量不足整批不變更且保留輸入', await getStored() === original && await page.locator('#lyrics-input').inputValue() === text && (await page.locator('#import-error').textContent()).includes('未變更任何歌曲'));
    await page.keyboard.press('Escape');
    await page.evaluate(id => {location.hash = '#song/' + id;}, songs[0].id);
    await page.waitForFunction(() => document.querySelector('.lyric-en')?.textContent === 'Updated');
    check('儲存失敗不更新記憶體中的歌詞', await page.locator('.lyric-en').textContent() === 'Updated');
    await page.locator('#open-bulk-import').click();
    await page.setViewportSize({width:360,height:844});
    await fill(text);
    check('整批匯入手機對話框無水平溢出', await page.evaluate(() => {const d=document.querySelector('#import-dialog');return d.scrollWidth <= d.clientWidth && document.documentElement.scrollWidth <= innerWidth;}));
    await page.screenshot({path:path.join(root,'test-results','mobile-bulk-import.png'),fullPage:true});
    await page.keyboard.press('Escape');
    check('整批Escape關閉並回到入口按鈕', await page.locator('#open-bulk-import').evaluate(node => node === document.activeElement));
    check('整批流程無JavaScript執行錯誤', errors.length === 0);
  } finally { await context.close(); }
};
