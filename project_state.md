# 專案狀態（v1.9.0 需求，2026-08-17）

## 位置
目錄 /home/ubuntu/flow-automation/（manifest.json, popup.html/css/js, flow-automation.js, background.js, README.md, USER_GUIDE_ZH-TW/EN/ZH-CN.md, voices.md, vendor/jszip.min.js, icons/）
打包：cd /home/ubuntu/flow-automation && rm -f /home/ubuntu/flow-automation.zip && zip -q -r /home/ubuntu/flow-automation.zip . -x "test_*.js" -x "test_*.txt" -x "test_*.csv" -x "test_notes.md" -x "browser_test.md" -x "project_state.md" -x "find_simp.py" -x "fix_trad.py" -x "scan_js_simp.py" -x "gen_icons.py" -x "*__pycache__*"
交付慣例：附 zip + 主要檔案；安裝=解壓→chrome://extensions→開發者模式→載入已解壓縮→點重新載入

## GitHub 上傳進度（2026-08-17）
- 用戶已授權（device code C6F4-D089 @ https://github.com/login/device），token 存 /home/ubuntu/gh_token.txt（Bearer，scope 空但可寫本倉庫）
- 倉庫 m45801ch/Auto-Flow-Free 存在且為空（size 0，default_branch=main，描述「Google Flow 自動化建立圖片影片」）
- 上傳腳本 /home/ubuntu/upload_repo.sh（git tree API 上傳 18 檔+初始 commit）；GitHub API 間歇 503，已加重試機制
- Release 待建：POST /repos/m45801ch/Auto-Flow-Free/releases {tag_name:v1.9.0, name, body, draft:false}，再上傳 flow-automation.zip asset（POST /releases/{id}/assets，header Authorization: Bearer ... + Content-Type: application/zip）
- 釋出後把 repo URL https://github.com/m45801ch/Auto-Flow-Free 與 Release 下載連結告知用戶

## v1.9.0 進度（2026-08-17）
- [完成] 調試日誌條數正確顯示（addDebugLine 排除 .debug-empty 計數，debugStatus 初始 "0 條"）
- [完成] 匯出日誌（debugExportClick → flow-automation-debug-*.txt，chrome.downloads + Blob fallback，toast debugExportDone）
- [完成] theme default "light"（loadSettings def + applyUIFromSettings fallback "light"）
- [完成] aspectChips → #aspectSelect 下拉；langChips+langSwitch → #langSelect 下拉（三字典加 repoLabel/debugExport/debugExportDone）
- [完成] openInTab → openRepo <a> href https://github.com/m45801ch/Auto-Flow-Free target=_blank；右上角刪除 langSwitch
- [完成] 改名 manifest.json name/default_title "Auto Flow Free" version 1.9.0；popup.html title 同步
- [完成] README.md v1.9.0 changelog + 功能表更新（明亮預設/下拉/語言整合/GitHub 按鈕）
- [完成] USER_GUIDE_ZH-TW.md 改名 + 更新（調試匯出/明亮預設/下拉/語言下拉）
- [待辦] USER_GUIDE_EN.md 與 USER_GUIDE_ZH-CN.md 同步改名更新（EN: "Auto Flow Free User Guide"、改名 Flow Automation→Auto Flow Free、light theme default、aspect/language dropdown、debug export、GitHub repo button）
- [待辦] 打包 v1.9.0 並交付
- [待辦] GitHub Release：需要用戶授權碼（用戶會提供，需請用戶提供 Personal Access Token；倉庫 m45801ch/Auto-Flow-Free）；用 `gh release create v1.9.0` 上傳 zip

