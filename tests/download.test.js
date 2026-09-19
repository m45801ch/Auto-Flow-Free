const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const popup = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
const flow = fs.readFileSync(path.join(root, 'flow-automation.js'), 'utf8');
const background = fs.readFileSync(path.join(root, 'background.js'), 'utf8');

assert.match(html, /id="autoDownloadToggle"/, 'download switch is visible');
assert.match(popup, /autoDownload: settings\.autoDownload !== false/, 'switch reaches the Flow batch config');
assert.match(flow, /if \(config\.autoDownload === false\).*return/, 'disabled downloads do not start a watcher');
assert.match(flow, /mediaBefore = snapshotMedia\(\);\s*click\(submit\)/, 'reference uploads are excluded before submission');

let onMessage;
let onFilename;
let onChanged;
let downloaded;
let tabMessage;
let sessionValues = {};
const chrome = {
  runtime: { onInstalled: { addListener() {} }, onStartup: { addListener() {} },
    onMessage: { addListener(fn) { onMessage = fn; } } },
  sidePanel: { setPanelBehavior: async () => {} },
  tabs: { onUpdated: { addListener() {} }, onActivated: { addListener() {} },
    sendMessage: async (_id, message) => { tabMessage = message; } },
  windows: { onFocusChanged: { addListener() {} } },
  alarms: { create() {}, onAlarm: { addListener() {} } },
  storage: { session: {
    get: async key => ({ [key]: sessionValues[key] }),
    set: async values => { sessionValues = { ...sessionValues, ...values }; },
  } },
  downloads: {
    download: async options => { downloaded = options; return 42; },
    onDeterminingFilename: { addListener(fn) { onFilename = fn; } },
    onChanged: { addListener(fn) { onChanged = fn; } },
  },
};
vm.runInNewContext(background, { chrome, setTimeout: () => 0 }, { filename: 'background.js' });

function send(message, sender = {}) {
  return new Promise(resolve => onMessage(message, sender, resolve));
}

