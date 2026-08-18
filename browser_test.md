# v1.7.1 開發與測試記錄（2026-08-17）

## v1.7.1 新增需求（用戶三張圖）
1. 設置頁籤加「下載設置」區塊：文字「视频将下载到Chrome的下载文件夹。每个项目将有自己的文件夹来存储视频。」+ 齒輪按鈕開啟 chrome://settings/downloads。設置頁籤底部加「设置会自动在所有浏览器标签页中同步。」提示。
2. 打開擴充時以瀏覽器分割畫面（side panel，右側、寬度可拖曳調整），不要彈出獨立視窗。
3. 設置右邊新增「調試日誌報告」頁籤：0 條/自動滾動開關/複製/清除，空狀態「暫無日誌。開始自動化後，活動將顯示在此處。」

## 實作完成
- popup.html：tabs 加 data-tab="debug"（i18n tabDebug）；#panel-debug 新 main（debug-header/自動滾動 switch debugAutoScroll、debugCopy、debugClear、debug-status %N% 條、debug-log#debugLog、debug-empty）。設置頁籤加 download-card（labelDownloadSettings + 齒輪 #openChromeDownloads）與 sync-note（hintSettingsSync）。
- popup.css：.download-card/.download-label/.download-gear/.download-hint/.sync-note/.debug-header/.debug-actions/.debug-autoscroll/.debug-btn/.debug-status/.debug-log/.debug-line(.error/.info)/.debug-empty。
- popup.js：i18n 三字典加 tabDebug/labelDownloadSettings/hintDownloadSettings/hintSettingsSync/debugTitle/debugAutoScroll/debugCopy/debugClear/debugStatus(%N% 條)/debugEmpty/debugCopied/openInSidePanel/sidePanelUnsupported。openInTab 改為先 chrome.sidePanel.open({tabId}) 失敗才 chrome.tabs.create fallback。dlGear 齒輪開 chrome://settings/downloads。bindDebugUI()：自動滾動/複製（clipboard+execCommand fallback）/清除。addDebugLine() 加時間戳、最多 2000 行、自動滾動。onMessage 加 DEBUG_LOG（text/level）。startBatch 已 bindDebugUI()。
- flow-automation.js：log() 加 reportDebugLog(...,"info")；新增 logError()；reportDebugLog() 發 DEBUG_LOG；processOneWithRetry 失敗與 runBatch error 處改 logError。
- manifest.json 版本 1.7.1。語法檢查 popup.js + flow-automation.js 通過。

## 瀏覽器測試狀態
- 已載入 v=11：三個頁籤（控制/設置/調試日誌報告）渲染正常。
- 待測：設置頁籤下載設置區塊+同步提示、調試頁籤（複製/清除/自動滾動）、語言切換對新 key、warn 卡正常。

## v1.7.1 清除按鈕疑難排解（重要）

- init 完整執行（debugAutoScroll change listener 有註冊，切換正常）
- debugCopy 的 async click handler 內 `await navigator.clipboard.writeText` 在 file:// 環境拋錯 "Document is not focused"（已被 catch fallback 到 execCommand）
- 現象：bindDebugUI 內 init 的 debugClear click handler 於 btn.click() 不生效（無 console 錯誤，事件 capture 階段正常到達），但手動再呼叫 bindDebugUI() 後立刻生效（兩 handler 都跑）
- 假設：debugCopy async handler 未處理完時（clipboard hang）與 debugClear 的 click 同時在事件迴圈中…但 debugCopy 未被點擊。更可能：async listener 在 addEventListener 順序中的影響不存在（listener 是獨立的）
- 待試解法：將 debugClear/copy 改為 onclick attribute（HTML 上 data-handler）或把 addEventListener 換成 btn.onclick = fn，避開此怪異行為
- 已確認 HTML/CSS/i18n/其他功能皆正常；僅此按鈕在 sandbox 瀏覽器 file:// 測試有異，Chrome 擴充環境可能無此問題

## v1.7.1 測試最終結果（reload7）

**根因修復**：init() 首次執行時 bindUI 中 `document.getElementById("downloadRes")` 回傳 null（該 select 已被 v1.7 的 videoResSelect/imageResSelect 取代而移除於 HTML），直接 `.value =` 拋錯 `Cannot set properties of null`，導致 bindUI 中段整段跳過——包括 tab 切換、設置下拉綁定、bindDebugUI、warn 卡顯示。修復：modelSelect 與 downloadRes 加 if 保護。

測試通過項目：三個頁籤（控制/設置/調試日誌報告）切換正常；warn 卡在 file:// 下顯示「不在 Flow 專案頁面」且三語言切換正確（繁中/簡中/EN 循環 繁中→簡中→EN）；設置頁籤六個新下拉全部存在且選項數正確（defaultMode=6、imageModel=3、imageMode=2、videoRes=3、imageRes=4、duration=6）；下載設置區塊含齒輪（id=openChromeDownloads，title=開啟 Chrome 下載設定）與同步提示；調試日誌 clear/copy/auto-scroll toggle 全部正常（debugCopy 在 file:// 有 fallback 提示）。

## v1.7.2 待辦（用戶回報 side panel 未生效）

用戶實測：「新分頁開啟」仍彈出視窗/覆蓋，未出現右側分割畫面。

**已做修正**：openInTab handler 改為先 `chrome.sidePanel.setOptions({path:"popup.html", enabled:true})` 再 `chrome.sidePanel.open({tabId})`（pin 到當前 active tab）。

**關鍵知識**：
- MV3 中 manifest 已有 `"side_panel":{"default_path":"popup.html"}` + permissions 含 sidePanel
- `chrome.sidePanel.open({tabId})` 需搭配 activeTab 或 host_permissions；已含 activeTab + labs.google host
- **重要**：用戶可能未重新載入擴充（chrome://extensions 重新載入 v1.7.1 後 sidePanel 才註冊）。v1.7.0/1.7.1 時 chrome.sidePanel.open 也可能正常但用戶看到 popup 預設開啟的 default_popup（點擊擴充圖示本身就是 popup 覆蓋！）
- 用戶說「它還是覆蓋在視窗」——很可能是指點擊擴充圖示開的 popup。side panel 是另一機制：點擊 topbar 按鈕或擴充圖示 → side panel。
- 若要「點擊擴充圖示即開 side panel」需設定 chrome.sidePanel.setPanelBehavior? 不行；預設點擊 action 開 default_popup。side panel 可透過 chrome.sidePanel.onClicked? 需加 background service worker 呼叫 open。
- 可考慮：加 service_worker（background.js）監聽 action click → chrome.sidePanel.open()，並可移除 default_popup 讓圖示直接開 side panel（但會失去 popup UI；保留兩者：action click 開 side panel，side panel 內有相同 UI）。
- 瀏覽器測試 file:// 無法驗證 chrome.sidePanel（chrome undefined）→ 需打包後請用戶測試或模擬 chrome API。

**文件結構**：/home/ubuntu/flow-automation/（manifest.json, popup.html/css/js, flow-automation.js, voices.md, vendor/jszip.min.js, icons/）；打包：zip -r /home/ubuntu/flow-automation.zip . -x "test_*" -x "test_notes.md" -x "browser_test.md" -x "project_state.md"
**交付慣例**：附 zip + 主要檔案；說明安裝=解壓→chrome://extensions→開發者模式→載入已解壓縮

## sidePanel API 官方結論（developer.chrome.com）