## v1.9.0 用戶需求（8 項）
1. 調試日誌報告「顯示: %N% 條」改為顯示正確條目數（debugStatus %N% 未替換 BUG）
2. 調試日誌新增「匯出」功能（匯出 TXT）
3. 主題：明亮主題改為預設（theme default "light"，document 載入預設 light）
4. 寬高比：chip 改為下拉選單（select，16:9/9:16/1:1/3:4/4:3）
5. 語言 Language：改為下拉選單，與右上角語言切換整合為單一控制（刪其中一個）
6. 右上角按鈕（openInTab）：改為開啟用戶 GitHub 倉庫 https://github.com/m45801ch/Auto-Flow-Free（新分頁）
7. 擴充套件改名「Auto Flow Free」：manifest name/description、popup title/品牌、README 與三份說明檔開頭名稱
8. 上傳倉庫並建 Release——需用戶授權碼（用戶說「你用一個授權碼出來，我來授權給你」：我提供 gh auth OAuth 裝置碼流程或請用戶給 PAT；待用戶回應）
   - 用戶 GitHub：m45801ch / Auto-Flow-Free（public）

## 技術要點
- STORAGE_KEY="flowAutomationSettings"；settings.theme default "dark" → 改 "light"
- popup.js debugStatus="%N% 條"（三字典）；bindDebugUI 需查 addDebugLine 計數與 %N% 替換
- aspectChips：#aspectChips .chip data-value=16:9|9:16|1:1|3:4|4:3；hintAspect
- langChips：#langChips .chip data-value en|zh-TW|zh-CN；右上角有 langSwitch（top-right 語言切換）
- openInTab 按鈕 id="openInTab"，data-i18n=openInSidePanel
- manifest.json version 1.8.1 → 1.9.0；name "Flow Automation — Auto Veo" → "Auto Flow Free"

## v1.9.0 測試驗證（瀏覽器 file:// 測試通過）
- theme=light 預設、aspectSelect/langSelect/themeSelect 初始值正確、debugStatus "2 條"→"3 條" 正確、匯出無錯+toast、語言切換 en 後 applyI18n 生效（toast 變英文）、aspect/lang/theme 保存至 localStorage
- JS 語法檢查全部通過；測試記錄在 browser_test_v190.md

## v1.8.1 已交付狀態（前次）
- 保存/重置按鈕已實作（.save-actions，#btnSaveSettings/#btnResetDefaults，三語言 btnSaveSettings/btnResetDefaults/saveDone/resetDone）
- 彈窗持續偵測 BUG 已修（每 1 秒輪詢 active tab URL，正則 /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i）
- README changelog 表格式；popup.js 有 applyTheme()、applyUIFromSettings()、showNotFlowWarning()、bindDebugUI()

## v1.9.1 需求（2026-08-17）
1. 頂部新增顯示版本編號（如 "Auto Flow Free v1.9.1"，從 manifest.json 讀取或硬編碼版本）
2. 英文語言介面殘留中文字修正——全量掃描 popup.js 三字典：en 字典中有中文值、或 zh-TW/zh-CN 字典鍵缺少 en 對應（applyI18n 在 en 時 fallback 到其他語言？需檢查 i18n 結構）
   - 常見原因：i18n 字典用嵌套或鍵不存在時顯示原始 key 或 fallback 到其他語言字典；需確保每個鍵在三個字典都有值，en 字典所有值不能有中文
- 版本 bump：manifest.json 1.9.0→1.9.1，README changelog，三份 USER_GUIDE 同步
- 技能已建立：/home/ubuntu/skills/flow-extension-dev（打包腳本 /home/ubuntu/skills/flow-extension-dev/scripts/package_extension.sh）
- GitHub 上傳暫停（GitHub 503），待用戶重啟；token 舊已失效
- 打包指令：cd /home/ubuntu/flow-automation && node --check popup.js flow-automation.js background.js && rm -f /home/ubuntu/flow-automation.zip && zip -q -r /home/ubuntu/flow-automation.zip . -x "test_*" -x "project_state.md" -x "test_notes.md" -x "browser_test*.md" -x "find_simp.py" -x "fix_trad.py" -x "scan_js_simp.py" -x "gen_icons.py" -x "*__pycache__*"

## v1.9.1 修改計畫（完整掃描結果，2026-08-17）

