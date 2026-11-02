import type { BlockOf } from '@ah/products/studylm/lessons';

/** Answers are compared without case, outer spaces or repeated spaces. */
export function same(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  return norm(a) === norm(b);
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

/** Output matches line by line; spaces at the ends of lines don't count. */
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
  return want.length === got.length && want.every((line, i) => line === got[i]);
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
