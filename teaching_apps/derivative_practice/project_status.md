# Project Status

## Overview
    
The `derivative_practice` app, which lives in the `teaching_apps` directory of
the `math_and_AI_seminar` repo. `teaching_apps` is a test harness for Claude,
and this is its only app so far.

The two documents in this directory have separate jobs:

- **`project_status.md`** (this file) is the running account of the work: what
  was done, when, how, and why, plus what is still open. Entries are appended
  and not rewritten, so an older entry describes things as they stood then.
- **`README.md`** is the summary of the app's features and functionality as
  they stand in the current version. It is rewritten whenever the app changes,
  and it carries no history.

A change to the app therefore usually means both: a new entry here, and an
update to `README.md` so it describes the app as it now is.

Paths below are relative to this directory unless stated otherwise.

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
answer. Full description under Zoom in `README.md`.

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

### 2026-09-10 — under git, and deployed to GitHub Pages

**The directory is under version control.** Deferred twice, done now. Two
commits on `main`: the app and its deployment, then a fix to the workflow.
`teaching_apps/` and the vendored KaTeX are tracked; `level_structures_proj/`
was deliberately left alone, being someone else's project rather than part of
this one. The repository was already public, so nothing became visible that
was not already.

Kept out on purpose: `.tools/` (9.2GB, already ignored) and
`tools/verified.json` (3MB of generated candidates, regenerable by
`node tools/build.js`).

**KaTeX moved from the repository root into the app.** `vendor/` now sits
inside `derivative_practice/` and `index.html` asks for `vendor/katex/` rather
than `../../vendor/katex/`. Nothing else in the repo used it. The point is that
the app directory is now self-contained: it can be served from anywhere,
including as the root of a site, which is what makes a short deployment URL
possible at all. Serving it no longer means serving the whole repository.

**Deployment publishes `derivative_practice/` as the Pages site root**, so the
app *is* the website: <https://josephmacula.github.io/math_and_AI_seminar/>.
This is what the self-contained app directory buys — a directory that reaches
up to `../../vendor/` cannot be a site root, and this one no longer does.

A second teaching app would mean publishing `teaching_apps/` instead and giving
each app its own folder. That was tried first and briefly deployed, with a
small landing page at `teaching_apps/index.html`; the page was removed when the
site root became the app itself, since nothing would have linked to it.

**The deploy is gated on the tests.** `.github/workflows/pages.yml` runs
`node tests.js` in a `test` job and the `deploy` job declares `needs: test`.
If a stored derivative ever stops agreeing with its finite difference, the
wrong answer does not reach a class. The test job passes in CI.

**Enabling Pages needed a human, and so did switching it.** Creating a Pages
site requires admin rights that neither available token has: the workflow's
`GITHUB_TOKEN` is granted `pages: write` but not admin, and the Codespace token
is refused create, update *and* `workflow_dispatch` alike — every one comes
back "Resource not accessible by integration". Two deploys failed at
`actions/configure-pages` before this was understood, the second even with
`enablement: true`. `enablement: true` was left in place: once the site exists
the action finds it rather than trying to create it, so the workflow stays
correct for a repository that already has Pages on.

**Two deployment mechanisms then raced each other**, which is worth recording
because the symptom was baffling and the cause was not visible from the site.
Pages was first switched on as *Deploy from a branch*, which serves the whole
repository and can only be aimed at the repo root or `/docs` — never at a
subdirectory, which is the reason that option cannot do what was wanted. That
setting leaves the classic Jekyll build running *as well as* the workflow. Both
published, ten seconds apart, and the branch build won: the workflow's deploy
step reported success while the site showed a Jekyll homepage generated from
the repository's top-level `README.md`. Setting **Source: GitHub Actions** is
what resolves it — not merely by enabling the workflow but by switching the
branch build off, so nothing overwrites the deployment.

**Live at <https://josephmacula.github.io/math_and_AI_seminar/>.** The app is
the site: `index.html` at the root, `vendor/katex/` beside it.

**A redeploy does not reach a browser that has been there before**, which is
worth knowing before concluding a deploy has failed. Pages serves HTML with
`cache-control: max-age=600`, so anyone who loaded the URL while it was still
serving the old Jekyll homepage kept that page for up to ten minutes after the
fix was live — while `curl` showed the new one immediately. Adding a query
string (`?v=2`) makes a different cache key and settles the question at once,
and a hard reload does the same. It only affects people who visited earlier;
a first-time visitor is never served the stale copy.


### 2026-09-10 — `README.md` and this file given separate jobs