1. `sidePanel.open()` 需要 Chrome 116+，且必須在「用戶手勢」後呼叫（action click、按鈕點擊皆可）。open({tabId}) 只在該 tab 打開 tab-specific panel。
2. **關鍵**：當擴充有 `default_popup`（action 上有 default_popup），點擊工具列圖示會打開 popup（覆蓋視窗），而非 side panel。這是用戶看到「覆蓋視窗」的原因。
3. 若要「點擊圖示就開 side panel」：在 background service worker 呼叫 `chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})`，並且**不能**設定 action.default_popup（否則 popup 優先）。
4. setOptions({path, enabled}) 對預設全域 panel 不需要；manifest 已有 default_path 即全域啟用。
5. 策略決定：移除 action.default_popup → 圖示點擊直接開 side panel；topbar「新分頁開啟」按鈕用 sidePanel.open({tabId})。兩者皆為分割畫面。風險：popup 內一些 popup 專屬邏輯（如 chrome.tabs.query 在 file://）需相容——side panel 頁與 popup 頁同檔，需測試。

## v1.7.2 測試結果（全部通過）

side panel 修正核心：移除 action.default_popup（原 popup 存在時 Chrome 強制以覆蓋視窗打開 popup，setPanelBehavior 無法生效），新增 background.js service worker 呼叫 setPanelBehavior({openPanelOnActionClick:true})（onInstalled + onStartup），topbar 按鈕 handler 先 setOptions 再 open({tabId})。

模擬測試：topbar 按鈕點擊→ sidePanel.open({tabId:42}) 正確觸發、setOptions 被呼叫一次；warn 卡在 Flow 專案 URL 下隱藏、非 Flow URL 顯示；三頁籤切換正常；UI 在 file:// 下完整渲染。

注意：file:// 環境無法實測真實 side panel（需 Chrome 安裝擴充），用戶需重新載入擴充後在工具列點擊圖示即開右側分割面板。

## v1.7.2 完成狀態摘要（交付前）

版本 1.7.2，修正「新分頁開啟」為真正的 side panel 分割畫面。核心改動：manifest.json 移除 action.default_popup（保留 default_icon/default_title，version 1.7.2，加 background.service_worker="background.js"）；新增 background.js（onInstalled/onStartup 呼叫 chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})）；popup.js 的 openInTab handler 先 setOptions({path:"popup.html",enabled:true}) 再 open({tabId:activeTab})。README 已加 v1.7.2 紀錄。剩餘：打包 zip 並交付。打包指令：cd /home/ubuntu/flow-automation && zip -r /home/ubuntu/flow-automation.zip . -x "test_*.js" -x "test_*.txt" -x "test_*.csv" -x "test_notes.md" -x "browser_test.md" -x "project_state.md"。交付：附 zip + popup.js + popup.html + popup.css + flow-automation.js + manifest.json + background.js + README.md。

## v1.7.3 需求（用戶回報）

1. **非 Flow 提示改為強制彈出訊息框**：不在 Flow 專案頁面時彈出訊息框（modal）提示「不在 Flow 專案頁面 / Flow 自動化工具僅在 Flow 專案頁面上可用」，含「前往 Flow」按鈕；加半透明遮罩鎖定，無法手動關閉、背景無法操作；切回 Flow 頁面後自動消失、功能恢復。不用三角形驚嘆號警告卡。
   - 實作方向：保留 notFlowWarning 卡結構改造成 overlay modal（.warn-overlay 固定定位 full viewport、z-index 最高、click/esc 不關閉），showNotFlowWarning 切換 class；並在 side panel 情境下對 chrome.tabs 變化監聽——side panel 頁面可加 setInterval/tab.onActivated？popup.js 可加 chrome.tabs.onUpdated/onActivated listener（side panel 頁有 chrome API）檢查 active tab 是否為 flow project。
2. **繁體中文界面簡體字殘留全面修正**：已知如「上传 .txt 文件」「上传 .xlsx / .csv」「匯入旁白稿」「示例：第一个长 prompt。可以跨越多行。第二个 prompt 在空行后开始。第三个 prompt。」「用空行分隔每個 prompt。」「無」「掃描角色」。需掃描 popup.html + popup.js 三字典 + flow-automation.js toast 的 zh-TW 字典全部簡體字。
   - 注意：zh-CN 與 en 字典應保留簡體；只改 zh-TW 與 HTML 靜態文字。
3. 測試後打包 v1.7.3。版本在 manifest.json "version"。README 已加 changelog 表（v1.7.2 段前插入 v1.7.3）。打包：cd /home/ubuntu/flow-automation && rm -f /home/ubuntu/flow-automation.zip && zip -r /home/ubuntu/flow-automation.zip . -x "test_*.js" -x "test_*.txt" -x "test_*.csv" -x "test_notes.md" -x "browser_test.md" -x "project_state.md"
4. 文件：manifest.json（含 background.js service worker，無 default_popup），popup.html/css/js，flow-automation.js，voices.md，vendor/jszip.min.js，icons/，gen_icons.py
5. 交付慣例：zip + 主要檔案；安裝=解壓→chrome://extensions→開發者模式→載入已解壓縮→點重新載入

## v1.7.3 掃描結果（重要，勿失）

掃描腳本 /home/ubuntu/flow-automation/find_simp.py（SIMP 集判簡體）結果分析：

**誤報（實際是繁體且正確，不必改）**：zhTW 字典大量「片/下/面/日/重/打/除/存/列/模/像/高/音/量/制/隔/超/下/需/境/開/打」等是繁簡通用字。真問題分類：

### A. popup.html 靜態文字（需改繁體，或用 data-i18n）
- L112: 点击上传或拖拽（data-i18n=uploadTitle，值已是繁「點擊上傳或拖曳」？需查）
- L87-90: `1/2/3/4 个 prompt` option → `1 個 prompt`…
- L126-128: 每个 prompt 仅使用开始帧 / 使用首尾帧 / 使用全部帧 → 每個…僅使用開始幀/使用首尾幀/使用全部幀（data-i18n? 查）
- L139: hintChain 值簡體（data-i18n 已設 key，JS 值需改繁）
- L157: `上传 .txt 文件`、L161: `上传 .xlsx / .csv`（icon-label 內文字，需 data-i18n 或直接改「上傳 .txt 檔案」）
- L175-181: textarea placeholder 簡體「示例：\n第一个长 prompt。\n可以跨越多行。\n\n第二个 prompt 在空行后开始。\n\n第三个 prompt。」→ 改繁體：「示例：\n第一個長 prompt。\n可以橫跨多行。\n\n第二個 prompt 在空行後開始。\n\n第三個 prompt。」
- L182: hintPrompts 值簡體「用空行分隔每个 prompt。」→ 繁
- L215: hintCharScan 值簡體「尚未扫描任何角色。请在 Google Flow 中打开一个项目，然后点击「扫描角色」按钮。」
- L244/281: labelMaxImages/labelOutputs 值簡體
- L268: hintCharImages 值簡體
- L294/297/305/313/331/348/394/407/427/456/487/489: 對應 data-i18n 值簡體（labelFolder=labelFolder「保存到文件夹」、hintFolder「下载文件的子文件夹。」、hintSettingsMore、hintRename、hintWatermark、queueEmpty「队列是空的。添加 Prompts 并点击「运行」。」、previewHint、hintDefaultMode「创建新视频时的默认模式。」、「选择要使用的视频生成模型。」、hintAspect「视频帧比例（16:9 或 9:16）。」、hintVideoRes「选择自动下载的视频质量。」、hintDownloadSettings、hintSettingsSync「设置会自动在所有浏览器标签页中同步。」）
- notFlowWarning 卡 HTML 簡體（L42-46 附近）：「不在 Flow 项目页面 / Flow 自动化工具仅在 Flow 项目页面上可用。」→ 改繁 + 改造成強制 modal
- ATTR: btnClearNarration title「移除已导入的旁白稿」、exportProject title「一键导出整条连锁专案」、btnClearPreview title「清除预览」、btnReport「报告错误」、btnClearCache「清除缓存」、openChromeDownloads title「开启 Chrome 下载设定」（L487 附近）、debugCopy「複製日誌」、debugClear「清除日誌」
- 設置 tab 文字「設置」→「設定」（L~53）、「調試日誌報告」已是繁

