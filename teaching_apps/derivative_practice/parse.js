/* A small, safe evaluator for the exact numbers a calculus student types:
   "8", "-1/4", "sqrt(2)/2", "3e", "-2/e", "pi/6", "2*pi/3", "1/sqrt(2)".

   No eval().  Recursive descent over an explicit grammar, so nothing the
   student types can run as code.  Scientific notation is deliberately not
   supported: "2e" has to mean 2*e, not 2 x 10^something. */

const CONSTANTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI };

const FUNCTIONS = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
  ln: Math.log, log: Math.log,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
};

function tokenize(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j])) j++;
      const text = source.slice(i, j);
      if ((text.match(/\./g) || []).length > 1) throw Error(`"${text}" is not a number.`);
      tokens.push({ kind: "number", value: Number(text) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < source.length && /[a-zA-Z]/.test(source[j])) j++;
      tokens.push({ kind: "name", text: source.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^()".includes(c)) { tokens.push({ kind: c }); i++; continue; }
    throw Error(`"${c}" is not something I can read.`);
  }
  return tokens;
}

/* Grammar, loosest binding first:
     expr   := term (("+" | "-") term)*
     term   := unary (("*" | "/" | juxtaposition) unary)*
     unary  := ("-" | "+") unary | power
     power  := primary ("^" unary)?            -- right associative
     primary:= number | constant | name "(" expr ")" | "(" expr ")"

   Juxtaposition is implicit multiplication, so "3e", "2pi", "2sqrt(2)" and
   "(x+1)(x-1)" all parse the way a student expects them to. */
function parse(source) {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = kind => (peek() && peek().kind === kind ? tokens[pos++] : null);

  function expr() {
    let value = term();
    for (;;) {
      if (eat("+")) value += term();
      else if (eat("-")) value -= term();
      else return value;
    }
  }

  function term() {
    let value = unary();
    for (;;) {
      if (eat("*")) value *= unary();
      else if (eat("/")) {
        const divisor = unary();
        if (divisor === 0) throw Error("That divides by zero.");
        value /= divisor;
      } else if (startsPrimary(peek())) value *= unary();
      else return value;
    }
  }

  const startsPrimary = token =>
    token && (token.kind === "number" || token.kind === "name" || token.kind === "(");

  function unary() {
    if (eat("-")) return -unary();
    if (eat("+")) return unary();
    return power();
  }

  function power() {
    const base = primary();
    if (eat("^")) return Math.pow(base, unary());
    return base;
  }

  function primary() {
    const token = peek();
    if (!token) throw Error("The expression stops early.");
    if (eat("number")) return token.value;
    if (token.kind === "name") {
      pos++;
      if (token.text in CONSTANTS) return CONSTANTS[token.text];
      const fn = FUNCTIONS[token.text];
      if (!fn) throw Error(`I do not know "${token.text}".`);
      if (!eat("(")) throw Error(`"${token.text}" needs parentheses, as in ${token.text}(2).`);
      const argument = expr();
      if (!eat(")")) throw Error("A closing parenthesis is missing.");
      return fn(argument);
    }
    if (eat("(")) {
      const value = expr();
      if (!eat(")")) throw Error("A closing parenthesis is missing.");
      return value;
    }
    throw Error(`I cannot read "${source}".`);
  }

  const value = expr();
  if (pos < tokens.length) throw Error(`I cannot read "${source}".`);
  if (!Number.isFinite(value)) throw Error("That is not a finite number.");
  return value;
}

if (typeof module !== "undefined") module.exports = { parse, CONSTANTS, FUNCTIONS };
