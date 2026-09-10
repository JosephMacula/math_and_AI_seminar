"use strict";
const F1 = require("./families.js");
const F2 = require("./families2.js");
const H = F1.H;
const { ansTex, rat, sinX, cosX, symVal, radTex, symNorm, symMul, symInv, symDiv, symPow, piPow } = H;
const { add, symScale, symAdd, symAns, expAns, polyTex, polySrc, polyD, polyAt, monoTex, monoSrc,
        winSym, winPos, xp, termTex, wrap, multi, mulTex } = F1;
const { KS, kAngle, branchWin, winTrig, cf, scaled } = F2;

const sumTex = (A, B) => (B === "0" ? A : A === "0" ? B : B.startsWith("-") ? `${A} - ${B.slice(1)}` : `${A} + ${B}`);
const lnB = b => `\\ln(${b})`;
/* A linear expression, written the way it would be by hand: a negative x-term
   goes after the constant, so it reads "2 - x" rather than "-x + 2". */
const lin = (p, q) => {
  if (q === 0) return termTex(p, 1);
  if (p < 0 && q > 0) return `${q} - ${termTex(-p, 1)}`;
  return `${termTex(p, 1)} ${q < 0 ? "-" : "+"} ${Math.abs(q)}`;
};
/* An exponent of one is not written. */
const pw1 = (body, n) => (n === 1 ? body : `${body}^{${n}}`);
/* A fraction whose sign sits in front of it, never inside the numerator. */
const fracTex = (num, den) => `${num < 0 ? "-" : ""}\\dfrac{${Math.abs(num)}}{${den}}`;
const linSrc = (p, q) => `${p} * x ${q < 0 ? "-" : "+"} ${Math.abs(q)}`;

/* Windows on one side of a pole, always containing a. */
function sideWin(a, pole, widths) {
  const d = a - pole;
  if (!Number.isFinite(d) || d === 0) return [];
  return widths
    .map(w => (d > 0 ? [pole + 0.18 * d, a + w * d] : [a + w * d, pole + 0.18 * d]))
    .filter(([l, h]) => l < a && a < h);
}

