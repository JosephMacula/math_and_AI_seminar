"use strict";
const fs = require("fs");
const H = require("./gen.js");
const { srcNum, texNum, shuffle } = H;
const DIR = require("path").join(__dirname, "..");
const verified = JSON.parse(fs.readFileSync(require("path").join(__dirname, "verified.json"), "utf8"));
const { PROBLEMS } = require(DIR + "/problems.js");

/* Final size of each topic, originals included. */
const QUOTA = {
  "Power rule": 30, "Power rule, negative exponent": 13, "Power rule, radical": 11,
  "Power rule, rational exponent": 8, "Horizontal tangent": 12,
  "Product rule": 26, "Quotient rule": 26,
  "Chain rule": 20, "Chain rule, radical": 13, "Chain rule, trigonometric": 18,
  "Chain rule, exponential": 11, "Trigonometric": 22,
  "Exponential": 8, "Exponential, general base": 10,
  "Logarithm": 8, "Logarithm, chain rule": 8, "Logarithm, general base": 6,
};
console.log("target total:", Object.values(QUOTA).reduce((a, b) => a + b, 0));

/* The seventeen hand-written problems stay; they seed the duplicate guard. */
const key = (tex, a) => `${tex}|${Number(a.toFixed(9))}`;
const taken = new Set();
const texCount = {};
const haveByTopic = {};
for (const p of PROBLEMS) {
  taken.add(key(p.tex, p.a));
  texCount[p.tex] = (texCount[p.tex] || 0) + 1;
  haveByTopic[p.topic] = (haveByTopic[p.topic] || 0) + 1;
}

const byTopic = {};
for (const c of verified) (byTopic[c.topic] = byTopic[c.topic] || []).push(c);

const picked = [];
for (const topic of Object.keys(QUOTA)) {
  const need = QUOTA[topic] - (haveByTopic[topic] || 0);
  const bySub = {};
  for (const c of shuffle(byTopic[topic] || [])) (bySub[c.sub] = bySub[c.sub] || []).push(c);
  const subs = shuffle(Object.keys(bySub));
  let got = 0, round = 0;
  /* Deal round-robin across sub-families so a topic is not thirty near-copies
     of one shape, and cap any single function at two different points. */
  while (got < need && round < 400) {
    let advanced = false;
    for (const s of subs) {
      if (got >= need) break;
      const list = bySub[s];
      while (list.length) {
        const c = list.shift();
        if (taken.has(key(c.tex, c.a))) continue;
        if ((texCount[c.tex] || 0) >= 2) continue;
        taken.add(key(c.tex, c.a));
        texCount[c.tex] = (texCount[c.tex] || 0) + 1;
        picked.push(c); got++; advanced = true;
        break;
      }
    }
    if (!advanced) break;
    round++;
  }
  if (got < need) console.log(`  short on ${topic}: ${got} of ${need}`);
}
console.log("selected:", picked.length, " final bank:", PROBLEMS.length + picked.length);

/* ---------- emit ---------- */
const S = JSON.stringify;
const entry = c => {
  const aSrc = c.aSrc || srcNum(c.a);
  const aTex = c.aTex || texNum(c.a);
  return `  {
    topic: ${S(c.topic)},
    tex: ${S(c.tex)},
    f: x => ${c.fSrc},
    fp: x => ${c.fpSrc},
    fpTex: ${S(c.fpTex)},
    a: ${aSrc}, aTex: ${S(aTex)}, answerTex: ${S(c.answerTex)},
    window: [${srcNum(c.window[0])}, ${srcNum(c.window[1])}],
  },`;
};

const order = Object.keys(QUOTA);
picked.sort((u, v) => order.indexOf(u.topic) - order.indexOf(v.topic) || u.sub.localeCompare(v.sub));
let out = "";
let last = null;
for (const c of picked) {
  if (c.topic !== last) { out += `\n  /* ---- ${c.topic} ---- */\n`; last = c.topic; }
  out += entry(c) + "\n";
}

const path = DIR + "/problems.js";
const src = fs.readFileSync(path, "utf8");
const marker = "\n];\n";
const at = src.lastIndexOf(marker);
if (at < 0) throw new Error("could not find the end of PROBLEMS");
fs.writeFileSync(path, src.slice(0, at + 1) + out + src.slice(at + 1));
console.log("written to", path);

const tally = {};
for (const p of PROBLEMS) tally[p.topic] = (tally[p.topic] || 0) + 1;
for (const c of picked) tally[c.topic] = (tally[c.topic] || 0) + 1;
console.log("\nfinal distribution:");
for (const t of order) console.log(`  ${String(tally[t]).padStart(4)}  ${t}`);
