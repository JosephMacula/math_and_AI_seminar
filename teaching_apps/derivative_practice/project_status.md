# Project Status

## Overview
    
The `derivative_practice` app, which lives in the `teaching_apps` directory of
the `math_and_AI_seminar` repo. `teaching_apps` is a test harness for Claude,
and this is its only app so far.

This file sits in the app's own directory and is the single place to look.
Paths below are relative to this directory unless stated otherwise. The
reference material that used to live in `README.md` beside it has been merged
in below, under [Derivative practice](#derivative-practice).

---

## Work done

### 2026-09-09 — `project_status.md`

Created at startup, per `CLAUDE.md`.

### 2026-09-09 — built `derivative_practice/`

A static web app for calculus students. The left panel shows `f` and a point
`a` and takes the student's value for `f'(a)`; on Enter the right panel draws
the line through `(a, f(a))` with that slope, against the graph of `f`.

**How it was done**

- Static files only — no backend, no build step, no npm, no dependencies beyond
  the KaTeX already vendored in the repo. The whole app is five `.js` files, an
  `index.html` and a stylesheet.
- The plotting is hand-rolled on `<canvas>` rather than taken from a chart
  library. The one thing this app must get right — keeping the curve, the
  marked point and a possibly wildly wrong line all legible at once — is
  exactly what a general-purpose library makes hard to control.
- The answer box is backed by a hand-written tokenizer and recursive-descent
  evaluator, no `eval`. That is what makes exact answers (`sqrt(2)/2`, `pi/6`)
  gradeable, so a rounded decimal can be caught and sent back rather than
  quietly accepted.
- Correctness of the question bank is established by **differential testing**:
  every stored derivative is checked against a five-point finite difference of
  the corresponding `f`, at the marked point and three neighbours. The two
  share no code, so they agree only if the calculus was done right.

### 2026-09-09 — added the zoom

A slider under the graph magnifies about `(a, f(a))`, 1× to 10,000×, linear in
the exponent. Both axes shrink by the same factor, so every on-screen angle is
preserved: the curve straightens out while a wrong line keeps its angular error
exactly. That invariance is the point — magnifying cannot flatter a wrong
answer. Full description under [Zoom](#zoom).

**How it was done**

- The design came out of the error analysis first: the curve's bend is second
  order in the window width against a first-order frame, a wrong slope's error
  is first order against a first-order frame. Shrinking both axes equally is
  what separates the two, so it was chosen deliberately rather than fallen into.
- The claim was then checked **as arithmetic rather than trusted as a picture**.
  `tests.js` measures, as a fraction of the visible height, how far the curve
  strays from its true tangent and how far a deliberately wrong line strays,
  and asserts that the first dies off like `1/zoom` while the second does not
  move at all.
- The constants were **measured, not assumed**, and the tests are what forced
  that. The first draft asserted the `1/zoom` rate from 1× and failed on 12 of
  17 problems: below about 100× a cubic term is still in play and the rate has
  not yet settled. Measuring the falloff across every problem also set the top
  of the slider — 10,000× is the first decade at which every function in the
  bank sits within half a pixel of its own tangent (worst case `x sin x`, at
  0.43px; at 1,000× it is still a visible 4.3px). It also caught a false claim
  in a source comment, which was corrected.
- `MAX_ZOOM` lives in `plot.js` and is read by both `app.js` and `tests.js`, so
  the slider's ceiling and the value the tests verify cannot drift apart.

### 2026-09-09 — moved `CLAUDE.md` and `project_status.md` into this directory

Both files used to sit one level up, in `teaching_apps/`. They now live in
`derivative_practice/`, beside the app they describe, and the path references
in this file were rewritten to match.

Worth knowing: Claude Code auto-loads `CLAUDE.md` from the session's working
directory and its parents, never from a subdirectory at startup. So the
read-`project_status.md`-first instruction that `CLAUDE.md` carries now applies
only to sessions started in this directory or below it — started from
`teaching_apps/`, it no longer fires at session start. A `SessionStart` hook in
`.claude/settings.json` would make it fire wherever the session begins. Not set
up; left to be done separately.

### 2026-09-09 22:50 UTC — status

Where things stand at the end of this session.

**The app works and is verified as far as it can be here.** `node tests.js`
passes: every stored derivative agrees with a five-point finite difference of
its own `f`, every `answerTex` parses back to `fp(a)`, and the zoom's claim
holds as arithmetic — the curve's gap from its tangent falls off like `1/zoom`
while a wrong line's gap does not move. 17 problems in the bank.

**Still unseen by a human.** Nothing here has been opened in a browser; this
container has none. The canvas drawing is the part that arithmetic cannot
vouch for, and it is the one outstanding risk.

**Contents of this directory:** the app (`index.html`, `styles.css`,
`problems.js`, `parse.js`, `plot.js`, `app.js`), its tests (`tests.js`), this
file, `CLAUDE.md`, and `README.md` — which is now duplicated by the reference
section below and should be reduced to a pointer.

**Still untracked by git.** `teaching_apps/` and everything under it, including
this file, appears in `git status` only as an untracked directory. That is
unchanged from earlier today and is why the overwrite described at the bottom
of this file had no copy to restore from.

**Open, in rough priority order:** put this directory under git; look at the
app in a browser; add the `SessionStart` hook; reduce `README.md` to a pointer;
try the problems with a class. Details in [Next steps](#next-steps).

### 2026-09-10 — served the app in the browser

The Codespace forwards any port it sees, so `python3 -m http.server 8000` from
the repository root puts the app at
`https://<codespace>-8000.app.github.dev/teaching_apps/derivative_practice/`.
Private to the account by default, and it dies with the Codespace, so it is for
looking, not for handing to students. GitHub Pages is the obvious next step
there and has not been set up.

Worth knowing: KaTeX's stylesheet asks for 60 font files across three formats
and only the 20 `woff2` are vendored. That is not a gap — `woff2` is first in
every `@font-face` src list and universally supported, so the missing `.ttf`
and `.woff` are never requested.

### 2026-09-10 — the bank grew from 17 problems to 250

Same shape of problem, many more of them, covering the core rules plus general
bases: power, product, quotient, chain, the six trig functions, `e^x` and
`ln x`, and `b^x` and `\log_b x`. Deliberately excluded: inverse and hyperbolic
trig (asked for), and implicit and logarithmic differentiation (they cannot
join a bank where every entry needs an explicit `f(x)` to plot).

The mix, which is the thing most worth arguing with after a class has used it:

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

**How it was done.** Not by hand — 250 entries is well past the size where a
bank stays correct by being read carefully. They were generated in bulk and
then put through **exactly the checks `tests.js` runs**: the five-point finite
difference against `f`, `answerTex` stripped and parsed back to `fp(a)`, and
the whole zoom geometry including the half-pixel promise at 10,000x. Of 10,694
candidates, 148 failed and were dropped. The generator lives in `tools/` and is
build-time only; the app is still static files with no dependencies.

The constraints that shaped it were not obvious in advance and are worth
recording, since they are invisible on the page:

- `answerTex` has to survive the TeX strip in `tests.js` and then parse. The
  strip only converts `\dfrac{a}{b}` when neither half contains braces, so a
  braced exponent like `e^{2}` silently fails to convert and reaches the
  tokenizer as a stray `{`. Every exponent in an answer is therefore
  brace-free, and `\ln` carries parentheses because the parser demands them.
- Three families were rejected outright by the finite-difference check for
  sitting too close to an asymptote. That is the check doing its job on
  generated material rather than hand-written material, which is the first
  time it has had the chance.
- 131 candidates were dropped for the opposite reason: a window so tall
  relative to its width that a wrong line's error fell below a thousandth of
  the visible height. Those would have looked correct whatever the student
  typed.

**The zoom's measured claims were re-checked against the larger bank and still
hold.** `x sin x` is still the worst case at 10,000x (0.43px, with `csc x` and
`sec x` just behind at 0.42px), and at 1,000x it is still a visible 4.35px, so
10,000x remains exactly the right place for the slider to stop. What did change
is where the point of tangency sits: across 250 problems it ranges from 8% to
89% of the way across the frame, not the 25%–83% measured over the original 17.

**Two things were added that the tests could not previously reach.** Every TeX
string the student sees is now rendered through the vendored KaTeX — the app
calls `katex` with `throwOnError` off, so malformed TeX becomes red text on the
page and fails nowhere a developer would notice. And the dealing (below) has
its own suite.

### 2026-09-10 — random order, and no score on screen

The tally is gone: the app no longer says how many problems have been solved.
Problems now arrive in a random order rather than a fixed one, so the counter
that read "1 of 250" went with it — position in a shuffled bank means nothing.
**Previous** now walks back through the problems already seen rather than
stepping backwards through an order, and is disabled when there is nothing to
go back to.

**How it was done.** Dealing is a shuffled bag, not an independent random pick
each time: the bag holds every problem exactly once and empties before anything
repeats, so a student meets the whole bank rather than the same dozen problems.
Refilling avoids handing back the problem already on screen.

It lives in its own file, `deal.js`, rather than in `app.js`. That is the whole
point of the split: `app.js` is all DOM and cannot be reached from `tests.js`,
and a shuffle is exactly the kind of thing that looks random on screen while
being wrong. Driven by a seeded generator, the tests check that a bag is a
permutation of the bank, that no problem ever follows itself across five full
passes, and that over six thousand deals each problem comes up about equally
often — a biased shuffle would still look random to a student while quietly
keeping part of the bank from ever appearing.

### 2026-09-10 — the rule is no longer named on screen

The topic label ("Chain rule", "Quotient rule") that sat under the *Problem*
heading is gone. It was telling the student which method to use, which is a
good part of the exercise given away: recognising *which* rule a function calls
for is the skill, and the graph already grades the answer without needing the
question labelled.

`topic` still sits on all 250 problems. It is what the generator's quotas are
counted in and what a topic filter would need, so only the display was removed,
not the data.

### 2026-09-10 — status

Where things stand at the end of this session.

**It has been seen in a browser, and it works.** That closes the item that had
stood open since the app was built: the canvas drawing was the one thing no
amount of arithmetic could vouch for, and nobody had ever looked at it. It was
opened this session and judged a good working first draft. Worth being precise
about what that does and does not establish — the app was *used*, not swept:
nobody has looked at all 250 graphs, and the 250 windows were chosen by a
verifier that checks geometry (does the curve meet its tangent, does a wrong
line stay visible) and not appearance. A window can pass every check and still
be an ugly picture.

**The tests pass: 8 suites, 7,735 individual checks.** What they establish,
in the order they run:

1. every stored derivative agrees with a five-point finite difference of its
   own `f`, at the marked point and three neighbours — the two share no code;
2. every `answerTex`, stripped of its TeX, parses back to `fp(a)`;
3. and 4. the parser reads what a student would type and refuses what it
   should, including `alert(1)`;
5. and 6. the zoom shrinks both axes equally, and the curve's gap from its
   tangent falls off like `1/zoom` while a wrong line's gap does not move;
7. every TeX string the student sees renders through the vendored KaTeX;
8. the dealing is an unbiased permutation that never repeats a problem
   immediately and covers the whole bank.

**What is in this directory now.**

| file | lines | |
| --- | --- | --- |
| `problems.js` | 2296 | the bank: 250 problems, 216 distinct functions, 17 topics |
| `tests.js` | 306 | the 8 suites above |
| `styles.css` | 257 | |
| `app.js` | 224 | wiring and grading |
| `plot.js` | 201 | canvas drawing, the zoom window, `MAX_ZOOM` |
| `parse.js` | 126 | the expression evaluator, no `eval` |
| `index.html` | 93 | |
| `deal.js` | 27 | which problem comes next |
| `tools/` | 1322 | build-time only, never loaded by the app |

Plus `README.md`, this file, and `CLAUDE.md`.

**The way it is being served will not last.** A `python3 -m http.server` at the
repository root, reached through the Codespace's forwarded port. That dies with
the Codespace, and the URL is private to the account, so it is for looking and
not for handing to a class. Nothing has been deployed anywhere permanent.

**Still untracked by git.** Unchanged from yesterday and now a good deal more
to lose: `teaching_apps/` still appears in `git status` only as an untracked
directory. This is the most valuable thing left undone, and it is why the
overwrite described at the bottom of this file had no copy to restore from.

**Open, in rough priority order:** put this directory under git; deploy
somewhere that outlives the Codespace; try the problems with a class and see
whether the mix is right; add a topic filter. Details in
[Next steps](#next-steps).

---

## Derivative practice

*Merged from `README.md` in this directory.*

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

### Run

The app is self-contained — KaTeX is vendored inside this directory — so serve
this directory:

    python3 -m http.server 8000

Then open <http://localhost:8000/>.

Run the tests with

    node tests.js

### What the answer box accepts

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

### Files

| file | what it holds |
| --- | --- |
| `problems.js` | the question bank: 250 problems, each with `f`, `fp`, the point `a`, TeX for all of it, and the graph's x-window |
| `parse.js` | the expression evaluator: tokenizer plus recursive descent, no `eval` |
| `plot.js` | canvas drawing: axes, ticks, the curve, the lines, the point; the zoom window and `MAX_ZOOM` |
| `deal.js` | which problem comes next: an unbiased shuffled bag, kept out of `app.js` so it can be tested |
| `app.js` | wiring and grading |
| `tests.js` | see below |
| `vendor/katex/` | KaTeX, vendored so the app is self-contained and works offline |
| `tools/` | build-time only, never loaded by the app: the generator that produced the bank and the verifier that checks each candidate against every test. See `tools/README.md` |

### Tests

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
It was worth writing: the first draft of it asserted the `1/zoom` rate from 1×
and failed, which is how the 100× onset came to be measured rather than
assumed.

### Adding problems

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

### Zoom

The slider under the graph magnifies about `(a, f(a))`, from 1× up to
`MAX_ZOOM` (10,000×, set in `plot.js`). It is linear in the exponent, so equal
travel is equal magnification: a quarter of the way in is 10×, halfway 100×.

**Both axes shrink by the same factor.** That is the whole design, and the one
thing not to change casually. Because the frame shrinks along with the window,
every on-screen angle survives magnification untouched, so:

- the curve's own bend is second order in the window width against a
  first-order frame, and dies away like `1/zoom` — it straightens into a line;
- a wrong slope's error is first order against a first-order frame, so it is
  *exactly* as visible at 10,000× as at 1×.

Which is the point. Zooming cannot flatter a wrong answer: the gap between a
correct line and the curve goes to nothing, and the gap between a wrong line
and the curve does not budge. Local linearity is the thing being shown, and
the invariance is what makes the showing honest.

The falloff only reaches its `1/zoom` rate once the window is small enough for
the quadratic term to dominate, at around 100× here. 10,000× is the first
decade at which every function in the bank sits within half a pixel of its own
tangent (worst case `x sin x`, 0.43px; at 1,000× it is still a visible 4.3px),
which is why that is where the slider stops. `tests.js` checks all of this.

The point of tangency stays pinned where it sits in the problem's own window —
between 8% and 89% of the way across, depending on the problem — rather than
gliding to the centre, so zooming reads as plain magnification about a fixed
point. Zoom resets to 1× on every problem change.

---

## Next steps

- **Put this directory under git.** Nothing here is tracked. Deferred twice
  now, and the amount at stake has grown from one afternoon's work to a
  250-problem bank and the tooling that built it. `tools/verified.json` is
  generated output, 3MB, and is already listed in the repository's
  `.gitignore` for when this happens.
- **Deploy somewhere that outlives the Codespace.** GitHub Pages fits — static
  files, no build step — but the repo would have to be public and `vendor/`
  committed. Until then there is no link that can be given to a student.
- **Try it with a class.** The open question is no longer whether there are
  enough problems but whether the mix is right, and whether the difficulty
  lands. Per-topic counts are in the 2026-09-10 entry above; they were set by
  judgement, not by evidence about what a class needs.
- **A topic filter.** Random dealing across the whole bank is right for review,
  but a student working through the chain rule this week cannot ask for only
  chain-rule problems. `topic` is already on every problem for exactly this;
  only the UI is missing.
- Look through the graphs. The drawing has been seen working, but not all 250
  windows have been looked at, and they were chosen by a verifier that checks
  geometry rather than appearance.
- Possible: ease the point toward the centre of the frame at high zoom. It is
  pinned where the problem's window puts it (8%-89% across), which is standard
  zoom behaviour but leaves the most lopsided problems a little off-centre.
- `README.md` in this directory is duplicated by the section above, and this
  session updated both by hand — twice — which is exactly the drift the
  duplication invites. Worth reducing to a pointer at this file.

## Note for future sessions

On 2026-09-09 this file was overwritten by something outside the session at
20:56:44 — reverted to its session-start content with the stray bytes `quick`
prepended at byte 0. It was rewritten and re-verified. No other file was
affected and `node tests.js` passed throughout. Since the file is untracked,
there was no git copy to restore from; worth re-reading it from disk before
trusting that an edit to it survived.