/* ================= Quotient rule ================= */
{
  for (const p of [1, 2, 3, -1])
    for (const q of [-3, -1, 1, 2])
      for (const r of [1, 2, -1])
        for (const s of [-2, 1, 3])
          for (const a of [-2, -1, 0, 1, 2, 3]) {
            if (r * a + s === 0 || p * s - q * r === 0) continue;
            add({ topic: "Quotient rule", sub: "linlin",
              tex: `f(x) = \\dfrac{${lin(p, q)}}{${lin(r, s)}}`,
              fSrc: `(${linSrc(p, q)}) / (${linSrc(r, s)})`,
              fpTex: `f'(x) = ${fracTex(p * s - q * r, `(${lin(r, s)})^{2}`)}`,
              fpSrc: `${p * s - q * r} / (${linSrc(r, s)}) ** 2`,
              a, answerTex: ansTex(p * s - q * r, (r * a + s) ** 2),
              windows: sideWin(a, -s / r, [2.5, 1.4, 4, 0.8]) });
          }
  for (const n of [2, 3])
    for (const c of [-2, -1, 1, 2, 3])
      for (const a of [-2, -1, 1, 2, 3]) {
        if (a + c === 0) continue;
        const num = n * a ** (n - 1) * (a + c) - a ** n;
        add({ topic: "Quotient rule", sub: "xnlin",
          tex: `f(x) = \\dfrac{${xp(n)}}{${lin(1, c)}}`, fSrc: `x ** ${n} / (${linSrc(1, c)})`,
          fpTex: `f'(x) = \\dfrac{${termTex(n, n - 1)}(${lin(1, c)}) - ${xp(n)}}{(${lin(1, c)})^{2}}`,
          fpSrc: `(${n} * x ** ${n - 1} * (${linSrc(1, c)}) - x ** ${n}) / (${linSrc(1, c)}) ** 2`,
          a, answerTex: ansTex(num, (a + c) ** 2),
          windows: sideWin(a, -c, [2.5, 1.4, 4, 0.8]) });
      }
  for (const b of [-4, -1, 0, 1, 3])
    for (const c of [1, 2, 4, 9])
      for (const a of [-3, -2, -1, 0, 1, 2, 3]) {
        if (b === c) continue;
        add({ topic: "Quotient rule", sub: "quadquad",
          tex: `f(x) = \\dfrac{${polyTex([b, 0, 1])}}{${polyTex([c, 0, 1])}}`,
          fSrc: `(${polySrc([b, 0, 1])}) / (${polySrc([c, 0, 1])})`,
          fpTex: `f'(x) = \\dfrac{${termTex(2 * (c - b), 1)}}{(${polyTex([c, 0, 1])})^{2}}`,
          fpSrc: `(${2 * (c - b)} * x) / (${polySrc([c, 0, 1])}) ** 2`,
          a, answerTex: ansTex(2 * (c - b) * a, (a * a + c) ** 2),
          windows: winSym(a, [4, 3, 6, 2]) });
      }
  for (const c of [1, 2, 4, 9])
    for (const a of [-3, -2, -1, 0, 1, 2, 3])
      add({ topic: "Quotient rule", sub: "xoverquad",
        tex: `f(x) = \\dfrac{x}{${polyTex([c, 0, 1])}}`, fSrc: `x / (${polySrc([c, 0, 1])})`,
        fpTex: `f'(x) = \\dfrac{${c} - x^{2}}{(${polyTex([c, 0, 1])})^{2}}`,
        fpSrc: `(${c} - x ** 2) / (${polySrc([c, 0, 1])}) ** 2`,
        a, answerTex: ansTex(c - a * a, (a * a + c) ** 2),
        windows: winSym(0, [4, 3, 6, 2 + Math.abs(a)]) });
  /* sin x / x and cos x / x, at the points where one of the two terms dies */
  for (const trig of ["sin", "cos"])
    for (const k of [-12, -6, 6, 12, 18, 24]) {
      const a = kAngle(k), t = rat(k, 12), S = sinX(k), C = cosX(k);
      let ansT;
      if (trig === "sin") {
        if (S[0] === 0) ansT = ansTex(C[0] * t[1], C[1] * t[0], "", "\\pi");
        else if (C[0] === 0) ansT = ansTex(-S[0] * t[1] ** 2, S[1] * t[0] ** 2, "", "\\pi^2");
      } else {
        if (S[0] === 0) ansT = ansTex(-C[0] * t[1] ** 2, C[1] * t[0] ** 2, "", "\\pi^2");
        else if (C[0] === 0) ansT = ansTex(-S[0] * t[1], S[1] * t[0], "", "\\pi");
      }
      if (!ansT) continue;
      const d = trig === "sin" ? "x\\cos x - \\sin x" : "-x\\sin x - \\cos x";
      const dS = trig === "sin" ? "x * Math.cos(x) - Math.sin(x)" : "-x * Math.sin(x) - Math.cos(x)";
      add({ topic: "Quotient rule", sub: `${trig}overx`,
        tex: `f(x) = \\dfrac{\\${trig} x}{x}`, fSrc: `Math.${trig}(x) / x`,
        fpTex: `f'(x) = \\dfrac{${d}}{x^{2}}`, fpSrc: `(${dS}) / x ** 2`,
        a, answerTex: ansT, windows: sideWin(a, 0, [1.6, 1.0, 2.6, 0.6]) });
    }
  for (const j of [0, 1, 2])
    add({ topic: "Quotient rule", sub: "lnoverx",
      tex: "f(x) = \\dfrac{\\ln x}{x}", fSrc: "Math.log(x) / x",
      fpTex: "f'(x) = \\dfrac{1 - \\ln x}{x^{2}}", fpSrc: "(1 - Math.log(x)) / x ** 2",
      a: Math.E ** j, aTex: j === 0 ? "1" : j === 1 ? "e" : `e^{${j}}`,
      aSrc: j === 0 ? "1" : j === 1 ? "Math.E" : `Math.E ** ${j}`,
      answerTex: expAns(1 - j, 1, -2 * j),
      windows: [[0.08, Math.E ** j * 2.2], [0.03, Math.E ** j * 1.6], [0.3, Math.E ** j * 3]] });
  for (const m of [-2, -1, 1, 2, 3])
    add({ topic: "Quotient rule", sub: "exoverx",
      tex: "f(x) = \\dfrac{e^{x}}{x}", fSrc: "Math.exp(x) / x",
      fpTex: "f'(x) = \\dfrac{e^{x}(x - 1)}{x^{2}}", fpSrc: "Math.exp(x) * (x - 1) / x ** 2",
      a: m, answerTex: expAns(m - 1, m * m, m), windows: sideWin(m, 0, [1.8, 1.1, 3]) });
  for (const m of [-1, 0, 1, 2, 3])
    add({ topic: "Quotient rule", sub: "xoverex",
      tex: "f(x) = \\dfrac{x}{e^{x}}", fSrc: "x / Math.exp(x)",
      fpTex: "f'(x) = \\dfrac{1 - x}{e^{x}}", fpSrc: "(1 - x) / Math.exp(x)",
      a: m, answerTex: expAns(1 - m, 1, -m), windows: winSym(m, [2.5, 1.5, 4]) });
}

