# Derivative practice

**Live at
<https://josephmacula.github.io/math_and_AI_seminar/>.**

A student is shown a function `f` and a point `a`, types the value of `f'(a)`,
and presses Enter. The graph then draws the line through `(a, f(a))` with the
slope they gave. A right answer grazes the curve; a wrong one visibly cuts
across it.

A static web app: no backend, no build step, no dependencies beyond the KaTeX
vendored in `vendor/`. It works offline once loaded.

## Using it

The page has two panels. The left shows the problem and takes the answer; the
right shows the graph of `f` with the point `(a, f(a))` marked.

- **Answering.** Type the value of `f'(a)` and press Enter (or **Draw**).
  Nothing is drawn while typing. The line appears only on Enter, so it reads
  as a response to the student's claim rather than a hint. The slope that was
  drawn is shown above the graph.
- **Feedback.** A correct answer is confirmed. A decimal that is right but
  rounded is sent back to be given exactly. A wrong answer is told how its
  line is wrong: the wrong sign, horizontal where the curve is not, too steep,
  or too shallow. Input the parser cannot read gets a message saying why, and
  nothing is drawn.
- **Show answer.** Reveals the derivative `f'(x)`, the exact value of `f'(a)`
  with a decimal approximation, and draws the true tangent beside the
  student's line.
- **Next and Previous.** Problems arrive in a random order, dealt from a
  shuffled bag that holds every problem once and empties before anything
  repeats. **Previous** walks back through the problems already seen, and is
  disabled when there are none.
- **No score, no topic.** No running tally or position counter is shown. The
  rule a problem exercises is not named on screen either, since working out
  which rule applies is part of the exercise.
