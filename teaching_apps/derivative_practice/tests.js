/* Run with:  node tests.js

   The point of this file is the first suite.  Every problem in the bank stores
   a derivative that was worked out by hand, and a hand-worked derivative is
   exactly the kind of thing that is wrong.  So each `fp` is checked against a
   five-point finite difference of the corresponding `f`, which shares no code
   with it: the two agree only if the calculus was done right. */

const { parse } = require("./parse.js");
const { PROBLEMS } = require("./problems.js");
const { zoomInterval, panInterval, plotRanges, MAX_ZOOM } = require("./plot.js");
const { shuffledBag } = require("./deal.js");

let failures = 0;
const check = (name, condition, detail = "") => {
  if (condition) return;
  failures++;
  console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
};

/* Five-point stencil: error is O(h^4), so with h = 1e-3 the approximation is
   good to roughly 1e-12 while staying far from catastrophic cancellation. */
const numericalDerivative = (f, x, h = 1e-3) =>
  (f(x - 2 * h) - 8 * f(x - h) + 8 * f(x + h) - f(x + 2 * h)) / (12 * h);

const closeTo = (u, v, tolerance = 1e-6) =>
  Math.abs(u - v) <= Math.max(tolerance, tolerance * Math.abs(v));

console.log("Every stored derivative agrees with a finite difference");
for (const problem of PROBLEMS) {
  const label = problem.tex.replace(/\\d?frac/g, "frac");
  const { f, fp, a } = problem;

  check(`${label}: f is finite at a`, Number.isFinite(f(a)), `f(${a}) = ${f(a)}`);
  check(`${label}: f' is finite at a`, Number.isFinite(fp(a)), `f'(${a}) = ${fp(a)}`);

  /* Check at the marked point and at a few neighbours, so that an `fp` which
     happens to be right at `a` by coincidence still gets caught. */
  for (const x of [a, a - 0.31, a + 0.29, a + 0.7]) {
    const exact = fp(x);
    const approx = numericalDerivative(f, x);
    if (!Number.isFinite(exact) || !Number.isFinite(approx)) continue;
    check(
      `${label}: f' matches at x = ${x.toFixed(4)}`,
      closeTo(approx, exact, 1e-5),
      `stored ${exact}, finite difference ${approx}`,
    );
  }

  check(
    `${label}: the graph window contains a`,
    problem.window[0] <= a && a <= problem.window[1],
    `a = ${a} outside [${problem.window}]`,
  );
}

console.log("Every stated answer parses to the value of f' at a");
for (const problem of PROBLEMS) {
  const label = problem.tex.replace(/\\d?frac/g, "frac");
  /* answerTex is TeX for a human; strip the TeX so the parser sees what a
     student would type.  This keeps the displayed answer and the graded value
     from drifting apart. */
  const plain = problem.answerTex
    .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\(pi|ln)/g, "$1")
    .replace(/\\,|\\!|\s/g, "");
  let value;
  try { value = parse(plain); } catch (error) { value = NaN; }
  check(
    `${label}: "${problem.answerTex}" -> f'(a)`,
    closeTo(value, problem.fp(problem.a), 1e-12),
    `parsed ${value}, expected ${problem.fp(problem.a)} (from "${plain}")`,
  );
}

console.log("The parser reads what a calculus student types");
const parseCases = [
  ["8", 8], ["-1/4", -0.25], ["0.8", 0.8], ["4/5", 0.8],
  ["sqrt(2)/2", Math.SQRT2 / 2], ["1/sqrt(2)", 1 / Math.SQRT2],
  ["3e", 3 * Math.E], ["-2/e", -2 / Math.E],
  ["pi", Math.PI], ["pi/6", Math.PI / 6], ["2*pi/3", (2 * Math.PI) / 3],
  ["2 pi", 2 * Math.PI], ["-pi", -Math.PI],
  ["2^3", 8], ["2^-1", 0.5], ["-2^2", -4], ["2^3^2", 512],
  ["ln(e)", 1], ["exp(0)", 1], ["cos(0)", 1], ["abs(-3)", 3],
  ["(1+2)(3)", 9], ["1 - 2 - 3", -4], ["8/4/2", 1],
];
for (const [source, expected] of parseCases) {
  let value;
  try { value = parse(source); } catch (error) { value = `error: ${error.message}`; }
  check(`parse("${source}")`, closeTo(value, expected, 1e-12), `got ${value}, expected ${expected}`);
}

