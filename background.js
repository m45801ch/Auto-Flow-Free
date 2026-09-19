// Flow Automation — background service worker
// Makes the toolbar icon open the side panel (split view on the right) instead of a popup.

// Downloads must be started by the extension so Chrome can create the requested
// path beneath Downloads. An <a download="folder/file"> on the Flow page does
// not reliably retain directory separators.
const pendingBlobDownloads = new Map();
const activeMediaDownloads = new Map();
let filenameDecisionLock = Promise.resolve();

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  let suggested = false;
  const suggestOnce = value => {
    if (suggested) return;
    suggested = true;
    suggest(value);
  };
  const pending = pendingBlobDownloads.get(item.url);
  if (pending) {
    pendingBlobDownloads.delete(item.url);
    suggestOnce({ filename: pending.filename, conflictAction: "uniquify" });
    return;
  }
  const decision = filenameDecisionLock.then(async () => {
    const stored = await chrome.storage.session.get("pendingFlowDownloads");
    const entries = (stored.pendingFlowDownloads || []).filter(entry => Date.now() < entry.expiresAt);
    const kind = /^image\//i.test(item.mime || "") || /\.(?:png|jpe?g|webp)$/i.test(item.url || "") ? "image" :
      /^video\//i.test(item.mime || "") || /\.(?:mp4|webm)$/i.test(item.url || "") ? "video" : "";
    const fromFlow = item.referrer
      ? /(?:flow\.google\.com|labs\.google)/i.test(item.referrer)
      : /(?:flow\.google\.com|labs\.google|googleusercontent\.com|googleapis\.com)/i.test(item.url || "");
    const flowDownload = !item.byExtensionId && fromFlow && entries
      .filter(entry => (!kind || entry.kind === kind))
      .sort((a, b) => a.createdAt - b.createdAt)[0];
    if (!flowDownload) { suggestOnce(); return; }
    await chrome.storage.session.set({ pendingFlowDownloads: entries.filter(entry => entry.token !== flowDownload.token) });
    const extension = /image\/jpe?g/i.test(item.mime || "") ? "jpg" :
      /image\/webp/i.test(item.mime || "") ? "webp" :
      /video\/webm/i.test(item.mime || "") ? "webm" : flowDownload.kind === "image" ? "png" : "mp4";
    const filename = flowDownload.filename.replace(/\.[^.\/]+$/, "." + extension);
    activeMediaDownloads.set(item.id, { tabId: flowDownload.tabId, url: item.url, filename });
    suggestOnce({ filename, conflictAction: "uniquify" });
    try {
      chrome.tabs.sendMessage(flowDownload.tabId, {
        type: "FLOW_DOWNLOAD_STARTED", token: flowDownload.token, id: item.id, filename,
      }).catch(() => {});
    } catch (e) { /* tab closed after download started */ }
  });
  filenameDecisionLock = decision.catch(() => {});
  decision.catch(() => suggestOnce());
  return true;
});

chrome.downloads.onChanged.addListener(delta => {
  const active = activeMediaDownloads.get(delta.id);
  if (!active) return;
  if (delta.error?.current || delta.state?.current === "interrupted") {
    activeMediaDownloads.delete(delta.id);
    chrome.tabs.sendMessage(active.tabId, {
      type: "DOWNLOAD_MEDIA_FAILED", url: active.url, filename: active.filename,
      error: delta.error?.current || "Download interrupted",
    }).catch(() => {});
  } else if (delta.state?.current === "complete") {
    activeMediaDownloads.delete(delta.id);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  // Allow clicking the extension toolbar icon to toggle the side panel
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("[FlowAuto] setPanelBehavior failed:", error));
});

// Keep ensuring the behavior on startup (in case Chrome resets it)
chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {});
});

// ---------------- Flow page detection (v1.9.9) ----------------
// The service worker always has full tabs permission, so it is the authoritative
// source of "is the browser currently on a Flow project page". Whenever the state
// changes it broadcasts { type: "FLOW_STATE", isOnFlow } to every extension page
// (side panel / popup), which shows/hides the forced not-flow modal.
// Flow 雙網址：舊版 labs.google/fx/(語言/)?tools/flow + 新版 flow.google.com
const FLOW_RE = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow|flow\.google\.com/i;
const FLOW_TAB_URLS = ["*://labs.google/fx/*tools/flow*", "*://flow.google.com/*"];
let lastBroadcastOnFlow = null;

async function getFlowState() {
  try {
    // 提醒制：只看使用者「當前正在看的分頁」，不看别處有没有 Flow 分頁開著，
    // 否則切到別頁也永遠不提醒。優先用最後聚焦視窗的 active tab。
    try {
      const focused = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const cur = (focused || []).filter(t => !(t?.url || "").startsWith("chrome-extension://"));
      if (cur.length > 0) return FLOW_RE.test(cur[0]?.url || "");
    } catch (e) { /* 掉到下方兜底 */ }
    // 兜底：所有視窗的 active tab 任一在 Flow 即視為在 Flow
    const activeTabs = await chrome.tabs.query({ active: true });
    const extFree = (activeTabs || []).filter(t => !(t?.url || "").startsWith("chrome-extension://"));
    return (extFree || []).some(t => FLOW_RE.test(t?.url || ""));
  } catch (e) {
    return null;
  }
}

