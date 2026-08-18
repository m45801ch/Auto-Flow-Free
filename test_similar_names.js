// 相似/易混淆角色名匹配測試（v1.6）— 完全同步 flow-automation.js 的匹配引擎
// 與 tryAutoCharImages 分派行為

function norm(s) {
  return (s || "").toLowerCase().replace(/_/g, " ");
}

function camSplit(s) {
  const parts = [];
  const re = /([A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z])|[A-Z]+|[a-z]+|[\u4e00-\u9fff]+|[^A-Za-z\u4e00-\u9fff]+)/g;
  let m;
  while ((m = re.exec(s)) !== null) parts.push(m[1]);
  return parts;
}

function tokens(s) {
  const words = camSplit(s).map(w => (/[\u4e00-\u9fff]/.test(w) ? w : w.toLowerCase()));
  const parts = [];
  for (const w of words) {
    for (const p of w.split(/[^A-Za-z0-9\u4e00-\u9fff]+/)) if (p) parts.push(p);
  }
  return parts;
}

function tokensSubset(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0 || ta.length > tb.length) return false;
  for (let i = 0; i <= tb.length - ta.length; i++) {
    let ok = true;
    for (let j = 0; j < ta.length; j++) {
      if (tb[i + j] !== ta[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

// charHitInContext(p, nn, allNames) — 與 flow-automation.js 參數順序/邏輯完全一致
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
      if (isWordChar(before) || isWordChar(after)) {
        absorbed = others.length > 0 && others.some(m => p.includes(m));
      }
    } else {
      if (isWordChar(before) || isWordChar(after)) {
        absorbed = true;
      }
    }
    occs.push(!absorbed);
    idx = p.indexOf(nn, idx + 1);
  }
  return occs.some(hit => hit);
}

let allCharNames = []; // config.charNames 模擬

function charsInText(text) {
  const p = norm(text);
  return allCharNames.filter(n => {
    const nn = norm(n);
    if (!nn) return false;
    return charHitInContext(p, nn, allCharNames) || tokensSubset(nn, p) || tokensSubset(n, text);
  });
}

function charMatched(fileName, names) {
  const base = norm((fileName || "").replace(/\.[^.]+$/, ""));
  if (!base) return false;
  // 與 flow-automation.js 一致：吸收用全部已知角色名單
  const allNorm = allCharNames.map(m => norm(m)).filter(Boolean);
  return names.some(n => {
    const nn = norm(n);
    if (!nn) return false;
    const tb = tokens(base);
    const ta = tokens(nn);
    if (ta.length === 0 || tb.length === 0 || ta.length > tb.length) return false;
    for (let i = 0; i <= tb.length - ta.length; i++) {
      let ok = true;
      for (let j = 0; j < ta.length; j++) {
        if (tb[i + j] !== ta[j]) { ok = false; break; }
      }
      if (!ok) continue;
      const others = allNorm.filter(m => m !== nn && m.includes(nn));
      let absorbed = false;
      if (others.length > 0) {
        for (const m of others) {
          const tm = tokens(m);
          if (tm.length <= ta.length) continue;
          if (i - (tm.length - ta.length) >= 0) {
            let ext = true;
            for (let k = 0; k < tm.length; k++) {
              if (tb[i - (tm.length - ta.length) + k] !== tm[k]) { ext = false; break; }
            }
            if (ext) { absorbed = true; break; }
          }
          if (i + tm.length <= tb.length) {
            let ext = true;
            for (let k = 0; k < tm.length; k++) {
              if (tb[i + k] !== tm[k]) { ext = false; break; }
            }
            if (ext) { absorbed = true; break; }
          }
        }
      }
      if (!absorbed) return true;
    }
    return false;
  });
}

// tryAutoCharImages 行為模擬：每段用「該段圖片池」先匹配，池內無則從全部補選
function tryAutoCharImages(text, pool, allFrames) {
  const textChars = charsInText(text);
  if (textChars.length === 0) return { hit: [], picked: [] };
  const seen = new Set();
  const picked = [];
  for (const ch of textChars) {
    const poolHits = pool.filter(f => charMatched(f, [ch]));
    const hits = poolHits.length > 0 ? poolHits : allFrames.filter(f => charMatched(f, [ch]));
    hits.forEach(f => {
      if (!seen.has(f)) { seen.add(f); picked.push(f); }
    });
  }
  return { hit: textChars, picked };
}

// 案例 A：中文相似名
(() => {
  console.log("=== 案例 A：龍 vs 小龍 vs 紅龍 vs 阿龍 ===");
  allCharNames = ["龍", "小龍", "紅龍", "阿龍"];
  const all = ["龍_全身.png", "小龍_幼年.png", "紅龍_側面.png", "阿龍_背影.png", "背景_森林.png"];
  // 模擬 5 段各分配到一張（偵數模式每段一張輸入）：段0=龍, 段1=小龍, 段2=紅龍, 段3=阿龍, 段4=背景
  const pools = [["龍_全身.png"], ["小龍_幼年.png"], ["紅龍_側面.png"], ["阿龍_背影.png"], ["背景_森林.png"]];
  const segs = [
    { t: "龍在夜空中飛翔，穿越雲層。", expect: ["龍_全身.png"] },
    { t: "小龍在草地上玩耍，追逐蝴蝶。", expect: ["小龍_幼年.png"] },
    { t: "紅龍噴出火焰，照亮了夜空。", expect: ["紅龍_側面.png"] },
    { t: "阿龍走在小巷裡，回頭看了一眼。", expect: ["阿龍_背影.png"] },
    { t: "森林裡一片寂靜，沒有人出現。", expect: [] },
  ];
  let pass = true;
  segs.forEach((seg, i) => {
    const { hit, picked } = tryAutoCharImages(seg.t, pools[i], all);
    const ok = JSON.stringify(picked.sort()) === JSON.stringify(seg.expect.sort());
    pass = pass && ok;
    console.log(`  段${i + 1}「${seg.t.slice(0, 10)}…」命中=[${hit.join(",")}] 圖片=[${picked.join(",")}] 期望=[${seg.expect.join(",")}] ${ok ? "PASS" : "FAIL"}`);
  });
  console.log(pass ? "案例 A 全部 PASS" : "案例 A 有 FAIL");
})();

// 案例 B：英文前綴 Mary vs Mary Jane
(() => {
  console.log("\n=== 案例 B：Mary vs Mary Jane ===");
  allCharNames = ["Mary", "Mary Jane"];
  const all = ["Mary_日常.jpg", "Mary_Jane_禮服.jpg"];
  const segs = [
    { t: "Mary 走進教室，打開書本。", expect: ["Mary_日常.jpg"] },
    { t: "Mary Jane 穿上禮服，準備出席晚宴。", expect: ["Mary_Jane_禮服.jpg", "Mary_日常.jpg"] },
  ];
  let pass = true;
  segs.forEach(seg => {
    const { hit, picked } = tryAutoCharImages(seg.t, all, all);
    const ok = JSON.stringify(picked.sort()) === JSON.stringify(seg.expect.sort());
    pass = pass && ok;
    console.log(`  段「${seg.t.slice(0, 15)}…」命中=[${hit.join(",")}] 圖片=[${picked.join(",")}] 期望=[${seg.expect.join(",")}] ${ok ? "PASS" : "FAIL"}`);
  });
  console.log(pass ? "案例 B 全部 PASS" : "案例 B 有 FAIL");
})();

// 案例 C：中英混用 James vs 小 James
(() => {
  console.log("\n=== 案例 C：James vs 小 James ===");
  allCharNames = ["James", "小 James"];
  const all = ["James_正裝.jpg", "小James_便服.jpg"];
  const segs = [
    { t: "James 坐在辦公室裡寫報告。", expect: ["James_正裝.jpg"] },
    { t: "小 James 在公園裡奔跑。", expect: ["James_正裝.jpg", "小James_便服.jpg"] },
  ];
  let pass = true;
  segs.forEach(seg => {
    const { hit, picked } = tryAutoCharImages(seg.t, all, all);
    const ok = JSON.stringify(picked.sort()) === JSON.stringify(seg.expect.sort());
    pass = pass && ok;
    console.log(`  段「${seg.t.slice(0, 12)}…」命中=[${hit.join(",")}] 圖片=[${picked.join(",")}] 期望=[${seg.expect.join(",")}] ${ok ? "PASS" : "FAIL"}`);
  });
  console.log(pass ? "案例 C 全部 PASS" : "案例 C 有 FAIL");
})();

// 案例 D：子字串風險反例（提示詞含更長名時單字名不應誤中）
(() => {
  console.log("\n=== 案例 D：提示詞含更長名時單字名不應誤中 ===");
  allCharNames = ["龍", "小龍"];
  const all = ["龍_全身.png", "小龍_幼年.png"];
  const seg = { t: "小龍在草地上玩耍，小龍非常開心。", expect: ["小龍_幼年.png"] };
  const { hit, picked } = tryAutoCharImages(seg.t, all, all);
  const ok = JSON.stringify(picked.sort()) === JSON.stringify(seg.expect.sort());
  console.log(`  段「${seg.t.slice(0, 15)}…」命中=[${hit.join(",")}] 圖片=[${picked.join(",")}] 期望=[${seg.expect.join(",")}] ${ok ? "PASS" : "FAIL"}`);
})();

// 案例 E：英文單詞邊界 cat vs catalog
(() => {
  console.log("\n=== 案例 E：英文單詞邊界（cat vs catalog）===");
  allCharNames = ["cat", "catalog"];
  const all = ["cat_白貓.jpg", "catalog_目錄.pdf"];
  const segs = [
    { t: "the cat sleeps on the sofa.", expect: ["cat_白貓.jpg"] },
    { t: "open the catalog and pick a page.", expect: ["catalog_目錄.pdf"] },
  ];
  let pass = true;
  segs.forEach(seg => {
    const { hit, picked } = tryAutoCharImages(seg.t, all, all);
    const ok = JSON.stringify(picked.sort()) === JSON.stringify(seg.expect.sort());
    pass = pass && ok;
    console.log(`  段「${seg.t.slice(0, 15)}…」命中=[${hit.join(",")}] 圖片=[${picked.join(",")}] 期望=[${seg.expect.join(",")}] ${ok ? "PASS" : "FAIL"}`);
  });
  console.log(pass ? "案例 E 全部 PASS" : "案例 E 有 FAIL");
})();
