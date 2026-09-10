"use strict";
const fs = require("fs");
const F1 = require("./families.js");
require("./families2.js"); require("./families3.js");
const H = F1.H;
const { parse, plotRanges, MAX_ZOOM, stripTex, srcNum, texNum, ratApprox, shuffle, rat } = H;
const POOL = F1.P;

/* ---------- the checks tests.js will run, applied here first ---------- */
const numericalDerivative = (f, x, h = 1e-3) =>
  (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h);
const closeTo = (u, v, t = 1e-6) => Math.abs(u - v) <= Math.max(t, t * Math.abs(v));
const COLUMNS = 600, PLOT_PIXELS = 400;

/* Keep a window number exact when it is a recognisable constant, otherwise
   round it -- so the value written into problems.js is the value verified. */
function isNice(v) {
  if (Number.isInteger(v)) return true;
  if (ratApprox(v)) return true;
  for (const u of [Math.PI, Math.E]) if (ratApprox(v / u) || ratApprox(v * u)) return true;
  return false;
}
const cleanNum = v => (isNice(v) ? v : Number(v.toFixed(4)));

function build(src) { try { return new Function("x", `"use strict"; return ${src};`); } catch { return null; } }

function verify(cand, window) {
  const f = build(cand.fSrc), fp = build(cand.fpSrc);
  if (!f || !fp) return "source does not compile";
  const a = cand.a;
  let fa, fpa;
  try { fa = f(a); fpa = fp(a); } catch { return "throws at a"; }
  if (!Number.isFinite(fa) || !Number.isFinite(fpa)) return "f or f' not finite at a";

  for (const x of [a, a - 0.31, a + 0.29, a + 0.7]) {
    let exact, approx;
    try { exact = fp(x); approx = numericalDerivative(f, x); } catch { return "throws near a"; }
    if (!Number.isFinite(exact) || !Number.isFinite(approx)) continue;
    if (!closeTo(approx, exact, 1e-5)) return `f' disagrees with finite difference at ${x}`;
  }

  let value;
  try { value = parse(stripTex(cand.answerTex)); } catch (e) { return `answer will not parse: ${e.message}`; }
  if (!closeTo(value, fpa, 1e-12)) return `answer ${cand.answerTex} is ${value}, f'(a) is ${fpa}`;

  if (cand.aSrc) {
    const av = build(cand.aSrc);
    if (!av || !closeTo(av(0), a, 1e-12)) return "aSrc does not evaluate to a";
  } else if (!isNice(a)) return "a has no exact source form";

  const [lo, hi] = window;
  if (!(lo < a && a < hi)) return "window does not contain a";
  if (!(hi - lo > 0)) return "empty window";

  /* the curve must actually be drawable across most of the window */
  let finite = 0;
  for (let i = 0; i <= 200; i++) { const y = f(lo + ((hi - lo) * i) / 200); if (Number.isFinite(y)) finite++; }
  if (finite < 0.8 * 201) return "f undefined across much of the window";

  const truth = fpa, wrong = truth + 1;
  const gaps = zoom => {
    const { xRange, yRange } = plotRanges({ f, a, fa, xRange: window, zoom }, COLUMNS);
    const height = yRange[1] - yRange[0];
    const edges = [xRange[0], xRange[1]];
    return {
      bend: Math.max(...edges.map(x => Math.abs(f(x) - (fa + truth * (x - a))) / height)),
      tilt: Math.max(...edges.map(x => Math.abs((wrong - truth) * (x - a)) / height)),
      xRange, yRange,
    };
  };
  const base = gaps(1);
  if (!Number.isFinite(base.bend) || !Number.isFinite(base.tilt)) return "f undefined at a window edge";

  for (const zoom of [100, 1000]) {
    const here = gaps(zoom), deeper = gaps(zoom * 10);
    if (!(deeper.bend <= here.bend / 5 + 1e-12)) return `bend does not fall off past ${zoom}x`;
  }
  for (const zoom of [10, 1000, MAX_ZOOM]) {
    const here = gaps(zoom);
    if (!(closeTo(here.tilt, base.tilt, 1e-9) && here.tilt > 1e-3)) return `wrong line not visible at ${zoom}x`;
    if (!(here.xRange[0] <= a && a <= here.xRange[1] && here.yRange[0] <= fa && fa <= here.yRange[1]))
      return `point leaves the frame at ${zoom}x`;
  }
  if (!(gaps(MAX_ZOOM).bend * PLOT_PIXELS < 0.5)) return "not within half a pixel of its tangent at full zoom";
  return null;
}

/* answers nobody would want to write down */
function answerTooUgly(t) {
  const nums = (t.match(/\d+/g) || []).map(Number);
  return nums.some(n => n > 5000);
}

/* ---------- verify the pool ---------- */
const rejects = {};
const ok = [];
for (const cand of POOL) {
  if (answerTooUgly(cand.answerTex)) { rejects["ugly answer"] = (rejects["ugly answer"] || 0) + 1; continue; }
  let chosen = null, why = "no window candidates";
  for (const w of cand.windows || []) {
    const win = [cleanNum(w[0]), cleanNum(w[1])];
    const bad = verify(cand, win);
    if (!bad) { chosen = win; break; }
    why = bad;
  }
  if (chosen) ok.push({ ...cand, window: chosen });
  else rejects[why] = (rejects[why] || 0) + 1;
}
console.log(`verified ${ok.length} of ${POOL.length} candidates`);
console.log("top rejection reasons:");
Object.entries(rejects).sort((u, v) => v[1] - u[1]).slice(0, 12)
  .forEach(([w, n]) => console.log(`  ${String(n).padStart(5)}  ${w}`));

const byTopic = {};
for (const c of ok) (byTopic[c.topic] = byTopic[c.topic] || []).push(c);
console.log("\nverified by topic:");
Object.keys(byTopic).sort().forEach(k => console.log(`  ${String(byTopic[k].length).padStart(5)}  ${k}`));
fs.writeFileSync(require("path").join(__dirname, "verified.json"), JSON.stringify(ok));