console.log("The parser refuses what it cannot read");
const rejected = ["", "x", "2 +", "sqrt 2", "(1", "1/0", "2**3", "hello(2)", "1.2.3", "alert(1)"];
for (const source of rejected) {
  let threw = false;
  try { parse(source); } catch (error) { threw = true; }
  check(`parse("${source}") is rejected`, threw, "it returned a value instead");
}

console.log("Zooming shrinks both axes by the same factor about the point");
for (const [low, high, center] of [[-3, 3, 2], [0.4, 5, 2], [0, 16, 9], [-2, 2, -1]]) {
  const span = high - low;
  check(
    `[${low}, ${high}] at zoom 1 is unchanged`,
    zoomInterval([low, high], center, 1).every((v, i) => closeTo(v, [low, high][i], 1e-12)),
    `got [${zoomInterval([low, high], center, 1)}]`,
  );
  for (const zoom of [2, 10, 1000]) {
    const [zLow, zHigh] = zoomInterval([low, high], center, zoom);
    check(
      `[${low}, ${high}] at zoom ${zoom}: span divided by ${zoom}`,
      closeTo(zHigh - zLow, span / zoom, 1e-9),
      `span ${zHigh - zLow}, expected ${span / zoom}`,
    );
    check(
      `[${low}, ${high}] at zoom ${zoom}: still contains ${center}`,
      zLow <= center && center <= zHigh,
      `[${zLow}, ${zHigh}]`,
    );
    /* The centre must keep its place in the frame, or magnifying would slide
       the point of tangency around the canvas. */
    check(
      `[${low}, ${high}] at zoom ${zoom}: ${center} holds its position in frame`,
      closeTo((center - zLow) / (zHigh - zLow), (center - low) / span, 1e-9),
    );
  }
}

/* The claim the zoom is there to demonstrate, checked as a number rather than
   trusted as a picture.  Measured in fractions of the visible height -- which
   is what the eye actually sees, since the frame shrinks along with the window
   -- the curve's departure from its true tangent dies away, while a wrong
   line's departure does not move at all.  The second half is the one that
   matters most: it is what stops magnification from being a way to flatter a
   wrong answer. */
console.log("Under magnification the curve meets its tangent and a wrong line does not");
const COLUMNS = 600;
/* A canvas this app will plausibly be given; used only to turn a fraction of
   the frame into a number of pixels. */
const PLOT_PIXELS = 400;

for (const problem of PROBLEMS) {
  const label = problem.tex.replace(/\\d?frac/g, "frac");
  const { f, fp, a } = problem;
  const fa = f(a);
  const truth = fp(a);
  const wrong = truth + 1;

  /* Largest gap at either edge of the window -- where both gaps are widest --
     as a fraction of the visible height. */
  const gaps = zoom => {
    const { xRange, yRange } = plotRanges({ f, a, fa, xRange: problem.window, zoom }, COLUMNS);
    const height = yRange[1] - yRange[0];
    const edges = [xRange[0], xRange[1]];
    return {
      bend: Math.max(...edges.map(x => Math.abs(f(x) - (fa + truth * (x - a))) / height)),
      tilt: Math.max(...edges.map(x => Math.abs((wrong - truth) * (x - a)) / height)),
      xRange,
      yRange,
    };
  };

  check(
    `${label}: window is drawable at zoom 1`,
    Number.isFinite(gaps(1).bend) && Number.isFinite(gaps(1).tilt),
    "f is undefined at a window edge",
  );

  /* From 100x on, the window is small enough that the quadratic term rules and
     the gap falls off like 1/zoom.  Below that a cubic or worse term is still
     in play, so the rate is not yet the rate being claimed -- which is why the
     comparison starts at 100 rather than at 1. */
  for (const zoom of [100, 1000]) {
    const here = gaps(zoom);
    const deeper = gaps(zoom * 10);
    check(
      `${label}: curve-to-tangent gap falls off like 1/zoom past ${zoom}x`,
      deeper.bend <= here.bend / 5 + 1e-12,
      `${here.bend} at ${zoom}x, ${deeper.bend} at ${zoom * 10}x -- expected about a tenth`,
    );
  }

  /* The wrong line, by contrast, is exactly as wrong as it ever was: shrinking
     both axes by the same factor leaves every on-screen angle alone. */
  const base = gaps(1);
  for (const zoom of [10, 1000, MAX_ZOOM]) {
    const here = gaps(zoom);
    check(
      `${label}: a wrong slope stays just as wrong at ${zoom}x`,
      closeTo(here.tilt, base.tilt, 1e-9) && here.tilt > 1e-3,
      `gap ${here.tilt} at zoom ${zoom}, ${base.tilt} at zoom 1`,
    );
    check(
      `${label}: the point stays in view at ${zoom}x`,
      here.xRange[0] <= a && a <= here.xRange[1] &&
        here.yRange[0] <= fa && fa <= here.yRange[1],
      `x [${here.xRange}], y [${here.yRange}], point (${a}, ${fa})`,
    );
  }

  /* And the promise the slider makes: at the far end, "merges with the curve"
     is literal -- the two are less than half a pixel apart. */
  const pixels = gaps(MAX_ZOOM).bend * PLOT_PIXELS;
  check(
    `${label}: within half a pixel of its tangent at ${MAX_ZOOM}x`,
    pixels < 0.5,
    `${pixels.toFixed(2)}px apart on a ${PLOT_PIXELS}px plot`,
  );
}

