/* Wiring: render a problem, wait for the student to press Enter, then draw the
   line their number describes.  Nothing is drawn while they type -- the line
   appearing is the response to their claim, not a running commentary on it. */

const $ = selector => document.querySelector(selector);

const canvas = $("#plot");
const answerInput = $("#answer");
const feedbackBox = $("#feedback");
const revealBox = $("#reveal");
const slopeReadout = $("#slope-readout");
const legendStudent = $("#legend-student");
const legendAnswer = $("#legend-answer");
const zoomInput = $("#zoom");
const zoomReadout = $("#zoom-readout");
const zoomWindow = $("#zoom-window");

/* An answer counts as right when it agrees to nine significant figures, which
   every exact expression does and no rounded decimal does.  Between that and
   ROUGH_TOLERANCE the student gets told they have the right number in the
   wrong form -- worth separating, because "0.707" is a different mistake from
   "I differentiated wrongly". */
const EXACT_TOLERANCE = 1e-9;
const ROUGH_TOLERANCE = 5e-3;

const agree = (u, v, tolerance) => Math.abs(u - v) <= tolerance * Math.max(1, Math.abs(v));

/* The slider is linear in the exponent, so equal travel is equal magnification:
   a quarter of the way in is 10x, halfway is 100x, all the way is MAX_ZOOM.
   The gap between a curve and its tangent only starts halving properly once
   the window is small enough for the quadratic term to dominate -- around
   100x here -- after which it falls off like 1/zoom.  MAX_ZOOM (plot.js) is
   the decade where that gap goes sub-pixel for every function in the bank. */
const zoomFor = slider => MAX_ZOOM ** (Number(slider) / 100);

const state = {
  index: 0,
  studentSlope: null,
  revealed: false,
  zoom: 1,
  /* Problems are dealt from a shuffled bag rather than walked in order, so a
     student meets the rules mixed together instead of forty power-rule
     problems in a row.  The bag empties before any problem repeats. */
  bag: [],
  /* What "Previous" walks back through, since there is no fixed order to
     step backwards along. */
  history: [],
};

const refillBag = avoid => { state.bag = shuffledBag(PROBLEMS.length, avoid); };

const tex = (source, display = false) =>
  katex.renderToString(source, { throwOnError: false, displayMode: display });

const problem = () => PROBLEMS[state.index];

function colors() {
  const style = getComputedStyle(document.body);
  const read = name => style.getPropertyValue(name).trim();
  return {
    grid: read("--grid"), axis: read("--axis"), muted: read("--muted"),
    curve: read("--curve"), student: read("--student"), answer: read("--answer"),
    point: read("--ink"), card: read("--card"),
  };
}

/* "x1", "x2.5", "x316", "x10,000" -- one decimal only where it carries
   information, which is below ten. */
const formatZoom = value =>
  value < 9.95
    ? `\u00d7${Number(value.toFixed(1))}`
    : `\u00d7${Math.round(value).toLocaleString("en-US")}`;

/* Enough decimals to show that the endpoints differ at all: the window loses an
   order of magnitude with every order of magnification, and a readout of
   "[2.00, 2.00]" would hide exactly the thing being demonstrated. */
function formatWindow([low, high]) {
  const places = Math.min(9, Math.max(2, 2 - Math.floor(Math.log10(high - low))));
  return `x from ${low.toFixed(places)} to ${high.toFixed(places)}`;
}

function redraw() {
  const current = problem();
  const drawn = drawPlot(canvas, {
    f: current.f,
    a: current.a,
    fa: current.f(current.a),
    xRange: current.window,
    zoom: state.zoom,
    studentSlope: state.studentSlope,
    trueSlope: state.revealed ? current.fp(current.a) : null,
    colors: colors(),
  });
  legendStudent.hidden = state.studentSlope === null;
  legendAnswer.hidden = !state.revealed;

  zoomReadout.textContent = formatZoom(state.zoom);
  zoomInput.setAttribute("aria-valuetext", `${formatZoom(state.zoom)} magnification`);
  /* drawPlot declines to draw into a canvas with no area yet, and returns
     nothing when it does; leave the last readout standing in that case. */
  if (drawn) zoomWindow.textContent = formatWindow(drawn.xRange);
}

