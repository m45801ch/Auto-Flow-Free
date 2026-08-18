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
    toggleChain: "Chain Prompt 連鎖生成",
    hintChain: "自動將上一段影片的最後一格畫面作為下一個 prompt 的輸入圖片。",
    hintChainNote: "啟用連鎖生成時，將依序逐一處理 prompt，無法並行。",
    hintPrompts: "用空行分隔每個 prompt。",
    toggleCharacter: "自動新增角色 (Google Flow 功能)",
    hintCharacter: "當提示詞中提及角色時，自動選擇對應角色。",
    labelDefaultChar: "預設角色",
    labelCharMulti: "掃描到的角色（多選）",
    hintCharScan: "尚未掃描任何角色。請先在 Google Flow 專案中建立角色，然後點選「掃描角色」，即可列出角色供選取。",
    labelMaxImages: "每個 prompt 的最大輸入圖片數",
    hintMaxImages: "每段提示詞處理時最多使用的輸入圖片數量。",
    toggleCharImages: "自動新增角色圖片",
    toggleCharImagesUpload: "自動新增上傳的角色圖片",
    hintCharImages: "自動新增與 prompt 中角色名稱相符的圖片（根據檔名）。",
    toggleVoice: "按說話者自動新增語音",
    hintVoice: "當 prompt 中提到說話者名稱時，自動選擇對應的語音。",
    labelDefaultVoice: "預設說話者",
    voiceDefault: "未設定語音",
    btnVoicePreview: "試聽",
    toastSelectVoiceFirst: "請先選擇語音",
    toastVoicePreviewFail: "語音試聽失敗",
    labelOutputs: "每個 prompt 的輸出數量",
    hintOutputs: "每個 prompt 需要生成的圖片/影片數量。",
    labelFolder: "儲存到資料夾",
    hintFolder: "下載檔案的子資料夾。",
    hintSettingsMore: "在「設定」分頁中自訂寬高比、時長與數量以獲得更多控制。",
    toggleRename: "自動重新命名檔案",
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
    themeDark: "暗黑",
    themeLight: "明亮",
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
    labelPrompts: "Prompts",
    uploadPrompts: "匯入提示詞 .txt / .csv",
    toastCsvInvalid: "不支援此檔案格式，請使用 .txt 或 .csv 純文字檔。",
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
    scanNone: "未找到角色。請先在 Google Flow 專案中開啟並建立角色後重新掃描；提示詞提到角色名稱時會依檔名自動匹配圖片。",
    scanAutoMatched: "已自動匹配（提示詞中提到的角色將自動選擇對應圖片，無須掃描）。",
    scanFound: "已掃描到 %N% 個角色，已顯示在上方清單供選取。提示詞提到角色名稱時也會依檔名自動匹配圖片。",
    toastAlreadyRunning: "正在執行中",
    toastPreviewCleared: "預覽與斷點已清除",

    toastNoCheckpoint: "沒有找到可續跑的斷點",
    toastFramesFirst: "請先上傳幀圖片（或開啟連鎖生成以用 Flow 輸出作為起始幀）",
    toastPromptsFirst: "沒有 Prompts，請先新增",
    toastLogsExport: "沒有日誌可匯出",
    toastLogsCopy: "沒有日誌可複製",
    toastCacheCleared: "快取已清除",
    toastCleared: "已清除",
    dragHandleTitle: "拖曳調整順序",
    toastFileSkip: "%N1% 超過 50MB，已跳過",
    toastScanFail: "掃描失敗：%N1%",
    toastLeaveFlow: "流程執行中請勿離開 Flow 頁面，否則流程可能中斷！",
    toastStartFail: "啟動失敗：%N1%",
    toastCopyFail: "複製失敗，請手動選擇複製。",
    statusPending: "等待中", statusRunning: "執行中", statusDone: "已完成", statusError: "失敗", statusRetrying: "重試中",
    uploadHintZh: "PNG, JPG, GIF 每個大小不超過 50MB",
    labelPerPromptDur: "各段秒數設定",
    hintPerPromptDur: "為每段 Prompt 單獨設定影片秒數；未特別指定的段落使用上方「預設影片長度」。",
    perDurGlobal: "跟隨預設",
    perDurSec: "秒",
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
    toggleChain: "Chain Prompt Chaining",
    hintChain: "Automatically use the last frame of the previous video as the input image for the next prompt.",
    hintChainNote: "When chaining is enabled, prompts are processed one by one in order (no concurrency).",
    hintPrompts: "Separate each prompt with blank lines.",
    toggleCharacter: "Auto-add character (Google Flow feature)",
    hintCharacter: "Automatically select the character when it is mentioned in a prompt.",
    labelDefaultChar: "Default character",
    labelCharMulti: "Scanned characters (multi-select)",
    hintCharScan: "No characters scanned yet. Create characters in your Flow project first, then click \"Scan characters\" to list them for selection.",
    labelMaxImages: "Max input images per prompt",
    hintMaxImages: "Maximum number of input images used per prompt.",
    toggleCharImages: "Auto-add character images",
    toggleCharImagesUpload: "Auto-add uploaded character images",
    hintCharImages: "Auto-add images whose file names match character names mentioned in the prompt.",
    toggleVoice: "Auto-add voice by speaker",
    hintVoice: "When a prompt mentions a speaker name, automatically select the corresponding voice.",
    labelDefaultVoice: "Default speaker",
    voiceDefault: "No voice configured",
    btnVoicePreview: "Preview",
    toastSelectVoiceFirst: "Select a voice first",
    toastVoicePreviewFail: "Voice preview failed",
    labelOutputs: "Outputs per prompt",
    hintOutputs: "Number of images/videos to generate per prompt.",
    labelFolder: "Save to folder",
    hintFolder: "Sub-folder for downloaded files.",
    hintSettingsMore: "Customize aspect ratio, duration and count in the Settings tab for more control.",
    toggleRename: "Auto rename files",
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
    themeDark: "Dark",
    themeLight: "Light",
    optLangTw: "Traditional Chinese",
    optLangCn: "Simplified Chinese",
    optLangEn: "English",
    repoTitle: "GitHub repo",
    swapTitle: "Swap",
    labelPrompts: "Prompts",
    uploadPrompts: "Import prompts .txt / .csv",
    toastCsvInvalid: "This file format is not supported. Please use a .txt or .csv plain-text file.",
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
    scanNone: "No characters found. Open your Flow project, create characters, then scan again; names mentioned in prompts are also auto-matched by file name.",
    scanFound: "Scanned %N% characters, listed above for selection. Names mentioned in prompts are also auto-matched by file name.",
    scanAutoMatched: "Auto-matched (characters mentioned in prompts are selected automatically; no scan needed).",
    toastAlreadyRunning: "Already running",
    toastPreviewCleared: "Preview and checkpoint cleared",
    toastCsvInvalid: "This file format is not supported. Please use a .txt or .csv plain-text file.",
    toastNoCheckpoint: "No checkpoint found to resume",
    toastFramesFirst: "Please upload frames first (or enable Chain Prompt to start from Flow output)",
    toastPromptsFirst: "No prompts. Please add prompts first",
    toastLogsExport: "No logs to export",
    toastLogsCopy: "No logs to copy",
    toastCacheCleared: "Cache cleared",
    toastCleared: "Cleared",
    dragHandleTitle: "Drag to reorder",
    toastFileSkip: "%N1% exceeds 50MB, skipped",
    toastScanFail: "Scan failed: %N1%",
    toastLeaveFlow: "Please stay on the Flow page while processing — leaving may interrupt the flow!", 
    toastStartFail: "Failed to start: %N1%",
    toastCopyFail: "Copy failed. Please select and copy manually.",
    statusPending: "Pending", statusRunning: "Running", statusDone: "Done", statusError: "Failed", statusRetrying: "Retrying",
    uploadHintZh: "PNG, JPG, GIF each under 50MB",
    labelPerPromptDur: "Per-prompt duration",
    hintPerPromptDur: "Set the video duration for each prompt individually. Segments without a specific value use the default duration above.",
    perDurGlobal: "Use default",
    perDurSec: "s",
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
    toggleChain: "Chain Prompt 连锁生成",
    hintChain: "自动将上一个视频的最后画面作为下一个 prompt 的输入图片。",
    hintChainNote: "启用连锁生成时，将按顺序逐个处理 prompt，无法并发。",
    hintPrompts: "用空行分隔每个 prompt。",
    toggleCharacter: "Auto-add character (Google Flow feature)",
    hintCharacter: "当提示词中提及角色时，自动选择对应角色。",
    labelDefaultChar: "默认角色",
    labelCharMulti: "扫描到的角色（多选）",
    hintCharScan: "尚未扫描任何角色。请先在 Google Flow 项目中创建角色，然后点击「扫描角色」，即可列出角色供选取。",
    labelMaxImages: "每个 prompt 的最大输入图片数",
    hintMaxImages: "每段提示词处理时最多使用的输入图片数量。",
    toggleCharImages: "自动添加角色图片",
    toggleCharImagesUpload: "自动添加上传的角色图片",
    hintCharImages: "自动添加与 prompt 中角色名称匹配的图片（基于文件名）。",
    toggleVoice: "按说话者自动添加语音",
    hintVoice: "当 prompt 中提到说话者名称时，自动选择对应的语音。",
    labelDefaultVoice: "默认说话者",
    voiceDefault: "未配置语音",
    btnVoicePreview: "试听",
    toastSelectVoiceFirst: "请先选择语音",
    toastVoicePreviewFail: "语音试听失败",
    labelOutputs: "每个 prompt 的输出数量",
    hintOutputs: "每个 prompt 需要生成的图片/视频数量。",
    labelFolder: "保存到文件夹",
    hintFolder: "下载文件的子文件夹。",
    hintSettingsMore: "在「设置」标签中自定义宽高比、时长和数量以获得更多控制。",
    toggleRename: "自动更改文件名",
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
    themeDark: "暗黑",
    themeLight: "明亮",
    optLangTw: "中文（繁體）",
    optLangCn: "简体中文",
    optLangEn: "English",
    repoTitle: "GitHub 仓库",
    swapTitle: "交换",
    labelPrompts: "Prompts",
    uploadPrompts: "导入提示词 .txt / .csv",
    toastCsvInvalid: "不支持此文件格式，请使用 .txt 或 .csv 纯文本文件。",
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
    scanNone: "未找到角色。请先在 Google Flow 项目中打开并创建角色后重新扫描；提示词中提到的角色名称会依文件名自动匹配图片。",
    scanFound: "已扫描到 %N% 个角色，已显示在上方清单供选取。提示词中提到的角色名称也会依文件名自动匹配图片。",
    scanAutoMatched: "已自动匹配（提示词中提到的角色将自动选择对应图片，无须扫描）。",
    toastAlreadyRunning: "正在运行中",
    toastPreviewCleared: "预览与断点已清除",
    toastCsvInvalid: "不支持此文件格式，请使用 .txt 或 .csv 纯文本文件。",
    toastNoCheckpoint: "没有找到可续跑的断点",
    toastFramesFirst: "请先上传帧图片（或开启连锁生成以用 Flow 输出作为起始帧）",
    toastPromptsFirst: "没有 Prompts，请先添加",
    toastLogsExport: "没有日志可导出",
    toastLogsCopy: "没有日志可复制",
    toastCacheCleared: "缓存已清除",
    toastCleared: "已清除",
    dragHandleTitle: "拖拽调整顺序",
    toastFileSkip: "%N1% 超过 50MB，已跳过",
    toastScanFail: "扫描失败：%N1%",
    toastLeaveFlow: "流程执行中请勿离开 Flow 页面，否则流程可能中断！", 
    toastStartFail: "启动失败：%N1%",
    toastCopyFail: "复制失败，请手动选择复制。",
    statusPending: "等待中", statusRunning: "运行中", statusDone: "已完成", statusError: "失败", statusRetrying: "重试中",
    uploadHintZh: "PNG, JPG, GIF 每个大小不超过 50MB",
    labelPerPromptDur: "各段秒数设置",
    hintPerPromptDur: "为每段 Prompt 单独设置视频时长；未特别指定的段落使用上方「默认视频选项」。",
    perDurGlobal: "跟随默认",
    perDurSec: "秒",
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
    // Reorder this mode's per-prompt durations to follow the new segment order
    if (settings.promptDurations && settings.promptDurations[settings.mode]) {
      const durMap = settings.promptDurations[settings.mode];
      const newDur = {};
      queue.forEach((q, newIdx) => {
        const oldIdx = map.get(q.id);
        if (oldIdx !== undefined && durMap[String(oldIdx)] !== undefined) {
          newDur[String(newIdx)] = durMap[String(oldIdx)];
        }
      });
      settings.promptDurations[settings.mode] = newDur;
    }
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
    charSelected: [],
    defaultChar: "",
    maxImages: 2,
    charImageEnabled: false,
    voiceEnabled: false,
    defaultVoice: "",
    outputCount: 1,
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
    modePrompts: {},
    promptDurations: {},
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
// 智慧體自動化（agent）模式下，角色圖片開關改為強調「上傳的」角色圖片
function updateCharImageLabel() {
  const charImgLabel = document.querySelector('[data-i18n="toggleCharImages"]');
  if (charImgLabel) {
    charImgLabel.innerHTML = settings.mode === "agent" ? t("toggleCharImagesUpload") : t("toggleCharImages");
  }
}
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
  // 智慧體自動化（agent）模式下，角色圖片開關改為強調「上傳的」角色圖片
  updateCharImageLabel();
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
  select.innerHTML = '<option value="" data-i18n="optCharNone">' + t("optCharNone") + '</option>';
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    opt.dataset.charImg = "";
    select.appendChild(opt);
  });
  if (names.includes(prev)) select.value = prev;
}