### 需求
1. 頂部顯示版本號：popup.html topbar 加 <span id="versionBadge">，JS 在 DOMContentLoaded 注入 manifest 版本（硬編碼 "v1.9.1" 亦可，CSS .version-badge 置於 top-right GitHub 按鈕前，主題相容）
2. 英文界面中文字殘留修正（en 字典本身無中文值；殘留來自 HTML 硬編碼文字/屬性/options/placeholder/JS 硬編碼 toast）

### popup.html 需 i18n 化的硬編碼（加 data-i18n 或 data-i18n-title/data-i18n-placeholder）
- L28: openRepo title="GitHub 倉庫" → 需處理 title
- L89-93: concurrency options "N 個 prompt" → JS rebuildOptions 或 data-i18n 逐一（4個鍵 optConc1..4 或用 data-i18n on option）
- L94: hintConcurrent zh-TW 字典值為簡體「同时处理的 prompt 数量。」→ 修正字典
- L103: swapBtn title="交換"
- L128-130: frameOption options 3個
- L154: <span>Prompts</span> → data-i18n="labelPrompts"（新增鍵）
- L159: 上傳 .txt 檔案 → data-i18n="uploadTxt"
- L163: 上傳 .xlsx / .csv → data-i18n="uploadCsv"
- L174: btnClearNarration 文字+title
- L177-183: prompts placeholder 中文 → JS applyI18n 用 data-i18n-placeholder（i18n 需支援 placeholder）
- L206-207: charSelect options 無/沒有可用選項
- L213: 掃描角色 → data-i18n="btnScanChars"
- L318: 前往网站 → data-i18n="labelWatermarkSite"（HTML 已有該 key！L317 data-i18n="labelWatermarkSite" 但 span 內文字沒被更新——applyI18n 用 innerHTML 應會更新，但若 key 不存在 fallback→顯示原值。檢查 zh-TW 字典有 labelWatermarkSite？需確認並補三字典）
- L345-347: btnResume/btnExport/btnClearPreview 文字+title（簡體殘留）
- L354: exportHint "正在打包專案..." → data-i18n="exportStart"（字典已有）
- L361/365/369: bottom-btn titles
- L389-394: defaultModeSelect options 6個
- L409: model hint 簡體「選擇要使用的影片生成模型。」→ 字典鍵 hintModel 新增
- L423-427: aspectSelect options（簡體殘留 直式/橫式）
- L434-439: durationSelect options
- L446-447: imageModeSelect options
- L454-456: videoResSelect options
- L463-466: imageResSelect options
- L473-474: themeSelect options
- L480-482: langSelect options（en 時顯示英文）
- L492: openChromeDownloads title
- L527/531/535: debug-btn titles
- L541: debugStatus "0 條" → JS 用 t("debugStatus")

### popup.js 需修正
- applyI18n 需支援：[data-i18n-title]、[data-i18n-placeholder]、select option[data-i18n]、以及 rebuildOptions（concurrency/defaultMode/aspect/duration/imageMode/videoRes/imageRes/theme/lang 等 select options 需 rebuild）
- zh-TW 字典 L94 hintConcurrent 簡體 → 改繁中；zh-CN 對應也檢查
- 字典新增鍵：optConc(1-4)/optFrame(first/firstLast/all)/labelPrompts/uploadTxt/uploadCsv/btnClearNarration/btnScanChars/btnResume/btnExport/btnClearPreview/exportStart/hintModel/optDefaultMode(6)/optAspect(5)/optDuration(6)/optImageMode(2)/optVideoRes(3)/optImageRes(4)/optTheme(2)/optLang(3)/optCharNone/optCharUnavailable/debugTitle/statusPending/running/done/error/retrying/fileTooLarge/narrAppend
- JS 硬編碼 toast 修正：L645/845(正在執行中)→en已處理、L710(预览与断点已清除 zh-CN)→三語言、L847、L1045(目前僅支援 .csv 純文字格式)→en/zh-CN、L1069(旁白稿為空)→三語言、L1286(快取已清除)→三語言、L1295(已清除)→三語言、L1365(超过 50MB,已跳过 簡體)→三語言、L1425 statusLabel 三語言、L1589 "旁白："→三語言、L1790(复制失败 簡體)→三語言
- en 字典 labelLanguage "語言 Language" → "語言 Language" 或 "Language"（用戶要求語言下拉整合，改 "Language"）
- 版本號注入：DOMContentLoaded 中 document.getElementById("versionBadge").textContent = "Auto Flow Free v1.9.1"（從 manifest 硬編碼）
- 587 drag-handle title="拖曳調整順序"、928/961/1463 rebuildCharOptions "無"→已三語言 OK
- L961 "男/女"→en:Male/Female（已有 genderLabel 處理 OK）
- zh-CN 字典缺 labelWatermarkSite/btnSaveSettings 等？確認：zh-CN L259-382 需查

