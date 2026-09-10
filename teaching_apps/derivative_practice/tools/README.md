# Building the question bank

These files are build-time only. The app itself never loads them, and stays
what it was: static files with no dependencies beyond the vendored KaTeX.

They exist because 250 problems is past the size where a bank can be kept
correct by hand. Each entry has to satisfy constraints that are easy to get
wrong and invisible on the page — `answerTex` must survive the TeX strip in
`tests.js` and parse back to `fp(a)` (which rules out braced exponents, and
means `\ln` needs parentheses), and `window` has to keep the curve within half
a pixel of its tangent at full zoom while leaving a wrong line clearly visible.

So nothing is trusted. Candidates are generated in bulk, then every one is put
through **the same checks `tests.js` will later run** — the five-point finite
difference against `f`, the answer parsed back, the whole zoom geometry — and
only survivors are written out. Of 10,694 candidates, 148 were rejected.

## Running it

    node tools/build.js     # generate candidates, verify, write tools/verified.json
    node tools/select.js    # pick to quota and append to ../problems.js
    node tests.js           # the real suite, against the real file

`select.js` **appends** to whatever `PROBLEMS` already holds, and skips any
`(tex, a)` already present. To rebuild from scratch, first cut `problems.js`
back to the entries worth keeping.

## The files

| file | what it holds |
| --- | --- |
| `gen.js` | exact arithmetic and rendering: rationals, `(p/q)sqrt(r)` closed under the products the six trig derivatives need, exact sine and cosine at multiples of pi/12, and `stripTex` copied from `tests.js` so the two cannot drift |
| `families.js` | the power-rule families, plus the TeX helpers every family shares |
| `families2.js` | horizontal tangents and the product rule |
| `families3.js` | quotient, chain, trigonometric, exponential and logarithmic families |
| `build.js` | the verifier: applies every `tests.js` check to each candidate and picks the first window that passes |
| `select.js` | quotas per topic, round-robin across sub-families so a topic is not thirty near-copies of one shape, and at most two points per function |

The shuffle is seeded, so a rebuild reproduces the same bank.