// Google Flow 內建 30 個 Chirp 3 HD 語音（來源: docs.cloud.google.com/text-to-speech/docs/chirp3-hd）
// 性別來自官方文件；tone（語調）為 Flow UI 顯示的特質描述。
const VOICES = [
  { name: "Achernar", gender: "female", tone: "柔和，高音調" },
  { name: "Achird", gender: "male", tone: "友好，中音調" },
  { name: "Algenib", gender: "male", tone: "沙啞，低音調" },
  { name: "Algieba", gender: "male", tone: "隨和，中低音調" },
  { name: "Alnilam", gender: "male", tone: "穩重，中低音調" },
  { name: "Aoede", gender: "female", tone: "輕快，中音調" },
  { name: "Autonoe", gender: "female", tone: "明亮，中音調" },
  { name: "Callirrhoe", gender: "female", tone: "隨和，中音調" },
  { name: "Charon", gender: "male", tone: "訊息豐富，低音調" },
  { name: "Despina", gender: "female", tone: "流暢，中音調" },
  { name: "Enceladus", gender: "male", tone: "和氣親切，低音調" },
  { name: "Erinome", gender: "female", tone: "清晰，中音調" },
  { name: "Fenrir", gender: "male", tone: "活潑，年輕音調" },
  { name: "Gacrux", gender: "female", tone: "成熟，中音調" },
  { name: "Iapetus", gender: "male", tone: "清晰，中低音調" },
  { name: "Kore", gender: "female", tone: "穩重，中音調" },
  { name: "Laomedeia", gender: "female", tone: "活躍，中高音調" },
  { name: "Leda", gender: "female", tone: "年輕，中高音調" },
  { name: "Orus", gender: "male", tone: "穩重，中低音調" },
  { name: "Pulcherrima", gender: "female", tone: "積極，中高音調" },
  { name: "Puck", gender: "male", tone: "活潑，中音調" },
  { name: "Rasalgethi", gender: "male", tone: "訊息豐富，中音調" },
  { name: "Sadachbia", gender: "male", tone: "活力，低音調" },
  { name: "Sadaltager", gender: "male", tone: "博學，中音調" },
  { name: "Schedar", gender: "male", tone: "沉穩，中音調" },
  { name: "Sulafat", gender: "female", tone: "溫暖，高音調" },
  { name: "Umbriel", gender: "male", tone: "自然，中音調" },
  { name: "Vindemiatrix", gender: "female", tone: "溫暖，中音調" },
  { name: "Zephyr", gender: "female", tone: "親切，高音調" },
  { name: "Zubenelgenubi", gender: "male", tone: "磁性，中音調" },
];

