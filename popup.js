// ============================================================
// Flow Automation — Chrome Extension Popup
// Batch generate and auto-download videos on Google Flow
// ============================================================

const STORAGE_KEY = "flowAutomationSettings";
const FLOW_URL = "https://labs.google/fx/tools/flow";

// ---------------- i18n ----------------
const i18n = {
  "zh-TW": {
    tabControl: "控制", tabSettings: "設定",
    modeText2Video: "文字轉影片", modeFrame2Video: "幀轉影片",
    modeComp2Video: "組件轉影片", modeText2Image: "文字轉圖片",
    modeImage2Image: "圖片轉圖片", modeAgent: "智慧體自動化",
    labelConcurrent: "並行 Prompt",
    hintConcurrent: "同時處理的 prompt 數量。",
    labelRandomWait: "隨機等待",
    hintRandomWait: "處理下一個提示詞前的隨機等待時間。",
    uploadTitle: "點選上傳或拖曳",
    uploadHint: "PNG, JPG, GIF 每個大小不超過 50MB",
    labelFrameOption: "圖片處理選項",
    toggleChain: "Chain Prompt 連鎖生成 ⛓",
    hintChain: "自動將上一段影片的最後一格畫面作為下一個 prompt 的輸入圖片。",
    hintChainNote: "啟用連鎖生成時，將依序逐一處理 prompt，無法並行。",
    hintPrompts: "用空行分隔每個 prompt。",
    toggleCharacter: "自動新增角色 (Google Flow 功能)",
    hintCharacter: "當提示詞中提及角色時，自動選擇對應角色。",
    labelDefaultChar: "預設角色",
    hintCharScan: "尚未掃描任何角色。請在 Google Flow 中開啟一個專案，然後點選「掃描角色」按鈕。",
    labelMaxImages: "每個 prompt 的最大輸入圖片數",
    hintMaxImages: "每段提示詞處理時最多使用的輸入圖片數量。",
    toggleCharImages: "自動新增角色圖片",
    hintCharImages: "自動新增與 prompt 中角色名稱相符的圖片（根據檔名）。",
    toggleVoice: "按說話者自動新增語音",
    hintVoice: "當 prompt 中提到說話者名稱時，自動選擇對應的語音。",
    labelDefaultVoice: "預設說話者",
    voiceDefault: "未設定語音",
    labelOutputs: "每個 prompt 的輸出數量",
    hintOutputs: "每個 prompt 需要生成的圖片/影片數量。",
    labelFolder: "儲存到資料夾",
    hintFolder: "下載檔案的子資料夾。",
    hintSettingsMore: "在「設定」分頁中自訂寬高比、時長與數量以獲得更多控制。",
    toggleRename: "自動重新命名檔案",
    labelWatermark: "移除 VEO 浮水印",
    labelImageMode: "預設圖片模式",
    hintImageMode: "圖片提示詞的預設輸入選項。最後一個提示詞將使用新圖片。",
    imageModeNew: "新圖片", imageModeLast: "上一張圖片",
    labelVideoRes: "自動下載品質（影片）",
    hintVideoRes: "選擇自動下載的影片品質。",
    videoRes720p: "720p", videoRes1080p: "1080p（需 Ultra/Pro 方案）", videoRes4k: "4K（需 Ultra/Pro 方案）",
    labelImageRes: "自動下載品質（圖片）",
    hintImageRes: "選擇自動下載的圖片品質。",
    imageResNone: "不下載", imageRes1k: "1K", imageRes2k: "2K", imageRes4k: "4K（需 Ultra 方案）",
    labelDurationOpt: "預設影片長度",
    hintDurationOpt: "提示詞的預設時長設定。最後一個提示詞將使用 6 秒或 10 秒。",
    labelImageModel: "圖像模型",
    hintImageModel: "選擇用於文字轉圖片生成的 AI 模型。",
    labelDefaultMode: "預設模式",
    hintDefaultMode: "建立新影片時的預設模式。",
    notFlowPage: "不在 Flow 專案頁面",
    notFlowHint: "Flow 自動化工具僅在 Flow 專案頁面上可用。",
    goToFlow: "前往 Flow",
    openInTab: "在新分頁開啟",
    tabDebug: "調試日誌報告",
    labelDownloadSettings: "下載設定",
    hintDownloadSettings: "影片將下載到 Chrome 的下載資料夾。每個專案將有自己的資料夾來儲存影片。",
    hintSettingsSync: "設定會自動在所有瀏覽器分頁中同步。",
    debugTitle: "調試日誌報告",
    debugAutoScroll: "自動滾動",
    debugCopy: "複製",
    debugClear: "清除",
    debugStatus: "%N% 條",
    debugEmpty: "暫無日誌。開始自動化後，活動將顯示在此處。",
    debugCopied: "已複製日誌",
    debugExport: "匯出",
    debugExportDone: "日誌已匯出為 %N%",
    repoLabel: "GitHub",
    labelWatermarkSite: "前往網站",
    sidePanelUnsupported: "此環境不支援側邊面板，已改為新分頁開啟",
    queueTitle: "PROMPT 佇列",
    queueCount: "%N% 個任務",
    queueEmpty: "佇列是空的。新增 Prompts 並點選「執行」。",
    btnReport: "回報<br>錯誤",
    btnClearCache: "清除<br>快取",
    btnClear: "清除",
    btnRun: "執行",
    btnStop: "停止",
    labelAspect: "寬高比",
    labelModel: "模型",
    labelDownloadRes: "下載解析度",
    labelDuration: "時長（秒）",
    labelLanguage: "語言 Language",
    labelTheme: "主題",
    hintTheme: "選擇擴充功能的介面配色主題。",
    themeDark: "暗黑（綠黑白）",
    themeLight: "明亮（普羅旺斯・粉黑白）",
    btnSaveSettings: "保存設定",
    btnResetDefaults: "重置為預設值",
    saveDone: "設定已保存。",
    resetDone: "已重置為預設值。",
    previewTitle: "連鎖預覽即時管理面板",
    previewHint: "執行中自動生成：每段最後一幀圖片副本 + 已生成影片播放。",
    previewEmpty: "暫無預覽。開始連鎖生成後，每完成一段會自動新增最後一幀副本。",
    resumeHint: "偵測到未完成的連鎖紀錄（第 %N% 段），點選「斷點續跑」繼續。",
    resumeStarted: "已從斷點繼續第 %N% 段。",
    checkpointSaved: "連鎖斷點已儲存。下次可點「斷點續跑」繼續。",
    previewFrameDl: "儲存幀副本",
    previewSeg: "段 %N%",
    previewStatusCapturing: "生成中…",
    previewStatusDone: "完成",
    previewReplace: "替換幀",
    previewRetry: "已重試",
    previewColorGap: "色彩過渡不連續，已自動重試",
    exportBtn: "📦 匯出專案",
    exportTitle: "匯出連鎖專案",
    exportStart: "正在打包專案…",
    exportDone: "專案已打包完成並開始下載：",
    exportNoData: "沒有可匯出的內容。請先執行連鎖生成或上傳幀與輸入 prompts。",
    exportFail: "匯出失敗，請稍後再試。",
    dragDoneLocked: "已完成段落無法調整順序。",
    dragSuccess: "連鎖順序已調整（第 %N% 段）。",
    replaceSuccess: "第 %N% 段輸入幀已替換。",
    notOnFlow: "請先開啟 Google Flow 網站後再使用本擴充功能。",
    openFlow: "是否開啟 Google Flow？",
    running: "執行中…",
    startSuccess: "已開始批次處理，請勿關閉 Flow 頁面。",
    stopped: "已停止批次處理。",
    btnNarration: "匯入旁白稿 .txt / .csv",
    narrationClear: "移除旁白稿",
    narrationLoaded: "已匯入 %N% 段旁白稿，將自動附加到對應分段提示詞。",
    narrationRemoved: "已移除旁白稿。",
    narrationMismatch: "旁白稿共 %N1% 段，提示詞共 %N2% 段，依序一一對應（多出部分僅附加到對應段落）。",
        narrationNoPrompts: "請先在下方填寫或匯入 Prompts，再匯入旁白稿。",
    labelPrompts: "Prompts",
    uploadTxt: "上傳 .txt",
    uploadCsv: "上傳 .xlsx / .csv",
    narrClearTitle: "移除旁白稿",
    promptsPlaceholder: "在此貼上提示詞。每個 prompt 用空行分隔。\n\n範例：\n第一個長 prompt。\n可以跨越多行。\n\n第二個 prompt 在空行後開始。\n\n第三個 prompt。",
    btnScanChars: "掃描角色",
    optCharNone: "無",
    optCharUnavailable: "沒有可用選項",
    optConc1: "1 個 prompt", optConc2: "2 個 prompt", optConc3: "3 個 prompt", optConc4: "4 個 prompt",
    optFrameFirst: "保留第一段的最後一幀", optFrameFirstLast: "保留第一與最後一段的最後一幀", optFrameAll: "保留每段最後一幀", optMaxImages1: "1 張", optMaxImages2: "2 張", optMaxImages3: "3 張", optMaxImages4: "4 張", optMaxImages5: "5 張", optMaxImages6: "6 張", optMaxImages7: "7 張", optMaxImages8: "8 張", optMaxImages9: "9 張", optMaxImages10: "10 張",
    optDefaultMode1: "文字轉影片", optDefaultMode2: "幀轉影片", optDefaultMode3: "組件化影片", optDefaultMode4: "文字轉圖片", optDefaultMode5: "圖片轉圖片", optDefaultMode6: "智能體自動化",
    hintModel: "選擇要使用的影片生成模型。",
    hintAspect: "選擇輸出的寬高比。",
    btnResume: "斷點續跑", optAspect169: "16:9（YouTube）", optAspect916: "9:16（Shorts/Reels）", optAspect11: "1:1（方形）", optAspect34: "3:4（直式）", optAspect43: "4:3（橫式）",
    optDuration4: "4 秒", optDuration6: "6 秒", optDuration8: "8 秒", optDuration10: "10 秒", optDuration4Merge: "4 秒（合併）Ultra 方案", optDuration6Merge: "6 秒（合併）Ultra 方案",
    optImageModeNew: "新圖片", optImageModeLast: "上一張圖片",
    optVideoRes720: "720p", optVideoRes1080: "1080p（Ultra/Pro 方案）", optVideoRes4k: "4K（Ultra/Pro 方案）",
    optImageResNone: "不下載", optImageRes1k: "1K", optImageRes2k: "2K", optImageRes4k: "4K（Ultra 方案）",
    optThemeDark: "暗黑（綠黑白）", optThemeLight: "明亮（普羅旺斯・粉黑白）",
    optLangTw: "繁體中文", optLangCn: "简体中文", optLangEn: "English",
    chromeDownloadsTitle: "開啟 Chrome 下載設定",
    debugCopyTitle: "複製日誌", debugClearTitle: "清除日誌", debugExportTitle: "匯出日誌",
    reportTitle: "回報錯誤", clearCacheTitle: "清除快取", clearTitle: "清除",
    resumeTitle: "斷點續跑",
    clearPreviewTitle: "清除預覽",
    btnSaveSettings: "保存設定", btnResetDefaults: "重置為預設值",
    saveDone: "設定已保存。", resetDone: "已重置為預設值。",
    repoTitle: "GitHub 倉庫",
    swapTitle: "交換",
    scanNone: "未找到角色，請先在 Flow 中開啟一個專案。",
    scanFound: "已掃描到 %N% 個角色。",
    toastAlreadyRunning: "正在執行中",
    toastPreviewCleared: "預覽與斷點已清除",
    toastCsvOnly: "目前僅支援 .csv 純文字格式",
    toastNoCheckpoint: "沒有找到可續跑的斷點",
    toastFramesFirst: "請先上傳幀圖片（或開啟連鎖生成以用 Flow 輸出作為起始幀）",
    toastPromptsFirst: "沒有 Prompts，請先新增",
    toastLogsExport: "沒有日誌可匯出",
    toastLogsCopy: "沒有日誌可複製",
    toastNarrEmpty: "旁白稿為空，無法匯入。",
    toastCacheCleared: "快取已清除",
    toastCleared: "已清除",
    dragHandleTitle: "拖曳調整順序",
    toastFileSkip: "%N1% 超過 50MB，已跳過",
    toastScanFail: "掃描失敗：%N1%",
    toastStartFail: "啟動失敗：%N1%",
    toastCopyFail: "複製失敗，請手動選擇複製。",
    statusPending: "等待中", statusRunning: "執行中", statusDone: "已完成", statusError: "失敗", statusRetrying: "重試中",
    narrLabel: "旁白：",
    uploadHintZh: "PNG, JPG, GIF 每個大小不超過 50MB",
  },

  en: {
    tabControl: "Control", tabSettings: "Settings",
    modeText2Video: "Text to Video", modeFrame2Video: "Frame to Video",
    modeComp2Video: "Components to Video", modeText2Image: "Text to Image",
    modeImage2Image: "Image to Image", modeAgent: "Agent Automation",
    labelConcurrent: "Concurrent Prompts",
    hintConcurrent: "Number of prompts processed at the same time.",
    labelRandomWait: "Random Wait",
    hintRandomWait: "Random wait before processing the next prompt.",
    uploadTitle: "Click to upload or drag",
    uploadHint: "PNG, JPG, GIF each under 50MB",
    labelFrameOption: "Frame processing option",
    toggleChain: "Chain Prompt Chaining ⛓",
    hintChain: "Automatically use the last frame of the previous video as the input image for the next prompt.",
    hintChainNote: "When chaining is enabled, prompts are processed one by one in order (no concurrency).",
    hintPrompts: "Separate each prompt with blank lines.",
    toggleCharacter: "Auto-add character (Google Flow feature)",
    hintCharacter: "Automatically select the character when it is mentioned in a prompt.",
    labelDefaultChar: "Default character",
    hintCharScan: "No characters scanned yet. Open a project in Google Flow and click \"Scan characters\".",
    labelMaxImages: "Max input images per prompt",
    hintMaxImages: "Maximum number of input images used per prompt.",
    toggleCharImages: "Auto-add character images",
    hintCharImages: "Auto-add images whose file names match character names mentioned in the prompt.",
    toggleVoice: "Auto-add voice by speaker",
    hintVoice: "When a prompt mentions a speaker name, automatically select the corresponding voice.",
    labelDefaultVoice: "Default speaker",
    voiceDefault: "No voice configured",
    labelOutputs: "Outputs per prompt",
    hintOutputs: "Number of images/videos to generate per prompt.",
    labelFolder: "Save to folder",
    hintFolder: "Sub-folder for downloaded files.",
    hintSettingsMore: "Customize aspect ratio, duration and count in the Settings tab for more control.",
    toggleRename: "Auto rename files",
    labelWatermark: "Remove VEO watermark",
    labelImageMode: "Default image mode",
    hintImageMode: "Default input option for image prompts. The last prompt will always use a new image.",
    imageModeNew: "New image", imageModeLast: "Previous image",
    labelVideoRes: "Auto-download quality (video)",
    hintVideoRes: "Choose the auto-download video quality.",
    videoRes720p: "720p", videoRes1080p: "1080p (Ultra/Pro plan required)", videoRes4k: "4K (Ultra/Pro plan required)",
    labelImageRes: "Auto-download quality (image)",
    hintImageRes: "Choose the auto-download image quality.",
    imageResNone: "No download", imageRes1k: "1K", imageRes2k: "2K", imageRes4k: "4K (Ultra plan required)",
    labelDurationOpt: "Default video length",
    hintDurationOpt: "Default duration setting for prompts. The last prompt will always use 6s or 10s.",
    labelImageModel: "Image model",
    hintImageModel: "Choose the AI model for text-to-image generation.",
    labelDefaultMode: "Default mode",
    hintDefaultMode: "Default mode when creating new videos.",
    notFlowPage: "Not on a Flow project page",
    notFlowHint: "Flow Automation is only available on Flow project pages.",
    goToFlow: "Go to Flow",
    openInTab: "Open in a new tab",
    tabDebug: "Debug log report",
    labelDownloadSettings: "Download settings",
    hintDownloadSettings: "Videos will be downloaded to the Chrome download folder. Each project gets its own folder to store videos.",
    hintSettingsSync: "Settings are automatically synced across all browser tabs.",
    debugTitle: "Debug log report",
    debugAutoScroll: "Auto-scroll",
    debugCopy: "Copy",
    debugClear: "Clear",
    debugStatus: "%N% entries",
    debugEmpty: "No logs yet. Activity will appear here once automation starts.",
    debugCopied: "Log copied",
    debugExport: "Export",
    debugExportDone: "Log exported as %N%",
    repoLabel: "GitHub",
    sidePanelUnsupported: "Side panel is not supported here; opened in a new tab instead",
    queueTitle: "PROMPT Queue",
    queueCount: "%N% tasks",
    queueEmpty: "Queue is empty. Add prompts and click \"Run\".",
    btnReport: "Report<br>bug",
    btnClearCache: "Clear<br>cache",
    btnClear: "Clear",
    btnRun: "Run",
    btnStop: "Stop",
    labelAspect: "Aspect ratio",
    labelModel: "Model",
    labelDownloadRes: "Download resolution",
    labelDuration: "Duration (sec)",
    labelLanguage: "Language",
    labelTheme: "Theme",
    hintTheme: "Choose the UI color theme of the extension.",
    themeDark: "Dark (green)",
    themeLight: "Light (Provence pink)",
    optLangTw: "Traditional Chinese",
    optLangCn: "Simplified Chinese",
    optLangEn: "English",
    repoTitle: "GitHub repo",
    swapTitle: "Swap",
    labelPrompts: "Prompts",
    uploadTxt: "Upload .txt",
    uploadCsv: "Upload .xlsx / .csv",
    narrClearTitle: "Remove imported narration",
    promptsPlaceholder: "Example:\nA long prompt.\nCan span multiple lines.\n\nThe second prompt starts after a blank line.\n\nThe third prompt.",
    btnScanChars: "Scan characters",
    optCharNone: "None",
    optCharUnavailable: "No available options",
    optConc1: "1 prompt", optConc2: "2 prompts", optConc3: "3 prompts", optConc4: "4 prompts",
    optFrameFirst: "Use start frame only", optFrameFirstLast: "Use first and last frames", optFrameAll: "Use all frames",
    optMaxImages1: "1 image", optMaxImages2: "2 images", optMaxImages3: "3 images", optMaxImages4: "4 images",
    optMaxImages5: "5 images", optMaxImages6: "6 images", optMaxImages7: "7 images", optMaxImages8: "8 images",
    optMaxImages9: "9 images", optMaxImages10: "10 images",
    optDefaultMode1: "Text to Video", optDefaultMode2: "Frame to Video", optDefaultMode3: "Components to Video",
    optDefaultMode4: "Text to Image", optDefaultMode5: "Image to Image", optDefaultMode6: "Agent Automation",
    hintModel: "Choose the video generation model.",
    hintAspect: "Select the output aspect ratio.",
    btnResume: "Resume", optAspect169: "16:9 (YouTube)", optAspect916: "9:16 (Shorts/Reels)", optAspect11: "1:1 (Square)", optAspect34: "3:4 (Portrait)", optAspect43: "4:3 (Landscape)",
    optDuration4: "4s", optDuration6: "6s", optDuration8: "8s", optDuration10: "10s",
    optDuration4Merge: "4s (merged) - Ultra plan", optDuration6Merge: "6s (merged) - Ultra plan",
    optImageModeNew: "New image", optImageModeLast: "Previous image",
    optVideoRes720: "720p", optVideoRes1080: "1080p (Ultra/Pro plan)", optVideoRes4k: "4K (Ultra/Pro plan)",
    optImageResNone: "No download", optImageRes1k: "1K", optImageRes2k: "2K", optImageRes4k: "4K (Ultra plan)",
    chromeDownloadsTitle: "Open Chrome download settings",
    debugCopyTitle: "Copy log", debugClearTitle: "Clear log", debugExportTitle: "Export log",
    reportTitle: "Report a bug", clearCacheTitle: "Clear cache", clearTitle: "Clear",
    resumeTitle: "Resume from checkpoint",
    exportTitle: "Export whole chain project",
    clearPreviewTitle: "Clear preview",
    exportStart: "Packaging project…",
    btnSaveSettings: "Save settings",
    btnResetDefaults: "Reset to defaults",
    saveDone: "Settings saved.",
    resetDone: "Settings reset to defaults.",
    previewTitle: "Chain Preview Live Panel",
    previewHint: "Auto-generated during run: last-frame copy of each segment + playable videos.",
    previewEmpty: "No previews yet. After starting the chain, a last-frame copy is added for each completed segment.",
    resumeHint: "Found an unfinished chain record (segment %N%). Click \"Resume\" to continue.",
    resumeStarted: "Resumed from segment %N%.",
    checkpointSaved: "Chain checkpoint saved. Use \"Resume\" next time to continue.",
    previewFrameDl: "Save frame copy",
    previewSeg: "Segment %N%",
    previewStatusCapturing: "Generating…",
    previewStatusDone: "Done",
    previewReplace: "Replace frame",
    previewRetry: "Retried",
    previewColorGap: "Color transition gap detected, auto retried",
    exportBtn: "📦 Export project",
    exportTitle: "Export chain project",
    exportStart: "Packaging project...",
    exportDone: "Project packed and downloading:",
    exportNoData: "Nothing to export. Run the chain or add prompts and frames first.",
    exportFail: "Export failed, please try again.",
    dragDoneLocked: "Completed segments are locked and cannot be reordered.",
    dragSuccess: "Chain order adjusted (segment %N%).",
    replaceSuccess: "Input frame of segment %N% replaced.",
    notOnFlow: "Please open the Google Flow website before using this extension.",
    openFlow: "Open Google Flow now?",
    running: "Running…",
    startSuccess: "Batch processing started. Do not close the Flow tab.",
    stopped: "Batch processing stopped.",
    btnNarration: "Import narration script .txt / .csv",
    narrationClear: "Remove narration",
    narrationLoaded: "%N% narration segments imported — auto-appended to matching prompts.",
    narrationRemoved: "Narration script removed.",
    narrationMismatch: "Narration has %N1% segments, prompts have %N2%. Segments map one-to-one in order (extra parts only append to matching prompts).",
    narrationNoPrompts: "Please add prompts first, then import the narration script.",
    scanNone: "No characters found. Open a project in Flow first.",
    scanFound: "Scanned %N% characters.",
    labelWatermarkSite: "Visit website",
    toastAlreadyRunning: "Already running",
    toastPreviewCleared: "Preview and checkpoint cleared",
    toastCsvOnly: "Currently only plain-text .csv is supported",
    toastNoCheckpoint: "No checkpoint found to resume",
    toastFramesFirst: "Please upload frames first (or enable Chain Prompt to start from Flow output)",
    toastPromptsFirst: "No prompts. Please add prompts first",
    toastLogsExport: "No logs to export",
    toastLogsCopy: "No logs to copy",
    toastNarrEmpty: "Narration script is empty, cannot import.",
    toastCacheCleared: "Cache cleared",
    toastCleared: "Cleared",
    dragHandleTitle: "Drag to reorder",
    toastFileSkip: "%N1% exceeds 50MB, skipped",
    toastScanFail: "Scan failed: %N1%",
    toastStartFail: "Failed to start: %N1%",
    toastCopyFail: "Copy failed. Please select and copy manually.",
    statusPending: "Pending", statusRunning: "Running", statusDone: "Done", statusError: "Failed", statusRetrying: "Retrying",
    narrLabel: "Narration: ",
    uploadHintZh: "PNG, JPG, GIF each under 50MB",
  },
  "zh-CN": {
    tabControl: "控制", tabSettings: "设置",
    modeText2Video: "文本转视频", modeFrame2Video: "帧转视频",
    modeComp2Video: "组件化视频", modeText2Image: "文本转图片",
    modeImage2Image: "图片转图片", modeAgent: "智能体自动化",
    labelConcurrent: "并发 Prompt",
    hintConcurrent: "同时处理的 prompt 数量。",
    labelRandomWait: "随机等待",
    hintRandomWait: "处理下一个提示前的随机等待时间。",
    uploadTitle: "点击上传或拖拽",
    uploadHint: "PNG, JPG, GIF 每个大小不超过 50MB",
    labelFrameOption: "图片处理选项",
    toggleChain: "Chain Prompt 连锁生成 ⛓",
    hintChain: "自动将上一个视频的最后画面作为下一个 prompt 的输入图片。",
    hintChainNote: "启用连锁生成时，将按顺序逐个处理 prompt，无法并发。",
    hintPrompts: "用空行分隔每个 prompt。",
    toggleCharacter: "Auto-add character (Google Flow feature)",
    hintCharacter: "当提示词中提及角色时，自动选择对应角色。",
    labelDefaultChar: "默认角色",
    hintCharScan: "尚未扫描任何角色。请在 Google Flow 中打开一个项目，然后点击「扫描角色」按钮。",
    labelMaxImages: "每个 prompt 的最大输入图片数",
    hintMaxImages: "每段提示词处理时最多使用的输入图片数量。",
    toggleCharImages: "自动添加角色图片",
    hintCharImages: "自动添加与 prompt 中角色名称匹配的图片（基于文件名）。",
    toggleVoice: "按说话者自动添加语音",
    hintVoice: "当 prompt 中提到说话者名称时，自动选择对应的语音。",
    labelDefaultVoice: "默认说话者",
    voiceDefault: "未配置语音",
    labelOutputs: "每个 prompt 的输出数量",
    hintOutputs: "每个 prompt 需要生成的图片/视频数量。",
    labelFolder: "保存到文件夹",
    hintFolder: "下载文件的子文件夹。",
    hintSettingsMore: "在「设置」标签中自定义宽高比、时长和数量以获得更多控制。",
    toggleRename: "自动更改文件名",
    labelWatermark: "删除 VEO 标志",
    labelImageMode: "默认图片模式选项",
    hintImageMode: "图片提示词的默认输入选项。最后一个提示词将始终使用新图片。",
    imageModeNew: "新图片", imageModeLast: "上一张图片",
    labelVideoRes: "自动下载质量（视频）",
    hintVideoRes: "选择自动下载的视频质量。",
    videoRes720p: "720p", videoRes1080p: "1080p（需要 Ultra/Pro 方案）", videoRes4k: "4K（需要 Ultra/Pro 方案）",
    labelImageRes: "自动下载质量（图片）",
    hintImageRes: "选择自动下载的图片质量。",
    imageResNone: "不下载", imageRes1k: "1K", imageRes2k: "2K", imageRes4k: "4K（需要 Ultra 方案）",
    labelDurationOpt: "默认视频选项",
    hintDurationOpt: "提示词的默认时长设置（6秒、10秒、6秒合并或10秒合并）。最后一个提示词将始终使用6秒或10秒。",
    labelImageModel: "图像模型",
    hintImageModel: "选择用于文本转图像生成的 AI 模型。",
    labelDefaultMode: "默认模式",
    hintDefaultMode: "创建新视频时的默认模式。",
    notFlowPage: "不在 Flow 项目页面",
    notFlowHint: "Flow 自动化工具仅在 Flow 项目页面上可用。",
    goToFlow: "前往 Flow",
    openInTab: "在新标签页打开",
    tabDebug: "调试日志报告",
    labelDownloadSettings: "下载设置",
    hintDownloadSettings: "视频将下载到 Chrome 的下载文件夹。每个项目将有自己的文件夹来存储视频。",
    hintSettingsSync: "设置会自动在所有浏览器标签页中同步。",
    debugTitle: "调试日志报告",
    debugAutoScroll: "自动滚动",
    debugCopy: "复制",
    debugClear: "清除",
    debugStatus: "%N% 条",
    debugEmpty: "暂无日志。开始自动化后，活动将显示在此处。",
    debugCopied: "已复制日志",
    debugExport: "导出",
    debugExportDone: "日志已导出为 %N%",
    repoLabel: "GitHub",
    sidePanelUnsupported: "此环境不支持侧边面板，已改为新标签页打开",
    queueTitle: "PROMPT 队列",
    queueCount: "%N% 个任务",
    queueEmpty: "队列是空的。添加 Prompts 并点击「运行」。",
    btnReport: "报告<br>错误",
    btnClearCache: "清除<br>缓存",
    btnClear: "清除",
    btnRun: "运行",
    btnStop: "停止",
    labelAspect: "宽高比",
    labelModel: "模型",
    labelDownloadRes: "下载分辨率",
    labelDuration: "时长（秒）",
    labelLanguage: "Language",
    labelTheme: "主题",
    hintTheme: "选择扩展的界面配色主题。",
    themeDark: "暗黑（绿黑白）",
    themeLight: "明亮（普罗旺斯・粉黑白）",
    optLangTw: "中文（繁體）",
    optLangCn: "简体中文",
    optLangEn: "English",
    repoTitle: "GitHub 仓库",
    swapTitle: "交换",
    labelPrompts: "Prompts",
    uploadTxt: "上传 .txt 文件",
    uploadCsv: "上传 .xlsx / .csv",
    narrClearTitle: "移除已导入的旁白稿",
    promptsPlaceholder: "示例：\n第一个长 prompt。\n可以跨越多行。\n\n第二个 prompt 在空行后开始。\n\n第三个 prompt。",
    btnScanChars: "扫描角色",
    optCharNone: "无",
    optCharUnavailable: "没有可用选项",
    optConc1: "1 个 prompt", optConc2: "2 个 prompt", optConc3: "3 个 prompt", optConc4: "4 个 prompt",
    optFrameFirst: "每个 prompt 仅使用开始帧", optFrameFirstLast: "每个 prompt 使用首尾帧", optFrameAll: "每个 prompt 使用全部帧",
    optMaxImages1: "1 张图片", optMaxImages2: "2 张图片", optMaxImages3: "3 张图片", optMaxImages4: "4 张图片",
    optMaxImages5: "5 张图片", optMaxImages6: "6 张图片", optMaxImages7: "7 张图片", optMaxImages8: "8 张图片",
    optMaxImages9: "9 张图片", optMaxImages10: "10 张图片",
    optDefaultMode1: "文本转视频", optDefaultMode2: "帧转视频", optDefaultMode3: "组件化视频",
    optDefaultMode4: "文本转图片", optDefaultMode5: "图片转图片", optDefaultMode6: "智能体自动化",
    hintModel: "选择要使用的视频生成模型。",
    hintAspect: "选择输出的宽高比。",
    btnResume: "断点续跑", optAspect169: "16:9 (YouTube)", optAspect916: "9:16 (短视频/Reels)", optAspect11: "1:1 (方形)", optAspect34: "3:4 (竖版)", optAspect43: "4:3 (横版)",
    optDuration4: "4秒", optDuration6: "6秒", optDuration8: "8秒", optDuration10: "10秒",
    optDuration4Merge: "4秒（合并）- 需 Ultra 方案", optDuration6Merge: "6秒（合并）- 需 Ultra 方案",
    optImageModeNew: "新图片", optImageModeLast: "上一张图片",
    optVideoRes720: "720p", optVideoRes1080: "1080p（需要 Ultra/Pro 方案）", optVideoRes4k: "4K（需要 Ultra/Pro 方案）",
    optImageResNone: "不下载", optImageRes1k: "1K", optImageRes2k: "2K", optImageRes4k: "4K（需要 Ultra 方案）",
    chromeDownloadsTitle: "打开 Chrome 下载设置",
    debugCopyTitle: "复制日志", debugClearTitle: "清除日志", debugExportTitle: "导出日志",
    reportTitle: "报告错误", clearCacheTitle: "清除缓存", clearTitle: "清除",
    resumeTitle: "从断点继续",
    exportTitle: "一键导出整条连锁项目",
    clearPreviewTitle: "清除预览",
    exportStart: "正在打包项目…",
    btnSaveSettings: "保存设置",
    btnResetDefaults: "重置为默认值",
    saveDone: "设置已保存。",
    resetDone: "已重置为默认值。",
    previewTitle: "连锁预览 实时管理面板",
    previewHint: "运行中自动生成：每段最后一帧图片副本 + 已生成视频播放。",
    previewEmpty: "暂无预览。开始连锁生成后，每完成一段会自动添加最后一帧副本。",
    resumeHint: "检测到未完成的连锁记录（第 %N% 段），点击「断点续跑」继续。",
    resumeStarted: "已从断点继续第 %N% 段。",
    checkpointSaved: "连锁断点已保存。下次可点「断点续跑」继续。",
    previewFrameDl: "保存帧副本",
    previewSeg: "段 %N%",
    previewStatusCapturing: "生成中…",
    previewStatusDone: "完成",
    previewReplace: "替换帧",
    previewRetry: "重试过",
    previewColorGap: "色彩过渡不连续，已自动重试",
    exportBtn: "📦 导出专案",
    exportTitle: "导出连锁专案",
    exportStart: "正在打包专案…",
    exportDone: "专案已打包完成并开始下载：",
    exportNoData: "没有可导出的内容。请先执行连锁生成或上传帧与输入 prompts。",
    exportFail: "导出失败，请稍后再试。",
    dragDoneLocked: "已完成段不可移动顺序。",
    dragSuccess: "连锁顺序已调整（第 %N% 段）。",
    replaceSuccess: "第 %N% 段输入帧已替换。",
    notOnFlow: "请先打开 Google Flow 网站后使用本扩展。",
    openFlow: "是否打开 Google Flow?",
    running: "运行中…",
    startSuccess: "已开始批量处理,请勿关闭 Flow 页面。",
    stopped: "已停止批量处理。",
    btnNarration: "导入旁白稿 .txt / .csv",
    narrationClear: "移除旁白稿",
    narrationLoaded: "已导入 %N% 段旁白稿，将自动附加到对应分段提示词。",
    narrationRemoved: "已移除旁白稿。",
    narrationMismatch: "旁白稿共 %N1% 段，提示词共 %N2% 段，按顺序一一对应（多出部分仅附加到对应段）。",
    narrationNoPrompts: "请先在下方填写或导入 Prompts，再导入旁白稿。",
    scanNone: "未找到角色，请先在 Flow 中打开一个项目。",
    scanFound: "已扫描到 %N% 个角色。",
    labelWatermarkSite: "前往网站",
    toastAlreadyRunning: "正在运行中",
    toastPreviewCleared: "预览与断点已清除",
    toastCsvOnly: "目前仅支持 .csv 纯文本格式",
    toastNoCheckpoint: "没有找到可续跑的断点",
    toastFramesFirst: "请先上传帧图片（或开启连锁生成以用 Flow 输出作为起始帧）",
    toastPromptsFirst: "没有 Prompts，请先添加",
    toastLogsExport: "没有日志可导出",
    toastLogsCopy: "没有日志可复制",
    toastNarrEmpty: "旁白稿为空，无法导入。",
    toastCacheCleared: "缓存已清除",
    toastCleared: "已清除",
    dragHandleTitle: "拖拽调整顺序",
    toastFileSkip: "%N1% 超过 50MB，已跳过",
    toastScanFail: "扫描失败：%N1%",
    toastStartFail: "启动失败：%N1%",
    toastCopyFail: "复制失败，请手动选择复制。",
    statusPending: "等待中", statusRunning: "运行中", statusDone: "已完成", statusError: "失败", statusRetrying: "重试中",
    narrLabel: "旁白：",
    uploadHintZh: "PNG, JPG, GIF 每个大小不超过 50MB",
  },
};
let currentLang = "zh-TW";

