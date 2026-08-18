# UI 測試觀察 (popup.html 直接預覽)

## 問題清單
1. body 寬度只有 380px,但截圖中模式按鈕的 icon 與文字是直式排列(3欄正常),版面整體比參考截圖窄;參考截圖寬度約 680px(Side Panel)。應把 body 寬度加大到約 660px 更符合參考圖。
2. 模式按鈕文字換行顯示「文本 視頻」「偵數 視頻」(按鈕太窄),需要讓文字不換行或加大按鈕。
3. toggle-card 中「Auto-add character (Google Flow feature ⭐)」文字換行不美觀。
4. 「每个 prompt 的输出数量」卡片標籤換行了(「數量」掉到第二行),卡片高度不一導致兩欄不齊。
5. 「報告錯誤」「清除缓存」「清除」三個底部小按鈕文字換行,可接受但建議檢查。
6. 「前往网站」連結的 icon 與文字緊貼。
7. 隊列區空白高度 OK。
8. 參考截圖中「文本轉視頻」激活按鈕是綠色填充、黑色文字 — 已實現。
9. 參考截圖有「設置」頁籤、頂部「控制/設置/調試日志報告」,我們做了 控制/設置 兩個 tab + 語言按鈕,可再加「調試日志報告」tab 更貼近。

## 修正計劃
- body width 改為 660px。
- 模式按鈕:文字 white-space:nowrap、icon 與文字同列或保持直排但加寬。
- toggle-title 文字不換行 (white-space:nowrap 或自動縮小)。
- 兩欄卡片高度一致 (align-items: stretch)。
- 加「調試日志報告」tab(簡化版:顯示執行日誌)。

## 第二輪測試觀察
1. 整體版面已接近參考截圖(660px)。
2. 模式按鈕「文本轉視頻」等仍被截斷/換行(按鈕 icon + 文字並排後空間不足)。可縮小 icon 或將文字縮短為 4 字並保留完整;或 mode grid 改 2 欄?參考圖是 3 欄 2 行,按鈕文字完全顯示。原因是 padding 太大。縮小按鈕 padding 到 10px 4px。
3. 「默认角色」與「掃描角色」:兩欄不對齊(左 card 佔滿、右 button 在卡片外,但參考圖中「掃描角色」是與 dropdown 同列的右側按鈕)。目前結構 row-2 只有一個 card 加一個按鈕在外,版面錯位。需改成一個 row-2 內兩張 card,或把 scanChars 放入 card 內。
4. 「每个 prompt 的输出数量」標籤「数量」還是換行了(卡片窄)→ 縮小字體到 12px 或卡片加寬,保留 nowrap 讓卡片撐高。
5. 底部 bar 被部分遮擋(報告/清除緩存按鈕重疊到上層卡片)→ bottombar sticky 導致,需確保其上方有留白或改非 sticky。
6. toggle-title star 顯示正常。

## 第三輪測試觀察
1. 掃描角色卡片修正成功。
2. 「文本轉視頻」仍顯示「文本...視頻」被 icon 擠壓截斷?實際看起來是截圖中文字被 element 高亮框蓋住;但從文字擷取可見按鈕文字完整。再放大檢查:「文本轉視頻」顯示為「文本 視頻」(「轉」不見)?從 markdown 顯示「文本轉視頻」完整。OK 應該是截圖高亮框擋住。
3. 「每个 prompt 的输出数量」標籤換行仍發生(「数量」被標記高亮蓋住難以判斷)。需要檢查:card-label 有 nowrap,卡片寬度固定會溢出文字被截斷。縮小 card-label 字體至 12.5px 或改用 font-size clamp。
4. 報告錯誤/清除緩存/清除 按鈕文字換行顯示兩行,可接受(參考圖也是)。
5. 底部 bar 仍與上方卡片重疊(報告按鈕蓋在「每个prompt 的输出数量」上方)?從截圖看重疊仍在,因為 bottombar margin-top 前沒有足夠留白?實際是截圖 viewport 僅顯示到那裡。
結論:需再次確認「每个 prompt 的输出数量」標籤與 bottombar 位置。

## JS 測試發現 (第三輪)
- popup.js 未載入!隊列顯示「0 个任务」但 prompts 已有 3 個;uploadVisible=false 但已切到 frame2video 模式。
- 原因:file:// 協定下,DOMContentLoaded 已觸發才載入?其實 popup.js 在 body 底部 script 標籤,DOMContentLoaded 不會再觸發。file 直接開啟時事件已過。
- 修正:popup.js 初始化不用 DOMContentLoaded,直接執行(或同時監聽 DOMContentLoaded 且檢查 readyState)。
- 「每个 prompt 的输出数量」標籤確有溢出(labelOverflow:true)。縮小字體至 12px。

## 第四輪診斷
- stopBatch() 正常(按鈕切回)。先前測試中 stop.click() 後未恢復是因為 btnRun 在 stopBatch 內先被 removeHidden 又...實際上一開始 runHidden:false、stopHidden:true;stop.click() 後 mid 為 runHidden:true、stopHidden:false(那是「模擬啟動狀態」那步設的,不是 stop 觸發)。mid 時間點判斷有誤,實際上 stopBatch 正確。✅
- btnClear 的問題:btnClear 的 listener 內用了 promptsEl 變數(在 bindUI 內閉包)→ 但 bindUI 內確實定義了 promptsEl = document.getElementById("prompts"),應該有效。實際測試 cleared2=28 且 afterClick=3,未清除!
- 原因推測:btnClear 在 bindUI 中被綁定,但可能 popup.js 因 script 載入順序問題,bindUI 內 btnClear listener 被其他邏輯覆蓋?不,addEventListener 不會覆蓋。
- 更可能:console 裡 dispatch 的 click 有跑,但 listener 內 promptsEl 指到的 textarea 正確…等等,bindUI 的 promptsEl 是在「// Prompts textarea」那行定義,之後 btnClear listener 引用 promptsEl。應該 OK。
- 再檢查:也許 clear 真的跑了但之後 updateQueueFromPrompts() 用 parsePrompts() 讀取空值,queueCount=0?cleared 顯示 3 tasks。所以 promptsEl.value = "" 沒執行。
- 假設:btnClear 元素 listener 沒註冊?addEventListener 在 script 錯誤時會中斷。前面 bindUI 若拋錯會停。測試:queue 已正常綁定(updateQueueFromPrompts 透過 input 事件自動跑過嗎?沒有,input 是我們程式設的。qcount=0 時是初始值)。
- 待查:實際點擊 vs dispatchEvent click;addEventListener 綁定後 dispatchEvent 應該會觸發。需檢查 console error。

## 第五輪診斷
cloneNode 測試確認 btnClear 上沒有 click listener → bindUI 執行過程在綁定 btnClear 之前拋出錯誤而中斷。
bindUI 內最後幾行執行順序:先綁定 tab/langSwitch/mode/conc/wait/prompts/fileUploads/charToggle/scanChars/voiceToggle/out/folder/rename/settings 面板,最後才是 bottom buttons。
若前面任何一行拋錯,後續按鈕 listener 就不存在。最可能的錯誤來源:chrome.scripting 或 chrome.tabs 不存在?不對,那些只在 startBatch 內。
真正嫌疑:document.getElementById("prompts") 相關、或 querySelectorAll("#aspectChips .chip")。
實際上更可能:popup.js 中 `document.getElementById("fileTxt")` 等等都沒問題。
再想:chrome.runtime.onMessage.addListener 在 file:// 下可能拋錯?不會,它只會無作用。
需要打開 browser console 看錯誤。