### 打包與交付
- 版本 bump manifest→1.9.1、README changelog、三份 USER_GUIDE 加 v1.9.1 說明
- 打包後更新 skill 腳本輸出無需改；上傳 GitHub 暫停（GitHub 503）待用戶
- 技能路徑：/home/ubuntu/skills/flow-extension-dev（打包腳本 package_extension.sh，上傳腳本 github_release_upload.py）

## 已完成編輯（2026-08-17 進行中）
popup.html：全部 32 處硬編碼 i18n 化完成（versionBadge v1.9.1、data-i18n-title、data-i18n-placeholder、options 全部加 data-i18n、labelWatermarkSite 文字已刪、prompts textarea 改 data-i18n-placeholder）
popup.css：加 .version-badge 樣式（var(--accent)/--card-border/--badge-bg fallback）
popup.js 三字典：全部新鍵已加入（zh-TW L79 加 labelWatermarkSite、zh-TW hintConcurrent 簡體已改繁中；en L216 labelLanguage 已改 "Language"；三字典均含 optLangTw/Cn/En、repoTitle、swapTitle、labelPrompts、uploadTxt/uploadCsv、narrClearTitle、promptsPlaceholder、btnScanChars、optCharNone/optCharUnavailable、optConc1-4、optFrameFirst/FirstLast/All、optMaxImages1-10、optDefaultMode1-6、hintModel、optAspect5個、optDuration6個、optImageModeNew/Last、optVideoRes3個、optImageRes4個、chromeDownloadsTitle、debugCopyTitle/ClearTitle/ExportTitle、reportTitle、clearCacheTitle、clearTitle、resumeTitle、exportTitle、clearPreviewTitle、exportStart、btnSaveSettings）

## v1.9.1 測試進度（2026-08-17 16:05）
- 版本徽章 v1.9.1 顯示正常（topbar）；theme 預設 light；check_keys.py 三語言齊全（zh-TW 228/en 226/zh-CN 226）
- 英文界面瀏覽器實測：options/titles/placeholders 全部無中文殘留；僅剩「佇列是空的」4 個中文字——是 queueEmpty（控制頁籤）殘留？不，英文模式下應顯示「Queue is empty」——待查 t("queueEmpty") 在 en 字典的值
- JS 語法檢查全通過（JS_OK/ALL_OK）
- tab 按鈕 id：control/settings/debug

## GitHub 推送狀態（2026-08-18）
- GitHub 已恢復正常（All Systems Operational，HTTP 200）
- 前 4 次 device auth token scope 皆為空（403 無法寫入）；用戶手機 GitHub App 雙重認證不自動授予 repo 權限
- 等待用戶提供 Fine-grained PAT（https://github.com/settings/tokens?type=beta → Contents: Read and write on Auto-Flow-Free）
- 收到 token 後：存 /home/ubuntu/gh_token.txt → git init 本地 repo → 推送全部 18 檔 → API 建立 v1.9.1 Release 附 zip

