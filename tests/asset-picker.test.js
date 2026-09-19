const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'flow-automation.js'), 'utf8');
const match = source.match(/  async function tryAddMatchedAssets\(text, state = null\) \{[\s\S]*?\n  \}\n\n  \/\/ Frame handling/);
assert.ok(match, 'asset picker function exists');
const implementation = match[0].replace(/\n\n  \/\/ Frame handling$/, '');
const resolutionMatch = source.match(/  function setGenerationResolution\(\) \{[\s\S]*?\n  \}\n\n  \/\/ --------------- Add matched assets/);
assert.ok(resolutionMatch, 'generation resolution function exists');
const resolutionImplementation = resolutionMatch[0].replace(/\n\n  \/\/ --------------- Add matched assets$/, '');
const markedMatch = source.match(/  function markedNameInText\(text, name\) \{[\s\S]*?\n  \}\n  function charsInText/);
assert.ok(markedMatch, '@name matching function exists');
const markedImplementation = markedMatch[0].replace(/\n  function charsInText$/, '');
const materialsMatch = source.match(/  function materialsInText\(text\) \{[\s\S]*?\n  \}\n  \/\/ 角色＋素材聯集/);
assert.ok(materialsMatch, 'image library matching function exists');
const materialsImplementation = materialsMatch[0].replace(/\n  \/\/ 角色＋素材聯集$/, '');

function element(label, onClick = () => {}) {
  return {
    textContent: label,
    disabled: false,
    classList: { contains: () => false },
    children: [],
    parentElement: null,
    getAttribute(name) { return name === 'aria-label' ? label : null; },
    getBoundingClientRect() { return { width: 100, height: 30, top: 500, left: 0 }; },
    closest() { return null; },
    querySelectorAll() { return []; },
    click: onClick,
  };
}

async function run(charNames, imageNames, missingImage = false, plainPortal = false, directAdd = false, assetOnly = false, state = null, imageLabel = '海邊.png', misleadingClose = false, silentConfirm = false, composerThumbnail = false, removableThumbnail = false) {
  const events = [];
  let opened = false;
  let selected = false;
  let attached = false;
  const attachedMedia = [];
  let category = '角色';
  const plus = element('+', () => { opened = true; events.push('+'); });
  const promptParent = element('');
  const attachment = element('海邊');
  promptParent.querySelectorAll = () => attached && !composerThumbnail ? [plus, attachment] : [plus];
  const prompt = element('');
  prompt.parentElement = promptParent;
  if (composerThumbnail) {
    const middle1 = element('');
    const middle2 = element('');
    const composer = element('');
    const submit = element('arrow_forward');
    promptParent.parentElement = middle1;
    middle1.parentElement = middle2;
    middle2.parentElement = composer;
    composer.querySelectorAll = selector => {
      if (selector === "button, [role='button']") return [plus, submit];
      if (selector === 'img, video, canvas, picture') return attachedMedia;
      return [];
    };
  }
  // Model the editor content: confirm inserts the selected asset as a
  // mention, so textContent grows with each add (as in real Flow).
  const addedNames = [];
  let selectedName = '';
  Object.defineProperty(prompt, 'textContent', { get: () => addedNames.join(' '), configurable: true });
  const characterTab = element(plainPortal ? 'accessibility_new角色' : '角色', () => { category = '角色'; events.push('角色頁籤'); });
  const imageTab = element(plainPortal ? 'image圖像' : '圖像', () => { category = '圖像'; events.push('圖像頁籤'); });
  const character = element('小美', () => { selected = true; selectedName = '小美'; events.push('小美'); });
  const images = imageNames.map((name, index) => {
    const label = index === 0 ? imageLabel : name + '.png';
    return element(label, () => { selected = true; selectedName = label; attached = directAdd; events.push(label); });
  });
  const image = images[0];
  const confirm = element('添加到提示', () => {
    assert.equal(selected, true);
    selected = false;
    opened = false;
    attached = !silentConfirm; // confirm normally inserts the asset into the prompt editor
    if (selectedName && !silentConfirm && !composerThumbnail) addedNames.push(selectedName);
    if (selectedName && !silentConfirm && composerThumbnail) {
      const thumbnail = element('');
      thumbnail.getBoundingClientRect = () => ({ width: 48, height: 48, top: 500, left: 0 });
      attachedMedia.push(thumbnail);
    }
    events.push('確認');
  });
  const closeAdd = element('close 在提示詞輸入框新增素材', () => { opened = false; events.push('錯誤關閉'); });
  const removeThumbnail = element('close', () => {
    attachedMedia.pop();
    attached = attachedMedia.length > 0;
    events.push('移除既有附件');
  });
  const picker = element('');
  characterTab.parentElement = picker;
  imageTab.parentElement = picker;
  image.parentElement = picker;
  images.forEach(item => { item.parentElement = picker; });
  picker.querySelectorAll = selector => {
    if (selector.includes('mat-list-item') && selector.includes("[role='tab']")) return assetOnly ? [] : [characterTab, imageTab];
    if (selector.includes('mat-list-item') && selector.includes('li')) {
      return assetOnly ? [image] : (category === '角色' ? [character] : (missingImage ? [] : images));
    }
    if (selector === 'button, [role=\'button\']') return directAdd ? [] : (misleadingClose ? [closeAdd, confirm] : [confirm]);
    if (selector.includes("[role='button']") && !selector.includes("mat-list-item")) return directAdd ? [] : (misleadingClose ? [closeAdd, confirm] : [confirm]);
    return [];
  };
  const document = {
    querySelectorAll: selector => !opened ? [] :
      (plainPortal && selector.includes('dialog,') ? [] :
        (plainPortal && selector.includes('mat-list-item') ? (assetOnly ? [image] : [characterTab, imageTab]) : [picker])),
    body: { contains: () => true },
    dispatchEvent() {},
  };
  const deps = { document, findPromptTextarea: () => prompt,
    charsInText: () => charNames, materialsInText: () => imageNames,
    queryAllVisible: () => removableThumbnail && attachedMedia.length ? [removeThumbnail] : [],
    click: el => { el.click(); return true; },
    sleep: async () => {}, log: () => {}, KeyboardEvent: class {},
    cleanPromptText: t => (t || ''), setNativeValue: () => {}, verifyPromptFill: () => true,
  };
  const keys = Object.keys(deps);
  const fn = new Function(...keys, implementation + '\nreturn tryAddMatchedAssets;')(...keys.map(k => deps[k]));
  return { result: await fn('@小美 @海邊', state), events, mediaCount: attachedMedia.length };
}