function t(key, ...args) {
  const dict = i18n[currentLang] || i18n["zh-TW"];
  let s = dict[key] ?? i18n["zh-TW"][key] ?? key;
  if (args.length >= 2) {
    args.forEach((v, i) => { s = s.replace("%N" + (i + 1) + "%", v); });
  } else if (args.length === 1) {
    s = s.replace(/%N(\d+)?%/, args[0]);
  }
  return s;
}

// ---------------- State ----------------
const CHECKPOINT_KEY = "flowAutomationCheckpoint";
let settings = loadSettings();
let queue = [];
let running = false;

// ---- Chain preview & resume state ----
let sessionFrames = []; // {index, dataURL}
let sessionVideos = []; // {index, videoUrl}

// ---- Narration script (per-segment voice-over) ----
let narrations = []; // {segment: 0-based index, text}
let narrationFileName = "";

function parseNarrationText(raw, fileName) {
  // TXT: split by blank lines -> one segment each; CSV: narration column per data row
  const isCsv = /\.csv$/i.test(fileName || "");
  if (isCsv) {
    // Robust CSV splitter that respects quoted fields containing commas
    const splitCsvRow = line => {
      const cells = []; let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) { if (ch === "\"" && line[i + 1] === "\"") { cur += "\""; i++; } else if (ch === "\"") inQ = false; else cur += ch; }
        else { if (ch === "\"") inQ = true; else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch; }
      }
      cells.push(cur); return cells.map(c => c.trim());
    };
    const rows = raw.split(/\r?\n/).map(r => r.trim()).filter(r => r);
    if (rows.length === 0) return [];
    const headerCells = splitCsvRow(rows[0]);
    // Header row detection: row where the first cell is a textual name (not a pure number)
    const hasHeader = !/^\d+$/.test(headerCells[0] || "");
    const body = hasHeader ? rows.slice(1) : rows;
    // Locate the narration text column: prefer a named narration column, else the last column
    const headerNames = headerCells.map(c => c.replace(/^["']|["']$/g, "").toLowerCase());
    let narrIdx = headerNames.findIndex(c => /narration|旁白|旁白稿|text|voice|voiceover|description|desc/.test(c));
    if (narrIdx < 0) narrIdx = Math.max(0, headerCells.length - 1);
    return body.map(r => {
      const cells = splitCsvRow(r);
      return cells.slice(narrIdx).join(",").replace(/^["']|["']$/g, "");
    }).filter(r => r && /\D/.test(r));
  }
  return raw.split(/\n\s*\n/).map(s => s.trim()).filter(s => s);
}

function applyNarrationsToPrompts() {
  const prompts = parsePrompts();
  const status = document.getElementById("narrationStatus");
  if (!status) return;
  status.classList.remove("hidden");
  const texts = narrations.map(n => n.text);
  status.textContent = t("narrationLoaded", texts.length);
  if (texts.length !== prompts.length) {
    status.textContent += "  " + t("narrationMismatch", texts.length, prompts.length);
  }
}

function clearNarrations() {
  narrations = [];
  document.getElementById("narrationStatus").classList.add("hidden");
  document.getElementById("btnClearNarration").classList.add("hidden");
  toast(t("narrationRemoved"));
}

function loadCheckpoint() {
  try {
    return JSON.parse(localStorage.getItem(CHECKPOINT_KEY) || "null");
  } catch (e) { return null; }
}
function saveCheckpoint() {
  localStorage.setItem(CHECKPOINT_KEY, JSON.stringify({
    mode: settings.mode,
    chainEnabled: settings.chainEnabled,
    prompts: document.getElementById("prompts").value,
    total: queue.length,
    frames: sessionFrames,
    videos: sessionVideos.map(v => ({ index: v.index, videoUrl: v.videoUrl })),
    statuses: queue.map(q => ({ id: q.id, status: q.status })),
  }));
}
function clearCheckpoint() {
  localStorage.removeItem(CHECKPOINT_KEY);
}

// Detect resumable checkpoint if prompts unchanged
function tryDetectCheckpoint() {
  const cp = loadCheckpoint();
  if (!cp) return null;
  const curPrompts = document.getElementById("prompts").value.trim();
  const hasPending = queue.some(q => q.status !== "done");
  if (cp.prompts && cp.prompts.trim() === curPrompts && cp.mode === settings.mode && cp.chainEnabled && hasPending) {
    const doneCount = queue.filter(q => q.status === "done").length;
    if (doneCount > 0 && doneCount < queue.length) return cp;
  }
  return null;
}

function resumeFromCheckpoint() {
  const cp = loadCheckpoint();
  if (!cp) return false;
  const doneCount = queue.filter(q => q.status === "done").length;
  if (doneCount === 0 || doneCount >= queue.length) return false;
  if (cp.frames && cp.frames.length) {
    cp.frames.forEach(fr => {
      if (!sessionFrames.find(f => f.index === fr.index)) sessionFrames.push(fr);
    });
  }
  if (cp.videos && cp.videos.length) {
    cp.videos.forEach(v => {
      if (!sessionVideos.find(x => x.index === v.index)) sessionVideos.push(v);
    });
  }
  renderPreview();
  toast(t("resumeStarted", doneCount + 1));
  return true;
}

// Download a dataURL as file
function downloadDataURL(dataURL, filename) {
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = filename;
  a.click();
}

// ---- Live preview panel ----
function renderPreview() {
  const card = document.getElementById("previewCard");
  const grid = document.getElementById("previewGrid");
  const empty = document.getElementById("emptyPreview");
  const isChain = settings.mode === "frame2video" && !!document.getElementById("chainToggle").checked;
  card.classList.toggle("hidden", !isChain);
  grid.innerHTML = "";
  const cells = new Map();
  sessionFrames.forEach(fr => {
    let cell = cells.get(fr.index) || makePreviewCell(fr.index);
    cells.set(fr.index, cell);
    const media = cell.querySelector(".cell-media");
    media.innerHTML = "";
    const img = document.createElement("img");
    img.src = fr.dataURL;
    img.alt = "last frame";
    media.appendChild(img);
    cell.querySelector(".dl-frame").dataset.url = fr.dataURL;
    cell.querySelector(".dl-frame").classList.remove("hidden");
    cell.querySelector(".btn-replace").classList.remove("hidden");
    cell.querySelector(".cell-status").textContent = t("previewStatusDone");
    cell.querySelector(".cell-status").style.color = "var(--green)";
  });
  sessionVideos.forEach(v => {
    let cell = cells.get(v.index) || makePreviewCell(v.index);
    cells.set(v.index, cell);
    const media = cell.querySelector(".cell-media");
    // keep last-frame image behind the video for reference
    let vid = media.querySelector("video");
    if (!vid) {
      vid = document.createElement("video");
      vid.controls = true;
      vid.autoplay = false;
      media.insertBefore(vid, media.firstChild);
    }
    vid.src = v.videoUrl;
  });
  // Retry badge for segments that were auto-retried (failure or color gap)
  cells.forEach((cell, key) => {
    const it = queue.find(q => q.id === key);
    if (it && (it.retried || it.status === "retrying")) {
      let badge = cell.querySelector(".retry-badge");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "retry-badge";
        badge.title = t("previewColorGap");
        cell.appendChild(badge);
      }
      badge.textContent = t("previewRetry");
    }
  });
  // cells ordered by index
  const sorted = Array.from(cells.values()).sort((a, b) =>
    parseInt(a.dataset.index) - parseInt(b.dataset.index));
  sorted.forEach(c => grid.appendChild(c));
  empty.classList.toggle("hidden", cells.size > 0);
}
function makePreviewCell(index) {
  const cell = document.createElement("div");
  cell.className = "preview-cell";
  cell.dataset.index = index;
  cell.draggable = true;
  cell.innerHTML =
    '<div class="drag-handle" title="' + t("dragHandleTitle") + '">⠿</div>' +
    '<div class="cell-media"></div>' +
    '<div class="cell-label"><span class="seg">' + t("previewSeg", index + 1) + '</span><span class="dl-frame hidden">' + t("previewFrameDl") + '</span><button class="btn-replace hidden">' + t("previewReplace") + '</button><input type="file" class="replace-input hidden" accept="image/png,image/jpeg,image/webp"></div>' +
    '<div class="cell-status">' + t("previewStatusCapturing") + '</div>';
  const dlBtn = cell.querySelector(".dl-frame");
  dlBtn.addEventListener("click", e => {
    const url = e.currentTarget.dataset.url;
    if (url) downloadDataURL(url, "chain-segment-" + (index + 1) + "-last-frame.png");
  });
  // Replace frame
  const repBtn = cell.querySelector(".btn-replace");
  const repInput = cell.querySelector(".replace-input");
  repBtn.addEventListener("click", e => {
    e.stopPropagation();
    repInput.dataset.target = String(index);
    repInput.click();
  });
  repInput.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    const target = parseInt(e.currentTarget.dataset.target);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      replaceSegmentFrame(target, reader.result);
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  });
  // Drag events
  cell.addEventListener("dragstart", e => {
    cell.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  });
  cell.addEventListener("dragend", () => cell.classList.remove("dragging"));
  cell.addEventListener("dragover", e => e.preventDefault());
  cell.addEventListener("drop", e => {
    e.preventDefault();
    cell.classList.remove("dragging");
    const from = parseInt(e.dataTransfer.getData("text/plain") || "-1");
    const to = parseInt(cell.dataset.index);
    if (!isNaN(from) && !isNaN(to) && from !== to) moveSegment(from, to);
  });
  return cell;
}

