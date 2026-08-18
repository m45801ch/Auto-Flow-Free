# Auto Flow Free

Auto Flow Free (formerly Flow Automation) is an Auto Veo, Auto Flow tool built to fully automate your workflow on Google Flow (labs.google/fx/tools/flow). Auto Flow your prompts at scale: batch generate and auto-download videos and images.

GitHub 倉庫：[m45801ch/Auto-Flow-Free](https://github.com/m45801ch/Auto-Flow-Free)
版本更新紀錄請見 [GitHub Releases](https://github.com/m45801ch/Auto-Flow-Free/releases)。

## v1.9.19 更新重點
- 「文字轉影片」模式支援連鎖生成（Chain Prompt）：開啟連鎖後，每段生成時自動切換到 Flow 的「幀數轉影片」面板，將上一段影片的最後一格畫面作為下一段的輸入圖片，生成完成後自動切回「文字轉影片」面板。介面全程停留在文字轉影片操作，連鎖即時預覽、色彩過渡偵測、自動重試與斷點續跑均照常運作
- 面板切換按鈕支援繁體中文、簡體中文與英文三種 Flow 介面

## v1.9.18 更新重點
- 開啟「自動新增角色」後，「掃描到的角色（多選）」清單自動收合，且勾選框停用（不可再選取）
- 補上 6 個語音的語調描述（Schedar、Sulafat、Umbriel、Vindemiatrix、Zephyr、Zubenelgenubi）

## v1.9.17 更新重點
- 「自動新增角色 (Google Flow 功能)」實作完成：prompt 提到已掃描到的專案角色時，會自動在 Flow UI 上選中對應角色（依名稱/文字/角色卡片多重策略比對），未匹配到任何角色時退回預設角色

## v1.9.16 更新重點
- 「預設角色」下拉選單移除角色名稱前的 🖼 符號

## v1.9.15 更新重點
- 「預設角色」下拉選單與「掃描角色」按鈕、「預設說話者」下拉選單與「試聽」按鈕調整為相同高度
- 移除「Chain Prompt 連鎖生成」標題中多餘的 ⛓ 符號（標題已有鏈結圖示）

## v1.9.14 更新重點
- 「按說話者自動新增語音」與「預設說話者」合併為同一張卡片，試聽按鈕移至下拉選單右側並排
- 「預設角色」、「掃描角色」與「掃描到的角色（多選）」合併為同一張卡片

## v1.9.13 更新重點
- 「按說話者自動新增語音」擴充至「文字轉影片」模式（原僅組件轉影片、智慧體自動化）
- 「預設說話者」下拉選單新增「試聽」按鈕，直接播放 Google 官方 Chirp 3 HD 語音示範音檔；性別於中文介面改為中文（男/女），並在語音名稱後附上語調描述（如「柔和，高音調」）
- 智慧體自動化模式下，「自動新增角色圖片」標籤改為「自動新增上傳的角色圖片」，並修正切換模式時標籤未即時更新的問題

## v1.9.12 更新重點
- Flow 頁面偵測回歸 v1.9.1 已驗證的成功實作：面板直接以目前活動分頁網址判斷（支援任何語言路徑），每秒輪詢比對狀態，進入 Flow 時彈窗自動消失、離開時立即重彈；同時保留背景服務廣播作為補充偵測
- 「掃描角色」不再漏掃與誤收：角色面板內的卡片優先以檔名式文字提取角色名稱（不怕卡片文字含時間戳等雜訊），面板判定改為只核對標題層元素避免誤判 AI 對話面板；全域按鈕標籤掃描（「帶我了解你能做什麼」等對話選項的來源）已移除，並加黑名單擋住對話選項文字

## v1.9.11 更新重點
- 移除「預設角色」下拉選單中的「沒有可用選項」項目，清單只保留「無」與實際角色
- 「掃描角色」過濾規則再強化：排除帳號頭像與徽章類短名稱（如 PRO）、無檔名特徵的單字短標籤，只保留檔名式角色名稱（含底線／連字號，或較長的單字）
- Flow 頁面偵測全面覆蓋所有語言界面（/fx/zh/tools/flow、/fx/en/tools/flow 等），進入任一語言界面時彈窗消失、離開時立即重彈；批次任務執行中若離開 Flow 頁面，即時提示「流程執行中請勿離開 Flow 頁面，否則流程可能中斷」
- 每個 prompt 的輸出數量預設值改為 1（新安裝與全新設定預設生效）

## v1.9.10 更新重點
- 「掃描角色」排除 Google Flow「新增角色」按鈕的無障礙標籤（如 accessibility_newjade_disc），只保留用戶真正創建的角色
- 掃描結果卡片新增收合／展開切換；勾選卡片上的角色時，同步在「預設角色」下拉選單中勾選，兩者狀態雙向同步
- 強化 Flow 頁面偵測：背景服務新增定時喚醒檢查（解決服務工作員休眠後事件監聽器失效的已知問題）、訊息查詢加超時包裝並回退到面板直接分頁查詢；內容腳本與權限模式的路徑匹配也修正為支援語言路徑變體

## v1.9.9 更新重點
- 「掃描角色」恢復全域掃描能力並保留 UI 元素排除名單，不再因過度限定面板容器而完全掃不到用戶創建的角色；面板判定同時支援屬性標籤與可見文字，並恢復檔名式名稱全域提取
- Flow 頁面偵測改由背景服務（background service worker）統一驅動，透過分頁更新、分頁切換與視窗焦點事件即時廣播狀態給側邊面板，不再依賴面板內的分頁查詢（修復偵測無作用的根因）；內容腳本與權限模式也改為支援語言路徑變體（/fx/zh/tools/flow 等）
- 開啟「自動新增角色」後，「預設角色」下拉選單同步停用，避免兩項功能互相衝突
- 每個 prompt 的輸出數量預設值由 2 改為 1
- 右上角版本號去除底色框，文字顏色改用主題配色

## v1.9.8 更新重點
- 「掃描角色」改為只在 Flow 專案的「角色」面板內提取用戶創建的角色，不再誤收右側對話面板的 UI 元素（如用戶頭像、生成概念圖、製作視覺情緒板、Learn about generation costs）
- 掃描結果新增多選勾選框：勾選的角色即為提示詞自動匹配的角色池；未勾選任何角色時，自動匹配退回「預設角色」單選（既有用法）
- 修正離開 Flow 頁面時警告彈窗未重新彈出的問題（視窗焦點切換時立即重檢，並擴大鎖定範圍確保彈窗顯示時底層操作完全封鎖）
- 各段秒數設定的「跟隨預設」選項改為直接顯示預設秒數（例如「8 秒」）

## v1.9.7 更新重點
- 圖片上傳區（點擊上傳或拖曳，PNG/JPG/GIF 每個不超過 50MB）擴充至偵數轉影片、組件轉影片、圖片轉圖片、智慧體自動化四種模式（文字轉影片與文字轉圖片不需要圖片輸入，予以隱藏）
- 「掃描角色」現在真正掃描 Google Flow 專案中已建立的角色：以多重策略掃描所有分頁與框架，提取角色名稱與圖片並列出供選取，自動過濾非角色元素（如面板標題、UI 圖示）並跨框架去重
- 開啟「當提示詞中提及角色時，自動選擇對應角色」後，掃描角色按鈕即顯示「已自動匹配」並停用，避免兩項功能互相衝突
- 移除「匯入旁白稿」按鈕：提示詞匯入統一為單一「匯入提示詞 .txt / .csv」按鈕，介面更簡潔
- 各段秒數設定的「跟隨預設」選項不再顯示預設秒數文字
- 修正 Flow 頁面偵測偶發失效的問題（補充擴充權限，確保側邊面板模式下仍可正確讀取各分頁網址）

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
5. In modes that need input images (Frame to Video, Components to Video, Image to Image, Agent), upload your PNG / JPG / GIF frames (max 50MB each).
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
| Chain Prompt | Auto-capture the last frame of the previous video and use it as the input image for the next prompt, forming a continuous generation chain (sequential processing only) |
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