/* ================= Chain rule (polynomial inner) ================= */
{
  for (const p of [2, 3, -1, -2, 1])
    for (const q of [-1, 1, 2, -3])
      for (const n of [2, 3, 4, 5])
        for (const a of [-1, 0, 1, 2]) {
          const inner = p * a + q;
          add({ topic: "Chain rule", sub: "linpow",
            tex: `f(x) = (${lin(p, q)})^{${n}}`, fSrc: `(${linSrc(p, q)}) ** ${n}`,
            fpTex: `f'(x) = ${p * n}${pw1(`(${lin(p, q)})`, n - 1)}`, fpSrc: `${p * n} * (${linSrc(p, q)}) ** ${n - 1}`,
            a, answerTex: ansTex(p * n * inner ** (n - 1), 1),
            windows: winSym(a, [2, 1.5, 3, 1]) });
        }
  for (const c of [-4, -1, 1, 2, 4])
    for (const n of [2, 3, 4])
      for (const a of [-2, -1, 0, 1, 2]) {
        const inner = a * a + c;
        add({ topic: "Chain rule", sub: "quadpow",
          tex: `f(x) = (${polyTex([c, 0, 1])})^{${n}}`, fSrc: `(${polySrc([c, 0, 1])}) ** ${n}`,
          fpTex: `f'(x) = ${termTex(2 * n, 1)}${pw1(`(${polyTex([c, 0, 1])})`, n - 1)}`,
          fpSrc: `${2 * n} * x * (${polySrc([c, 0, 1])}) ** ${n - 1}`,
          a, answerTex: ansTex(2 * n * a * inner ** (n - 1), 1),
          windows: winSym(a, [2, 1.5, 3, 1]) });
      }
  for (const p of [1, 2, -1])
    for (const q of [1, 2, -3])
      for (const n of [1, 2, 3])
        for (const a of [-1, 0, 1, 2]) {
          const inner = p * a + q;
          if (inner === 0) continue;
          add({ topic: "Chain rule", sub: "linnegpow",
            tex: `f(x) = \\dfrac{1}{${pw1(`(${lin(p, q)})`, n)}}`, fSrc: `1 / (${linSrc(p, q)}) ** ${n}`,
            fpTex: `f'(x) = ${fracTex(-p * n, `(${lin(p, q)})^{${n + 1}}`)}`,
            fpSrc: `${-p * n} / (${linSrc(p, q)}) ** ${n + 1}`,
            a, answerTex: ansTex(-p * n, inner ** (n + 1)),
            windows: sideWin(a, -q / p, [2.2, 1.3, 3.5]) });
        }
  for (const c of [1, 2, 4, 9])
    for (const n of [1, 2])
      for (const a of [-2, -1, 0, 1, 2])
        add({ topic: "Chain rule", sub: "quadnegpow",
          tex: `f(x) = \\dfrac{1}{${pw1(`(${polyTex([c, 0, 1])})`, n)}}`, fSrc: `1 / (${polySrc([c, 0, 1])}) ** ${n}`,
          fpTex: `f'(x) = -\\dfrac{${termTex(2 * n, 1)}}{(${polyTex([c, 0, 1])})^{${n + 1}}}`,
          fpSrc: `${-2 * n} * x / (${polySrc([c, 0, 1])}) ** ${n + 1}`,
          a, answerTex: ansTex(-2 * n * a, (a * a + c) ** (n + 1)),
          windows: winSym(0, [4, 3, 6, 2 + Math.abs(a)]) });
}

/* ================= Chain rule, radical ================= */
{
  for (const p of [1, 2, 3, -1, 4])
    for (const s of [1, 2, 3, 4, 5])
      for (const shift of [0, 1, 2]) {
        const a = shift;                       // pick q so that p*a + q = s^2
        const q = s * s - p * a;
        add({ topic: "Chain rule, radical", sub: "sqrtlin",
          tex: `f(x) = \\sqrt{${lin(p, q)}}`, fSrc: `Math.sqrt(${linSrc(p, q)})`,
          fpTex: `f'(x) = ${fracTex(p, `2\\sqrt{${lin(p, q)}}`)}`, fpSrc: `${p} / (2 * Math.sqrt(${linSrc(p, q)}))`,
          a, answerTex: ansTex(p, 2 * s),
          windows: sideWin(a, -q / p, [2.2, 1.3, 3.5, 0.7]) });
      }
  const triples = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [1, 0, 1]];
  for (const [aa, bb, ss] of triples)
    for (const sgn of [1, -1]) {
      const a = sgn * aa, c = bb * bb;
      if (c === 0) continue;
      add({ topic: "Chain rule, radical", sub: "sqrtquad",
        tex: `f(x) = \\sqrt{${polyTex([c, 0, 1])}}`, fSrc: `Math.sqrt(${polySrc([c, 0, 1])})`,
        fpTex: `f'(x) = \\dfrac{x}{\\sqrt{${polyTex([c, 0, 1])}}}`, fpSrc: `x / Math.sqrt(${polySrc([c, 0, 1])})`,
        a, answerTex: ansTex(a, ss), windows: winSym(0, [1.6 * ss, 1.2 * ss, 2.4 * ss]) });
      add({ topic: "Chain rule, radical", sub: "quad32",
        tex: `f(x) = (${polyTex([c, 0, 1])})^{3/2}`, fSrc: `(${polySrc([c, 0, 1])}) ** (3 / 2)`,
        fpTex: `f'(x) = 3x\\sqrt{${polyTex([c, 0, 1])}}`, fpSrc: `3 * x * Math.sqrt(${polySrc([c, 0, 1])})`,
        a, answerTex: ansTex(3 * a * ss, 1), windows: winSym(0, [1.6 * ss, 1.2 * ss, 2.4 * ss]) });
      add({ topic: "Chain rule, radical", sub: "invsqrtquad",
        tex: `f(x) = \\dfrac{1}{\\sqrt{${polyTex([c, 0, 1])}}}`, fSrc: `1 / Math.sqrt(${polySrc([c, 0, 1])})`,
        fpTex: `f'(x) = -\\dfrac{x}{(${polyTex([c, 0, 1])})^{3/2}}`, fpSrc: `-x / (${polySrc([c, 0, 1])}) ** (3 / 2)`,
        a, answerTex: ansTex(-a, ss ** 3), windows: winSym(0, [1.6 * ss, 1.2 * ss, 2.4 * ss]) });
    }
  for (const p of [1, 2, 3])
    for (const s of [1, 2, 3])
      for (const a of [0, 1, 2]) {
        const q = s ** 3 - p * a;
        add({ topic: "Chain rule, radical", sub: "cbrtlin",
          tex: `f(x) = \\sqrt[3]{${lin(p, q)}}`, fSrc: `Math.cbrt(${linSrc(p, q)})`,
          fpTex: `f'(x) = ${fracTex(p, `3(${lin(p, q)})^{2/3}`)}`,
          fpSrc: `${p} / (3 * Math.cbrt(${linSrc(p, q)}) ** 2)`,
          a, answerTex: ansTex(p, 3 * s * s), windows: winSym(a, [3, 2, 5, 1.2]) });
      }
}