/* Dragging the graph.  A pan is a pure translation measured in fractions of the
   visible window, so it must move the window without rescaling it -- which is
   what keeps every angle, and so the zoom's whole argument, intact -- and the
   zoom must go on magnifying about the marked point, holding that point
   wherever the drag put it on screen. */
console.log("Dragging moves the window without rescaling it");
check("panInterval by 0 is the identity",
  panInterval([-2, 3], 0).every((v, i) => v === [-2, 3][i]));
check("panInterval by a whole window moves it one width",
  panInterval([-2, 3], 1).every((v, i) => closeTo(v, [3, 8][i], 1e-12)));
check("panInterval by a negative fraction moves it the other way",
  panInterval([-2, 3], -0.4).every((v, i) => closeTo(v, [-4, 1][i], 1e-12)));

for (const problem of PROBLEMS) {
  const label = problem.tex.replace(/\\d?frac/g, "frac");
  const { f, a } = problem;
  const fa = f(a);
  const spec = { f, a, fa, xRange: problem.window };
  const span = ([low, high]) => high - low;
  const inFrame = (value, [low, high]) => (value - low) / (high - low);

  /* No drag at all must leave every existing window exactly as it was. */
  const plain = plotRanges({ ...spec, zoom: 1 }, COLUMNS);
  const still = plotRanges({ ...spec, zoom: 1, pan: { x: 0, y: 0 } }, COLUMNS);
  check(`${label}: a zero pan changes nothing`,
    [0, 1].every(i => plain.xRange[i] === still.xRange[i] && plain.yRange[i] === still.yRange[i]));

  for (const pan of [{ x: 0.3, y: -0.2 }, { x: -1.7, y: 2.5 }]) {
    const screen = [];
    for (const zoom of [1, 100, MAX_ZOOM]) {
      const flat = plotRanges({ ...spec, zoom }, COLUMNS);
      const moved = plotRanges({ ...spec, zoom, pan }, COLUMNS);
      check(`${label}: pan (${pan.x}, ${pan.y}) at ${zoom}x keeps both spans`,
        closeTo(span(moved.xRange), span(flat.xRange), 1e-9) &&
          closeTo(span(moved.yRange), span(flat.yRange), 1e-9),
        `x ${span(flat.xRange)} -> ${span(moved.xRange)}, y ${span(flat.yRange)} -> ${span(moved.yRange)}`);
      check(`${label}: pan (${pan.x}, ${pan.y}) at ${zoom}x shifts by that fraction of the window`,
        closeTo(moved.xRange[0] - flat.xRange[0], pan.x * span(flat.xRange), 1e-9) &&
          closeTo(moved.yRange[0] - flat.yRange[0], pan.y * span(flat.yRange), 1e-9));
      screen.push([inFrame(a, moved.xRange), inFrame(fa, moved.yRange)]);
    }
    check(`${label}: pan (${pan.x}, ${pan.y}) holds the point in place on screen as the zoom changes`,
      screen.every(([sx, sy]) => closeTo(sx, screen[0][0], 1e-6) && closeTo(sy, screen[0][1], 1e-6)),
      `screen positions ${JSON.stringify(screen)}`);
  }
}