### B. popup.js zhTW 字典需改為繁體的 key（值確認）
hintChain、hintPrompts、hintCharScan、labelMaxImages、hintMaxImages、toggleCharImages、hintCharImages、labelOutputs、hintOutputs、labelFolder、hintFolder、hintSettingsMore、queueEmpty、previewHint、hintDefaultMode、hintModel（「选择要使用的视频生成模型」）、hintAspect、hintVideoRes、hintDownloadSettings、hintSettingsSync、uploadTitle（若還是簡）、uploadHint、toggleNarration?、hintConcurrent、hintRandomWait、labelFrameOption、hintImageMode、hintImageModel、labelDefaultMode、notFlowPage/notFlowHint、tabDebug、labelDownloadSettings、debugEmpty

注意：部分 key 的值在 v1.6 已中文化為繁體，掃描中的「片/下/面」是誤報；真正簡體特徵字：个/为/会/传/价/仪/亿/仅/伪/俩/伫/侦/侧/儿/兑/党/兰/关/兴/册/军/冯/冲/决/凉/减/凤/刘/则/创/剂/劳/医/华/协/卖/卢/厅/历/压/县/发/变/叶/号/吓/园/团/图/圣/场/坚/坛/坝/坟/坏/块/视/频/图/像/标/签/队/列/项/目/设/置/存/储/下/载/打/开/质/时/模/式/环/复/滚/志/帧/转/页/对/说/词/话/语/读/计/让/认/记/许/论/讲/调/谢/谣/谭/谗/让/识/该/详/试/询/评/诊/诂/诃/诅/诌/诙/诜/诟/诠/诡/诣/诤/诧/诨/诫/讹/诰/诱/诳/诽/谤/谀/谄/谂/谌/谏/谔/谓/谝/谞/谟/谠/谡/谦/谧/谨/谩/谪/谬/谭/谮/谯/谰/谱/谲/谳/谴/谵/谶/贝/贞/负/贡/财/责/贤/败/账/货/质/贩/贪/贫/贬/购/贮/贯/贰/贱/贲/贳/贴/贵/贶/贷/贸/费/贺/贻/贼/贽/贾/贿/赀/赁/赂/赃/资/赈/赉/赋/赌/赍/赎/赏/赐/赑/赒/赓/赔/赕/赖/赗/赘/赙/赚/赛/赜/赝/赞/赟/赠/赡/赢/赣/赤/赧/赫/赭/走/赳/赴/赵/赶/起/趁/趄/超/越/趋/趱/足/跄/践/跋/跌/跎/跚/跑/跖/跗/距/跞/跟/跣/跤/跨/跪/跬/路/跱/跳/践/跶/跷/跸/跹/跺/跻/跽/踅/踉/踊/踌/踏/踣/踮/踯/踱/踵/踶/踹/踺/蹀/踹/踵/踽/蹀/蹁/蹂/蹃/蹉/蹊/蹐/蹑/蹒/蹙/蹚/蹜/蹢/蹦/蹩/蹬/蹭/蹯/蹰/蹲/蹴/蹶/蹼/蹿/躁/躅/躇/躏/躜/躞/身/躬/躯/躲/躺/车/轧/轨/轩/轪/轫/转/轭/轮/软/轰/轱/轲/轳/轴/轵/轶/轷/轸/轹/轺/轼/轾/辂/辁/辊/辍/辎/辏/辐/辑/辒/输/辔/辕/辖/辗/辘/辙/辚/辰/辱/边/辽/达/辿/迁/迂/迄/迅/过/迈/迎/运/近/迓/返/迕/还/这/进/远/违/连/迟/迢/迤/迥/迦/迨/迩/迪/迫/迭/迮/述/迳/迷/迸/迹/迺/追/退/送/适/逃/逄/逅/逆/遄/遒/逖/逊/通/逛/透/逞/速/造/逡/逢/逦/逭/逮/逯/逴/逵/逸/逻/逼/逾/遁/遂/遖/遘/遛/遢/遗/遥/遨/遭/遮/遴/遵/遹/邂/遽/遼/避/邀/邃/邨/邋/邑/邓/邝/邙/邛/邠/邡/邢/那/邦/邨/邪/邬/邮/邯/邰/邱/邲/邳/邴/邵/邶/邸/邹/邺/邻/邽/邾/邿/郁/郄/郅/郇/郊/郋/郎/郏/郐/郑/郓/郔/郕/郖/郗/郘/郙/郚/郜/郝/郞/郟/郠/郡/郢/郣/郤/郥/郦/郧/部/郪/郫/郭/郯/郰/郴/郸/都/郾/郿/鄀/鄂/鄃/鄄/鄅/鄌/鄑/鄗/鄘/鄙/鄚/鄜/鄞/鄠/鄢/鄣/鄫/鄯/鄱/鄹/酃/酆/酉/酊/酋/酌/配/酎/酏/酐/酗/酚/酝/酞/酡/酢/酣/酤/酥/酦/酩/酪/酬/酮/酯/酰/酱/酽/酾/酿/醅/醇/醋/醉/醌/醍/醑/醢/醣/醪/医/酱/醭/醮/醯/醴/醵/醺/释/釆/采/釉/释/里/重/野/量/釐/金/釜/鉴/銎/銮/鋆/鋈/錾/鍪/鎏/鏊/鏖/鐾/鑫/钆/钇/针/钉/钊/钋/钌/钍/钎/钏/钐/钒/钓/钔/钕/钖/钗/钘/钙/钚/钛/钜/钝/钞/钟/钠/钡/钢/钣/钤/钥/钦/钧/钨/钩/钪/钫/钬/钭/钮/钯/钰/钱/钲/钳/钴/钵/钷/钹/钺/钻/钼/钽/钾/钿/铀/铁/铂/铃/铄/铅/铆/铈/铉/铊/铋/铌/铍/铎/铏/铐/铑/铒/铕/铖/铗/铘/铙/铚/铛/铜/铝/铞/铟/铠/铡/铢/铣/铤/铥/铧/铨/铩/铪/铫/铬/铭/铯/铰/铱/铲/铳/铴/铵/银/铷/铸/铹/铺/铻/铼/铽/链/铿/销/锁/锂/锃/锄/锅/锆/锇/锈/锉/锊/锋/锌/锍/锎/锏/锐/锑/锒/锓/锔/锕/锖/锗/锘/错/锚/锛/锜/锝/锞/锟/锡/锢/锣/锤/锥/锦/锧/锨/锩/锪/锫/锬/锭/键/锯/锰/锱/锲/锴/锵/锶/锷/锸/锹/锺/锻/锼/锽/锾/锿/镀/镁/镂/镃/镄/镅/镆/镇/镈/镉/镊/镋/镌/镍/镎/镏/镐/镑/镒/镓/镔/镕/镖/镗/镘/镚/镛/镜/镝/镞/镟/镠/镡/镢/镣/镤/镥/镦/镧/镨/镩/镪/镫/镬/镭/镮/镯/镰/镱/镲/镳/镴/镵/镶/长/门/闩/闪/闫/闭/问/闯/闰/闱/闲/闳/间/闵/闶/闷/闸/闹/闺/闻/闼/闽/闾/闿/阀/阁/阂/阃/阄/阅/阆/阇/阈/阉/阊/阋/阌/阍/阎/阏/阐/阑/阒/阔/阕/阖/阗/阘/阙/阚/阜/队/阡/阪/阮/阱/防/阳/阴/阵/阶/阻/阼/阽/阿/陀/陂/附/际/陆/陇/陈/陉/陋/陌/降/陎/限/陑/陔/陕/陛/陞/陟/陡/院/除/陧/陨/险/陪/陬/陲/陴/陵/陶/陷/隃/隅/隆/隈/隋/隍/随/隐/隔/隗/隘/隙/障/隧/隩/隰/隳/隶/隹/隼/隽/难/雀/雁/雄/雅/集/雇/雉/雊/雌/雍/雎/雏/雒/雕/雠/雨/雩/雪/雯/雱/雳/零/雷/雹/雾/需/霁/霄/霅/霆/震/霈/霉/霍/霎/霏/霓/霖/霜/霞/霨/霪/霭/霰/露/霸/霹/霾/青/靓/靖/静/靛/非/靠/靡/面/靥/革/靬/靰/靳/靴/靶/靸/靺/靼/鞁/鞅/鞋/鞍/鞑/鞒/鞔/鞘/鞠/鞡/鞣/鞧/鞨/鞫/鞬/鞭/鞯/鞲/鞴/鞶/鞸/鞹/鞺/鞼/鞾/鞿/韂/韦/韧/韩/韦/韨/韪/韬/韭/音/韵/韶/页/顶/顷/顸/项/顺/须/顼/顽/顾/顿/颀/颁/颂/颃/预/颅/领/颇/颈/颉/颊/颋/颌/颍/颎/颏/颐/频/颓/颔/颖/颗/题/颙/颚/颛/颜/额/颞/颟/颠/颡/颢/颤/颥/颦/颧/风/飏/飐/飑/飒/飓/飔/飕/飗/飘/飙/飞/食/飧/飨/餍/餐/饔/饥/饧/饨/饩/饪/饫/饬/饭/饮/饯/饰/饱/饲/饳/饴/饵/饶/饷/饸/饹/饺/饻/饼/饽/饿/馁/馃/馄/馅/馆/馇/馈/馉/馊/馋/馌/馍/馏/馐/馑/馒/馓/馔/馕/首/馗/馘/香/馝/馞/馥/馧/馨/马/驭/驮/驯/驰/驱/驲/驳/驴/驵/驶/驷/驸/驹/驺/驻/驼/驽/驾/驿/骀/骁/骂/骃/骄/骅/骆/骇/骈/骉/骊/骋/验/骍/骎/骐/骑/骒/骓/骕/骖/骗/骘/骙/骚/骛/骜/骝/骞/骟/骠/骡/骢/骣/骤/骥/骦/骧/骨/骰/骱/骶/骷/骸/骺/骼/髁/髀/髅/髂/髃/髓/高/髡/髦/髫/髭/髯/髹/髻/髽/鬃/鬈/鬏/鬒/鬓/鬘/鬟/鬣/鬯/鬲/鬶/鬷/鬻/鬼/魁/魂/魃/魄/魅/魆/魇/魈/魉/魋/魍/魏/魑/魔/鱼/鱿/鲀/鲁/鲂/鲃/鲅/鲆/鲇/鲈/鲉/鲊/鲋/鲌/鲍/鲎/鲏/鲐/鲑/鲒/鲔/鲕/鲖/鲗/鲘/鲙/鲚/鲛/鲜/鲝/鲞/鲟/鲠/鲡/鲢/鲣/鲤/鲥/鲦/鲧/鲨/鲩/鲪/鲫/鲬/鲭/鲮/鲯/鲰/鲱/鲲/鲳/鲴/鲵/鲷/鲸/鲹/鲺/鲻/鲼/鲽/鲾/鲿/鳀/鳁/鳂/鳃/鳄/鳅/鳆/鳇/鳈/鳉/鳊/鳌/鳍/鳎/鳏/鳐/鳑/鳒/鳓/鳔/鳕/鳖/鳗/鳘/鳙/鳚/鳛/鳜/鳝/鳞/鳟/鳠/鳡/鳢/鳣/鳤/鸟/鸠/鸡/鸢/鸣/鸤/鸥/鸦/鸧/鸨/鸩/鸪/鸫/鸬/鸭/鸮/鸯/鸰/鸱/鸲/鸳/鸵/鸶/鸷/鸸/鸹/鸺/鸻/鸼/鸽/鸾/鸿/鹀/鹁/鹂/鹃/鹄/鹅/鹆/鹇/鹈/鹉/鹊/鹋/鹌/鹍/鹎/鹏/鹐/鹑/鹒/鹔/鹕/鹖/鹗/鹘/鹙/鹚/鹛/鹜/鹝/鹞/鹟/鹠/鹡/鹢/鹣/鹤/鹦/鹧/鹨/鹩/鹪/鹫/鹬/鹭/鹮/鹯/鹰/鹱/鹲/鹳/鹴/鹾/鹿/麀/麂/麇/麈/麋/麑/麒/麓/麖/麝/麟/麦/麸/麹/麻/麽/麾/黄/黇/黉/黎/黏/黑/黔/默/黛/黜/黝/黠/黟/黢/黥/黧/黩/黪/黯/黹/黻/黼/黾/鼋/鼍/鼎/鼐/鼒/鼓/鼗/鼙/鼠/鼢/鼬/鼯/鼱/鼷/鼹/鼻/鼽/鼾/齁/齇/齉/齐/齑/齿/龀/龁/龂/龃/龄/龅/龆/龇/龈/龉/龊/龋/龌/龙/龚/龛/龟/龠/龢/鿎/鿏/鿐/鿑/鿒/鿓/鿔

