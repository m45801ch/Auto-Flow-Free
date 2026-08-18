// Flow Automation — background service worker
// Makes the toolbar icon open the side panel (split view on the right) instead of a popup.

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
const FLOW_RE = /labs\.google\/fx\/(?:[^/]+\/)?tools\/flow/i;
let lastBroadcastOnFlow = null;

async function getFlowState() {
  try {
    // Any active tab in any window that is not an extension page
    const activeTabs = await chrome.tabs.query({ active: true });
    const extFree = (activeTabs || []).filter(t => !(t?.url || "").startsWith("chrome-extension://"));
    const onActive = extFree.length > 0 && FLOW_RE.test(extFree[0].url || "");
    const flowTabs = await chrome.tabs.query({ url: "*://labs.google/fx/*/tools/flow*" });
    return onActive || flowTabs.length > 0;
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
    } catch (e) { /* ignore */ }
    return false;
  });
}
