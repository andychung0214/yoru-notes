# 參與開發

1. 使用 `feature/xxx`、`fix/xxx` 或 `chore/xxx` 分支。
2. 保持 HTML、CSS、Vanilla JavaScript，網站不得新增執行時套件或後端依賴。
3. 新增歌曲時提供官方或發行方來源，保留核對日期，不複製完整歌詞、翻譯、小說或未授權圖片。
4. 動態文字使用 textContent，匯入格式必須經 core.parseLyrics 驗證，不使用 eval 或動態 HTML。
5. 跑 `npm test`，互動修改再跑 `npm run test:browser` 並檢查桌機與手機截圖。
6. 中文文件、註解與介面使用正體中文：建立、資料、資訊、儲存、搜尋、品質、元件、程式碼、整合。
7. Commit 使用 Conventional Commits，描述為正體中文，例如 `fix: 修正歌詞匯入錯誤提示`。
8. 不加入 .env、憑證、token、私人金鑰、使用者歌詞或 node_modules。只明確加入這次修改的檔案。
9. 推送前顯示 remote、branch 與 commit；不得將任何憑證放入 remote URL。

提交前檢查：键盤可操作、空狀態清楚、無水平溢出、儲存失敗不崩潰、示範文字標示明確。授權範圍見 LICENSE 與 README。