// Reorder the chain: move segment `from` before segment `to` (DOM order of queue+frames+videos)
function moveSegment(from, to) {
  const isDone = q => q.status === "done";
  const qFrom = queue.find(q => q.id === from);
  const qTo = queue.find(q => q.id === to);
  if (!qFrom || !qTo) return;
  // Lock: completed segments cannot be moved (their output is already generated)
  if (isDone(qFrom) || isDone(qTo)) {
    toast(t("dragDoneLocked"));
    renderPreview();
    return;
  }
  if (running) { toast(t("toastAlreadyRunning")); return; }
  const qiFrom = queue.indexOf(qFrom);
  const qiTo = queue.indexOf(qTo);
  // reorder queue: place qFrom after qTo
  queue.splice(qiFrom, 1);
  const newTo = queue.indexOf(qTo);
  queue.splice(newTo + 1, 0, qFrom);
  // reorder frames & videos keeping same relative position (data tied to queue id)
  const re = (arr, key) => {
    const item = arr.find(x => x[key] === from);
    if (!item) return;
    const i = arr.indexOf(item);
    arr.splice(i, 1);
    arr.splice(newTo + 1, 0, item);
  };
  re(sessionFrames, "index");
  re(sessionVideos, "index");
  // renumber preview cells by display order to keep segment numbers aligned with queue
  sessionFrames.forEach((f, i) => f.index = queue[i] && queue[i].id);
  sessionVideos.forEach((v, i) => v.index = queue[i] && queue[i].id);
  // update prompts textarea so segment text follows the new order
  const promptsEl = document.getElementById("prompts");
  if (promptsEl) {
    const parts = parsePrompts();
    const map = new Map(queue.map((q, i) => [q.id, i]));
    const newText = queue.map(q => parts[map.get(q.id)] || "").join("\n\n");
    promptsEl.value = newText;
    saveSettings();
  }
  renderPreview();
  saveCheckpoint();
  toast(t("dragSuccess", to + 1));
}