/* The order problems arrive in.  A shuffle is the kind of thing that looks
   right on screen while being wrong -- biased towards some problems, or
   handing back the problem just answered -- so it is driven here by a seeded
   generator and checked as counting rather than trusted as an impression. */
/* Every TeX string the student will actually see, rendered.  Malformed TeX
   fails silently in the app -- katex is called with throwOnError off, so a bad
   string turns into red text on the page rather than an error anywhere a
   developer would notice.  Rendering the whole bank here is what catches it.
   Skipped rather than failed if vendor/ is missing, since the suite should
   still run on its own. */
console.log("Every TeX string in the bank renders");
let katex = null;
try { katex = require("./vendor/katex/katex.min.js"); } catch (error) { katex = null; }
if (!katex) {
  console.log("  (skipped: vendor/katex not found)");
} else {
  for (const problem of PROBLEMS) {
    const label = problem.tex.replace(/\\d?frac/g, "frac");
    const shown = [
      ["tex", problem.tex],
      ["fpTex", problem.fpTex],
      ["aTex", problem.aTex],
      ["answerTex", problem.answerTex],
      /* the two the app assembles rather than stores */
      ["prompt", `f'(${problem.aTex})`],
      ["reveal", `f'(${problem.aTex}) = ${problem.answerTex} \\approx 1`],
    ];
    for (const [field, source] of shown) {
      let failed = "";
      try { katex.renderToString(source, { throwOnError: true }); }
      catch (error) { failed = error.message; }
      check(`${label}: ${field} renders`, !failed, `${JSON.stringify(source)} -- ${failed}`);
    }
  }
}

console.log("Problems are dealt in a random order that covers the whole bank");
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

{
  const random = seeded(12345);
  for (let trial = 0; trial < 200; trial++) {
    const bag = shuffledBag(PROBLEMS.length, null, random);
    check("a bag holds every problem exactly once",
      bag.length === PROBLEMS.length && new Set(bag).size === PROBLEMS.length,
      `${bag.length} entries, ${new Set(bag).size} distinct`);
    check("a bag holds only real indices",
      bag.every(i => Number.isInteger(i) && i >= 0 && i < PROBLEMS.length));
  }
}

/* Every problem is equally likely to be the next one.  A shuffle that favours
   some entries would still look random to a student, and would quietly stop
   parts of the bank from ever coming up. */
{
  const random = seeded(98765);
  const SIZE = 10, TRIALS = 6000;
  const firstOut = new Array(SIZE).fill(0);
  for (let trial = 0; trial < TRIALS; trial++) firstOut[shuffledBag(SIZE, null, random)[SIZE - 1]]++;
  const expected = TRIALS / SIZE;
  for (let i = 0; i < SIZE; i++)
    check(`problem ${i} comes up about as often as any other`,
      Math.abs(firstOut[i] - expected) < expected / 2,
      `dealt first ${firstOut[i]} times in ${TRIALS}, expected about ${expected}`);
}

/* The one thing the student would notice: the same problem twice running. */
{
  const random = seeded(24680);
  let current = 0;
  let bag = shuffledBag(PROBLEMS.length, null, random);
  const seen = new Set();
  for (let step = 0; step < 5 * PROBLEMS.length; step++) {
    if (!bag.length) bag = shuffledBag(PROBLEMS.length, current, random);
    const next = bag.pop();
    check("the next problem is never the one just shown", next !== current,
      `problem ${next} repeated at step ${step}`);
    current = next;
    seen.add(next);
  }
  check("every problem in the bank does come up",
    seen.size === PROBLEMS.length, `${seen.size} of ${PROBLEMS.length} seen`);
}

console.log(failures ? `\n${failures} failing check(s)` : "\nAll checks passed");

process.exit(failures ? 1 : 0);
