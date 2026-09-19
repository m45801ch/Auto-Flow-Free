const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'flow-automation.js'), 'utf8');
const switchMatch = source.match(/  async function ensureOutputMode\(kind\) \{[\s\S]*?\n  \}\n\n  function setAspect/);
assert.ok(switchMatch, 'creation mode switch exists');
const switchCode = switchMatch[0].replace(/\n\n  function setAspect$/, '');
const detectMatch = source.match(/  function detectFlowMode\(\) \{[\s\S]*?\n  \}\n\n  function validateAndFixMode/);
assert.ok(detectMatch, 'Flow mode detector exists');
const detectCode = detectMatch[0].replace(/\n\n  function validateAndFixMode$/, '');

function option(label, change) {
  return {
    textContent: label,
    getBoundingClientRect: () => ({ width: 120, height: 40, top: 700 }),
    closest: () => null,
    click: change,
  };
}

async function switchMode(current, target, allowChange = true) {
  let actual = current;
  const image = option('圖片', () => { if (allowChange) actual = 'image'; });
  const video = option('影片', () => { if (allowChange) actual = 'video'; });
  const fn = new Function('detectFlowMode', 'queryAllVisible', 'document', 'click', 'sleep', 'log',
    switchCode + '\nreturn ensureOutputMode;')(
    () => actual, () => [image, video], {}, el => el.click(), async () => {}, () => {});
  return { success: await fn(target), actual };
}

function detect(label, unrelated = [], narrowEditor = false) {
  const button = option(label, () => {});
  button.getBoundingClientRect = () => ({ width: 160, height: 36, top: 920, left: 700 });
  button.getAttribute = () => null;
  button.classList = { contains: () => false };
  const prompt = { getBoundingClientRect: () => ({ top: 860, bottom: 910, left: 350, right: narrowEditor ? 500 : 1000 }) };
  if (narrowEditor) prompt.parentElement = { parentElement: null, querySelectorAll: () => [button, ...unrelated] };
  const document = { body: {}, documentElement: { clientHeight: 1000 }, querySelectorAll: () => [...unrelated, button] };
  return new Function('document', 'window', 'findPromptTextarea', detectCode + '\nreturn detectFlowMode;')(
    document, { innerHeight: 1000 }, () => prompt)();
}

(async () => {
  assert.equal(detect('Nano Banana 2'), 'image');
  assert.equal(detect('Veo 3.1'), 'video');
  assert.equal(detect('圖像'), 'image');
  assert.equal(detect('影片'), 'video');
  const galleryCard = option('image 圖像 a4-maintenance-bay', () => {});
  galleryCard.getBoundingClientRect = () => ({ width: 180, height: 42, top: 760, left: 650 });
  galleryCard.getAttribute = () => null;
  assert.equal(detect('影片 · 720p · 8 秒 x1', [galleryCard]), 'video');
  assert.equal(detect('🍌 Nano Banana 2 · 1:1 · x1', [galleryCard], true), 'image');
  assert.deepEqual(await switchMode('video', 'image'), { success: true, actual: 'image' });
  assert.deepEqual(await switchMode('image', 'video'), { success: true, actual: 'video' });
  assert.deepEqual(await switchMode(null, 'image'), { success: true, actual: 'image' });
  assert.deepEqual(await switchMode('video', 'image', false), { success: false, actual: 'video' });
  console.log('creation mode switch regression tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
