# 像素社群圖示獨立預覽

入口：`index.html`。圖示已接入版本 E 的右上角，此頁保留作為獨立預覽；建置不會包含這個預覽目錄。

上方展示右上角的 32px 圖示，下方以 64px 放大檢視。六個圖示共用 2.8 秒週期，依序錯開 0.38 秒；滑鼠移入、鍵盤聚焦或按下暫停時停止擺動。系統要求減少動態效果時顯示靜態圖示。

連結取自網站現有 `scripts/data/siteData.js`。圖示皆為本機 32×32 像素網格 SVG：Twitter 使用鳥形，BlueSky 使用蝴蝶，VGen 與 Clibo 依既有官方 SVG 製作像素版本（Clibo 取貓形 C 標誌），FB 使用 f，Email 使用信封。

共用元件：`scripts/social-wave.js`、`styles/social-wave.css`、`assets/social-icons/`。

標誌參考來源：

- VGen：https://vgen.co/img/logo-icon-black-outline.svg
- Clibo：https://clibo.tw/images/clibo-logo-v2.svg
- BlueSky、FB、Email：專案原有 `scripts/render/subNav.js` 的 SVG。

背景瀏覽器驗證：`tests/social-wave.cjs`。
