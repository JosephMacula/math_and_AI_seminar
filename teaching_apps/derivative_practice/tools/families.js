"use strict";
const H = require("./gen.js");
const { ansTex, rat, srcNum, texNum, sinX, cosX, symVal, radTex } = H;

/* ---------- symbolic (p/q)sqrt(r) arithmetic ---------- */
const symScale = ([p, q, r], k) => [p * k, q, r];
function symAdd(u, v) {           // null when the two radicals cannot combine
  if (u[0] === 0) return v;
  if (v[0] === 0) return u;
  if (u[2] !== v[2]) return null;
  const [p, q] = rat(u[0] * v[1] + v[0] * u[1], u[1] * v[1]);
  return [p, q, u[2]];
}
const symAns = ([p, q, r]) => ansTex(p, q, radTex(r));

const expPart = m => (m === 0 ? ["", ""] : m > 0 ? [m === 1 ? "e" : `e^${m}`, ""] : ["", m === -1 ? "e" : `e^${-m}`]);
const expAns = (p, q, m) => ansTex(p, q, ...expPart(m));

/* ---------- x to a positive rational power, as TeX ---------- */
function xPos(p, q) {
  if (q === 1) return p === 1 ? "x" : `x^{${p}}`;
  if (q === 2) return p === 1 ? "\\sqrt{x}" : p === 3 ? "x\\sqrt{x}" : `x^{${p}/2}`;
  return p === 1 ? "\\sqrt[3]{x}" : `x^{${p}/${q}}`;
}
/* (np/nq) * x^(mp/mq) as one fraction, never a fraction inside a fraction */
function monoTex(np, nq, mp, mq) {
  [np, nq] = rat(np, nq);
  if (np === 0) return "0";
  const sign = np < 0 ? "-" : "";
  const A = Math.abs(np);
  if (mp === 0) return nq === 1 ? `${sign}${A}` : `${sign}\\dfrac{${A}}{${nq}}`;
  if (mp > 0) {
    const top = `${A === 1 ? "" : A}${xPos(mp, mq)}`;
    return nq === 1 ? `${sign}${top}` : `${sign}\\dfrac{${top}}{${nq}}`;
  }
  const bot = `${nq === 1 ? "" : nq}${xPos(-mp, mq)}`;
  return `${sign}\\dfrac{${A}}{${bot}}`;
}
function monoSrc(np, nq, mp, mq) {
  [np, nq] = rat(np, nq);
  const coef = nq === 1 ? `${np}` : `(${np} / ${nq})`;
  if (mp === 0) return coef;
  const body = mq === 1 ? `x ** ${mp}` : mq === 3 ? `Math.cbrt(x) ** ${mp}` : `x ** (${mp} / ${mq})`;
  return np === 1 && nq === 1 ? body : `${coef} * ${body}`;
}
/* a^(mp/mq) as an exact rational, given a = root^mq */
function rootPow(root, mp, mq, eqBase) {
  const k = (mp * eqBase) / mq;
  if (!Number.isInteger(k)) return null;
  return k >= 0 ? [root ** k, 1] : [1, root ** -k];
}

/* x^n, with the exponents that should not be printed at all */
const xp = n => (n === 0 ? "" : n === 1 ? "x" : `x^{${n}}`);
/* coefficient times x^n times an optional trailing factor like \\sin x */
function termTex(coef, n, tail = "") {
  const body = xp(n) + tail;
  if (body === "") return `${coef}`;
  return `${coef === 1 ? "" : coef === -1 ? "-" : coef}${body}`;
}
/* Does the expression add or subtract at the top level?  A minus inside
   parentheses or braces (2x(x - 3), x^{2}) must not count, or every nested
   factor picks up a redundant pair of brackets. */
function multi(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "(" || c === "{" || c === "[") depth++;
    else if (c === ")" || c === "}" || c === "]") depth--;
    else if (depth === 0 && (c === "+" || c === "-") && i > 0 && s[i - 1] === " ") return true;
  }
  return false;
}
const wrap = s => (multi(s) ? `(${s})` : s);
/* a product of two rendered factors, dropping the ones that are just 1 */
function mulTex(A, B) {
  if (A === "1") return B;
  if (B === "1") return A;
  if (A === "-1") return `-${wrap(B)}`;
  if (B === "-1") return `-${wrap(A)}`;
  return `${wrap(A)}${wrap(B)}`;
}

