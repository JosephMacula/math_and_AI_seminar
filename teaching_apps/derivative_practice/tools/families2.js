"use strict";
const F1 = require("./families.js");
const H = F1.H;
const { ansTex, rat, srcNum, texNum, sinX, cosX, symVal, radTex,
        symNorm, symMul, symInv, symDiv, symPow, piPow } = H;
const { add, symScale, symAdd, symAns, expPart, expAns,
        polyTex, polySrc, polyD, polyAt, monoTex, monoSrc,
        winSym, winPos, xp, termTex, wrap, multi, mulTex } = F1;

const KS = [];
for (let k = -12; k <= 24; k++) if (sinX(k)) KS.push(k);
const kAngle = k => (k * Math.PI) / 12;

/* The branch of a periodic function with poles that contains `a`, inset from
   both poles by a fraction of the period.  Poles sit at (offset + n*pi)/m. */
function branchWin(a, m, offset, margins) {
  const per = Math.PI / Math.abs(m);
  const base = offset / Math.abs(m);
  const n = Math.floor((a - base) / per + 1e-12);
  const lo = base + n * per;
  return margins.map(g => [lo + g * per, lo + per - g * per]).filter(([l, h]) => l < a && a < h);
}
const winTrig = a => [[a - Math.PI, a + Math.PI], [a - 2, a + 2], [a - 2 * Math.PI, a + 2 * Math.PI], [a - 1, a + 1]];
const cf = c => (c === 1 ? "" : c === -1 ? "-" : `${c}`);
/* c times a multi-term expression, without parenthesising when c is 1 */
const scaled = (c, inner) => (c === 1 ? inner : c === -1 ? `-(${inner})` : `${c}(${inner})`);

/* ================= Horizontal tangent ================= */
{
  for (const k of [1, 2, 3])
    for (const s of [1, -1]) {
      add({ topic: "Horizontal tangent", sub: "cubic",
        tex: `f(x) = x^{3} - ${3 * k * k}x`, fSrc: `x ** 3 - ${3 * k * k} * x`,
        fpTex: `f'(x) = 3x^{2} - ${3 * k * k}`, fpSrc: `3 * x ** 2 - ${3 * k * k}`,
        a: s * k, answerTex: "0", windows: winSym(s * k, [2 * k + 1, k + 1, 3 * k]) });
      add({ topic: "Horizontal tangent", sub: "quartic",
        tex: `f(x) = x^{4} - ${2 * k * k}x^{2}`, fSrc: `x ** 4 - ${2 * k * k} * x ** 2`,
        fpTex: `f'(x) = 4x^{3} - ${4 * k * k}x`, fpSrc: `4 * x ** 3 - ${4 * k * k} * x`,
        a: s * k, answerTex: "0", windows: winSym(0, [2 * k, 1.6 * k, 2.6 * k]) });
    }
  for (const b of [-6, -4, -2, 2, 4, 6])
    for (const c of [0, 1, -3])
      add({ topic: "Horizontal tangent", sub: "vertex",
        tex: `f(x) = ${polyTex([c, b, 1])}`, fSrc: polySrc([c, b, 1]),
        fpTex: `f'(x) = ${polyTex([b, 2])}`, fpSrc: polySrc([b, 2]),
        a: -b / 2, answerTex: "0", windows: winSym(-b / 2, [3, 2, 4]) });
  for (const n of [1, 2, 3])
    add({ topic: "Horizontal tangent", sub: "xnex",
      tex: `f(x) = ${xp(n)}e^{x}`, fSrc: `x ** ${n} * Math.exp(x)`,
      fpTex: `f'(x) = (${xp(n)} + ${termTex(n, n - 1)})e^{x}`,
      fpSrc: `(x ** ${n} + ${n} * x ** ${n - 1}) * Math.exp(x)`,
      a: -n, answerTex: "0", windows: [[-n - 3, 1.5], [-n - 2, 1], [-n - 4, 2]] });
  add({ topic: "Horizontal tangent", sub: "xlnx",
    tex: "f(x) = x\\ln x", fSrc: "x * Math.log(x)",
    fpTex: "f'(x) = \\ln x + 1", fpSrc: "Math.log(x) + 1",
    a: 1 / Math.E, answerTex: "0", windows: [[0.02, 1.4], [0.01, 2], [0.05, 1]] });
  add({ topic: "Horizontal tangent", sub: "lnxminus",
    tex: "f(x) = \\ln x - x", fSrc: "Math.log(x) - x",
    fpTex: "f'(x) = \\dfrac{1}{x} - 1", fpSrc: "1 / x - 1",
    a: 1, answerTex: "0", windows: [[0.1, 4], [0.05, 3], [0.2, 5]] });
  for (const c of [1, 4, 9])
    add({ topic: "Horizontal tangent", sub: "ratmax",
      tex: `f(x) = \\dfrac{x}{x^{2} + ${c}}`, fSrc: `x / (x ** 2 + ${c})`,
      fpTex: `f'(x) = \\dfrac{${c} - x^{2}}{(x^{2} + ${c})^{2}}`, fpSrc: `(${c} - x ** 2) / (x ** 2 + ${c}) ** 2`,
      a: Math.sqrt(c), answerTex: "0", windows: winSym(0, [3 * Math.sqrt(c), 2 * Math.sqrt(c), 4 * Math.sqrt(c)]) });
  add({ topic: "Horizontal tangent", sub: "gauss",
    tex: "f(x) = e^{-x^{2}}", fSrc: "Math.exp(-(x ** 2))",
    fpTex: "f'(x) = -2xe^{-x^{2}}", fpSrc: "-2 * x * Math.exp(-(x ** 2))",
    a: 0, answerTex: "0", windows: winSym(0, [3, 2, 4]) });
  for (const k of KS) {
    if (cosX(k)[0] !== 0) continue;
    add({ topic: "Horizontal tangent", sub: "sin",
      tex: "f(x) = \\sin x", fSrc: "Math.sin(x)", fpTex: "f'(x) = \\cos x", fpSrc: "Math.cos(x)",
      a: kAngle(k), answerTex: "0", windows: winTrig(kAngle(k)) });
  }
}