// Manually replace the input frame of a pending segment
function replaceSegmentFrame(index, dataURL) {
  const q = queue.find(q => q.id === index);
  if (q && q.status === "done") {
    toast(t("dragDoneLocked"));
    renderPreview();
    return;
  }
  sessionFrames = sessionFrames.filter(f => f.index !== index);
  sessionFrames.push({ index, dataURL });
  renderPreview();
  saveCheckpoint();
  toast(t("replaceSuccess", index + 1));
}
function previewAddFrame(index, dataURL) {
  sessionFrames = sessionFrames.filter(f => f.index !== index);
  sessionFrames.push({ index, dataURL });
  renderPreview();
  saveCheckpoint();
}
function previewAddVideo(index, videoUrl) {
  sessionVideos = sessionVideos.filter(v => v.index !== index);
  sessionVideos.push({ index, videoUrl });
  renderPreview();
  saveCheckpoint();
}
function clearPreview() {
  sessionFrames = [];
  sessionVideos = [];
  clearCheckpoint();
  renderPreview();
  toast(t("toastPreviewCleared"));
}

// ---- One-click export: zip the whole chain project ----
async function exportProject() {
  if (typeof JSZip === "undefined") {
    toast(t("exportFail"));
    return;
  }
  const progress = document.getElementById("exportProgress");
  const fill = document.getElementById("exportFill");
  const hint = document.getElementById("exportHint");
  progress.classList.remove("hidden");
  fill.style.width = "10%";
  hint.textContent = t("exportStart");

  try {
    const promptsText = document.getElementById("prompts").value.trim();
    const cp = loadCheckpoint();
    const zip = new JSZip();

    // 1. Settings & prompts manifest
    const manifest = {
      tool: "Auto Flow Free",
      version: "1.9.1",
      exportedAt: new Date().toISOString(),
      mode: settings.mode,
      chainEnabled: settings.chainEnabled,
      frameOption: settings.frameOption,
      concurrency: settings.concurrency,
      waitMin: settings.waitMin,
      waitMax: settings.waitMax,
      outputCount: settings.outputCount,
      folder: settings.folder,
      aspect: settings.aspect,
      model: settings.model,
      downloadRes: settings.downloadRes,
      duration: settings.duration,
      prompts: promptsText.split(/\n\s*\n/).filter(s => s.trim()).map((p, i) => ({ index: i + 1, text: p.trim() })),
      queue: queue.map(q => ({ id: q.id, status: q.status })),
      checkpointFrames: (cp && cp.frames ? cp.frames.length : sessionFrames.length),
    };
    zip.file("project.json", JSON.stringify(manifest, null, 2));
    zip.file("prompts.txt", promptsText || "");
    fill.style.width = "25%";

    // 2. Last-frame copies of each completed segment
    let frameCount = 0;
    const frameItems = (sessionFrames.length ? sessionFrames : (cp && cp.frames) || []).sort((a, b) => a.index - b.index);
    for (const fr of frameItems) {
      if (fr.dataURL && fr.dataURL.length > 100) {
        const b64 = fr.dataURL.split(",")[1] || "";
        zip.file("frames/segment-" + (fr.index + 1) + "-last-frame.png", b64, { base64: true });
        frameCount++;
      }
    }
    fill.style.width = "45%";

    // 3. User uploaded frames (if any)
    if (uploadedFrames && uploadedFrames.length) {
      uploadedFrames.forEach((f, i) => {
        if (f.dataUrl && f.dataUrl.length > 100) {
          const b64 = f.dataUrl.split(",")[1] || "";
          zip.file("frames/input-frame-" + (i + 1) + "-" + (f.name || "frame.png"), b64, { base64: true });
          frameCount++;
        }
      });
    }
    fill.style.width = "60%";

    // 4. Generated videos (from live preview data)
    let videoCount = 0;
    const videoItems = (sessionVideos.length ? sessionVideos : (cp && cp.videos) || []).sort((a, b) => a.index - b.index);
    for (const v of videoItems) {
      if (v.videoUrl) {
        try {
          const resp = await fetch(v.videoUrl);
          const blob = await resp.blob();
          if (blob.size > 1000) {
            const b64 = await blobToBase64(blob);
            zip.file("videos/segment-" + (v.index + 1) + ".mp4", b64, { base64: true });
            videoCount++;
          }
        } catch (e) {
          // video URL expired — skip this file
        }
      }
      fill.style.width = (60 + 30 * (videoItems.indexOf(v) + 1) / Math.max(1, videoItems.length)) + "%";
    }
    fill.style.width = "92%";

    if (frameCount === 0 && videoCount === 0 && !promptsText) {
      progress.classList.add("hidden");
      toast(t("exportNoData"));
      return;
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const name = "flow-chain-" + new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-") + ".zip";
    downloadBlob(blob, name);
    fill.style.width = "100%";
    hint.textContent = t("exportDone") + " " + name + " (frames: " + frameCount + ", videos: " + videoCount + ")";
    toast(t("exportDone") + " " + name);
    setTimeout(() => progress.classList.add("hidden"), 4000);
  } catch (e) {
    progress.classList.add("hidden");
    toast(t("exportFail") + " " + e.message);
  }
}

function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const res = r.result;
      resolve(typeof res === "string" ? res.split(",")[1] || "" : "");
    };
    r.onerror = () => reject(new Error("file read error"));
    r.readAsDataURL(blob);
  });
}

