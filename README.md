# 範例E：夜空床鈴作品室

分支：`codex/example-e`。使用提供的個人圖示與簽名，保留可拖曳的蛋。

## 啟動與更新

需要 Node.js 20 以上，網站本身沒有第三方執行期套件。

```powershell
node scripts/serve.mjs
```

開啟 http://127.0.0.1:5505。預覽模式每次重新整理會掃描作品資料夾。

```powershell
node scripts/sync-artworks.mjs # 更新靜態網站作品清單
node scripts/build.mjs         # 更新清單並輸出 dist/ 網站
node --test tests/catalog.test.mjs
```

也可使用 `npm run dev`、`npm run sync`、`npm run build`、`npm test`。靜態主機部署 `dist/` 內容；只上傳新圖片而未同步清單不會更新作品。這次未變更正式站部署設定。

## 作品資料夾

- 自動遞迴讀取 `assets/artworks/` 的 PNG、JPEG、WebP、GIF、AVIF，新增或刪除後執行更新或建置。
- 檔名可含 `YYYY-MM-DD`、`YYYY_MM_DD`、`YYYY.MM.DD` 或 `YYYYMMDD`；有日期的作品依日期由新到舊。
- 無日期的既有作品沿用 `scripts/data/artworksData.js` 順序；其餘無日期檔案依檔名自然排序，放在後方。不以檔案修改時間冒充創作日期。
- 日期相同時沿用既有順序，再按檔名排序。子資料夾名稱可顯示為作品分類。
- `scripts/data/artwork-catalog.json` 是產生的清單，不必逐件編輯床鈴節點。現有 16 張作品皆沒有日期。

## 操作與素材

- 桌面停留或鍵盤聚焦顯示觀測鏡，點按／Enter 開啟作品；觸控第一次點按預覽，再點作品或預覽進入詳情。
- 詳情依序通往委託須知、價目表、委託表單；上一步、關閉與 Escape 均可使用。原瀏覽位置與焦點會保留。
- Google 表單使用原專案連結及方案預填欄位，在新分頁開啟；網站不會自動送出委託。
- 價格沿用原網站目前呈現的頭像 500／半身 1,100 起／全身 2,800 起；須知保留原文。英文須知尚無原稿，因此顯示提示並保留中文條款。
- `assets/profile/muro-night.png`、`muro-signature.png` 為提供的原圖；簽名只透過瀏覽器濾鏡轉為淺色透明底，未改寫原圖。
- CSS 實作像素金屬結構、反光與微幅擺動；原作使用 `object-fit: contain`，保持比例和色彩。離屏作品停止動畫，圖片延遲載入，支援 `prefers-reduced-motion`。
- X 參考網址未能讀取，設計依需求文字與提供圖片完成。

瀏覽器驗證：本機安裝 Playwright 與 Microsoft Edge 後執行 `node tests/browser.cjs`。也可用 `PLAYWRIGHT_PATH` 指向已安裝的 Playwright。測試需先啟動預覽，截圖寫入忽略版控的 `.test-results/`；測試不提交外部表單。

---

About me<br>
卯咪寶寶巴士工作室繪師<br>
木洛 / muro / 楊莫<br>
可以用各種形式稱呼我，歡迎幫我想愛稱<br>
＊＊＊＊<br>
練習像素（Pixel Art）風格中 沒什麼特別的雷點<br>
講話會注音文<br>
笑聲超大聲<br>
講話很機車<br>
＊＊＊＊<br>
重度網癮者，歡迎找我打遊戲<br>
