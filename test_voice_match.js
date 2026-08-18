// Voice name matching test — mirrors flow-automation.js engine
const VOICES = [
  { name: "Achernar", gender: "female" }, { name: "Achird", gender: "male" },
  { name: "Algenib", gender: "male" }, { name: "Algieba", gender: "male" },
  { name: "Alnilam", gender: "male" }, { name: "Aoede", gender: "female" },
  { name: "Autonoe", gender: "female" }, { name: "Callirrhoe", gender: "female" },
  { name: "Charon", gender: "male" }, { name: "Despina", gender: "female" },
  { name: "Enceladus", gender: "male" }, { name: "Erinome", gender: "female" },
  { name: "Fenrir", gender: "male" }, { name: "Gacrux", gender: "female" },
  { name: "Iapetus", gender: "male" }, { name: "Kore", gender: "female" },
  { name: "Laomedeia", gender: "female" }, { name: "Leda", gender: "female" },
  { name: "Orus", gender: "male" }, { name: "Pulcherrima", gender: "female" },
  { name: "Puck", gender: "male" }, { name: "Rasalgethi", gender: "male" },
  { name: "Sadachbia", gender: "male" }, { name: "Sadaltager", gender: "male" },
  { name: "Schedar", gender: "male" }, { name: "Sulafat", gender: "female" },
  { name: "Umbriel", gender: "male" }, { name: "Vindemiatrix", gender: "female" },
  { name: "Zephyr", gender: "female" }, { name: "Zubenelgenubi", gender: "male" },
];

function norm(s) { return (s || "").replace(/_/g, " ").toLowerCase(); }
function tokens(s) {
  return ((s || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")
    .toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, " ").split(/\s+/).filter(Boolean));
}
function tokensSubset(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (ta.length === 0 || tb.length === 0 || ta.length > tb.length) return false;
  for (let i = 0; i <= tb.length - ta.length; i++) {
    let ok = true;
    for (let j = 0; j < ta.length; j++) { if (tb[i + j] !== ta[j]) { ok = false; break; } }
    if (ok) return true;
  }
  return false;
}
function charHitInContext(p, nn, allNames) {
  if (!nn || !p.includes(nn)) return false;
  const isCJK = /[\u4e00-\u9fff]/.test(nn);
  const others = allNames.map(m => norm(m)).filter(m => m && m !== nn && m.includes(nn));
  const occs = [];
  let idx = p.indexOf(nn);
  while (idx !== -1) {
    const before = idx > 0 ? p[idx - 1] : null;
    const after = idx + nn.length < p.length ? p[idx + nn.length] : null;
    let absorbed = false;
    const isWordChar = ch => ch !== null && /[\w\u4e00-\u9fff]/.test(ch);
    if (isCJK) {
      if (isWordChar(before) || isWordChar(after)) absorbed = others.length > 0 && others.some(m => p.includes(m));
    } else {
      if (isWordChar(before) || isWordChar(after)) absorbed = true;
    }
    occs.push(!absorbed);
    idx = p.indexOf(nn, idx + 1);
  }
  return occs.some(hit => hit);
}
function voiceNamesInText(text) {
  const p = norm(text);
  const allNames = VOICES.map(v => v.name);
  return allNames.filter(n => charHitInContext(p, norm(n), allNames) || tokensSubset(norm(n), p));
}

const cases = [
  { t: "Zephyr 在風中輕唱", exp: ["Zephyr"], name: "基本中文句子命中 Zephyr" },
  { t: "The narrator Zephyr speaks softly in the forest", exp: ["Zephyr"], name: "英文句子命中 Zephyr" },
  { t: "用 Sadachbia 的聲音朗讀，然後換 Fenrir", exp: ["Sadachbia", "Fenrir"], name: "一段提示詞多個語音名", unordered: true },
  { t: "Achird's car drove past", exp: ["Achird"], name: "英文 ' 為邊界字元：Achird's 中 'Achird' 獨立成詞 → 命中（設計上可接受，Flow 語音名不含撇號）" },
  { t: "Achird 開車經過", exp: ["Achird"], name: "Achird 中文名正常使用" },
  { t: "Zephyr-like wind", exp: ["Zephyr"], name: "英文連字號 - 為邊界字元：Zephyr-like 中 'Zephyr' 獨立成詞 → 命中（設計上可接受）" },
  { t: "請用 Achernar 講述小紅帽的故事", exp: ["Achernar"], name: "Achernar 中文正常" },
  { t: "今天天氣很好，沒有提到任何語音", exp: [], name: "無語音名不誤配" },
  { t: "CHARON，用低沉的聲音", exp: ["Charon"], name: "大小寫 Charon" },
  { t: "Zubenelgenubi 的尾音拖長", exp: ["Zubenelgenubi"], name: "長名 Zubenelgenubi" },
  { t: "Vindemiatrix 和 Orus 對話", exp: ["Vindemiatrix", "Orus"], name: "兩個語音名同段", unordered: true },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const got = voiceNamesInText(c.t);
  let ok = JSON.stringify(got) === JSON.stringify(c.exp);
  if (!ok && c.unordered) ok = got.length === c.exp.length && c.exp.every(e => got.includes(e));
  if (ok) { pass++; console.log(`PASS ${c.name} → [${got.join(", ")}]`); }
  else { fail++; console.log(`FAIL ${c.name}\n  prompt: ${c.t}\n  expected: [${c.exp.join(", ")}]\n  got:      [${got.join(", ")}]`); }
}
console.log(`\n${pass} passed, ${fail} failed`);

// defaultVoice fallback
const t2 = "今天天氣很好";
const matched = voiceNamesInText(t2);
const target = matched.length > 0 ? matched[0] : "Achernar";
console.log("\nFallback test: no match → defaultVoice =", target, target === "Achernar" ? "✓" : "✗");

// 錯誤匹配風險掃描：每個語音名作為子字串在別的語音名中出現的組合
console.log("\nPrefix risk check (voice names appearing inside other names):");
for (const a of VOICES) {
  for (const b of VOICES) {
    if (a.name === b.name) continue;
    if (a.name.toLowerCase().includes(b.name.toLowerCase())) console.log(`  ${b.name} inside ${a.name}`);
  }
}
console.log("(none printed = no prefix risk)");