// Bind preview panel buttons when DOM ready
function bindPreviewUI() {
  const btnResume = document.getElementById("btnResume");
  const btnClearPreview = document.getElementById("btnClearPreview");
  if (btnResume) btnResume.addEventListener("click", () => {
    if (running) { toast(t("toastAlreadyRunning")); return; }
    if (resumeFromCheckpoint()) startBatch();
    else toast(t("toastNoCheckpoint"));
  });
  if (btnClearPreview) btnClearPreview.addEventListener("click", clearPreview);
  const btnExport = document.getElementById("btnExport");
  if (btnExport) btnExport.addEventListener("click", exportProject);
}

function loadSettings() {
  const def = {
    mode: "text2video",
    concurrency: 1,
    waitMin: 20,
    waitMax: 30,
    frameOption: "first",
    chainEnabled: false,
    charEnabled: false,
    defaultChar: "",
    maxImages: 2,
    charImageEnabled: false,
    voiceEnabled: false,
    defaultVoice: "",
    outputCount: 2,
    folder: "veo-folder-1",
    rename: true,
    aspect: "16:9",
    model: "veo3.1-fast",
    imageModel: "nano-banana-2",
    defaultMode: "text2video",
    imageMode: "new",
    videoRes: "1080p",
    imageRes: "2k",
    downloadRes: "1080p",
    duration: "8",
    lang: "zh-TW",
    theme: "light",
  };
  return Object.assign({}, def, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ---------------- Toast ----------------
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---------------- Apply i18n ----------------
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (key === "queueCount") {
      el.textContent = t("queueCount", queue.length);
    } else if (key === "debugStatus") {
      // debugStatus 是含 %N% 佔位符的動態計數，初始為 0 條，後續由 addDebugLine 更新
      el.textContent = t("debugStatus", "0");
    } else {
      el.innerHTML = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  // 同步語言下拉（頂部與設置整合）
  const ls = document.getElementById("langSelect");
  if (ls) ls.value = currentLang;
  // Rebuild option texts for the current language
  rebuildCharOptions();
  rebuildVoiceOptions();
}

// ---------------- Select option rebuilders (language-aware) ----------------
function rebuildCharOptions() {
  const select = document.getElementById("charSelect");
  if (!select) return;
  const prev = select.value;
  const names = Array.from(select.options).map(o => o.value).filter(v => v && v !== "__none__");
  select.innerHTML = '<option value="" data-i18n="optCharNone">' + t("optCharNone") + '</option><option value="__none__" data-i18n="optCharUnavailable">' + t("optCharUnavailable") + '</option>';
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n; opt.textContent = n;
    select.appendChild(opt);
  });
  if (names.includes(prev)) select.value = prev;
}

// Google Flow 內建 30 個 Chirp 3 HD 語音（來源: docs.cloud.google.com/text-to-speech/docs/chirp3-hd）
const VOICES = [
  { name: "Achernar", gender: "female" }, { name: "Achird", gender: "male" },
  { name: "Algenib", gender: "male" }, { name: "Algieba", gender: "male" },
  { name: "Alnilam", gender: "male" }, { name: "Aoede", gender: "female" },
  { name: "Autonoe", gender: "female" }, { name: "Callirrhoe", gender: "female" },
  { name: "Charon", gender: "male" }, { name: "Despina", gender: "female" },
  { name: "Enceladus", gender: "male" }, { name: "Erinome", gender: "female" },
  { name: "Fenrir", gender: "male" }, { name: "Gacrux", gender: "female" },
  { name: "Iapetus", gender: "male" }, { name: "Kore", gender: "female" },
  { name: "Laomedeia", gender: "female" }, { name: "Leda", gender: "female" },
  { name: "Orus", gender: "male" }, { name: "Pulcherrima", gender: "female" },
  { name: "Puck", gender: "male" }, { name: "Rasalgethi", gender: "male" },
  { name: "Sadachbia", gender: "male" }, { name: "Sadaltager", gender: "male" },
  { name: "Schedar", gender: "male" }, { name: "Sulafat", gender: "female" },
  { name: "Umbriel", gender: "male" }, { name: "Vindemiatrix", gender: "female" },
  { name: "Zephyr", gender: "female" }, { name: "Zubenelgenubi", gender: "male" },
];

