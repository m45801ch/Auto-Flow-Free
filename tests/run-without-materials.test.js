const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
const match = source.match(/async function startBatch\(resumeIndex\) \{[\s\S]*?\n\}\n\nfunction stopBatch\(/);
assert.ok(match, 'startBatch exists');
const implementation = match[0].replace(/\n\nfunction stopBatch\($/, '');

const buttons = {
  btnRun: { classList: { add() {}, remove() {} } },
  btnStop: { classList: { add() {}, remove() {} } },
};
const sent = [];
let running = false;
const settings = {
  mode: 'text2video', materialNames: [],
  materialSelected: [], waitMin: 0, waitMax: 0,
};
const queue = [{ id: 0, text: 'A plain video prompt', status: 'pending' }];
const chrome = {
  scripting: { executeScript: async () => [] },
  tabs: { sendMessage: async (_tabId, message) => { sent.push(message); } },
};
const startBatch = new Function('env', `
  with (env) {
    ${implementation}
    return startBatch;
  }
`)({
  get running() { return running; }, set running(value) { running = value; },
  settings, queue, uploadedFrames: [], chrome,
  document: { getElementById: id => buttons[id] },
  updateQueueFromPrompts() {}, ensureFlowTab: async () => ({ id: 1 }),
  scanMaterials: async () => [], loadCheckpoint: () => null,
  renderPreview() {}, toast() {}, t: key => key,
  currentLang: 'zh-TW', stopBatch() {},
});

startBatch().then(() => {
  assert.equal(running, true, 'batch stays active with an empty material library');
  assert.equal(sent.length, 1, 'batch is sent to Flow');
  assert.equal(sent[0].type, 'START_BATCH');
  assert.deepEqual(sent[0].config.materialNames, []);
  console.log('empty material library does not stop batch');
}).catch(error => { console.error(error); process.exitCode = 1; });
