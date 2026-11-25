/**
 * Reads SerraCalc's plain-text formulas into a small tree that renders as
 * MathML. The text stays the source of truth (it is searchable and reads
 * well as is); this only lays it out. Conventions:
 *
 * - `;` separates equations; `[...]` at the top level is a note (units).
 * - `a / b` with spaces is a built-up fraction of the term before it (back
 *   to the last =, +, −, comparison or comma) over the next factor;
 *   `a/b` without spaces stays inline (units like dS/m, ratios like D/A).
 * - `x_sub` is a subscript, `x^0.25` a superscript, `√(…)` a root.
 * - `closed: …` starts an equation with a label.
 * - Runs of plain words (`night set point`) stay text.
 */

export type MathNode =
  | { readonly k: 'mi' | 'mn' | 'mo' | 'mtext'; readonly t: string }
  | { readonly k: 'sub' | 'sup'; readonly b: MathNode; readonly s: MathNode }
  | { readonly k: 'frac'; readonly n: MathNode[]; readonly d: MathNode[] }
  | { readonly k: 'sqrt'; readonly c: MathNode[] }
  | {
      readonly k: 'group';
      readonly open: string;
      readonly close: string;
      readonly c: MathNode[];
    }
  | { readonly k: 'space' };

export interface Equation {
  readonly label: string | null;
  readonly nodes: MathNode[];
  readonly note: string | null;
}

/** Splits a formula into equations, each parsed; never throws. */
export function parseFormula(source: string): Equation[] {
  return splitTop(source, ';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseEquation);
}

function parseEquation(text: string): Equation {
  let body = text;
  let note: string | null = null;
  // A trailing [note] at the top level: units and conditions.
  const noteMatch = /\s\[([^\]]*)\]\s*$/.exec(body);
  if (noteMatch) {
    note = noteMatch[1].trim();
    body = body.slice(0, noteMatch.index).trim();
  }
  let label: string | null = null;
  const labelMatch = /^([a-z][a-z ]*):\s+/i.exec(body);
  if (labelMatch && !/[_^]/.test(labelMatch[1])) {
    label = labelMatch[1];
    body = body.slice(labelMatch[0].length);
  }
  try {
    return { label, nodes: new Parser(tokenize(body)).parseAll(), note };
  } catch {
    return { label, nodes: [{ k: 'mtext', t: body }], note };
  }
}