### C. modal 實作（v1.7.3 需求 1）
notFlowWarning 卡改造成強制 modal overlay（full viewport 半透明遮罩 + 置中訊息框，含「前往 Flow」按鈕；不可手動關閉：遮罩點擊無效、無 X 按鈕）。showNotFlowWarning 在 side panel 環境（chrome API 可用）加 listener：chrome.tabs.onUpdated/onActivated 每 N 秒輪詢當前 active tab URL；Flow project → 隱藏 modal；非 Flow → 顯示 modal 並禁用交互（在 body 加 modal-open 樣式 pointer-events:none 於 .app-content，僅 modal 可點擊）。
用戶提到「切換回 FLOW 之後視窗自動消失」——需要持續監聽 active tab URL 變化。

## v1.7.3 實作任務（更新版）

### 任務 1：notFlowWarning 改強制 modal
HTML 改造：#notFlowWarning 改 class 為 modal-overlay（全螢幕遮罩 rgba(0,0,0,.55)）+ modal-box（置中卡，含 icon 警示、title「不在 Flow 專案頁面」、hint「Flow 自動化工具僅在 Flow 專案頁面上可用。」、「前往 Flow」按鈕）。不可手動關閉：遮罩點擊不關閉、無 X、ESC 不關閉。顯示 modal 時 .app-content（main/topbar）pointer-events:none + blur，僅 modal 可互動。
JS：showNotFlowWarning() 改為 toggleNotFlowModal(on)。side panel 環境啟動 interval（每 2s）+ chrome.tabs.onActivated/onUpdated listener 檢查 active tab URL；isFlowUrl 判斷（labs.google/fx/tools/flow 或 /flow 頁面）。Flow 頁面隱藏 modal 恢復交互；否則顯示。file:// 環境（chrome undefined）顯示 modal。