function rebuildVoiceOptions() {
  const select = document.getElementById("voiceSelect");
  if (!select) return;
  const prev = select.value;
  const genderLabel = (g) => currentLang === "en" ? (g === "male" ? "Male" : "Female") : (g === "male" ? "男" : "女");
  select.innerHTML = '<option value="">' + t("optCharNone") + '</option>';
  VOICES.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    let label = v.name + " - " + genderLabel(v.gender);
    if (v.tone) label += " - " + v.tone;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if (Array.from(select.options).some(o => o.value === prev)) select.value = prev;
}

// 試聽：官方文件提供每個 Chirp 3 HD 語音的示範音檔（公開 CDN），
// 檔名規律為 chirp3-hd-<voice 小寫>.wav。
function voiceDemoUrl(name) {
  return "https://docs.cloud.google.com/static/text-to-speech/docs/audio/chirp3-hd-" + String(name).toLowerCase() + ".wav";
}

let voicePreviewAudio = null;
function previewVoice() {
  const name = document.getElementById("voiceSelect")?.value;
  if (!name) { toast(t("toastSelectVoiceFirst")); return; }
  if (voicePreviewAudio) { try { voicePreviewAudio.pause(); } catch (e) { /* ignore */ } }
  voicePreviewAudio = new Audio(voiceDemoUrl(name));
  voicePreviewAudio.play().catch(() => { toast(t("toastVoicePreviewFail")); });
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
      // 儲存當前模式的提示詞，再切換到新模式並載入該模式的提示詞
      saveCurrentModePrompts();
      settings.mode = btn.dataset.mode;
      loadModePrompts();
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
  promptsEl.addEventListener("input", () => {
    saveCurrentModePrompts();
    updateQueueFromPrompts();
  });

  // File upload: prompts .txt / .csv (merged into one button)
  document.getElementById("filePrompts").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const isCsv = /\.csv$/i.test(file.name);
    const isTxt = /\.txt$/i.test(file.name);
    if (!isTxt && !isCsv) {
      toast(t("toastCsvInvalid"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let text = reader.result.trim();
      if (isCsv) {
        const rows = text.split(/\r?\n/).map(r => r.trim()).filter(r => r);
        // drop header if exists
        text = rows.slice(1).map(r => r.split(",")[0]).filter(r => r).join("\n\n");
      }
      if (!text) return;
      promptsEl.value = (promptsEl.value ? promptsEl.value.trim() + "\n\n" : "") + text;
      saveCurrentModePrompts();
      updateQueueFromPrompts();
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // Character toggle & scan
  const charToggle = document.getElementById("charToggle");
  charToggle.checked = settings.charEnabled;
  charToggle.addEventListener("change", () => {
    settings.charEnabled = charToggle.checked;
    saveSettings();
    updateCharScanState();
  });
  document.getElementById("scanChars").addEventListener("click", scanCharacters);
  updateCharScanState();

  // Character multi-select: card checkboxes ⟷ dropdown (bidirectional sync)
  document.getElementById("charSelect").addEventListener("change", onCharSelectMultiChange);

  // Scanned-character card collapse/expand
  const multiToggle = document.getElementById("charMultiToggle");
  if (multiToggle) {
    const multiList = document.getElementById("charMultiList");
    const multiHeader = document.getElementById("charMultiHeader");
    multiToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const collapsed = multiList.classList.toggle("collapsed");
      multiToggle.querySelector(".caret-icon").classList.toggle("collapsed", collapsed);
      multiToggle.setAttribute("title", collapsed ? "展開" : "收合");
      if (multiHeader) multiHeader.setAttribute("title", collapsed ? "展開" : "收合");
    });
    // Clicking the header toggles as well
    if (multiHeader) multiHeader.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      multiToggle.click();
    });
  }

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
  const voicePreviewBtn = document.getElementById("voicePreview");
  if (voicePreviewBtn) voicePreviewBtn.addEventListener("click", previewVoice);

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
  document.getElementById("durationSelect").addEventListener("change", e => { settings.duration = e.target.value; saveSettings(); updatePerPromptDurList(); });
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
    applyTheme();
    const themeSel2 = document.getElementById("themeSelect");
    if (themeSel2) themeSel2.value = settings.theme || "light";
    const ls = document.getElementById("langSelect");
    if (ls) ls.value = settings.lang;
    currentLang = settings.lang;
    applyI18n();
  }

  // Theme switcher: dark / light
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
    saveCurrentModePrompts();
    uploadedFrames = [];
    renderUploadedFrames();
    updateQueueFromPrompts();
    clearCheckpoint();
    toast(t("toastCleared"));
  });
  bindPreviewUI();
  bindDebugUI();
  document.getElementById("btnRun").addEventListener("click", startBatch);
  document.getElementById("btnStop").addEventListener("click", stopBatch);

  updateModeUI();
  loadModePrompts();
  updateQueueFromPrompts();
  applyI18n();
  showNotFlowWarning();
}

