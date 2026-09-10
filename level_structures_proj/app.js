const $ = selector => document.querySelector(selector);

const form = $("#input-form");
const discriminantInput = $("#discriminant");
const modulusInput = $("#modulus");
const errorBox = $("#error");
const results = $("#results");
const summary = $("#summary");
const latticeBox = $("#lattice");
const companionBox = $("#companion");
const details = $("#details");
const submit = $("#submit");

const SLOT = 74;          // horizontal room for one node
const CAPTION = 118;      // width given to a rendered node caption
const ROW_MAX = 96;       // vertical room for one rank, when there are few ranks
const ROW_MIN = 68;       // floor, kept above the node captions
const PLOT_TARGET = 700;  // preferred drawing height before the margins
const MARGIN = { top: 34, right: 24, bottom: 118, left: 62 };

/* KaTeX to an HTML string.  Every mathematical symbol on the page goes through
   here, including the labels inside the diagrams, which reach the SVG through
   a <foreignObject>. */
const tex = source => katex.renderToString(source, { throwOnError: false });

const foreign = (x, y, width, height, html) =>
  `<foreignObject x="${x}" y="${y}" width="${width}" height="${height}">
     <div xmlns="http://www.w3.org/1999/xhtml" class="tex-label">${html}</div>
   </foreignObject>`;

const groupTex = invariants =>
  invariants.length ? invariants.map(n => `C_{${n}}`).join(" \\times ") : "1";

const stat = (label, value) =>
  `<div class="stat"><span class="label">${label}</span><span class="value">${value}</span></div>`;

/* Number of prime factors of n with multiplicity.  Covering relations in these
   lattices have prime index, so this is the rank function: subfields whose
   degrees have the same number of prime factors sit at the same height, and
   incomparable ones no longer stack up into a spurious chain. */
function omega(n) {
  let count = 0;
  for (let p = 2; p * p <= n; p++) while (n % p === 0) { n /= p; count++; }
  return n > 1 ? count + 1 : count;
}

function parseInteger(input, label) {
  const text = input.value.trim();
  if (!/^[+-]?\d+$/.test(text)) throw Error(`${label} must be an integer.`);
  const value = Number(text);
  if (!Number.isSafeInteger(value)) throw Error(`${label} is outside the supported range.`);
  return value;
}

/* Place nodes on a grid: one row per distinct value of `row(node)`, one column
   per distinct value of `column(node)`.  Several nodes may share a cell, so a
   column is widened to fit the busiest cell it contains. */