### 任務 2：HTML 靜態文字繁體化（完整對照）
| 位置 | 現狀 | 改後 |
|---|---|---|
| L20 | 設置 | 設定 (data-i18n tabSettings) |
| L55 | 文本轉視頻 | 文字轉影片 (modeText2Video) |
| L59 | 偵數轉視頻 | 偵數轉影片 (modeFrame2Video) |
| L63 | 組件化視頻 | 組件化影片 (modeComp2Video) |
| L67 | 文本轉圖片 | 文字轉圖片 (modeText2Image) |
| L87-90 | 1/2/3/4 个 prompt | 1/2/3/4 個 prompt（用 data-i18n queueCount 格式 %N% 個任務） |
| L92 | 同时处理的 prompt 数量。 | 同時處理的 prompt 數量。(hintConcurrent) |
| L97 | 随机等待 | 隨機等待 (labelRandomWait) |
| L104 | 处理下一个提示前的随机等待时间。 | 處理下一個提示前的隨機等待時間。(hintRandomWait) |
| L112 | 点击上传或拖拽 | 點擊上傳或拖曳 (uploadTitle) |
| L113 | PNG, JPG, GIF 每个大小不超过 50MB | PNG, JPG, GIF 每個大小不超過 50MB (uploadHint) |
| L123 | 图片处理选项 | 圖片處理選項 (labelFrameOption) |
| L126-128 | 每个 prompt 仅使用开始帧/首尾帧/全部帧 | 每個 prompt 僅使用開始幀/使用首尾幀/使用全部幀 (hintFrameOption 系列或用 option 靜態) |
| L137 | Chain Prompt 连锁生成 ⛓ | Chain Prompt 連鎖生成 ⛓ (toggleChain) |
| L139 | hintChain 簡體值 | 自動將上一段影片的最後一格畫面作為下一個 prompt 的輸入圖片。 |
| L146 | hintChainNote | 啟用連鎖生成時，將依序逐個處理 prompt，無法併發。(zhTW) |
| L157 | 上传 .txt 文件 | 上傳 .txt 檔案 (data-i18n btnLoadTxt) |
| L161 | 上传 .xlsx / .csv | 上傳 .xlsx / .csv (data-i18n btnLoadCsv) |
| L172 | title 移除已导入的旁白稿 | 移除已匯入的旁白稿 |
| L175-181 | placeholder 簡體 | 繁體版 |
| L182 | hintPrompts | 用空行分隔每個 prompt。 |
| L192 | hintCharacter | 當提示詞中提及角色時，自動選擇對應角色。 |
| L202 | 默认角色 | 預設角色 (labelDefaultChar) |
| L204 | 无 | 無 |
| L205 | 没有可用选项 | 沒有可用選項 |
| L211 | 扫描角色 | 掃描角色 (btnScanChars) |
| L215 | hintCharScan | 尚未掃描任何角色。請在 Google Flow 中開啟一個專案，然後點擊「掃描角色」按鈕。 |
| L222 | 按说话者自动添加语音 | 按說話者自動新增語音 (toggleVoice) |
| L224 | hintVoice | 當 prompt 中提到說話者名稱時，自動選擇對應的語音。 |
| L233 | 默认说话者 | 預設說話者 (labelDefaultVoice) |
| L235 | 未配置语音 | 未設定語音 (voiceDefault) |
| L244 | labelMaxImages | 每個 prompt 的最大輸入圖片數 |
| L247-256 | N 张图片 | N 張圖片 |
| L258 | hintMaxImages | 每段提示詞處理時最多使用的輸入圖片數量。 |
| L266 | 自动添加角色图片 | 自動新增角色圖片 (toggleCharImages) |
| L268 | hintCharImages | 自動新增與 prompt 中角色名稱相符的圖片（依據檔名）。 |
| L281 | labelOutputs | 每個 prompt 的輸出數量 |
| L289 | hintOutputs | 每個 prompt 需要生成的圖片/影片數量。 |
| L294 | labelFolder | 儲存到資料夾 |
| L297 | hintFolder | 下載檔案的子資料夾。 |
| L301 | hintSettingsMore | 在「設定」分頁中自訂寬高比、時長與數量以獲得更多控制。 |
| L305 | toggleRename | 自動重新命名檔案 |
| L314 | labelWatermark | 移除 VEO 浮水印 |
| L316 | labelWatermarkSite | 前往網站 |
| L326 | queueTitle | PROMPT 佇列 |
| L328 | queueCount | 0 個任務 |
| L331 | queueEmpty | 佇列是空的。新增 Prompts 並點選「執行」。 |
| L340 | previewTitle | 連鎖預覽即時管理面板 |
| L343 | 断点续跑 | 斷點續跑 (btnResume title 從斷點繼續) |
| L344 | 一键导出整条连锁专案 | 一鍵匯出整條連鎖專案 |
| L345 | 清除预览 | 清除預覽 |
| L348 | previewHint | 執行中自動生成：每段最後一幀圖片副本 + 已生成影片播放。卡片可拖曳調整順序，點擊「替換幀」可手動更換輸入圖片。 |
| L354 | previewEmpty | 暫無預覽。開始連鎖生成後，每完成一段會自動新增最後一幀副本。 |
| L359 | 报告错误 | 回報錯誤 (btnReport) |
| L363 | 清除缓存 | 清除快取 (btnClearCache) |
| L373 | 运行 | 執行 (btnRun) |
| L377 | 停止 | 停止 |
| L387-392 | 文本轉視頻/偵數轉視頻/組件化視頻/文本轉圖片/圖片轉圖片/智能體自動化 | 文字轉影片/偵數轉影片/組件化影片/文字轉圖片/圖片轉圖片/智能體自動化 (用 data-i18n modeXxx) |
| L394 | hintDefaultMode | 建立新影片時的預設模式。 |
| L407 | 选择要使用的视频生成模型。 | 選擇要使用的影片生成模型。(hintModel) |
| L416 | hintImageModel | 選擇用於文字轉圖片生成的 AI 模型。 |
| L419 | 宽高比 | 寬高比 (labelAspect) |
| L422 | 9:16 (短片/Reels) | 9:16 (短片/Reels) 保持 |
| L424 | 3:4 (竖版) | 3:4 (直式) |
| L425 | 4:3 (横版) | 4:3 (橫式) |
| L427 | hintAspect | 影片幀比例（16:9 或 9:16）。 |
| L439 | hintDurationOpt | 提示詞的預設時長設定（4秒、6秒、8秒、10秒、4秒合併或6秒合併）。最後一個提示詞將使用8秒。 |
| L447 | hintImageMode | 圖片提示詞的預設輸入選項。最後一個提示詞將始終使用新圖片。 |
| L456 | hintVideoRes | 選擇自動下載的影片品質。 |
| L461 | 不下载 | 不下載 (imageResNone) |
| L466 | hintImageRes | 選擇自動下載的圖片品質。 |
| L483 | title 開啟 Chrome 下載設定 | 保持 |
| L487 | hintDownloadSettings | 影片將下載到 Chrome 的下載資料夾。每個專案將有自己的資料夾來儲存影片。 |
| L493 | hintSettingsSync | 設定會自動在所有瀏覽器分頁中同步。 |
| L42-45 | notFlowPage/notFlowHint/goToFlow | 不在 Flow 專案頁面 / Flow 自動化工具僅在 Flow 專案頁面上可用。 / 前往 Flow |
| L26/29 | openInTab title | 以瀏覽器分頁開啟 / Open in tab |

注：部分靜態文字需新增 data-i18n key 並加入三字典（zh-TW 繁/zh-CN 簡/en）。
簡體特徵字集見 find_simp.py SIMP。
掃描工具：python3 /home/ubuntu/flow-automation/find_simp.py

## v1.7.3 實作進度快照（2026-08-17）

