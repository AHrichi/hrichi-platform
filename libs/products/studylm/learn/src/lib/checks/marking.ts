import type { BlockOf } from '@ah/products/studylm/lessons';

export interface MatchResult {
  matches: boolean;
  isTypo: boolean;
  reason?: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

const CS_SYNONYMS: Record<string, string> = {
  async: 'asynchronous',
  asynchronous: 'asynchronous',
  sync: 'synchronous',
  synchronous: 'synchronous',
  fn: 'function',
  func: 'function',
  function: 'function',
  ptr: 'pointer',
  pointer: 'pointer',
  ref: 'reference',
  reference: 'reference',
  arr: 'array',
  array: 'array',
  str: 'string',
  string: 'string',
  num: 'number',
  number: 'number',
  int: 'integer',
  integer: 'integer',
  bool: 'boolean',
  boolean: 'boolean',
  obj: 'object',
  object: 'object',
  idx: 'index',
  index: 'index',
  len: 'length',
  length: 'length',
  val: 'value',
  value: 'value',
  var: 'variable',
  variable: 'variable',
  param: 'parameter',
  parameter: 'parameter',
  arg: 'argument',
  argument: 'argument',
  ret: 'return',
  return: 'return',
  dict: 'dictionary',
  dictionary: 'dictionary',
  regex: 'regular expression',
  regexp: 'regular expression',
};

const ANTONYM_PAIRS: [string, string][] = [
  ['sync', 'async'],
  ['synchronous', 'asynchronous'],
  ['true', 'false'],
  ['mutable', 'immutable'],
  ['valid', 'invalid'],
  ['bfs', 'dfs'],
  ['push', 'pop'],
  ['shift', 'unshift'],
  ['encode', 'decode'],
  ['encrypt', 'decrypt'],
  ['min', 'max'],
  ['lock', 'unlock'],
  ['enable', 'disable'],
  ['in', 'out'],
  ['up', 'down'],
  ['left', 'right'],
  ['top', 'bottom'],
  ['first', 'last'],
  ['start', 'end'],
];

/** Normalizes text by trimming whitespace, case, surrounding quotes and trailing punctuation. */
export function normalizeText(s: string): string {
  let clean = s.trim().replace(/\s+/g, ' ').toLowerCase();
  // Strip surrounding quotes or backticks
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'")) ||
    (clean.startsWith('`') && clean.endsWith('`'))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  // Strip trailing punctuation like period, semicolon, exclamation, comma
  clean = clean.replace(/[.,;:!?]+$/, '').trim();
  return clean;
}

/** Computes Damerau-Levenshtein distance supporting transposition of adjacent letters. */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const d: number[][] = [];
  for (let i = 0; i <= al; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (let j = 0; j <= bl; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // transposition
      }
    }
  }
  return d[al][bl];
}

/** Extracts a numeric value from string (e.g. "14 steps" -> 14, "fourteen" -> 14). */
export function extractNumber(s: string): number | null {
  const norm = normalizeText(s);
  // Match digits
  const digitMatch =
    /^-?\d+(\.\d+)?/.exec(norm) || /\b-?\d+(\.\d+)?\b/.exec(norm);
  if (digitMatch) {
    const num = parseFloat(digitMatch[0]);
    if (!Number.isNaN(num)) return num;
  }
  // Match number words
  const words = norm.split(/\s+/);
  for (const word of words) {
    if (word in NUMBER_WORDS) return NUMBER_WORDS[word];
    // Check close typo in number word (e.g. "forteen" -> "fourteen")
    for (const [w, val] of Object.entries(NUMBER_WORDS)) {
      if (w.length >= 4 && damerauLevenshtein(word, w) <= 1) {
        return val;
      }
    }
  }
  return null;
}

/** Normalizes asymptotic notation e.g. "O(log n)" -> "logn". */
export function normalizeComplexity(s: string): string | null {
  const norm = normalizeText(s).replace(/\s+/g, '');
  const match = /^o\(([^)]+)\)$/i.exec(norm);
  if (match) return match[1].replace(/[*^]/g, '');
  if (/^(logn|nlogn|n\^2|n|1)$/i.test(norm)) return norm.replace(/[*^]/g, '');
  return null;
}

/** True when the two words are known antonyms that must never match as typos. */
export function areAntonyms(a: string, b: string): boolean {
  return ANTONYM_PAIRS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  );
}

/**
 * Robust fuzzy & semantic comparator that prevents typing errors, casing,
 * punctuation, number units or inflections from marking an answer wrong.
 */
