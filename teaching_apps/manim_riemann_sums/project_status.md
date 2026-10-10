# Riemann Sums Visualizer — Project Status

A running record of work done on this project, decisions made, and open
questions. Entries are appended, not rewritten, so an older entry describes
things as they stood then.

Paths below are relative to this directory unless stated otherwise.

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

No code changed. Summary of the idea and the decisions it raises follows.

---

## The idea

Turn the hard-coded scene into a simple web application:

- **Left:** a textbox where the user enters a function `f(x)` and an interval
  `[a, b]`.
- **Right:** a box that plays the resulting Manim animation of Riemann sums
  converging to the area under `f` on `[a, b]`.

The function and interval are passed to a Python Manim script, which renders
the video and hands it back to the page.

## How user input reaches a Manim scene

A Manim `Scene` already has an `__init__`; `CalcOne` simply inherits it. It can
be overridden (calling `super().__init__(**kwargs)`), but the `manim` CLI
constructs the scene itself with no arguments, so CLI runs cannot pass values
in. The options discussed:

1. **Class attributes + subclasses.** `func`, `a`, `b` as class attributes read
   by `construct`; each new function is a subclass. Simple, but input means
   editing the file.
2. **Real `__init__`, rendered programmatically.** Skip the CLI: a Python
   script (or web server) builds `CalcOne(func=..., a=..., b=...)` and calls
   `.render()`. A normal constructor works here.
3. **Side channels.** Environment variables, a config file, or `input()`
   inside `construct`. Workable but clunky.

For a web app, option 2 is the natural fit: the server calls something like
`render_riemann(f, a, b) -> path_to_mp4`, and the CLI drops out entirely.

## Architecture (if Manim stays)

Manim needs Python, Cairo, LaTeX and a video encoder, so it **cannot run in the
browser**. Unlike `../derivative_practice/` (a static site on GitHub Pages),
this app needs a backend:

1. **Frontend:** input fields for `f`, `a`, `b`, and a `<video>` element.
2. **Backend:** a small Flask or FastAPI service with an endpoint such as
   `POST /render {f, a, b}` that validates, renders to `.mp4`, and returns the
   video's URL.
3. **Hosting:** the codespace for development; for public use, a host that
   runs a Docker container with LaTeX installed (e.g. Fly.io, Render, Railway).
   GitHub Pages cannot run Python.

## Design considerations

- **Latency.** A low-quality render takes a few seconds. The page needs a
  loading indicator, and the server should cache results keyed on
  `(f, a, b)` so repeated requests are instant.
- **Concurrency.** Manim's configuration is global, so simultaneous renders in
  one Python process interfere. Run each render in a subprocess (or a worker
  queue); this also makes timeouts easy to enforce.
- **Parsing the function safely.** The string `"x**2 + sin(x)"` must become a
  callable for `ax.plot`. SymPy (`parse_expr` + `lambdify`) does this and also
  yields LaTeX for an on-screen label, but `parse_expr` uses `eval`, which is
  unsafe on a public server. Validate against a whitelist (variable, numbers,
  operators, named functions) first. `../derivative_practice/parse.js` already
  does this in the browser and could reject bad input before it is sent.
- **Ill-behaved input.** E.g. `1/x` on `[-1, 1]`, or `tan` across an
  asymptote. The server should detect non-finite or exploding values and
  return a clear error rather than a broken video.
- **Adaptive axes.** The current `x_range` and `y_range` are hand-tuned for
  `sin` on `[0, π]`. They must be computed from the interval and from sampled
  values of `f`.

## Alternative considered

Drawing the rectangles in the browser (as `../derivative_practice/plot.js`
draws its graph) removes the server entirely: instant feedback, free hosting on
GitHub Pages, and interactivity such as a slider for n becomes possible. The
cost is giving up Manim's look and its LaTeX typesetting.

## Decisions to make

1. **Manim server vs. in-browser drawing.** The deciding question: is Manim's
   look worth a backend, hosting, and render latency? Most later decisions
   depend on this one.
2. **Backend framework** (if Manim): Flask or FastAPI.
3. **Hosting** (if Manim): which provider, and whether this is public or for
   class use only (affects security and cost).
4. **Input format:** one textbox or separate fields for `f`, `a`, `b`; which
   functions and syntax are allowed.
5. **Parsing and validation:** reuse `parse.js` on the frontend, a whitelist
   check on the backend, or both.
6. **Error handling:** how to report unparseable input, non-finite values, and
   render timeouts.
7. **Scope of user control, now and later:** fixed n sequence or user-chosen;
   left/right/midpoint; colors.
