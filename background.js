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
