# Auto Flow Free

Auto Flow Free (formerly Flow Automation) is an Auto Veo, Auto Flow tool built to fully automate your workflow on Google Flow (labs.google/fx/tools/flow). Auto Flow your prompts at scale: batch generate and auto-download videos and images.

GitHub 倉庫：[m45801ch/Auto-Flow-Free](https://github.com/m45801ch/Auto-Flow-Free)

## Changelog 版本紀錄

### v1.9.3 (2026-08-18)

| 新增 / 修正 | 說明 |
| --- | --- |
| 彈窗切回 Flow 自動消失修正 | 側邊面板（side panel）是 Chrome 的獨立 window，原偵測邏輯用 `chrome.tabs.query({ active: true, currentWindow: true })` 只會查到面板自身的活動分頁，永遠找不到 Flow 分頁，導致離開 Flow 後切回時強制彈窗不會自動消失；現改為不限 window 查詢所有活動分頁，任一活動分頁在 Flow 上即解除鎖定，切回 Flow 彈窗立即自動消失 |

### v1.9.2 (2026-08-18)

| 新增 / 修正 | 說明 |
| --- | --- |
| GitHub 按鈕雙分頁修正 | 右上角「GitHub 倉庫」按鈕原本會連開兩個分頁（`<a>` 預設行為與 JS `chrome.tabs.create` 同時觸發），現已阻止 `<a>` 預設行為，只開啟一個分頁 |
| 下載設定說明位置調整 | 「影片將下載到 Chrome 的下載資料夾。每個專案將有自己的資料夾來儲存影片」說明文字從下載設定卡片框內移到卡片框下方顯示 |
| 移除 ⭐ 符號 | 移除界面所有 ⭐ 符號（如「自動新增角色 (Google Flow 功能 ⭐)」三語言字典與界面文字），改為「自動新增角色 (Google Flow 功能)」 |

### v1.9.1 (2026-08-17)

| 新增 / 修正 | 說明 |
| --- | --- |
| 頂部版本號 | 界面最上方新增版本徽章（v1.9.1），與 GitHub 倉庫按鈕並列顯示 |
| 英文界面中文字修正 | 全面掃描並修正英文語言界面下的中文殘留：控制/設定/調試三頁籤文字、下拉選單選項、提示文字（title）、輸入框預留文字（placeholder）、角色/語音重建選項、斷點續跑/連鎖生成提示、日誌匯出/複製提示等全部改用 i18n 字典；三語言字典逐鍵覆蓋檢查（zh-TW 228 / en 226 / zh-CN 226 鍵齊全） |
| 日誌匯出檔頭改名 | 匯出的日誌檔頭改為「Auto Flow Free - Debug Log」 |

### v1.9.0 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 調試日誌條數正確顯示 | 修正日誌報告狀態顯示「%N% 條」未替換的問題，現在正確顯示實際日誌行數（含新增/清除同步更新） |
| 日誌匯出 | 調試日誌新增「匯出」按鈕，一鍵將完整日誌匯出為 `flow-automation-debug-*.txt` 檔案（自動帶時間戳，支援 extension 與一般網頁環境） |
| 明亮主題改為預設 | 首次載入或重置設定時，預設主題改為明亮（普羅旺斯・粉黑白） |
| 寬高比改下拉 | 設置頁籤「寬高比」由點選人形 chip 改為下拉選單（16:9／9:16／1:1／3:4／4:3），操作更直觀 |
| 語言切換整合 | 右上角語言切換與設置頁籤語言設定整合為單一「語言 Language」下拉選單（繁中／簡中／EN），改選後立即生效並同步保存 |
| GitHub 倉庫按鈕 | 右上角按鈕改為開啟 GitHub 倉庫（https://github.com/m45801ch/Auto-Flow-Free），新分頁開啟 |
| 改名 Auto Flow Free | 擴充功能名稱、彈出標題、界面標題全面改為「Auto Flow Free」 |

### v1.8.1 (2026-08-17)

| 新增 / 修正 | 說明 |
| --- | --- |
| 保存設定／重置為預設值按鈕 | 設置頁籤底部新增「保存設定」與「重置為預設值」兩個按鈕；變更下拉已自動保存，保存按鈕為手動確認提示；重置按鈕恢復全部預設值並刷新所有控制項 |
| 彈窗持續偵測修正 | 修正「不在 Flow 專案頁面」強制彈窗：切回 Flow 彈窗消失後，若再切換離開 Flow 頁面，彈窗會再次彈出並鎖定操作（每 1 秒持續監控活動分頁，支援所有語言版本 Flow 頁面） |

### v1.8.0 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 明亮主題（普羅旺斯風格） | 設置頁籤新增「主題」切換：暗黑（綠黑白）或明亮普羅旺斯（粉黑白），全部 CSS 變數化，文字對比清晰；設定自動同步並持久化 |
| 三份使用說明文件 | 新增繁體中文／English／简体中文三份完整說明檔（USER_GUIDE_ZH-TW.md / USER_GUIDE_EN.md / USER_GUIDE_ZH-CN.md）：功能總覽、安裝方式、六種生成模式、連鎖生成、旁白稿匯入、設置說明、疑難排解 |

### v1.7.4 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 多語言版 Flow 頁面偵測 | 非 Flow 頁面彈窗偵測邏輯支援所有語言版本：簡體版（/zh/tools/flow）、繁體與英文版（/en/tools/flow）及無語言前綴版本，在任一流覽版本上彈窗均自動消失 |

### v1.7.3 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 強制彈出訊息框 | 不在 Flow 專案頁面時，彈出置中訊息框提示「不在 Flow 專案頁面／Flow 自動化工具僅在 Flow 專案頁面上可用」，附「前往 Flow」按鈕；半透明遮罩鎖定全部操作、無法手動關閉；切回 Flow 頁面後自動消失、功能恢復 |
| 繁體中文化修正 | 全面修正界面簡體字殘留：文字轉影片／幀轉影片／組件轉影片／智慧體自動化／並行 Prompt／隨機等待／上傳 .txt 檔案／掃描角色／下載設定／專案等，全部改為繁體中文在地化用語 |

### v1.7.2 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 真正分割畫面開啟 | 移除 popup 覆蓋視窗，改為 Side Panel 側邊面板：點擊工具列擴充圖示或右上角「新分頁開啟」按鈕，均以瀏覽器右側分割畫面顯示，寬度可用滑鼠拖移調整 |

### v1.7.1 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 調試日誌報告頁籤 | 第三個頁籤「調試日誌報告」：自動化活動即時記錄（成功/失敗/重試）、正確日誌條數顯示、自動滾動開關、一鍵複製日誌、一鍵清除、一鍵匯出 TXT |
| 下載設置區塊 | 設置頁籤底部新增「下載設置」：齒輪按鈕直接開啟 Chrome 下載設定（chrome://settings/downloads），每個專案有自己的資料夾儲存影片；附「設置會自動在所有瀏覽器標籤頁中同步」提示 |
| 側邊面板分割畫面 | 「新分頁開啟」改為 side panel 分割畫面（置於瀏覽器右側），寬度可用滑鼠拖移調整 |
| 穩定性修復 | 修復初始載入時缺少部分設置元素會導致 UI 綁定中斷的問題 |

### v1.7.0 (2026-08-17)

| 新增 / 改進 | 說明 |
| --- | --- |
| 設置頁籤新選項 | 預設模式（文本轉視頻／偵數轉視頻／組件化視頻／文本轉圖片／圖片轉圖片／智能體自動化）、圖像模型（Nano Banana Pro / Nano Banana 2 / Nano Banana 2 Lite）、預設圖片模式（新圖片／上一張圖片）、預設影片長度（4秒／6秒／8秒／10秒／4秒合併(Ultra)／6秒合併(Ultra)）、自動下載品質影片（720p／1080p(Ultra Pro)／4K(Ultra Pro)）、自動下載品質圖片（不下載／1K／2K／4K(Ultra)）、寬高比新增 3:4／4:3 |
| 模型下拉擴充 | 新增 Veo 3.1 Lite、Veo 3.1 Lite [Lower Priority]、Omni Flash (Pro/Ultra 方案需要) |
| 依設定解析度下載 | 影片與圖片下載皆依設置選擇的解析度；圖片可設為「不下載」 |
| 新分頁開啟 (side panel) | 右上角「新分頁開啟」按鈕以瀏覽器新分頁顯示擴充界面（右側面板），不覆蓋當前頁面 |
| 非 Flow 頁面提示卡 | 不在 Flow 項目頁面時顯示「不在 Flow 項目頁面／Flow 自動化工具僅在 Flow 項目頁面上可用」提示卡，並提供「前往 Flow」按鈕（新分頁開啟） |
| 在地化更新 | 提示卡與新增選項文字完整支援 繁體中文／简体中文／English |

## User Guides 使用說明

- [繁體中文說明](USER_GUIDE_ZH-TW.md)
- [English User Guide](USER_GUIDE_EN.md)
- [简体中文说明](USER_GUIDE_ZH-CN.md)

## Installation 安裝方法

1. Download `flow-automation.zip` and extract it.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right corner).
4. Click **Load unpacked** and select the extracted `flow-automation` folder.
5. Pin the extension and open Google Flow (`https://labs.google/fx/tools/flow`).

