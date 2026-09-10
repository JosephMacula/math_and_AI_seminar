"use strict";
/* Generator for the derivative_practice question bank.
   Emits candidate problems, then verifies each against exactly the checks
   tests.js runs.  Only survivors are written out. */

const fs = require("fs");
const path = require("path");
const DIR = require("path").join(__dirname, "..");
const { parse } = require(path.join(DIR, "parse.js"));
const { plotRanges, MAX_ZOOM } = require(path.join(DIR, "plot.js"));

/* ---------- deterministic shuffle ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260910);
const shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- rationals ---------- */
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
function rat(p, q) { if (q < 0) { p = -p; q = -q; } const g = gcd(p, q); return [p / g, q / g]; }

/* value = (p/q) * numTex / denTex, rendered the way the reveal panel shows it.
   Exponents must stay brace-free: the TeX strip in tests.js turns \dfrac{a}{b}
   into (a)/(b) only when neither half contains braces, and a stray { reaches
   the tokenizer as a character it cannot read. */
function ansTex(p, q, numTex = "", denTex = "") {
  [p, q] = rat(p, q);
  if (p === 0) return "0";
  const sign = p < 0 ? "-" : "";
  const P = Math.abs(p);
  const top = P === 1 && numTex ? numTex : `${P}${numTex}`;
  let bot = "";
  if (denTex) bot = q === 1 ? denTex : `${q}${denTex}`;
  else if (q !== 1) bot = `${q}`;
  return bot ? `${sign}\\dfrac{${top}}{${bot}}` : `${sign}${top}`;
}

/* The exact strip tests.js applies, so the two cannot drift apart. */
const stripTex = t => t
  .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
  .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
  .replace(/\\(pi|ln)/g, "$1")
  .replace(/\\,|\\!|\s/g, "");

/* ---------- printing numbers as source and as TeX ---------- */
function ratApprox(x, maxDen = 60) {
  if (!Number.isFinite(x)) return null;
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(x * q);
    if (Math.abs(p / q - x) < 1e-12 && Math.abs(p) <= 5000) return rat(p, q);
  }
  return null;
}
function srcNum(v) {
  if (Number.isInteger(v)) return String(v);
  const plain = ratApprox(v);
  if (plain) return plain[1] === 1 ? String(plain[0]) : `${plain[0]} / ${plain[1]}`;
  for (const [unit, name] of [[Math.PI, "Math.PI"], [Math.E, "Math.E"]]) {
    const r = ratApprox(v / unit);
    if (r) {
      const [p, q] = r;
      const top = p === 1 ? name : p === -1 ? `-${name}` : `${p} * ${name}`;
      return q === 1 ? top : `${top} / ${q}`;
    }
    const s = ratApprox(v * unit);            /* p / (q * unit) */
    if (s) return s[1] === 1 ? `${s[0]} / ${name}` : `${s[0]} / (${s[1]} * ${name})`;
  }
  return String(v);
}
function texNum(v) {
  if (Number.isInteger(v)) return String(v);
  const plain = ratApprox(v);
  if (plain) return plain[1] === 1 ? String(plain[0]) : ansTex(plain[0], plain[1]);
  for (const [unit, sym] of [[Math.PI, "\\pi"], [Math.E, "e"]]) {
    const r = ratApprox(v / unit);
    if (r) return ansTex(r[0], r[1], sym);
    const s = ratApprox(v * unit);
    if (s) return ansTex(s[0], s[1], "", sym);
  }
  return String(Number(v.toFixed(6)));
}

/* ---------- exact sine and cosine at multiples of pi/12 ----------
   Stored as [p, q, r] meaning (p/q)*sqrt(r), which is closed under the
   products the six trig derivatives produce. */
const SIN12 = {
  0: [0, 1, 1], 2: [1, 2, 1], 3: [1, 2, 2], 4: [1, 2, 3], 6: [1, 1, 1],
  8: [1, 2, 3], 9: [1, 2, 2], 10: [1, 2, 1], 12: [0, 1, 1],
  14: [-1, 2, 1], 15: [-1, 2, 2], 16: [-1, 2, 3], 18: [-1, 1, 1],
  20: [-1, 2, 3], 21: [-1, 2, 2], 22: [-1, 2, 1],
};
const mod24 = k => ((k % 24) + 24) % 24;
const sinX = k => SIN12[mod24(k)] || null;
const cosX = k => SIN12[mod24(k + 6)] || null;
/* (p/q)sqrt(r) as a number, for cross-checking against Math.sin */
const symVal = ([p, q, r]) => (p / q) * Math.sqrt(r);
/* sqrt(r) rendered, r = 1 meaning no radical at all */
const radTex = r => (r === 1 ? "" : `\\sqrt{${r}}`);

/* The six trig derivatives are built from products and quotients of these, so
   the class has to be closed under both.  Square factors are pulled out of the
   radical, which is what keeps sqrt(2)*sqrt(2) from printing as sqrt(4). */
function symNorm([p, q, r]) {
  for (let s = Math.floor(Math.sqrt(r)); s > 1; s--) if (r % (s * s) === 0) { p *= s; r /= s * s; break; }
  const [P, Q] = rat(p, q);
  return [P, Q, r];
}
const symMul = (u, v) => symNorm([u[0] * v[0], u[1] * v[1], u[2] * v[2]]);
const symInv = ([p, q, r]) => symNorm([q, p * r, r]);
const symDiv = (u, v) => symMul(u, symInv(v));
const symPow = (u, n) => { let acc = [1, 1, 1]; for (let i = 0; i < n; i++) acc = symMul(acc, u); return acc; };
/* pi^j in an answer, brace-free so the TeX strip can reach it */
const piPow = j => (j === 0 ? "" : j === 1 ? "\\pi" : `\\pi^${j}`);

module.exports = {
  rand, shuffle, gcd, rat, ansTex, stripTex, ratApprox, srcNum, texNum,
  SIN12, mod24, sinX, cosX, symVal, radTex, symNorm, symMul, symInv, symDiv, symPow, piPow, parse, plotRanges, MAX_ZOOM, DIR, fs,
};