const winSym = (a, hs) => hs.map(h => [a - h, a + h]);
const winPos = (a, pairs) => pairs.map(([lo, hi]) => [a * lo, a * hi]);

const P = [];
const add = c => { P.push(c); return c; };

/* ---------- polynomials, coefficient c[k] on x^k ---------- */
function polyTex(c) {
  let out = "";
  for (let k = c.length - 1; k >= 0; k--) {
    const v = c[k]; if (!v) continue;
    const A = Math.abs(v);
    const body = k === 0 ? `${A}` : k === 1 ? `${A === 1 ? "" : A}x` : `${A === 1 ? "" : A}x^{${k}}`;
    out += out ? ` ${v < 0 ? "-" : "+"} ${body}` : `${v < 0 ? "-" : ""}${body}`;
  }
  return out || "0";
}
function polySrc(c) {
  let out = "";
  for (let k = c.length - 1; k >= 0; k--) {
    const v = c[k]; if (!v) continue;
    const A = Math.abs(v);
    const body = k === 0 ? `${A}` : k === 1 ? `${A === 1 ? "" : A + " * "}x` : `${A === 1 ? "" : A + " * "}x ** ${k}`;
    /* JS refuses a unary minus immediately before **, so a negative leading
       term has to carry its own parentheses. */
    const lead = v < 0 ? (body.includes("**") ? `-(${body})` : `-${body}`) : body;
    out += out ? ` ${v < 0 ? "-" : "+"} ${body}` : lead;
  }
  return out || "0";
}
const polyD = c => c.slice(1).map((v, i) => v * (i + 1));
const polyAt = (c, x) => c.reduce((s, v, k) => s + v * x ** k, 0);
const polyDeg = c => { let d = 0; c.forEach((v, k) => { if (v) d = k; }); return d; };

/* ================= Power rule: polynomials ================= */
{
  const shapes = [];
  for (const l of [1, 2, -1, 3])
    for (const c1 of [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5])
      for (const c0 of [-3, -1, 0, 1, 2, 5]) shapes.push([c0, c1, l]);
  for (const l of [1, 2, -1])
    for (const c2 of [-3, -2, -1, 0, 1, 2])
      for (const c1 of [-6, -4, -1, 0, 2, 5])
        for (const c0 of [-2, 0, 1, 4]) shapes.push([c0, c1, c2, l]);
  for (const l of [1, -1, 2])
    for (const c2 of [-3, -2, 0, 1])
      for (const c0 of [-1, 0, 2]) shapes.push([c0, 0, c2, 0, l]);
  for (const l of [1, -1])
    for (const c3 of [-2, 0, 1])
      for (const c1 of [-4, 0, 3]) shapes.push([0, c1, 0, c3, 0, l]);
  for (const c of shapes) {
    const deg = polyDeg(c);
    if (deg < 2) continue;
    for (const a of [-3, -2, -1, 0, 1, 2, 3]) {
      const d = polyD(c);
      add({
        topic: "Power rule", sub: `poly${deg}`,
        tex: `f(x) = ${polyTex(c)}`, fSrc: polySrc(c),
        fpSrc: polySrc(d), fpTex: `f'(x) = ${polyTex(d)}`,
        a, answerTex: ansTex(polyAt(d, a), 1),
        windows: winSym(a, [3, 2, 4, 1.5, 5, 1]),
      });
    }
  }
}

