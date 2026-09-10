/* Canvas drawing.  Hand-rolled rather than pulled from a plotting library,
   because the one thing this app has to get right -- keeping the curve, the
   marked point and a possibly very wrong tangent line all legible at once --
   is exactly the thing a general-purpose library makes hard to control. */

const MARGIN = { top: 18, right: 20, bottom: 34, left: 54 };

/* A tick spacing of 1, 2 or 5 times a power of ten, whichever lands nearest
   to `target` divisions across the span. */
function niceStep(span, target = 8) {
  const raw = span / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const digits = raw / magnitude;
  const step = digits < 1.5 ? 1 : digits < 3 ? 2 : digits < 7 ? 5 : 10;
  return step * magnitude;
}

const formatTick = (value, step) => {
  if (Math.abs(value) < step / 1000) return "0";
  const places = Math.min(6, Math.max(0, -Math.floor(Math.log10(step))));
  return Number(value.toFixed(places)).toString();
};

/* The vertical extent is inferred from the function's own values, trimmed at
   the 2nd and 98th percentile.  Trimming is what keeps a vertical asymptote
   (tan x, 1/x^2) from flattening the interesting part of the graph into a
   horizontal line.  The value f(a) is then forced back in, since the marked
   point must never be off-screen. */
function verticalRange(values, fa) {
  const sorted = values.filter(Number.isFinite).sort((u, v) => u - v);
  if (!sorted.length) return [-1, 1];
  const at = q => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))];
  let low = Math.min(at(0.02), fa);
  let high = Math.max(at(0.98), fa);
  if (high - low < 1e-9) { low -= 1; high += 1; }
  const padding = 0.12 * (high - low);
  return [low - padding, high + padding];
}

/* The top of the zoom range.  Chosen by measurement rather than taste: across
   the whole problem bank, 10,000x is the first decade at which every curve sits
   within half a pixel of its own tangent on a canvas the size of this one (the
   worst case, x sin x, is 0.43px; at 1,000x it is still a visible 4.3px).  So
   the far end of the slider is exactly where "merges with the curve" stops
   being a figure of speech.  tests.js checks this. */
const MAX_ZOOM = 1e4;

/* Shrink an interval about `center` by `zoom`, keeping each side's share of
   the span.  At zoom 1 it is the identity, so the opening view is untouched.
   Both axes are shrunk by the same factor, which is what makes magnification
   honest: every on-screen angle is preserved, so a wrong slope stays just as
   wrong however far in you go, while the curve's own bend -- second order in
   the window width, against a first-order frame -- falls away. */
function zoomInterval([low, high], center, zoom) {
  return [center - (center - low) / zoom, center + (high - center) / zoom];
}

const sampleAcross = (f, [low, high], columns) => {
  const values = [];
  for (let column = 0; column <= columns; column++) {
    values.push(f(low + ((high - low) * column) / columns));
  }
  return values;
};

/* The window actually drawn.  Separated out so the tests can ask for exactly
   the ranges the canvas will use. */
function plotRanges(spec, columns) {
  const zoom = Math.max(1, spec.zoom || 1);
  const baseValues = sampleAcross(spec.f, spec.xRange, columns);
  const baseY = verticalRange(baseValues, spec.fa);
  return {
    xRange: zoomInterval(spec.xRange, spec.a, zoom),
    yRange: zoomInterval(baseY, spec.fa, zoom),
    baseValues,
    zoom,
  };
}

function drawPlot(canvas, spec) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const left = MARGIN.left;
  const right = width - MARGIN.right;
  const top = MARGIN.top;
  const bottom = height - MARGIN.bottom;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  if (plotWidth <= 0 || plotHeight <= 0) return;

  const { xRange, yRange, baseValues, zoom } = plotRanges(spec, plotWidth);
  const [xLow, xHigh] = xRange;
  const [yLow, yHigh] = yRange;
  const values = zoom === 1 ? baseValues : sampleAcross(spec.f, xRange, plotWidth);

  const toX = x => left + ((x - xLow) / (xHigh - xLow)) * plotWidth;
  const toY = y => bottom - ((y - yLow) / (yHigh - yLow)) * plotHeight;

  const { colors } = spec;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";

  /* Grid and tick labels. */
  const xStep = niceStep(xHigh - xLow, zoom > 1 ? 5 : 8);
  const yStep = niceStep(yHigh - yLow, 6);
  ctx.strokeStyle = colors.grid;
  ctx.fillStyle = colors.muted;
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let x = Math.ceil(xLow / xStep) * xStep; x <= xHigh; x += xStep) {
    const px = Math.round(toX(x)) + 0.5;
    ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
    ctx.fillText(formatTick(x, xStep), px, bottom + 7);
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let y = Math.ceil(yLow / yStep) * yStep; y <= yHigh; y += yStep) {
    const py = Math.round(toY(y)) + 0.5;
    ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke();
    ctx.fillText(formatTick(y, yStep), left - 8, py);
  }

  /* Axes, drawn only where the origin is actually in view. */
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 1.25;
  if (xLow <= 0 && 0 <= xHigh) {
    const px = Math.round(toX(0)) + 0.5;
    ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
  }
  if (yLow <= 0 && 0 <= yHigh) {
    const py = Math.round(toY(0)) + 0.5;
    ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, plotWidth, plotHeight);
  ctx.clip();

  /* The candidate line, and the true tangent when it has been revealed.  Both
     are drawn under the curve so the curve stays readable where they overlap
     -- which is precisely what a correct answer looks like. */
  const line = (slope, stroke, dash) => {
    if (!Number.isFinite(slope)) return;
    ctx.save();
    ctx.setLineDash(dash);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(xLow), toY(spec.fa + slope * (xLow - spec.a)));
    ctx.lineTo(toX(xHigh), toY(spec.fa + slope * (xHigh - spec.a)));
    ctx.stroke();
    ctx.restore();
  };
  if (spec.trueSlope !== null && spec.trueSlope !== undefined) line(spec.trueSlope, colors.answer, [7, 5]);
  if (spec.studentSlope !== null && spec.studentSlope !== undefined) line(spec.studentSlope, colors.student, []);

  /* The curve.  The path is broken wherever the function is undefined, and
     wherever it has run far enough off the canvas that joining the pieces
     would draw a spurious near-vertical segment across an asymptote. */
  ctx.strokeStyle = colors.curve;
  ctx.lineWidth = 2.25;
  ctx.lineJoin = "round";
  ctx.beginPath();
  let drawing = false;
  for (let column = 0; column <= plotWidth; column++) {
    const y = values[column];
    if (!Number.isFinite(y)) { drawing = false; continue; }
    const py = toY(y);
    if (py < top - 2 * plotHeight || py > bottom + 2 * plotHeight) { drawing = false; continue; }
    const px = left + column;
    if (drawing) ctx.lineTo(px, py); else { ctx.moveTo(px, py); drawing = true; }
  }
  ctx.stroke();

  /* The point of tangency. */
  const ax = toX(spec.a);
  const ay = toY(spec.fa);
  ctx.fillStyle = colors.point;
  ctx.strokeStyle = colors.card;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(ax, ay, 5.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
  return { xRange, yRange, zoom };
}

if (typeof module !== "undefined")
  module.exports = { niceStep, verticalRange, formatTick, zoomInterval, plotRanges, MAX_ZOOM };
