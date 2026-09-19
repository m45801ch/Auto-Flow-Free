const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const popupHtml = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
const popupJs = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');
const automation = fs.readFileSync(path.join(root, 'flow-automation.js'), 'utf8');

assert.doesNotMatch(popupHtml, /value="veo2-/i, 'Veo 2 is not selectable');
assert.doesNotMatch(popupHtml, /veo3\.1-lite-low/i, 'retired lower-priority Lite option is not selectable');
assert.match(popupHtml, /Omni 1\.1 Flash/, 'current Omni model label is shown');
assert.doesNotMatch(automation, /"veo2-/i, 'Veo 2 has no Flow model mapping');
assert.match(popupJs, /veo2-fast[\s\S]*veo3\.1-fast/, 'saved Veo 2 settings migrate to a supported model');
assert.match(automation, /clean\.includes\(targetLower\)/, 'Flow model fallback matches the selected model name');
assert.doesNotMatch(automation, /clean\.includes\("veo"\) && clean\.includes\("lite"\)/, 'Flow model fallback is not locked to Veo Lite');
assert.match(automation, /async function setModel\(\)/, 'model selection waits for Flow to render its dropdown');
assert.match(automation, /if \(!await setModel\(\)\) throw new Error\("Flow model could not be selected"\)/, 'the batch stops instead of silently using the wrong model');
assert.match(automation, /document\.querySelectorAll\("button, \[role='button'\]"\)/, 'model selection scans regular Flow buttons as well as component content');
assert.match(automation, /Model click did not apply:/, 'a clicked menu item is verified before the batch continues');
console.log('supported video model regression test passed');