The two files had converged: the README's content had been merged into this
file under a *Derivative practice* heading, and this session was about to
reduce the README to a pointer. That was the wrong direction. The intended
split, now recorded in the [Overview](#overview):

- this file is the running account of project work;
- `README.md` is the summary of what the current version of the app does.

**What changed.**

- The merged *Derivative practice* section was removed from this file. The
  README is now the only description of the app, so there is nothing left to
  update in two places.
- `README.md` was rewritten to describe the app as it is. It gained what it
  had been missing: a *Using it* section (feedback and its four diagnoses,
  **Show answer**, the zoom readouts and **Reset**, the light and dark themes),
  the problem bank's topic table and exclusions, deployment, a per-suite
  description of the tests, and the brace-free-exponent rule for
  `answerTex`. It lost what was history rather than description, such as how
  the zoom test's first draft failed, which stays recorded in this file's
  2026-09-09 entry.
- *Next steps* below dropped the two items the entry above this one completed
  (git, deployment) and the item about reducing `README.md` to a pointer.

Every factual claim in the new README was checked against the code: the
problem and topic counts against `problems.js`, the grading tolerances and
feedback wording against `app.js`, `MAX_ZOOM` against `plot.js`, the suite
names and the half-pixel assertion against `tests.js`, and the deploy trigger
against `.github/workflows/pages.yml`. `node tests.js` passes.

### 2026-09-10 — Show answer became a Show / Hide toggle

Once **Show answer** was clicked there was no way to put the answer away again:
the box stayed open until the problem changed. Now the same button toggles.
After revealing, it reads **Hide answer**; pressing it closes the answer and it
goes back to **Show answer**.

A **×** close button inside the answer box was built and tested first, then
replaced before it was committed: with **Show answer** still sitting just
below the box, a second control for the same thing was redundant, and a
button whose label says what it will do next is the plainer design. The ×
left no trace; `index.html` and `styles.css` are back to how they were apart
from two attributes on the button.

**Hiding takes back the whole answer, not just the box.** The true tangent
comes off the graph and its legend entry goes with it, returning the page to
how it was before **Show answer**. The student's own line and the feedback on
it stay. The reasoning: the likeliest reason to hide the answer is to try the
problem again, and a dashed true tangent left on the graph would give it away
as surely as the box would.

**How it was done.** A single `setRevealed()` in `app.js` now owns the
revealed state, the box's visibility and the button's label together, so they
cannot disagree; `loadProblem()` calls it too, which is what resets the button
when the problem changes with the answer open. The button carries
`aria-expanded` and `aria-controls="reveal"`, so a screen reader announces it
as a toggle for the answer box rather than as two unrelated buttons.

**How it was checked.** There is still no browser in this container, so the
real `index.html` and `app.js` were driven in jsdom (installed in a scratch
directory, not in the project) with `drawPlot` spied on, since jsdom's canvas
has no size and nothing gets drawn. 23 checks passed: the label and
`aria-expanded` flip on each press; hiding withdraws the true tangent and its
legend but keeps the student's line; reopening shows the answer once, not
twice; **Next** and **Previous** pressed with the answer open both land on a
problem with it hidden and the button reading **Show answer**; and no script
errors. That establishes the behaviour, not the look: the button's width
changes slightly between its two labels, which has not been seen in a browser.
`node tests.js` still passes, and never reached `app.js` in the first place.

---

## Next steps

- **Try it with a class.** The open question is no longer whether there are
  enough problems but whether the mix is right, and whether the difficulty
  lands. Per-topic counts are in `README.md`; they were set by judgement, not
  by evidence about what a class needs.
- **A topic filter.** Random dealing across the whole bank is right for review,
  but a student working through the chain rule this week cannot ask for only
  chain-rule problems. `topic` is already on every problem for exactly this;
  only the UI is missing.
- **Add the `SessionStart` hook** so the startup instructions in `CLAUDE.md`
  fire wherever a session begins, not only in this directory or below it.
  Raised on 2026-09-09 and not yet done.
- Look through the graphs. The drawing has been seen working, but not all 250
  windows have been looked at, and they were chosen by a verifier that checks
  geometry rather than appearance.
- Possible: ease the point toward the centre of the frame at high zoom. It is
  pinned where the problem's window puts it (8%-89% across), which is standard
  zoom behaviour but leaves the most lopsided problems a little off-centre.

## Note for future sessions

On 2026-09-09 this file was overwritten by something outside the session at
20:56:44 — reverted to its session-start content with the stray bytes `quick`
prepended at byte 0. It was rewritten and re-verified. No other file was
affected and `node tests.js` passed throughout. The file was untracked then, so
there was no git copy to restore from. It has been tracked since 2026-09-10,
so `git diff` now shows any such change, but it is still worth re-reading the
file from disk before trusting that an edit to it survived.