- **Zoom.** A slider under the graph magnifies about the point, with a readout
  of the magnification and of the visible x-interval, and a **Reset** button.
  See [Zoom](#zoom).
- Light and dark themes follow the system setting.

## What the answer box accepts

Exact expressions, not just decimals: `8`, `-1/4`, `4/5`, `sqrt(2)/2`,
`1/sqrt(2)`, `pi/6`, `2*pi/3`, `3e`, `-2/e`, `ln(e)`, `2^3`. Juxtaposition
means multiplication, so `2pi` and `3e` parse as expected. Scientific notation
is deliberately absent, because `2e` has to mean `2e`, not `2 x 10^n`.
Expressions are evaluated by a hand-written parser; nothing typed is ever
passed to `eval`.

Grading has two tiers, set at the top of `app.js`:

| agreement with `f'(a)` | response |
| --- | --- |
| within `EXACT_TOLERANCE` (1e-9 relative) | correct |
| within `ROUGH_TOLERANCE` (5e-3 relative) | "right number, rounded — give it exactly" |
| otherwise | wrong, with the line's specific defect named |

The middle tier is the point of parsing exact expressions at all: `0.707` gets
told to come back with `sqrt(2)/2` instead of quietly passing.

## The problem bank

250 problems across 17 topics, covering the core rules plus general bases:

| topic | problems |
| --- | --- |
| Power rule | 30 |
| Product rule | 26 |
| Quotient rule | 26 |
| Trigonometric | 22 |
| Chain rule | 20 |
| Chain rule, trigonometric | 18 |
| Chain rule, radical | 13 |
| Power rule, negative exponent | 13 |
| Horizontal tangent | 12 |
| Chain rule, exponential | 11 |
| Power rule, radical | 11 |
| Exponential, general base | 10 |
| Exponential | 8 |
| Logarithm | 8 |
| Logarithm, chain rule | 8 |
| Power rule, rational exponent | 8 |
| Logarithm, general base | 6 |

Not covered: inverse and hyperbolic trig functions, and implicit and
logarithmic differentiation. Every problem needs an explicit `f(x)` to plot,
which rules out the last two.

Every problem carries its `topic`, though it is not displayed.

## Zoom

The slider magnifies about `(a, f(a))`, from 1x up to `MAX_ZOOM` (10,000x, set
in `plot.js`). It is linear in the exponent, so equal travel is equal
magnification: a quarter of the way in is 10x, halfway 100x. Zoom resets to 1x
on every problem change.

**Both axes shrink by the same factor.** That is the whole design, and the one
thing not to change casually. Because the frame shrinks along with the window,
every on-screen angle survives magnification untouched, so:

- the curve's own bend is second order in the window width against a
  first-order frame, and dies away like `1/zoom`, so it straightens into a
  line;
- a wrong slope's error is first order against a first-order frame, so it is
  *exactly* as visible at 10,000x as at 1x.

Which is the point. Zooming cannot flatter a wrong answer: the gap between a
correct line and the curve goes to nothing, and the gap between a wrong line
and the curve does not budge. Local linearity is the thing being shown, and
the invariance is what makes the showing honest.

The falloff only reaches its `1/zoom` rate once the window is small enough for
the quadratic term to dominate, at around 100x. 10,000x is the first decade at
which every function in the bank sits within half a pixel of its own tangent
(worst case `x sin x`, 0.43px; at 1,000x it is still a visible 4.3px), which is
why that is where the slider stops.

The point of tangency stays pinned where it sits in the problem's own window,
between 8% and 89% of the way across depending on the problem, rather than
gliding to the centre, so zooming reads as plain magnification about a fixed
point.

## Run

The app is self-contained, so serve this directory:

    python3 -m http.server 8000

Then open <http://localhost:8000/>.

Run the tests with

    node tests.js

## Deployment

`.github/workflows/pages.yml` publishes this directory as the root of the
GitHub Pages site on every push to `main` that touches `teaching_apps/` or the
workflow itself, and can also be run by hand. The deploy job runs only if
`node tests.js` passes, so a bank with a wrong derivative in it never reaches
the live site. Pages caches HTML for ten minutes, so a browser that has
visited before may show the previous version for that long after a deploy.

## Files

| file | what it holds |
| --- | --- |
| `index.html` | the page |
| `styles.css` | layout and the light and dark themes |
| `problems.js` | the question bank: 250 problems, each with `f`, `fp`, the point `a`, TeX for all of it, and the graph's x-window |
| `parse.js` | the expression evaluator: tokenizer plus recursive descent, no `eval` |
| `plot.js` | canvas drawing: axes, ticks, the curve, the lines, the point; the zoom window and `MAX_ZOOM` |
| `deal.js` | which problem comes next: an unbiased shuffled bag, kept out of `app.js` so it can be tested |
| `app.js` | wiring and grading |
| `tests.js` | the test suites, below |
| `vendor/katex/` | KaTeX, vendored so the app is self-contained and works offline |
| `tools/` | build-time only, never loaded by the app: the generator that produced the bank, and the verifier that checks each candidate against every test before it is written out. See `tools/README.md` |

## Tests

`node tests.js` runs eight suites:

1. **Every stored derivative agrees with a finite difference.** Each `fp` is
   checked against a five-point finite difference of its own `f`, at the
   marked point and three neighbours. The two share no code, so they agree
   only if the calculus in the bank is right.
2. **Every stated answer parses to `f'(a)`.** Each `answerTex` is stripped of
   its TeX and run through the parser, which keeps the displayed answer from
   drifting away from the graded value.
3. **The parser reads what a calculus student types.**
4. **The parser refuses what it cannot read**, including things like
   `alert(1)`.
5. **Zooming shrinks both axes by the same factor** about the point.
6. **Under magnification the curve meets its tangent and a wrong line does
   not.** For every problem, as a fraction of the visible height, the curve's
   gap from its tangent must fall off like `1/zoom` while a deliberately wrong
   line's gap does not move, and every curve must be within half a pixel of
   its tangent at `MAX_ZOOM`.
7. **Every TeX string in the bank renders** through the vendored KaTeX. The
   app renders with `throwOnError` off, so malformed TeX would otherwise reach
   the page as red text rather than fail anywhere visible.
8. **Problems are dealt in a random order that covers the whole bank.** Driven
   by a seeded generator: the bag holds every problem exactly once, no problem
   follows itself, and over six thousand deals each problem comes up about
   equally often.

## Adding problems

Append to `PROBLEMS` in `problems.js` and run `node tests.js`. For more than a
handful at a time, `tools/` generates and verifies them in bulk instead. The
required fields are `topic`, `tex`, `f`, `fp`, `fpTex`, `a`, `aTex`,
`answerTex` and `window`. Things to watch:

- `window` also sets the zoom: magnifying shrinks this interval about `a`,
  keeping each side's share, so a window with `a` very near one end will stay
  lopsided at every magnification.
- `window` should keep vertical asymptotes near the edge of the picture. The
  y-range is inferred from the function's values across the window, trimmed at
  the 2nd and 98th percentile, so an asymptote in the middle of the window is
  survivable but ugly.
- `answerTex` is what the student is told the answer is, so it should be the
  exact form (`-\dfrac{2}{e}`), not a decimal. The tests check that it parses
  back to `fp(a)`.
- `answerTex` exponents must be brace-free (`e^2`, not `e^{2}`), and `\ln`
  needs parentheses. The TeX strip in the tests converts `\dfrac{a}{b}` only
  when neither half contains braces, and the parser demands parentheses on
  function calls.
