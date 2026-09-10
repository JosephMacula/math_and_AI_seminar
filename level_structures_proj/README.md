# Ray class field lattice prototype

A SageMath/PARI-backed web app that draws the lattice of fields

    H_K  subset  L  subset  K_(m)

for an imaginary quadratic field K of fundamental discriminant D_K and a
rational integer modulus m, labelling every L with its intersection
`L cap Q(zeta_m)`.

## Run

    .tools/sage/bin/python server.py

Open http://localhost:8000.  Run the tests with

    .tools/sage/bin/python -m unittest -v tests.py

## The cyclotomic intersection

`K(zeta_m)/K` is abelian of conductor dividing `(m)`, so the ray class field
`K_(m)` contains all of `Q(zeta_m)` -- not merely a subfield of small index.
Under Artin reciprocity the restriction map

    nu : Cl_(m) = Gal(K_(m)/K)  -->  Gal(Q(zeta_m)/Q) = (Z/m)^x

is the ideal norm, `[a] |-> N(a) mod m`.  So if L is the fixed field of
`U <= Cl_(m)` then

    L cap Q(zeta_m)  =  Q(zeta_m) ^ nu(U),

and the whole feature reduces to subgroup bookkeeping in `(Z/m)^x`.  No field
arithmetic in K_(m) is needed.

## The explicit CM construction

`cm_construction` builds an elliptic curve with CM by O_K over H_K, takes its
m-division polynomial, applies the Weber function (x, x^2 or x^3 according as
D_K < -4, = -4 or = -3), and splits the result.  The splitting field should be
the ray class field, of absolute degree 2 |Cl_(m)|; the response reports both
that degree and whether it matches, and the test suite checks the agreement
across every supported case.

## What is drawn

The main diagram is a grid: the vertical axis is `[L : H_K]` and the horizontal
axis is `[L cap Q(zeta_m) : Q]`, so the invariant is a spatial axis rather than
a colour.  Three nodes are marked:

- `H_K`, the Hilbert class field;
- `K_(m)`, the ray class field;
- `H_K . Q(zeta_m)`, the least field in the lattice containing all of
  `Q(zeta_m)` -- everything above it meets `Q(zeta_m)` in the whole thing.

The companion diagram is the subfield lattice of `Q(zeta_m)`, ranked by the
number of prime factors of the degree (covering relations have prime index, so
that is the rank function; ranking by degree alone would stack incomparable
subfields into a false chain).  Clicking a node highlights its image there and
fills in the detail panel: conductor, defining polynomial from
`galoissubcyclo`, the subgroup `nu(U)`, and the largest n with `mu_n` inside L.

Note that the intersection field and the root-of-unity content are different
invariants.  For D_K = -23, m = 7 the field at `[L : H_K] = 3` meets `Q(zeta_7)`
in the real cubic `Q(zeta_7)+` while containing no roots of unity beyond `+-1`.

## Rendering

Every mathematical symbol on the page is typeset by KaTeX, vendored under
`vendor/katex` (woff2 faces only) so the app needs no network at runtime.
Static labels are marked up as `<span data-tex="...">` and rendered once at
load; the diagrams reach KaTeX through an SVG `<foreignObject>`, since KaTeX
emits HTML rather than SVG.  Bare integers -- the degree inside a node, the
axis ticks -- are left as SVG text in the KaTeX face, which needs no typesetting
pass.  The backend supplies the LaTeX for anything it names: `latex`,
`latex_short` and `polynomial_latex` sit beside the plain-text forms.

## Backend

All class field theory is delegated to the PARI bundled with Sage:
`bnrinit` for the ray class group, `subgrouplist` for its subgroups (filtered to
those inside `ker(Cl_(m) -> Cl_K)`, which are exactly the fields above `H_K`),
and `galoissubcyclo` + `polredabs` for the cyclotomic subfields.

## Prototype limits

`compute` now also runs the explicit CM construction (`cm_construction`) on
every request, which is what sets the input range:

- D_K must be a negative fundamental discriminant with |D_K| <= 500
- m must be odd, with 1 <= m <= 7
- at most 300 fields in the lattice and 200 subfields of Q(zeta_m)

The construction cost grows very fast with the degree of the ray class field.
D_K = -23, m = 7 (absolute degree 144) does not finish; the guards above do not
yet catch it, so an expensive request hangs rather than being rejected.

The modulus is restricted to `(m)` for a rational integer m.  This is not just
convenience: `nu` is well defined mod m because `alpha = 1 mod (m)` forces
`Tr(alpha - 1)` to lie in `mZ`, which fails for a general ideal that is not
stable under complex conjugation.

SageMath 10.9 is installed locally under `.tools/sage`.
