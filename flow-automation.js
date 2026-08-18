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
  let chainLastFrame = null; // File object: last frame of the previous video (chain mode)
  let resumeFrameFile = null; // resumed chain frame from checkpoint (dataURL -> File)
  let prevSegmentFrame = null; // dataURL: previous segment's last frame (for color transition detection)
  const chainRetriedCount = {}; // per item: undefined->not checked, false->retrying, true->done

  // --------------- Chrome message listener ---------------
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "START_BATCH") {
      config = msg.config;
      queue = msg.queue;
      stopped = false;
      // Restore resumed chain frame (from popup checkpoint) as initial input
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
    reportDebugLog(args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" "), "error");
  }

  // --------------- Utility: set native input value ---------------
  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // --------------- Click helpers ---------------
  function click(el) {
    if (!el) return false;
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

  // --------------- Status reporting to popup ---------------
  function reportItemStatus(id, status) {
    try {
      chrome.runtime.sendMessage({ type: "ITEM_STATUS", id, status });
    } catch (e) { /* extension context invalidated */ }
  }

  // --------------- Element finders (Google Flow UI) ---------------
  function findPromptTextarea() {
    return document.querySelector("textarea[placeholder*='rompt'], textarea");
  }

  function findSubmitButton() {
    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.find(b => /generate|生成|create/i.test(b.textContent)) || buttons[buttons.length - 1];
  }

  function findAspectRatioButtons() {
    return Array.from(document.querySelectorAll("button, [role='button']")).filter(el =>
      ["16:9", "1:1", "9:16"].includes((el.textContent || "").trim()));
  }

  function findModelOptions() {
    return Array.from(document.querySelectorAll("button, [role='option'], li")).filter(el =>
      /Veo|veo/.test(el.textContent || ""));
  }

  // --------------- Flow panel mode switch (chain across video modes) ---------------
  // Chain generation for text2video works by temporarily switching Flow's UI to
  // the Frames-to-Video panel (which accepts an input image = last frame), so we
  // need reliable buttons to switch panels. Labels cover Traditional Chinese,
  // Simplified Chinese and English Flow UIs.
  const MODE_BUTTON_LABELS = {
    text2video: ["文字轉影片", "文字转视频", "Text to Video"],
    frame2video: ["幀數轉影片", "帧数转视频", "Frames to Video"]
  };
  function findModeSwitchButton(modeKey) {
    const labels = MODE_BUTTON_LABELS[modeKey] || [];
    const candidates = Array.from(document.querySelectorAll("button, [role='button'], nav a, a[href]"));
    for (const label of labels) {
      const el = candidates.find(c => (c.textContent || "").trim() === label);
      if (el) return el;
    }
    // Fallback: partial match (e.g. a label with extra whitespace or decoration)
    for (const label of labels) {
      const el = candidates.find(c => (c.textContent || "").trim().includes(label));
      if (el) return el;
    }
    return null;
  }
  // Click the Flow UI button that switches to the given video panel, then wait
  // for the panel to re-render. Returns true on success.
  async function switchMode(modeKey) {
    const el = findModeSwitchButton(modeKey);
    if (!el) {
      logError("Mode switch failed: button not found for", modeKey);
      return false;
    }
    log("Switching Flow panel to", modeKey);
    click(el);
    // Flow re-renders the panel (inputs, upload zone, options) after the switch
    await sleep(3500);
    return true;
  }

  // --------------- Select dropdown option ---------------
  function selectByText(text) {
    const els = Array.from(document.querySelectorAll("*")).filter(
      el => el.children.length === 0 && (el.textContent || "").trim() === text);
    for (const el of els) {
      click(el);
      return true;
    }
    return false;
  }

  // --------------- DataURL to File (for checkpoint-resumed frames) ---------------
  async function dataURLToFile(dataURL, name) {
    const resp = await fetch(dataURL);
    const blob = await resp.blob();
    return new File([blob], name, { type: "image/png" });
  }

  // --------------- Report to popup ---------------
  function reportChainFrame(index, dataURL) {
    try {
      chrome.runtime.sendMessage({ type: "CHAIN_FRAME", index, dataURL });
    } catch (e) { /* extension context invalidated */ }
  }
  function reportItemResult(id, videoUrl, dataURL) {
    try {
      chrome.runtime.sendMessage({ type: "ITEM_RESULT", id, videoUrl, dataURL });
    } catch (e) { /* extension context invalidated */ }
  }
  function reportItemRetry(id) {
    try {
      chrome.runtime.sendMessage({ type: "ITEM_RETRY", id });
    } catch (e) { /* extension context invalidated */ }
  }
  function reportDebugLog(text, level) {
    try {
      chrome.runtime.sendMessage({ type: "DEBUG_LOG", text, level });
    } catch (e) { /* extension context invalidated */ }
  }

  // --------------- Upload frames ---------------
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
    await sleep(3000); // wait for upload to finish
    return true;
  }

  // --------------- Chain Prompt: capture last frame ---------------
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
      await new Promise(r => {
        video.addEventListener("seeked", r, { once: true });
      });
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

  // Wait until a NEW video/img result node (not present before this item) appears on the Flow page
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

  // --------------- Configure generation options ---------------
  function setAspect() {
    if (!config.aspect) return;
    const btns = findAspectRatioButtons();
    for (const b of btns) {
      if ((b.textContent || "").trim() === config.aspect) {
        click(b);
        log("Aspect set to", config.aspect);
        return;
      }
    }
  }

  function setModel() {
    if (!config.model) return;
    const map = {
      "veo3.1-lite": "Veo 3.1 Lite",
      "veo3.1-lite-low": "Veo 3.1 Lite [Lower Priority]",
      "veo3.1-fast": "Veo 3.1 Fast",
      "veo3.1-quality": "Veo 3.1 Quality",
      "omni-flash": "Omni Flash",
      "veo2-fast": "Veo 2 Fast",
      "veo2-quality": "Veo 2 Quality",
    };
    const label = map[config.model] || config.model;
    if (selectByText(label)) log("Model set to", label);
  }

  // Image model selector (Nano Banana Pro / 2 / 2 Lite) for image modes
  function setImageModel() {
    if (!config.imageModel) return;
    const map = {
      "nano-banana-pro": "Nano Banana Pro",
      "nano-banana-2": "Nano Banana 2",
      "nano-banana-2-lite": "Nano Banana 2 Lite",
    };
    const label = map[config.imageModel] || config.imageModel;
    if (selectByText(label)) log("Image model set to", label);
    else log("Image model not found in UI:", label);
  }

  // Default image source for image modes: "new" (新圖片) or "last" (上一張圖片)
  function setImageMode() {
    if (!config.imageMode) return;
    const map = { "new": "新圖片", "last": "上一張圖片", "new_image": "新圖片", "last_image": "上一張圖片" };
    const label = map[config.imageMode] || config.imageMode;
    if (selectByText(label)) log("Image mode set to", label);
    else log("Image mode not found in UI:", label);
  }

  function setOutputs(n) {
    selectByText(String(n));
  }

  function setDuration(sec) {
    // Supports: plain seconds ("8"), merged durations ("4-merge" → "4秒(合併)"), plain zh forms ("8秒")
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
  }

  // --------------- Frame handling ---------------
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
    // all frames per prompt
    return frames.slice(index * perPrompt, (index + 1) * perPrompt);
  }

  // --------------- Auto character / voice ---------------
  // 當 prompt 提到已掃描到的角色時，在 Flow UI 上「選中」對應角色；
  // 沒匹配到任何角色時退回「預設角色」。
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

  // 在 Flow 頁面上找出並點擊指定角色。角色以「卡片」呈現：一張圖 + 名稱文字/alt。
  // 與 popup 的掃描角色邏輯對應：底線視為空格、不區分大小寫；優先點擊最精確的元素。
  function selectCharacter(name) {
    const nn = (name || "").trim();
    if (!nn) return false;
    const nnorm = nn.replace(/_/g, " ").toLowerCase();
    const normText = (s) => (s || "").replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    const hit = (s) => {
      const t = normText(s);
      if (!t) return false;
      if (t === nnorm) return true;
      return t.split(/[\s,，、;；|\/]+/).includes(nnorm);
    };

    // Strategy 1: 名稱是獨立文字元素（leaf）→ 點它（最精確、最不易誤按，
    // 與 tryAutoVoice 選語音的手法一致；click 事件會向上冒泡觸發卡片 onClick）。
    const leaves = Array.from(document.querySelectorAll("span, div, p, a, button, li, figcaption"))
      .filter(el => el.children.length === 0);
    for (const el of leaves) {
      if (normText(el.textContent) === nnorm) {
        if (click(el)) { log("Character text clicked:", nn); return true; }
      }
    }

    // Strategy 2: 角色卡片 — 收集所有「包著圖片且文字含名稱」的容器，
    // 依文字長度排序（最短=最精確），直接點擊卡片本身。
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
      if (click(card)) { log("Character card clicked:", nn); return true; }
    }

    // Strategy 3: 可點擊元素其文字正好等於名稱。
    for (const el of Array.from(document.querySelectorAll("button, [role='button'], [role='option'], li, a"))) {
      if (normText(el.textContent) === nnorm) {
        if (click(el)) { log("Character option clicked:", nn); return true; }
      }
    }

    return false;
  }

  // Auto-add voice by speaker (text2video / components2video / agent modes):
  // if a known voice name appears in the prompt, select that voice; otherwise
  // select the default voice when configured.
  function tryAutoVoice(text) {
    if (!config.voiceEnabled) return;
    log("Auto voice requested for:", text.slice(0, 50));
    const matched = voiceNamesInText(text);
    const target = matched.length > 0 ? matched[0] : (config.defaultVoice || "");
    if (!target) {
      log("No voice matched and no default voice configured, skipping");
      return;
    }
    const gender = voiceGender(target);
    const label = gender ? target + " - " + gender : target;
    if (selectByText(label)) {
      log("Voice selected:", label);
      return;
    }
    // Fallback: exact name only
    if (selectByText(target)) {
      log("Voice selected:", target);
    } else {
      log("Voice not found in UI:", label);
    }
  }
  // Google Flow 內建 30 個 Chirp 3 HD 語音（與 popup.js VOICES 同步）
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
  // Which voice names appear in the prompt text (token-aware matching).
  // Longer names win: "Mary Jane" absorbs "Mary"; English names require word
  // boundaries so "Achird" does not hit "Achird's car" wrongly (same rule as
  // charsInText with charHitInContext, using VOICE names as the name list).
  function voiceNamesInText(text) {
    const p = norm(text);
    const allNames = VOICES.map(v => v.name);
    return allNames.filter(n => charHitInContext(p, norm(n), allNames) || tokensSubset(norm(n), p));
  }

  // --------------- Auto-add character images (image2image) ---------------
  // When charImageEnabled, prioritize input images whose FILE NAME (without
  // extension) matches a character name mentioned in the prompt text.
  // Normalizes spaces/underscores so "dragon knight" hits "Dragon_Knight_armor.png".
  // If no match within this segment's pool, picks matching images from ALL frames.
  function norm(s) {
    return (s || "").replace(/_/g, " ").toLowerCase();
  }
  // Find which scanned character names actually appear in the prompt text.
  // Bidirectional token-aware matching: "CuteGirl" matches "cute girl" in the
  // prompt (both split into words and compared as word sets).
  // Split into words; camelCase names like "CuteGirl" are also split into ["cute","girl"].
  // CamelCase splitting MUST happen before lowercase normalization.
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

  // Find occurrences of name `nn` in prompt `p`; returns true only when at
  // least one occurrence is NOT absorbed by a LONGER character name
  // (e.g. 「龍」occurrences inside 「小龍」are absorbed; English substring hits
  // must sit on word boundaries).
  function charHitInContext(p, nn, allNames) {
    if (!nn || !p.includes(nn)) return false;
    const isCJK = /[\u4e00-\u9fff]/.test(nn);
    const others = allNames
      .map(m => norm(m))
      .filter(m => m && m !== nn && m.includes(nn));
    const occs = [];
    let idx = p.indexOf(nn);
    while (idx !== -1) {
      const before = idx > 0 ? p[idx - 1] : null;
      const after = idx + nn.length < p.length ? p[idx + nn.length] : null;
        let absorbed = false;
        const isWordChar = ch => ch !== null && /[\w\u4e00-\u9fff]/.test(ch);
        if (isCJK) {
          // In Chinese, an occurrence touching another CJK character on either
          // side belongs to that longer name if one exists in the character list.
          if (isWordChar(before) || isWordChar(after)) {
            absorbed = others.length > 0 && others.some(m => p.includes(m));
          }
        } else {
          // English/latin: require word boundary at both sides
          if (isWordChar(before) || isWordChar(after)) {
            absorbed = true;
          }
        }
      occs.push(!absorbed);
      idx = p.indexOf(nn, idx + 1);
    }
    return occs.some(hit => hit);
  }
  function charsInText(text) {
    const p = norm(text);
    // User-selected character pool from the multi-select scan list takes priority;
    // fall back to ALL scanned names when nothing is checked (previous behavior).
    const pool = (config.charSelected && config.charSelected.length > 0)
      ? config.charSelected
      : (config.charNames || []);
    const allNames = pool.map(n => (n || "").trim()).filter(Boolean);
    return allNames
      .map(n => (n || "").trim())
      .filter(n => {
        const nn = norm(n);
        if (!nn) return false;
        // Context-aware substring (long-name absorption for similar names like
        // 龍 vs 小龍) OR contiguous token-fragment match (handles camelCase
        // CuteGirl ↔ "cute girl", Mary Jane, dragon knight etc.).
        return charHitInContext(p, nn, allNames) || tokensSubset(nn, p) || tokensSubset(n, text);
      });
  }
  // Contiguous token-fragment match: name tokens must appear consecutively in
  // the base tokens (e.g. 小龍_幼年 → ["小龍","幼年"] matches 小龍 but not 龍;
  // Mary_Jane_禮服 matches Mary Jane but not Mary alone).
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
  // Does a file name match any of the given character names? Uses contiguous
  // token-fragment matching with LONGER-name absorption: a hit for "Mary" inside
  // "mary_jane_禮服" is absorbed when "Mary Jane" is also a known character and
  // the hit can be extended into that longer name.
  function charMatched(fileName, names) {
    const base = norm((fileName || '').replace(/\.[^.]+$/, ""));
    if (!base) return false;
    // Absorption uses ALL known character names (config.charNames), not only
    // the names passed in, so a hit for "Mary" inside "mary_jane_禮服" is still
    // absorbed when "Mary Jane" is a known character even if only ["Mary"] was
    // passed in.
    const allKnown = ((config && config.charNames) || []).map(m => norm(m)).filter(Boolean);
    const allNorm = allKnown.length > 0 ? allKnown : names.map(m => norm(m)).filter(Boolean);
    return names.some(n => {
      const nn = norm(n);
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
        // Check absorption: can the hit be extended into a longer character name?
        const others = allNorm.filter(m => m !== nn && m.includes(nn));
        let absorbed = false;
        if (others.length > 0) {
          for (const m of others) {
            const tm = tokens(m);
            if (tm.length <= ta.length) continue;
            // extend to the left
            if (i - (tm.length - ta.length) >= 0) {
              let ext = true;
              for (let k = 0; k < tm.length; k++) {
                if (tb[i - (tm.length - ta.length) + k] !== tm[k]) { ext = false; break; }
              }
              if (ext) { absorbed = true; break; }
            }
            // extend to the right
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
    const textChars = charsInText(text);
    if (textChars.length === 0) return []; // prompt mentions no known character
    const pool = (promptFiles || []).filter(Boolean);
    // Pick character images per matched character: segment pool first, then
    // fall back to ALL frames — character images always take priority and may
    // exceed the maxImages limit.
    const seen = new Set();
    const picked = [];
    for (const ch of textChars) {
      const poolHits = pool.filter(f => charMatched(f.name, [ch]));
      const hits =
        poolHits.length > 0
          ? poolHits
          : (config.frames || []).filter(f => charMatched(f.name, [ch]));
      hits.forEach(f => {
        if (!seen.has(f.name)) {
          seen.add(f.name);
          picked.push(f);
        }
      });
    }
    if (picked.length > 0) {
      log("Char images matched:", picked.map(p => p.name).join(", "));
    }
    return picked;
  }

  // --------------- Track generation progress & download ---------------
  let observedNodes = null;
  const downloadUrls = new Set();
  // Snapshot of pre-existing media so chain capture only uses NEW results
  function snapshotMedia() {
    return new Set(Array.from(document.querySelectorAll("video, img")).map(m => m.src || m.currentSrc));
  }

  function observeResults(item) {
    // Observe the DOM for newly generated media to auto-download
    const observer = new MutationObserver(() => {
      document.querySelectorAll("video, img").forEach(media => {
        const url = media.src || media.currentSrc;
        if (!url || downloadUrls.has(url)) return;
        downloadUrls.add(url);
        autoDownload(url, item);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function autoDownload(url, item) {
    // Apply configured resolution: video uses settings menu / image uses quality selector
    const isImage = /\.(png|jpg|jpeg|webp)$/i.test(url.split("?")[0]) || /image/i.test(item.text || "");
    const targetRes = isImage ? (config.imageRes || "2k").toLowerCase() : (config.videoRes || "1080p").toLowerCase();
    const skip = isImage && targetRes === "none";
    if (skip) { log("Image download skipped (configured: none)"); return; }

    // Try resolution selector first (Flow quality menu: click resolution option then use resulting URL)
    let finalUrl = await trySelectResolution(url, isImage, targetRes);

    const folder = config.folder || "veo-folder-1";
    let filename = (finalUrl || url).split("/").pop().split("?")[0] || `flow-${item.id}`;
    if (config.rename) {
      const ext = filename.split(".").pop() || (isImage ? "png" : "mp4");
      filename = `${folder}_${item.id + 1}.${ext}`;
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
    } catch (e) {
      log("Download failed:", e.message);
    }
  }

  async function trySelectResolution(url, isImage, res) {
    // Find quality/resolution selectors in Flow UI and click matching option
    const candidates = document.querySelectorAll(
      "[role=menuitem], [role=option], button[aria-haspopup], [class*='quality'], [class*='res']"
    );
    const norm = (s) => String(s || "").toLowerCase().trim();
    for (const el of candidates) {
      const label = norm(el.getAttribute("aria-label") || el.textContent);
      if (!label) continue;
      const isMatch =
        (!isImage && (label === res || label.startsWith(res))) ||
        (isImage && (label === res || label === res + " resolution"));
      if (isMatch && !/disabled/i.test(el.getAttribute("aria-disabled") || "")) {
        try {
          el.click();
          log("Resolution option clicked:", res);
          await sleep(800);
          return url;
        } catch (e) {}
        break;
      }
    }
    // Fallback: replace resolution in URL query if present
    if (/size=|resolution=|quality=/.test(url)) {
      const key = /size=/.test(url) ? "size" : /resolution=/.test(url) ? "resolution" : "quality";
      const replaced = url.replace(new RegExp(`([?&]${key}=)[^&]*`), `$1${encodeURIComponent(res)}`);
      if (replaced !== url) return replaced;
    }
    return url;
  }

  // --------------- Main batch loop ---------------
  async function runBatch() {
    log("Starting batch:", queue.length, "prompts, concurrency:", config.concurrency);
    if (config.chainEnabled) {
      log("Chain Prompt enabled — processing sequentially, each item uses the previous video's last frame.");
    }

    const worker = async () => {
      while (queue.length > 0 && !stopped) {
        const item = queue.shift();
        if (!item) break;
        const res = await processOneWithRetry(item);
        if (res.ok) {
          reportItemStatus(item.id, "done");
        } else {
          logError("Error on item", item.id, res.err);
          reportItemStatus(item.id, "error");
        }
        if (queue.length > 0) await sleep(randWait() * 1000);
      }
    };

    // Resume: skip already-done segments from a previous interrupted run
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

  // --------------- Process one prompt ---------------
  async function processOne(item) {
    reportItemStatus(item.id, "running");
    const mediaBefore = snapshotMedia();

    // 0a. Chain mode: switch Flow UI to the Frames-to-Video panel, which accepts
    // an input image (the previous segment's last frame). A text2video chain
    // runs through that panel so the chain frame can be attached automatically.
    if (config.chainEnabled && config.mode === "text2video") {
      if (await switchMode("frame2video") === false) {
        logError("Cannot switch to frames panel; chain generation aborted for item", item.id);
        throw new Error("mode switch failed");
      }
    }

    // 0b. Chain Prompt: append the previous video's last frame as input image
    if (config.chainEnabled && (config.mode === "frame2video" || config.mode === "text2video")) {
      if (chainLastFrame) {
        log("Chain: uploading last frame of the previous video for item", item.id);
        const ok = await uploadFrames([chainLastFrame]);
        if (!ok) throw new Error("chain frame upload failed");
        chainLastFrame = null;
      } else if (resumeFrameFile) {
        // First segment after resume: use the checkpoint-saved last frame
        log("Chain resume: uploading saved last frame for item", item.id);
        const ok = await uploadFrames([resumeFrameFile]);
        if (!ok) throw new Error("chain frame upload failed");
        resumeFrameFile = null;
      }
      // else: first item — use already uploaded user frames (or start from empty)
    }

    // 1. Upload frames if frame mode (non-chain)
    if (config.mode === "frame2video" && !config.chainEnabled) {
      const frames = getFramesForPrompt(item.id);
      if (frames.length > 0) {
        const ok = await uploadFrames(frames);
        if (!ok) throw new Error("frame upload failed");
      }
    }

    // 1b. Image-based modes: upload up to maxImages input pictures per prompt
    const maxImages = Math.max(1, Math.min(10, parseInt(config.maxImages) || 2));
    let sliced = [];
    if (config.mode !== "frame2video" && config.mode !== "text2video" && config.mode !== "text2image") {
      const batch = config.frames || [];
      sliced = batch.slice(item.id * maxImages, (item.id + 1) * maxImages);
    }

    // 1c. Auto-add character images (image2image): prefer images whose file
    // name matches a character name mentioned in the prompt
    const charPicks = tryAutoCharImages(item.text, sliced);
    const uploadBatch = charPicks.length > 0 ? charPicks : sliced;
    if (uploadBatch.length > 0) {
      const ok = await uploadFrames(uploadBatch);
      if (!ok) throw new Error("input image upload failed");
    }

    // 2. Fill prompt
    const textarea = findPromptTextarea();
    if (!textarea) throw new Error("prompt textarea not found");
    textarea.focus();
    setNativeValue(textarea, item.text);

    // 3. Auto character / voice hints
    tryAutoCharacter(item.text);
    tryAutoVoice(item.text);

    // 4. Set options
    await sleep(800);
    setAspect();
    await sleep(300);
    setModel();
    await sleep(300);
    if (config.mode === "text2image" || config.mode === "image2image") {
      if (config.imageModel) setImageModel();
      await sleep(300);
      if (config.imageMode) setImageMode();
      await sleep(300);
    }
    setOutputs(parseInt(config.outputCount) || 1);
    await sleep(300);
    // Per-prompt duration override: use the segment's individual duration if set,
    // otherwise fall back to the global default (config.duration).
    const sec = (item && item.duration) || config.duration;
    if (sec) setDuration(sec);
    await sleep(500);

    // 5. Submit
    const submit = findSubmitButton();
    if (!submit) throw new Error("submit button not found");
    click(submit);
    log("Submitted item", item.id);

    // 6. Observe results & auto-download
    observeResults(item);

    // 7. Wait for generation (long poll)
    await sleep(10000);

    // 8. Chain Prompt: capture the last frame of the newly generated video
    if (config.chainEnabled && (config.mode === "frame2video" || config.mode === "text2video")) {
      try {
        const media = await waitForResult(60000);
        if (media) {
          const url = media.src || media.currentSrc;
          if (media.tagName === "VIDEO" || /\.(mp4|webm)/i.test(url)) {
            const frame = await captureLastFrame(url);
            if (frame) chainLastFrame = frame;
            // Save last-frame copy + live preview for popup
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

              // Color transition detection: compare with the previous segment's last frame
              if (prevSegmentFrame && chainRetriedCount[item.id] !== true) {
                const dist = await frameColorDistance(prevSegmentFrame, dataURL);
                if (dist !== null && dist > COLOR_GAP_THRESHOLD && chainRetriedCount[item.id] !== false) {
                  log("Item", item.id, "color transition gap detected (distance", dist.toFixed(3), "), auto retrying once");
                  reportItemRetry(item.id);
                  chainRetriedCount[item.id] = false;
                  // Re-run the segment using the SAME input frame (reset chainLastFrame to previous)
                  const prevFrameForRetry = await dataURLToFile(prevSegmentFrame, "chain-last-frame.png");
                  chainLastFrame = prevFrameForRetry;
                  const retryRes = await processOneWithRetry(item);
                  if (retryRes.ok) {
                    log("Item", item.id, "auto-retry succeeded");
                  } else {
                    log("Item", item.id, "auto-retry failed, keeping original output");
                  }
                  // After retry, capture the NEW last frame for the NEXT segment
                  const mediaAfter = await waitForResult(60000);
                  if (mediaAfter) {
                    const url2 = mediaAfter.src || mediaAfter.currentSrc;
                    if (mediaAfter.tagName === "VIDEO" || /\.(mp4|webm)/i.test(url2)) {
                      const f2 = await captureLastFrame(url2);
                      if (f2) chainLastFrame = f2;
                    }
                  }
                  chainRetriedCount[item.id] = true;
                } else if (dist !== null) {
                  chainRetriedCount[item.id] = true;
                }
              } else if (!prevSegmentFrame) {
                chainRetriedCount[item.id] = true;
              }
              prevSegmentFrame = dataURL;
            } catch (e) {
              log("preview report skipped:", e.message);
            }
          } else {
            // Image output: convert the image into a file for the next prompt
            const resp = await fetch(url);
            const blob = await resp.blob();
            chainLastFrame = new File([blob], "chain-last-frame.png", { type: "image/png" });
            reportChainFrame(item.id, await blobToDataURL(blob));
            log("Chain: image output saved as next input frame");
          }
        } else {
          log("Chain: no result media found for item", item.id);
        }
      } catch (e) {
        log("Chain frame capture skipped:", e.message);
      }
      // 0c. Chain started from text2video: switch back to the Text-to-Video panel
      // so the UI stays consistent for the next segment (and for the user).
      if (config.chainEnabled && config.mode === "text2video") {
        await switchMode("text2video");
      }
    }
  }

  function blobToDataURL(blob) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  }

  // --------------- Color transition detection (chain mode) ---------------
  // Compare average color of two frames; returns 0-1 distance (0 = identical)
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
          for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2];
          }
          resolve([r / n / 255, g / n / 255, b / n / 255]);
        };
        img.onerror = () => reject(new Error("image load error"));
        img.src = dataURL;
      });
      const [c1, c2] = await Promise.all([draw(dataURL1), draw(dataURL2)]);
      const dr = Math.abs(c1[0] - c2[0]), dg = Math.abs(c1[1] - c2[1]), db = Math.abs(c1[2] - c2[2]);
      // Weighted perceptual distance (green channel weighted higher)
      return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.5 + db * db * 0.3);
    } catch (e) {
      log("frameColorDistance failed:", e.message);
      return null;
    }
  }
  // Threshold: color distance above this is considered a "transition gap"
  const COLOR_GAP_THRESHOLD = 0.25;
  const CHAIN_MAX_RETRYS = 1;

  // --------------- Retry helper ---------------
  function sleepRand() {
    const min = Math.min(config.waitMin || 0, config.waitMax || 0);
    const max = Math.max(config.waitMin || 0, config.waitMax || 0);
    return (min + Math.random() * (max - min)) * 1000;
  }

  // Run one prompt with automatic retry on failure (up to CHAIN_MAX_RETRY runs)
  async function processOneWithRetry(item) {
    const MAX_FAIL_RETRIES = 2;
    let lastErr = null;
    for (let attempt = 0; attempt <= MAX_FAIL_RETRIES; attempt++) {
      try {
        await processOne(item);
        return { ok: true };
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_FAIL_RETRIES) {
          logError("Item", item.id, "failed (attempt", attempt + 1 + "), retrying after random wait:", err.message);
          reportItemStatus(item.id, "retrying");
          await sleep(sleepRand());
        }
      }
    }
    return { ok: false, err: lastErr };
  }

  log("Content script ready. Waiting for START_BATCH message.");
})();
