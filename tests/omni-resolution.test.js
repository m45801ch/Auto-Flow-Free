const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
const popup = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');

assert.match(html, /id="generationResCard"/, 'resolution card can be shown only for Omni');
assert.match(html, /value="360p"/, '360p is available for Omni');
assert.match(html, /value="720p"/, '720p is available for Omni');
assert.match(popup, /function updateGenerationResolutionUI()/, 'model selection controls resolution visibility');
assert.match(popup, /settings\.model === "omni-flash" \?/, 'only Omni sends a generation resolution to Flow');
console.log('Omni resolution regression test passed');