function rebuildVoiceOptions() {
  const select = document.getElementById("voiceSelect");
  if (!select) return;
  const prev = select.value;
  const genderLabel = (g) => currentLang === "zh-CN" ? (g === "male" ? "男性" : "女性") : (g === "male" ? "Male" : "Female");
  select.innerHTML = '<option value="">' + t("optCharNone") + '</option>';
  VOICES.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = v.name + " - " + genderLabel(v.gender);
    select.appendChild(opt);
  });
  if (Array.from(select.options).some(o => o.value === prev)) select.value = prev;
}
// ---------------- UI bindings ----------------
function bindUI() {
  // Tabs
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll("main.panel").forEach(p => p.classList.add("hidden"));
      document.getElementById("panel-" + target).classList.remove("hidden");
    });
  });

  // Language switch (unified dropdown with the settings language control)
  const langSel = document.getElementById("langSelect");
  if (langSel) {
    langSel.value = settings.lang;
    langSel.addEventListener("change", e => {
      currentLang = e.target.value;
      settings.lang = currentLang;
      saveSettings();
      applyI18n();
    });
  }

  // Mode buttons
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      settings.mode = btn.dataset.mode;
      saveSettings();
      updateModeUI();
    });
  });

  // Concurrency
  const conc = document.getElementById("concurrency");
  conc.value = String(settings.concurrency);
  conc.addEventListener("change", () => { settings.concurrency = parseInt(conc.value); saveSettings(); });

  // Random wait
  const wMin = document.getElementById("waitMin");
  const wMax = document.getElementById("waitMax");
  wMin.value = settings.waitMin;
  wMax.value = settings.waitMax;
  [wMin, wMax].forEach(el => el.addEventListener("input", () => {
    settings.waitMin = parseInt(wMin.value) || 0;
    settings.waitMax = parseInt(wMax.value) || 0;
    saveSettings();
  }));
  document.getElementById("swapBtn").addEventListener("click", () => {
    [wMin.value, wMax.value] = [wMax.value, wMin.value];
    wMin.dispatchEvent(new Event("input"));
  });

  // Prompts textarea
  const promptsEl = document.getElementById("prompts");
  promptsEl.addEventListener("input", updateQueueFromPrompts);

  // File uploads
  document.getElementById("fileTxt").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      promptsEl.value = (promptsEl.value ? promptsEl.value.trim() + "\n\n" : "") + reader.result.trim();
      updateQueueFromPrompts();
    };
    reader.readAsText(file);
  });
  document.getElementById("fileCsv").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".csv")) {
      toast(t("toastCsvOnly"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rows = reader.result.split(/\r?\n/).map(r => r.trim()).filter(r => r);
      // drop header if exists
      const lines = rows.slice(1).map(r => r.split(",")[0]).filter(r => r);
      promptsEl.value = (promptsEl.value ? promptsEl.value.trim() + "\n\n" : "") + lines.join("\n\n");
      updateQueueFromPrompts();
    };
    reader.readAsText(file);
  });

  // Narration script import (TXT / CSV) — auto-mapped to each prompt segment
  let narrationFileName = "";
  document.getElementById("fileNarration").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const isCsv = /\.csv$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const segs = parseNarrationText(reader.result, file.name);
      if (segs.length === 0) {
        toast(t("toastNarrEmpty"));
        return;
      }
      if (parsePrompts().length === 0) {
        toast(t("narrationNoPrompts"));
        return;
      }
      narrations = segs.map((text, i) => ({ segment: i, text }));
      narrationFileName = file.name;
      applyNarrationsToPrompts();
      document.getElementById("btnClearNarration").classList.remove("hidden");
      toast(t("narrationLoaded", segs.length));
    };
    reader.readAsText(file);
    e.target.value = "";
  });
  document.getElementById("btnClearNarration").addEventListener("click", clearNarrations);

  // Character toggle & scan
  const charToggle = document.getElementById("charToggle");
  charToggle.checked = settings.charEnabled;
  charToggle.addEventListener("change", () => { settings.charEnabled = charToggle.checked; saveSettings(); });
  document.getElementById("scanChars").addEventListener("click", scanCharacters);

  // Max input images per prompt
  const maxImg = document.getElementById("maxImages");
  maxImg.value = String(settings.maxImages);
  maxImg.addEventListener("change", () => { settings.maxImages = parseInt(maxImg.value); saveSettings(); });

  // Auto-add character images (image2image)
  const charImageToggle = document.getElementById("charImageToggle");
  charImageToggle.checked = settings.charImageEnabled;
  charImageToggle.addEventListener("change", () => { settings.charImageEnabled = charImageToggle.checked; saveSettings(); });

  // Auto-add voice by speaker + default speaker
  rebuildVoiceOptions();
  const voiceToggle = document.getElementById("voiceToggle");
  if (voiceToggle) {
    voiceToggle.checked = settings.voiceEnabled;
    voiceToggle.addEventListener("change", () => {
      settings.voiceEnabled = voiceToggle.checked;
      saveSettings();
      updateModeUI();
    });
  }
  const voiceSelect = document.getElementById("voiceSelect");
  if (voiceSelect) {
    voiceSelect.value = settings.defaultVoice || "";
    voiceSelect.addEventListener("change", () => { settings.defaultVoice = voiceSelect.value; saveSettings(); });
  }

  // Chain toggle
  const chainToggle = document.getElementById("chainToggle");
  chainToggle.checked = settings.chainEnabled;
  chainToggle.addEventListener("change", () => { settings.chainEnabled = chainToggle.checked; saveSettings(); updateModeUI(); });

  // Outputs & folder
  const out = document.getElementById("outputCount");
  out.value = String(settings.outputCount);
  out.addEventListener("change", () => { settings.outputCount = parseInt(out.value); saveSettings(); });
  const folder = document.getElementById("folderName");
  folder.value = settings.folder;
  folder.addEventListener("input", () => { settings.folder = folder.value.trim() || "veo-folder-1"; saveSettings(); });

  // Auto rename
  const ren = document.getElementById("renameToggle");
  ren.checked = settings.rename;
  ren.addEventListener("change", () => { settings.rename = ren.checked; saveSettings(); });

  // Aspect ratio (dropdown)
  const aspectSel = document.getElementById("aspectSelect");
  if (aspectSel) {
    aspectSel.value = settings.aspect || "16:9";
    aspectSel.addEventListener("change", e => { settings.aspect = e.target.value; saveSettings(); });
  }
  const modelSel = document.getElementById("modelSelect");
  if (modelSel) { modelSel.value = settings.model; modelSel.addEventListener("change", e => { settings.model = e.target.value; saveSettings(); }); }
  const dlResSel = document.getElementById("downloadRes");
  if (dlResSel) { dlResSel.value = settings.downloadRes; dlResSel.addEventListener("change", e => { settings.downloadRes = e.target.value; saveSettings(); }); }
  document.getElementById("durationSelect").value = String(settings.duration);
  document.getElementById("durationSelect").addEventListener("change", e => { settings.duration = e.target.value; saveSettings(); });
  const imgModelSel = document.getElementById("imageModelSelect");
  if (imgModelSel) { imgModelSel.value = settings.imageModel; imgModelSel.addEventListener("change", e => { settings.imageModel = e.target.value; saveSettings(); }); }
  const defModeSel = document.getElementById("defaultModeSelect");
  if (defModeSel) { defModeSel.value = settings.defaultMode; defModeSel.addEventListener("change", e => { settings.defaultMode = e.target.value; saveSettings(); }); }
  const imgModeSel = document.getElementById("imageModeSelect");
  if (imgModeSel) { imgModeSel.value = settings.imageMode; imgModeSel.addEventListener("change", e => { settings.imageMode = e.target.value; saveSettings(); }); }
  const vidResSel = document.getElementById("videoResSelect");
  if (vidResSel) { vidResSel.value = settings.videoRes; vidResSel.addEventListener("change", e => { settings.videoRes = e.target.value; saveSettings(); }); }
  const imgResSel = document.getElementById("imageResSelect");
  if (imgResSel) { imgResSel.value = settings.imageRes; imgResSel.addEventListener("change", e => { settings.imageRes = e.target.value; saveSettings(); }); }

  // GitHub repository button (opens in a new tab)
  const repoBtn = document.getElementById("openRepo");
  if (repoBtn) {
    repoBtn.addEventListener("click", e => {
      e.preventDefault(); // The <a> itself has target="_blank"; prevent its default to avoid opening two tabs
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: "https://github.com/m45801ch/Auto-Flow-Free" });
      }
      // The <a> fallback (target=_blank) handles non-extension environments
    });
  }

  // Download settings gear: open chrome://settings/downloads
  const dlGear = document.getElementById("openChromeDownloads");
  if (dlGear) {
    dlGear.addEventListener("click", () => {
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: "chrome://settings/downloads" });
      } else {
        window.open("chrome://settings/downloads", "_blank");
      }
    });
  }

  // ---------------- Save / reset settings buttons ----------------
  // 保存設定：變更下拉時已自動保存，此按鈕為手動觸發保存並顯示提示
  const btnSaveBtn = document.getElementById("btnSaveSettings");
  if (btnSaveBtn) {
    btnSaveBtn.onclick = () => {
      saveSettings();
      toast(t("saveDone"));
    };
  }
  // 重置為預設值：清除 localStorage 中的設定，恢復全部預設值並刷新 UI
  const btnResetBtn = document.getElementById("btnResetDefaults");
  if (btnResetBtn) {
    btnResetBtn.onclick = () => {
      localStorage.removeItem(STORAGE_KEY);
      settings = loadSettings();
      applyUIFromSettings();
      saveSettings();
      toast(t("resetDone"));
    };
  }

  // ---------------- Apply UI from settings helper ----------------
  // 依目前 settings 刷新所有 UI 控制項（用於重置後重新套用）
  function applyUIFromSettings() {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    };
    const setChecked = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!value;
    };
    set("concurrency", String(settings.concurrency));
    set("waitMin", String(settings.waitMin));
    set("waitMax", String(settings.waitMax));
    set("frameOption", settings.frameOption);
    setChecked("chainToggle", settings.chainEnabled);
    setChecked("charToggle", settings.charEnabled);
    set("maxImages", String(settings.maxImages));
    setChecked("charImageToggle", settings.charImageEnabled);
    setChecked("voiceToggle", settings.voiceEnabled);
    set("outputCount", String(settings.outputCount));
    set("folderName", settings.folder);
    setChecked("renameToggle", settings.rename);
    set("aspectSelect", settings.aspect);
    set("modelSelect", settings.model);
    set("downloadRes", settings.downloadRes);
    set("durationSelect", String(settings.duration));
    set("imageModelSelect", settings.imageModel);
    set("defaultModeSelect", settings.defaultMode);
    set("imageModeSelect", settings.imageMode);
    set("videoResSelect", settings.videoRes);
    set("imageResSelect", settings.imageRes);
    const themeSel = document.getElementById("themeSelect");
    if (themeSel) themeSel.value = settings.theme || "light";
    applyTheme();
    const ls = document.getElementById("langSelect");
    if (ls) ls.value = settings.lang;
    currentLang = settings.lang;
    applyI18n();
  }

  // Remove VEO watermark site (opens in new tab)
  const wmBtn = document.getElementById("openWatermarkSite");
  if (wmBtn) {
    wmBtn.addEventListener("click", e => {
      e.preventDefault();
      const url = "https://watermark.kylenguyen.me/";
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, "_blank");
      }
    });
  }
  // Theme switcher: dark (green) / light (Provence pink)
  const themeSel = document.getElementById("themeSelect");
  function applyTheme() {
    document.documentElement.dataset.theme = (settings.theme === "dark") ? "dark" : "light";
    const ts = document.getElementById("themeSelect");
    if (ts) {
      const darkOpt = ts.querySelector('option[value="dark"]');
      const lightOpt = ts.querySelector('option[value="light"]');
      if (darkOpt) darkOpt.textContent = t("themeDark");
      if (lightOpt) lightOpt.textContent = t("themeLight");
    }
  }
  if (themeSel) {
    themeSel.value = settings.theme || "light";
    themeSel.addEventListener("change", e => {
      settings.theme = e.target.value;
      saveSettings();
      applyTheme();
    });
  }
  applyTheme();

  // Bottom buttons
  document.getElementById("btnReport").addEventListener("click", () => {
    window.open("https://github.com", "_blank");
  });
  document.getElementById("btnClearCache").addEventListener("click", () => {
    toast(t("toastCacheCleared"));
  });
  document.getElementById("btnClear").addEventListener("click", () => {
    promptsEl.value = "";
    uploadedFrames = [];
    renderUploadedFrames();
    updateQueueFromPrompts();
    clearCheckpoint();
    clearNarrations();
    toast(t("toastCleared"));
  });
  bindPreviewUI();
  bindDebugUI();
  document.getElementById("btnRun").addEventListener("click", startBatch);
  document.getElementById("btnStop").addEventListener("click", stopBatch);

  updateModeUI();
  updateQueueFromPrompts();
  applyI18n();
  showNotFlowWarning();
}