/** Splits on `sep` outside brackets and parentheses. */
function splitTop(text: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    else if (c === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// ------------------------------------------------------------------ tokens

type TokenKind = 'num' | 'id' | 'word' | 'op' | 'open' | 'close' | 'text';

interface Token {
  readonly kind: TokenKind;
  readonly text: string;
  readonly sub?: string;
  /** Whitespace before it in the source. */
  readonly spaced: boolean;
}

const SUPERS = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻';
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const LETTER = `A-Za-zΑ-Ωα-ω${SUBS}²³`;
const NUMBER = new RegExp(
  `^\\d+(?:[.,]\\d+)*(?:[\\u00a0\\u202f]\\d{3})*[${SUPERS}]*`,
);
const IDENT = new RegExp(`^[${LETTER}]+(?:-[a-z]+)*`);
const SUBSCRIPT = /^_([A-Za-z0-9]+)/;
const FUNCTIONS = new Set(['exp', 'min', 'max', 'cos', 'sin', 'log', 'ln']);
const OPERATORS = '=+−-×·/:,<>≤≥≈→±%Σ√^!∑';
/** Operators that start a new term: a fraction's top stops there. */
const BREAKS = new Set([
  '=',
  '+',
  '−',
  '-',
  '≈',
  '→',
  '<',
  '>',
  '≤',
  '≥',
  ',',
  ':',
  '±',
]);

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let spaced = false;
  while (i < text.length) {
    const rest = text.slice(i);
    const ws = /^\s+/.exec(rest);
    if (ws) {
      spaced = true;
      i += ws[0].length;
      continue;
    }
    const num = NUMBER.exec(rest);
    const id = num ? null : IDENT.exec(rest);
    if (num) {
      out.push({ kind: 'num', text: num[0], spaced });
      i += num[0].length;
    } else if (id) {
      let len = id[0].length;
      const sub = SUBSCRIPT.exec(text.slice(i + len));
      if (sub) len += sub[0].length;
      const word = id[0];
      const isWord =
        !sub &&
        /^[a-z]+(?:-[a-z]+)*$/.test(word) &&
        word.length >= 2 &&
        !FUNCTIONS.has(word);
      out.push({
        kind: isWord ? 'word' : 'id',
        text: word,
        sub: sub?.[1],
        spaced,
      });
      i += len;
    } else if (rest[0] === '(' || rest[0] === '[') {
      out.push({ kind: 'open', text: rest[0], spaced });
      i++;
    } else if (rest[0] === ')' || rest[0] === ']') {
      out.push({ kind: 'close', text: rest[0], spaced });
      i++;
    } else if (OPERATORS.includes(rest[0])) {
      out.push({ kind: 'op', text: rest[0], spaced });
      i++;
    } else {
      // Anything else (another script, a symbol): text up to the next space.
      const run = /^\S+/.exec(rest)?.[0] ?? rest[0];
      out.push({ kind: 'text', text: run, spaced });
      i += run.length;
    }
    spaced = false;
  }
  return out;
}

// ------------------------------------------------------------------ parser

class Parser {
  private at = 0;
  constructor(private readonly tokens: Token[]) {}

  parseAll(): MathNode[] {
    const nodes = this.parseSeq(null);
    return nodes;
  }

  /** A sequence up to the closing bracket `until` (or the end). */
  private parseSeq(until: string | null): MathNode[] {
    const items: MathNode[] = [];
    let termStart = 0;
    while (this.at < this.tokens.length) {
      const tok = this.tokens[this.at];
      if (tok.kind === 'close') {
        if (until !== null) return items;
        this.at++;
        items.push({ k: 'mo', t: tok.text });
        continue;
      }
      // A spaced slash: a built-up fraction.
      if (
        tok.kind === 'op' &&
        tok.text === '/' &&
        tok.spaced &&
        this.tokens[this.at + 1]?.spaced
      ) {
        this.at++;
        const top = unwrap(trimSpaces(items.splice(termStart)));
        const bottom = unwrap(this.parseFactor());
        items.push({ k: 'frac', n: top, d: bottom });
        continue;
      }
      if (tok.kind === 'op' && tok.text === '^') {
        this.at++;
        const base = items.pop();
        const power = this.parseFactor();
        if (base) {
          items.push({ k: 'sup', b: base, s: asOne(unwrap(power)) });
        }
        continue;
      }
      if (tok.spaced && items.length > 0 && tok.kind !== 'op') {
        const prev = items[items.length - 1];
        if (!(prev.k === 'mo')) items.push({ k: 'space' });
      }
      if (tok.kind === 'op' && BREAKS.has(tok.text)) {
        this.at++;
        items.push({ k: 'mo', t: tok.text === '-' ? '−' : tok.text });
        termStart = items.length;
        continue;
      }
      if (tok.kind === 'word') {
        items.push(this.parseWords());
        continue;
      }
      if (isUnit(tok, items)) {
        // A unit after a number (2 d, 4.8 dS/m) stands upright as text.
        this.at++;
        items.push({ k: 'mtext', t: tok.text });
        continue;
      }
      items.push(...this.parseFactor());
    }
    return items;
  }

  /** One factor: a number, a name (with subscript), a group or a root. */
  private parseFactor(): MathNode[] {
    const tok = this.tokens[this.at];
    if (!tok) return [];
    this.at++;
    switch (tok.kind) {
      case 'num':
        return [{ k: 'mn', t: tok.text }];
      case 'id':
      case 'word': {
        const name: MathNode = {
          k: tok.kind === 'word' ? 'mtext' : 'mi',
          t: tok.text,
        };
        return [tok.sub ? { k: 'sub', b: name, s: subNode(tok.sub) } : name];
      }
      case 'open': {
        const close = tok.text === '(' ? ')' : ']';
        const inner = this.parseSeq(close);
        if (this.tokens[this.at]?.kind === 'close') this.at++;
        return [{ k: 'group', open: tok.text, close, c: inner }];
      }
      case 'op':
        if (tok.text === '√') {
          const inner = this.parseFactor();
          return [{ k: 'sqrt', c: unwrap(inner) }];
        }
        return [{ k: 'mo', t: tok.text }];
      default:
        return [{ k: 'mtext', t: tok.text }];
    }
  }

  /** Plain words in a row stay one piece of text: "night set point". */
  private parseWords(): MathNode {
    const words: string[] = [];
    let first = true;
    while (this.tokens[this.at]?.kind === 'word') {
      const tok = this.tokens[this.at];
      if (!first && !tok.spaced) break;
      if (tok.sub) break;
      words.push(tok.text);
      this.at++;
      first = false;
    }
    return { k: 'mtext', t: words.join(' ') };
  }
}

/** One-letter units, and longer ones that a unit can follow after a "/". */
const UNIT_LETTERS = new Set(['d', 'h', 'm', 'L', 'K', 'W', 'g', 't', 's']);
const UNITS = new Set(['dS', 'kW', 'kWh', 'MWh', 'MJ', 'GJ', 'kPa', 'Pa']);

/**
 * A one-letter unit: right after a number and a space ("2 d"), or after a
 * "/" that follows another unit ("dS/m", "L/d"). Elsewhere a letter is a
 * variable.
 */
function isUnit(tok: Token, items: readonly MathNode[]): boolean {
  if (tok.kind !== 'id' || tok.sub || !UNIT_LETTERS.has(tok.text)) {
    return false;
  }
  const last = items[items.length - 1];
  const before = items[items.length - 2];
  if (tok.spaced) return last?.k === 'space' && before?.k === 'mn';
  return (
    last?.k === 'mo' &&
    last.t === '/' &&
    (before?.k === 'mtext' || (before?.k === 'mi' && UNITS.has(before.t)))
  );
}

function subNode(text: string): MathNode {
  return /^\d+$/.test(text) ? { k: 'mn', t: text } : { k: 'mi', t: text };
}

/** A lone bracketed group loses its brackets inside a fraction or root. */
function unwrap(nodes: MathNode[]): MathNode[] {
  const only = trimSpaces(nodes);
  if (only.length === 1 && only[0].k === 'group' && only[0].open === '(') {
    return only[0].c;
  }
  return only;
}

function trimSpaces(nodes: MathNode[]): MathNode[] {
  let a = 0;
  let b = nodes.length;
  while (a < b && nodes[a].k === 'space') a++;
  while (b > a && nodes[b - 1].k === 'space') b--;
  return nodes.slice(a, b);
}

function asOne(nodes: MathNode[]): MathNode {
  return nodes.length === 1
    ? nodes[0]
    : { k: 'group', open: '', close: '', c: nodes };
}