(async () => {
  const markedNameInText = new Function('normBase', markedImplementation + '\nreturn markedNameInText;')(
    s => String(s || '').replace(/_/g, ' ').toLowerCase());
  assert.equal(markedNameInText('畫面有 @小美 和 @海邊.png', '小美'), true);
  assert.equal(markedNameInText('畫面有 @小美 和 @海邊.png', '海邊'), true);
  assert.equal(markedNameInText('畫面有 @小美 和海邊', '海邊'), false);
  assert.equal(markedNameInText('@Anna2', 'Anna'), false);
  const materialsInText = new Function('config', 'normBase', 'markedNameInText', 'charHitInContext', 'tokensSubset',
    materialsImplementation + '\nreturn materialsInText;')(
    { materialEnabled: true, materialSelected: ['舊圖片'], materialNames: ['海邊', '天空'] },
    s => String(s || '').replace(/_/g, ' ').toLowerCase(), markedNameInText, () => false, () => false);
  assert.deepEqual(materialsInText('請加入 @天空'), ['天空']);
  const explicitMaterials = new Function('config', 'normBase', 'markedNameInText', 'charHitInContext', 'tokensSubset',
    materialsImplementation + '\nreturn materialsInText;')(
    { materialEnabled: false, materialNames: ['海邊', '天空'] },
    s => String(s || '').replace(/_/g, ' ').toLowerCase(), markedNameInText, () => false, () => false);
  assert.deepEqual(explicitMaterials('請加入 @天空'), ['天空']);
  assert.deepEqual(explicitMaterials('請加入天空'), []);
  const good = await run(['小美'], ['海邊']);
  assert.equal(good.result, true);
  assert.deepEqual(good.events, ['+', '角色頁籤', '小美', '確認', '+', '圖像頁籤', '海邊.png', '確認']);
  const imageOnly = await run([], ['海邊']);
  assert.equal(imageOnly.result, true);
  assert.deepEqual(imageOnly.events, ['+', '圖像頁籤', '海邊.png', '確認']);
  const namedWithExtension = await run([], ['a2-loose-cables.png'], false, false, false, false, null, 'a2-loose-cables.png');
  assert.equal(namedWithExtension.result, true, 'scanned filename with extension must match its picker item');
  assert.deepEqual(namedWithExtension.events, ['+', '圖像頁籤', 'a2-loose-cables.png', '確認']);
  const closeButtonBeforeConfirm = await run([], ['海邊'], false, false, false, false, null, '海邊.png', true);
  assert.equal(closeButtonBeforeConfirm.result, true);
  assert.deepEqual(closeButtonBeforeConfirm.events, ['+', '圖像頁籤', '海邊.png', '確認']);
  const closedWithoutAttachment = await run([], ['海邊'], false, false, false, false, null, '海邊.png', false, true);
  assert.equal(closedWithoutAttachment.result, false, 'closing picker without an attachment is not success');
  const visualAttachment = await run([], ['海邊'], false, false, false, false, null, '海邊.png', false, false, true);
  assert.equal(visualAttachment.result, true, 'new composer thumbnail counts as an attached asset');
  const noVisualAttachment = await run([], ['海邊'], false, false, false, false, null, '海邊.png', false, true, true);
  assert.equal(noVisualAttachment.result, false, 'composer without a new thumbnail still fails');
  const twoVisualAttachments = await run([], ['海邊', '山谷'], false, false, false, false, null, '海邊.png', false, false, true, true);
  assert.equal(twoVisualAttachments.result, true);
  assert.equal(twoVisualAttachments.mediaCount, 2, 'adding the next asset must retain the first thumbnail');
  const portal = await run(['小美'], ['海邊'], false, true);
  assert.equal(portal.result, true);
  const direct = await run([], ['海邊'], false, true, true);
  assert.equal(direct.result, true);
  const recentAssetMenu = await run([], ['海邊'], false, true, true, true);
  assert.equal(recentAssetMenu.result, true);
  const missing = await run(['小美'], ['海邊'], true);
  assert.equal(missing.result, false);
  assert.equal(missing.events.filter(e => e === '確認').length, 1);
  const retryState = { addedAssetKeys: new Set(['character:小美']) };
  const resumed = await run(['小美'], ['海邊'], false, false, false, false, retryState);
  assert.equal(resumed.result, true);
  assert.deepEqual(resumed.events, ['+', '圖像頁籤', '海邊.png', '確認']);
  const clicked = [];
  const option = element('720p');
  option.matches = () => true;
  const resolution = new Function('config', 'queryAllVisible', 'document', 'click', 'log',
    resolutionImplementation + '\nreturn setGenerationResolution;')(
    { generationRes: '720p' }, () => [option], {}, el => clicked.push(el.textContent), () => {});
  resolution();
  assert.deepEqual(clicked, ['720p']);

  // Confirm-button matcher must recognize the character-preview-card confirm,
  // whose composer + button relabels to "在提示詞輸入框新增素材" (seen in the
  // 2026-09-19 Flow logs). It must NOT match the plain composer + button
  // ("新增媒體選單") or generic add buttons, or the + finder would click the
  // wrong element.
  const confirmReMatch = source.match(/ {4}const confirmRe = (\/.*?\/[a-z]*);/);
  assert.ok(confirmReMatch, 'confirm regex exists');
  const confirmRe = new Function('return ' + confirmReMatch[1])();
  for (const label of ['新增至提示詞', '添加到提示', '加入提示', '在提示詞輸入框新增素材',
      '在提示詞新增素材', '新增素材至提示詞', 'Add to prompt', 'add asset to prompt']) {
    assert.equal(confirmRe.test(label), true, 'confirmRe should match: ' + label);
  }
  for (const label of ['新增媒體選單', '新增媒體', 'add', 'cancel', '關閉', '開始生成', '設定觸發條件']) {
    assert.equal(confirmRe.test(label), false, 'confirmRe should NOT match: ' + label);
  }

  console.log('asset picker regression tests passed');
})().catch(err => { console.error(err); process.exitCode = 1; });