## How to Use 使用方法

1. Open [Google Flow](https://labs.google/fx/tools/flow) in a tab.
2. Click the Flow Automation extension icon to open the control panel.
3. Choose a mode: **文本轉視頻 (Text to Video)** or **偵數轉視頻 (Frame to Video)**.
4. Fill in your prompts in the **Prompts** textarea, separated by blank lines (or upload a `.txt` / `.csv` file).
5. For Frame to Video mode, upload your PNG / JPG / GIF frames (max 50MB each).
6. Configure concurrency, random wait, outputs per prompt, save folder, aspect ratio, model, etc.
7. Click **運行 (Run)**. The extension will automatically submit each prompt in Google Flow, and monitor the queue in real time.

## Features 功能

| Feature | Description |
| --- | --- |
| 文本轉視頻 / 偵數轉視頻 | Text to Video & Frame to Video modes, matching the reference UI |
| 並發 Prompt | Process 1–4 prompts concurrently |
| 隨機等待 | Random wait (seconds) before processing the next prompt |
| Prompts 批次輸入 | Paste prompts separated by blank lines, or upload `.txt` / `.csv` |
| Frame upload | Drag & drop upload, start frame / first-last frames / all frames options |
| Chain Prompt ⛓ | Auto-capture the last frame of the previous video and use it as the input image for the next prompt, forming a continuous generation chain (sequential processing only) |
| 斷点续跑 Checkpoint Resume | Chain mode automatically saves a checkpoint (done segments, last-frame copies, queue status). If interrupted or a prompt fails, click「断点续跑」to resume from the last successful segment — the saved last frame is restored as the first frame of the resumed run |
| 连锁预览 实时管理面板 | Live preview panel in chain mode: each completed segment shows its last-frame copy (click「保存帧副本」to download the PNG copy) plus a playable video player, updating in real time as the batch runs |
| 拖曳排序 Drag to reorder | In chain mode, drag any pending segment card (⠿ handle) to reorder the chain; completed segments are locked, and the prompts text follows the new order automatically |
| 替换帧 Replace frame | Click「替换帧」on any pending segment to manually replace its input frame image — useful for fixing a bad transition or guiding the chain |
| 匯出專案 Export project | One-click export of the whole chain project as a ZIP: project.json (all settings + prompts + queue), prompts.txt, frames/ (last-frame copies + uploaded frames) and videos/ (generated videos) |
| 色彩过渡偵測 + 自動重試 | Color-distance check between consecutive frames (threshold 0.25): if a chain link looks too different from the previous video's last frame, the segment is automatically re-run once. Any failed segment is automatically retried up to 2 times, with retries shown as an orange「重試過」badge |
| Auto-add character | Scan characters in the Flow project and auto-select by keyword; easily-confused similar names are disambiguated (「没有可用选项」shown when no characters are available) |
| 每个 prompt 的最大输入图片数 Max input images per prompt | A 1–10 image dropdown for Image-to-Image / Components-to-Video / Agent modes; input images are distributed to prompts in groups of the chosen size |
| 自动添加角色图片 Auto-add character images | Image-to-Image / Components-to-Video / Agent modes: images whose file name matches a character name mentioned in the prompt are prioritized as the segment's input (may exceed the max-images limit so that all matched character images are included) |
| 全宽可调整界面 Full-width resizable panel | The popup fills the browser window width, aligns to the top-right, and can be resized freely (resize handle at the bottom-right) |
| 旁白稿批次匯入 Narration script import | Import a narration script via「导入旁白稿 .txt / .csv」; each segment is automatically mapped to its matching prompt (TXT: segments separated by blank lines; CSV: automatic header detection with a robust quoted-comma parser) and appended to the corresponding prompt before submission; a mismatch hint is shown when segment and prompt counts differ, and「✕ 移除旁白稿」clears the import |
| Outputs per prompt | 1–4 videos/images per prompt |
| Save to folder | Sub-folder naming for downloads |
| Auto rename | Automatically rename downloaded files |
| PROMPT queue | Live queue monitoring with status (等待中 / 运行中 / 已完成 / 失败) |
| Settings | Aspect ratio dropdown (16:9, 9:16, 1:1, 3:4, 4:3), Veo model, resolution (720p–4K), duration, theme (light Provence pink default / dark green), unified language dropdown (繁體中文 / 简体中文 / English) |
| 三語言在地化 UI Tri-language UI | 繁體中文、简体中文、English three languages via the unified language dropdown in Settings; every label, hint, button, dropdown option (including character images "女/Female" and voice names) uses localized native wording for the selected language |
| 按說話者自動新增語音 Auto-add voice by speaker | Components-to-Video & Agent modes: when the prompt mentions a voice name (e.g. "Achernar"), that voice is auto-selected; otherwise the「預設說話者 Default speaker」voice (30 Chirp 3 HD voices) is used |
| 智能匹配引擎 Smart matching engine | Tokenized matching with CamelCase splitting, prefix-absorption for similar names (「龍」vs「小龍」, "Mary" vs "Mary Jane"), word-boundary checks for English, and full-pool fallback — matching accuracy verified with 20+ automated test cases including easily-confused similar name scenarios |
| 完整語音清單 Full voice list | The「默认说话者 Default speaker」dropdown includes all 30 Google Chirp 3 HD voices used by Google Flow (Achernar, Achird, Algenib, Algieba, Alnilam, Aoede, Autonoe, Callirrhoe, Charon, Despina, Enceladus, Erinome, Fenrir, Gacrux, Iapetus, Kore, Laomedeia, Leda, Orus, Pulcherrima, Puck, Rasalgethi, Sadachbia, Sadaltager, Schedar, Sulafat, Umbriel, Vindemiatrix, Zephyr, Zubenelgenubi) with gender and tone descriptions |

## Notes 注意事項

- The automation works by injecting a content script into Google Flow pages. The Flow tab must stay open during batch processing.
- Google Flow is a Google Labs research tool; its UI may change. If a selector no longer matches, the prompt will be marked as 失败 and the batch continues with the next prompt.
- This extension requires Chrome permissions for downloads, storage, and scripting on `labs.google`.
