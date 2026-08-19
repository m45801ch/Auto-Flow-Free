# Auto Flow Free

Auto Flow Free (formerly Flow Automation) is an Auto Veo, Auto Flow tool built to fully automate your workflow on Google Flow (labs.google/fx/tools/flow). Auto Flow your prompts at scale: batch generate and auto-download videos and images.

GitHub 倉庫：[m45801ch/Auto-Flow-Free](https://github.com/m45801ch/Auto-Flow-Free)
版本更新紀錄請見 [GitHub Releases](https://github.com/m45801ch/Auto-Flow-Free/releases)。

## v1.9.84 更新重點

- **提示詞填入改用 Slate 編輯器 API**：Flow 的提示詞輸入框是 Slate 編輯器（`data-slate-editor`），先前 execCommand 只改了畫面 DOM、沒更新 Slate 內部狀態，導致 Flow 判定沒有提示詞、送出鍵停用。現在會透過 React fiber 找到 Slate editor，設定 selection 後用 `editor.insertText()` 真正寫入內部狀態（無法取得時才退回 beforeinput/execCommand）
- **送出按鈕偵測再強化**：優先嚴格選 `arrow_forward创建` 主送出鍵（不再退到 `add_2创建` 加號鍵）；並在除錯日誌列出所有候選按鈕（含停用狀態與位置），若送出鍵停用會明確標示「提示詞可能未被 Flow 辨識」

## v1.9.83 更新重點

- **修復送出按鈕抓錯（抓到角色卡 jade_disc）**：`findSubmitButton` 簡化為直接鎖定真正的 `<button>` 且文字含「创建/送出/生成」等關鍵字（排除取消/更多/搜索等），優先選 `arrow_forward` 主送出鍵；不再依賴視窗比例位置，避免 fallback 到角色卡 `DIV[role=button]`

## v1.9.82 更新重點

- **送出前重新確認並補填提示詞**：中間的模型面板、模式/子頁籤切換、素材 picker 等操作可能把 Flow 的輸入框重渲染而清掉提示詞，導致按「創建」時顯示「請輸入提示詞」。現在送出前會檢查輸入框，若提示詞遺失會重新填入
- **加強提示詞輸入框除錯**：列出頁面上所有候選輸入框（含 placeholder/aria-label/class/可見性）與選中元素的 HTML，方便定位是否抓錯輸入框或編輯器框架

## v1.9.81 更新重點

- **修復「創建」按鈕顯示「請輸入提示詞」**：Flow 的提示詞輸入框是 contentEditable 富文字編輯器（ProseMirror 等），其「內部文件狀態」與畫面上的 DOM 文字是分開的。先前直接設 `textContent`／直接呼叫 React handler 只改到畫面、內部 doc 仍是空的，導致按「創建」時 Flow 判定沒有提示詞。現在改為優先使用 `document.execCommand("insertText")`（原生插入，會觸發 beforeinput 讓編輯器更新內部狀態），且不再先清空 DOM；填入後會驗證並記錄編輯器類型與 DOM 狀態

## v1.9.48 更新重點

- **比例選單對應 UI**：比例白名單擴充為 16:9 / 9:16 / 1:1 / 4:3 / 3:4 / 16:10 / 21:9 等，圖片模式支援 4:3、3:4 等全部比例
- **生成數量 x1~x4 修正**：改為直接精確點擊「x1 / x2 / x3 / x4」pill 按鈕，並排除底部「视频 · 720p  x1」等媒體 pill 誤點
- **影片模式「帧 / 素材」子模式**：文字轉影片自動選「素材」、帧數轉影片自動選「帧」pill（支援中英文）

## v1.9.47 更新重點

- **角色加入提示詞修正**：選中角色後自動點擊角色庫面板上的「添加到提示 / add to prompt」按鈕，真正把角色加入提示詞（支援中英文面板文字；該按鈕被禁用時回退到角色卡上的「+」按鈕）


## v1.9.46 更新重點

- **角色卡加入提示詞修正**：選中角色名稱或角色卡後，自動點擊該角色卡上的「+ / 加入」按鈕，真正把角色加入提示詞（不再只點名稱文字）
- **送出按鈕排除媒體卡片**：排除「视频 · 720pcrop」等媒體卡片偽按鈕文字，且不再 fallback 到任意按鈕；找不到真正的創建按鈕時放棄操作


## v1.9.45 更新重點

- **操作步驟依指定順序重構（processOne 四步驟）**：1.提示詞送入 Flow 輸入框（含空值重驗與補填）→ 2.辨識面板模式（文生圖/文生影片等）並完成所有 UI 設定（模型/比例/秒數/生成數量）→ 3.配對成功的角色卡依序加入（可能有 1 張以上）→ 4.最終檢查提示詞仍在後，才按「創建」送出
- **送出按鈕防誤點強化（findSubmitButton）**：新增「生成相同/identical character」等文字的絕對排除規則，且整個角色卡容器（含 12 層上層巢狀節點）內的所有按鈕一律排除；若全頁只剩角色卡內按鈕則放棄操作，不再誤點「產生相同角色卡」
- **模式偵測誤判修正（detectFlowPanelMode）**：模式標籤存在但無明確選中狀態時回傳 null，不再 fallback 誤判為影片模式；並補入「圖片轉影片」等遺漏的模式標籤識別


- **重構提示詞填入為模擬真實輸入**：contentEditable 輸入框改用 `document.execCommand('insertText')` 在游標位置真實插入文字（瀏覽器標準編輯 API），讓 Flow 前端框架正確感知輸入；寫入後以 selection/range 驗證，失敗自動改 fallback 直接 range 插入並重試
- **新增面板模式偵測（detectFlowPanelMode）**：自動辨識目前處於「文生影片 / 圖生影片 / 文生圖片 / 圖生圖片 / 組件轉影片 / 智能體自動化」哪種模式，依模式決定後續 UI 操作路徑
- **UI 設定流程化**：依模式與設定自動選擇模型（Veo 等）、影片比例（16:9/1:1/9:16）、秒數（支援合併選項）、生成數量；找不到設定項時改以文字模糊比對並記錄候選元素供除錯
- **角色卡依序加入**：配對成功的角色卡依序點擊加入提示詞，找不到時列出 picker 候選元素
- **送出按鈕防護**：排除角色卡內按鈕，優先選擇專案區主送出按鈕

## v1.9.43 更新重點

- **修復送出前提示詞驗證誤判（contentEditable 輸入框恆被判為空）**：送出按鈕前的重新驗證原本使用 textarea.value 判斷，但 Flow 的 contentEditable DIV 輸入框沒有 value 屬性，導致恆為空而被誤判、反覆重填仍無法通過。改為使用相容兩種輸入框的取值方式。
- **修正送出按鈕誤點角色卡按鈕**：送出按鈕偵測會排除角色卡內的工具按鈕（如「產生相同角色卡」），優先選擇專案操作區的主送出按鈕。

## v1.9.42 更新重點

- **修復提示詞無法填入 Flow 輸入框的問題（顯示「請輸入提示詞」、按不出創建影片按鈕）**：Google Flow 目前已改用 contentEditable 的 DIV 富文字編輯器作為提示詞輸入框。本次更新讓自動填入邏輯同時支援 textarea 與 contentEditable 輸入框：對 DIV 輸入框改用逐字元直接寫入文字內容並觸發 beforeinput（insertText）與 input 事件，讓 Flow 的前端框架正確偵測到輸入；同時改進輸入框偵測，相容 isContentEditable 屬性與 contenteditable 屬性兩種環境；送出前自動驗證提示詞是否真正寫入成功。

## v1.9.40 更新重點

- **所有模式都會先切換 Flow 的輸出模式**：文字轉影片／幀數轉影片／組件轉影片／智慧體自動化 → 切到「影片」；文字轉圖片／圖片轉圖片 → 切到「圖片」。確保比例、模型、張數等對應選項出現
- **選項設定依模式分流**：圖片模式設定圖片模型（Nano Banana）與圖片來源、不設時長；影片模式設定 Veo 模型與時長

## v1.9.39 更新重點

- **自動切換 Flow 輸出模式為「影片」**：文字轉影片/幀數轉影片執行前，先切換 Flow 輸入框下方的「影片/圖片」開關到影片模式（否則比例、模型、時長等影片選項不會出現）
- **自動設定模型/比例/時長**：改善選項比對（支援含子元素的按鈕/選項），並在找不到時於除錯日誌列出頁面上實際的選項標籤，方便定位
- **按「+」新增命中的素材**：提示詞命中已掃描角色時，自動點輸入框右下角的「+」、在選擇器內勾選對應角色並確認（每一步安全處理，找不到就略過，無法完成會按 Escape 關閉避免卡住）

## v1.9.38 更新重點

- **送出按鈕偵測再強化**：優先從提示詞輸入框「附近」的按鈕找執行/送出按鈕（同在對話框/面板內），標籤加入「執行、Run」；跳過停用按鈕；`click` 同時派發 pointer+mouse 事件以增加 Flow（React）相容性

## v1.9.37 更新重點

- **修復「送出/生成」按鈕偵測**：Flow 繁體介面按鈕為「送出」等，之前只匹配 generate/生成/create，會點到錯誤按鈕導致提示詞未送出。現在涵蓋生成、產生、送出、提交、建立、Generate、Create、Submit，並只考慮可見按鈕
- **修復「儲存到資料夾」**：下載檔現在會依設定建立子資料夾（如 `veo-folder-1/1.mp4`）存放，而非把資料夾名稱前綴到檔名
- **修復中文檔名角色掃描**：角色名稱含中文（如「小美」）時抓不到的問題——掃描名稱正則加入 CJK 字元，且中文名稱允許 2 字元起

## v1.9.36 更新重點

- **修復提示詞輸入框偵測**：之前會抓到 placeholder 為空的錯誤 textarea，導致提示詞沒填進 Flow 真正的輸入框（Flow 顯示「必須提供提示詞」）。現在會依優先序挑選：屬性含 prompt/提示/描述關鍵字 → contentEditable 富文字 → 有非空 placeholder → 任一可見輸入框
- **修復自動下載抓到垃圾檔**：之前會下載 `getMediaUrlRedirect` 與 `=s96-c` 等縮圖/redirect 網址。現在過濾掉這些，只下載 blob 影片、已載入的影片、與夠大的真實圖片

## v1.9.35 更新重點

- **連鎖生成（Chain Prompt）僅保留於「幀數轉影片」模式**：文字轉影片模式移除連鎖生成（不再切換 Flow 面板），避免干擾
- **PROMPT 佇列新增進度百分比條**：每個佇列條目顯示目前處理進度（執行中依時間推進至 95%、完成 100%、失敗 0%）
- **修復「清除快取」按鈕無效**：原本只顯示提示；現在實際清除連鎖斷點與即時預覽幀/影片

## v1.9.34 更新重點

- **修復「停止」按鈕無效**：之前 `stopBatch()` 只重設 UI，從未通知內容腳本，導致佇列仍會跑完。現在按停止會立即送出 `STOP_BATCH` 訊息，內容腳本在重試迴圈與每個 item 開頭也會檢查停止旗標，快速停止

## v1.9.33 更新重點

- **修復文字轉影片連鎖生成的面板切換失敗**：切換到「幀數轉影片」面板的按鈕偵測強化——涵蓋更多中文/英文標籤變體（幀轉影片、帧转视频、Frame to Video、從幀轉換…），並新增屬性比對（aria-label / data-testid / title）與 tab/radio 元素支援；找不到按鈕時除錯日誌會列出頁面上的候選標籤

## v1.9.32 更新重點

- **修復文字轉影片/批次執行被多 frame 並行干擾**：內容腳本以 allFrames 注入時，每個 frame 都會收到 START_BATCH 並各自跑批次，導致「prompt textarea not found」錯誤與重複提交。現在只有「實際含有提示詞輸入框」的 frame 才會執行批次
- **修復快速重複點擊「執行」造成多次批次並行**：`running` 旗標提前鎖定，避免雙擊觸發多個 runBatch
- **提示詞輸入框更穩健**：支援 Flow 改用 contentEditable 富文字編輯器的情況，並在除錯日誌印出實際抓到的輸入框（tagName/placeholder/contentEditable），方便定位「必須提供提示詞」問題

## v1.9.31 更新重點

- **「不在 Flow 專案頁面」彈窗新增任務執行提醒（三語言）**：彈窗中新增說明區塊，提醒使用者——任務執行中請保持 Flow 分頁開啟（不可關閉）；切換到其他分頁時任務仍會繼續但處理速度會變慢；關閉 Flow 分頁或讓電腦休眠會中斷任務。以警示底色區塊呈現，與彈窗主資訊區隔。

## v1.9.30 更新重點

- **八項 UI 樣式優化**：即時預覽面板「完成」狀態改用主題色彩變數（--success）正確顯示綠色；預覽卡片邊框改以主題變數呈現，明亮主題不再出現突兀綠線；小按鈕圓角統一為 8px；角色多選清單加 hover 背景回饋；停止按鈕文字白色；佇列長提示詞 hover 顯示完整文字；全部可點擊元素加鍵盤聚焦外框；拖曳排序手把改常駐半透明顯示，兩套主題均有對應配色。

## v1.9.29 更新重點

- **停用語音狀態視覺區分**：「各段秒數設定」與「自動新增角色」面板中，語音行顯示「本段不套用語音」或「依 Veo 自動生成（不套用語音）」時，改為更淺的灰色斜體樣式（兩套主題均已對應），與正常套用語音的行明顯區隔，便於快速識別。

## v1.9.28 更新重點

- **語音行顯示明確標示為「旁白語音」**：「各段秒數設定」與「自動新增角色」面板的語音行，改為「🎙 旁白語音：Achernar · 男」等格式，一眼即可區分此為旁白（TTS）語音、與 Veo 自動生成的角色對話聲音（男女聲自動配對）無關；使用「預設說話者」時附「（預設）」標記（三語言同步）。

## v1.9.27 更新重點

- **清除殘留的「旁白稿」錯誤文案（三語言）**：「匯入旁白稿」功能早已刪除（與匯入提示詞合併），但介面說明仍有「唸旁白稿」等錯誤描述。全面修正：開關改為「**自動套用語音（按說話者自動選語音）**」，說明改為「自動選擇語音並填入 Flow 的語音設定欄位……角色對話的聲音由 Veo 自動生成（男女聲自動配對），與此設定無關」；語音行顯示文案中的「旁白」也一併改為「語音」（例如「依 Veo 自動生成（不套用語音）」）。

## v1.9.25 更新重點

- **「預設說話者」下拉選單新增「無」選項**：下拉最上方新增「無（不套用語音）」選項，選取後未命中的段落不設定語音，由 Flow 依內建行為處理，設定更彈性。

## v1.9.24 更新重點

- **分段語音彈性切換（[NOVOICE] 標籤）**：在任何段落的提示詞中加入 `[NOVOICE]`，該段即不套用語音設定（不填入 Flow 的語音欄位），由 Veo 自動生成角色聲音接管（男女聲依角色自動配對）；標籤會於送出前自動清除，不會出現在影片中。其餘段落仍正常套用語音設定。
- **無語音設定時的明確提示**：未設定預設說話者且提示詞無命中語音時，語音行改為顯示「依 Veo 自動生成（不套用語音）」，清楚告知該段將由 Veo 自動配音。
- **佇列即時標記**：含有 `[NOVOICE]` 的段落，在即時佇列列表中會顯示 `[NOVOICE]` 標記，方便確認哪些段落不套用語音。

## v1.9.23 更新重點

- **自動新增角色配對顯示改為分行顯示**：每段提示詞下方現在分兩行顯示——第一行顯示命中的角色（附縮圖），第二行顯示該段使用的語音（🎙 說話者名稱，無命中時顯示預設說話者），版面更清晰易讀。

## v1.9.22 更新重點

- **自動新增角色自動掃描與配對顯示**：打勾「自動新增角色」後，擴充自動抓取 Flow 頁面上的角色並依提示詞配對，顯示「已自動匹配 N 個角色」與各段提示詞命中的角色名稱（附縮圖）；不在 Flow 頁面時自動切回手動模式並提示。

## v1.9.21 更新重點

- 各段秒數設定面板加強：貼入 Prompts 分段解析後，每段即時顯示命中的角色名稱（附角色縮圖）與該段將使用的語音（含性別、語調），與內容腳本的匹配邏輯完全一致；支援語音的頁面顯示語音行，角色名單或下拉勾選變更時即時重繪。


## v1.9.20 更新重點
- 修復「偵數轉影片」頁籤的「圖片處理選項」下拉：之前選「首幀／首尾幀／全部」不會保存與生效，現在切換後立即保存設定，內容腳本依選擇實際套用（保留第一段的最後一幀／保留第一與最後一段的最後一幀／保留每段最後一幀）

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
| ~~旁白稿批次匯入~~ (已移除) | 此功能已與「匯入提示詞 .txt / .csv」合併；現以單一按鈕處理所有文字匯入，不再獨立的旁白稿匯入按鈕 |
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