// ---------------- Mode UI ----------------
function updateModeUI() {
  const isFrame = settings.mode === "frame2video";
  const needsUploadZone = settings.mode !== "text2video" && settings.mode !== "text2image";
  const isImage = settings.mode === "text2image" || settings.mode === "image2image";
  const isImg2Img = settings.mode === "image2image";
  const needsMaxImages = isImg2Img || settings.mode === "components2video" || settings.mode === "agent";
  const supportsCharImages = isImg2Img || settings.mode === "components2video" || settings.mode === "agent";
  const supportsVoice = settings.mode === "text2video" || settings.mode === "components2video" || settings.mode === "agent";
  document.getElementById("uploadZone").classList.toggle("hidden", !needsUploadZone);
  document.getElementById("frameOptions").classList.toggle("hidden", !isFrame);
  document.getElementById("chainCard").classList.toggle("hidden", !isFrame);
  document.getElementById("maxImagesCard").classList.toggle("hidden", !needsMaxImages);
  document.getElementById("charImageCard").classList.toggle("hidden", !supportsCharImages);
  updateCharImageLabel();
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

// ---------------- Per-mode prompts (each mode keeps its own prompt text) ----------------
function saveCurrentModePrompts() {
  const promptsEl = document.getElementById("prompts");
  if (!promptsEl) return;
  if (!settings.modePrompts) settings.modePrompts = {};
  settings.modePrompts[settings.mode] = promptsEl.value;
}
function loadModePrompts() {
  const promptsEl = document.getElementById("prompts");
  if (!promptsEl) return;
  if (!settings.modePrompts) settings.modePrompts = {};
  if (settings.modePrompts[settings.mode] !== undefined) {
    promptsEl.value = settings.modePrompts[settings.mode];
  } else {
    promptsEl.value = "";
  }
  updatePerPromptDurList();
}

// ---------------- Per-prompt duration panel ----------------
// settings.promptDurations = { mode: { "0": "8", "1": "4" } }
// Value "global" means: follow the global default (settings.duration).
function getPerPromptDuration(idx) {
  const perMode = (settings.promptDurations && settings.promptDurations[settings.mode]) || {};
  const v = perMode[String(idx)];
  if (v && v !== "global") return v;
  return settings.duration || "8";
}
function updatePerPromptDurList() {
  const card = document.getElementById("perDurCard");
  const list = document.getElementById("perDurList");
  if (!card || !list) return;
  const prompts = parsePrompts();
  if (prompts.length < 1) {
    card.classList.add("hidden");
    return;
  }
  card.classList.remove("hidden");
  if (!settings.promptDurations) settings.promptDurations = {};
  const perMode = settings.promptDurations[settings.mode] || {};
  list.innerHTML = "";
  prompts.forEach((text, i) => {
    const row = document.createElement("div");
    row.className = "dur-row";
    const preview = text.replace(/\s+/g, " ").slice(0, 40) + (text.length > 40 ? "…" : "");
    const customVal = perMode[String(i)];
    const isCustom = customVal && customVal !== "global";
    const sel = document.createElement("select");
    sel.className = "dur-select";
    const defSec = settings.duration || "8";
    sel.innerHTML = [
      "<option value=\"4\"" + (isCustom && customVal === "4" ? " selected" : "") + ">4 " + t("perDurSec") + "</option>",
      "<option value=\"6\"" + (isCustom && customVal === "6" ? " selected" : "") + ">6 " + t("perDurSec") + "</option>",
      "<option value=\"8\"" + (isCustom && customVal === "8" ? " selected" : "") + ">8 " + t("perDurSec") + "</option>",
      "<option value=\"10\"" + (isCustom && customVal === "10" ? " selected" : "") + ">10 " + t("perDurSec") + "</option>",
      "<option value=\"global\"" + (!isCustom ? " selected" : "") + ">" + defSec + " " + t("perDurSec") + "</option>",
    ].join("");
    sel.addEventListener("change", e => {
      if (!settings.promptDurations) settings.promptDurations = {};
      if (!settings.promptDurations[settings.mode]) settings.promptDurations[settings.mode] = {};
      if (e.target.value === "global") delete settings.promptDurations[settings.mode][String(i)];
      else settings.promptDurations[settings.mode][String(i)] = e.target.value;
      saveSettings();
      updatePerPromptDurList(); // refresh the "global" option display
    });
    row.innerHTML = '<div class="dur-num">#' + (i + 1) + '</div>' +
      '<div class="dur-text"><b>' + escapeHtml(preview) + '</b> <span class="dur-chars">' + text.length + " chars</span></div>";
    row.appendChild(sel);
    list.appendChild(row);
  });
}

// ---------------- Queue ----------------
function parsePrompts() {
  const raw = document.getElementById("prompts").value;
  return raw.split(/\n\s*\n/).map(s => s.trim()).filter(s => s);
}

function updateQueueFromPrompts() {
  const prompts = parsePrompts();
  queue = prompts.map((text, i) => ({ id: i, text, status: "pending", duration: getPerPromptDuration(i) }));
  renderQueue();
  updatePerPromptDurList();
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
// 真正掃描 Flow 專案中已建立的角色：從專案面板的角色區提取角色名稱與圖片縮圖，
// 列出供使用者選取（預設角色下拉）。
async function scanCharacters() {
  const tab = await ensureFlowTab();
  if (!tab) return;
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        const chars = []; // { name, src }
        const seen = new Set();
        function add(name, src, fromPanel = false) {
          const key = String(name || "").trim().toLowerCase();
          if (!key || seen.has(key)) return;
          seen.add(key);
          chars.push({ name: String(name).trim(), src: src || "" });
        }
        function isValidName(n, fromPanel = false) {
          if (!n) return false;
          const s = String(n).trim();
          if (s.length === 0 || s.length > 60) return false;
          // Panel/section titles & UI action names are NOT characters
          if (/^(新建|添加|新增|create|add|new|upload|delete|remove|close|more|options|edit|share|menu|settings|home|角色|characters?|characters list|character list|character panel|角色列表)$/i.test(s)) return false;
          // Non-character UI elements that must never be collected
          // (user feedback: 用户头像, 生成概念图, 制作视觉情绪板, Learn about generation costs,
          //  帶我了解你能做什麼 — Flow 對話面板的建議選項，絕非角色)
          if (/用户头像|用户头象|头像|生成概念|制作视觉|情绪板|视觉情绪|learn about generation|concept art|mood board|概念图|情緒板|帶我了解你能做什麼|帶我瞭解你能做什麼|learn what you can do|what you can create|帶我認識|我能做/i.test(s)) return false;
          // Guard against account avatars & AI suggestion cards
          // (e.g. "account_pro" avatar, "suggest_1") — UI names with these prefixes
          // are never user-created characters, regardless of where they appear.
          if (/^(account|user|avatar|profile|suggest|ai_|suggestion)/i.test(s)) return false;
          if (!fromPanel && /_(pro|free|premium|avatar|suggested)$/i.test(s)) return false;
          // Flow "add new character" buttons carry accessibility labels like
          // "accessibility_newjade_disc" (aria-label prefix) — never user-created roles
          if (/^accessibility_/.test(s) || /accessibility_new/i.test(s)) return false;
          // AI assistant / tool panels: cards whose text is dominated by AI action phrases
          if (/(^|\n|\s)(生成|制作|创作|创作图|Learn about|learn about)/i.test(s) && !/^[A-Za-z0-9][A-Za-z0-9_\-]*$/.test(s)) return false;
          // Account avatar / PRO badge / single-word short labels are never user-created
          // characters (e.g. "PRO" from the account avatar with a PRO badge).
          // Real character names are filename-like: 4+ chars; short badge words (PRO,
          // FREE, ...) are blocked by the explicit list below.
          if (s.length < 4) return false;
          if (/^pro$|^free$|^premium|^admin$|^user$|^guest$|^plus$|^test0?$|^beta$|^demo$|^new$/i.test(s)) {
            // Allow "test" ONLY if it actually came from a character panel image card
            // (the panel scan pass sets add-from-panel marker); page-wide passes block it.
            if (!fromPanel) return false;
          }
          return true;
        }
        // ---- Locate the user-created character panel(s) ----
        // A character panel: container whose aria-label/title/textContent mentions
        // 角色/character and actually contains image cards. Everything else is ignored.
        const panels = [];
        try {
          document.querySelectorAll("[aria-label*='角色'], [aria-label*='character' i], [aria-label*='characters' i], [title*='角色'], [title*='character' i], [title*='characters' i], [data-testid*='character'], [class*='character']").forEach(el => {
            if (!el.querySelector("img[src]")) return;
            // The panel's own visible label (标题) may contain 角色/character — check only
            // the header-level element (h1..h4, first heading, aria-label), NOT every
            // nested span/div, otherwise the right-side AI assistant dialog is matched too.
            const header = el.querySelector("h1,h2,h3,h4");
            const headerText = header ? " " + header.textContent : "";
            const al = (el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "") + headerText;
            if (/角色|character/i.test(al)) panels.push(el);
          });
        } catch (e) { /* ignore */ }
        // Strategy 1 (panel-scoped, HIGHEST priority): imgs inside character panels —
        // the card name comes from the same card element as the image. The panel title
        // itself is a section header, not a character. Card text can be noisy (timestamps,
        // extra labels) so we split it into tokens and prefer the token that looks like
        // the character's filename, falling back to alt text.
        panels.forEach(panel => {
          try {
            panel.querySelectorAll("img[src]").forEach(img => {
              // Locate the card wrapper that owns this image: a figure/li, or the
              // innermost container that holds exactly this one image. This prevents
              // a shared wrapper (a row of character cards, or a card with a status
              // icon first) from hiding every card except the first one — otherwise
              // short-named characters like "test" fall through to the page-wide
              // pass, where the name blacklist would drop them.
              let card = img.parentElement;
              let hops = 0;
              while (card && card !== panel && hops < 10) {
                const t = (card.tagName || "").toUpperCase();
                if (t === "FIGURE" || t === "LI") break;
                if (t === "DIV" && Array.from(card.querySelectorAll("img[src]")).filter(i => i !== img).length === 0) break;
                card = card.parentElement;
                hops++;
              }
              if (!card || card === panel) card = img;
              // A real card: the image must be the main/first image of its card.
              // (An <img> fallback means the panel itself holds the image directly.)
              const cardImgs = card === img ? [img] : Array.from(card.querySelectorAll("img[src]"));
              if (cardImgs.length === 0 || cardImgs[0] !== img) return;
              const alt = (img.getAttribute("alt") || "").trim();
              const cardText = (card?.textContent || "").replace(/\s+/g, " ").trim();
              let name = "";
              // Prefer a filename-like token inside the card text (handles cards whose
              // visible text is noisy, e.g. "12:02  lin_cat  57.26" mixed lines)
              const tokens = cardText.split(/[\s,，、;；|\/]+/).filter(w => w.length > 0);
              for (const w of tokens) {
                if (/^[A-Za-z0-9][A-Za-z0-9_\-]{2,30}$/i.test(w) && isValidName(w, true)) {
                  name = w; break;
                }
              }
              if (!name && /^[A-Za-z0-9][A-Za-z0-9_\-]{2,30}$/i.test(alt)) name = alt;
              if (!name) name = alt || cardText;
              if (isValidName(name, true)) add(name, img.src);
            });
          } catch (e) { /* ignore */ }
        });
        // Strategy 2 (page-wide, safety-filtered): filename-like alt text anywhere on
        // the page — catches user-created character cards whose names are stored as
        // filenames (e.g. "lin_cat"). The isValidName exclude list filters UI elements
        // (用户头像, 生成概念图, mood board buttons, ...).
        try {
          document.querySelectorAll("img[src]").forEach(img => {
            const alt = (img.getAttribute("alt") || "").trim();
            if (!alt) return;
            if (/^[A-Za-z0-9][A-Za-z0-9_\-]{1,30}$/i.test(alt) && isValidName(alt, false)) add(alt, img.src);
          });
        } catch (e) { /* ignore */ }
        // Strategy 4: character selector dialog / picker (when Flow opens character picker)
        try {
          document.querySelectorAll("dialog img[src], [role='dialog'] img[src], [aria-modal='true'] img[src], [class*='character-picker'] img[src]").forEach(img => {
            const name = (img.closest("div,li")?.textContent || "").replace(/\s+/g, " ").trim();
            if (isValidName(name)) add(name, img.src);
          });
        } catch (e) { /* ignore */ }
        return chars;
      },
    });
    const chars = (results || []).flatMap(r => r?.result || []);
    // Deduplicate across frames
    const dedup = [];
    const seenGlobal = new Set();
    chars.forEach(c => {
      const k = String(c.name || "").trim().toLowerCase();
      if (!k || seenGlobal.has(k)) return;
      seenGlobal.add(k);
      dedup.push({ name: String(c.name).trim(), src: c.src || "" });
    });
    const select = document.getElementById("charSelect");
    select.innerHTML = '<option value="" data-i18n="optCharNone">' + t("optCharNone") + '</option>';
    dedup.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      if (c.src) opt.dataset.charImg = c.src;
      select.appendChild(opt);
    });
    const hint = document.getElementById("charHint");
    if (dedup.length === 0) {
      hint.textContent = t("hintCharScan");
      toast(t("scanNone"));
      renderCharMultiList([]);
    } else {
      hint.textContent = t("scanFound", dedup.length);
      toast(t("scanFound", dedup.length));
      renderCharMultiList(dedup);
    }
  } catch (err) {
    toast(t("toastScanFail", err.message));
  }
}