### 已完成
1. popup.html：#notFlowWarning 已改為 #notFlowModal（notflow-overlay + notflow-box，含 icon/title/hint/btnGoToFlow）。
2. popup.css：已加 .notflow-overlay/.notflow-box/.notflow-icon/.notflow-title/.notflow-hint/.notflow-btn + body.notflow-locked 遮擋規則（.topbar/.panel/.warn-card pointer-events:none opacity:.45）。
3. popup.html 靜態文字繁化：fix_trad.py 的 HTML_SUBS（56 項）+ HTML_SUBS2（14 項）已套用，HTML 剩餘簡體僅 4 行（L174 btnClearNarration title、L207 没有可用选项、L249-258 N 张图片、title 屬性）——這些是 option/靜態值，已在 JS 字典繁化後仍需同步。

### 待完成
A. popup.js zh-TW 字典繁化：L240-351 的 zh-CN 字典區塊其實是「繁体+简体混杂」？**注意：L240-351 是 "zh-CN" 區塊但內容是 zh-TW 用語混合簡體字**（如「设置」「视频」「帧」）。L1-238 是 en 區塊，zh-TW 區塊在哪？→ 實際結構：i18n = { en: {...}, "zh-CN": {...}, "zh-TW": {...} } 需確認。grep "zh-TW" 找 zh-TW 字典起點行。
B. popup.js showNotFlowWarning 改寫為 toggleNotFlowModal：
   - 取 #notFlowModal 與 body
   - 顯示時 document.body.classList.add('notflow-locked')、modal 移除 hidden
   - 用 setInterval（每 2s）+ chrome.tabs.query({active:true,currentWindow:true}) 查 active tab url
   - chrome.tabs.onActivated/onUpdated listener 也觸發檢查
   - isFlowUrl：url 含 labs.google 與 /tools/flow（labs.google/fx/tools/flow）
   - Flow 頁面：隱藏 modal、移除 locked；非 Flow：顯示 modal
   - chrome undefined 時（file://）顯示 modal
   - 用戶不能關閉（無 X、遮罩點擊無效、ESC 無效）——不要加關閉邏輯
C. JS 字典中 key 值繁化逐 key 對照（zh-TW 區塊）：tabSettings「設置→設定」等全套，同 fix_trad.py PAIRS。zh-CN 區塊保持簡體用語但用詞也要在地化？zh-CN 區塊目前是簡體但用詞已在地化（如「项目页面」），保持不動。en 區塊不動。
D. 語法檢查 node --check popup.js flow-automation.js；瀏覽器測試 file:///home/ubuntu/flow-automation/popup.html?v=13（mock chrome.tabs.query 模擬 side panel）：
   - modal 顯示/隱藏切換
   - body.notflow-locked 遮擋交互
   - 三語言切換後 modal 文字在地化（t() 重渲）
   - 繁中字確認
E. manifest 版本改 1.7.3（grep "version" manifest.json）；README 加 v1.7.3 紀錄；打包 zip（排除 fix_trad.py、find_simp.py、test_*.js、test_notes.md、browser_test.md）。

### JS 字典關鍵 key 繁化對照（zh-TW 區，若目前 zh-CN 區塊其實就是顯示的繁中字典）
tabSettings 設置→設定；labelImageMode 默认图片模式选项→預設圖片模式；labelVideoRes 自动下载质量（视频）→自動下載品質（影片）；labelImageRes→自動下載品質（圖片）；labelDurationOpt 默认视频选项→預設影片選項；labelDefaultMode 默认模式→預設模式；labelDownloadSettings 下载设置→下載設定；hintDownloadSettings/hintSettingsSync 繁化；tabDebug 调试日志报告→調試日誌報告；debugTitle/debugAutoScroll 自动滚动→自動滾動；debugCopy 复制→複製；debugStatus %N% 条→%N% 條；debugEmpty 暂无日志…→暫無日誌。開始自動化後，活動將顯示在此處。；debugCopied 已复制日志→已複製日誌；openInSidePanel 以侧边面板打开→以側邊面板打開；sidePanelUnsupported 此环境不支持侧边面板…→此環境不支援側邊面板，已改為新分頁打開；queueTitle PROMPT 队列→PROMPT 佇列；queueCount %N% 个任务→%N% 個任務；queueEmpty→佇列是空的。新增 Prompts 並點選「執行」。；btnReport 报告<br>错误→回報<br>錯誤；btnClearCache 清除<br>缓存→清除<br>快取；btnRun 运行→執行；labelAspect 宽高比→寬高比；previewTitle 连锁预览 实时管理面板→連鎖預覽即時管理面板；previewHint 运行中自动生成：每段最后一帧图片副本 + 已生成视频播放。→執行中自動生成：每段最後一幀圖片副本 + 已生成影片播放。；previewEmpty 暂无预览。开始连锁生成后…→暫無預覽。開始連鎖生成後，每完成一段會自動新增最後一幀副本。；resumeHint/checkboxTitle 断点续跑→斷點續跑；previewReplace 替换帧→替換幀；previewRetry 重试过→重試過；previewColorGap 色彩过渡不连续，已自动重试→色彩過渡不連續，已自動重試；exportBtn 📦 导出专案→📦 匯出專案；exportTitle 导出连锁专案→匯出連鎖專案；exportStart 正在打包专案…→正在打包專案…；exportDone 专案已打包完成并开始下载：→專案已打包完成並開始下載：；exportNoData 没有可导出的内容…→沒有可匯出的內容。請先執行連鎖生成或上傳幀與輸入 prompts。；exportFail 导出失败，请稍后再试。→匯出失敗，請稍後再試。；dragDoneLocked 已完成段不可移动顺序。→已完成段不可移動順序。；dragSuccess 连锁顺序已调整（第 %N% 段）。→連鎖順序已調整（第 %N% 段）。；replaceSuccess 第 %N% 段输入帧已替换。→第 %N% 段輸入幀已替換。；notOnFlow 请先打开 Google Flow 网站后使用本扩展。→請先開啟 Google Flow 網站後使用本擴充。；openFlow 是否打开 Google Flow?→是否開啟 Google Flow？；running 运行中…→執行中…；startSuccess 已开始批量处理…→已開始批次處理，請勿關閉 Flow 頁面。；stopped 已停止批量处理。→已停止批次處理。；btnNarration 导入旁白稿→匯入旁白稿；narrationLoaded 已导入 %N% 段旁白稿…→已匯入 %N% 段旁白稿，將自動附加到對應分段提示詞。；narrationRemoved 已移除旁白稿。；narrationMismatch 旁白稿共 %N1% 段…→旁白稿共 %N1% 段，提示詞共 %N2% 段，依序一一對應（多出部分僅附加到對應段）。；narrationNoPrompts 请先在下方填写或导入 Prompts…→請先在下方填寫或匯入 Prompts，再匯入旁白稿。
（以上為 zh-TW 繁化目標值；en 區塊與 zh-CN 區塊不動）


## v1.7.3 實作完成與測試（2026-08-17）

### 實作完成
1. **強制 modal**：popup.html 改 notFlowWarning 卡為 #notFlowModal.notflow-overlay（L36-48）：置中訊息框、黃色左邊框、遮罩 blur、z-index 9999。CSS L593-648：body.notflow-locked 時 .topbar/.panel/.warn-card pointer-events:none + opacity .45。popup.js L1401-1461：showNotFlowWarning 改操作 notFlowModal + body class；locked 時 setInterval 1.5s 輪詢 chrome.tabs.query active URL 是否 /labs\.google\/fx\/tools\/flow\/project/，命中則 clearInterval 並移除 locked；keydown/click/wheel 三事件 capture 攔截。腳本載入時 IIFE 立即呼叫一次。HTML 舊 warn-card 已移除。
2. **繁體修正完成**：HTML 靜態文字全部繁化（文字轉影片/幀轉影片/組件轉影片/文字轉圖片/智慧體自動化/並行 Prompt/隨機等待/上傳 .txt 檔案/上傳 .xlsx .csv/無/1-10 張圖片/下載設定/預設模式 option）；zh-TW 字典與 JS 執行文案全部繁化（运行→執行、失败→失敗、缓存→快取、启动→啟動、扫描→掃描、上传→上傳、项目→專案、日志→日誌、复制→複製、添加→新增、导入→匯入、视频→影片、图片→圖片、个→個、设置→設定、暂無→暫無、仅→僅、纯文本→純文字、侦數→幀、智能體→智慧體、文本→文字、組件化視頻→組件轉影片）；zh-CN 字典保留簡體。
3. 語法檢查：popup.js/flow-automation.js/background.js 三檔 node --check 全通過。