/* ================= Chain rule, trigonometric ================= */
{
  for (const trig of ["sin", "cos"])
    for (const m of [2, 3, -1, -2, 1])
      for (const k of KS) {
        const a = (k * Math.PI) / (12 * m);
        const S = sinX(k), C = cosX(k);
        const v = trig === "sin" ? symScale(C, m) : symScale(S, -m);
        const arg = m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
        const argS = m === 1 ? "x" : `${m} * x`;
        add({ topic: "Chain rule, trigonometric", sub: `${trig}mx`,
          tex: `f(x) = \\${trig}(${arg})`, fSrc: `Math.${trig}(${argS})`,
          fpTex: `f'(x) = ${termTex(trig === "sin" ? m : -m, 0)}\\${trig === "sin" ? "cos" : "sin"}(${arg})`,
          fpSrc: `${trig === "sin" ? m : -m} * Math.${trig === "sin" ? "cos" : "sin"}(${argS})`,
          a, answerTex: symAns(v), windows: winTrig(a) });
      }
  for (const m of [1, 2, 3])
    for (const k of KS) {
      const C = cosX(k);
      if (C[0] === 0) continue;
      const a = (k * Math.PI) / (12 * m);
      const arg = m === 1 ? "x" : `${m}x`;
      const argS = m === 1 ? "x" : `${m} * x`;
      add({ topic: "Chain rule, trigonometric", sub: "tanmx",
        tex: `f(x) = \\tan(${arg})`, fSrc: `Math.tan(${argS})`,
        fpTex: `f'(x) = ${termTex(m, 0)}\\sec^{2}(${arg})`, fpSrc: `${m} / Math.cos(${argS}) ** 2`,
        a, answerTex: symAns(symScale(symInv(symPow(C, 2)), m)),
        windows: branchWin(a, m, Math.PI / 2, [0.1, 0.14, 0.07, 0.18]) });
    }
  for (const trig of ["sin", "cos"])
    for (const n of [2, 3, 4])
      for (const k of KS) {
        const S = sinX(k), C = cosX(k);
        const base = trig === "sin" ? S : C;
        const other = trig === "sin" ? C : symScale(S, -1);
        const v = symScale(symMul(symPow(base, n - 1), other), n);
        add({ topic: "Chain rule, trigonometric", sub: `${trig}pow`,
          tex: `f(x) = \\${trig}^{${n}} x`, fSrc: `Math.${trig}(x) ** ${n}`,
          fpTex: `f'(x) = ${n}\\${trig}^{${n - 1}} x\\${trig === "sin" ? "cos" : "sin"} x`.replace("^{1}", ""),
          fpSrc: `${trig === "sin" ? n : -n} * Math.${trig}(x) ** ${n - 1} * Math.${trig === "sin" ? "cos" : "sin"}(x)`,
          a: kAngle(k), answerTex: symAns(v), windows: winTrig(kAngle(k)) });
      }
  for (const k of KS) {
    const S = sinX(k), C = cosX(k);
    if (C[0] === 0) continue;
    const v = symScale(symMul(symDiv(S, C), symInv(symPow(C, 2))), 2);
    add({ topic: "Chain rule, trigonometric", sub: "tanpow",
      tex: "f(x) = \\tan^{2} x", fSrc: "Math.tan(x) ** 2",
      fpTex: "f'(x) = 2\\tan x\\sec^{2} x", fpSrc: "2 * Math.tan(x) / Math.cos(x) ** 2",
      a: kAngle(k), answerTex: symAns(v),
      windows: branchWin(kAngle(k), 1, Math.PI / 2, [0.1, 0.14, 0.07, 0.18]) });
  }
  for (const m of [1, 2])
    for (const k of KS) {
      const C = cosX(k), S = sinX(k);
      if (C[0] === 0) continue;
      const a = (k * Math.PI) / (12 * m);
      const arg = m === 1 ? "x" : `${m}x`;
      const argS = m === 1 ? "x" : `${m} * x`;
      add({ topic: "Chain rule, trigonometric", sub: "secmx",
        tex: `f(x) = \\sec(${arg})`, fSrc: `1 / Math.cos(${argS})`,
        fpTex: `f'(x) = ${termTex(m, 0)}\\sec(${arg})\\tan(${arg})`,
        fpSrc: `${m} * Math.sin(${argS}) / Math.cos(${argS}) ** 2`,
        a, answerTex: symAns(symScale(symDiv(S, symPow(C, 2)), m)),
        windows: branchWin(a, m, Math.PI / 2, [0.1, 0.14, 0.07, 0.18]) });
    }
  for (const s of [1, -1])
    for (const kk of [1, 4, 9]) {
      const a = s * Math.sqrt(kk * Math.PI);
      const C = cosX(12 * kk);
      add({ topic: "Chain rule, trigonometric", sub: "sinsq",
        tex: "f(x) = \\sin(x^{2})", fSrc: "Math.sin(x ** 2)",
        fpTex: "f'(x) = 2x\\cos(x^{2})", fpSrc: "2 * x * Math.cos(x ** 2)",
        a, aTex: `${s < 0 ? "-" : ""}${kk === 1 ? "" : Math.sqrt(kk)}\\sqrt{\\pi}`,
        aSrc: `${s * Math.sqrt(kk)} * Math.sqrt(Math.PI)`,
        answerTex: ansTex(2 * s * Math.sqrt(kk) * C[0], C[1], "\\sqrt{\\pi}"),
        windows: winSym(a, [1.2, 0.8, 1.8, 0.5]) });
    }
}