// ---------------- Character multi-select list ----------------
// 掃描結果渲染成勾選清單：勾選的角色即為提示詞自動匹配的角色池；
// 未勾選任何角色時，自動匹配退回「預設角色」單選（既有用法）。
function renderCharMultiList(chars) {
  const card = document.getElementById("charMultiCard");
  const list = document.getElementById("charMultiList");
  if (!list) return;
  if (!settings.charSelected || !Array.isArray(settings.charSelected)) settings.charSelected = [];
  if (!chars || chars.length === 0) {
    if (card) card.classList.add("hidden");
    return;
  }
  if (card) card.classList.remove("hidden");
  list.innerHTML = "";
  chars.forEach(c => {
    const checked = settings.charSelected.includes(c.name);
    const item = document.createElement("label");
    item.className = "char-multi-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "char-multi-cb";
    cb.value = c.name;
    cb.checked = checked;
    cb.disabled = !!settings.charEnabled;
    cb.addEventListener("change", () => {
      const names = Array.from(list.querySelectorAll("input[type='checkbox']")).filter(i => i.checked).map(i => i.value);
      settings.charSelected = names;
      saveSettings();
      syncCharSelectFromMulti(names);
    });
    const nameSpan = document.createElement("span");
    nameSpan.textContent = c.name;
    item.appendChild(cb);
    item.appendChild(nameSpan);
    if (c.src) {
      const img = document.createElement("img");
      img.src = c.src;
      img.alt = c.name;
      img.className = "char-multi-thumb";
      item.appendChild(img);
    }
    list.appendChild(item);
  });
  // Dropdown: multiple-select synced with the card checkboxes
  syncCharSelectFromMulti(settings.charSelected);
}

