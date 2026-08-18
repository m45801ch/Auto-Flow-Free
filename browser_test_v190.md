# v1.9.0 瀏覽器測試記錄（2026-08-17）

## 測試項目與結果
1. **明亮主題預設**：清 localStorage 重新載入後 `dataset.theme=light`、themeSelect 初始值 "light" —— PASS
2. **寬高比改下拉**：aspectChips 已移除，#aspectSelect 存在，初始 "16:9"，切換 "9:16" 後 localStorage 保存 aspect=9:16 —— PASS
3. **語言下拉整合**：langSwitch/langChips 已移除，#langSelect 整合；切換 en 後 applyI18n 生效（匯出提示變英文 "Log exported as..."）—— PASS
4. **GitHub 按鈕**：右上角 openRepo <a> href=https://github.com/m45801ch/Auto-Flow-Free target=_blank —— PASS
5. **日誌條數**：addDebugLine 3 條後 debugStatus 正確顯示 "2 條"→"3 條"（排除 .debug-empty）—— PASS
6. **匯出日誌**：debugExport.onclick 無錯誤，toast 顯示檔名，Blob 下載邏輯含 chrome.downloads fallback —— PASS
7. **改名**：title "Auto Flow Free"、manifest name/default_title "Auto Flow Free" version 1.9.0 —— PASS
8. **語法檢查**：popup.js / flow-automation.js / background.js 全部 node --check 通過 —— PASS

## 視覺確認（截圖）
- 調試頁籤：明亮主題（白色底/粉紅邊框/粉紅按鈕），條數 "3 條" 正確，匯出按鈕有下拉箭頭圖示，右上角 GitHub 按鈕
- 設定頁籤：themeSelect 明亮預設、aspectSelect、langSelect 三下拉皆正常渲染