/* ================= Chain rule, exponential ================= */
{
  for (const p of [2, 3, -1, -2, 1])
    for (const m of [-2, -1, 0, 1, 2]) {
      const a = m / p;
      const arg = p === 1 ? "x" : p === -1 ? "-x" : `${p}x`;
      const argS = p === 1 ? "x" : `${p} * x`;
      add({ topic: "Chain rule, exponential", sub: "elin",
        tex: `f(x) = e^{${arg}}`, fSrc: `Math.exp(${argS})`,
        fpTex: `f'(x) = ${termTex(p, 0)}e^{${arg}}`, fpSrc: `${p} * Math.exp(${argS})`,
        a, answerTex: expAns(p, 1, m), windows: winSym(a, [2, 1.2, 3, 0.8]) });
    }
  for (const [c, n] of [[-1, 2], [1, 2], [1, 3], [-1, 3], [2, 2]])
    for (const a of [-2, -1, 0, 1, 2]) {
      const m = c * a ** n;
      if (Math.abs(m) > 4) continue;
      const argT = `${cf(c)}x^{${n}}`;
      const argS = `${c} * x ** ${n}`;
      add({ topic: "Chain rule, exponential", sub: "epow",
        tex: `f(x) = e^{${argT}}`, fSrc: `Math.exp(${argS})`,
        fpTex: `f'(x) = ${termTex(c * n, n - 1)}e^{${argT}}`, fpSrc: `${c * n} * x ** ${n - 1} * Math.exp(${argS})`,
        a, answerTex: expAns(c * n * a ** (n - 1), 1, m), windows: winSym(a, [2, 1.5, 3, 1]) });
    }
  for (const a of [1, -1])
    add({ topic: "Chain rule, exponential", sub: "einv",
      tex: "f(x) = e^{1/x}", fSrc: "Math.exp(1 / x)",
      fpTex: "f'(x) = -\\dfrac{e^{1/x}}{x^{2}}", fpSrc: "-Math.exp(1 / x) / x ** 2",
      a, answerTex: expAns(-1, a * a, 1 / a), windows: sideWin(a, 0, [2.2, 1.3, 3.5]) });
  for (const r of [1, 2, 3])
    add({ topic: "Chain rule, exponential", sub: "esqrt",
      tex: "f(x) = e^{\\sqrt{x}}", fSrc: "Math.exp(Math.sqrt(x))",
      fpTex: "f'(x) = \\dfrac{e^{\\sqrt{x}}}{2\\sqrt{x}}", fpSrc: "Math.exp(Math.sqrt(x)) / (2 * Math.sqrt(x))",
      a: r * r, answerTex: expAns(1, 2 * r, r),
      windows: winPos(r * r, [[0.12, 2.0], [0.3, 1.7], [0.04, 2.4]]) });
  for (const c of [1, 2, -1])
    for (const n of [2, 3])
      add({ topic: "Chain rule, exponential", sub: "expshift",
        tex: `f(x) = (e^{x} ${c < 0 ? "-" : "+"} ${Math.abs(c)})^{${n}}`,
        fSrc: `(Math.exp(x) + ${c}) ** ${n}`,
        fpTex: `f'(x) = ${n}${pw1(`(e^{x} ${c < 0 ? "-" : "+"} ${Math.abs(c)})`, n - 1)}e^{x}`,
        fpSrc: `${n} * (Math.exp(x) + ${c}) ** ${n - 1} * Math.exp(x)`,
        a: 0, answerTex: ansTex(n * (1 + c) ** (n - 1), 1), windows: winSym(0, [2, 1.4, 3]) });
  for (const p of [1, 2, -1, -2])
    for (const m of [-2, -1, 0, 1, 2]) {
      const a = m / p;
      const arg = p === 1 ? "x" : p === -1 ? "-x" : `${p}x`;
      const argS = p === 1 ? "x" : `${p} * x`;
      add({ topic: "Chain rule, exponential", sub: "xelin",
        tex: `f(x) = xe^{${arg}}`, fSrc: `x * Math.exp(${argS})`,
        fpTex: `f'(x) = (1 ${p < 0 ? "-" : "+"} ${termTex(Math.abs(p), 1)})e^{${arg}}`, fpSrc: `(1 + ${p} * x) * Math.exp(${argS})`,
        a, answerTex: expAns(1 + m, 1, m), windows: winSym(a, [2.5, 1.5, 4, 1]) });
    }
}