const round = value => Number(value.toPrecision(6)).toString();

function say(kind, html) {
  feedbackBox.className = `feedback ${kind}`;
  feedbackBox.innerHTML = html;
  feedbackBox.hidden = false;
}

function loadProblem() {
  const current = problem();
  state.studentSlope = null;
  state.revealed = false;
  /* A new problem opens at its own window.  Carrying a 5,000x zoom over to a
     function the student has not looked at yet would show them a blank slope. */
  state.zoom = 1;
  zoomInput.value = "0";

  $("#statement").innerHTML = tex(current.tex, true);
  $("#point").innerHTML = tex(`a = ${current.aTex}`, true);
  $("#prompt").innerHTML = `Enter the value of ${tex(`f'(${current.aTex})`)}.`;

  feedbackBox.hidden = true;
  revealBox.hidden = true;
  slopeReadout.textContent = "";
  answerInput.value = "";
  answerInput.focus();
  $("#prev").disabled = state.history.length === 0;

  redraw();
}

function reveal() {
  const current = problem();
  state.revealed = true;
  revealBox.innerHTML =
    `<span class="label">Answer</span>${tex(current.fpTex, true)}` +
    tex(`f'(${current.aTex}) = ${current.answerTex} \\approx ${round(current.fp(current.a))}`, true);
  revealBox.hidden = false;
  redraw();
}

$("#answer-form").addEventListener("submit", event => {
  event.preventDefault();
  const current = problem();
  const truth = current.fp(current.a);

  let slope;
  try {
    slope = parse(answerInput.value);
  } catch (error) {
    state.studentSlope = null;
    slopeReadout.textContent = "";
    say("note", `I could not read that. ${error.message}`);
    redraw();
    return;
  }

  state.studentSlope = slope;
  slopeReadout.textContent = `slope ${round(slope)}`;

  if (agree(slope, truth, EXACT_TOLERANCE)) {
    say("right", "Correct. Your line touches the curve at the point and matches its direction there — that is what it means to be the tangent.");
  } else if (agree(slope, truth, ROUGH_TOLERANCE)) {
    say("note", "That is the right number, rounded. Enter it exactly — something like <code>sqrt(2)/2</code>, <code>pi/6</code> or <code>-2/e</code>.");
  } else {
    /* Name the specific way the line is wrong, since that is what the student
       is meant to read off the picture. A sign error and a magnitude error
       look quite different on the graph and deserve different sentences. */
    let diagnosis;
    if (truth !== 0 && slope !== 0 && Math.sign(slope) !== Math.sign(truth)) {
      diagnosis = "your line slopes the wrong way — check the sign";
    } else if (slope === 0) {
      diagnosis = "your line is horizontal, but the curve is still climbing or falling there";
    } else if (Math.abs(slope) > Math.abs(truth)) {
      diagnosis = "your line is too steep";
    } else {
      diagnosis = "your line is too shallow";
    }
    say("wrong", `Not the tangent. It passes through the point but cuts across the curve: ${diagnosis}.`);
  }
  redraw();
});

$("#show").addEventListener("click", reveal);

zoomInput.addEventListener("input", () => {
  state.zoom = zoomFor(zoomInput.value);
  redraw();
});
$("#zoom-reset").addEventListener("click", () => {
  zoomInput.value = "0";
  state.zoom = 1;
  redraw();
});

function nextProblem() {
  if (!state.bag.length) refillBag(state.index);
  state.history.push(state.index);
  state.index = state.bag.pop();
  loadProblem();
}
function previousProblem() {
  if (!state.history.length) return;
  state.index = state.history.pop();
  loadProblem();
}
$("#next").addEventListener("click", nextProblem);
$("#prev").addEventListener("click", previousProblem);

window.addEventListener("resize", redraw);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redraw);

document.querySelectorAll("[data-tex]").forEach(node => {
  node.innerHTML = tex(node.dataset.tex);
});

/* Open on a problem picked at random, not on whichever one happens to sit at
   the top of the bank. */
refillBag(null);
state.index = state.bag.pop();
loadProblem();