/* ================= Product rule ================= */
{
  for (const n of [1, 2, 3])
    for (const c of [1, 2, -1, 3])
      for (const m of [-2, -1, 0, 1, 2]) {
        const coef = c * (n * m ** (n - 1) + m ** n);
        add({ topic: "Product rule", sub: "xnex",
          tex: `f(x) = ${cf(c)}${xp(n)}e^{x}`, fSrc: `${c} * x ** ${n} * Math.exp(x)`,
          fpTex: `f'(x) = ${cf(c)}(${xp(n)} + ${termTex(n, n - 1)})e^{x}`,
          fpSrc: `${c} * (x ** ${n} + ${n} * x ** ${n - 1}) * Math.exp(x)`,
          a: m, answerTex: expAns(coef, 1, m),
          windows: [[m - 3, m + 1.5], [m - 2, m + 1], [m - 4, m + 2], [m - 1.5, m + 1.5]] });
      }
  for (const trig of ["sin", "cos"])
    for (const n of [1, 2, 3])
      for (const c of [1, 2, -1])
        for (const k of [0, 6, 12, 18, 24]) {
          const a = kAngle(k), t = rat(k, 12);
          const S = sinX(k), C = cosX(k);
          const U = trig === "sin" ? S : C;                       // the trig factor
          const V = trig === "sin" ? C : [-S[0], S[1], S[2]];      // its derivative
          const tA = rat(c * n * t[0] ** (n - 1) * U[0], t[1] ** (n - 1) * U[1]);
          const tB = rat(c * t[0] ** n * V[0], t[1] ** n * V[1]);
          if (tA[0] !== 0 && tB[0] !== 0) continue;
          const [p, q, j] = tA[0] !== 0 ? [tA[0], tA[1], n - 1] : [tB[0], tB[1], n];
          const t1 = termTex(n, n - 1, `\\${trig} x`);
          const t2 = termTex(1, n, trig === "sin" ? "\\cos x" : "\\sin x");
          const inner = trig === "sin" ? `${t1} + ${t2}` : `${t1} - ${t2}`;
          add({ topic: "Product rule", sub: `xn${trig}`,
            tex: `f(x) = ${cf(c)}${xp(n)}\\${trig} x`, fSrc: `${c} * x ** ${n} * Math.${trig}(x)`,
            fpTex: `f'(x) = ${scaled(c, inner)}`,
            fpSrc: `${c} * (${n} * x ** ${n - 1} * Math.${trig}(x) ${trig === "sin" ? "+" : "-"} x ** ${n} * Math.${trig === "sin" ? "cos" : "sin"}(x))`,
            a, answerTex: ansTex(p, q, piPow(j)), windows: winTrig(a) });
        }
  for (const u2 of [1, 2, -1])
    for (const u0 of [-4, -1, 1, 3])
      for (const v1 of [1, 2, -1])
        for (const v0 of [-3, -1, 2])
          for (const a of [-2, -1, 0, 1, 2]) {
            const u = [u0, 0, u2], v = [v0, v1];
            const du = polyD(u), dv = polyD(v);
            const slope = polyAt(du, a) * polyAt(v, a) + polyAt(u, a) * polyAt(dv, a);
            add({ topic: "Product rule", sub: "polypoly",
              tex: `f(x) = ${wrap(polyTex(u))}${wrap(polyTex(v))}`,
              fSrc: `(${polySrc(u)}) * (${polySrc(v)})`,
              fpTex: `f'(x) = ${wrap(mulTex(polyTex(du), polyTex(v)))} + ${wrap(mulTex(polyTex(u), polyTex(dv)))}`,
              fpSrc: `(${polySrc(du)}) * (${polySrc(v)}) + (${polySrc(u)}) * (${polySrc(dv)})`,
              a, answerTex: ansTex(slope, 1), windows: winSym(a, [3, 2, 4, 1.5]) });
          }
  for (const d of [-4, -1, 1, 2, 5])
    for (const r of [1, 2, 3, 4]) {
      const a = r * r;
      const lin = `x ${d < 0 ? "-" : "+"} ${Math.abs(d)}`;
      add({ topic: "Product rule", sub: "xsqrt",
        tex: `f(x) = (${lin})\\sqrt{x}`, fSrc: `(x + ${d}) * Math.sqrt(x)`,
        fpTex: `f'(x) = \\sqrt{x} + \\dfrac{${lin}}{2\\sqrt{x}}`,
        fpSrc: `Math.sqrt(x) + (x + ${d}) / (2 * Math.sqrt(x))`,
        a, answerTex: ansTex(3 * a + d, 2 * r),
        windows: winPos(a, [[0.15, 2.4], [0.3, 2.0], [0.05, 2.8]]) });
    }
  for (const n of [1, 2, 3])
    for (const c of [1, 2, -1])
      for (const j of [0, 1, 2]) {
        const a = Math.E ** j;
        add({ topic: "Product rule", sub: "xnlnx",
          tex: `f(x) = ${cf(c)}${xp(n)}\\ln x`, fSrc: `${c} * x ** ${n} * Math.log(x)`,
          fpTex: `f'(x) = ${n === 1 ? scaled(c, `${termTex(n, 0, "\\ln x")} + 1`) : mulTex(termTex(c, n - 1), `(${termTex(n, 0, "\\ln x")} + 1)`)}`,
          fpSrc: `${c} * x ** ${n - 1} * (${n} * Math.log(x) + 1)`,
          a, aTex: j === 0 ? "1" : j === 1 ? "e" : `e^{${j}}`,
          aSrc: j === 0 ? "1" : j === 1 ? "Math.E" : `Math.E ** ${j}`,
          answerTex: expAns(c * (n * j + 1), 1, j * (n - 1)),
          windows: [[0.05, a * 2.2], [0.02, a * 1.6], [0.2, a * 2.8]] });
      }
  for (const k of KS) {
    const val = symAdd(symPow(cosX(k), 2), symScale(symPow(sinX(k), 2), -1));
    if (val) add({ topic: "Product rule", sub: "sincos",
      tex: "f(x) = \\sin x\\cos x", fSrc: "Math.sin(x) * Math.cos(x)",
      fpTex: "f'(x) = \\cos^{2} x - \\sin^{2} x", fpSrc: "Math.cos(x) ** 2 - Math.sin(x) ** 2",
      a: kAngle(k), answerTex: symAns(val), windows: winTrig(kAngle(k)) });
  }
  for (const trig of ["sin", "cos"])
    for (const k of [0, 12]) {
      const a = kAngle(k), S = sinX(k), C = cosX(k);
      const v = trig === "sin" ? symAdd(S, C) : symAdd(C, symScale(S, -1));
      if (!v) continue;
      add({ topic: "Product rule", sub: `ex${trig}`,
        tex: `f(x) = e^{x}\\${trig} x`, fSrc: `Math.exp(x) * Math.${trig}(x)`,
        fpTex: `f'(x) = e^{x}(\\${trig} x ${trig === "sin" ? "+ \\cos" : "- \\sin"} x)`,
        fpSrc: `Math.exp(x) * (Math.${trig}(x) ${trig === "sin" ? "+ Math.cos(x)" : "- Math.sin(x)"})`,
        a, answerTex: k === 0 ? symAns(v) : ansTex(v[0], v[1], "e^\\pi"),
        windows: [[a - 3, a + 1.5], [a - 2, a + 1], [a - 4, a + 2]] });
    }
  for (const r of [1, 2]) {
    const a = r * r;
    add({ topic: "Product rule", sub: "sqrtex",
      tex: "f(x) = \\sqrt{x}e^{x}", fSrc: "Math.sqrt(x) * Math.exp(x)",
      fpTex: "f'(x) = e^{x}\\left(\\sqrt{x} + \\dfrac{1}{2\\sqrt{x}}\\right)",
      fpSrc: "Math.exp(x) * (Math.sqrt(x) + 1 / (2 * Math.sqrt(x)))",
      a, answerTex: expAns(2 * a + 1, 2 * r, a),
      windows: [[0.05, a + 1.2], [0.02, a + 0.8], [0.15, a + 2]] });
  }
}
module.exports = { KS, kAngle, branchWin, winTrig, cf, scaled };