/* ================= Trigonometric ================= */
{
  const SIX = {
    sin: { tex: "\\sin x", src: "Math.sin(x)", dTex: "\\cos x", dSrc: "Math.cos(x)",
           val: k => cosX(k), win: a => winTrig(a) },
    cos: { tex: "\\cos x", src: "Math.cos(x)", dTex: "-\\sin x", dSrc: "-Math.sin(x)",
           val: k => symScale(sinX(k), -1), win: a => winTrig(a) },
    tan: { tex: "\\tan x", src: "Math.tan(x)", dTex: "\\sec^{2} x", dSrc: "1 / Math.cos(x) ** 2",
           val: k => (cosX(k)[0] === 0 ? null : symInv(symPow(cosX(k), 2))),
           win: a => branchWin(a, 1, Math.PI / 2, [0.1, 0.14, 0.07, 0.18]) },
    cot: { tex: "\\cot x", src: "Math.cos(x) / Math.sin(x)", dTex: "-\\csc^{2} x", dSrc: "-1 / Math.sin(x) ** 2",
           val: k => (sinX(k)[0] === 0 ? null : symScale(symInv(symPow(sinX(k), 2)), -1)),
           win: a => branchWin(a, 1, 0, [0.1, 0.14, 0.07, 0.18]) },
    sec: { tex: "\\sec x", src: "1 / Math.cos(x)", dTex: "\\sec x\\tan x", dSrc: "Math.sin(x) / Math.cos(x) ** 2",
           val: k => (cosX(k)[0] === 0 ? null : symDiv(sinX(k), symPow(cosX(k), 2))),
           win: a => branchWin(a, 1, Math.PI / 2, [0.1, 0.14, 0.07, 0.18]) },
    csc: { tex: "\\csc x", src: "1 / Math.sin(x)", dTex: "-\\csc x\\cot x", dSrc: "-Math.cos(x) / Math.sin(x) ** 2",
           val: k => (sinX(k)[0] === 0 ? null : symScale(symDiv(cosX(k), symPow(sinX(k), 2)), -1)),
           win: a => branchWin(a, 1, 0, [0.1, 0.14, 0.07, 0.18]) },
  };
  for (const [name, F] of Object.entries(SIX))
    for (const c of [1, 2, -1, 3])
      for (const k of KS) {
        const v0 = F.val(k);
        if (!v0) continue;
        add({ topic: "Trigonometric", sub: name,
          tex: `f(x) = ${cf(c)}${F.tex}`, fSrc: `${c} * (${F.src})`,
          fpTex: `f'(x) = ${c === 1 ? F.dTex : c === -1 ? (F.dTex.startsWith("-") ? F.dTex.slice(1) : `-${F.dTex}`) : `${c}${F.dTex.startsWith("-") ? `(${F.dTex})` : F.dTex}`}`,
          fpSrc: `${c} * (${F.dSrc})`,
          a: kAngle(k), answerTex: symAns(symScale(v0, c)), windows: F.win(kAngle(k)) });
      }
  for (const A of [1, 2, 3, -1])
    for (const B of [1, 2, -1, -3])
      for (const k of KS) {
        const v = symAdd(symScale(cosX(k), A), symScale(sinX(k), -B));
        if (!v) continue;
        add({ topic: "Trigonometric", sub: "combo",
          tex: `f(x) = ${termTex(A, 0, "\\sin x")} ${B < 0 ? "-" : "+"} ${termTex(Math.abs(B), 0, "\\cos x")}`,
          fSrc: `${A} * Math.sin(x) + ${B} * Math.cos(x)`,
          fpTex: `f'(x) = ${termTex(A, 0, "\\cos x")} ${B < 0 ? "+" : "-"} ${termTex(Math.abs(B), 0, "\\sin x")}`,
          fpSrc: `${A} * Math.cos(x) - ${B} * Math.sin(x)`,
          a: kAngle(k), answerTex: symAns(v), windows: winTrig(kAngle(k)) });
      }
}

/* ================= Exponential ================= */
{
  for (const c of [1, 2, 3, -1, -2])
    for (const [b1, b0] of [[0, 0], [1, 0], [0, 1], [-1, 0], [2, -1]])
      for (const m of [-2, -1, 0, 1, 2]) {
        const tail = b1 || b0 ? ` ${b1 || b0 > 0 ? "+" : "-"} ${b1 ? termTex(Math.abs(b1), 1) : Math.abs(b0)}` : "";
        const tailT = b1 ? ` ${b1 > 0 ? "+" : "-"} ${termTex(Math.abs(b1), 1)}` : b0 ? ` ${b0 > 0 ? "+" : "-"} ${Math.abs(b0)}` : "";
        const dTail = b1 ? ` ${b1 > 0 ? "+" : "-"} ${Math.abs(b1)}` : "";
        add({ topic: "Exponential", sub: "cex",
          tex: `f(x) = ${cf(c)}e^{x}${tailT}`, fSrc: `${c} * Math.exp(x) + ${b1} * x + ${b0}`,
          fpTex: `f'(x) = ${cf(c)}e^{x}${dTail}`, fpSrc: `${c} * Math.exp(x) + ${b1}`,
          a: m, answerTex: b1 ? sumTex(expAns(c, 1, m), ansTex(b1, 1)) : expAns(c, 1, m),
          windows: [[m - 3, m + 1.5], [m - 2, m + 1], [m - 4, m + 2]] });
      }
}

