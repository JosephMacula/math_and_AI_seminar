# Riemann Sums Visualizer — Project Status

The current state of the project, known issues, and where it might go next,
followed by a dated log of work done. Log entries are appended, not rewritten,
so an older entry describes things as they stood then.

Paths below are relative to this directory unless stated otherwise.

---

## What the code does

Together, `riemann_sums.py` and `riemann_sum_animator.py` let a user render a
Riemann sum animation for a function of their choice over an interval of their
choice.

- **`riemann_sums.py`** defines the Manim scene `RiemannSumAnimation(func, a, b)`.
  `func` is any Python function of one variable (e.g. `np.sin` or
  `lambda x: x**2 - 1`), and `[a, b]` is the interval. The scene:
  1. checks that `a < b`, and that `f` is finite at 200 evenly spaced points
     of `[a, b]`;
  2. sizes the axes from the interval and from the sampled values of `f`
     (always including `y = 0`, with 10% padding above and below), and draws
     the x-axis and the graph of `f`;
  3. draws midpoint Riemann sums with n = 5, 10, 25, 50, 100 rectangles,
     morphing each into the next;
  4. fades in the exact area between the graph and the x-axis.
- **`riemann_sum_animator.py`** provides
  `riemann_sum_animator(func, a, b, vid_name)`, which renders that scene at low
  quality without the `manim` command line, because the CLI cannot pass
  arguments to a scene's constructor. For example, from this directory:

  ```python
  import numpy as np
  from riemann_sum_animator import riemann_sum_animator
  riemann_sum_animator(np.sin, 0, np.pi, "sine")
  ```

  writes `media/videos/480p15/sine.mp4`. Rendering takes a few seconds.

These replace `visualizer.py`, whose scene was hard-coded to `sin x` on
`[0, π]`.

## Current issues and proposed fixes

Found by rendering 12 test cases on 2026-10-10 (see the log). Issue 1 is
fixed; the others are still open.

1. **Large function values hung the render — fixed.** E.g. `x**2` on
   `[0, 100]` did not finish in 150 s. `y_range` had no step, so Manim
   defaulted to a step of 1 and drew a tick mark at every integer on the
   y-axis. Because `axis_config` set `include_numbers=True` for both axes, it
   also typeset a LaTeX label for each tick, even though the y-axis is removed
   right afterwards. Timings for building the axes alone: a y-range of 3000
   took 29 s with numbers. Without numbers, 10⁴ took 8 s and 10⁵ took 150 s,
   so the tick marks alone were enough to cause the slowdown.
   *Fix (applied):* `y_range` now has a step of `y_span / 10`, so the y-axis
   always has about 11 ticks however large `f` is, and `include_numbers` moved
   from `axis_config` into `x_axis_config`:

   ```python
   y_span = (y_max + pad) - (y_min - pad)
   ax = Axes(x_range=[self.a, self.b, x_tick_step],
             y_range=[y_min - pad, y_max + pad, y_span / 10],
             tips=False,
             x_axis_config={"include_numbers": True,
                            "decimal_number_config": {"num_decimal_places": 1}},
   )
   ```

   The step is never 0: if `f` is identically 0, `pad` is 1 and `y_span` is 2.
   This was checked by reading the code; the large-value cases have not been
   re-rendered yet. Remaining edge case: values near the float limit
   (~1e308) could overflow `y_span` to `inf`, which is unlikely to matter here.

2. **The finiteness check misses poles.** `1/x` on `[-1, 1]` passes, because
   200 evenly spaced points never land on 0. The y-range then becomes about
   ±200 and the final area fills the whole frame. (The render also took 39 s,
   from about 400 y-axis ticks; the issue 1 fix should remove that slowdown,
   but not the wrong picture.)
   `tan x` across π/2 would behave the same way.
   *Fix:* if the function is given as a string and parsed with SymPy (as the
   web app idea below would require), check it symbolically with
   `sympy.calculus.util.continuous_domain(expr, x, Interval(a, b))` and
   accept `f` only if the result is all of `[a, b]`. Tested: it correctly
   rejects `1/x`, `tan x`, `log x` at 0, `√x` on `[-1, 1]` and `1/sin x`
   across π, and accepts `x**2`. Caveats:
   - It rejects removable singularities such as `sin(x)/x` at 0. That is
     arguably right, since `f(0)` is undefined and plotting would hit `NaN`.
   - It raises `NotImplementedError` for `floor`, so wrap it in `try` and fall
     back to sampling.

   Keep the sampling check as a backstop, and use an odd number of points so
   the midpoint is always sampled. `sympy.singularities` was also tried, but
   it misses domain problems such as `√x` on `[-1, 1]`.

