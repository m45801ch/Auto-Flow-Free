const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'flow-automation.js'), 'utf8');
const match = source.match(/  async function enableAgentMode\(\) \{[\s\S]*?\n  \}\n\n  \/\/ Choose the creation type/);
assert.ok(match, 'Agent mode activator exists');
const implementation = match[0].replace(/\n\n  \/\/ Choose the creation type$/, '');

function button(label, rect, initial = false) {
  let active = initial;
  return {
    textContent: label,
    disabled: false,
    getBoundingClientRect: () => rect,
    getAttribute: name => name === 'aria-pressed' ? String(active) : null,
    classList: { contains: () => false },
    closest: () => null,
    click: () => { active = true; },
  };
}

(async () => {
  const agent = button('Agent', { left: 550, top: 1067, width: 63, height: 28 });
  const galleryAgent = button('Agent', { left: 40, top: 400, width: 100, height: 40 });
  const prompt = { getBoundingClientRect: () => ({ left: 300, right: 1040, top: 1000, bottom: 1055 }) };
  const enableAgentMode = new Function('document', 'findPromptTextarea', 'queryAllVisible', 'click', 'sleep', 'log',
    implementation + '\nreturn enableAgentMode;')(
    {}, () => prompt, () => [galleryAgent, agent], el => { el.click(); return true; }, async () => {}, () => {});

  assert.equal(await enableAgentMode(), true);
  assert.equal(agent.getAttribute('aria-pressed'), 'true', 'the composer Agent button is enabled');
  assert.equal(galleryAgent.getAttribute('aria-pressed'), 'false', 'unrelated Agent controls are ignored');
  console.log('agent mode activation regression test passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