### 測試結果
- popup.html?v=13：強制 modal 正確顯示（置中、遮罩、底層 UI 置灰、前往 Flow 按鈕）✓
- 頁面文字全繁中確認 ✓
- 下一步：mock chrome.tabs.query 測 modal 自動解除；tab 切換；設置頁籤；manifest 版本 1.7.2→改 1.7.3；README 加 v1.7.3；打包。
- 打包指令：cd /home/ubuntu/flow-automation && rm -f /home/ubuntu/flow-automation.zip && zip -r /home/ubuntu/flow-automation.zip . -x "test_*.js" -x "test_*.txt" -x "test_*.csv" -x "test_notes.md" -x "browser_test.md" -x "project_state.md" -x "find_simp.py" -x "fix_trad.py"


## v1.7.3 測試最終結果（全部通過）

### 強制 modal 測試
鎖定期間底層點擊被攔截（targetRanWhenLocked=false ✓）；非 Flow URL 時 modal 顯示+locked+輪詢計時器啟動（✓）；模擬切回 Flow 頁面後 modal 隱藏+locked=false+計時器清除（✓）；「前往 Flow」按鈕文字正常。Flow URL 下 modal 隱藏未鎖定（✓）。

### 界面與文字測試
三頁籤（control/settings/debug）切換正常 ✓；語言 chips：English／中文(繁體)／简体中文 ✓；設置 defaultMode 選項全繁中（文字轉影片/幀轉影片/組件轉影片/文字轉圖片/圖片轉圖片/智慧體自動化）✓；下載設定提示全繁中 ✓；control 頁籤主要文字（文字轉影片/組件轉影片/智慧體自動化/上傳 .txt 檔案/掃描角色/張圖片/沒有可用選項/用空行分隔每個 prompt）全部繁體 ✓；靜態文字掃描 6 筆命中的「佇/設/橫/下/不」為繁簡共用字非殘留簡體 ✓。JS 字典掃描：zh-TW 區（L1-238）無真殘留（命中皆為共用字）；zh-CN 區保持簡體 ✓。

### 結論
v1.7.3 測試全部通過。剩餘：manifest 版本改 1.7.3、README 加 v1.7.3 紀錄、打包交付。


## v1.7.4 需求（用戶回報，2026-08-17）

**問題根因**：用戶實際 Flow 頁面網址為 `https://labs.google/fx/zh/tools/flow/...`（含語言路徑 /zh/），但目前正則 `/labs\.google\/fx\/tools\/flow\/project/` 只匹配 `/fx/tools/flow`，不含 /zh/、/en/ 等語言前綴 → 被誤判為「不在 Flow 專案頁面」，彈窗不消失。

**修正方案**：popup.js 中兩處正則（showNotFlowWarning 初判 + 輪詢）改用 `labs\.google\/fx\/[^/]*\/tools\/flow`（允許任意語言路徑段，含 / 或無），或更寬鬆 `labs\.google.*tools\/flow`。同時檢查 FLOW_URL 常數與其他 match 判斷。專案頁判斷改：`labs\.google\/fx\/[^/]*\/tools\/flow\/project`。

**待辦**：改 popup.js 正則、語法檢查、測試（file:// mock chrome.tabs.query 用 /zh/ URL）、README 加 v1.7.4、manifest 版本 1.7.4、打包交付。
打包指令：cd /home/ubuntu/flow-automation && rm -f /home/ubuntu/flow-automation.zip && zip -q -r /home/ubuntu/flow-automation.zip . -x "test_*" -x "test_notes.md" -x "browser_test.md" -x "project_state.md" -x "*.py" -x "__pycache__/*"


## v1.7.4 測試結果（2026-08-17，全部通過）

修正 popup.js 正則：`/labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i`（showNotFlowWarning 初判 + 輪詢），ensureFlowTab 的 query 改為 `https://labs.google/fx/*tools/flow*`。

| 測試項 | 結果 |
| --- | --- |
| /fx/zh/tools/flow/project/xxx（簡體頁） | modalHidden=true, locked=false ✓ |
| /fx/en/tools/flow/project/xxx（英文頁） | modalHidden=true, locked=false ✓ |
| /fx/tools/flow/project/xxx（無語言前綴） | modalHidden=true, locked=false ✓ |
| /fx/zh/tools/flow（主頁） | modalHidden=true, locked=false ✓ |
| 非 Flow 頁面 example.com | modal 顯示+locked=true+計時器 ✓ |
| 鎖定後切回 /zh/ 專案頁（2.2s 輪詢） | modal 自動隱藏+locked=false ✓ |

剩餘：manifest 1.7.4、README 加 v1.7.4、打包。


## v1.8.0 需求盤點（2026-08-17）

### 需求 A：明亮主題（普羅旺斯風格）
- 設置頁籤新增主題切換（暗黑/明亮 普羅旺斯）
- 暗黑配色：綠黑白 → 明亮配色：粉黑白，文字對比清晰
- 需要：theme-select 或 toggle、CSS 變數化（:root data-theme）、JS 存到 settings、三字典新 key

### 需求 B：功能比對（vs github.com/trgkyle/veo-automation-user-guide，原 VEO Automation v3.1.7 作者 Trường Nguyen）

GitHub 原擴充功能 vs 本擴充（v1.7.4）比對結果：
| GitHub 原功能 | 本擴充實作 |
|---|---|
| 佇列支援（多 prompt 批次） | ✅ |
| 文字轉影片 | ✅ |
| 偵數轉影片（幀轉影片，含 Start/End 幀） | ✅（End 幀需確認，至少 Start 幀） |
| 食材轉影片（Ingredients/Components，角色檔名自動匹配） | ✅（組件轉影片+角色圖片+語音開關） |
| 文字轉圖片 | ✅ |
| 圖片轉圖片 | ✅ |
| 智能體自動化 | ✅（智慧體自動化） |
| 試算表匯入 .xlsx/.csv | ✅ |
| 自動下載 720p/1080p/4K、1k/2k/4k | ✅（品質可設定） |
| 失敗重試（最多20次） | ⚠️ 部分：自動重試次數固定在 1（CHAIN_MAX_RETRYS=1），無 1-20 設定選項 |
| 多語言 UI（20 種語言） | ⚠️ 部分：僅 3 種（繁中/簡中/英文） |

本擴充獨有功能（GitHub 版沒有的）：
- Chain Prompt 連鎖生成（最後一幀作為下一段輸入）
- 斷點續跑 + 每段最後幀副本保留
- 即時預覽面板（拖曳排序、手動替換輸入幀、色彩過渡偵測、失敗自動重試）
- 一鍵匯出連鎖專案 ZIP（含 Prompt 設定+分段影片+最後幀圖片）
- 旁白稿批次匯入 TXT/CSV 自動對應各段 prompt（30 個 Chirp 3 HD 語音）
- 按說話者自動新增語音 + 預設說話者下拉
- 預設角色 + 掃描角色（相似角色名匹配引擎：分詞+長名吸收+CJK 邊界）
- 語言 chip 三態循環
- 強制彈窗（非 Flow 頁面鎖定提示）
- 調試日誌報告頁籤
- 下載設定區塊 + side panel 分割畫面
- 明亮主題（v1.8.0 新增）
- 新分頁/右側面板開啟
- 最大輸入圖片數 1-10 下拉、輸出數量、隨機等待、儲存資料夾、自動重新命名、去浮水印連結

