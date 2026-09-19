const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
const match = source.match(/async function scanFlowMaterialsInject\(\) \{[\s\S]*?\n\}\n\/\/ Silent headless scan/);
assert.ok(match, 'Flow image library scanner exists');
const implementation = match[0].replace(/\n\/\/ Silent headless scan$/, '');

const body = { tagName: 'BODY' };
let activeTab = '建立';
let imageMode = true;
let captionMode = false;
let missingImageTab = false;
let tileMode = false;
const tabsParent = { children: [] };
function node(text = '') {
  return {
    tagName: 'DIV', textContent: text, children: [], parentElement: null,
    getAttribute() { return null; },
    getBoundingClientRect() { return { width: 150, height: 120 }; },
    closest() { return null; },
    querySelectorAll() { return []; },
    classList: { contains() { return false; } },
  };
}
const createTab = node('建立');
createTab.parentElement = tabsParent;
createTab.getBoundingClientRect = () => ({ width: 150, height: 60 });
createTab.isConnected = true;
createTab.getAttribute = key => key === 'aria-selected' && activeTab === '建立' ? 'true' : null;
createTab.click = () => { activeTab = '建立'; };
const imageTab = node('image圖像');
imageTab.parentElement = tabsParent;
imageTab.getBoundingClientRect = () => ({ width: 150, height: 60 });
tabsParent.children = [createTab, imageTab];
imageTab.getAttribute = key => key === 'aria-selected' && activeTab === '圖像' ? 'true' : null;
imageTab.click = () => { activeTab = '圖像'; };

const img = node('');
img.tagName = 'IMG';
img.src = 'https://example.test/image.png';
img.getBoundingClientRect = () => ({ width: 120, height: 120 });
const icon = node('');
icon.tagName = 'IMG';
icon.src = 'https://example.test/icon.png';
icon.getBoundingClientRect = () => ({ width: 16, height: 16 });
const wrapper = node('');
wrapper.querySelectorAll = selector => selector === 'img[src]' ? [img] : [img];
const title = node('海邊.png');
const card = node('海邊.png');
card.querySelectorAll = selector => selector === 'img[src]' ? [img, icon] : [img, icon, title];
img.parentElement = wrapper;
wrapper.parentElement = card;
card.parentElement = body;
const canvas = node('');
canvas.tagName = 'CANVAS';
const cssCard = node('a4-maintenance-bay');
cssCard.getBoundingClientRect = () => ({ width: 240, height: 190, left: 350 });
cssCard.querySelector = selector => selector.includes('canvas') ? canvas : null;
cssCard.querySelectorAll = () => [];
cssCard.parentElement = body;
const caption = node('a4-maintenance-bay');
caption.getBoundingClientRect = () => ({ width: 170, height: 20, left: 360 });
caption.parentElement = cssCard;
const flowTile = node('a4-maintenance-bay');
flowTile.tagName = 'FLOW-GRID-TILE-CONTAINER';
flowTile.getBoundingClientRect = () => ({ width: 240, height: 190, left: 350 });
flowTile.getAttribute = key => key === 'aria-label' ? 'a4-maintenance-bay' : null;
flowTile.querySelector = () => null;
flowTile.parentElement = body;

const document = {
  body,
  querySelectorAll(selector) {
    if (selector === "button, [role='tab'], [role='button'], [role='link'], a, li, span, div") return missingImageTab ? [createTab] : [createTab, imageTab];
    if (selector === 'img[src]') return activeTab === '圖像' && imageMode ? [img] : [];
    if (selector === 'span, figcaption, p, div') return activeTab === '圖像' && captionMode ? [caption] : [];
    if (selector === "flow-grid-tile-container[aria-label], [data-testid*='grid-tile'][aria-label]") return activeTab === '圖像' && tileMode ? [flowTile] : [];
    return [];
  },
};
const scan = new Function('document', 'setTimeout', implementation + '\nreturn scanFlowMaterialsInject;')(
  document, callback => callback());

scan().then(async result => {
  assert.deepEqual(result.map(item => item.name), ['海邊']);
  assert.equal(activeTab, '建立');
  imageMode = false;
  captionMode = true;
  const captions = await scan();
  assert.deepEqual(captions.map(item => item.name), ['a4-maintenance-bay']);
  assert.equal(activeTab, '建立');
  missingImageTab = true;
  activeTab = '圖像';
  assert.deepEqual((await scan()).map(item => item.name), ['a4-maintenance-bay']);
  imageMode = false;
  captionMode = false;
  tileMode = true;
  assert.deepEqual((await scan()).map(item => item.name), ['a4-maintenance-bay']);
  console.log('material scan regression test passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