export function fuzzyMatch(userInput: string, expected: string): MatchResult {
  const rawGot = userInput.trim().replace(/\s+/g, ' ').toLowerCase();
  const rawWant = expected.trim().replace(/\s+/g, ' ').toLowerCase();

  // 1. Direct match
  if (rawGot === rawWant) {
    return { matches: true, isTypo: false };
  }

  const got = normalizeText(userInput);
  const want = normalizeText(expected);

  if (got === want) {
    return { matches: true, isTypo: false };
  }

  // 2. Guard against antonym false positives
  if (areAntonyms(got, want)) {
    return { matches: false, isTypo: false };
  }

  // 3. Complexity comparison (e.g. O(log n) vs log n)
  const compGot = normalizeComplexity(userInput);
  const compWant = normalizeComplexity(expected);
  if (compGot !== null && compWant !== null) {
    if (compGot === compWant) {
      return {
        matches: true,
        isTypo: true,
        reason: 'Complexity notation matched',
      };
    }
    return { matches: false, isTypo: false };
  }

  // 4. Numeric value extraction (e.g. "14 steps" vs "14")
  const numWant = extractNumber(expected);
  if (numWant !== null) {
    const numGot = extractNumber(userInput);
    if (numGot !== null) {
      if (numGot === numWant) {
        return {
          matches: true,
          isTypo: true,
          reason: `Matched numeric value ${numWant}`,
        };
      }
      return { matches: false, isTypo: false };
    }
    return { matches: false, isTypo: false };
  }

  // 5. Technical alias / synonym mapping
  const synGot = CS_SYNONYMS[got];
  const synWant = CS_SYNONYMS[want];
  if (synGot && synWant && synGot === synWant) {
    return {
      matches: true,
      isTypo: true,
      reason: 'Technical synonym recognized',
    };
  }

  // 6. Singular / plural stem matching
  const stem = (w: string) =>
    w.endsWith('ies')
      ? w.slice(0, -3) + 'y'
      : w.endsWith('es')
        ? w.slice(0, -2)
        : w.endsWith('s')
          ? w.slice(0, -1)
          : w;
  if (stem(got) === stem(want) && stem(got).length >= 3) {
    return {
      matches: true,
      isTypo: true,
      reason: 'Singular / plural variation',
    };
  }

  // 7. Typo tolerance via Damerau-Levenshtein distance
  const len = Math.max(got.length, want.length);
  const dist = damerauLevenshtein(got, want);

  if (len >= 4 && len <= 6 && dist <= 1) {
    return {
      matches: true,
      isTypo: true,
      reason: 'Minor spelling typo recognized',
    };
  }
  if (len >= 7 && len <= 11 && dist <= 2) {
    return {
      matches: true,
      isTypo: true,
      reason: 'Minor spelling typo recognized',
    };
  }
  if (len >= 12 && (dist <= 3 || dist / len <= 0.2)) {
    return {
      matches: true,
      isTypo: true,
      reason: 'Minor spelling typo recognized',
    };
  }

  // 8. Multi-token containment (e.g. "binary search algorithm" vs "binary search")
  const wantWords = want.split(/\s+/).filter((w) => w.length > 2);
  const gotWords = got.split(/\s+/).filter((w) => w.length > 2);
  if (
    wantWords.length > 0 &&
    wantWords.every((w) =>
      gotWords.some(
        (gw) => gw === w || (gw.length >= 4 && damerauLevenshtein(gw, w) <= 1),
      ),
    )
  ) {
    return {
      matches: true,
      isTypo: true,
      reason: 'Phrasing variation recognized',
    };
  }

  return { matches: false, isTypo: false };
}

/** Answers are compared with typo tolerance, casing, spaces and number normalization. */
export function same(a: string, b: string): boolean {
  return fuzzyMatch(a, b).matches;
}

export function markQuiz(block: BlockOf<'quiz'>, chosen: number[]): boolean {
  const want = [...block.correct].sort();
  const got = [...new Set(chosen)].sort();
  return want.length === got.length && want.every((v, i) => v === got[i]);
}

export function markPredict(
  block: BlockOf<'predict'>,
  answer: number | string,
): boolean {
  return typeof answer === 'number'
    ? answer === block.answer
    : block.expected !== null && same(answer, block.expected);
}

export function markOrder(
  block: BlockOf<'order-steps'>,
  ids: string[],
): boolean {
  return block.items.every((item, i) => ids[i] === item.id);
}

export function markCategorize(
  block: BlockOf<'categorize'>,
  placed: Record<string, string>,
): boolean {
  return block.items.every((item) => placed[item.id] === item.category);
}

/** A Parsons answer: the lines used, in order, and what fills each blank. */
export interface ParsonsAnswer {
  lines: string[];
  blanks: Record<string, string>;
}

export function markParsons(
  block: BlockOf<'parsons'>,
  answer: ParsonsAnswer,
): boolean {
  const order = block.lines.map((line) => line.id);
  return (
    order.length === answer.lines.length &&
    order.every((id, i) => answer.lines[i] === id) &&
    block.blanks.every((blank) =>
      same(answer.blanks[blank.line] ?? '', blank.answer),
    )
  );
}

/** Output matches line by line; spaces, quotes, and punctuation differences don't fail. */
export function markOutput(
  block: BlockOf<'predict-output'>,
  output: string,
): boolean {
  const lines = (s: string) =>
    s
      .replace(/\r\n?/g, '\n')
      .trim()
      .split('\n')
      .map((line) => line.trimEnd());
  const want = lines(block.expected);
  const got = lines(output);
  return (
    want.length === got.length && want.every((line, i) => same(got[i], line))
  );
}

export function markCloze(
  block: BlockOf<'cloze'>,
  filled: Record<string, string>,
): boolean {
  return block.blanks.every((blank) =>
    blank.answers.some((answer) => same(filled[blank.id] ?? '', answer)),
  );
}

/** Cloze text split into plain text and blanks (`{{id}}`). */
export function clozeParts(
  text: string,
): ({ text: string } | { blank: string })[] {
  return text
    .split(/(\{\{[a-z][a-z0-9-]*\}\})/)
    .filter((part) => part !== '')
    .map((part) => {
      const blank = /^\{\{([a-z][a-z0-9-]*)\}\}$/.exec(part);
      return blank ? { blank: blank[1] } : { text: part };
    });
}

/**
 * A stable shuffle seeded by an id: never the answer's own order, and the
 * same after a reload, so the learner's work doesn't jump around.
 */
export function shuffled<T>(items: readonly T[], seed: string): T[] {
  let state = 2166136261;
  for (const ch of seed) state = Math.imul(state ^ ch.charCodeAt(0), 16777619);
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 3266489909) >>> 0;
    return ((state ^ (state >>> 16)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Two or more items must not start already solved.
  if (out.length > 1 && out.every((item, i) => item === items[i])) {
    out.push(out.shift() as T);
  }
  return out;
}