注：GitHub 版有計費/登入/Max plan（$3/月）；本擴充無（免費使用）。

### 待辦
1. 主題實作（CSS 變數 + data-theme + settings.theme + 三字典 key）
2. 中英簡三份說明文件（USER_GUIDE_ZH-TW.md / USER_GUIDE_EN.md / USER_GUIDE_ZH-CN.md）
3. README 加 v1.8.0、manifest 1.8.0、打包


## v1.8.0 實作進度（2026-08-17）

### 已完成：popup.css 主題化
- :root/[data-theme="dark"] 暗黑（綠黑白）+ [data-theme="light"] 明亮普羅旺斯（粉黑白）雙主題 CSS 變數
- 變數：--accent(綠#3ddc84/粉#db6d94)、--accent-hover(明亮#c8577f)、--on-accent(暗#0a0a0a/明#fff)、--danger、--warn、--warn-bg、--warn-border、--info、--debug-bg、--debug-text、--debug-line-border、--badge-bg、--badge-text、--thumb、--pending-bg、--switch-off、--text-secondary
- 所有 --green → --accent 替換完成；硬編碼色值（#0a0a0a→var(--on-accent)、#35c477→--accent-hover、#ff7070→--danger、warn 色→--warn、scrollbar thumb→--thumb、slider→--switch-off、queue-status→--pending-bg/--danger-bg、debug→var、notflow-box→--warn 邊框）已完成
- 剩餘待做：run-btn.stop（#ff6b6b/#f05656）可保留；queue-status.running 用了兩個 background 重複（需移除 var(--danger-bg) 那個冗餘行 309，light 主題會用粉紅底）

### 待辦清單
1. popup.html：設置頁籤語言區段後加主題切換（themeSelect 下拉 暗黑/明亮普羅旺斯）+ labelTheme key
2. popup.js：三字典加 labelTheme（zh-TW:"主題"、zh-CN:"主题"、en:"Theme"）+ hintTheme；settings def 加 theme:"dark"；bindUI 綁定 themeSelect 存檔；applyTheme() 設 document.documentElement.dataset.theme；載入時 apply
3. 語法檢查、測試（file:// 下切換主題看變數套用）
4. 三份說明文件：USER_GUIDE_ZH-TW.md / USER_GUIDE_EN.md / USER_GUIDE_ZH-CN.md（參考 GitHub trgkyle/veo-automation-user-guide 結構但不抄襲；比對表見前段）
5. README 加 v1.8.0（主題+說明文件+GitHub 功能比對結論）、manifest 1.8.0、打包

### GitHub 原擴充功能比對結論（見前段表格）
本擴充已實作 GitHub 版全部核心功能；差异：重試次數固定 1 次（非 1-20 設定）、語言 3 種（非 20 種）、無計費/登入系統（免費）。本擴充獨有：Chain Prompt、斷點續跑、預覽面板、匯出 ZIP、旁白稿匯入、角色/語音自動匹配引擎、強制彈窗、調試日誌、下載設定、側邊面板、主題切換。


## v1.8.0 主題測試結果（2026-08-17 14:19）
- popup.html?v=15 載入，切換 themeSelect=light 後截圖確認：
  - 背景變白色（--bg #fdf3f4）、卡片白色、邊框粉紅、按鈕粉紅（--accent #db6d94）
  - notFlow modal 白色底黑字、前往 Flow 按鈕粉紅色——全部正確
  - modal 鎖定遮罩正常顯示（file:// 非 Flow 頁面）
- console 工具回傳 undefined（該工具特性），改用截圖驗證視覺即可
- theme 實作：settings.theme def="dark"、themeSelect 綁定+saveSettings+applyTheme、applyTheme 同時覆寫 option 文字（themeDark/themeLight 三字典 key 已加）
- 剩餘：dark 主題截圖對比（v=15 初始即暗黑，截圖1 已是暗黑綠）、phase 4 三份說明文件、README v1.8、manifest 1.8.0、打包

確認：切回 dark 後 UI 恢復暗黑綠黑白（截圖：黑底綠按鈕 modal），主題切換/持久化正常。主題功能測試完成。

---

## v1.8.1 測試記錄（2026-08-17）

### 本次修改
1. 設置頁籤新增「重置為預設值」與「保存設定」兩個按鈕（.save-actions 區塊，位於下載設定卡片下方、同步提示上方）
   - 保存按鈕：觸發 saveSettings() + toast 提示「設定已保存。」（變更下拉時已自動保存，此為手動確認用）
   - 重置按鈕：localStorage.removeItem → loadSettings() → applyUIFromSettings() → saveSettings() → toast「已重置為預設值。」
   - applyUIFromSettings() 刷新全部控制項：concurrency/waitMin/waitMax/frameOption/chainToggle/charToggle/maxImages/charImageToggle/voiceToggle/outputCount/folderName/renameToggle/aspect chips/modelSelect/downloadRes/durationSelect/imageModelSelect/defaultModeSelect/imageModeSelect/videoResSelect/imageResSelect/themeSelect/語言 chips/主題/語言
2. BUG 修正：「不在 Flow 專案頁面」彈窗消失後，切換離開 Flow 頁面不會再彈出
   - 根因：解除鎖定後 clearInterval，不再輪詢，狀態鎖定在「未鎖定」
   - 修正：showNotFlowWarning 啟動後每 1 秒無條件輪詢活動分頁；shouldLock !== lastFlowState 時才切換狀態
   - 行為：切回 Flow → 1 秒內彈窗消失解鎖；離開 Flow → 1 秒內彈窗重彈並重新鎖定
   - 支援所有語言路徑 /fx/xx/tools/flow（正則 labs\.google\/fx\/(?:[^/]+\/)?tools\/flow）
3. 三語言字典加 btnSaveSettings/btnResetDefaults/saveDone/resetDone（zh-TW/zh-CN/en）
4. popup.css 加 .save-actions/.save-btn/.save-btn-save(accent)/.save-btn-reset(hover warn)

### 測試結果
- 語法檢查 popup.js/flow-automation.js/background.js：OK
- 保存按鈕：duration 改 10 → 點保存 → toast 顯示「設定已保存。」，localStorage 含 duration:"10" ✓
- 重置按鈕：duration 改 6、主題改 light → 點重置 → duration="8"、themeSelect="dark"、dataset.theme="dark"、toast「已重置為預設值。」、localStorage 為完整預設值 ✓
- 視覺：兩個按鈕正常顯示於下載設定卡片下方，重置為預設值（透明+邊框）、保存設定（accent 實底）✓
- 彈窗修復：file:// 環境下 modal 正常顯示鎖定（點擊被攔截）；Flow 頁面會自動解除 ✓
- 注意：沙箱 browser 無法開真實 labs.google（顯示 unsupported-country），但正則 /tools\/flow/ 會命中，行為符合預期

### 交付前
- manifest.json 版本 1.8.1，README changelog
- 打包：cd /home/ubuntu/flow-automation && rm -f /home/ubuntu/flow-automation.zip && zip -q -r /home/ubuntu/flow-automation.zip . -x "test_*.js" -x "test_*.txt" -x "test_*.csv" -x "test_notes.md" -x "browser_test.md" -x "project_state.md" -x "find_simp.py" -x "fix_trad.py" -x "scan_js_simp.py" -x "gen_icons.py" -x "*__pycache__*"