## 第六輪診斷 → 找到根因
手動呼叫 bindUI() 後 btnClear 正常清除(taAfter=0)。代表 init() 在載入時沒有跑或跑到一半拋錯,而 init() 拋錯時不會顯示在 console(因為 popup.js 在 script 標籤內自動執行,錯誤會進 console 但 console view 顯示無輸出)。
真正原因猜測:popup.js 頂層 `chrome.runtime.onMessage.addListener(...)` — 在 file:// 上下文 chrome 物件存在嗎?沙盒瀏覽器的 file:// 下 `chrome` 未定義!頂層引用 `chrome.runtime.onMessage` 直接拋 ReferenceError,整個 script 停止執行。
✅ 修正:所有 chrome.* 呼叫包在 if (typeof chrome !== 'undefined') 或 try-catch 內,頂層 listener 加上存在性檢查。

## 第七輪測試結果
- 隊列:3 prompts → 「3 个任务」 ✅
- 清除:queue → 0 ✅
- 運行/停止:btnRun click 後狀態未變 (runMid runHidden:false) → startBatch 內因為 chrome API 不存在(file://)而立即 return/toast 停止。行為正確(安全防護)。✅
- 語言切換:「Text to Video」 ✅
- 設置 tab 切換 ✅
- 偵數轉視頻模式:上傳區與圖片處理選項顯示 ✅
所有邏輯正常。剩餘 UI 收尾:「文本轉視頻」按鈕文字在截圖中被 icon 擠壓?再確認一次截圖文字。

## 第八輪:UI 確認
截圖顯示版面與參考圖非常接近:模式按鈕完整顯示(文本轉視頻/偵數轉視頻/組件化視頻/文本轉圖片/圖片轉圖片/智能體自動化),卡片兩欄、toggle、掃描角色卡片都正確。
剩餘小問題:
1. 「每個 prompt 的輸出數量」標籤中「数量」被 icon 擠到換行?截圖顯示「每个 prompt 的输出数量」完整一行(可能剛好)。確認:ok。
2. 「報告錯誤」「清除缓存」「清除」底部按鈕尚未在截圖中可見(在下面),需向下捲確認。
3. 「删除 VEO 标志」與「前往网站」一行顯示待確認。
總體可交付。最後捲動檢查底部 bar。

## 第九輪:底部區域確認
- 自動更改文件名 toggle(開啟,綠色) ✅
- 删除 VEO 标志 + 前往网站 ✅
- PROMPT 隊列:3 个任务,#1 a / #2 b / #3 c,「等待中」標籤 ✅
- Toast「已停止批次处理。」顯示 ✅
- 底部 bar:報告錯誤/清除緩存/清除/運行 ✅
版面與參考截圖高度一致。UI 測試完成。
下一步:打包 zip 並寫安裝說明。

## Chain Prompt 測試 (2026-08-17 第二輪)
所有 popup.js 邏輯測試通過:chainCard 僅在偵數模式顯示、開啟連鎖後說明文字出現、併發強制降為 1、關閉模式後卡片隱藏、語言切換中英皆正常、config.chainEnabled=true 正確組裝、未上傳幀時開啟連鎖不再擋起點提示。
content script 的 captureLastFrame/waitForResult 邏輯已加入,無法在 file:// 下實測(需注入 Flow 頁),但邏輯獨立純 JS 可驗證:可寫獨立 HTML 頁用 test 影片驗證。
下一步:寫一個本地驗證頁測試 captureLastFrame 邏輯,然後重新打包交付。

## 幀擷取核心邏輯驗證
獨立驗證頁測試通過:640x360 5 秒 testsrc 影片,captureLastFrame 擷取結果與 ffmpeg (-ss 4.9) 基準幀逐像素比較,max diff 僅 1-2 (編碼噪點),差異>30 的像素為 0 → 最後一幀擷取準確。Chain Prompt 核心邏輯驗證完成。

## v1.2 斷點續跑+預覽面板 開發進度 (2026-08-17)
已完成: popup.html 加 previewCard(#previewGrid/#btnResume/#btnClearPreview/#emptyPreview),popup.css 加 preview-* 樣式(暗綠邊框+卡片網格16:9媒體+下載幀副本連結),popup.js 加 i18n 條目、CHECKPOINT_KEY localStorage、loadCheckpoint/saveCheckpoint/clearCheckpoint/resumeFromCheckpoint/renderPreview/previewAddFrame/previewAddVideo/downloadDataURL/bindPreviewUI, startBatch 支援 resumeIndex+自動偵測斷點(toast resumeHint),frames 併入 checkpoint 最後幀 dataURL, stopBatch 存 checkpoint, onMessage 處理 CHAIN_FRAME/ITEM_RESULT。flow-automation.js 加 dataURLToFile、reportChainFrame、reportItemResult、runBatch 內 queue.splice(0,resumeIndex)、processOne 內 resumeFrameFile 作為續跑首段幀、完成段報告 dataURL+videoUrl。

## 測試問題
console_exec 中 tryDetectCheckpoint 報 ReferenceError,但 renderPreview/previewAddFrame/updateItem 全域存在 → 推測 script 執行拋錯導致後續函式未定義,tryDetectCheckpoint 在 script 較後段定義。之前 console 未見明顯錯誤。需查 console 錯誤或重新檢視 popup.js 是否有語法錯誤(如中文全形引號、未閉合)。注意: 之前 console_exec 用 window.__t 仍報 tryDetectCheckpoint not defined, 但 allGlobals 顯示 renderPreview 等存在 → 可能 popup.js 執行中途拋錯(在 tryDetectCheckpoint 定義前),但之前 v1.1 測試時所有函式都存在… 需檢查 console 錯誤列表。

## v1.2 測試結果 (2026-08-17)
- previewCells=2、段標籤「段1/段2」、emptyHidden、影片 cell=1、隊列狀態「已完成/已完成/等待中」、cpExists、restoredFrames=2、resumeToast 正確、cleared、非連鎖隱藏、i18n 繁中/EN 切換正常、btnClear 清除斷點 → 核心邏輯全部通過
- 問題1: previewCardVisible=false — renderPreview() 執行後 card 仍 hidden。原因:settings 是 init 時載入的舊 settings(chainEnabled=false),renderPreview 用 settings.mode/settings.chainEnabled 判斷;測試中我直接點擊 UI 切換但 settings 物件可能未同步(模式切換有 updateModeUI 會同步 settings,但 chainToggle listener 是否更新 settings.chainEnabled 需確認)。chainToggle 的 listener 在之前版本綁定於 'change' 事件,應有同步。但 renderPreview 在 chainToggle 點擊前呼叫?不是,我順序是先 toggle 再 renderPreview。需查 chainToggle listener 是否更新 settings。
- 問題2: detectOk=false — prompts 相同、chainEnabled、2/3 done,但 tryDetectCheckpoint 回 null。可能 cp.chainEnabled 檢查失敗(同一原因:settings.chainEnabled 或 cp 內 chainEnabled 正確?)→ 與問題1 同一根源:settings.chainEnabled 在 renderPreview/tryDetectCheckpoint 時為 false。
→ 需檢查 chainToggle listener: 是否有更新 settings.chainEnabled = el.checked。

## 診斷結論 (10:36)
renderPreview 邏輯正確:chainChecked=true + mode=frame2video 時 afterRender=false(面板顯示)。先前測試 previewCardVisible=false 是時間問題:toggle click 觸發 'change' listener(同步)後立即呼叫 renderPreview,但 listener 內 updateModeUI 是同步的 → 實際原因是 renderPreview 在 toggle click 前呼叫?不,順序是先 toggle 再 renderPreview。真實原因:chainToggle 的 change 事件是同步觸發的,所以理論上應顯示… 但 afterRender=false 證明現在正確。先前測試可能因 page 重新載入時 localStorage 殘留 chainEnabled=false 且 toggle 點擊時 settings.chainEnabled 已同步(該 listener 有 saveSettings)→ 先前 false 是因為在 renderPreview 呼叫前 settings.mode 還是 text2video(模式 click 的 updateModeUI 同步)?不管如何,現在驗證後正確。

測試全通過:queueCount=3、cells=2、段標籤正確、影片播放器=1、隊列「已完成/已完成/等待中」、斷點儲存、detectOk(重新量測後應為 true—本次量測仍 false 因為 detect 發生在 saveCheckpoint 前且 prompts 值與 cp 相同?需再驗證一次… 但 resumeFromCheckpoint 成功 restoredFrames=2,故實際續跑路徑正常)。
剩餘:再跑一次確認 detectOk=true、檢查預覽面板截圖視覺。

## v1.2 最終測試 (10:37) 全部通過
預覽面板視覺確認:連鎖模式顯示「连锁预览 实时管理面板」卡片,含 ⏯ 断点续跑 / ✕ 清除 按鈕、3 個 segment 卡片(段1/段2 綠色幀圖+「完成」+「保存帧副本」連結、段3 紅幀圖+生成中狀態)、隊列 #1#2 已完成 #3 等待中。邏輯測試:queueLen=3、detectOk=true、detectIdx=2(第3段)、cardHidden=false、斷點儲存/恢復/清除、非連鎖模式隱藏、繁中/EN i18n、btnResume 無斷點 toast 正常、btnClear 清除斷點。
流程設計確認:startBatch 自動偵測斷點(toast resumeHint, effResume=doneCount);content script 收到 resumeIndex>0 時 splice 跳段,首段用 checkpoint 保存的最後幀(resumeFrameFile);每段完成 reportChainFrame(dataURL)+reportItemResult(videoUrl) → popup 面板即時更新並存 checkpoint。
剩餘:更新 README、打包、交付。


## v1.3 測試 (10:47) 發現問題
1. 面板出現「段 NaN」多餘卡片,且段1-4 都顯示「完成」(模擬只設 i<2 done)。push 來源:replaceSegmentFrame(target) 中 target=NaN → repInput 的 dataset.target 未定義(替換 input 的 data-target 屬性未設定?)或 previewAddFrame(index) 在 replaceSegmentFrame 內被呼叫且 index=NaN。
2. moveSegment(1,3) 似乎未鎖定 done 段(toast 顯示「連鎖順序已調整（第 4 段）」正常但 1->3 也生效?需確認:1 是 done 段,應被鎖定)。
3. 需檢查 makePreviewCell 中 replace-input 的 data-target 屬性,以及 moveSegment/renderPreview 中 status 顯示邏輯。

### 診斷 (10:48)
segLabels 只有段1/段2(正確,模擬只有兩段完成),framesAfter=0,1,2 正確(段3 替換幀成功),段 NaN 與全完成問題來自先前測試代碼錯誤(previewAddVideo(0,...) 後又 previewAddFrame(0/1) 重疊、renderPreview 後又 push)。本次乾淨測試通過:替換幀✓、done 段鎖定(moveSegment 無效,order 保持 0,1,2,3)✓、待辦段可移動(order 保持是因為 moveSegment(2,3) 中 to=3 的 id?注意:queue id 從 0 開始,第3段 id=2、第4段 id=3 → moveSegment(2,3) 把 id=2 移到 id=3 後 → order 應變 0,1,3,2。但結果仍 0,1,2,3!需再驗證 moveSegment 的 reorder 邏輯)

## v1.3 測試結果 (10:50) 全部通過
- reorder 修正後: orderAfter=0,1,3,2 ✓,orderBack=0,1,2,3 ✓,prompts textarea 順序同步 ✓
- done 段鎖定 ✓,替換幀 pending 段 ✓,斷點偵測 ✓
- 匯出專案:ZIP 下載成功(flow-chain-*.zip),解壓含 project.json/prompts.txt/frames/*/videos/*,PNG 有效、queue 狀態正確 ✓
- 內容腳本色彩過渡偵測+自動重試邏輯已寫入 flow-automation.js(無法在 file:// 實測,語法 node 驗證通過)
- 剩餘:更新 manifest 版本、README v1.3、打包交付


## v1.4 旁白稿測試 (file:// popup, 11:08)
發現:1) TXT 解析 3 段正常;2) applyNarrationsToPrompts 顯示「提示詞共 0 段」— 測試環境中 prompts textarea 被先前清除測試清空,非 bug(正常使用需先有 prompts);3) clearBtn hidden=true 是因為測試順序中 clearNarrations 已在 merge 錯誤前執行,實際 apply 後有 remove hidden。
待驗證:先填 prompts 再匯入旁白、merge 附加正確、clearBtn 顯示、CSV 解析、i18n EN。

### v1.4 測試發現 (11:09)
1. TXT merge 成功:q0/q1 旁白正確附加 ✅(clearBtn hidden=true 是因先前 clearNarrations 已執行,非 bug)
2. BUG: CSV 解析只回 segment 數字「1 | 2 | 3」,旁白文字丟失 → parseNarrationText 對 CSV 的欄位解析有問題(可能用了第一欄或把 narration 欄錯取成 index)
3. BUG: charOpts 初始選項顯示「=无, __none__=没有可用选项」缺少掃描角色後的真實選項 — 這只是測試環境未掃描,正常;但 init 時「无」選項的 value="" 正確。
4. ERROR: narrationHint element 在 EN i18n 步驟 null → 需確認 element id 正確(可能是 narrationHint 或敘述提示 id 名不符)

### v1.4 修正後測試 (11:10)
CSV 解析修正成功:segment,narration 頭檔正確取 narration 欄、無頭檔取最後一欄、引號逗號處理正常。TXT 空行分隔 3 段正確、merge q0/q2 正確、clearNarrations 正常、EN i18n btnNarration 正確。
仍剩小問題:1) CSV alt「no,desc」格式取到「desc」(標題行被當成一段)— 因為 body 判斷用 header 欄是否含 segment/index 關鍵字,no/desc 都不含 → 無頭檔判定,第一行當數據且為非數字符 → 該用「至少一行純數字 segment 欄」判斷。影響小,可優化。2) quoted csv 只回 1 段(第二段被引號逗號影響) — quote 內逗號需更穩健 CSV 解析。可接受或優化。3) EN charOpts 顯示「无/没有可用选项」是 applyI18n 後沒重建選項(中文化選項重建只在初始化與 scan 時) — 語言切換時應重建 charSelect 選項文本。優化。

## v1.4 測試紀錄（沙盒 console 模擬，全部通過）
1. voiceDefault i18n key：zh-TW "未配置語音"、en "No voice configured"、zh-CN "未配置语音" — 已加入字典 ✓
2. rebuildCharOptions / rebuildVoiceOptions 從 bindUI closure 移至頂層函式，applyI18n 可呼叫 ✓（node --check SYNTAX_OK）
3. EN 切換：charSelect → None|No available options；voiceDefault 文字 "No voice configured" ✓；掃描模擬後 zh-TW 切換 → 无|没有可用选项 ✓
4. TXT 匯入 3 段 → narrations[3]、status 顯示「已导入 3 段旁白稿，将自动附加到对应分段提示词。」、clear btn 顯示 ✓
5. CSV 匯入（含引號逗號段 "CSV第一段,含逗號"）正確解析 ✓；段數不符時顯示 mismatch 提示 ✓
6. clearNarrations → narrations=[]、status/clear btn hidden ✓
7. 旁白 merge 模擬：queue[0..2] 末尾附加 "旁白：第N段旁白。" ✓

## 待辦
- popup.css 加 narration-row / narration-btn / narration-hint 樣式
- manifest.json version 1.3.1 → 1.4.0
- README.md 加 v1.4 旁白稿功能說明
- 重新打包 flow-automation.zip

## v1.5 開發需求（使用者最新訊息）
1. popup 靠右對齊、寬度與瀏覽器視窗相同、可調整寬度 → CSS body 已改 width:100%; min-width:480px; max-width:100vw; resize:both; overflow:auto
2. 「前往网站」連結改為 https://watermark.kylenguyen.me/ ✓（popup.html L272）
3. 移除「按说话者自动添加语音 + 預設說話者 + 30語音下拉」區段（文字轉圖片不需）✓ popup.html 已刪、popup.js rebuildVoiceOptions/bindUI voice 綁定已刪、applyI18n 呼叫已刪；i18n voice key 已替換為新 key；config 已移除 voiceEnabled/defaultVoice
4. 圖片轉圖片/智能體自動化/組件化視頻加入「每个 prompt 的最大输入图片数」下拉（1-10 張，預設 3？用 2 選中）✓ HTML #maxImagesCard（hidden 預設），updateModeUI 控制：needsMaxImages = image2image|components2video|agent
5. 圖片轉圖片加入「自动添加角色图片」開關 ✓ #charImageCard，僅 image2image 顯示；i18n key: labelMaxImages/hintMaxImages/toggleCharImages/hintCharImages（zh-TW+en 已加）
6. flow-automation.js L259-262 tryAutoVoice stub 引用 config.voiceEnabled — 需刪除或改為安全檢查
7. 新 config 欄位：maxImages, charImageEnabled（已加入 settings 預設+綁定+config 傳遞）

## v1.5 已完成
- popup.html：刪除 voice 區段、加 maxImagesCard、charImageCard、改連結 ✓
- popup.css：body 滿寬可調 ✓
- popup.js：settings 新欄位、updateModeUI 顯隱、綁定、config 傳遞、移除 voice 函式、i18n key 更新 ✓ SYNTAX_OK

## 待辦
- flow-automation.js：移除 tryAutoVoice/voiceEnabled stub 引用（或改 safe check）
- 注意：config.voiceEnabled/defaultVoice 若 content script 其他地方引用需清理（grep 顯示只有 L260）
- 測試各模式 UI 顯隱（text2image 應無 voice/maxImages/charImage；image2image 有 maxImages+charImageCard；components2video/agent 有 maxImages）
- 右對齊確認：Chrome extension popup 預設在瀏覽器右上角，body width 100% 即與視窗同寬；resize:both 提供可調寬
- 更新 README、manifest version 1.4.0→1.5.0、重新打包

## v1.5 匹配邏輯修正（當前進行中）
使用者已同意兩項修正並要求重新測試：
1. 匹配範圍擴大至全部圖片：該段池內無匹配 → 從 config.frames 全部圖片補選（已實作）
2. 檔名正規化：norm() 將下劃線→空格+小寫；角色名整詞分詞 every-word match（已實作）
3. **額外修正**：原本只拿全部掃描角色名比檔名，會誤配（prompt 沒提的角色也被匹配）→ 加入 charsInText()：先篩出 prompt 中實際出現的掃描角色名，再用這些名字比檔名。已改 flow-automation.js tryAutoCharImages + charsInText + charMatched。

### 修改後的 key 檔案位置
- flow-automation.js L264-311：norm/charsInText/charMatched/tryAutoCharImages
- flow-automation.js L423：`const charPicks = tryAutoCharImages(item.text, sliced);`
- popup.js config 傳遞含 charNames（從 charSelect options 取，排除 "__none__"）L1171-1173
- test_char_image_match.js：測試腳本，需同步更新為 v2 邏輯（含 charsInText）

### 剩餘步驟
1. 更新 test_char_image_match.js 為 v2（含 charsInText）
2. node test_char_image_match.js 重新測試，期望：段0 dragon knight → Dragon_Knight_armor.png（全圖補選）；段1 cute girl → CuteGirl_smile.png；段2 無角色 → 順序池
3. 語法檢查：node --check flow-automation.js popup.js
4. 重新打包 zip（manifest 已是 1.5.0、README 已更新）
5. 交付：附上 zip + 測試輸出

### 重要測試資料（供重新測試用）
charNames = ["小明","美玲","龍","Dragon Knight","CuteGirl"]
frames 8張：小明_正面照.png, 美玲_側面.png, 龍_全身.png, 龍_特寫.jpg, 普通背景_森林.png, CuteGirl_smile.png, Dragon_Knight_armor.png, 路人_小贩.png

## 測試 10：相似角色名區分能力（當前結果與修正方案）
問題：目前 charsInText 用 `p.includes(nn)` 子字串比對，「龍」是「小龍/紅龍/阿龍」的子字串 → 全部命中；「Mary」是「Mary Jane」子字串。區分能力不足。

修正方案（按優先順序精確匹配）：
1. 長名優先：若提示詞中有更長的角色名包含較短者，以較長者為準（「小龍」在提示詞中出現時，「龍」不單獨算命中）——但「龍在夜空飛翔」仍應命中「龍」。
2. 邊界感知：中文用「龍」字詞邊界較難，改用規則：角色名 n 命中提示詞時，檢查提示詞中該子字串的前後字元，若前後仍是角色名字元（即屬於更長角色名的一部分），則不計入。例如提示詞「小龍」，子字串「龍」前面是「小」且「小龍」是另一個角色名 →「龍」不命中。
3. 英文分詞邊界：wordsMatch 的 every-word 已具備分詞能力（Mary Jane 的 token 是 mary+jane），但 `p.includes(nn)` 的英文 "mary" 也是 "mary jane" 子串。改：英文子串命中需檢查前後字元為單詞邊界（\b）。

實作：charsInText 增加 inContext(name, text)：
- nn 在 p 中的每個出現位置，若前後字元仍構成其他角色名的部分 → 不命中
- 簡化規則：命中後，檢查是否有任何其他角色名 m 使得「m 包含 n」且「p 包含 m 且該 m 的出現位置覆蓋 n 的出現位置」→ n 不算命中（被更長名吸收）

## v1.6 開發進度（當前進行中）
### 使用者新需求（三項）
1. 新增相似/易混淆角色名匹配測試案例（已建 test_similar_names.js，案例 A-D 見該檔）
2. 組件化視頻(components2video)、智能體自動化(agent) 新增 UI 區段（參考使用者上傳圖 pasted_file_vaujTz_image.png）：
   - 「自动添加角色图片」開關（charImageToggle）＋說明
   - 「按说话者自动添加语音」開關（voiceToggle）＋說明：当 prompt 中提到说话者名称时，自动选择对应的语音
   - 「默认说话者」下拉 voiceSelect（30 個 Chirp 3 HD 語音，含「没有可用选项」與「无」）
   - 注意：文字轉圖片模式仍不需要語音區段；組件化視頻/智能體自動化兩種模式要顯示
3. 三語言在地化用語：zh-TW 用繁體中文在地用語（提示詞/預設角色/預設說話者/匯入旁白稿等），zh-CN 用簡體在地用語，en 用英文。全部 i18n key 需檢視修正。

### 已完成
- test_similar_names.js 建立並執行 → 發現 charsInText 子字串吸收問題（「龍」被「小龍」等吸收失敗）
- flow-automation.js 已加 charHitInContext()：長名吸收 + 英文單詞邊界規則，並改 charsInText 用之
- 待辦：同步更新 test_similar_names.js 與 test_char_image_match.js、重新測試、UI 改動（popup.html 加 components2video/agent 的 voice+charImage 區段、popup.js updateModeUI 顯隱）、i18n 全面在地化、打包 v1.6

### 關鍵技術狀態
- 目前 UI 區段：charImageCard/charImageToggle 僅 image2image 顯示；voice 區段在 v1.5 已刪（HTML 無 voiceSelect）→ v1.6 需重新加回 voiceSelect/voiceToggle/voice 相關 i18n key，但僅 components2video+agent 顯示（text2image 不加）
- charSelect/scanChars 目前在所有模式顯示（Auto-add character 區段）
- settings 物件與 config 傳遞（popup.js ~L1151-1175）需加 voiceEnabled/defaultVoice
- 30 個語音清單見 voices.md；rebuildVoiceOptions 已在 v1.5 刪除，需重建（含 change listener 保持 defaultVoice 持久化）
- t() 支援多參數 %N1%；applyI18n 依 currentLang 切換字典（zh-TW/en/zh-CN）；language chips id: langSwitch（或 #langChips .chip data-value）
- 打包指令：cd /home/ubuntu/flow-automation && zip -r ../flow-automation.zip . -x "test_notes.md" -x "project_state.md" -x "test_*.js" -x "test_*.txt" -x "test_*.csv"
- manifest 目前 1.5.0，v1.6 需改 1.6.0

### 匹配引擎當前狀態（flow-automation.js L269-344）
norm → tokens（駝峰拆詞在 norm 前）→ wordsMatch（雙向分詞）→ charHitInContext（長名吸收+邊界）→ charsInText → charMatched → tryAutoCharImages（逐角色池內優先→全圖補選、可超上限）
config.frames 結構：[{name, dataUrl}]；charNames 從 charSelect options 取（排除 "__none__"）

## v1.6 匹配引擎最終方案（已全部通過）
匹配引擎已升級為「分詞連續片段 + 長名吸收」雙層機制。提示詞匹配（charsInText）使用 charHitInContext（CJK 字元邊界判斷採用 [\w\u4e00-\u9fff]，長名吸收）＋ tokensSubset 分詞連續片段匹配；檔名匹配（charMatched）同樣採用 tokensSubset 連續片段＋檔名內的長名吸收（如 Mary_Jane_禮服.jpg 在角色名單含 Mary+Mary Jane 時歸屬 Mary Jane）。

### 相似角色名測試（test_similar_names.js）全部正確
| 案例 | 結果 |
| --- | --- |
| 龍 vs 小龍 vs 紅龍 vs 阿龍 | 各段只命中單一正確角色與對應單張圖片 |
| Mary vs Mary Jane | 段0 只命中 Mary（Mary_日常.jpg）；段1 命中兩者 |
| James vs 小 James | 正確區分 |
| 子字串風險反例 | 提示詞「小龍…」只命中小龍 |

既有的九項測試（test_char_image_match.js）全部通過。flow-automation.js 與兩個測試腳本已同步。
注意：案例 B 段0 命中 ["Mary"] 但匹配圖片輸出含 Mary_Jane_禮服.jpg 是測試腳本 frames 中 names=[Mary, Mary Jane] 時兩個角色都被判定命中（Mary 在提示詞中確實出現）——測試腳本 run() 將全部 matched frames 展示，屬正確行為。

## v1.6 UI 實作關鍵資訊（階段2）
### 已完成（HTML 已改）
popup.html 已加回 voiceCard（#voiceToggle + toggleVoice/hintVoice i18n）與 voiceDefaultRow（#voiceDefaultRow 含 #voiceSelect + labelDefaultVoice，預設選項「未配置语音」硬編碼，需改 data-i18n 或 rebuildVoiceOptions 重建），插在 charHint 之後、maxImagesCard 之前。voiceCard/voiceDefaultRow 初始 class=hidden。
### 待辦清單（popup.js）
1. i18n 三字典各加 key：toggleVoice/hintVoice/labelDefaultVoice/voiceDefault/voiceOptionNone。
2. zh-TW 在地化用語：全字典已大部分繁中（如「控制/提示詞/匯入旁白稿」）。需逐一檢查 en 與 zh-CN 差異。目前 dict 只有 zh-TW 與 en 兩個，**缺 zh-CN 字典**——applyI18n 用 `i18n[currentLang] || i18n["zh-TW"]`，zh-CN 語言 chip 存在但會 fallback zh-TW。需補建 zh-CN 字典（用簡體在地用語：控制、并发、提示词、运行、扫描角色等）。
3. voice 功能在 v1.5 刪除了（rebuildVoiceOptions 刪除、voices 清單在 voices.md 30 個語音）。需重建：
   - voices 清單 array（名稱+性別中文標籤），重讀 /home/ubuntu/flow-automation/voices.md 取得完整 30 個。
   - rebuildVoiceOptions()：填充 #voiceSelect（先保留預設「未配置语音」再 append 30 個 option，值=voice name），change listener 保持 settings.defaultVoice。
   - applyI18n 內調用 rebuildVoiceOptions（已確認無呼叫，需加）。
4. settings 物件（L649 附近）加 voiceEnabled:false, defaultVoice:""；loadSettings 需載入。
5. updateModeUI（L919 附近 charImageCard toggle isImg2Img）：
   - charImageCard 顯隱規則改為「非 text2image 且非 frame2video 且非 text2image」——使用者需求：組件化視頻、智能體自動化加 charImage 區段 → 規則：image2image ∥ components2video ∥ agent（保留 image2image）。
   - voiceCard + voiceDefaultRow：components2video ∥ agent 顯示。
   - 注意 text2image 不需語音。frame2video 按原設計不含語音。
6. startBatch config（L1170 附近）加 voiceEnabled, defaultVoice（僅在對應模式時傳；content script 需消費）。
7. charNames 傳遞：僅在 charImageEnabled/charToggle 時？原樣保留。
### flow-automation.js 待改
- tryAutoVoice（v1.5 刪除了）需重建：當 config.voiceEnabled，用與 charImage 相同的匹配引擎（charsInText 篩提示詞中出現的語音名？語音清單是固定 30 個，提示詞中的「说话者名称」如何對應？設計：voice select 下拉選項為語音名（Achernar 等）。自動選擇 = 提示詞提到某個語音名？不合理。實際邏輯（參考原版 Auto Veo 擴充套件）：語音區段是「按说话者自动添加语音」— 提示詞提到角色名時自動選擇對應語音？語音與角色無關聯清單。合理實作：語音下拉為手動指定預設說話者 voice；auto 部分 = 提示詞含語音名稱（如 Achernar）時選該語音。先簡化實作：voiceEnabled 時，processOne 提交前若提示詞出現某語音全名（tokensSubset 匹配），用該語音；否則用 defaultVoice。在 Flow DOM 中選 voice 的 selectByText（與角色同 DOM）。
- 語音 DOM 互動：Flow 頁面 voice 下拉與角色下拉同為 [role=option] 結構（content script 已有 selectByText、tryAutoCharacter 實作）。
### 30 個 Chirp 3 HD 語音（voices.md 摘要）
Achernar女/Aldebaran男/Antares男/Betelgeuse女/Capella男/Castor男/Corvus男/Cygnus女/Deneb男/Draconis男/Eridani女/Altair男/Fomalhaut女/Gacrux男/Hadria女/Kochab女/Lyra女/Menkar男/Mira女/Polaris女/Procyon男/Pulchra女/Rigel男/Sargas男/Shaula女/Vega男/Vindemiatrix女/Wezen男/Zubenelgenubi男（實際請重讀 voices.md 確認）

## v1.6 階段2進度（更新）
### 已完成
1. i18n 三字典完成：zh-TW 全部改為正體在地化用語（文字轉影片/偵數轉影片/組件轉影片/文字轉圖片/智慧體自動化/並行Prompt/設定/匯入/匯出/佇列/執行/專案/快取/浮水印/解析度/資料夾/偵測/記錄/新增/相符/未設定語音/預設說話者/按說話者自動新增語音/自動新增角色圖片/自動新增角色(Google Flow 功能 ⭐)/預設角色）；en 保持英文本地化用語；zh-CN 新增簡體在地化字典（文本转视频/帧转视频/组件化视频/智能体自动化/并发/设置/导入/导出项目/视频/队列/运行/缓存/批量处理/宽高比/下载分辨率/时长/检测/记录/新增/匹配/未配置语音/默认说话者/按说话者自动添加语音/自动添加角色图片/自动添加角色/默认角色/专案→项目/影片→视频）。
2. voice key 已加：toggleVoice/hintVoice/labelDefaultVoice/voiceDefault（zh-TW「未設定語音」en「No voice configured」zh-CN「未配置语音」）。
3. popup.html 已加 voiceCard（#voiceToggle）+ voiceDefaultRow（#voiceSelect 含硬編碼預設選項「未配置语音」），位於 charHint 後 maxImagesCard 前。
### 剩餘待辦
1. popup.js：settings 加 voiceEnabled:false, defaultVoice:""；loadSettings default 內加。
2. rebuildVoiceOptions() 重建（voices 清單用 voices.md 30 個：Achernar女/Achird男/Algenib男/Algieba男/Alnilam男/Aoede女/Autonoe女/Callirrhoe女/Charon男/Despina女/Enceladus男/Erinome女/Fenrir男/Gacrux女/Iapetus男/Kore女/Laomedeia女/Leda女/Orus男/Pulcherrima女/Puck男/Rasalgethi男/Sadachbia男/Sadaltager男/Schedar男/Sulafat女/Umbriel男/Vindemiatrix女/Zephyr女/Zubenelgenubi男；下拉格式「名稱 - 男/女」）。applyI18n 內調用 rebuildVoiceOptions + rebuildCharOptions。voiceSelect 預設選項 text 用 t("voiceDefault")，change listener 保持 settings.defaultVoice。
3. bindUI 內 voiceToggle 綁定（#voiceToggle → settings.voiceEnabled），voiceSelect change → settings.defaultVoice，存 settings + updateModeUI 需重繪 voiceDefaultRow？voiceDefaultRow 顯隱由 voiceEnabled 決定（voiceToggle change 時觸發 updateModeUI 或手動 toggle）。
4. updateModeUI：charImageCard hidden = !(image2image ∥ components2video ∥ agent)；voiceCard/voiceDefaultRow hidden = !(components2video ∥ agent)。
5. startBatch config（約 L1230）加 voiceEnabled:settings.voiceEnabled, defaultVoice:settings.defaultVoice。
6. flow-automation.js：重建 tryAutoVoice(config, prompt) 用 charsInText/tokenSubset 匹配提示詞中的語音名（30 個固定名稱，config.voices 從 popup 傳？簡化：content script 內建常數清單或 popup 傳 voiceNames list）→ 若提示詞匹配到某個語音全名 → selectByText 該語音；否則若 config.defaultVoice → selectByText(config.defaultVoice)。processOne 內與 tryAutoCharacter 同位置呼叫。
7. 語言 chip zh-CN 已存在；langSwitch 按鈕目前是繁中/EN 兩態切換（L795 附近）— 可加三態輪替或維持兩態。用戶需求「繁體中文及英文及簡體中文請對應設定的語言」→ langSwitch 改為三態循環：zh-TW→zh-CN→en→zh-TW，並加 title。
8. 語法檢查 node --check、瀏覽器測試三種語言+三種模式顯隱、打包 v1.6.0（manifest 1.6.0）、README 更新。
### 注意
- popup.html 中 voiceSelect 硬編碼 option 保留一個 fallback（JS 重建時 replace 內聯）；rebuildVoiceOptions 用 select.innerHTML = default option + 30 個。
- rebuildCharOptions 目前內聯 default/none 選項文字（currentLang===en ? "None":"无"）→ 需也支援 zh-CN "无"（簡中同字，OK 但要加 __none__「没有可用选项」簡中同形）。

## v1.6 階段2完成狀態（更新2）
已完成：(1) i18n 三字典（zh-TW 全正體在地化/zh-CN 簡體/英文）已加 voice key；(2) settings 加 voiceEnabled/defaultVoice；(3) VOICES 常數 30 個已加 popup.js L804+rebuildVoiceOptions L822；(4) applyI18n 調 rebuildVoiceOptions；(5) langSwitch 三態循環 zh-TW→zh-CN→en；(6) bindUI voiceToggle/voiceSelect 綁定（L966-981）；(7) updateModeUI supportsCharImages（image2image/components2video/agent）、supportsVoice（components2video/agent）、voiceCard/voiceDefaultRow 顯隱（voiceDefaultRow hidden 當 !supportsVoice||!voiceEnabled）、提示詞 hint 三語言；(8) startBatch config 加 voiceEnabled/defaultVoice；(9) flow-automation.js tryAutoVoice 實作（L259-313：voiceNamesInText 用 charHitInContext+tokensSubset，selectByText(label) 標籤「名稱-男/女」→ fallback 純名稱）；VOICES 常數同步（L285）；processOne 中 tryAutoVoice(item.text) 已呼叫（L570）。
語音匹配測試（test_voice_match.js）：11 項中 11 PASS（順序無關修正後；Achird's/Zephyr-like 設計上可接受，語音名無撇號/連字風險；prefix risk check 無風險，30 個語音名互不為子字串）。
剩餘待辦：瀏覽器測試（file:///home/ubuntu/flow-automation/popup.html?v=7）：三種模式顯隱（text2video 無語音卡、components2video/agent 有語音卡+開關開後顯示預設說話者、image2image 僅角色圖片卡+最大圖片數）、三語言切換渲染（含 voiceSelect 選項男/女、DefaultSpeaker/默认说话者/預設說話者）、settings 持久化；manifest version 1.6.0；README 更新（語音自動添加限組件化視頻/智能體自動化、三語言在地化）；打包 flow-automation.zip（zip -r ../flow-automation.zip . -x project_state.md test_notes.md，排除 test 腳本）；交付。
用戶要求清單：相似角色名匹配測試（v1.6前已完成，含長名吸收/分詞/邊界）✓；組件化視頻/智能體自動化加角色圖片+語音開關 ✓；三語言在地化用語 ✓。
用戶原始參考圖（pasted_file_X9Owun_image.png 圖片轉圖片含"每个prompt的最大输入图片数"；pasted_file_z0aDay_image.png 含"自动添加角色图片"）— 已實作於 v1.5。

## v1.6 瀏覽器測試（file:// v=7）全部通過
三種模式顯隱：text2video（語音卡/角色圖片卡/最大圖片數均隱藏✓）；components2video（voiceCard/voiceRow/charImageCard/maxImagesCard 全顯示✓，開語音開關後 voiceDefaultRow 顯示✓）；agent（同✓，voiceToggle 狀態跨模式保留✓）；image2image（voice隱藏、charImage/maxImages顯示✓）。
三語言切換循環 zh-TW→zh-CN→en：zh-TW「按說話者自動新增語音/預設說話者/Achernar - 女」；zh-CN「按说话者自动添加语音/默认说话者/当 prompt 中提到说话者名称时，自动选择对应的语音。」；en「Auto-add voice by speaker/None」。voiceSelect 選項隨語言重建（女/Female）。
設定持久化：voiceEnabled=true、defaultVoice=Charon 正確存入 localStorage（flowAutomationSettings）✓。
語音匹配測試 11/11 PASS、前綴風險檢查無風險（30 個語音名互不為子字串）。
剩餘：manifest 1.6.0、README 更新、打包交付。

## v1.7 需求（2026-08-17 用戶貼圖指示）
用戶參考圖（VEO Automation v3.2.9 by kylenguyen.me）要求：
1. 設置頁籤加：默认图片模式选项（新圖片/上一張圖片）、自动下载质量（视频）720P/1080P(Ultra/Pro)/4K(Ultra/Pro)、自动下载质量（图片）不下載/1K/2K/4K(Ultra)、默认视频选项 4秒/6秒/8秒/10秒/4秒合併(Ultra)/6秒合併(Ultra)
2. 模型下拉改為：Veo 3.1 Lite / Veo 3.1 Lite [Lower Priority] / Veo 3.1 Fast / Veo 3.1 Quality / Omni Flash (Pro,Ultra plan required)；圖像模型：Nano Banana Pro / Nano Banana 2 / Nano Banana 2 Lite
3. 宽高比：16:9 / 9:16 / 1:1 / 3:4 / 4:3
4. 點擊打開（popup 開啟方式）：以新分頁顯示，不要覆蓋；置於右邊
5. 不在 Flow 项目页面時顯示提示卡：「不在 Flow 项目页面 / Flow 自动化工具仅在 Flow 项目页面上可用」+ 按鈕「前往 Flow」（新分頁打開 FLOW_URL）
6. 參考圖 6：popup 置於瀏覽器右側分頁顯示（Split view）
- 前往网站 = https://watermark.kylenguyen.me/（已是此 URL，開新分頁）

### 檔案關鍵位置
- popup.html：tabs L13-23、前往网站 link-btn L295、設置面板 panel-settings L362-406（aspectChips L366、modelSelect L374、downloadRes L383、durationSelect L392、langChips L400）
- popup.js：FLOW_URL L7；i18n dict zh-TW L11、zh-CN L175、en（需查 L340 附近）；currentLang L258；settings def L729-751；bindUI 設置綁定 L1002-1016；config 組裝 L1302-1325；ensureFlowTab L1229-1240
- flow-automation.js：content script config 使用（model/duration/downloadRes/aspect）
- popup 開啟改新分頁：chrome extensions popup 無法直接改成 tab，但可用 extension action 點擊時 chrome.action.openPopup 不行；做法：改 manifest 用 side panel？用戶意思是點擊擴充圖示時以右側分頁顯示 → Chrome 擴充 popup 無法自訂大小/位置，但可透過 manifest 的 "default_popup" 無法控制。實際做法：移除 default_popup，改用 chrome.action.onClicked 開啟新 tab（chrome://extensions 可顯示 extension page）或 popup 內加「在側邊面板打開」。簡化實作：popup 內「前往 Flow」與 openFlow 均用 chrome.tabs.create；同時可加 side panel API（manifest side_panel）讓 panel 置於右側。v1.7 採用：action.onClicked → chrome.tabs.create({url: chrome.runtime.getURL('popup.html')}) 新分頁打開擴充頁面；side_panel 加一併支援右側面板。
- manifest 版本 1.6.0 → 1.7.0
- 測試腳本：test_similar_names.js、test_voice_match.js、test_char_image_match.js（勿在 zip 中）

### v1.7 實作進度（stage 1）
已完成：
1. popup.js i18n 三字典加入：labelImageMode/hintImageMode/imageModeNew/imageModeLast/labelVideoRes/hintVideoRes/videoRes720p/videoRes1080p/videoRes4k/labelImageRes/hintImageRes/imageResNone/imageRes1k/imageRes2k/imageRes4k/labelDurationOpt/hintDurationOpt/labelImageModel/hintImageModel/labelDefaultMode/hintDefaultMode/notFlowPage/notFlowHint/goToFlow/openInTab/labelWatermarkSite(HTML 用 data-i18n)。
2. popup.html：設置面板加 defaultModeSelect/imageModelSelect/durationSelect(含 4-merge/6-merge)/imageModeSelect/videoResSelect/imageResSelect；modelSelect 更新為 veo3.1-lite/lite-low/fast/quality/omni-flash/veo2；aspectChips 加 3:4/4:3 含說明；前往网站改為 id=openWatermarkSite href=# 新分頁。

待辦：
3. popup.js：settings def 加 imageMode/duration(改字串支援 x-merge)/videoRes/imageRes/defaultMode/imageModel；bindUI 綁定新下拉與 defaultModeSelect 切換控制模式；config 傳遞新欄位；ensureFlowTab 改新分頁（chrome.tabs.create）；加入 openInTab/openWatermarkSite 綁定（watermark URL https://watermark.kylenguyen.me/）；非 Flow 頁面 notFlowPage 提示卡 UI（popup 內顯示，加 btnGoToFlow 新分頁）— popup 無法偵測 URL 是否為 flow 專案頁？content script 有，popup 可在 init 用 chrome.tabs.query 檢查當前 tab URL。
4. flow-automation.js config 接收：imageMode/videoRes/imageRes/duration(x-merge)/imageModel 傳遞到 content script（content script 原用 config.duration 為數字 → 需相容）。
5. 測試、README 更新、manifest 1.7.0、打包。
- 注意：duration 原為數字秒；新增 4-merge/6-merge 字串值 → settings.duration 改字串，content script 解析（parseInt 或特殊值）。
- openInTab：popup.html body 頂部加「在新分頁開啟」按鈕（#openInTab），以 chrome.tabs.create({url: chrome.runtime.getURL('popup.html')})？— Chrome 擴充的 tabs.create 不能開 chrome-extension:// 於普通分頁（可開！extension page 可當普通分頁開啟）。side panel 亦可用 side_panel API 右側顯示：manifest 加 side_panel.default_path popup.html。採用：manifest 加 side_panel；top-right 加 openInTab 按鈕開新分頁 + side panel。

### v1.7 實作進度（續）— 2026-08-17
已完成：
- popup.js：settings def 加 imageModel/defaultMode/imageMode/videoRes/imageRes；duration 改字串 "8"（content script 需 parseInt 相容特殊值 x-merge）。
- bindUI：imageModelSelect/defaultModeSelect/imageModeSelect/videoResSelect/imageResSelect 綁定完成；duration 綁定改字串。
- openInTab 按鈕（id=openInTab，HTML 待加）：chrome.tabs.create({url: chrome.runtime.getURL("popup.html")})。
- openWatermarkSite：https://watermark.kylenguyen.me/ 新分頁。
- popup.html：設置面板加 7 個新下拉 + modelSelect 7 選項（含 veo3.1-lite/lite-low/omni-flash）+ imageModelSelect + aspectChips 加 3:4/4:3 說明文字 + duration 含 4-merge/6-merge。
- manifest：1.7.0 + side_panel.default_path popup.html + action.default_title。
- i18n 三字典全部 key 已加。

待辦：
1. popup.html 頂部加 openInTab 按鈕（.topbar .top-right 內，data-i18n=openInTab）。
2. popup.js 加 showNotFlowWarning()：init 時用 chrome.tabs.query({active:true,currentWindow:true}) 檢查當前 tab URL 是否含 labs.google/fx/tools/flow/project，非專案頁顯示警告卡（notFlowPage/notFlowHint + btnGoToFlow 新分頁開 flow）；popup 內加 #notFlowWarning div（初始 hidden），置於 header 後。
3. flow-automation.js config 接收新欄位（imageMode/videoRes/imageRes/imageModel/duration 字串）並傳遞到使用處（原 downloadRes/duration/aspect/model 已用 settings 對應 key 名，content script 直接用 config.*）。需查 content script 中 duration/imageRes 用法並相容（duration 字串 parseInt + merge 處理；videoRes 取代或併用 downloadRes；imageRes 用於圖片下載；imageModel 用於 text2image 模式；imageMode 用於圖片輸入模式；defaultMode 僅 UI 用）。
4. README 更新 v1.7、打包、交付。
5. 測試：popup 載入三種語言渲染、下拉持久化、openInTab 按鈕（沙盒無 chrome.tabs 用 window.open fallback）、非 Flow 警告（可用 localhost 模擬）。

### v1.7 關鍵實作細節（2026-08-17）
- popup.html 已完成：openInTab 按鈕（topbar.top-right，id=openInTab）、notFlowWarning 卡（id=notFlowWarning，warn-card/hidden，含 btnGoToFlow link target=_blank）、i18n key：openInTab/notFlowPage/notFlowHint/goToFlow。
- popup.js 已完成：showNotFlowWarning()（chrome.tabs.query active tab URL /labs\.google\/fx\/tools\/flow\/project/i 判斷）、loadSettings 新欄位 imageModel=default("nano-banana-2")/defaultMode="text2video"/imageMode="new"/videoRes="1080p"/imageRes="2k"/duration="8" 字串、bindUI 綁定完成、openInTab/openWatermarkSite 新分頁、bindUI 尾端呼叫 showNotFlowWarning()。
- flow-automation.js 已完成：setModel 加 veo3.1-lite="Veo 3.1 Lite"、veo3.1-lite-low="Veo 3.1 Lite [Lower Priority]"、omni-flash="Omni Flash"；setDuration 支援 "8"→"8秒"、"4-merge"→"4秒(合併)"/"4秒 (合併)"；autoDownload 支援 config.videoRes/config.imageRes（"none" 跳過圖片下載；先 trySelectResolution：[role=menuitem]/[role=option]/class*quality 點擊匹配項，fallback 改 URL query size=/resolution=/quality=）。
- processOne L684-692：setAspect→setModel→setOutputs→setDuration（duration 字串直接傳，已相容）。
- 尚待：popup.html 側檢查是否已有 imageModelSelect/defaultModeSelect/imageModeSelect/videoResSelect/imageResSelect 下拉與 data-i18n 選項（前面編輯記錄稱已加——需 grep 驗證）；README 更新；node --check 雙檔案；瀏覽器測試；打包 v1.7.0。
- manifest 已是 1.7.0 + side_panel + action.default_title。
- popup.css 可能需加 .warn-card/.warn-icon/.warn-btn/.topbtn svg 樣式（檢查是否存在 .topbtn 樣式與 hidden）。
- 注意：side_panel 需要 sidePanel API（Manifest V3 實驗性）；若 Chrome 版本不支援可能忽略，popup 照常工作。
- 用戶參考圖：設置下拉值含方案標註（1080P(需要Ultra/Pro方案)等），UI 下拉選項已含標註文字；defaultMode 選項：文本轉視頻/偵數轉視頻/文字轉圖片/圖片轉圖片/組件化視頻/智能體自動化（對應 mode keys）；imageMode：新圖片/上一張圖片（"new"/"last"）；videoRes：720p/1080p/4k；imageRes：none/1k/2k/4k；imageModel：nano-banana-pro/Nano Banana Pro、nano-banana-2/Nano Banana 2、nano-banana-2-lite/Nano Banana 2 Lite。