/* ================= Power rule: negative exponents ================= */
{
  for (const n of [1, 2, 3, 4])
    for (const c of [1, 2, 3, -1, -2, 5])
      for (const lin of [0, 1, -1, 2])
        for (const [ap, aq] of [[1, 1], [2, 1], [3, 1], [4, 1], [-1, 1], [-2, 1], [1, 2]]) {
          const a = ap / aq;
          /* f = lin*x + c/x^n ;  f' = lin - cn/x^(n+1) */
          const dc = -c * n;
          const [sp, sq] = rat(dc * aq ** (n + 1) + lin * ap ** (n + 1), ap ** (n + 1));
          const tail = monoTex(c, 1, -n, 1);
          const dTail = monoTex(dc, 1, -(n + 1), 1);
          let tex = tail, src = monoSrc(c, 1, -n, 1);
          let fpTex = dTail, fpSrc = monoSrc(dc, 1, -(n + 1), 1);
          if (lin) {
            tex = `${monoTex(lin, 1, 1, 1)} ${c < 0 ? "-" : "+"} ${tail.replace(/^-/, "")}`;
            src = `${monoSrc(lin, 1, 1, 1)} + ${monoSrc(c, 1, -n, 1)}`;
            fpTex = `${lin} ${dc < 0 ? "-" : "+"} ${dTail.replace(/^-/, "")}`;
            fpSrc = `${lin} + ${monoSrc(dc, 1, -(n + 1), 1)}`;
          }
          add({
            topic: "Power rule, negative exponent", sub: `neg${n}`,
            tex: `f(x) = ${tex}`, fSrc: src, fpSrc, fpTex: `f'(x) = ${fpTex}`,
            a, answerTex: ansTex(sp, sq),
            windows: a > 0 ? winPos(a, [[0.2, 2.6], [0.35, 2.0], [0.5, 1.8], [0.15, 3.2]])
                           : winPos(a, [[2.6, 0.2], [2.0, 0.35], [1.8, 0.5]]),
          });
        }
}

/* ================= Power rule: radicals and rational exponents ================= */
{
  const shapes = [
    [1, 1, 2], [2, 1, 2], [3, 1, 2], [-1, 1, 2], [1, 3, 2], [2, 3, 2], [1, -1, 2], [-3, -1, 2],
    [1, 5, 2], [1, 1, 3], [2, 1, 3], [1, 2, 3], [1, 4, 3], [1, -2, 3], [1, 5, 3], [-2, 1, 3],
  ];
  for (const [c, ep, eq] of shapes)
    for (const lin of [0, 1, -2, 3])
      for (const root of [1, 2, 3, 4]) {
        const a = eq === 2 ? root ** 2 : root ** 3;
        if (a > 64) continue;
        const [np, nq] = rat(c * ep, eq);            // coefficient of f'
        const [mp, mq] = rat(ep - eq, eq);           // exponent of f'
        const pw = rootPow(root, mp, mq, eq);
        if (!pw) continue;
        const [sp, sq] = rat(np * pw[0] * 1 + lin * nq * pw[1], nq * pw[1]);
        let tex = monoTex(c, 1, ep, eq), src = monoSrc(c, 1, ep, eq);
        let fpTex = monoTex(np, nq, mp, mq), fpSrc = monoSrc(np, nq, mp, mq);
        if (lin) {
          tex += ` ${lin < 0 ? "-" : "+"} ${monoTex(Math.abs(lin), 1, 1, 1)}`;
          src += ` + ${monoSrc(lin, 1, 1, 1)}`;
          fpTex += ` ${lin < 0 ? "-" : "+"} ${Math.abs(lin)}`;
          fpSrc += ` + ${lin}`;
        }
        const simpleRadical = Math.abs(ep) === 1;
        const needPos = eq === 2 || mp < 0;
        add({
          topic: simpleRadical ? "Power rule, radical" : "Power rule, rational exponent",
          sub: `rad${ep}_${eq}`,
          tex: `f(x) = ${tex}`, fSrc: src, fpSrc, fpTex: `f'(x) = ${fpTex}`,
          a, answerTex: ansTex(sp, sq),
          windows: needPos
            ? winPos(a, [[0.15, 2.4], [0.3, 2.0], [0.05, 2.8], [0.5, 1.7]])
            : [[0, a * 2.2], [a * 0.1, a * 2.2], [a * 0.4, a * 1.8]],
        });
      }
}

module.exports = {
  P, add, symScale, symAdd, symAns, expPart, expAns,
  polyTex, polySrc, polyD, polyAt, polyDeg, monoTex, monoSrc, xPos, rootPow,
  winSym, winPos, xp, termTex, wrap, multi, mulTex, H,
};