3. **Errors raised by `f` itself are not caught.** E.g. `math.log` on `[0, 1]`
   raises Python's own `ValueError: math domain error` before the scene's
   check runs. *Fix:* wrap the sampling in `try` and re-raise with the scene's
   own message.

4. **Negative rectangles are purple.** `get_riemann_rectangles` defaults to
   `show_signed_area=True`, which inverts the colour of rectangles below the
   axis (green becomes purple), while the final area is all green. There is
   no `negative_color` argument: passing one raises `TypeError`, which was
   tried and removed. *Fix:* pass `show_signed_area=False` to keep every
   rectangle green, or keep the default if purple is wanted to show signed
   area (then colour the final area to match). Not yet rendered to confirm.

5. **Tick labels.** Ticks every `(b − a)/10` with one decimal place give
   uneven values: on `[0, π]` they read 0.3, 0.6, 0.9, 1.3, …; on `[0, 0.1]`
   they collapse to repeated 0.0 and 0.1; and on `[0, 1000]` they overlap
   ("1,000.0"). *Fix:* round the tick step to a "nice" number (1, 2 or 5 ×
   10ᵏ) and choose the number of decimal places to match.

6. **Labels hidden by the fill.** When `f < 0`, the rectangles and the area
   cover the x-axis numbers. *Fix (to try):* give the axis numbers a higher
   `z_index`, or place them below the plot.

7. **Minor.**
   - `riemann_sum_animator` does not return the video's path, which a web
     backend will need: return `video.renderer.file_writer.movie_file_path`.
   - `import numpy as np` in `riemann_sum_animator.py` is unused.
   - `__init__` calls `super().__init__` before validating `a < b`. Validating
     first is slightly cleaner, though behaviour is the same.

## Longer-term idea: a web app

*This is a possible future direction for the project, not current work.*
Nothing below has been built. It records the idea and the decisions it would
raise.

### The idea

Turn the animator into a simple web application:

- **Left:** a textbox where the user enters a function `f(x)` and an interval
  `[a, b]`.
- **Right:** a box that plays the resulting Manim animation of Riemann sums
  converging to the area under `f` on `[a, b]`.

The function and interval are passed to the Python Manim code, which renders
the video and hands it back to the page. `riemann_sum_animator` is already
the first step toward this: it renders the scene from Python with arguments,
which the `manim` CLI cannot do.

### Architecture (if Manim stays)

Manim needs Python, Cairo, LaTeX and a video encoder, so it **cannot run in the
browser**. Unlike `../derivative_practice/` (a static site on GitHub Pages),
this app would need a backend:

1. **Frontend:** input fields for `f`, `a`, `b`, and a `<video>` element.
2. **Backend:** a small Flask or FastAPI service with an endpoint such as
   `POST /render {f, a, b}` that validates the input, renders to `.mp4`, and
   returns the video's URL.
3. **Hosting:** the codespace for development. For public use, a host that
   runs a Docker container with LaTeX installed (e.g. Fly.io, Render, Railway).
   GitHub Pages cannot run Python.

### Design considerations

- **Latency.** A low-quality render takes a few seconds. The page needs a
  loading indicator, and the server should cache results keyed on
  `(f, a, b)` so repeated requests are instant.
- **Concurrency.** Manim's configuration is global, so simultaneous renders in
  one Python process interfere. Run each render in a subprocess (or a worker
  queue). This also makes timeouts easy to enforce.
- **Parsing the function safely.** The string `"x**2 + sin(x)"` must become a
  callable for `ax.plot`. SymPy (`parse_expr` + `lambdify`) does this. It also
  yields LaTeX for an on-screen label and enables the symbolic continuity
  check in issue 2. But `parse_expr` uses `eval`, which is unsafe on a public
  server, so validate against a whitelist (variable, numbers, operators, named
  functions) first. `../derivative_practice/parse.js` already does this in the
  browser and could reject bad input before it is sent.
- **Ill-behaved input.** E.g. `1/x` on `[-1, 1]`, or `tan` across an
  asymptote. The server should return a clear error rather than a broken
  video (see issues 1–3).

### Alternative considered

Drawing the rectangles in the browser (as `../derivative_practice/plot.js`
draws its graph) removes the server entirely. That gives instant feedback,
free hosting on GitHub Pages, and room for interactivity such as a slider for
n. The cost is giving up Manim's look and its LaTeX typesetting.