## v1.9.1 瀏覽器測試完成（2026-08-17 16:05）
- 版本徽章 v1.9.1 正常；theme 預設 light；aspectSelect=9:16
- 英文模式三頁籤全掃描 CJK=0（含 options/titles/placeholders/body）✅
- 先前「佇列是空的」殘留已證實為舊頁面快取，重載後英文版 queueEmpty 正確顯示「Queue is empty...」✅
- 保存/重置按鈕英文：Save settings / Reset defaults ✅
- 剩餘待辦：manifest 改 1.9.1 → README 加 v1.9.1 changelog → 三份 USER_GUIDE 同步（版本號與日誌匯出/版本徽章/主題預設/寬高比下拉/語言下拉/GitHub 按鈕）→ 打包 → 交付

## 字典覆蓋檢查結果（check_keys.py）
- zh-TW 缺 55 鍵已全部補齊（labelPrompts/uploadTxt/uploadCsv/narrClearTitle/promptsPlaceholder/btnScanChars/optCharNone/optCharUnavailable/optConc1-4/optFrameFirst/FirstLast/All/optMaxImages1-10/optDefaultMode1-6/hintModel/optAspect5個/optDuration6個/optImageMode2個/optVideoRes3個/optImageRes4個/optThemeDark/Light/optLangTw/Cn/En/chromeDownloadsTitle/debug3 titles/reportTitle/clearCacheTitle/clearTitle/resumeTitle/clearPreviewTitle/btnSaveSettings/btnResetDefaults/saveDone/resetDone/repoTitle/swapTitle）
- en 缺 btnResume/hintAspect/labelWatermarkSite；zh-CN 缺 btnResume/hintAspect（待補）
- en optLangTw/Cn 已改 Traditional Chinese/Simplified Chinese（optLangTw L267）
- 剩餘待辦：補 en/zh-CN btnResume/hintAspect/labelWatermarkSite(en)；版本號注入已靜態完成（HTML versionBadge v1.9.1，manifest 1.9.0 待改 1.9.1）；README 加 v1.9.1 changelog；三份 USER_GUIDE 同步版本；打包交付

## 補充完成（2026-08-17）
- applyI18n 已擴充支援 [data-i18n-title]/[data-i18n-placeholder]/option[data-i18n]
- 所有 JS 硬編碼 toast/status 已改 t() 鍵（toastPreviewCleared/toastCsvOnly/toastNarrEmpty/toastCacheCleared/toastCleared/toastFileSkip/statusPending-5/scanNone/scanFound/narrLabel/toastScanFail/toastStartFail/toastCopyFail/dragHandleTitle）
- exportProject metadata 改 tool:"Auto Flow Free" version:"1.9.1"
- applyTheme 改 light 預設邏輯（settings.theme==="dark" 才 dark）；themeSel.value fallback "light"
- charSelect 重建三語言（无/無/None、没有可用选项/沒有可用選項/No available options）
- zh-CN hintConcurrent 改簡體；三字典 toast 鍵全部就位
- zh-CN 補 labelWatermarkSite "前往网站"

## 尚待完成（popup.js）
1. applyI18n 函式（約 L1030-1050 現行）擴充：處理 [data-i18n-title]、[data-i18n-placeholder]、option[data-i18n] 文字（注意 select 重建不要丟 value/selected）
（全部已完成，詳上方「補充完成」區）
6. applyUIFromSettings 中 select 的值綁定不受 i18n 影響（value 不變）OK
7. 語法檢查、瀏覽器測試（file:// 切換三語言驗證無中文殘留、明亮/暗黑主題版本徽章）
8. manifest.json 版本改 1.9.1（name 已是 Auto Flow Free）
9. README.md 加 v1.9.1 changelog；三份 USER_GUIDE 同步更新頂部版本號與新功能（版本號顯示、英文界面修正）
10. 打包：zip 指令在 project_state.md 上方已記錄
11. GitHub 上傳暫停（GitHub 503 故障），待用戶指示
12. 技能：/home/ubuntu/skills/flow-extension-dev（無需更新）

## 注意事項
- 用戶已要求：上傳 GitHub 暫停；後續交付不再提上傳倉庫
- 用戶語言：繁體中文；交付格式慣例：result 附 zip + 主要檔案