// ---------------- Mode UI ----------------
function updateModeUI() {
  const isFrame = settings.mode === "frame2video";
  const isImage = settings.mode === "text2image" || settings.mode === "image2image";
  const isImg2Img = settings.mode === "image2image";
  const needsMaxImages = isImg2Img || settings.mode === "components2video" || settings.mode === "agent";
  const supportsCharImages = isImg2Img || settings.mode === "components2video" || settings.mode === "agent";
  const supportsVoice = settings.mode === "components2video" || settings.mode === "agent";
  document.getElementById("uploadZone").classList.toggle("hidden", !isFrame);
  document.getElementById("frameOptions").classList.toggle("hidden", !isFrame);
  document.getElementById("chainCard").classList.toggle("hidden", !isFrame);
  document.getElementById("maxImagesCard").classList.toggle("hidden", !needsMaxImages);
  document.getElementById("charImageCard").classList.toggle("hidden", !supportsCharImages);
  document.getElementById("voiceCard").classList.toggle("hidden", !supportsVoice);
  document.getElementById("voiceDefaultRow").classList.toggle("hidden", !supportsVoice || !settings.voiceEnabled);
  document.getElementById("chainHint").classList.toggle("hidden", !isFrame || !settings.chainEnabled);
  if (isFrame && settings.chainEnabled) {
    // Chaining requires sequential processing
    settings.concurrency = 1;
    document.getElementById("concurrency").value = "1";
    saveSettings();
  }
  const promptsHint = document.getElementById("promptsHint");
  const sep = currentLang === "en" ? " prompt. Images are distributed to each prompt according to the max images setting." : currentLang === "zh-CN" ? " prompt。图片将根据最大输入图片数设置与每个 prompt 一起处理。" : " prompt。圖片將根據最大輸入圖片數設定與每個 prompt 一起處理。";
  const sepFrame = currentLang === "en" ? " prompt. Images are processed together with each prompt according to their count." : currentLang === "zh-CN" ? " prompt。图片将根据数量与每个 prompt 一起处理。" : " prompt。圖片將根據數量與每個 prompt 一起處理。";
  if (isFrame) {
    promptsHint.textContent = sepFrame;
  } else if (needsMaxImages) {
    promptsHint.textContent = sep;
  } else {
    promptsHint.textContent = t("hintPrompts");
  }
}

// ---------------- Frame upload ----------------
let uploadedFrames = [];
const uploadZone = document.getElementById("uploadZone");
const frameInput = document.getElementById("frameInput");
uploadZone.addEventListener("click", e => {
  if (e.target === frameInput) return;
  frameInput.click();
});
frameInput.addEventListener("change", e => {
  addFrames(Array.from(e.target.files));
  frameInput.value = "";
});
["dragenter", "dragover"].forEach(ev => {
  uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.add("drag"); });
});
["dragleave", "drop"].forEach(ev => {
  uploadZone.addEventListener(ev, e => { e.preventDefault(); uploadZone.classList.remove("drag"); });
});
uploadZone.addEventListener("drop", e => addFrames(Array.from(e.dataTransfer.files)));

function addFrames(files) {
  files.forEach(f => {
    if (!/\.(png|jpe?g|gif)$/i.test(f.name)) return;
    if (f.size > 50 * 1024 * 1024) { toast(t("toastFileSkip", f.name)); return; }
    const reader = new FileReader();
    reader.onload = () => {
      uploadedFrames.push({ name: f.name, dataUrl: reader.result });
      renderUploadedFrames();
    };
    reader.readAsDataURL(f);
  });
}

function renderUploadedFrames() {
  const box = document.getElementById("uploadedFrames");
  box.innerHTML = "";
  uploadedFrames.forEach(fr => {
    const img = document.createElement("img");
    img.src = fr.dataUrl;
    img.title = fr.name;
    box.appendChild(img);
  });
}

// ---------------- Queue ----------------
function parsePrompts() {
  const raw = document.getElementById("prompts").value;
  return raw.split(/\n\s*\n/).map(s => s.trim()).filter(s => s);
}

function updateQueueFromPrompts() {
  const prompts = parsePrompts();
  queue = prompts.map((text, i) => ({ id: i, text, status: "pending" }));
  renderQueue();
}

function renderQueue() {
  const list = document.getElementById("queueList");
  const empty = document.getElementById("emptyQueue");
  document.getElementById("queueCount").textContent = t("queueCount", queue.length);
  list.innerHTML = "";
  if (queue.length === 0) {
    const div = document.createElement("div");
    div.className = "empty-queue";
    div.id = "emptyQueue";
    div.textContent = t("queueEmpty");
    list.appendChild(div);
    return;
  }
  queue.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "queue-item";
    item.id = "qitem-" + q.id;
    const truncated = q.text.length > 120 ? q.text.slice(0, 120) + "…" : q.text;
    item.innerHTML =
      '<div class="queue-num">#' + (i + 1) + '</div>' +
      '<div class="queue-text">' + escapeHtml(truncated) + '</div>' +
      '<div class="queue-status ' + q.status + '">' + statusLabel(q.status) + '</div>';
    list.appendChild(item);
  });
}

function statusLabel(s) {
  return { pending: t("statusPending"), running: t("statusRunning"), done: t("statusDone"), error: t("statusError"), retrying: t("statusRetrying") }[s] || s;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function updateItem(id, status) {
  const q = queue.find(x => x.id === id);
  if (!q) return;
  q.status = status;
  const el = document.getElementById("qitem-" + id);
  if (el) {
    const st = el.querySelector(".queue-status");
    st.className = "queue-status " + status;
    st.textContent = statusLabel(status);
  }
}

// ---------------- Character scan ----------------
async function scanCharacters() {
  const tab = await ensureFlowTab();
  if (!tab) return;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Try to find character names in Google Flow UI
        const names = [];
        document.querySelectorAll("[data-character], [aria-label*='character'], [aria-label*='角色']").forEach(el => {
          const n = (el.getAttribute("aria-label") || el.textContent || "").trim();
          if (n && !names.includes(n)) names.push(n);
        });
        return names;
      },
    });
    const names = results[0]?.result || [];
    const select = document.getElementById("charSelect");
    select.innerHTML = '<option value="" data-i18n="optCharNone">' + t("optCharNone") + '</option><option value="__none__" data-i18n="optCharUnavailable">' + t("optCharUnavailable") + '</option>';
    names.forEach(n => {
      const opt = document.createElement("option");
      opt.value = n; opt.textContent = n;
      select.appendChild(opt);
    });
    const hint = document.getElementById("charHint");
    if (names.length === 0) {
      hint.textContent = t("hintCharScan");
      toast(t("scanNone"));
    } else {
      hint.textContent = t("scanFound", names.length);
      toast(t("scanFound", names.length));
    }
  } catch (err) {
    toast(t("toastScanFail", err.message));
  }
}

// ---------------- Not Flow project forced modal ----------------
// 強制彈出訊息框：不在 Flow 專案頁面時鎖定全部操作、無法手動關閉；
// 切換回 Flow 頁面後自動消失、功能恢復。
let notFlowLocked = false;
let notFlowCheckTimer = null;

async function showNotFlowWarning() {
  const modal = document.getElementById("notFlowModal");
  if (!modal) return;
  let isFlowProject = false;
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      // side panel 是獨立 window，currentWindow 查的是面板自身；改為不限 window 查詢所有活動分頁
      // Chrome 可能把面板/彈窗自身標為 active，排除 chrome-extension:// 頁面後再判斷：
      // 任一活動分頁在 Flow 上，或目前有任何 Flow 分頁存在，即視為可用（切回 Flow 時彈窗自動消失）
      const tabs = await chrome.tabs.query({ active: true });
      const extTabs = (tabs || []).filter(t => !(t?.url || "").startsWith("chrome-extension://"));
      const anyTab = extTabs[0]?.url || "";
      const flowTabs = await chrome.tabs.query({ url: "*://labs.google/fx/*tools/flow*" });
      isFlowProject = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i.test(anyTab) || flowTabs.length > 0;
    } else {
      // Preview mode (file://): treat as not Flow; modal cannot be dismissed by user
      isFlowProject = false;
    }
  } catch (e) {
    isFlowProject = false;
  }
  const willLock = !isFlowProject;
  modal.classList.toggle("hidden", !willLock);
  document.body.classList.toggle("notflow-locked", willLock);
  // 鎖定期間攔截鍵盤操作（防止 Tab/Enter/Space 操作底層 UI）
  notFlowLocked = willLock;
  // 啟動持續輪詢：無論目前是否鎖定，都持續監控活動分頁；
  // 切回 Flow 頁面時自動解除鎖定；離開 Flow 切換到其他頁面時，彈窗會重新彈出並再次鎖定
  clearInterval(notFlowCheckTimer);
  let lastFlowState = willLock;
  notFlowCheckTimer = setInterval(async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
        const tabs = await chrome.tabs.query({ active: true });
        const extTabs = (tabs || []).filter(t => !(t?.url || "").startsWith("chrome-extension://"));
        const anyTab = extTabs[0]?.url || "";
        const flowTabs = await chrome.tabs.query({ url: "*://labs.google/fx/*tools/flow*" });
        const onFlow = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i.test(anyTab) || flowTabs.length > 0;
        const shouldLock = !onFlow;
        if (shouldLock !== lastFlowState) {
          lastFlowState = shouldLock;
          modal.classList.toggle("hidden", !shouldLock);
          document.body.classList.toggle("notflow-locked", shouldLock);
          notFlowLocked = shouldLock;
        }
      }
    } catch (e) { /* ignore */ }
  }, 1000);
}

