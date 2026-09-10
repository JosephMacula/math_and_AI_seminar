# Derivative practice

**Live at
<https://josephmacula.github.io/math_and_AI_seminar/derivative_practice/>.**

A student is shown a function `f` and a point `a`, types the value of `f'(a)`,
and presses Enter. The graph then draws the line through `(a, f(a))` with the
slope they gave. A right answer grazes the curve; a wrong one visibly cuts
across it.

Nothing is drawn while they type. The line appears only on Enter, so it reads
as an answer to a claim rather than a hint.

Problems arrive in a random order, dealt from a shuffled bag that empties
before anything repeats, and no running score is shown. **Previous** walks back
through the problems already seen. The rule a problem exercises is not named on
screen — working out which rule applies is part of the exercise.

## Run

The app is self-contained — KaTeX is vendored inside this directory — so serve
this directory:

    python3 -m http.server 8000

Then open <http://localhost:8000/>.

Run the tests with

    node tests.js

## What the answer box accepts

Exact expressions, not just decimals: `8`, `-1/4`, `4/5`, `sqrt(2)/2`,
`1/sqrt(2)`, `pi/6`, `2*pi/3`, `3e`, `-2/e`, `ln(e)`, `2^3`. Juxtaposition
means multiplication, so `2pi` and `3e` parse as expected. Scientific notation
is deliberately absent — `2e` has to mean `2e`, not `2 x 10^n`.

Grading has two tiers, set at the top of `app.js`:

| agreement with `f'(a)` | response |
| --- | --- |
| within `EXACT_TOLERANCE` (1e-9 relative) | correct |
| within `ROUGH_TOLERANCE` (5e-3 relative) | "right number, rounded — give it exactly" |
| otherwise | wrong, with the line's specific defect named |

The middle tier is the point of parsing exact expressions at all: `0.707` gets
told to come back with `sqrt(2)/2` instead of quietly passing.

## Files

| file | what it holds |
| --- | --- |
| `problems.js` | the question bank: 250 problems, each with `f`, `fp`, the point `a`, TeX for all of it, and the graph's x-window |
| `parse.js` | the expression evaluator: tokenizer plus recursive descent, no `eval` |
| `plot.js` | canvas drawing: axes, ticks, the curve, the lines, the point; the zoom window and `MAX_ZOOM` |
| `deal.js` | which problem comes next: an unbiased shuffled bag, kept out of `app.js` so it can be tested |
| `app.js` | wiring and grading |
| `tests.js` | see below |
| `vendor/katex/` | KaTeX, vendored so the app is self-contained and works offline |
| `tools/` | build-time only, never loaded by the app: the generator that produced the bank, and the verifier that checks each candidate against every test before it is written out. See `tools/README.md` |

## Tests

The suite that matters checks **every stored derivative against a five-point
finite difference of the corresponding `f`**, at the marked point and at three
neighbours. The two share no code, so they agree only if the calculus in the
bank was done correctly. Every `answerTex` is also stripped of its TeX and run
through the parser, which keeps the displayed answer from drifting away from
the graded value. Every TeX string the student sees is also rendered through
the vendored KaTeX, since the app renders with `throwOnError` off and malformed
TeX would otherwise reach the page as red text rather than fail anywhere
visible.

The dealing has its own suite, driven by a seeded generator: that the bag holds
every problem exactly once, that no problem follows itself, and that over six
thousand deals each problem comes up about equally often.

The second suite that earns its keep checks the zoom's claim as arithmetic
rather than trusting it as a picture. For every problem it measures, as a
fraction of the visible height, how far the curve strays from its true tangent
at the window's edge and how far a deliberately wrong line strays, and checks
that the first falls off like `1/zoom` while the second does not move at all.
It was worth writing: the first draft of it asserted the `1/zoom` rate from 1x
and failed, which is how the 100x onset above came to be measured rather than
assumed.

## Adding problems

Append to `PROBLEMS` in `problems.js` and run `node tests.js`. For more than a
handful at a time, `tools/` generates and verifies them in bulk instead. The required
fields are `topic`, `tex`, `f`, `fp`, `fpTex`, `a`, `aTex`, `answerTex` and
`window`. Three things to watch:

- `window` also sets the zoom: magnifying shrinks this interval about `a`,
  keeping each side's share, so a window with `a` very near one end will stay
  lopsided at every magnification.
- `window` should keep vertical asymptotes near the edge of the picture. The
  y-range is inferred from the function's values across the window, trimmed at
  the 2nd and 98th percentile, so an asymptote sitting in the middle of the
  window will still be survivable but a bit ugly.
- `answerTex` is what the student is told the answer is, so it should be the
  exact form (`-\dfrac{2}{e}`), not a decimal. The tests check that it parses
  back to `fp(a)`.

## Zoom

The slider under the graph magnifies about `(a, f(a))`, from 1x up to
`MAX_ZOOM` (10,000x, set in `plot.js`). It is linear in the exponent, so equal
travel is equal magnification: a quarter of the way in is 10x, halfway 100x.

**Both axes shrink by the same factor.** That is the whole design, and the one
thing not to change casually. Because the frame shrinks along with the window,
every on-screen angle survives magnification untouched, so:

- the curve's own bend is second order in the window width against a
  first-order frame, and dies away like `1/zoom` -- it straightens into a line;
- a wrong slope's error is first order against a first-order frame, so it is
  *exactly* as visible at 10,000x as at 1x.

Which is the point. Zooming cannot flatter a wrong answer: the gap between a
correct line and the curve goes to nothing, and the gap between a wrong line
and the curve does not budge. Local linearity is the thing being shown, and
the invariance is what makes the showing honest.

The falloff only reaches its `1/zoom` rate once the window is small enough for
the quadratic term to dominate, at around 100x here. 10,000x is the first
decade at which every function in the bank sits within half a pixel of its own
tangent (worst case `x sin x`, 0.43px; at 1,000x it is still a visible 4.3px),
which is why that is where the slider stops. `tests.js` checks all of this.

The point of tangency stays pinned where it sits in the problem's own window --
between 8% and 89% of the way across, depending on the problem -- rather than
gliding to the centre, so zooming reads as plain magnification about a fixed
point. Zoom resets to 1x on every problem change.