// 掃描卡片與下拉選單多選雙向同步：勾選名單 → 下拉的 option 勾選狀態同步更新
function syncCharSelectFromMulti(names) {
  const sel = document.getElementById("charSelect");
  if (!sel) return;
  Array.from(sel.options).forEach(o => {
    o.selected = !!(o.value && o.value !== "__none__" && names.includes(o.value));
  });
}

// 下拉多選變更 → 同步回掃描卡片與 charSelected
function onCharSelectMultiChange() {
  const sel = document.getElementById("charSelect");
  const list = document.getElementById("charMultiList");
  if (!sel) return;
  const names = Array.from(sel.selectedOptions).map(o => o.value).filter(v => v && v !== "__none__");
  settings.charSelected = names;
  saveSettings();
  if (list) {
    list.querySelectorAll("input[type='checkbox']").forEach(cb => {
      cb.checked = names.includes(cb.value);
    });
  }
}

// ---------------- Character scan state (auto-match vs scan) ----------------
// 當「自動新增角色」開啟時，角色由提示詞自動匹配，掃描按鈕顯示「已自動匹配」且不可點擊。
function updateCharScanState() {
  const btn = document.getElementById("scanChars");
  const hint = document.getElementById("charHint");
  const sel = document.getElementById("charSelect");
  const multiList = document.getElementById("charMultiList");
  const multiToggle = document.getElementById("charMultiToggle");
  const multiHeader = document.getElementById("charMultiHeader");
  if (!btn || !hint) return;
  const span = btn.querySelector("span");
  if (settings.charEnabled) {
    btn.disabled = true;
    btn.classList.add("disabled");
    if (span) span.textContent = t("scanAutoMatched");
    hint.textContent = t("scanAutoMatched");
    // Auto-match is ON → the default-character dropdown must not be used
    if (sel) { sel.disabled = true; sel.classList.add("disabled"); }
    // 自動匹配時，多選清單不可再勾選，並收合
    if (multiList) {
      multiList.querySelectorAll("input[type='checkbox']").forEach(cb => { cb.disabled = true; });
      multiList.classList.add("collapsed");
    }
    if (multiToggle) {
      const caret = multiToggle.querySelector(".caret-icon");
      if (caret) caret.classList.add("collapsed");
      multiToggle.setAttribute("title", "展開");
    }
    if (multiHeader) multiHeader.setAttribute("title", "展開");
  } else {
    btn.disabled = false;
    btn.classList.remove("disabled");
    if (span) span.textContent = t("btnScanChars");
    hint.textContent = t("hintCharScan");
    if (sel) { sel.disabled = false; sel.classList.remove("disabled"); }
    if (multiList) {
      multiList.querySelectorAll("input[type='checkbox']").forEach(cb => { cb.disabled = false; });
    }
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
      // v1.9.1 已驗證的成功實作：直接查詢目前活動分頁網址（tabs 權限在 side panel 可用）；
      // 支援任何語言路徑：/fx/tools/flow、/fx/zh/tools/flow、/fx/en/tools/flow 等
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tabs[0]?.url || "";
      isFlowProject = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i.test(url);
    } else {
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
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tabs[0]?.url || "";
        const onFlow = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i.test(url);
        const shouldLock = !onFlow;
        if (shouldLock !== lastFlowState) {
          lastFlowState = shouldLock;
          modal.classList.toggle("hidden", !shouldLock);
          document.body.classList.toggle("notflow-locked", shouldLock);
          notFlowLocked = shouldLock;
          // 批次任務執行中離開 Flow 頁面：提示使用者不可離開，否則流程會中斷
          if (shouldLock && running) {
            toast(t("toastLeaveFlow"));
          }
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

// 共用偵測：不在 Flow 專案頁面時傳回 true（應鎖定）。
// 主要走 background service worker（有 tabs 權限，不受 side panel 視窗限制）；
// file:// 預覽模式則回退到本頁的直接查詢。
async function detectNotFlow() {
  let bgReplied = false;
  let bgResult = null;
  try {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      // 直接查詢 background service worker（權威來源）；以超時包裝防止 SW 休眠導致訊息掛起
      bgResult = await new Promise((resolve) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) { settled = true; resolve(null); }
        }, 1500);
        try {
          chrome.runtime.sendMessage({ type: "QUERY_FLOW_STATE" }, (reply) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve((reply && typeof reply.isOnFlow === "boolean") ? reply.isOnFlow : null);
          });
        } catch (e) {
          settled = true;
          clearTimeout(timer);
          resolve(null);
        }
      });
      if (bgResult !== null) { bgReplied = true; return !bgResult; }
    }
  } catch (e) { /* not in extension context */ }
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ active: true });
      const extTabs = (tabs || []).filter(t => !(t?.url || "").startsWith("chrome-extension://"));
      const anyTab = extTabs[0]?.url || "";
      const onActive = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i.test(anyTab);
      const flowTabs = await chrome.tabs.query({ url: "*://labs.google/fx/*/tools/flow*" });
      return !(onActive || flowTabs.length > 0);
    }
  } catch (e) { /* ignore */ }
  // Preview mode (file://) 或查詢失敗：一律視為不在 Flow（安全預設）
  return !bgReplied;
}