// 鍵盤/滑鼠攔截：鎖定期間底層 UI 不可操作
document.addEventListener("keydown", e => {
  if (notFlowLocked && !e.target.closest("#notFlowModal")) e.preventDefault();
}, true);
document.addEventListener("click", e => {
  if (notFlowLocked && !e.target.closest("#notFlowModal")) e.stopImmediatePropagation();
}, true);
document.addEventListener("wheel", e => {
  if (notFlowLocked && !e.target.closest("#notFlowModal")) e.preventDefault();
}, { passive: false, capture: true });

// 啟動後立即偵測一次，之後每 1 秒持續輪詢分頁切換狀態（離開 Flow 會重彈、切回 Flow 會自動解除）
(async () => { try { await showNotFlowWarning(); } catch (e) { /* ignore */ } })();

// ---------------- Flow tab management ----------------
async function ensureFlowTab() {
  // 支援任何語言路徑版本：/fx/tools/flow、/fx/zh/tools/flow、/fx/en/tools/flow
  const tabs = await chrome.tabs.query({ url: "https://labs.google/fx/*tools/flow*" });
  if (tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    return tabs[0];
  }
  if (confirm(t("notOnFlow") + "\n" + t("openFlow"))) {
    const tab = await chrome.tabs.create({ url: FLOW_URL });
    return tab;
  }
  return null;
}

// ---------------- Random wait ----------------
function randWait() {
  const min = Math.min(settings.waitMin, settings.waitMax);
  const max = Math.max(settings.waitMin, settings.waitMax);
  return (min + Math.random() * (max - min)) * 1000;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------- Batch automation ----------------
async function startBatch(resumeIndex) {
  if (running) return;
  if (settings.mode === "frame2video" && uploadedFrames.length === 0 && !settings.chainEnabled) {
    toast(t("toastFramesFirst"));
    return;
  }
  updateQueueFromPrompts();
  if (queue.length === 0) {
    toast(t("toastPromptsFirst"));
    return;
  }

  // Auto-apply narration script: append each narration segment to its matching prompt
  if (narrations.length > 0) {
    queue.forEach(q => {
      const n = narrations.find(x => x.segment === q.id);
      if (n && n.text.trim()) {
        q.text = q.text.trim() + "\n\n" + t("narrLabel") + n.text.trim();
      }
    });
  }

  // Auto-detect resumable checkpoint in chain mode
  let effResume = resumeIndex !== undefined ? resumeIndex : 0;
  if (!effResume && settings.mode === "frame2video" && settings.chainEnabled) {
    const cp = tryDetectCheckpoint();
    if (cp) {
      const doneCount = queue.filter(q => q.status === "done").length;
      if (doneCount > 0 && doneCount < queue.length) {
        effResume = doneCount;
        toast(t("resumeHint", effResume + 1));
      }
    }
  }

  const tab = await ensureFlowTab();
  if (!tab) return;

  running = true;
  document.getElementById("btnRun").classList.add("hidden");
  document.getElementById("btnStop").classList.remove("hidden");

  // Merge checkpoint frames (previous chain last-frame copies) into uploaded frames
  let framesForConfig = uploadedFrames.map(f => ({ name: f.name, dataUrl: f.dataUrl }));
  const cp = loadCheckpoint();
  if (cp && effResume > 0 && cp.frames && cp.frames.length) {
    const lastCpFrame = cp.frames.reduce((a, b) => (b.index >= a.index ? b : a), cp.frames[0]);
    framesForConfig = [{ name: "chain-last-frame.png", dataUrl: lastCpFrame.dataURL }];
  }

  const config = {
    mode: settings.mode,
    concurrency: settings.mode === "frame2video" && settings.chainEnabled ? 1 : settings.concurrency,
    waitMin: settings.waitMin,
    waitMax: settings.waitMax,
    frames: framesForConfig,
    frameOption: settings.frameOption,
    chainEnabled: settings.chainEnabled,
    resumeIndex: effResume,
    outputCount: settings.outputCount,
    folder: settings.folder,
    rename: settings.rename,
    aspect: settings.aspect,
    model: settings.model,
    imageModel: settings.imageModel,
    downloadRes: settings.downloadRes,
    duration: settings.duration,
    defaultMode: settings.defaultMode,
    imageMode: settings.imageMode,
    videoRes: settings.videoRes,
    imageRes: settings.imageRes,
    charEnabled: settings.charEnabled,
    defaultChar: settings.defaultChar,
    maxImages: settings.maxImages,
    charImageEnabled: settings.charImageEnabled,
    voiceEnabled: settings.voiceEnabled,
    defaultVoice: settings.defaultVoice,
    charNames: Array.from(document.getElementById("charSelect")?.options || [])
      .map(o => o.value)
      .filter(v => v && v !== "__none__"),
    lang: currentLang,
  };

  // Show live preview panel in chain mode
  renderPreview();

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ["flow-automation.js"],
    });
    await chrome.tabs.sendMessage(tab.id, { type: "START_BATCH", config, queue });
    if (effResume > 0) toast(t("resumeStarted", effResume + 1));
    else toast(t("startSuccess"));
  } catch (err) {
    toast(t("toastStartFail", err.message));
    stopBatch();
  }
}

function stopBatch() {
  running = false;
  document.getElementById("btnRun").classList.remove("hidden");
  document.getElementById("btnStop").classList.add("hidden");
  if (settings.mode === "frame2video" && settings.chainEnabled) {
    saveCheckpoint();
    toast(t("checkpointSaved"));
  } else {
    toast(t("stopped"));
  }
}

// ---------------- Status updates from content script ----------------
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "ITEM_STATUS") {
    updateItem(msg.id, msg.status);
    if (msg.status === "done" || msg.status === "error") {
      const remaining = queue.filter(q => q.status === "running" || q.status === "pending").length;
      if (remaining === 0) {
        running = false;
        document.getElementById("btnRun").classList.remove("hidden");
        document.getElementById("btnStop").classList.add("hidden");
        if (settings.mode === "frame2video" && settings.chainEnabled) saveCheckpoint();
      } else if (settings.mode === "frame2video" && settings.chainEnabled) {
        saveCheckpoint();
      }
    }
  } else if (msg.type === "CHAIN_FRAME") {
    // Live preview: last frame of a completed chain segment
    previewAddFrame(msg.index, msg.dataURL);
  } else if (msg.type === "ITEM_RESULT") {
    // Live preview: generated video URL (playable)
    if (msg.videoUrl) previewAddVideo(msg.id, msg.videoUrl);
    const it = queue.find(q => q.id === msg.id);
    if (it) { it.retried = true; saveCheckpoint(); }
  } else if (msg.type === "ITEM_RETRY") {
    // Auto-retry due to failure or color transition gap
    const it = queue.find(q => q.id === msg.id);
    if (it) {
      it.status = "retrying";
      it.retried = true;
      updateItem(msg.id, "retrying");
      saveCheckpoint();
    }
  } else if (msg.type === "DEBUG_LOG") {
    addDebugLine(msg.text, msg.level);
  }
});
}

// ---------------- Debug log panel ----------------
let debugAutoScroll = true;

function addDebugLine(text, level) {
  const log = document.getElementById("debugLog");
  const status = document.getElementById("debugStatus");
  if (!log) return;
  const empty = log.querySelector(".debug-empty");
  if (empty) empty.remove();
  const line = document.createElement("div");
  line.className = "debug-line" + (level === "error" ? " error" : level === "info" ? " info" : "");
  line.textContent = "[" + new Date().toLocaleTimeString() + "] " + String(text || "");
  log.appendChild(line);
  // 統計實際日誌行數（排除 .debug-empty）並更新顯示
  const count = Array.from(log.children).filter(c => !c.classList.contains("debug-empty")).length;
  if (status) status.textContent = t("debugStatus", String(count));
  // Keep at most 2000 lines
  while (log.children.length > 2000) log.removeChild(log.firstChild);
  if (debugAutoScroll) log.scrollTop = log.scrollHeight;
}

function debugExportClick() {
  const log = document.getElementById("debugLog");
  const text = Array.from(log.querySelectorAll(".debug-line")).map(l => l.textContent).join("\n");
  if (!text) { toast(t("toastLogsExport")); return; }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const blob = new Blob(["Auto Flow Free - Debug Log (" + stamp + ")\n\n" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  if (typeof chrome !== "undefined" && chrome.downloads && chrome.downloads.download) {
    chrome.downloads.download({
      url: url,
      filename: "flow-automation-debug-" + stamp + ".txt",
      saveAs: false
    });
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = "flow-automation-debug-" + stamp + ".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  toast(t("debugExportDone", "flow-automation-debug-" + stamp + ".txt"));
}

async function debugCopyClick() {
      const log = document.getElementById("debugLog");
      const text = Array.from(log.querySelectorAll(".debug-line")).map(l => l.textContent).join("\n");
      if (!text) { toast(t("toastLogsCopy")); return; }
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch (e) {
        // Fallback for older contexts
        try {
          const ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta);
          ta.select();
          copied = document.execCommand("copy");
          ta.remove();
        } catch (e2) {
          copied = false;
        }
      }
      if (!copied) {
        toast(t("toastCopyFail"));
        return;
      }
  toast(t("debugCopied"));
}

function debugClearClick() {
  const log = document.getElementById("debugLog");
  const status = document.getElementById("debugStatus");
  if (log) log.innerHTML = '<div class="debug-empty" data-i18n="debugEmpty">' + t("debugEmpty") + "</div>";
  if (status) status.textContent = t("debugStatus", "0");
}

function bindDebugUI() {
  const autoScroll = document.getElementById("debugAutoScroll");
  if (autoScroll) {
    autoScroll.addEventListener("change", () => { debugAutoScroll = autoScroll.checked; });
  }
  // Fallback binding via onclick to be robust in all contexts (file://, side panel, popup)
  const copyBtn = document.getElementById("debugCopy");
  if (copyBtn) copyBtn.onclick = debugCopyClick;
  const clearBtn = document.getElementById("debugClear");
  if (clearBtn) clearBtn.onclick = debugClearClick;
  const exportBtn = document.getElementById("debugExport");
  if (exportBtn) exportBtn.onclick = debugExportClick;
}

// ---------------- Init ----------------
function init() {
  currentLang = settings.lang || "zh-TW";
  bindUI();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
