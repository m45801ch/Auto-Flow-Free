const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'flow-automation.js'), 'utf8');
const match = source.match(/    function buildAgentPrompt\(text\) \{[\s\S]*?\n    \}\n\n    \/\/ Set options/);
assert.ok(match, 'Agent output instruction builder exists');
const implementation = match[0].replace(/\n\n    \/\/ Set options$/, '');
const buildAgentPrompt = new Function('config', 'cleanPromptText', implementation + '\nreturn buildAgentPrompt;')(
  { agentOutput: 'image' }, text => String(text || '').trim());

assert.match(buildAgentPrompt('一隻在月球散步的貓'), /建立圖片/);
assert.match(buildAgentPrompt('一隻在月球散步的貓'), /一隻在月球散步的貓/);
const videoPrompt = new Function('config', 'cleanPromptText', implementation + '\nreturn buildAgentPrompt;')(
  { agentOutput: 'video' }, text => String(text || '').trim())('海浪拍打岩岸');
assert.match(videoPrompt, /建立影片/);
const videoWins = new Function('config', 'cleanPromptText', implementation + '\nreturn buildAgentPrompt;')(
  { agentOutput: 'video' }, text => String(text || '').trim())('請建立圖片：一隻在月球散步的貓');
assert.match(videoWins, /建立影片/);
assert.doesNotMatch(videoWins, /建立圖片/);
console.log('agent output instruction regression test passed');