// 啟動後立即偵測一次，之後每 1 秒持續輪詢分頁切換狀態（離開 Flow 會重彈、切回 Flow 會自動解除）
(async () => { try { await showNotFlowWarning(); } catch (e) { /* ignore */ } })();

// 瀏覽器視窗焦點切換時也立即重檢（解決切離 Flow 後彈窗未及時彈出的問題）
try {
  if (typeof chrome !== "undefined" && chrome.windows && chrome.windows.onFocusChanged) {
    chrome.windows.onFocusChanged.addListener(() => { try { showNotFlowWarning(); } catch (e) { /* ignore */ } });
  }
} catch (e) { /* ignore */ }

// 接收 background 主動廣播的 Flow 狀態（tabs.onUpdated / onFocusChanged 觸發），
// 面板常駐時也能即時同步：不在 Flow 時重彈、切回 Flow 時自動解除
try {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      try {
        if (msg && msg.type === "FLOW_STATE" && typeof msg.isOnFlow === "boolean") {
          const modal = document.getElementById("notFlowModal");
          if (!modal) return;
          const shouldLock = !msg.isOnFlow;
          modal.classList.toggle("hidden", !shouldLock);
          document.body.classList.toggle("notflow-locked", shouldLock);
          notFlowLocked = shouldLock;
        }
      } catch (e) { /* ignore */ }
    });
  }
} catch (e) { /* ignore */ }

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
    charSelected: Array.isArray(settings.charSelected) ? settings.charSelected : [],
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