function broadcastFlowState() {
  getFlowState().then(isOnFlow => {
    if (isOnFlow === null) return; // query failed, don't disturb current state
    if (isOnFlow === lastBroadcastOnFlow) return; // no change
    lastBroadcastOnFlow = isOnFlow;
    try {
      chrome.runtime.sendMessage({ type: "FLOW_STATE", isOnFlow });
    } catch (e) { /* no pages listening */ }
  });
}

// Tab URL changed (navigation), tab activated, or browser window focus switched
if (chrome.tabs && chrome.tabs.onUpdated) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo && changeInfo.url) broadcastFlowState();
  });
}
if (chrome.tabs && chrome.tabs.onActivated) {
  chrome.tabs.onActivated.addListener(() => { broadcastFlowState(); });
}
if (chrome.windows && chrome.windows.onFocusChanged) {
  chrome.windows.onFocusChanged.addListener(() => { broadcastFlowState(); });
}

// Periodic keep-alive check: Chrome MV3 service workers get terminated after ~30s of
// inactivity, and event listeners (onUpdated / onActivated) are then silently lost.
// A 15-second alarm reliably wakes the worker and forces a fresh detection + broadcast.
try {
  chrome.alarms.create("flowStateCheck", { periodInMinutes: 0.25 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === "flowStateCheck") broadcastFlowState();
  });
} catch (e) { /* ignore */ }

// Extension pages (side panel) can also ask directly: { type: "QUERY_FLOW_STATE" }
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try {
      if (msg && msg.type === "QUERY_FLOW_STATE") {
        getFlowState().then(isOnFlow => {
          if (isOnFlow !== null && isOnFlow !== lastBroadcastOnFlow) lastBroadcastOnFlow = isOnFlow;
          sendResponse({ isOnFlow: isOnFlow !== false });
        });
        return true; // keep the message channel open for the async response
      }
      if (msg && msg.type === "DOWNLOAD_MEDIA") {
        const url = String(msg.url || "");
        const filename = String(msg.filename || "");
        if (!/^https?:\/\//i.test(url) || !filename || filename.startsWith("/") ||
            filename.split("/").some(part => !part || part === "." || part === "..")) {
          sendResponse({ ok: false, error: "Invalid download URL or filename" });
          return false;
        }
        chrome.downloads.download({ url, filename, saveAs: false, conflictAction: "uniquify" })
          .then(id => {
            if (sender.tab?.id != null) activeMediaDownloads.set(id, { tabId: sender.tab.id, url, filename });
            sendResponse({ ok: true, id });
          })
          .catch(error => sendResponse({ ok: false, error: error.message }));
        return true;
      }
      if (msg && msg.type === "REGISTER_BLOB_DOWNLOAD") {
        const url = String(msg.url || "");
        const filename = String(msg.filename || "");
        if (!url.startsWith("blob:") || !filename || filename.startsWith("/") ||
            filename.split("/").some(part => !part || part === "." || part === "..")) {
          sendResponse({ ok: false, error: "Invalid blob download" });
          return false;
        }
        pendingBlobDownloads.set(url, { filename });
        setTimeout(() => pendingBlobDownloads.delete(url), 60000);
        sendResponse({ ok: true });
        return false;
      }
      if (msg && msg.type === "REGISTER_FLOW_DOWNLOAD") {
        const filename = String(msg.filename || "");
        const kind = msg.kind;
        const token = String(msg.token || "");
        if (sender.tab?.id == null || !token || !["image", "video"].includes(kind) ||
            !filename || filename.startsWith("/") ||
            filename.split("/").some(part => !part || part === "." || part === "..")) {
          sendResponse({ ok: false, error: "Invalid Flow download registration" });
          return false;
        }
        const entry = {
          token, filename, kind, tabId: sender.tab.id,
          createdAt: Date.now(), expiresAt: Date.now() + 15 * 60 * 1000,
        };
        chrome.storage.session.get("pendingFlowDownloads")
          .then(stored => chrome.storage.session.set({ pendingFlowDownloads: [
            ...(stored.pendingFlowDownloads || []).filter(old => old.token !== token && Date.now() < old.expiresAt),
            entry,
          ] }))
          .then(() => sendResponse({ ok: true }))
          .catch(error => sendResponse({ ok: false, error: error.message }));
        return true;
      }
      if (msg && msg.type === "CANCEL_FLOW_DOWNLOAD") {
        chrome.storage.session.get("pendingFlowDownloads")
          .then(stored => chrome.storage.session.set({ pendingFlowDownloads:
            (stored.pendingFlowDownloads || []).filter(entry => entry.token !== String(msg.token || "")) }))
          .then(() => sendResponse({ ok: true }))
          .catch(error => sendResponse({ ok: false, error: error.message }));
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  });
}