function gridLayout(nodes, row, column) {
  const rows = [...new Set(nodes.map(row))].sort((a, b) => a - b);
  const columns = [...new Set(nodes.map(column))].sort((a, b) => a - b);
  const cells = new Map();
  for (const node of nodes) {
    const key = `${row(node)}|${column(node)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(node);
  }

  // Tall lattices would otherwise run off the screen, so ranks are packed
  // closer together as their number grows, down to a floor that keeps the
  // captions clear of the rank below.
  const gap = rows.length > 1
    ? Math.min(ROW_MAX, Math.max(ROW_MIN, PLOT_TARGET / (rows.length - 1)))
    : ROW_MAX;

  const widths = columns.map(c =>
    Math.max(1, ...rows.map(r => (cells.get(`${r}|${c}`) || []).length)) * SLOT);
  const starts = [];
  widths.reduce((acc, w, i) => (starts[i] = acc, acc + w), MARGIN.left);

  const width = MARGIN.left + widths.reduce((a, b) => a + b, 0) + MARGIN.right;
  const height = MARGIN.top + Math.max(1, rows.length - 1) * gap + MARGIN.bottom;

  const position = new Map();
  for (const [key, members] of cells) {
    const [r, c] = key.split("|").map(Number);
    const ci = columns.indexOf(c);
    const offset = starts[ci] + (widths[ci] - members.length * SLOT) / 2;
    members.forEach((node, i) => position.set(node.id, {
      x: offset + i * SLOT + SLOT / 2,
      y: height - MARGIN.bottom - rows.indexOf(r) * gap,
    }));
  }
  return { position, width, height, gap, rows, columns, starts, widths };
}

const line = (a, b, cls) =>
  `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;

const nodeMark = (p, classes, degree, captionTex, radius) => `
  <g class="${classes.join(" ")}" transform="translate(${p.x} ${p.y})">
    <circle r="${radius}"/>
    <text class="degree" y="${radius / 4}">${degree}</text>
    ${foreign(-CAPTION / 2, radius + 4, CAPTION, 30, tex(captionTex))}
  </g>`;

function renderLattice(data) {
  const subfields = data.cyclotomic.nodes;
  const m = data.cyclotomic.m;
  const cyclotomicDegree = node => subfields[node.cyclotomic].degree;
  // Sorting first keeps nodes that share a cell in a stable, readable order.
  const nodes = [...data.lattice.nodes].sort((a, b) =>
    a.degree_over_hilbert - b.degree_over_hilbert ||
    cyclotomicDegree(a) - cyclotomicDegree(b) ||
    a.cyclotomic - b.cyclotomic);

  const layout = gridLayout(nodes, n => n.degree_over_hilbert, cyclotomicDegree);
  const { position, width, height } = layout;

  const axes = [
    foreign(0, height - 34, width, 26, tex(`[L \\cap \\mathbb{Q}(\\zeta_{${m}}) : \\mathbb{Q}]`)),
    `<g transform="translate(18 ${height / 2}) rotate(-90)">
       ${foreign(-70, -13, 140, 26, tex("[L : H_K]"))}
     </g>`,
    ...layout.columns.map((c, i) =>
      `<text class="tick" x="${layout.starts[i] + layout.widths[i] / 2}" y="${height - MARGIN.bottom + 70}">${c}</text>`),
    ...layout.rows.map((r, i) =>
      `<text class="tick" x="${MARGIN.left - 16}" y="${height - MARGIN.bottom - i * layout.gap + 4}">${r}</text>`),
  ].join("");

  const edges = data.lattice.edges
    .map(([a, b]) => line(position.get(a), position.get(b), "edge"))
    .join("");

  const marks = nodes.map(node => {
    const classes = ["node"];
    if (node.is_hilbert) classes.push("hilbert");
    if (node.is_ray) classes.push("ray");
    if (node.is_cyclotomic_join) classes.push("join");
    const caption = node.is_hilbert ? "H_K"
      : node.is_ray ? `K_{(${data.input.modulus})}`
      : subfields[node.cyclotomic].latex_short;
    return nodeMark(position.get(node.id), classes, node.degree_over_hilbert, caption, 18)
      .replace("<g ", `<g data-id="${node.id}" tabindex="0" role="button" `);
  }).join("");

  latticeBox.innerHTML =
    `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
          aria-label="Hasse diagram of the fields between the Hilbert class field and the ray class field">
       ${axes}${edges}${marks}
     </svg>`;
}

function renderCompanion(data) {
  const subfields = data.cyclotomic.nodes.map((s, i) => ({ ...s, id: i }));
  const layout = gridLayout(subfields, s => omega(s.degree), () => 0);
  const { position, width, height } = layout;

  const edges = data.cyclotomic.edges
    .map(([a, b]) => line(position.get(a), position.get(b), "edge"))
    .join("");

  const attained = new Set(data.lattice.nodes.map(n => n.cyclotomic));
  const marks = subfields.map(subfield => {
    const classes = ["node", "subfield"];
    if (attained.has(subfield.id)) classes.push("attained");
    return nodeMark(position.get(subfield.id), classes, subfield.degree, subfield.latex_short, 16)
      .replace("<g ", `<g data-cyclotomic="${subfield.id}" `);
  }).join("");

  companionBox.innerHTML =
    `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
          aria-label="Subfield lattice of the cyclotomic field">${edges}${marks}</svg>`;
}

function render(data) {
  renderLattice(data);
  renderCompanion(data);

  const m = data.cyclotomic.m;
  const select = id => {
    const node = data.lattice.nodes.find(n => n.id === id);
    const subfield = data.cyclotomic.nodes[node.cyclotomic];
    latticeBox.querySelectorAll(".node")
      .forEach(g => g.classList.toggle("selected", Number(g.dataset.id) === id));
    companionBox.querySelectorAll(".node")
      .forEach(g => g.classList.toggle("selected", Number(g.dataset.cyclotomic) === node.cyclotomic));

    const title = node.is_hilbert ? `Hilbert class field ${tex("H_K")}`
      : node.is_ray ? `Ray class field ${tex(`K_{(${data.input.modulus})}`)}`
      : `Intermediate field ${tex("L")}`;
    const rows = [
      [tex("[L : H_K]"), tex(String(node.degree_over_hilbert))],
      [tex(`[K_{(${data.input.modulus})} : L]`), tex(String(node.degree_under_ray))],
      [tex(`L \\cap \\mathbb{Q}(\\zeta_{${m}})`), `${tex(subfield.latex)}, ${tex(`\\text{degree } ${subfield.degree}`)}`],
      ["conductor", tex(String(subfield.conductor))],
      ["defining polynomial", tex(subfield.polynomial_latex)],
      ["roots of unity in " + tex("L"), tex(`\\mu_{${subfield.roots_of_unity}}`)],
      [tex(`\\nu(U) \\le (\\mathbb{Z}/${m}\\mathbb{Z})^{\\times}`),
       tex(`\\{${subfield.subgroup.join(", ")}\\}`)],
    ];
    details.innerHTML = `
      <h3>${title}</h3>
      ${node.is_cyclotomic_join
        ? `<p class="badge">least field containing all of ${tex(`\\mathbb{Q}(\\zeta_{${m}})`)}</p>`
        : ""}
      <dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
  };

  latticeBox.querySelectorAll(".node").forEach(g => {
    const id = Number(g.dataset.id);
    g.addEventListener("click", () => select(id));
    g.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(id); }
    });
  });

  select(data.lattice.nodes.find(n => n.is_cyclotomic_join).id);
}

async function run() {
  errorBox.hidden = true;
  submit.disabled = true;
  submit.textContent = "Computing...";
  try {
    const discriminant = parseInteger(discriminantInput, "The discriminant");
    const modulus = parseInteger(modulusInput, "The modulus");
    const response = await fetch("/api/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discriminant, modulus }),
    });
    const body = await response.json();
    if (!body.ok) throw Error(body.error);

    const data = body.result;
    // The headings carry a literal m until a modulus is known.
    const heading = (id, source) =>
      katex.render(source, $(id), { throwOnError: false });
    heading("#tex-ray", `K_{(${data.input.modulus})}`);
    heading("#tex-cyclo", `\\mathbb{Q}(\\zeta_{${data.cyclotomic.m}})`);
    heading("#tex-axis", `[L \\cap \\mathbb{Q}(\\zeta_{${data.cyclotomic.m}}) : \\mathbb{Q}]`);

    summary.innerHTML =
      stat("Field", `${tex(data.field.latex)}, ${tex(`h = ${data.field.class_number}`)}`) +
      stat("Ray class group", tex(groupTex(data.ray_class_group.invariants))) +
      stat(tex(`[K_{(${data.input.modulus})} : H_K]`), tex(String(data.degrees.ray_over_hilbert))) +
      stat("Fields in lattice", tex(String(data.lattice.nodes.length))) +
      stat(tex(`\\varphi(${data.input.modulus})`), tex(String(data.cyclotomic.phi)));
    render(data);
    results.hidden = false;
  } catch (error) {
    results.hidden = true;
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  } finally {
    submit.disabled = false;
    submit.textContent = "Compute lattice";
  }
}

document.querySelectorAll("[data-tex]").forEach(element =>
  katex.render(element.dataset.tex, element, { throwOnError: false }));

form.addEventListener("submit", event => { event.preventDefault(); run(); });
document.querySelectorAll("[data-d]").forEach(button =>
  button.addEventListener("click", () => {
    discriminantInput.value = button.dataset.d;
    modulusInput.value = button.dataset.m;
    run();
  }));
run();