### Decisions to make

1. **Manim server vs. in-browser drawing.** The deciding question: is Manim's
   look worth a backend, hosting, and render latency? Most later decisions
   depend on this one.
2. **Backend framework** (if Manim): Flask or FastAPI.
3. **Hosting** (if Manim): which provider, and whether this is public or for
   class use only (affects security and cost).
4. **Input format:** one textbox or separate fields for `f`, `a`, `b`. Which
   functions and syntax are allowed.
5. **Parsing and validation:** reuse `parse.js` on the frontend, a whitelist
   check on the backend, or both.
6. **Error handling:** how to report unparseable input, non-finite values, and
   render timeouts.
7. **Scope of user control, now and later:** fixed n sequence or user-chosen;
   left/right/midpoint; colours.

---

## Log

### 2026-10-10 — Manim set up; static prototype

- Installed Manim Community v0.22.0 into the repo's `.venv`, plus LaTeX
  (`texlive-latex-extra`, `texlive-fonts-extra`, `dvipng`) via apt so that
  `Tex`/`MathTex` work. Manim's render output (`media/`) is git-ignored.
- `visualizer.py` holds one scene, `CalcOne`: the graph of `sin x` on `[0, π]`,
  midpoint Riemann sums with n = 5, 10, 25, 50, 100 morphing into one another,
  and finally the exact area fading in.
- Fixed two bugs: old rectangles lingered on screen because each
  `ReplacementTransform` started from a freshly built copy rather than the one
  on screen; and the curve was hidden behind the rectangles and area, fixed by
  giving it `z_index = 1`.
- Committed on branch `first_prototype` (`ea541af`, `037cb04`). Work continues
  on branch `dynamic_prototype`.

Render with, from this directory:

```
manim -ql visualizer.py CalcOne
```

The codespace has no display, so `-p` (preview) cannot open a player; open the
`.mp4` under `media/videos/` from the VS Code file explorer.

### 2026-10-10 — design discussion: user input and a web app

No code changed. Discussed passing user input to a scene and turning the
project into a web app. Passing values through the `manim` CLI isn't possible,
so the options were:

1. class attributes and subclasses;
2. a real `__init__` with the scene rendered from Python;
3. side channels such as environment variables.

Option 2 was preferred. The web app discussion is now under
"Longer-term idea: a web app" above.

### 2026-10-10 — scene takes any function and interval; testing

- Replaced `visualizer.py` with `riemann_sums.py` (`RiemannSumAnimation`,
  which takes `func`, `a`, `b` and sizes its axes from them) and
  `riemann_sum_animator.py` (renders the scene from Python). See
  "What the code does" above.
- Rendered 12 test cases, low quality, output to a scratch directory:

  | Case | `f`, `[a, b]` | Result |
  |---|---|---|
  | sin | `sin x`, `[0, π]` | OK |
  | cubic | `x³ − x`, `[−2, 2]` | OK; purple rectangles, hidden labels |
  | all negative | `−x² − 1`, `[0, 3]` | OK; same |
  | zero | `0`, `[0, 1]` | OK |
  | shifted interval | `x²`, `[2, 5]` | OK |
  | fractional endpoints | `x`, `[0.3, 1.7]` | OK |
  | tiny interval | `x`, `[0, 0.1]` | labels all 0.0 / 0.1 |
  | wide interval | `sin(x/100)`, `[0, 1000]` | labels overlap |
  | pole | `1/x`, `[−1, 1]` | passed the check; broken final frame |
  | large values | `x²`, `[0, 100]` | hung (killed at 150 s) |
  | log at 0 | `math.log(x)`, `[0, 1]` | raw `math domain error` |
  | reversed | `x`, `[2, 1]` | scene's own error, as intended |

  Every case that rendered drew exactly 5, 10, 25, 50, 100 rectangles. The
  resulting issues and proposed fixes are listed under "Current issues and
  proposed fixes" above.

### 2026-10-10 — runtime fix for large function values

- In `riemann_sums.py`, gave `y_range` a step of `y_span / 10` and moved
  `include_numbers` into `x_axis_config`, which fixes issue 1. Checked by
  reading the code, not yet re-rendered.
- Tried `negative_color=GREEN` for issue 4, but `get_riemann_rectangles` has no
  such argument: every render failed with `TypeError`, and it was removed. The
  purple comes from `show_signed_area=True`; issue 4 now proposes
  `show_signed_area=False` instead.