/* ================= Exponential, general base ================= */
{
  const pw = (b, m) => (m >= 0 ? [b ** m, 1] : [1, b ** -m]);
  for (const b of [2, 3, 5, 10])
    for (const c of [1, 2, -1])
      for (const m of [-2, -1, 0, 1, 2, 3]) {
        const [p, q] = pw(b, m);
        if (p > 2000 || q > 2000) continue;
        add({ topic: "Exponential, general base", sub: "bx",
          tex: `f(x) = ${cf(c)}${b}^{x}`, fSrc: `${c} * ${b} ** x`,
          fpTex: `f'(x) = ${cf(c)}${b}^{x}\\ln ${b}`, fpSrc: `${c} * ${b} ** x * Math.log(${b})`,
          a: m, answerTex: ansTex(c * p, q, lnB(b)),
          windows: [[m - 3, m + 1.5], [m - 2, m + 1], [m - 4, m + 2]] });
      }
  for (const b of [2, 3])
    for (const p of [2, -1, 3])
      for (const m of [-1, 0, 1, 2]) {
        const a = m / p;
        const [pn, qn] = pw(b, m);
        const arg = p === 1 ? "x" : p === -1 ? "-x" : `${p}x`;
        const argS = p === 1 ? "x" : `${p} * x`;
        add({ topic: "Exponential, general base", sub: "blin",
          tex: `f(x) = ${b}^{${arg}}`, fSrc: `${b} ** (${argS})`,
          fpTex: `f'(x) = ${termTex(p, 0)}${b}^{${arg}}\\ln ${b}`, fpSrc: `${p} * ${b} ** (${argS}) * Math.log(${b})`,
          a, answerTex: ansTex(p * pn, qn, lnB(b)), windows: winSym(a, [2, 1.2, 3]) });
      }
  for (const b of [2, 3])
    for (const a of [-1, 0, 1]) {
      const [pn, qn] = pw(b, a * a);
      add({ topic: "Exponential, general base", sub: "bquad",
        tex: `f(x) = ${b}^{x^{2}}`, fSrc: `${b} ** (x ** 2)`,
        fpTex: `f'(x) = 2x\\,${b}^{x^{2}}\\ln ${b}`, fpSrc: `2 * x * ${b} ** (x ** 2) * Math.log(${b})`,
        a, answerTex: ansTex(2 * a * pn, qn, lnB(b)), windows: winSym(a, [1.6, 1.1, 2.2]) });
    }
  for (const b of [2, 3])
    for (const m of [0, 1, 2, -1]) {
      const [pn, qn] = pw(b, m);
      add({ topic: "Exponential, general base", sub: "xbx",
        tex: `f(x) = x\\,${b}^{x}`, fSrc: `x * ${b} ** x`,
        fpTex: `f'(x) = ${b}^{x}(1 + x\\ln ${b})`, fpSrc: `${b} ** x * (1 + x * Math.log(${b}))`,
        a: m, answerTex: sumTex(ansTex(pn, qn), ansTex(m * pn, qn, lnB(b))),
        windows: [[m - 3, m + 1.5], [m - 2, m + 1], [m - 4, m + 2]] });
    }
  for (const b of [2, 3])
    for (const m of [0, 1, 2]) {
      const [pn, qn] = pw(b, m);
      add({ topic: "Exponential, general base", sub: "invbx",
        tex: `f(x) = \\left(\\dfrac{1}{${b}}\\right)^{x}`, fSrc: `(1 / ${b}) ** x`,
        fpTex: `f'(x) = -\\dfrac{\\ln ${b}}{${b}^{x}}`, fpSrc: `-((1 / ${b}) ** x) * Math.log(${b})`,
        a: m, answerTex: ansTex(-qn, pn, lnB(b)), windows: winSym(m, [2.5, 1.5, 4]) });
    }
}

/* ================= Logarithm ================= */
{
  for (const c of [1, 2, 3, -1])
    for (const k of [1, 2, 3, 5])
      for (const a of [1, 2, 3, 4, 6, 8]) {
        const kt = k === 1 ? "x" : `${k}x`;
        add({ topic: "Logarithm", sub: "clnkx",
          tex: `f(x) = ${cf(c)}\\ln(${kt})`, fSrc: `${c} * Math.log(${k} * x)`,
          fpTex: `f'(x) = ${monoTex(c, 1, -1, 1)}`, fpSrc: `${c} / x`,
          a, answerTex: ansTex(c, a),
          windows: winPos(a, [[0.1, 2.4], [0.03, 2.0], [0.3, 3.0]]) });
      }
  for (const b1 of [1, -1, 2])
    for (const a of [1, 2, 4])
      add({ topic: "Logarithm", sub: "lnplus",
        tex: `f(x) = \\ln x ${b1 < 0 ? "-" : "+"} ${termTex(Math.abs(b1), 1)}`,
        fSrc: `Math.log(x) + ${b1} * x`,
        fpTex: `f'(x) = \\dfrac{1}{x} ${b1 < 0 ? "-" : "+"} ${Math.abs(b1)}`, fpSrc: `1 / x + ${b1}`,
        a, answerTex: ansTex(1 + b1 * a, a),
        windows: winPos(a, [[0.1, 2.4], [0.03, 2.0], [0.3, 3.0]]) });
}