(async () => {
  const direct = await send({ type: 'DOWNLOAD_MEDIA', url: 'https://flow.google.com/video.mp4', filename: 'project/day-1/1.mp4' }, { tab: { id: 7 } });
  assert.equal(direct.ok, true);
  assert.equal(downloaded.filename, 'project/day-1/1.mp4', 'Chrome receives the subfolder path');
  assert.equal(downloaded.saveAs, false);
  onChanged({ id: 42, error: { current: 'SERVER_BAD_CONTENT' } });
  assert.equal(tabMessage.type, 'DOWNLOAD_MEDIA_FAILED', 'interrupted downloads trigger the page fallback');
  assert.equal((await send({ type: 'DOWNLOAD_MEDIA', url: 'https://x/a', filename: '../escape.mp4' })).ok, false);

  const blobUrl = 'blob:https://flow.google.com/generated-video';
  assert.equal((await send({ type: 'REGISTER_BLOB_DOWNLOAD', url: blobUrl, filename: 'project/2.mp4' })).ok, true);
  let suggestion;
  onFilename({ url: blobUrl }, value => { suggestion = value; });
  assert.equal(suggestion.filename, 'project/2.mp4', 'blob fallback retains the requested folder');

  assert.equal((await send({ type: 'REGISTER_FLOW_DOWNLOAD', token: 'quality-1',
    filename: 'project/3.png', kind: 'image' }, { tab: { id: 7 } })).ok, true);
  vm.runInNewContext(background, { chrome, setTimeout: () => 0 }, { filename: 'background.js' });
  await new Promise(resolve => onFilename({ id: 60, url: 'https://flow.google.com/generated',
    referrer: 'https://flow.google.com/project/1', mime: 'image/jpeg' }, value => {
    suggestion = value; resolve();
  }));
  assert.equal(suggestion.filename, 'project/3.jpg', 'Flow quality choice survives a background worker restart');
  assert.equal(tabMessage.type, 'FLOW_DOWNLOAD_STARTED');

  const source = flow.match(/  function findGeneratedMedia\(root = document\) \{[\s\S]*?\n  \}\n  function snapshotMedia/);
  assert.ok(source, 'deep result scanner exists');
  const scan = new Function('document', source[0].replace(/\n  function snapshotMedia$/, '') + '\nreturn findGeneratedMedia;');
  const nestedImage = { tagName: 'IMG', src: 'https://flow.google.com/new.png' };
  const shadowRoot = { querySelectorAll: selector => selector === 'video, img' ? [nestedImage] : [] };
  const page = { querySelectorAll: selector => selector === 'video, img' ? [] : [{ shadowRoot }] };
  assert.deepEqual(scan(page)(), [nestedImage], 'generated media inside Shadow DOM is found');

  const saveMatch = flow.match(/  async function autoDownload\(url, item, isImage, media\) \{[\s\S]*?\n  \}\n\n  async function downloadAtFlowQuality/);
  assert.ok(saveMatch, 'media save routine exists');
  const selections = [];
  const save = new Function('config', 'downloadAtFlowQuality', 'log', 'logError',
    'let qualityDownloadLock = Promise.resolve();\n' +
    saveMatch[0].replace(/\n\n  async function downloadAtFlowQuality$/, '') + '\nreturn autoDownload;')(
    { folder: 'project/scene', rename: true, videoRes: '720p' },
    async (...args) => { selections.push(args); return true; }, () => {}, () => {});
  assert.equal(await save('https://flow.google.com/media/video.mp4', { id: 0 }, false, {}), true);
  assert.equal(selections[0][1], '720p');
  assert.equal(selections[0][3], 'project/scene/1.mp4');
  assert.equal(await save('https://flow.google.com/media/poster.png', { id: 1 }, false, {}), true);
  assert.equal(selections[1][3], 'project/scene/2.mp4', 'video cards may be detected through image posters');

  const qualityMatch = flow.match(/  async function downloadAtFlowQuality\(media, quality, isImage, filename\) \{[\s\S]*?\n  \}\n\n  async function fallbackDownload/);
  assert.ok(qualityMatch, 'Flow quality menu selection exists');
  async function selectQuality(choice, disabled = false, isImage = true) {
    let state = 'card';
    const waiters = new Map();
    const element = (text, role = 'button') => ({
      textContent: text, parentElement: null, disabled: disabled && text.startsWith(choice.toUpperCase()),
      className: '',
      getBoundingClientRect: () => ({ width: 170, height: 42 }),
      getAttribute: name => name === 'role' ? role : null,
      matches: () => true,
      dispatchEvent: () => { if (text.includes('下載')) state = 'quality'; },
    });
    const card = { parentElement: null, getRootNode: () => ({ host: null }) };
    const media = { parentElement: card };
    const trigger = element('more_vert');
    const downloadMenu = element('download下載');
    const option = element(choice.toUpperCase() + ' 已提升畫質', 'menuitem');
    const doc = { body: {} };
    const calls = [];
    const choose = new Function('queryAllVisible', 'document', 'click', 'sleep', 'MouseEvent', 'PointerEvent',
      'chrome', 'qualityDownloadWaiters', 'log', 'getComputedStyle', 'setTimeout', 'clearTimeout',
      qualityMatch[0].replace(/\n\n  async function fallbackDownload$/, '') + '\nreturn downloadAtFlowQuality;')(
      root => root === card ? [trigger] : state === 'card' ? [] : state === 'main' ? [downloadMenu] : [option],
      doc,
      el => {
        if (el === trigger) state = 'main';
        else if (el === downloadMenu) state = 'quality';
        else if (el === option) for (const done of waiters.values()) done({ id: 61, filename: 'project/1.png' });
      },
      async () => {}, class MouseEvent {}, class PointerEvent {},
      { runtime: { sendMessage: async request => { calls.push(request); return { ok: true }; } } },
      waiters, () => {}, () => ({ pointerEvents: 'auto' }), setTimeout, clearTimeout);
    return { result: choose(media, choice, isImage, isImage ? 'project/1.png' : 'project/1.mp4'), calls };
  }
  const imageChoice = await selectQuality('2k');
  assert.equal(await imageChoice.result, true);
  assert.equal(imageChoice.calls[0].type, 'REGISTER_FLOW_DOWNLOAD');
  const videoChoice = await selectQuality('1080p', false, false);
  assert.equal(await videoChoice.result, true);
  assert.equal(videoChoice.calls[0].kind, 'video');
  const unavailable = await selectQuality('4k', true);
  await assert.rejects(unavailable.result, /unavailable/);
  assert.equal(unavailable.calls.length, 0, 'disabled 4K never starts a download');
  console.log('generated media download regression tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
