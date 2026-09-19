// ============================================================
// Flow Automation — Content Script (injected into Google Flow)
// Fills prompts, selects options, submits jobs and tracks
// progress inside labs.google/fx/tools/flow
// ============================================================

(() => {
  if (window.__flowAutomationInjected) return;
  window.__flowAutomationInjected = true;

  const LOG_PREFIX = "[FlowAutomation]";
  let config = null;
  let queue = [];
  let stopped = false;
  let chainLastFrame = null;
  let resumeFrameFile = null;
  let prevSegmentFrame = null;
  const chainRetriedCount = {};
  let flowCurrentMode = null; // "video" | "image": cached mode detection

  // Chrome message listener
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "START_BATCH") {
      config = msg.config;
      queue = msg.queue;
      stopped = false;
      if (!findPromptTextarea()) {
        log("START_BATCH ignored: no prompt textarea in this frame");
        return;
      }
      if (config.resumeIndex > 0 && config.frames && config.frames.length) {
        const fr = config.frames[0];
        dataURLToFile(fr.dataUrl, fr.name || "chain-last-frame.png")
          .then(f => { resumeFrameFile = f; log("Resumed chain frame restored:", fr.name); })
          .catch(e => log("Resume frame restore failed:", e.message));
      }
      runBatch();
    } else if (msg.type === "STOP_BATCH") {
      stopped = true;
    }
  });

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
    reportDebugLog(args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" "), "info");
  }
  function logError(...args) {
    console.error(LOG_PREFIX, ...args);
    reportDebugLog(args.map(a => a instanceof Error ? (a.message + (a.stack ? "\n" + a.stack : "")) :
      (typeof a === "string" ? a : JSON.stringify(a))).join(" "), "error");
  }

  // 透過 React fiber 找 Slate editor 實例（data-slate-editor 的編輯器）
  function findSlateEditor(el) {
    try {
      let node = el;
      for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
        const fk = Object.keys(node).find(k => k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$"));
        if (!fk) continue;
        let fiber = node[fk];
        for (let i = 0; fiber && i < 60; i++) {
          const props = fiber.memoizedProps || fiber.pendingProps || {};
          const cand = props.editor || (fiber.memoizedState && fiber.memoizedState.memoizedState);
          if (cand && typeof cand.insertText === "function" && typeof cand.onChange === "function") {
            return cand;
          }
          fiber = fiber.return;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // Utility: set native input value
  function setNativeValue(el, value) {
    if (el && el.isContentEditable) {
      el.focus();
      // 記錄編輯器資訊（判斷是哪種富文字框架，方便除錯）
      try {
        const cls = (el.className || "") + " " + ((el.parentElement && el.parentElement.className) || "");
        const isPM = /prosemirror/i.test(cls) || !!el.querySelector(".ProseMirror");
        const isLex = /lexical/i.test(cls) || el.hasAttribute("data-lexical-editor");
        const isSlate = el.hasAttribute("data-slate-editor") || (el.outerHTML || "").includes("data-slate-editor");
        log("[Prompt] editor type:", isSlate ? "Slate" : isPM ? "ProseMirror" : isLex ? "Lexical" : "unknown", "| class:", cls.slice(0, 80));
      } catch (e) { /* ignore */ }

      // 方法 A（Slate 專用）：透過 React fiber 找到 Slate editor，設定 selection 後用 editor.insertText
      const slateEditor = findSlateEditor(el);
      if (slateEditor) {
        try {
          // 空編輯器通常是 [{children:[{text:""}]}]，path [0,0] 是第一個文字節點
          slateEditor.selection = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } };
          slateEditor.insertText(value);
          log("[Prompt] filled via Slate editor.insertText, length:", value.length);
          return;
        } catch (e) {
          log("[Prompt] Slate insertText failed:", e.message);
        }
      }

      // 方法 B：設定 DOM 游標到第一個 block 的開頭，再 dispatch beforeinput
      //（Slate/ProseMirror 的 onBeforeInput 處理 insertText 並更新內部狀態）
      try {
        const block = el.querySelector("p, div, [data-slate-node='element']") || el;
        const range = document.createRange();
        range.selectNodeContents(block);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) { /* ignore */ }
      try {
        el.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "insertText", data: value }));
      } catch (e) { /* ignore */ }
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));

      // 方法 C：execCommand 補 DOM（若框架沒處理 beforeinput，至少視覺上要有文字）
      const cur = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!cur.includes(value.replace(/\s+/g, " ").slice(0, 10))) {
        try {
          const range = document.createRange();
          range.selectNodeContents(el.querySelector("p, div, [data-slate-node='element']") || el);
          range.collapse(true);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand("insertText", false, value);
          el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
        } catch (e) { /* ignore */ }
      }
      log("[Prompt] filled (beforeinput/execCommand), length:", value.length);
      return;
    }
    // textarea / input
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 填字後驗證：記錄 DOM 是否真的有文字、以及偵測到的富文字框架
  function verifyPromptFill(el, expected) {
    try {
      const domText = (el.textContent || "").replace(/\s+/g, " ").trim();
      const exp = (expected || "").replace(/\s+/g, " ").trim();
      const domOk = domText.length > 0 && (domText.includes(exp.slice(0, 30)) || exp.includes(domText.slice(0, 30)));
      log("[Prompt] verify: domText len=" + domText.length, "domMatch=" + domOk);
      return domOk;
    } catch (e) { return false; }
  }

  // Click helpers
  function click(el) {
    if (!el) return false;
    try {
      el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true }));
    } catch (e) { /* ignore */ }
    el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    el.click();
    return true;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function randWait() {
    const min = Math.min(config.waitMin || 0, config.waitMax || 0);
    const max = Math.max(config.waitMin || 0, config.waitMax || 0);
    return min + Math.random() * (max - min);
  }

  // Status reporting
  function reportItemStatus(id, status) {
    try { chrome.runtime.sendMessage({ type: "ITEM_STATUS", id, status }); } catch (e) { /* ignore */ }
  }

  // Element finders (Google Flow UI)
  function findPromptTextarea() {
    const all = Array.from(document.querySelectorAll(
      "textarea, [contenteditable='true'], [contenteditable='plaintext-only'], [contenteditable='']"
    ));
    const isVisible = el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 &&
        getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none";
    };
    const visible = all.filter(isVisible);
    const attrs = (el) =>
      (el.getAttribute("placeholder") || "") + " " +
      (el.getAttribute("aria-label") || "") + " " +
      (el.getAttribute("data-testid") || "") + " " +
      (el.getAttribute("title") || "");
    // 除錯：列出所有候選輸入框（判斷是否抓錯元素）
    try {
      const cand = all.map(el => {
        const r = el.getBoundingClientRect();
        return el.tagName + "(ce=" + el.isContentEditable + ",ph=" + JSON.stringify((el.getAttribute("placeholder") || "").slice(0, 20)) + ",al=" + JSON.stringify((el.getAttribute("aria-label") || "").slice(0, 20)) + ",cls=" + JSON.stringify((el.className || "").toString().slice(0, 40)) + ",vis=" + (r.width > 0 && r.height > 0) + ")";
      });
      log("[Prompt] candidates:", cand.join(" | "));
    } catch (e) { /* ignore */ }
    const byKeyword = visible.filter(el => /prompt|提示|描述|Describe|Prompt|prompt/i.test(attrs(el)));
    if (byKeyword.length > 0) return byKeyword[0];
    const ce = visible.find(el => el.isContentEditable);
    if (ce) return ce;
    const withPh = visible.filter(el => (el.getAttribute("placeholder") || "").trim());
    if (withPh.length > 0) return withPh[0];
    if (visible.length > 0) return visible[0];
    return all[0] || null;
  }

  // 圖片模式專用送出鍵：底部列的圖示箭頭按鈕（無文字，只有 → / arrow_forward 圖示）。
  // 文字候選在圖片 UI 經常為空（面板只有圖示），此函式優先找圖示鍵，避免誤點其他按鈕。
  function findImageSubmitButton() {
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const bottomThreshold = viewH * 0.5;
    const arrowRe = /arrow_forward|arrow_forward_ios|send|arrow_right|arrow_upward|→|➤|▶|↑/i;
    const modelRe = /veo|banana|🍌|omni|crop_|x[1-4]|16:9|9:16|1:1|3:4|4:3|720|1080/i;
    const cands = Array.from(document.querySelectorAll("button, [role='button']")).filter(b => {
      const r = b.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      if (r.top < bottomThreshold) return false; // 只看下半部（提示詞列附近）
      const t = (b.textContent || "").replace(/\s+/g, " ").trim();
      // 排除模型 pill（底部那顆大的）與有明確文字的非箭頭按鈕
      if (modelRe.test(t) && t.length > 6) return false;
      if (t.length > 6 && !arrowRe.test(t)) return false;
      const al = (b.getAttribute("aria-label") || "") + " " + (b.getAttribute("title") || "");
      const html = (b.innerHTML || "").slice(0, 500);
      if (arrowRe.test(t) || arrowRe.test(al) || /arrow_forward|material-icons|material-symbols/i.test(html)) return true;
      // 無文字小圓鍵（箭頭圖示按鈕通常是小的方形/圓形，文字為空）
      if (!t && r.width < 80 && r.height < 80) return true;
      return false;
    });
    if (cands.length === 0) return null;
    // 取最右邊的（送出鍵在提示詞列最右，如截圖底部 →）
    const btn = cands.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
    const r = btn.getBoundingClientRect();
    log("[Submit] image arrow button:", JSON.stringify(((btn.textContent || "") + " " + (btn.getAttribute("aria-label") || "")).trim().slice(0, 30)),
      "pos=" + Math.round(r.left) + "," + Math.round(r.top));
    return btn;
  }

  function findSubmitButton(isImageMode) {
    // 圖片模式優先找圖示箭頭送出鍵
    if (isImageMode) {
      const arrow = findImageSubmitButton();
      if (arrow) return arrow;
      log("[Submit] image arrow not found, falling back to text candidates");
    }
    const describe = b => (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const pos = b => { const r = b.getBoundingClientRect(); return Math.round(r.left) + "," + Math.round(r.top); };
    // 收集所有可見 <button>（含停用——送出鍵可能因提示詞未被辨識而停用，需記錄）
    const btns = Array.from(document.querySelectorAll("button")).filter(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const createRe = /创建|創建|create|生成|產生|送出|提交|執行|submit/i;
    const excludeRe = /取消|cancel|close|關閉|清除|更多|more_vert|搜索|search|排序|filter|添加媒体|返回|收起/i;
    const candidates = btns.filter(b => {
      const t = (b.textContent || "").replace(/\s+/g, " ").trim();
      if (!t) return false;
      if (excludeRe.test(t)) return false;
      return createRe.test(t);
    });
    // 診斷：列出所有候選按鈕（含停用狀態與位置）
    try {
      log("[Submit] candidate buttons:", candidates.map(b => "'" + describe(b) + "' d=" + (b.disabled || b.getAttribute("aria-disabled") === "true") + " pos=" + pos(b)).join(" | "));
    } catch (e) { /* ignore */ }
    // 優先：含 arrow_forward 的主送出鍵（Flow 的 arrow_forward创建）
    const submit = candidates.find(b => /arrow_forward/i.test(b.textContent || ""));
    if (submit) {
      const dis = submit.disabled || submit.getAttribute("aria-disabled") === "true";
      log("Submit button:", describe(submit), dis ? "(DISABLED—提示詞可能未被 Flow 辨識)" : "");
      return submit;
    }
    // 其次：取最右邊的「創建」按鈕（排除 add_2 加號鍵）
    const noAdd = candidates.filter(b => !/add_2|^add\b|^add$/.test((b.textContent || "").replace(/\s+/g, " ").trim()));
    if (noAdd.length > 0) {
      const btn = noAdd.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
      log("Submit button (rightmost create):", describe(btn));
      return btn;
    }
    // 最後：候選中最右邊的
    if (candidates.length > 0) {
      const btn = candidates.sort((a, b) => b.getBoundingClientRect().left - a.getBoundingClientRect().left)[0];
      log("Submit button (fallback):", describe(btn));
      return btn;
    }
    // 極端 fallback：最後一個可見 button
    if (btns.length > 0) {
      const last = btns[btns.length - 1];
      log("Submit button (last fallback):", describe(last));
      return last;
    }
    log("Submit button: NOT FOUND");
    return null;
  }

  function findAspectRatioButtons() {
    const ratios = ["16:9", "9:16", "1:1", "3:4", "4:3"];
    // 匹配 16:9, 16/9, 16_9 等格式（含圖示前綴如 "crop_16_9x1"）
    const ratioRe = /16[_:/]9|9[_:/]16|1[_:/]1|3[_:/]4|4[_:/]3/;
    const isRatioEl = el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      const text = (el.textContent || "").trim();
      // 排除模型選擇器按鈕（含 crop_ 與 x1/x4）和工具列大按鈕
      // 排除純模型名稱按鈕，但保留含比例文字的 crop 按鈕（如 "crop_16_916:9"）
      const hasRatio = /16[_:]9|9[_:]16|1[_:]1|3[_:]4|4[_:]3/.test(text);
      if (!hasRatio && /crop|x[1-4]|Nano|Veo|🍌|720|1080/.test(text)) return false;
      if (text.length > 20) return false;
      const al = (el.getAttribute("aria-label") || "").trim();
      const ti = (el.getAttribute("title") || "").trim();
      const dt = (el.getAttribute("data-testid") || "").trim();
      const all = text + " " + al + " " + ti + " " + dt;
      // 精確比對或 regex 匹配
      return ratios.some(r => all.includes(r)) || ratioRe.test(all) ||
             /aspect|ratio|比例|寬高/.test(all);
    };
    // 搜尋所有可互動元素（含 Shadow DOM）
    return queryAllVisible(document).filter(isRatioEl);
  }

  // Flow panel mode switch (chain)
  const MODE_BUTTON_LABELS = {
    text2video: ["文字轉影片", "文字转视频", "Text to Video"],
    frame2video: [
      "幀數轉影片", "幀轉影片", "帧数转视频", "帧转视频", "從幀轉換", "从帧转换",
      "Frames to Video", "Frame to Video", "Frame2Video", "Frame to video"
    ]
  };
  function findModeSwitchButton(modeKey) {
    const labels = MODE_BUTTON_LABELS[modeKey] || [];
    const candidates = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='tab'], [role='radio'], nav a, a[href], " +
      "[data-testid*='mode'], [data-testid*='tab'], [class*='mode'], [class*='tab']"
    ));
    for (const label of labels) {
      const el = candidates.find(c => (c.textContent || "").trim() === label);
      if (el) return el;
    }
    for (const label of labels) {
      const el = candidates.find(c => (c.textContent || "").trim().includes(label));
      if (el) return el;
    }
    const kw = modeKey === "frame2video" ? /frame|幀|帧/i : /text|文字|文本/i;
    const el = candidates.find(c => kw.test(
      (c.getAttribute("aria-label") || "") + " " +
      (c.getAttribute("data-testid") || "") + " " +
      (c.getAttribute("title") || "")
    ));
    return el || null;
  }
  async function switchMode(modeKey) {
    const el = findModeSwitchButton(modeKey);
    if (!el) {
      logError("Mode switch failed: button not found for", modeKey);
      try {
        const seen = Array.from(document.querySelectorAll("button, [role='button'], [role='tab'], [role='radio'], nav a, a[href]"))
          .map(c => (c.textContent || "").replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 30);
        log("Available UI labels:", JSON.stringify(seen));
      } catch (e) { /* ignore */ }
      return false;
    }
    log("Switching Flow panel to", modeKey);
    click(el);
    await sleep(3500);
    return true;
  }

  // Select dropdown option — exact match + fallback includes + attribute match
  function selectByText(text) {
    const visible = el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    // 1) leaf 精確比對
    const leaves = Array.from(document.querySelectorAll("*")).filter(
      el => visible(el) && el.children.length === 0 && (el.textContent || "").trim() === text);
    for (const el of leaves) { if (click(el)) return true; }
    // 2) 可點擊元素精確比對
    const clickables = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='option'], [role='tab'], [role='radio'], li, a"
    )).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (el.textContent || "").trim() === text;
    });
    for (const el of clickables) { if (click(el)) return true; }
    // 3) Fallback: includes 比對 + 屬性比對
    const normS = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const tLower = normS(text);
    const leafInc = Array.from(document.querySelectorAll("*")).filter(
      el => visible(el) && el.children.length === 0 && normS(el.textContent) === tLower);
    for (const el of leafInc) { if (click(el)) return true; }
    const clickInc = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='option'], [role='tab'], [role='radio'], li, a, div, span"
    )).filter(el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      const al = normS(el.getAttribute("aria-label") || "");
      const ti = normS(el.getAttribute("title") || "");
      const dt = normS(el.getAttribute("data-testid") || "");
      if (al === tLower || ti === tLower || dt === tLower) return true;
      if (normS(el.textContent) === tLower) return true;
      return false;
    });
    for (const el of clickInc) { if (click(el)) return true; }
    return false;
  }

  // Fuzzy/contains matcher — used as fallback when selectByText fails
  // because the option text has an emoji or icon prefix (e.g. "🍌 Nano Banana 2").
  function selectByTextContains(text) {
    const stripEmoji = s => (s || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
    const target = stripEmoji(text);
    if (!target) return false;
    const visible = el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    // Exclude elements that are dropdown triggers or composite buttons
    // (e.g. "🍌 Nano Banana 2 arrow_drop_down" — clicking it opens a dropdown
    // overlay that blocks subsequent panel operations).
    const isTrigger = el => {
      const t = stripEmoji(el.textContent || "");
      return /arrow_drop_down|arrow_drop_up|expand_more|unfold_more|crop_\d|crop_landscape|crop_square|crop_portrait|^\s*x\s*\d/i.test(t);
    };
    // Try clickable elements whose stripped text matches exactly (excluding triggers)
    const els = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='option'], [role='tab'], [role='radio'], li, a, mat-list-item, span"
    )).filter(el => {
      if (!visible(el)) return false;
      const raw = (el.textContent || "").trim();
      if (raw.length > 80) return false;
      if (isTrigger(el)) return false;
      return stripEmoji(raw) === target;
    });
    for (const el of els) { if (click(el)) return true; }
    // Looser: contains (not exact) match — still exclude triggers
    const loose = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='option'], mat-list-item"
    )).filter(el => {
      if (!visible(el)) return false;
      const raw = (el.textContent || "").trim();
      if (raw.length > 80) return false;
      if (isTrigger(el)) return false;
      return stripEmoji(raw).includes(target);
    });
    for (const el of loose) { if (click(el)) return true; }
    return false;
  }

  // DataURL to File
  async function dataURLToFile(dataURL, name) {
    const resp = await fetch(dataURL);
    const blob = await resp.blob();
    return new File([blob], name, { type: "image/png" });
  }

  // Report to popup
  function reportChainFrame(index, dataURL) {
    try { chrome.runtime.sendMessage({ type: "CHAIN_FRAME", index, dataURL }); } catch (e) { /* ignore */ }
  }
  function reportItemResult(id, videoUrl, dataURL) {
    try { chrome.runtime.sendMessage({ type: "ITEM_RESULT", id, videoUrl, dataURL }); } catch (e) { /* ignore */ }
  }
  function reportItemRetry(id) {
    try { chrome.runtime.sendMessage({ type: "ITEM_RETRY", id }); } catch (e) { /* ignore */ }
  }
  function reportDebugLog(text, level) {
    try { chrome.runtime.sendMessage({ type: "DEBUG_LOG", text, level }); } catch (e) { /* ignore */ }
  }

  // Upload frames
  async function uploadFrames(files) {
    log("Uploading", files.length, "frames");
    const input = document.querySelector('input[type="file"][accept*="image"]') ||
      document.querySelector('input[type="file"]');
    if (!input) {
      reportItemStatus(queue[0]?.id, "error");
      return false;
    }
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(3000);
    return true;
  }

  // Chain Prompt: capture last frame
  async function captureLastFrame(url) {
    try {
      log("Capturing last frame from video URL:", url.slice(0, 80));
      const resp = await fetch(url);
      const blob = await resp.blob();
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      const loaded = new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("video load timeout")), 30000);
        video.addEventListener("loadeddata", () => { clearTimeout(timer); resolve(); }, { once: true });
        video.addEventListener("error", () => { clearTimeout(timer); reject(new Error("video load error")); }, { once: true });
      });
      video.src = URL.createObjectURL(blob);
      await loaded;
      video.currentTime = Math.max(0, (video.duration || 0) - 0.1);
      await new Promise(r => { video.addEventListener("seeked", r, { once: true }); });
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pngBlob = await new Promise(r => canvas.toBlob(r, "image/png"));
      URL.revokeObjectURL(video.src);
      const file = new File([pngBlob], "chain-last-frame.png", { type: "image/png" });
      log("Last frame captured:", canvas.width, "x", canvas.height, pngBlob.size, "bytes");
      return file;
    } catch (e) {
      log("captureLastFrame failed:", e.message);
      return null;
    }
  }

  async function waitForResult(maxMs) {
    const start = performance.now();
    return new Promise(resolve => {
      const check = () => {
        const media = Array.from(document.querySelectorAll("video, img")).filter(m => {
          const src = m.src || m.currentSrc;
          return src && !mediaBefore.has(src);
        });
        if (media.length > 0) { resolve(media[media.length - 1]); return true; }
        if (performance.now() - start > maxMs) { resolve(null); return false; }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  // Diagnostic: collect visible element labels
  function optionLabels(limit = 40) {
    const seen = [];
    Array.from(document.querySelectorAll("button, [role='button'], [role='option'], [role='tab'], [role='radio'], li"))
      .forEach(el => {
        const r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) return;
        const t = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (t && t.length < 40 && seen.indexOf(t) === -1) seen.push(t);
      });
    return seen.slice(0, limit);
  }
  function logOptionCandidates(desc, els, limit = 20) {
    try {
      const seen = [];
      (els || []).forEach(el => {
        const t = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (t && seen.indexOf(t) === -1) seen.push(t);
      });
      log(desc, JSON.stringify(seen.slice(0, limit)));
    } catch (e) { /* ignore */ }
  }

  // Full-page DOM dump for debugging
  function dumpPageElements() {
    const norm = s => (s || "").replace(/\s+/g, " ").trim();
    const els = Array.from(document.querySelectorAll(
      "button, [role='button'], [role='tab'], [role='radio'], [role='option'], " +
      "li, a, select, input, [contenteditable], [data-testid], [aria-label]"
    )).filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const info = els.slice(0, 80).map(el => {
      const tag = el.tagName;
      const text = norm(el.textContent).slice(0, 50);
      const al = norm(el.getAttribute("aria-label"));
      const ti = norm(el.getAttribute("title"));
      const dt = norm(el.getAttribute("data-testid"));
      const role = norm(el.getAttribute("role"));
      const cls = (el.className || "").toString().replace(/\s+/g, " ").trim().slice(0, 60);
      const pressed = el.getAttribute("aria-pressed");
      const selected = el.getAttribute("aria-selected");
      const parts = ["<" + tag + ">"];
      if (text) parts.push("text=" + JSON.stringify(text));
      if (al) parts.push("aria-label=" + JSON.stringify(al));
      if (ti) parts.push("title=" + JSON.stringify(ti));
      if (dt) parts.push("data-testid=" + JSON.stringify(dt));
      if (role) parts.push("role=" + role);
      if (cls) parts.push("class=" + JSON.stringify(cls.slice(0, 40)));
      if (pressed) parts.push("pressed=" + pressed);
      if (selected) parts.push("selected=" + selected);
      return parts.join(" ");
    });
    log("[DOM] Page interactive elements (" + els.length + " total):");
    for (let i = 0; i < info.length; i += 5) {
      log("[DOM]", info.slice(i, i + 5).join(" | "));
    }
  }

  // --------------- Auto-detect Flow mode ---------------
  // Uses URL, bottom toolbar button text, and MODEL NAMES to determine mode.
  // Nano Banana = image model, Veo = video model.
  function detectFlowMode() {
    const norm = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const prompt = findPromptTextarea();
    if (!prompt) return null;
    const p = prompt.getBoundingClientRect();
    const chipInfo = el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0 && r.width < 500 && r.height < 80) ||
          el.closest("[role='menu'], [role='listbox'], [role='dialog']")) return null;
      const label = (norm(el.textContent) + " " + norm(el.getAttribute("aria-label"))).trim();
      // A model name or generation settings distinguish the active composer
      // chip from gallery items such as "image圖像" and media card names.
      const image = /nano\s*banana|🍌/i.test(label);
      const video = /\bveo\b|\b720p\b|\b360p\b|\b1080p\b/i.test(label) &&
        /影片|視頻|视频|video|veo/i.test(label);
      if (image && !video) return "image";
      if (video && !image) return "video";
      if (/^(影片|視頻|视频|video)(?:\s|·|•|$)/i.test(label)) return "video";
      if (/^(圖片|图片|圖像|图像|image)(?:\s|·|•|$)/i.test(label)) return "image";
      return null;
    };
    // Search the smallest ancestor that contains both editor and composer chip.
    // The ProseMirror editor can be much narrower than the surrounding toolbar.
    for (let node = prompt.parentElement, hops = 0; node && node !== document.body && hops < 9; node = node.parentElement, hops++) {
      const chips = Array.from(node.querySelectorAll("button, [role='button']"))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.top >= p.top - 80 && r.top <= p.bottom + 150;
        });
      const modes = chips.map(chipInfo).filter(Boolean);
      if (modes.length === 1) return modes[0];
    }
    // Fallback for Flow layouts that portal the toolbar outside the editor.
    const nearby = Array.from(document.querySelectorAll("button, [role='button']"))
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= p.top - 25 && r.top <= p.bottom + 150 &&
          r.left >= p.left - 50 && r.left <= p.right + 300;
      })
      .map(el => ({ el, mode: chipInfo(el) }))
      .filter(x => x.mode)
      .sort((a, b) => Math.abs(a.el.getBoundingClientRect().top - p.bottom) -
        Math.abs(b.el.getBoundingClientRect().top - p.bottom));
    if (nearby.length) return nearby[0].mode;
    return null;
  }

  function validateAndFixMode() {
    flowCurrentMode = detectFlowMode();
    const isImageConfig = config.mode === "text2image" || config.mode === "image2image";
    log("[Mode] detected Flow mode:", flowCurrentMode, "config.mode:", config.mode);
    // 不覆蓋 config.mode，讓 ensureOutputMode 負責切換 Flow UI
    if (flowCurrentMode === "image" && !isImageConfig) {
      log("[Mode] Flow 在圖片模式但 config 是影片模式 → 將嘗試切換 Flow 到影片模式");
    } else if (flowCurrentMode === "video" && isImageConfig) {
      log("[Mode] Flow 在影片模式但 config 是圖片模式 → 將嘗試切換 Flow 到圖片模式");
    } else if (flowCurrentMode) {
      log("[Mode] Flow 模式與 config 一致");
    }
  }

  // --------------- 點擊模型選擇器按鈕開啟設定面板 ---------------
  // Flow 底部工具列的模型按鈕（如 "🍌 Nano Banana 2crop_16_9x1"）
  // 點擊後會打開模型/比例/數量設定面板，再從中選擇正確選項。
  async function openModelPanel() {
    const viewH = window.innerHeight || document.documentElement.clientHeight;
    const bottomThreshold = viewH * 0.6;
    // 找底部工具列的按鈕（放宽尺寸限制）
    const toolbarBtns = Array.from(document.querySelectorAll(
      "button, [role='button']"
    )).filter(el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      return r.top > bottomThreshold && r.height > 15 && r.height < 80;
    });
    // Debug: 列出底部工具列按鈕
    const btnInfo = toolbarBtns.map(b => {
      const t = (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30);
      const r = b.getBoundingClientRect();
      return "'" + t + "' " + Math.round(r.width) + "x" + Math.round(r.height) + " y=" + Math.round(r.top);
    });
    log("[Model] Toolbar buttons (" + toolbarBtns.length + "):", JSON.stringify(btnInfo));
    // 僅點提示詞旁的模型／模式 pill；不可退回點最寬按鈕（可能是送出鍵）。
    const prompt = findPromptTextarea();
    const promptRect = prompt?.getBoundingClientRect();
    const modelBtn = toolbarBtns.filter(el => {
      if (!promptRect) return false;
      const r = el.getBoundingClientRect();
      return r.top >= promptRect.top - 80 && r.top <= promptRect.bottom + 150;
    }).filter(el => {
      const t = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
      if (/創建|创建|生成|submit|send|arrow_forward|arrow_upward/i.test(t)) return false;
      return /veo|banana|🍌|omni|视频|視頻|影片|video|圖片|图片|圖像|图像|image|720|1080|4k|crop/i.test(t);
    }).sort((a, b) => {
      const score = el => /veo|banana|🍌|omni|720p|360p|1080p|x[1-4]/i.test(el.textContent || "") ? 1 : 0;
      return score(b) - score(a) ||
        Math.abs(a.getBoundingClientRect().top - promptRect.bottom) -
        Math.abs(b.getBoundingClientRect().top - promptRect.bottom);
    })[0];
    if (modelBtn) {
      click(modelBtn);
      log("[Model] Clicked model selector:", (modelBtn.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40));
      await sleep(2000); // 等面板完全渲染
      return modelBtn; // 回傳按鈕本體：圖片模式設完選項後可再點一次收起面板
    }
    log("[Model] Model selector button not found");
    return null;
  }

  // --------------- Panel DOM dump (debug) ---------------
  // 遞迴搜尋 Shadow DOM 和主文件的所有可見互動元素
  function queryAllVisible(root) {
    const els = [];
    const seen = new Set();
    // 基礎選擇器：標準互動元素
    const baseSelector = "button, [role='button'], [role='tab'], [role='radio'], [role='option'], li, a, select, option";
    // 主文件：標準互動元素
    try {
      Array.from(root.querySelectorAll(baseSelector)).forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && !seen.has(el)) { seen.add(el); els.push(el); }
      });
    } catch(e) {}
    // 額外搜尋：div/span 中文字長度 ≤15 的葉子元素（面板內的比例/時長/數量按鈕）
    try {
      Array.from(root.querySelectorAll("div, span")).forEach(el => {
        const r = el.getBoundingClientRect();
        if (!(r.width > 15 && r.height > 10 && r.width < 200 && r.height < 80)) return;
        if (seen.has(el)) return;
        const text = (el.textContent || "").trim();
        // 只取葉子元素或文字很短的元素
        if (text.length > 0 && text.length <= 15 && el.children.length <= 3) {
          seen.add(el); els.push(el);
        }
      });
    } catch(e) {}
    // 遞迴搜尋 Shadow DOM
    try {
      root.querySelectorAll("*").forEach(el => {
        if (el.shadowRoot) {
          queryAllVisible(el.shadowRoot).forEach(e => { if (!seen.has(e)) { seen.add(e); els.push(e); } });
        }
      });
    } catch(e) {}
    // 搜尋 iframes
    try {
      Array.from(root.querySelectorAll("iframe")).forEach(iframe => {
        try {
          const iDoc = iframe.contentDocument || iframe.contentWindow.document;
          queryAllVisible(iDoc).forEach(e => { if (!seen.has(e)) { seen.add(e); els.push(e); } });
        } catch(e) { /* cross-origin */ }
      });
    } catch(e) {}
    return els;
  }
  function dumpPanelElements() {
    const norm = s => (s || "").replace(/\s+/g, " ").trim();
    const els = queryAllVisible(document);
    // 過濾：只保留面板相關的元素（排除 sidebar 元素）
    // sidebar 通常在 x < 250 的位置
    const panelEls = els.filter(el => {
      const r = el.getBoundingClientRect();
      return r.x > 200 || r.width > 300; // 排除 sidebar 按鈕
    });
    const allInfo = els.slice(0, 120).map(el => {
      const r = el.getBoundingClientRect();
      const tag = el.tagName;
      const text = norm(el.textContent).slice(0, 40);
      return "<" + tag + "> " + JSON.stringify(text) + " pos=" + Math.round(r.x) + "," + Math.round(r.y) + " sz=" + Math.round(r.width) + "x" + Math.round(r.height);
    });
    const panelInfo = panelEls.slice(0, 80).map(el => {
      const r = el.getBoundingClientRect();
      const tag = el.tagName;
      const text = norm(el.textContent).slice(0, 40);
      return "<" + tag + "> " + JSON.stringify(text) + " pos=" + Math.round(r.x) + "," + Math.round(r.y) + " sz=" + Math.round(r.width) + "x" + Math.round(r.height);
    });
    log("[Panel] total visible elements:", els.length, "panel-area elements:", panelEls.length, "(div/span included)");
    const chunkSize = 8;
    for (let i = 0; i < allInfo.length; i += chunkSize) {
      log("[Panel] all (" + (i + 1) + "-" + Math.min(i + chunkSize, allInfo.length) + "):", allInfo.slice(i, i + chunkSize).join(" | "));
    }
    if (panelInfo.length > 0) {
      for (let i = 0; i < panelInfo.length; i += chunkSize) {
        log("[Panel] panel (" + (i + 1) + "-" + Math.min(i + chunkSize, panelInfo.length) + "):", panelInfo.slice(i, i + chunkSize).join(" | "));
      }
    } else {
      log("[Panel] WARNING: No panel-area elements found! Panel may be in Shadow DOM or not rendered.");
    }
  }

  // --------------- Auto-scan characters from Flow UI ---------------
  function autoScanCharacters() {
    if (config.charNames && config.charNames.length > 0) return;
    const norm = s => (s || "").replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    const found = [];
    // Icon prefixes that Flow prepends to card names
    const iconPrefixes = /^(accessibility_new|image|movie|apps_spark_2|smart_3|delete|filter_list|arrow_back|arrow_forward|left_panel_close|more_vert|search|help|settings_2|add|add_2|dashboard|image_2|PRO)*/i;
    // Junk patterns applied AFTER extracting name (not on raw text)
    const junkNameRe = /^(您希望|创作|什么|内容|智能体|工具|回收|排序|过滤|添加|帮助|查看|设置|更多|返回|收起|添加媒体|翻译|translate|create|character|card|prompt|identical|stacks|720|1080|4k|nano|banana|veo|视频|图片|影像|照片|比例|时长|数量|更多选项|搜索|排序和过滤|产品帮助|查看设置|所有媒体内容|查看图片|角色|查看场景|查看回收站|_2创建|创建|选项|点击|拖曳|圖片|图像|圖像|相片|封面|cover|photo|media|image|picture)$/;
    // Target: character/asset cards with role=button
    const btns = Array.from(document.querySelectorAll("[role='button'], button"));
    for (const el of btns) {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) continue;
      const rawText = (el.textContent || "").trim();
      if (!rawText || rawText.length > 30 || rawText.length < 2) continue;
      // 先提取名稱：去掉 icon 前綴文字
      let name = rawText.replace(iconPrefixes, "").trim();
      if (!name || name.length < 2 || name.length > 20) continue;
      // 去掉尾部裝飾詞
      name = name.replace(/(stacks|card|scene|prompt|character)$/i, "").trim();
      if (!name || name.length < 2) continue;
      // 對提取後的名稱做過濾（而非原始文字）
      if (junkNameRe.test(name)) continue;
      // 通用圖片代名（含縮圖系、使用者圖像區塊）絕非使用者命名
      if (/縮圖|缩图|thumbnail/i.test(name)) continue;
      if (/使用者圖像|使用者图像|显示使用者|顯示使用者|user image/i.test(name)) continue;
      // 跳過含空格的多詞描述
      if (name.includes(" ")) continue;
      // 跳過純數字或過短
      if (/^\d+$/.test(name)) continue;
      const nn = norm(name);
      if (nn && nn.length >= 2 && !found.some(f => norm(f) === nn)) {
        found.push(name);
      }
    }
    if (found.length > 0) {
      log("[AutoScan] Flow 頁面自動掃描到角色:", JSON.stringify(found));
      config.charNames = found;
      config.charSelected = found;
    } else {
      log("[AutoScan] Flow 頁面未掃描到角色");
    }
  }

  // Auto-scan image/material assets from the Flow project grid.
  // Populates config.materialNames when the list is empty so that
  // @-mentioned assets in the prompt can be matched and added.
  function autoScanMaterials() {
    if (config.materialNames && config.materialNames.length > 0) return;
    const found = [];
    const seen = new Set();
    // Flow grid tiles carry aria-label with the asset name
    const tiles = Array.from(document.querySelectorAll("flow-grid-tile-container, [class*='grid-tile'], [class*='tile-container']"));
    for (const el of tiles) {
      const label = (el.getAttribute("aria-label") || "").trim();
      if (!label || label.length < 2 || label.length > 60) continue;
      // Skip character-like labels (they're scanned by autoScanCharacters)
      if (/^(stick\s?figure|stickman|character|角色)/i.test(label)) continue;
      // Skip generic UI labels
      if (/^(favorite|redo|more_vert|image|videocam|stacks|close|add)$/i.test(label)) continue;
      if (!seen.has(label)) { seen.add(label); found.push(label); }
    }
    // Fallback: scan any element with role=button that looks like a file name
    if (found.length === 0) {
      const btns = Array.from(document.querySelectorAll("[role='button'], [aria-label]"));
      for (const el of btns) {
        const r = el.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) continue;
        const label = (el.getAttribute("aria-label") || "").trim();
        if (!label || label.length < 2 || label.length > 60) continue;
        // Only accept file-like names (have extension or hyphen/underscore pattern)
        if (!/\.(png|jpe?g|webp|gif)$/i.test(label) && !/^[a-z]\d+-/i.test(label)) continue;
        if (!seen.has(label)) { seen.add(label); found.push(label); }
      }
    }
    if (found.length > 0) {
      log("[AutoScan] Flow 頁面自動掃描到素材:", JSON.stringify(found));
      config.materialNames = found;
      if (!config.materialEnabled) {
        config.materialEnabled = true;
        log("[AutoScan] 已自動啟用素材加入功能");
      }
    }
  }

  // Choose the creation type beside the prompt, then read the toolbar again.
  async function ensureOutputMode(kind) {
    const current = detectFlowMode();
    flowCurrentMode = current;
    if (current === kind) { log("Flow creation mode already", kind); return true; }
    const imageRe = /^(圖片|图片|圖像|图像|image|images|文生圖|文生图|文字轉圖片|文字转图片|text to image|create image|創建圖片|创建图片|創建圖像|创建图像|生成圖片|生成图片)$/i;
    const videoRe = /^(影片|視頻|视频|video|videos|文生影片|文生视频|文字轉影片|文字转视频|text to video|create video|創建影片|创建视频|生成影片|生成视频)$/i;
    const targetRe = kind === "image" ? imageRe : videoRe;
    const candidates = queryAllVisible(document).filter(el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0) || el.closest("nav, header, aside, [role='navigation']")) return false;
      const text = (el.textContent || "").replace(/^(?:image|movie|videocam|photo|add_2)\s*(?=創建|创建|生成|圖片|图片|圖像|图像|影片|視頻|视频)/i, "").replace(/\s+/g, " ").trim();
      return targetRe.test(text) && r.width < 300 && r.height < 90;
    });
    // Opened dropdown/popover items take priority over unrelated page buttons.
    candidates.sort((a, b) => {
      const inMenu = el => !!el.closest("[role='menu'], [role='listbox'], [role='dialog'], [class*='popover'], [class*='dropdown']");
      return Number(inMenu(b)) - Number(inMenu(a)) || b.getBoundingClientRect().top - a.getBoundingClientRect().top;
    });
    const option = candidates[0];
    if (!option) {
      log("Creation mode option not found:", kind);
      return false;
    }
    click(option);
    await sleep(1200);
    let actual = detectFlowMode();
    if (actual !== kind) { await sleep(1000); actual = detectFlowMode(); }
    if (actual !== kind) {
      log("Creation mode did not change:", "requested=" + kind, "detected=" + actual);
      return false;
    }
    flowCurrentMode = actual;
    log("Flow creation mode selected:", actual);
    return true;
  }

  function setAspect() {
    if (!config.aspect) return;
    const btns = findAspectRatioButtons();
    for (const b of btns) {
      const t = (b.textContent || "").trim();
      // 精確比對或包含比對（處理圖示前綴如 "crop_16_9x1"）
      if (t === config.aspect || t.includes(config.aspect)) {
        click(b);
        log("Aspect set to", config.aspect);
        return;
      }
    }
    logOptionCandidates("Aspect not found. Ratio candidates:", btns);
  }

  function setModel() {
    if (!config.model) return;
    // Flow UI 顯示的模型名稱（含 dash）
    const map = {
      "veo3.1-lite": "Veo 3.1 - Lite",
      "veo3.1-lite-low": "Veo 3.1 - Lite",
      "veo3.1-fast": "Veo 3.1 - Fast",
      "veo3.1-quality": "Veo 3.1 - Quality",
      "omni-flash": "Omni Flash",
      "veo2-fast": "Veo 2 - Fast",
      "veo2-quality": "Veo 2 - Quality",
    };
    const label = map[config.model] || config.model;
    // 方法1：嘗試直接 selectByText
    if (selectByText(label)) { log("Model set to", label); return; }
    // 方法2：找面板內的模型下拉選單（含 V 向下箭頭圖示的按鈕）
    const norm = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const targetLower = norm(label);
    // 用 queryAllVisible 搜尋所有可見元素（含 Shadow DOM）
    const allEls = queryAllVisible(document);
    const dropdownTrigger = allEls.find(el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 50 && r.height > 15 && r.height < 80)) return false;
      const t = norm(el.textContent);
      // 含模型名稱（Veo/omni）和速度描述（fast/lite/quality/flash）
      return /veo|omni/.test(t) && /fast|lite|quality|flash/.test(t);
    });
    if (dropdownTrigger) {
      log("[Model] Found dropdown trigger:", (dropdownTrigger.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40));
      click(dropdownTrigger);
      // 等待 dropdown 展開（多層等待）
      return new Promise(resolve => {
        let attempts = 0;
        const maxAttempts = 5;
        const tryFind = () => {
          attempts++;
          const options = queryAllVisible(document).filter(el => {
            const r = el.getBoundingClientRect();
            if (!(r.width > 20 && r.height > 10)) return false;
            const t = norm(el.textContent);
            // 匹配：含 "veo" 和 "lite"（忽略空格/dash/emoji）
            const clean = t.replace(/[\s\-_🎤🔊🎶🎵]/g, " ").trim();
            return clean.includes("veo") && clean.includes("lite");
          });
          if (options.length > 0) {
            // 取最小的元素（最精確的匹配）
            const best = options.sort((a, b) => {
              const ra = a.getBoundingClientRect();
              const rb = b.getBoundingClientRect();
              return (ra.width * ra.height) - (rb.width * rb.height);
            })[0];
            click(best);
            log("Model set to", label, "(from dropdown, attempt", attempts, ")");
            resolve();
          } else if (attempts < maxAttempts) {
            setTimeout(tryFind, 600);
          } else {
            log("Model not found in dropdown:", label, "- available dropdown items:", JSON.stringify(
              queryAllVisible(document).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 20 && r.height > 10 && r.height < 60 &&
                  /veo|omni|flash|lite|fast|quality/i.test(norm(el.textContent));
              }).map(el => norm(el.textContent).slice(0, 30))
            ));
            try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch(e) {}
            resolve();
          }
        };
        setTimeout(tryFind, 1000); // 首次等待1秒
      });
    }
    log("Model not found in UI:", label, "available:", JSON.stringify(optionLabels(15)));
  }

  function setImageModel() {
    if (!config.imageModel) return;
    const map = {
      "nano-banana-pro": "Nano Banana Pro",
      "nano-banana-2": "Nano Banana 2",
      "nano-banana-2-lite": "Nano Banana 2 Lite",
    };
    const label = map[config.imageModel] || config.imageModel;
    // Check if model is already selected — the dropdown trigger button text
    // contains the current model name + "arrow_drop_down"
    const stripEmoji = s => (s || "").replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
    const targetNorm = stripEmoji(label);
    const alreadySelected = queryAllVisible(document).some(el => {
      if (el.tagName !== "BUTTON" && !el.matches?.("[role='button']")) return false;
      const t = stripEmoji(el.textContent || "");
      return t.includes(targetNorm) && /arrow_drop_down|arrow_drop_up/i.test(t);
    });
    if (alreadySelected) {
      log("Image model already selected:", label);
      return;
    }
    if (selectByText(label)) log("Image model set to", label);
    else if (selectByTextContains(label)) log("Image model set to", label, "(fuzzy match)");
    else log("Image model not found in UI:", label);
  }

  function setImageMode() {
    if (!config.imageMode) return;
    const map = { "new": "新圖片", "last": "上一張圖片", "new_image": "新圖片", "last_image": "上一張圖片" };
    const label = map[config.imageMode] || config.imageMode;
    if (selectByText(label)) log("Image mode set to", label);
    else if (selectByTextContains(label)) log("Image mode set to", label, "(fuzzy match)");
    else log("Image mode not found in UI:", label);
  }

  function setOutputs(n) {
    // Flow 面板內的數量按鈕格式為 "x1" 或 "x 1" (有空格)
    if (selectByText(String(n))) { log("Outputs set to", n); return; }
    if (selectByText("x" + n)) { log("Outputs set to", n, "(x" + n + ")"); return; }
    if (selectByText("x " + n)) { log("Outputs set to", n, "(x " + n + ")"); return; }
    // Fallback: 搜尋含數字的按鈕（用 queryAllVisible 含 Shadow DOM）
    const norm = s => (s || "").replace(/\s+/g, "").trim().toLowerCase();
    const target = String(n);
    const btns = queryAllVisible(document).filter(el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      // 排除 sidebar 和角色卡片
      const cls = (el.className || "").toString();
      if (/c4ba2852|16c4830a/.test(cls)) return false;
      return true;
    });
    const hit = btns.find(el => {
      const t = norm(el.textContent);
      return t === target || t === "x" + target || (t.length <= 5 && t.endsWith(target));
    });
    if (hit) { click(hit); log("Outputs set to", n); }
    else { log("Outputs not found:", n, "- available:", JSON.stringify(btns.map(b => norm(b.textContent)).filter(t => /^x?[1-4]$/.test(t)))); }
  }

  function setDuration(sec) {
    const v = String(sec);
    let candidates = [v];
    if (/^(\d+)-merge$/i.test(v)) {
      const base = v.replace(/-merge$/i, "");
      candidates = [base + "秒(合併)", base + "秒 (合併)"];
    } else if (/^\d+$/.test(v)) {
      candidates = [v + "秒"];
    }
    for (const c of candidates) {
      if (selectByText(c)) { log("Duration set to", c); return; }
    }
    // Fallback: 搜尋含秒數的元素（用 queryAllVisible 含 Shadow DOM）
    const norm = s => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const target = String(sec);
    const els = queryAllVisible(document).filter(el => {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      const cls = (el.className || "").toString();
      if (/c4ba2852|16c4830a/.test(cls)) return false; // 排除 sidebar/角色卡片
      return true;
    });
    const hit = els.find(el => {
      const t = norm(el.textContent);
      return t === target + "秒" || t === target || (t.length <= 10 && t.includes(target) && /秒|s|sec/i.test(t));
    });
    if (hit) { click(hit); log("Duration set to", target + "秒 (fallback)"); return; }
    log("Duration not found:", candidates[0], "- 此模型可能不支援時長設定");
  }

  function setGenerationResolution() {
    if (!config.generationRes) return;
    const target = String(config.generationRes).toLowerCase();
    const candidates = queryAllVisible(document).filter(el => {
      if (!el.matches("button, [role='button'], [role='radio'], [role='option']")) return false;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return false;
      const label = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).trim().toLowerCase();
      return new RegExp("(^|\\s)" + target.replace("p", "\\s*p") + "($|\\s)").test(label);
    });
    if (!candidates.length) throw new Error("Flow generation resolution option not found: " + target);
    click(candidates[0]);
    log("Generation resolution set to", target);
  }

  // --------------- Add matched assets via "+" button ---------------
  // Flow 的素材選擇器是單選模式，每次只加入一個素材。
  // 對每個匹配的角色：點 + → 開啟 picker → 點角色 → 點「添加到提示」→ 等待關閉 → 下一個。
  async function tryAddMatchedAssets(text, state = null) {
    const assets = [
      ...charsInText(text).map(name => ({ name, kind: "character" })),
      ...materialsInText(text).map(name => ({ name, kind: "image" })),
    ];
    if (assets.length === 0) {
      log("No character/material names matched in prompt, skipping add-asset step");
      return true;
    }
    let ta = findPromptTextarea();
    if (!ta) return false;
    let taR = ta.getBoundingClientRect();
    // Opening/closing pickers, panels and preview cards re-renders the
    // composer, detaching the editor node and the + button we located
    // earlier. Refresh the editor reference before every asset so the
    // + detection uses live geometry, not detached/stale nodes.
    const refreshEditor = () => {
      const fresh = findPromptTextarea();
      if (fresh) { ta = fresh; taR = fresh.getBoundingClientRect(); return true; }
      return false;
    };
    const pressEscape = () => {
      try { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); } catch (e) { /* ignore */ }
    };
    // Clicking a character tile can leave a *preview card* open — a standalone
    // panel (not matched by pickerSelector) with cancel/close buttons where the
    // character is only added after confirming. Left open between attempts it
    // overlays the composer and turns the + button into an X. Dismiss it.
    const dismissPreviewCard = () => {
      const all = queryAllVisible(document);
      const hasCategories = all.some(el => (el.tagName || "").toUpperCase() === "MAT-LIST-ITEM" &&
        /(?:全部|圖像|图像|角色|上傳的項目|上传的项目)/.test((el.textContent || "")));
      if (hasCategories) return false; // category picker — handled elsewhere
      const cand = all.filter(el => {
        const r = el.getBoundingClientRect();
        if (!(r.width > 20 && r.height > 20)) return false;
        if (r.top < 300 || r.top > 800) return false; // preview cards sit mid-page
        const label = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).replace(/\s+/g, " ").trim();
        return /^(cancel|close|關閉|关闭|取消)(?:\s|$)/i.test(label);
      });
      if (cand.length === 0) return false;
      const btn = cand.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
      click(btn);
      log("Dismissed leftover character preview card");
      return true;
    };
    // Flow shows a "必須輸入提示詞" (prompt required) validation when the
    // composer's internal prompt state is empty even though the DOM still has
    // text — the value we filled was dropped during a picker/panel re-render.
    // Detect it so we can re-fill instead of blindly retrying asset clicks.
    const hasPromptRequiredError = () => {
      try {
        return queryAllVisible(document).some(el => {
          const t = (el.textContent || "").replace(/\s+/g, " ").trim();
          return /^(必須輸入提示詞?|必須輸入提示|提示詞不能為空|請輸入提示詞|prompt is required|enter a prompt)$/i.test(t);
        });
      } catch (e) { return false; }
    };
    const norm = s => (s || "").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    const normAssetName = s => norm(String(s || "").replace(/^@/, "").replace(/\.(png|jpe?g|webp|gif)$/i, ""));
    // A retry must resume at the first unfinished asset. Flow removes an item
    // from the picker after it is added, so selecting all assets again makes a
    // successfully added character look like an error.
    if (state && !(state.addedAssetKeys instanceof Set)) state.addedAssetKeys = new Set();
    const assetKey = asset => asset.kind + ":" + norm(asset.name);
    // Find "+" button near prompt. Re-run before EVERY asset: opening pickers,
    // panels and preview cards re-renders the composer and detaches the old +
    // button node, so a cached reference would click a detached element.
    let plus = null;
    const findPlusButton = async () => {
      refreshEditor();
      // 方法1：向上搜尋父容器內的按鈕
      let node = ta;
      for (let i = 0; node && i < 6; i++) {
        node = node.parentElement;
        if (!node) break;
        const found = Array.from(node.querySelectorAll("button, [role='button']")).find(b => {
          const r = b.getBoundingClientRect();
          if (!(r.width > 0 && r.height > 0)) return false;
          const t = (b.textContent || "").trim();
          const al = (b.getAttribute("aria-label") || "") + " " + (b.getAttribute("title") || "");
          return [t, al.trim()].some(s => /^(\+|add|add_2|新增|添加|加入|attach|添加媒體|添加媒体|add media)$/i.test(s));
        });
        if (found) return found;
      }
      // 方法2：全頁搜尋（含 Shadow DOM），找 prompt 附近的按鈕
      if (!plus) {
        const addRe = /^(\+|add|add_2|添加|新增|加入|attach|添加媒體|添加媒体)$/i;
        const nearbyBtns = queryAllVisible(document).filter(el => {
          const r = el.getBoundingClientRect();
          if (!(r.width > 10 && r.height > 10)) return false;
          // 只找 prompt 附近的按鈕（垂直距離 < 150px）
          if (Math.abs(r.top - taR.top) > 150) return false;
          const t = (el.textContent || "").replace(/\s+/g, " ").trim();
          const al = (el.getAttribute("aria-label") || "") + " " + (el.getAttribute("title") || "");
          return addRe.test(t) || addRe.test(al);
        });
        if (nearbyBtns.length > 0) {
          // 取離 prompt 最近的按鈕
          plus = nearbyBtns.sort((a, b) =>
            Math.abs(a.getBoundingClientRect().top - taR.top) - Math.abs(b.getBoundingClientRect().top - taR.top)
          )[0];
        }
      }
      if (!plus) {
        // A previous picker can remain open after a retry. In that state Flow
        // replaces the composer + icon with close, so dismiss it before looking
        // for + again.
        const allVisible = queryAllVisible(document);
        const pickerOpen = allVisible.some(el => (el.tagName || "").toUpperCase() === "MAT-LIST-ITEM" &&
          /(?:全部|圖像|图像|角色|上傳的項目|上传的项目)/.test((el.textContent || "")));
        const close = pickerOpen && allVisible.filter(el => {
          const r = el.getBoundingClientRect();
          if (!(r.width > 10 && r.height > 10) || Math.abs(r.top - taR.top) > 150) return false;
          const label = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).replace(/\s+/g, " ").trim();
          return /^(close|取消|关闭|關閉)(?:\s|$)/i.test(label);
        }).sort((a, b) => Math.abs(a.getBoundingClientRect().left - taR.left) - Math.abs(b.getBoundingClientRect().left - taR.left))[0];
        if (close) {
          click(close);
          log("Closed stale asset picker before adding assets");
          await sleep(1500);
          // Re-run full + button detection (Method 1 + Method 2) — the
          // 150 px proximity filter in Method 2 alone misses the + button
          // when it sits far below the prompt textarea.
          let p2 = null;
          let n2 = ta;
          for (let i2 = 0; n2 && i2 < 6; i2++) {
            n2 = n2.parentElement;
            if (!n2) break;
            p2 = Array.from(n2.querySelectorAll("button, [role='button']")).find(b => {
              const r = b.getBoundingClientRect();
              if (!(r.width > 0 && r.height > 0)) return false;
              const t = (b.textContent || "").trim();
              const al = (b.getAttribute("aria-label") || "") + " " + (b.getAttribute("title") || "");
              return [t, al.trim()].some(s => /^(\+|add|add_2|新增|添加|加入|attach|添加媒體|添加媒体|add media)$/i.test(s));
            });
            if (p2) break;
          }
          if (!p2) {
            const addRe = /^(\+|add|add_2|添加|新增|加入|attach|添加媒體|添加媒体)$/i;
            p2 = queryAllVisible(document).filter(el => {
              const r = el.getBoundingClientRect();
              if (!(r.width > 10 && r.height > 10) || Math.abs(r.top - taR.top) > 150) return false;
              const label = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).replace(/\s+/g, " ").trim();
              return addRe.test(label);
            }).sort((a, b) => Math.abs(a.getBoundingClientRect().top - taR.top) - Math.abs(b.getBoundingClientRect().top - taR.top))[0] || null;
          }
          plus = p2;
        }
      }
      if (!plus) { log("Add-asset (+) button not found near prompt"); return null; }
      return plus;
    };
    plus = await findPlusButton();
    if (!plus) { log("Add-asset (+) button not found near prompt"); return false; }
    // Helper: find picker container
    const pickerSelector = "dialog, [role='dialog'], [role='menu'], [role='listbox'], [aria-modal='true'], [class*='picker'], [class*='popover'], [class*='modal'], [class*='asset'], [class*='library'], [class*='Picker'], [class*='Popover'], mat-menu, mat-dialog-container";
    const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const pickerItems = "button, [role='tab'], [role='button'], [role='menuitem'], [role='option'], mat-list-item";
    const categoryText = el => (el.textContent || "").replace(/^(?:accessibility_new|image|image_2|photo_library|collections|movie|videocam)\s*/i, "").replace(/\s+/g, " ").trim();
    const categoryRe = /^(角色|characters?|圖像|图像|圖片|图片|images?|media|素材|媒體|媒体|assets?)$/i;
    const categoryCount = el => Array.from(el.querySelectorAll(pickerItems)).filter(b => categoryRe.test(categoryText(b))).length;
    const hasCategories = el => categoryCount(el) > 0;
    function findPicker(previous, previousItems, name) {
      const overlays = Array.from(document.querySelectorAll(pickerSelector))
        .filter(el => visible(el) && !previous.has(el) && !el.closest("nav, header, [role='navigation'], [role='tablist']") &&
          (hasCategories(el) || findCharInPicker(el, name)))
        .sort((a, b) => {
          const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
          return x.width * x.height - y.width * y.height;
        });
      if (overlays.length) return overlays[0];
      // Some Flow versions render + as an ordinary portal, without dialog/picker classes.
      const newCategories = Array.from(document.querySelectorAll(pickerItems))
        .filter(el => visible(el) && !previousItems.has(el) && categoryRe.test(categoryText(el)));
      for (const category of newCategories) {
        let parent = category.parentElement;
        for (let i = 0; parent && parent !== document.body && i < 6; i++, parent = parent.parentElement) {
          if (categoryCount(parent) >= 2 && visible(parent)) return parent;
        }
      }
      // The + menu can show recent named assets directly, without category tabs.
      const newAsset = Array.from(document.querySelectorAll(pickerItems))
        .filter(el => visible(el) && !previousItems.has(el))
        .find(el => normAssetName(categoryText(el).replace(/(?:角色|圖像|图像|圖片|图片)$/, "")) === normAssetName(name));
      if (newAsset) {
        let parent = newAsset.parentElement;
        for (let i = 0; parent && parent !== document.body && i < 5; i++, parent = parent.parentElement) {
          if (visible(parent) && findCharInPicker(parent, name)) return parent;
        }
      }
      return null;
    }
    // Shared confirm-button text matcher
    // Covers picker confirm ("新增至提示詞") and the character-preview-card
    // confirm, whose composer + button relabels to "在提示詞輸入框新增素材".
    const confirmRe = /添加到提示詞?|加入提示詞?|加入到提示|新增至提示詞?|加入至提示詞?|添加至提示詞?|新增到提示|在提示詞(?:輸入框)?新增素材|新增素材(?:至|到|加入)(?:提示|提示詞)|插入(?:至|到)提示詞?|add to prompt|add to scene|insert (?:asset )?(?:into|to) prompt|add asset (?:to|into) prompt/i;
    const confirmExactRe = /^(Done|Confirm|OK|Select|確定|確認|完成|加入|添加)$/i;
    function isConfirmBtn(b) {
      const r = b.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0 && r.width < 600 && r.height < 120)) return false;
      const t = (b.textContent || "").replace(/\s+/g, " ").trim();
      const al = (b.getAttribute("aria-label") || "").trim();
      const ti = (b.getAttribute("title") || "").trim();
      // The composer + becomes "close" while the picker is open. Its aria-label
      // still says "在提示詞輸入框新增素材", but clicking it only closes the picker.
      if (/^(close|關閉|关闭|取消|cancel)(?:\s|$)/i.test(t)) return false;
      // Check textContent, aria-label, and title
      return confirmRe.test(t) || confirmExactRe.test(t) ||
        confirmRe.test(al) || confirmExactRe.test(al) ||
        confirmRe.test(ti) || confirmExactRe.test(ti);
    }
    // Helper: find confirm button inside a specific picker container
    function findConfirmBtn(picker) {
      if (!picker) return null;
      const btns = Array.from(picker.querySelectorAll(
        "button, [role='button'], a, [role='option'], [role='menuitem']"
      )).filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return btns.find(b => isConfirmBtn(b)) || null;
    }
    // Document-level confirm search using queryAllVisible (penetrates Shadow DOM)
    function findConfirmBtnAll() {
      const btns = queryAllVisible(document).filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.width < 600 && r.height < 120;
      });
      return btns.find(b => isConfirmBtn(b)) || null;
    }
    // Helper: find matching character in picker
    function findCharInPicker(picker, name) {
      const nn = normAssetName(name);
      const sameName = value => normAssetName(value) === nn;
      const els = Array.from(picker.querySelectorAll("button, [role='button'], [role='option'], [role='menuitem'], mat-list-item, li"))
        .filter(el => visible(el) && !el.closest("nav, header, [role='navigation'], [role='tablist']"));
      return els.find(el => {
        const labels = [el.getAttribute("aria-label"), el.getAttribute("title"), el.getAttribute("data-name"), el.textContent];
        return labels.some(value => sameName(value) || sameName((value || "").replace(/(?:角色|圖像|图像|圖片|图片)$/, ""))) ||
          Array.from(el.querySelectorAll("span, p, figcaption, img[alt]"))
            .some(child => sameName(child.textContent) || sameName(child.getAttribute("alt")));
      }) || null;
    }
    // Helper: find a standalone preview card that opened after clicking a
    // character. It is NOT matched by pickerSelector (no dialog/role=dialog
    // classes) — detect it by its cancel/close button pair.
    function findPreviewCard() {
      const all = queryAllVisible(document);
      const hasCategories = all.some(el => (el.tagName || "").toUpperCase() === "MAT-LIST-ITEM" &&
        /(?:全部|圖像|图像|角色|上傳的項目|上传的项目)/.test((el.textContent || "")));
      if (hasCategories) return null; // the real picker is open, not a preview
      const cancelBtn = all.find(el => {
        if (!el.matches?.("button, [role='button']")) return false;
        const r = el.getBoundingClientRect();
        if (!(r.width > 20 && r.height > 20)) return false;
        if (r.top < 300 || r.top > 800) return false;
        const label = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).replace(/\s+/g, " ").trim();
        return /^(cancel|關閉|关闭|取消)(?:\s|$)/i.test(label);
      });
      if (!cancelBtn) return null;
      // Walk up to the card container that also contains the character
      let node = cancelBtn;
      for (let i = 0; node && i < 6; i++) {
        node = node.parentElement;
        if (!node || node === document.body) break;
        const r = node.getBoundingClientRect();
        if (r.width > 150 && r.height > 100 && visible(node)) return node;
      }
      return cancelBtn; // fallback: at least the button itself
    }
    function attachmentCount(name) {
      const editor = findPromptTextarea();
      if (!editor) return 0;
      const same = value => normAssetName(value) === normAssetName(name);
      // Broad search: any element in editor that mentions the name
      const nodes = Array.from(editor.querySelectorAll(
        "[contenteditable='false'], [data-type='mention'], [data-type='chip'], [data-mention], " +
        "img[alt], span.chip, span.mention, span.tag, [class*='chip'], [class*='mention'], " +
        "[class*='pill'], [class*='tag'], [class*='attachment']"
      ));
      // Also check parent elements for attachment chips/buttons
      let parent = editor.parentElement;
      for (let i = 0; parent && i < 3; i++, parent = parent.parentElement) {
        nodes.push(...Array.from(parent.querySelectorAll(
          "button, [role='button'], img[alt], [title], [class*='chip'], [class*='mention'], [class*='pill'], [class*='tag']"
        )).filter(el => !editor.contains?.(el)));
      }
      return new Set(nodes.filter(el => [el.getAttribute("title"), el.getAttribute("aria-label"),
        el.getAttribute("alt"), el.getAttribute("data-name"), el.textContent].some(same))).size;
    }
    function composerMediaCount() {
      const editor = findPromptTextarea();
      if (!editor) return 0;
      // Flow renders attached assets as thumbnails beside ProseMirror, not
      // necessarily as children or named chips inside the editable node.
      // Anchor the search to the nearest ancestor with the submit arrow so
      // gallery thumbnails elsewhere on the page cannot count as attachments.
      for (let node = editor.parentElement, hops = 0; node && node !== document.body && hops < 8;
        node = node.parentElement, hops++) {
        const buttons = Array.from(node.querySelectorAll("button, [role='button']"));
        const hasSubmit = buttons.some(b => /arrow_forward|開始生成|开始生成|generate|create/i.test(
          (b.textContent || "") + " " + (b.getAttribute("aria-label") || "")));
        if (!hasSubmit) continue;
        return Array.from(node.querySelectorAll("img, video, canvas, picture"))
          .filter(el => { const r = el.getBoundingClientRect(); return r.width >= 24 && r.height >= 24; }).length;
      }
      return 0;
    }
    // Add each character ONE AT A TIME
    let addedCount = 0;
    for (const { name, kind } of assets) {
      const asset = { name, kind };
      if (state?.addedAssetKeys?.has(assetKey(asset))) {
        log("Asset already added in this prompt, skipping:", name);
        addedCount++;
        continue;
      }
      // Flow can silently clear the prompt while pickers/panels/preview cards
      // open and close (the composer re-renders). An empty prompt then fails
      // asset confirmation with "必須輸入提示詞". Re-fill only when the editor is
      // genuinely empty — after assets land as mention chips the text differs
      // from the original prompt, so a content match would false-positive.
      const edCheck = findPromptTextarea();
      if (edCheck) {
        const cur = (edCheck.textContent || "").replace(/\s+/g, " ").trim();
        if (cur.length === 0) {
          log("[Assets] prompt cleared before adding", name, "— re-filling...");
          setNativeValue(edCheck, cleanPromptText(text));
          await sleep(600);
          verifyPromptFill(edCheck, text);
          refreshEditor();
        }
      }
      // Re-find + before each asset — the composer re-renders between assets
      // (picker/panel/preview open-close cycles), detaching the previous node.
      plus = await findPlusButton();
      // Only dismiss a preview when it actually blocks the + button. A newly
      // attached thumbnail also has a close control; dismissing it here removes
      // the previous asset before the next one is added.
      if (!plus && dismissPreviewCard()) {
        await sleep(800);
        plus = await findPlusButton();
      }
      if (!plus) { log("Add-asset (+) button not found near prompt"); return false; }
      // Click + to open picker
      const attachmentsBefore = attachmentCount(name);
      const mediaBefore = composerMediaCount();
      const editorBefore = findPromptTextarea();
      const editorTextBefore = editorBefore ? editorBefore.textContent : "";
      const editorChildrenBefore = editorBefore ? editorBefore.children.length : 0;
      const previous = new Set(Array.from(document.querySelectorAll(pickerSelector)).filter(visible));
      const previousItems = new Set(Array.from(document.querySelectorAll(pickerItems)).filter(visible));
      click(plus);
      log("Clicked + for asset:", name);
      await sleep(2000);
      const picker = findPicker(previous, previousItems, name);
      if (!picker) {
        const appeared = Array.from(document.querySelectorAll(pickerItems))
          .filter(el => visible(el) && !previousItems.has(el))
          .map(el => categoryText(el).slice(0, 50));
        log("Picker not found for", name, "new items:", JSON.stringify(appeared.slice(0, 30)));
        pressEscape(); return false;
      }
      const tabRe = kind === "image" ? /^(圖像|图像|圖片|图片|images?|media|素材|媒體|媒体|assets?)$/i : /^(角色|characters?)$/i;
      const tab = Array.from(picker.querySelectorAll(pickerItems))
        .find(el => visible(el) && tabRe.test(categoryText(el)));
      if (!tab && !findCharInPicker(picker, name)) {
        log("Picker category not found:", kind); pressEscape(); return false;
      }
      if (tab && tab.getAttribute("aria-selected") !== "true" && tab.getAttribute("aria-pressed") !== "true" &&
          !tab.classList.contains("active") && !tab.classList.contains("selected")) {
        click(tab);
        await sleep(600);
      }
      // Find and click the character — try direct, then scroll, then search
      let hit = findCharInPicker(picker, name);
      if (!hit) {
        // Character may be in a virtualised list — scroll within the picker
        const scrollables = Array.from(picker.querySelectorAll("*")).filter(el => {
          const st = getComputedStyle(el);
          return (st.overflowY === "auto" || st.overflowY === "scroll") &&
                 el.scrollHeight > el.clientHeight + 10;
        });
        for (const sc of scrollables) {
          for (let sAttempt = 0; sAttempt < 15; sAttempt++) {
            sc.scrollTop += sc.clientHeight * 0.7;
            await sleep(300);
            hit = findCharInPicker(picker, name);
            if (hit) break;
            if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 5) break;
          }
          if (hit) break;
          sc.scrollTop = 0;
          await sleep(200);
        }
      }
      if (!hit) {
        // Last resort: try typing the name in a search box inside the picker
        const searchInputs = picker.querySelectorAll ? picker.querySelectorAll("input[type='text'], input[type='search'], input:not([type])") : [];
        const searchInput = searchInputs.length > 0 ? searchInputs[0] : null;
        if (searchInput) {
          log("Trying search for asset:", name);
          searchInput.focus();
          searchInput.value = name;
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
          await sleep(800);
          hit = findCharInPicker(picker, name);
        }
      }
      if (!hit) {
        log("Asset not found in picker:", name);
        pressEscape();
        if (dismissPreviewCard()) { await sleep(600); refreshEditor(); }
        return false;
      }
      click(hit);
      log("Selected asset:", name);
      await sleep(1000);

      // === Check picker state after character selection ===
      const pickerInDoc = picker && document.body.contains(picker) && visible(picker);
      const liveDialogs = Array.from(document.querySelectorAll(pickerSelector)).filter(visible);
      const editorAfter = findPromptTextarea();
      const editorTextAfter = editorAfter ? editorAfter.textContent : "";
      const editorChildrenAfter = editorAfter ? editorAfter.children.length : 0;
      const textChanged = editorTextAfter !== editorTextBefore;
      const childrenChanged = editorChildrenAfter !== editorChildrenBefore;
      const attachAfter = attachmentCount(name);
      log("[Diag] picker in DOM:", pickerInDoc, "dialogs:", liveDialogs.length,
          "textChanged:", textChanged, "childrenChanged:", childrenChanged,
          "attach:", attachAfter, "vs before:", attachmentsBefore);

      // "必須輸入提示詞" (prompt required) → the composer's internal prompt
      // state is empty; further clicks will keep failing. Re-fill the prompt
      // and hand the failure back so the caller retries — assets already
      // recorded in addedAssetKeys are skipped on that retry.
      if (hasPromptRequiredError()) {
        log("[Assets] '必須輸入提示詞' after selecting", name, "— prompt lost, re-filling and retrying");
        pressEscape();
        await sleep(400);
        const edRefill = findPromptTextarea();
        if (edRefill) {
          setNativeValue(edRefill, cleanPromptText(text));
          await sleep(500);
          verifyPromptFill(edRefill, text);
        }
        dismissPreviewCard();
        refreshEditor();
        return false;
      }

      // === FAST PATH: picker closed after character click ===
      // Google Flow's picker often closes immediately after clicking a character.
      // Two sub-cases:
      //  (a) the character was added directly → editor content changed → success
      //  (b) a standalone PREVIEW CARD opened (cancel/close buttons, not matched
      //      by pickerSelector) where the character is added only after a second
      //      click. Detect (b) and drive the confirm step.
      if (!pickerInDoc && liveDialogs.length === 0) {
        if (attachAfter > attachmentsBefore || textChanged || childrenChanged || composerMediaCount() > mediaBefore) {
          log("Asset added directly (picker closed, editor changed):", name);
          addedCount++;
          state?.addedAssetKeys?.add(assetKey(asset));
          await sleep(1000);
          continue;
        }
        // Sub-case (b): a preview card with cancel/close buttons appeared.
        // Find its confirm button (add-to-prompt style) or re-click the
        // character thumbnail inside the preview.
        const previewCard = findPreviewCard();
        if (previewCard) {
          log("[Preview] card opened for", name, "— looking for confirm step");
          const pvBtns = Array.from(previewCard.querySelectorAll("button, [role='button'], a"))
            .filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
          log("[Preview] buttons (" + pvBtns.length + "):", pvBtns.map(b => {
            const r = b.getBoundingClientRect();
            const t = (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 20);
            const al = (b.getAttribute("aria-label") || "").slice(0, 20);
            return `"${t}" al="${al}" ${Math.round(r.width)}x${Math.round(r.height)} d=${b.disabled}`;
          }).slice(0, 12).join(" | "));
          // Try confirm button first
          let pvConfirm = pvBtns.find(b => isConfirmBtn(b));
          // Then try clicking the character thumbnail/name inside the preview
          let addedViaPreview = false;
          const pvLanded = () => {
            const ed = findPromptTextarea();
            return attachmentCount(name) > attachmentsBefore ||
              composerMediaCount() > mediaBefore ||
              (ed ? ed.textContent || "" : "") !== editorTextBefore ||
              (ed ? ed.children.length : 0) !== editorChildrenBefore;
          };
          if (pvConfirm && !pvConfirm.disabled && pvConfirm.getAttribute("aria-disabled") !== "true") {
            click(pvConfirm);
            log("[Preview] clicked confirm:", (pvConfirm.textContent || "").trim().slice(0, 20),
                "al:", (pvConfirm.getAttribute("aria-label") || "").slice(0, 24));
            await sleep(1500);
            addedViaPreview = pvLanded();
          }
          if (!addedViaPreview) {
            const pvHit = findCharInPicker(previewCard, name);
            if (pvHit) {
              click(pvHit);
              log("[Preview] re-clicked character in preview card:", name);
              await sleep(1500);
              addedViaPreview = pvLanded();
            }
          }
          if (addedViaPreview) {
            log("Asset added via preview card:", name);
            addedCount++;
            state?.addedAssetKeys?.add(assetKey(asset));
            await sleep(800);
            refreshEditor();
            continue;
          }
          log("[Preview] could not add via preview card for", name);
          dismissPreviewCard();
          await sleep(500);
          refreshEditor();
          return false;
        }
        log("Picker closed but no editor change and no preview card, retrying...", name);
      }

      // === Diagnostic: dump picker buttons (only if picker still visible) ===
      for (let di = 0; di < Math.min(liveDialogs.length, 3); di++) {
        const dlg = liveDialogs[di];
        const dlgBtns = Array.from(dlg.querySelectorAll("button, [role='button'], a, [role='option'], mat-list-item, li, span, div"))
          .filter(b => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (b.textContent || "").trim().length > 0 && (b.textContent || "").trim().length <= 20;
          });
        const btnInfo = dlgBtns.map(b => {
          const r = b.getBoundingClientRect();
          const t = (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 25);
          const al = (b.getAttribute("aria-label") || "").slice(0, 25);
          return `<${b.tagName}>"${t}" al="${al}" ${Math.round(r.width)}x${Math.round(r.height)} d=${b.disabled}`;
        });
        if (btnInfo.length > 0)
          log("[Diag] Dlg" + di + " btns (" + btnInfo.length + "):", btnInfo.slice(0, 20).join(" | "));
      }

      // === SLOW PATH: picker still open → search for confirm button ===
      // CRITICAL: re-find the picker each attempt — Angular may re-render
      // the dialog after character click, making the old `picker` ref stale.
      let confirmBtn = null;
      if (pickerInDoc || liveDialogs.length > 0) {
        for (let cAttempt = 0; cAttempt < 6; cAttempt++) {
          let rePicked = null;
          if (cAttempt === 0 && pickerInDoc) rePicked = picker;
          if (!rePicked) {
            const curDialogs = Array.from(document.querySelectorAll(pickerSelector)).filter(visible);
            if (curDialogs.length > 0) rePicked = curDialogs[curDialogs.length - 1];
          }
          if (!rePicked) rePicked = findPicker(previous, previousItems, name);
          confirmBtn = (rePicked && findConfirmBtn(rePicked)) || findConfirmBtnAll();
          if (confirmBtn && !confirmBtn.disabled && confirmBtn.getAttribute("aria-disabled") !== "true") break;
          if (confirmBtn && (confirmBtn.disabled || confirmBtn.getAttribute("aria-disabled") === "true")) {
            log("Confirm button found but disabled, waiting...", name);
            await sleep(600);
            continue;
          }
          confirmBtn = null;
          await sleep(500);
        }
      }
      if (confirmBtn && !confirmBtn.disabled && confirmBtn.getAttribute("aria-disabled") !== "true") {
        const btnLabel = ((confirmBtn.textContent || "") + " " + (confirmBtn.getAttribute("aria-label") || "")).replace(/\s+/g, " ").trim().slice(0, 30);
        click(confirmBtn);
        log("Confirmed adding:", name, "(btn: \"" + btnLabel + "\")");
        await sleep(1200);
        // Verify the asset actually landed in the editor. A confirm click that
        // changes nothing may have hit the wrong button (or the composer lost
        // the prompt) — recording it as added would make the retry skip it and
        // silently produce a prompt missing the asset.
        if (hasPromptRequiredError()) {
          log("[Assets] '必須輸入提示詞' after confirm for", name, "— prompt lost");
          const edRefill = findPromptTextarea();
          if (edRefill) { setNativeValue(edRefill, cleanPromptText(text)); await sleep(500); }
          dismissPreviewCard();
          refreshEditor();
          return false;
        }
        let edVerify, textAfterConfirm, childrenAfterConfirm, attachAfterConfirm, mediaAfterConfirm;
        for (let verifyAttempt = 0; verifyAttempt < 8; verifyAttempt++) {
          edVerify = findPromptTextarea();
          textAfterConfirm = edVerify ? edVerify.textContent : "";
          childrenAfterConfirm = edVerify ? edVerify.children.length : 0;
          attachAfterConfirm = attachmentCount(name);
          mediaAfterConfirm = composerMediaCount();
          if (attachAfterConfirm > attachmentsBefore || mediaAfterConfirm > mediaBefore ||
              textAfterConfirm !== editorTextBefore || childrenAfterConfirm !== editorChildrenBefore) break;
          if (verifyAttempt < 7) await sleep(400);
        }
        // The picker closing alone is not proof: Flow also closes it when the
        // composer X is clicked without attaching anything.
        const landed = attachAfterConfirm > attachmentsBefore ||
          mediaAfterConfirm > mediaBefore ||
          textAfterConfirm !== editorTextBefore ||
          childrenAfterConfirm !== editorChildrenBefore;
        log("[Assets] confirm result:", name, "attach:", attachAfterConfirm,
          "vs before:", attachmentsBefore, "textChanged:", textAfterConfirm !== editorTextBefore,
          "childrenChanged:", childrenAfterConfirm !== editorChildrenBefore,
          "composerMedia:", mediaAfterConfirm, "vs before:", mediaBefore);
        if (landed) {
          addedCount++;
          state?.addedAssetKeys?.add(assetKey(asset));
        } else {
          log("[Assets] confirm clicked but editor unchanged for", name, "— not recording as added");
          dismissPreviewCard();
          refreshEditor();
          return false;
        }
      } else if (attachAfter > attachmentsBefore || textChanged || childrenChanged || composerMediaCount() > mediaBefore) {
        log("Asset added (content changed after click):", name);
        addedCount++;
        state?.addedAssetKeys?.add(assetKey(asset));
      } else {
        // Last resort: try pressing Enter to confirm (some Flow pickers use keyboard)
        log("Trying Enter key as confirm fallback for", name);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true, cancelable: true }));
        await sleep(1500);
        const editorAfterEnter = findPromptTextarea();
        const textChangedAfterEnter = editorAfterEnter ? editorAfterEnter.textContent !== editorTextBefore : false;
        if (attachmentCount(name) > attachmentsBefore || composerMediaCount() > mediaBefore || textChangedAfterEnter) {
          log("Asset added via Enter key for", name);
          addedCount++;
          state?.addedAssetKeys?.add(assetKey(asset));
        } else {
          log("Confirm button not found for", name);
          pressEscape();
          // A preview card (not matched by pickerSelector) may still be open
          // on top of the composer — dismiss it so the next retry is clean.
          if (dismissPreviewCard()) { await sleep(600); refreshEditor(); }
          return false;
        }
      }
      await sleep(1000); // Wait for picker to close and prompt to update
    }
    log("Assets added:", addedCount, "of", assets.length);
    return addedCount === assets.length;
  }

  // Frame handling
  function getFramesForPrompt(index) {
    const frames = config.frames || [];
    const total = frames.length;
    const perPrompt = Math.max(1, Math.ceil(total / queue.length));
    if (config.frameOption === "first") return total > 0 ? [frames[0]] : [];
    if (config.frameOption === "firstLast") {
      if (total === 0) return [];
      if (total === 1) return [frames[0]];
      return [frames[0], frames[total - 1]];
    }
    return frames.slice(index * perPrompt, (index + 1) * perPrompt);
  }

  // Auto character / voice
  function tryAutoCharacter(text) {
    if (!config.charEnabled) return;
    log("Auto character requested for:", text.slice(0, 50));
    const matched = charsInText(text);
    const names = matched.length > 0 ? matched : (config.defaultChar ? [config.defaultChar] : []);
    if (names.length === 0) {
      log("No character matched and no default character set, skipping");
      return;
    }
    for (const name of names) {
      if (selectCharacter(name)) {
        log("Character selected:", name);
        return;
      }
    }
    log("Character not found in UI:", names.join(", "));
  }

  function selectCharacter(name) {
    const nn = (name || "").trim();
    if (!nn) return false;
    const nnorm = nn.replace(/_/g, " ").toLowerCase();
    const normText = (s) => (s || "").replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    // 導航元素絕對不點：側欄分頁/頂欄按鈕一點就跳頁，批次直接全崩
    const inNav = (el) => {
      let n = el;
      for (let i = 0; n && i < 8; i++, n = n.parentElement) {
        if (!n || n === document.body) break;
        const t = (n.tagName || "").toUpperCase();
        const r = (n.getAttribute && n.getAttribute("role")) || "";
        if (t === "NAV" || t === "HEADER" || /^(tab|option)$/i.test(r) || /navigation|banner|tablist|menubar/i.test(r)) return true;
      }
      return false;
    };
    const hit = (s) => {
      const t = normText(s);
      if (!t) return false;
      if (t === nnorm) return true;
      return t.split(/[\s,，、;；|\\/]+/).includes(nnorm);
    };
    const leaves = Array.from(document.querySelectorAll("span, div, p, a, button, li, figcaption"))
      .filter(el => el.children.length === 0);
    for (const el of leaves) {
      if (inNav(el)) continue;
      if (normText(el.textContent) === nnorm) {
        if (click(el)) { log("Character text clicked:", nn); return true; }
      }
    }
    const cards = [];
    for (const img of Array.from(document.querySelectorAll("img[src]"))) {
      let node = img;
      for (let i = 0; node && i < 8; i++) {
        node = node.parentElement;
        if (!node) break;
        const tag = (node.tagName || "").toUpperCase();
        if (tag === "BUTTON" || tag === "A" || tag === "FIGURE" || tag === "LI" || tag === "DIV") {
          if (hit(node.textContent)) cards.push(node);
        }
      }
    }
    cards.sort((a, b) => ((a.textContent || "").length - (b.textContent || "").length));
    for (const card of cards) {
      if (inNav(card)) continue;
      if (click(card)) { log("Character card clicked:", nn); return true; }
    }
    for (const el of Array.from(document.querySelectorAll("button, [role='button'], [role='option'], li, a"))) {
      if (inNav(el)) continue;
      if (normText(el.textContent) === nnorm) {
        if (click(el)) { log("Character option clicked:", nn); return true; }
      }
    }
    return false;
  }

  function isVoiceDisabledForPrompt(text) { return /\[NOVOICE\]/i.test(text || ""); }
  function cleanPromptText(text) { return (text || "").replace(/\[NOVOICE\]\s*/i, ""); }
  function tryAutoVoice(text) {
    if (!config.voiceEnabled) return;
    if (isVoiceDisabledForPrompt(text)) { log("[NOVOICE] tag found: skipping voice selection"); return; }
    log("Auto voice requested for:", text.slice(0, 50));
    const matched = voiceNamesInText(text);
    const target = matched.length > 0 ? matched[0] : (config.defaultVoice || "");
    if (!target) { log("No voice matched and no default voice configured, skipping"); return; }
    const gender = voiceGender(target);
    const label = gender ? target + " - " + gender : target;
    if (selectByText(label)) { log("Voice selected:", label); return; }
    if (selectByText(target)) { log("Voice selected:", target); } else { log("Voice not found in UI:", label); }
  }
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
  function voiceGender(name) {
    const v = VOICES.find(x => x.name === name);
    return v ? (v.gender === "male" ? "男" : "女") : "";
  }
  function voiceNamesInText(text) {
    const p = normBase(text);
    const allNames = VOICES.map(v => v.name);
    return allNames.filter(n => charHitInContext(p, normBase(n), allNames) || tokensSubset(normBase(n), p));
  }

  // Auto-add character images
  function normBase(s) {
    return (s || "").replace(/_/g, " ").toLowerCase();
  }
  function tokens(s) {
    const parts = ((s || "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff]+/g, " ")
      .split(/\s+/)
      .filter(Boolean));
    return parts;
  }
  function charHitInContext(p, nn, allNames) {
    if (!nn || !p.includes(nn)) return false;
    const isCJK = /[\u4e00-\u9fff]/.test(nn);
    const others = allNames.map(m => normBase(m)).filter(m => m && m !== nn && m.includes(nn));
    const occs = [];
    let idx = p.indexOf(nn);
    while (idx !== -1) {
      const before = idx > 0 ? p[idx - 1] : null;
      const after = idx + nn.length < p.length ? p[idx + nn.length] : null;
      let absorbed = false;
      const isWordChar = ch => ch !== null && /[\w\u4e00-\u9fff]/.test(ch);
      if (isCJK) {
        if (isWordChar(before) || isWordChar(after)) {
          absorbed = others.length > 0 && others.some(m => p.includes(m));
        }
      } else {
        if (isWordChar(before) || isWordChar(after)) { absorbed = true; }
      }
      occs.push(!absorbed);
      idx = p.indexOf(nn, idx + 1);
    }
    return occs.some(hit => hit);
  }
  function markedNameInText(text, name) {
    const prompt = normBase(text);
    const target = normBase(name).replace(/\.(png|jpe?g|webp|gif)$/i, "").trim();
    if (!target) return false;
    let at = prompt.indexOf("@");
    while (at >= 0) {
      const rest = prompt.slice(at + 1).trimStart();
      if (rest.startsWith(target)) {
        const next = rest[target.length] || "";
        if (!/[a-z0-9_]/i.test(next)) return true;
      }
      at = prompt.indexOf("@", at + 1);
    }
    return false;
  }
  function charsInText(text) {
    if (!config.charEnabled) return [];
    const p = normBase(text);
    const pool = (config.charSelected && config.charSelected.length > 0)
      ? config.charSelected
      : (config.charNames || []);
    const allNames = pool.map(n => (n || "").trim()).filter(Boolean);
    return allNames
      .map(n => (n || "").trim())
      .filter(n => {
        const nn = normBase(n);
        if (!nn) return false;
        return text.includes("@") ? markedNameInText(text, n) :
          (charHitInContext(p, nn, allNames) || tokensSubset(nn, p) || tokensSubset(n, text));
      });
  }
  function tokensSubset(a, b) {
    const ta = tokens(a);
    const tb = tokens(b);
    if (ta.length === 0 || tb.length === 0 || ta.length > tb.length) return false;
    for (let i = 0; i <= tb.length - ta.length; i++) {
      let ok = true;
      for (let j = 0; j < ta.length; j++) {
        if (tb[i + j] !== ta[j]) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }
  // 素材名單比對：一般文字匹配由開關控制；使用 @檔名 是明確指令，
  // 只要已有掃描名單就必須加入對應圖像。
  function materialsInText(text) {
    const hasExplicitAsset = /@[A-Za-z0-9_\-\u4e00-\u9fff]/.test(text || "");
    if (!config.materialEnabled && !hasExplicitAsset) return [];
    const p = normBase(text);
    // 自動模式使用圖像庫掃描到的全部名稱；舊的手動勾選不得縮小搜尋範圍。
    const pool = config.materialNames || [];
    const allNames = pool.map(n => (n || "").trim()).filter(Boolean);
    return allNames
      .map(n => (n || "").trim())
      .filter(n => {
        const nn = normBase(n);
        if (!nn) return false;
        return text.includes("@") ? markedNameInText(text, n) :
          (charHitInContext(p, nn, allNames) || tokensSubset(nn, p) || tokensSubset(n, text));
      });
  }
  // 角色＋素材聯集（去重），+ picker 加入與檔名配圖共用
  function charsAndMaterialsInText(text) {
    const seen = new Set();
    return charsInText(text).concat(materialsInText(text)).filter(n => {
      const k = normBase(n);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  function charMatched(fileName, names) {
    const base = normBase((fileName || '').replace(/\.[^.]+$/, ""));
    if (!base) return false;
    const allKnown = ((config && config.charNames) || []).map(m => normBase(m)).filter(Boolean);
    const allNorm = allKnown.length > 0 ? allKnown : names.map(m => normBase(m)).filter(Boolean);
    return names.some(n => {
      const nn = normBase(n);
      if (!nn) return false;
      const tb = tokens(base);
      const ta = tokens(nn);
      if (ta.length === 0 || tb.length === 0 || ta.length > tb.length) return false;
      for (let i = 0; i <= tb.length - ta.length; i++) {
        let ok = true;
        for (let j = 0; j < ta.length; j++) {
          if (tb[i + j] !== ta[j]) { ok = false; break; }
        }
        if (!ok) continue;
        const others = allNorm.filter(m => m !== nn && m.includes(nn));
        let absorbed = false;
        if (others.length > 0) {
          for (const m of others) {
            const tm = tokens(m);
            if (tm.length <= ta.length) continue;
            if (i - (tm.length - ta.length) >= 0) {
              let ext = true;
              for (let k = 0; k < tm.length; k++) {
                if (tb[i - (tm.length - ta.length) + k] !== tm[k]) { ext = false; break; }
              }
              if (ext) { absorbed = true; break; }
            }
            if (i + ta.length + (tm.length - ta.length) <= tb.length) {
              let ext = true;
              for (let k = 0; k < tm.length; k++) {
                if (tb[i + k] !== tm[k]) { ext = false; break; }
              }
              if (ext) { absorbed = true; break; }
            }
          }
        }
        if (!absorbed) return true;
      }
      return false;
    });
  }
  function tryAutoCharImages(text, promptFiles) {
    if (!config.charImageEnabled) return [];
    const textChars = charsAndMaterialsInText(text);
    if (textChars.length === 0) return [];
    const pool = (promptFiles || []).filter(Boolean);
    const seen = new Set();
    const picked = [];
    for (const ch of textChars) {
      const poolHits = pool.filter(f => charMatched(f.name, [ch]));
      const hits = poolHits.length > 0 ? poolHits : (config.frames || []).filter(f => charMatched(f.name, [ch]));
      hits.forEach(f => { if (!seen.has(f.name)) { seen.add(f.name); picked.push(f); } });
    }
    if (picked.length > 0) { log("Char images matched:", picked.map(p => p.name).join(", ")); }
    return picked;
  }

  // Track generation progress & download
  let observedNodes = null;
  const downloadUrls = new Set();
  function snapshotMedia() {
    return new Set(Array.from(document.querySelectorAll("video, img")).map(m => m.src || m.currentSrc));
  }
  let mediaBefore = snapshotMedia();

  function shouldDownloadMedia(url, el) {
    if (!url) return false;
    if (/redirect|getMediaUrl|avatar|profile|icon|emoji|placeholder/i.test(url)) return false;
    if (/=(?:s|w|h)\d{1,4}(?:-c)?([?&]|$)/i.test(url)) return false;
    const u = url.split("?")[0];
    if (el && el.tagName === "VIDEO") {
      if (/^blob:/i.test(url)) return true;
      if (el.videoWidth > 0 && el.duration > 0) return true;
      return false;
    }
    if (/\.(png|jpe?g|webp|gif)$/i.test(u)) {
      const w = (el && (el.naturalWidth || el.width)) || 0;
      if (w >= 200) return true;
    }
    return false;
  }

  function observeResults(item) {
    const observer = new MutationObserver(() => {
      document.querySelectorAll("video, img").forEach(media => {
        const url = media.src || media.currentSrc;
        if (!url || downloadUrls.has(url)) return;
        if (!shouldDownloadMedia(url, media)) return;
        downloadUrls.add(url);
        autoDownload(url, item);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function autoDownload(url, item) {
    const isImage = /\.(png|jpg|jpeg|webp)$/i.test(url.split("?")[0]) || /image/i.test(item.text || "");
    const targetRes = isImage ? (config.imageRes || "2k").toLowerCase() : (config.videoRes || "1080p").toLowerCase();
    const skip = isImage && targetRes === "none";
    if (skip) { log("Image download skipped (configured: none)"); return; }
    let finalUrl = await trySelectResolution(url, isImage, targetRes);
    const folder = config.folder || "veo-folder-1";
    const safeFolder = folder.replace(/[\\/:*?"<>|]/g, "_").trim() || "veo-folder-1";
    let filename = (finalUrl || url).split("/").pop().split("?")[0] || `flow-${item.id}`;
    if (config.rename) {
      const ext = filename.split(".").pop() || (isImage ? "png" : "mp4");
      filename = `${safeFolder}/${item.id + 1}.${ext}`;
    } else {
      filename = `${safeFolder}/${filename}`;
    }
    try {
      await fetch(finalUrl || url)
        .then(r => r.blob())
        .then(blob => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.dataset.download = "true";
          a.click();
          URL.revokeObjectURL(a.href);
          log("Downloaded:", filename);
        });
    } catch (e) { log("Download failed:", e.message); }
  }

  async function trySelectResolution(url, isImage, res) {
    const candidates = document.querySelectorAll(
      "[role=menuitem], [role=option], button[aria-haspopup], [class*='quality'], [class*='res']"
    );
    const norm2 = (s) => String(s || "").toLowerCase().trim();
    for (const el of candidates) {
      const label = norm2(el.getAttribute("aria-label") || el.textContent);
      if (!label) continue;
      const isMatch = (!isImage && (label === res || label.startsWith(res))) ||
        (isImage && (label === res || label === res + " resolution"));
      if (isMatch && !/disabled/i.test(el.getAttribute("aria-disabled") || "")) {
        try { el.click(); log("Resolution option clicked:", res); await sleep(800); return url; } catch (e) {}
        break;
      }
    }
    if (/size=|resolution=|quality=/.test(url)) {
      const key = /size=/.test(url) ? "size" : /resolution=/.test(url) ? "resolution" : "quality";
      const replaced = url.replace(new RegExp(`([?&]${key}=)[^&]*`), `$1${encodeURIComponent(res)}`);
      if (replaced !== url) return replaced;
    }
    return url;
  }

  // Main batch loop
  async function runBatch() {
    log("Starting batch:", queue.length, "prompts, concurrency:", config.concurrency);
    log("[Config] mode=", config.mode, "aspect=", config.aspect, "model=", config.model,
      "imageModel=", config.imageModel, "outputCount=", config.outputCount, "duration=", config.duration,
      "charEnabled=", config.charEnabled, "defaultChar=", config.defaultChar,
      "charNames=", JSON.stringify(config.charNames || []),
      "charSelected=", JSON.stringify(config.charSelected || []),
      "materialEnabled=", config.materialEnabled,
      "materialNames=", JSON.stringify(config.materialNames || []),
      "materialSelected=", JSON.stringify(config.materialSelected || []));
    if (config.chainEnabled) {
      log("Chain Prompt enabled — processing sequentially, each item uses the previous video's last frame.");
    }

    const worker = async () => {
      while (queue.length > 0 && !stopped) {
        const item = queue.shift();
        if (!item) break;
        const res = await processOneWithRetry(item);
        if (res.ok) { reportItemStatus(item.id, "done"); }
        else { logError("Error on item", item.id, res.err); reportItemStatus(item.id, "error"); }
        if (queue.length > 0) await sleep(randWait() * 1000);
      }
    };

    const resumeIndex = config.resumeIndex || 0;
    if (resumeIndex > 0 && queue.length > resumeIndex) {
      log("Resuming: skipping", resumeIndex, "completed segments");
      queue.splice(0, resumeIndex);
    }

    const workers = Array.from(
      { length: Math.min(config.concurrency || 1, queue.length) },
      () => worker()
    );
    await Promise.all(workers);
    log("Batch finished, stopped:", stopped);
    stopped = false;
  }

  // Process one prompt
  async function processOne(item) {
    if (stopped) throw new Error("stopped");
    reportItemStatus(item.id, "running");
    mediaBefore = snapshotMedia();
    // Diagnostics on first item
    if (item.id === 0) {
      log("[Config] mode=", config.mode, "aspect=", config.aspect, "model=", config.model,
        "outputCount=", config.outputCount, "duration=", config.duration,
        "charEnabled=", config.charEnabled, "charNames=", JSON.stringify(config.charNames || []),
        "charSelected=", JSON.stringify(config.charSelected || []),
        "isImageMode=", (config.mode === "text2image" || config.mode === "image2image"));
      dumpPageElements();
      validateAndFixMode();
      if (config.charEnabled && !(config.charNames || []).length) autoScanCharacters();
      if (!(config.materialNames || []).length) autoScanMaterials();
      log("[After-fix] mode=", config.mode, "charNames=", JSON.stringify(config.charNames), "materialNames=", JSON.stringify(config.materialNames || []));
      // 警示：如果 config 有影片設定（model/aspect/duration）但模式是圖片，提示使用者
      const isImageMode = config.mode === "text2image" || config.mode === "image2image";
      if (isImageMode && (config.model || config.aspect || config.duration)) {
        log("[⚠️ WARNING] config.mode=" + config.mode + " 但有影片設定 (model=" + config.model + ", aspect=" + config.aspect + ", duration=" + config.duration + ")." +
          "如要生成影片，請在擴充功能面板切換為「文字轉影片」模式。");
      }
    }

    // Chain mode
    if (config.chainEnabled && config.mode === "frame2video") {
      if (chainLastFrame) {
        log("Chain: uploading last frame for item", item.id);
        const ok = await uploadFrames([chainLastFrame]);
        if (!ok) throw new Error("chain frame upload failed");
        chainLastFrame = null;
      } else if (resumeFrameFile) {
        log("Chain resume: uploading saved last frame for item", item.id);
        const ok = await uploadFrames([resumeFrameFile]);
        if (!ok) throw new Error("chain frame upload failed");
        resumeFrameFile = null;
      }
    }

    // Upload frames (non-chain)
    if (config.mode === "frame2video" && !config.chainEnabled) {
      const frames = getFramesForPrompt(item.id);
      if (frames.length > 0) {
        const ok = await uploadFrames(frames);
        if (!ok) throw new Error("frame upload failed");
      }
    }

    // Image-based modes
    const maxImages = Math.max(1, Math.min(10, parseInt(config.maxImages) || 2));
    let sliced = [];
    if (config.mode !== "frame2video" && config.mode !== "text2video" && config.mode !== "text2image") {
      const batch = config.frames || [];
      sliced = batch.slice(item.id * maxImages, (item.id + 1) * maxImages);
    }
    const charPicks = tryAutoCharImages(item.text, sliced);
    const uploadBatch = charPicks.length > 0 ? charPicks : sliced;
    if (uploadBatch.length > 0) {
      const ok = await uploadFrames(uploadBatch);
      if (!ok) throw new Error("input image upload failed");
    }

    // Fill prompt
    const textarea = findPromptTextarea();
    if (!textarea) throw new Error("prompt textarea not found");
    log("Prompt input:", textarea.tagName, "ce=" + textarea.isContentEditable, "placeholder=" + JSON.stringify(textarea.getAttribute("placeholder") || ""));
    textarea.focus();
    await sleep(200);
    setNativeValue(textarea, cleanPromptText(item.text));
    await sleep(500);
    verifyPromptFill(textarea, item.text);

    // Auto character / voice
    // 角色和圖像都只能經由提示詞旁的 + 選擇器加入；直接點頁面角色卡會切到角色生成頁。
    log("Characters and images will be added through the prompt (+) picker");
    tryAutoVoice(item.text);

    // Set options
    await sleep(800);
    const isImageMode = config.mode === "text2image" || config.mode === "image2image";
    // 點擊模型選擇器按鈕開啟設定面板（如 "🍌 Nano Banana 2..."）
    let panelOpened = await openModelPanel();
    if (panelOpened) {
      // 面板已開啟：等待渲染後再 dump
      await sleep(1000);
      dumpPanelElements();
      // 每筆提示詞重新讀取 Flow 當前模式；未知模式也必須明確選擇目標選項。
      const targetMode = isImageMode ? "image" : "video";
      const modeBefore = detectFlowMode();
      if (!await ensureOutputMode(targetMode)) throw new Error("Flow output mode could not be selected: " + targetMode);
      // Switching creation type often dismisses the settings popover. Reopen it
      // before touching model, ratio, and output controls.
      if (modeBefore !== targetMode) {
        const outputOptions = queryAllVisible(document).some(el => /^x[1-4]$/i.test((el.textContent || "").trim()));
        if (!outputOptions) {
          panelOpened = await openModelPanel();
          if (!panelOpened) throw new Error("Flow settings panel did not reopen after mode switch");
        }
      }
      dumpPanelElements();
      // 切換子頁籤：text2video → 素材，frame2video → 帧
      if (!isImageMode && panelOpened) {
        const subTabRe = config.mode === "frame2video"
          ? /帧|frame/i
          : /素材|material|asset/i;
        const subTabs = queryAllVisible(document).filter(el => {
          const r = el.getBoundingClientRect();
          if (!(r.width > 30 && r.height > 15 && r.width < 200)) return false;
          const t = (el.textContent || "").trim();
          // 排除模型/比例/數量按鈕
          if (/crop_|x[1-4]|Nano|Veo|🍌|720|1080|arrow_drop/.test(t)) return false;
          // 長度限制放寬（"chrome_extension素材" = 18 chars）
          if (t.length > 25) return false;
          return subTabRe.test(t);
        });
        if (subTabs.length > 0) {
          // 檢查是否已選中（aria-pressed/selected 或 active class）
          const alreadyActive = subTabs.some(el =>
            el.getAttribute("aria-pressed") === "true" ||
            el.getAttribute("aria-selected") === "true" ||
            el.classList.contains("active") || el.classList.contains("selected")
          );
          if (!alreadyActive) {
            click(subTabs[0]);
            log("Panel: switched to sub-tab:", (subTabs[0].textContent || "").trim());
            await sleep(1000);
          } else {
            log("Panel: sub-tab already correct:", (subTabs[0].textContent || "").trim());
          }
        }
      }
    } else {
      if (!await ensureOutputMode(isImageMode ? "image" : "video")) {
        throw new Error("Flow output mode could not be selected");
      }
    }
    // 先設定面板選項（比例、模型、數量、時長）
    await sleep(400);
    setAspect();
    await sleep(300);
    if (isImageMode) {
      if (config.imageModel) setImageModel();
      await sleep(300);
      if (config.imageMode) setImageMode();
      await sleep(300);
    } else {
      await setModel();
      await sleep(300);
      setGenerationResolution();
      await sleep(300);
    }
    if (!isImageMode) {
      const sec = (item && item.duration) || config.duration;
      if (sec) setDuration(sec);
      await sleep(500);
    }
    setOutputs(parseInt(config.outputCount) || 1);
    await sleep(300);
    if (isImageMode && panelOpened) {
      // 圖片模式：選項設完後把設定面板收起，還原底部提示詞列版面，
      // 否則面板擋住＋號鍵/送出鍵，後面步驟會對空氣操作
      click(panelOpened);
      await sleep(800);
      log("[Panel] closed after setting options (image mode)");
    }
    // 面板選項設定完成後，再加入匹配的角色素材（會打開/關閉 picker）
    await sleep(500);
    if (!await tryAddMatchedAssets(item.text, item)) throw new Error("matched character/image could not be added to prompt");
    // Submit（等待面板動畫完成和 DOM 穩定）
    await sleep(1200);
    // 送出前重新確認提示詞仍在——中間的面板/頁籤/picker 操作可能把輸入框清掉或重渲染
    const promptEl = findPromptTextarea();
    if (promptEl) {
      const cur = (promptEl.textContent || "").replace(/\s+/g, " ").trim();
      const want = cleanPromptText(item.text).replace(/\s+/g, " ").trim();
      if (cur.length === 0 || (want.length > 0 && !cur.includes(want.slice(0, 30)))) {
        log("[Submit] prompt empty/lost before submit, re-filling...");
        setNativeValue(promptEl, cleanPromptText(item.text));
        await sleep(600);
        verifyPromptFill(promptEl, item.text);
      } else {
        log("[Submit] prompt present before submit, len=" + cur.length);
      }
    }
    let submit = findSubmitButton(isImageMode);
    if (!submit) {
      log("[Submit] First attempt failed, retrying in 1s...");
      await sleep(1000);
      submit = findSubmitButton(isImageMode);
    }
    if (!submit) throw new Error("submit button not found");
    const finalMode = detectFlowMode();
    if (finalMode !== (isImageMode ? "image" : "video")) {
      throw new Error("Flow creation mode changed before submit: " + (finalMode || "unknown"));
    }
    click(submit);
    log("Submitted item", item.id);

    // Observe results
    observeResults(item);

    // Wait for generation
    await sleep(10000);

    // Chain Prompt: capture last frame
    if (config.chainEnabled && config.mode === "frame2video") {
      try {
        const media = await waitForResult(60000);
        if (media) {
          const url = media.src || media.currentSrc;
          if (media.tagName === "VIDEO" || /\.(mp4|webm)/i.test(url)) {
            const frame = await captureLastFrame(url);
            if (frame) chainLastFrame = frame;
            try {
              const canvas = document.createElement("canvas");
              const v = document.createElement("video");
              v.muted = true; v.preload = "auto";
              v.src = url;
              await new Promise((res, rej) => {
                const t = setTimeout(() => rej(new Error("load timeout")), 15000);
                v.addEventListener("loadeddata", () => { clearTimeout(t); res(); }, { once: true });
                v.addEventListener("error", () => { clearTimeout(t); rej(new Error("load error")); }, { once: true });
              });
              v.currentTime = Math.max(0, (v.duration || 0) - 0.1);
              await new Promise(r => v.addEventListener("seeked", r, { once: true }));
              canvas.width = v.videoWidth || 1920;
              canvas.height = v.videoHeight || 1080;
              canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
              const dataURL = canvas.toDataURL("image/png");
              reportChainFrame(item.id, dataURL);
              reportItemResult(item.id, url);
              URL.revokeObjectURL && canvas.remove();
              if (prevSegmentFrame && chainRetriedCount[item.id] !== true) {
                const dist = await frameColorDistance(prevSegmentFrame, dataURL);
                if (dist !== null && dist > COLOR_GAP_THRESHOLD && chainRetriedCount[item.id] !== false) {
                  log("Item", item.id, "color transition gap detected (distance", dist.toFixed(3), "), auto retrying once");
                  reportItemRetry(item.id);
                  chainRetriedCount[item.id] = false;
                  const prevFrameForRetry = await dataURLToFile(prevSegmentFrame, "chain-last-frame.png");
                  chainLastFrame = prevFrameForRetry;
                  const retryRes = await processOneWithRetry(item);
                  if (retryRes.ok) { log("Item", item.id, "auto-retry succeeded"); }
                  else { log("Item", item.id, "auto-retry failed, keeping original output"); }
                  const mediaAfter = await waitForResult(60000);
                  if (mediaAfter) {
                    const url2 = mediaAfter.src || mediaAfter.currentSrc;
                    if (mediaAfter.tagName === "VIDEO" || /\.(mp4|webm)/i.test(url2)) {
                      const f2 = await captureLastFrame(url2);
                      if (f2) chainLastFrame = f2;
                    }
                  }
                  chainRetriedCount[item.id] = true;
                } else if (dist !== null) { chainRetriedCount[item.id] = true; }
              } else if (!prevSegmentFrame) { chainRetriedCount[item.id] = true; }
              prevSegmentFrame = dataURL;
            } catch (e) { log("preview report skipped:", e.message); }
          } else {
            const resp = await fetch(url);
            const blob = await resp.blob();
            chainLastFrame = new File([blob], "chain-last-frame.png", { type: "image/png" });
            reportChainFrame(item.id, await blobToDataURL(blob));
            log("Chain: image output saved as next input frame");
          }
        } else { log("Chain: no result media found for item", item.id); }
      } catch (e) { log("Chain frame capture skipped:", e.message); }
    }
  }

  function blobToDataURL(blob) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  }

  // Color transition detection
  async function frameColorDistance(dataURL1, dataURL2) {
    try {
      const draw = dataURL => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const W = 64, H = 36;
          canvas.width = W; canvas.height = H;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, W, H);
          const data = ctx.getImageData(0, 0, W, H).data;
          let r = 0, g = 0, b = 0, n = data.length / 4;
          for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
          resolve([r / n / 255, g / n / 255, b / n / 255]);
        };
        img.onerror = () => reject(new Error("image load error"));
        img.src = dataURL;
      });
      const [c1, c2] = await Promise.all([draw(dataURL1), draw(dataURL2)]);
      const dr = Math.abs(c1[0] - c2[0]), dg = Math.abs(c1[1] - c2[1]), db = Math.abs(c1[2] - c2[2]);
      return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.5 + db * db * 0.3);
    } catch (e) { log("frameColorDistance failed:", e.message); return null; }
  }
  const COLOR_GAP_THRESHOLD = 0.25;
  const CHAIN_MAX_RETRYS = 1;

  // Retry helper
  function sleepRand() {
    const min = Math.min(config.waitMin || 0, config.waitMax || 0);
    const max = Math.max(config.waitMin || 0, config.waitMax || 0);
    return (min + Math.random() * (max - min)) * 1000;
  }

  async function processOneWithRetry(item) {
    const MAX_FAIL_RETRIES = 2;
    let lastErr = null;
    for (let attempt = 0; attempt <= MAX_FAIL_RETRIES; attempt++) {
      if (stopped) { log("Stop requested — aborting item", item.id); return { ok: false, err: new Error("stopped") }; }
      try { await processOne(item); return { ok: true }; }
      catch (err) {
        lastErr = err;
        if (attempt < MAX_FAIL_RETRIES && !stopped) {
          logError("Item", item.id, "failed (attempt", attempt + 1, "), retrying:", err.message);
          reportItemStatus(item.id, "retrying");
          await sleep(sleepRand());
        }
      }
    }
    return { ok: false, err: lastErr };
  }

  log("Content script ready. Waiting for START_BATCH message.");
})();