/* ================= Logarithm, chain rule ================= */
{
  for (const p of [1, 2, 3, -1])
    for (const q of [1, 2, -1, 3])
      for (const a of [0, 1, 2, 3]) {
        if (p * a + q <= 0) continue;
        add({ topic: "Logarithm, chain rule", sub: "lnlin",
          tex: `f(x) = \\ln(${lin(p, q)})`, fSrc: `Math.log(${linSrc(p, q)})`,
          fpTex: `f'(x) = ${fracTex(p, lin(p, q))}`, fpSrc: `${p} / (${linSrc(p, q)})`,
          a, answerTex: ansTex(p, p * a + q),
          windows: sideWin(a, -q / p, [2.2, 1.3, 3.5, 0.7]) });
      }
  for (const c of [1, 2, 4, 9])
    for (const a of [-3, -2, -1, 0, 1, 2, 3])
      add({ topic: "Logarithm, chain rule", sub: "lnquad",
        tex: `f(x) = \\ln(${polyTex([c, 0, 1])})`, fSrc: `Math.log(${polySrc([c, 0, 1])})`,
        fpTex: `f'(x) = \\dfrac{2x}{${polyTex([c, 0, 1])}}`, fpSrc: `2 * x / (${polySrc([c, 0, 1])})`,
        a, answerTex: ansTex(2 * a, a * a + c), windows: winSym(a, [4, 3, 6, 2]) });
  for (const n of [2, 3])
    for (const j of [0, 1, 2]) {
      const a = Math.E ** j;
      add({ topic: "Logarithm, chain rule", sub: "lnpow",
        tex: `f(x) = (\\ln x)^{${n}}`, fSrc: `Math.log(x) ** ${n}`,
        fpTex: `f'(x) = \\dfrac{${n}(\\ln x)^{${n - 1}}}{x}`.replace("^{1}", ""),
        fpSrc: `${n} * Math.log(x) ** ${n - 1} / x`,
        a, aTex: j === 0 ? "1" : j === 1 ? "e" : `e^{${j}}`,
        aSrc: j === 0 ? "1" : j === 1 ? "Math.E" : `Math.E ** ${j}`,
        answerTex: expAns(n * j ** (n - 1), 1, -j),
        windows: [[0.05, a * 2.2], [0.02, a * 1.6], [0.3, a * 3]] });
    }
  for (const trig of ["sin", "cos"])
    for (const k of KS) {
      const S = sinX(k), C = cosX(k);
      const denom = trig === "sin" ? S : C;
      if (denom[0] <= 0) continue;                       // need the argument positive
      const v = trig === "sin" ? symDiv(C, S) : symScale(symDiv(S, C), -1);
      add({ topic: "Logarithm, chain rule", sub: `ln${trig}`,
        tex: `f(x) = \\ln(\\${trig} x)`, fSrc: `Math.log(Math.${trig}(x))`,
        fpTex: `f'(x) = ${trig === "sin" ? "\\cot x" : "-\\tan x"}`,
        fpSrc: trig === "sin" ? "Math.cos(x) / Math.sin(x)" : "-Math.tan(x)",
        a: kAngle(k), answerTex: symAns(v),
        windows: branchWin(kAngle(k), 1, trig === "sin" ? 0 : Math.PI / 2, [0.1, 0.14, 0.07, 0.18]) });
    }
  for (const j of [1, 4]) {
    const a = Math.E ** j, s = Math.sqrt(j);
    add({ topic: "Logarithm, chain rule", sub: "sqrtln",
      tex: "f(x) = \\sqrt{\\ln x}", fSrc: "Math.sqrt(Math.log(x))",
      fpTex: "f'(x) = \\dfrac{1}{2x\\sqrt{\\ln x}}", fpSrc: "1 / (2 * x * Math.sqrt(Math.log(x)))",
      a, aTex: j === 1 ? "e" : `e^{${j}}`, aSrc: j === 1 ? "Math.E" : `Math.E ** ${j}`,
      answerTex: expAns(1, 2 * s, -j),
      windows: [[1.02, a * 1.6], [1.05, a * 1.2], [1.005, a * 2.2]] });
  }
}

/* ================= Logarithm, general base ================= */
{
  for (const b of [2, 3, 5, 10])
    for (const a of [1, 2, 3, 4, 6, 8])
      add({ topic: "Logarithm, general base", sub: "logbx",
        tex: `f(x) = \\log_{${b}} x`, fSrc: `Math.log(x) / Math.log(${b})`,
        fpTex: `f'(x) = \\dfrac{1}{x\\ln ${b}}`, fpSrc: `1 / (x * Math.log(${b}))`,
        a, answerTex: ansTex(1, a, "", lnB(b)),
        windows: winPos(a, [[0.1, 2.4], [0.03, 2.0], [0.3, 3.0]]) });
  for (const b of [2, 3])
    for (const p of [1, 2, 3])
      for (const q of [1, 2, -1])
        for (const a of [0, 1, 2, 3]) {
          if (p * a + q <= 0) continue;
          add({ topic: "Logarithm, general base", sub: "logblin",
            tex: `f(x) = \\log_{${b}}(${lin(p, q)})`, fSrc: `Math.log(${linSrc(p, q)}) / Math.log(${b})`,
            fpTex: `f'(x) = ${fracTex(p, `(${lin(p, q)})\\ln ${b}`)}`, fpSrc: `${p} / ((${linSrc(p, q)}) * Math.log(${b}))`,
            a, answerTex: ansTex(p, p * a + q, "", lnB(b)),
            windows: sideWin(a, -q / p, [2.2, 1.3, 3.5, 0.7]) });
        }
  for (const b of [2, 3])
    for (const c of [1, 4, 9])
      for (const a of [-2, -1, 0, 1, 2])
        add({ topic: "Logarithm, general base", sub: "logbquad",
          tex: `f(x) = \\log_{${b}}(${polyTex([c, 0, 1])})`,
          fSrc: `Math.log(${polySrc([c, 0, 1])}) / Math.log(${b})`,
          fpTex: `f'(x) = \\dfrac{2x}{(${polyTex([c, 0, 1])})\\ln ${b}}`,
          fpSrc: `2 * x / ((${polySrc([c, 0, 1])}) * Math.log(${b}))`,
          a, answerTex: ansTex(2 * a, a * a + c, "", lnB(b)), windows: winSym(a, [4, 3, 6, 2]) });
}

module.exports = {};
