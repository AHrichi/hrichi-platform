import {
  type Block,
  type BlockOf,
  loadBuiltInLessons,
} from '@ah/products/studylm/lessons';
import {
  clozeParts,
  fuzzyMatch,
  markCategorize,
  markCloze,
  markOrder,
  markOutput,
  markParsons,
  markPredict,
  markQuiz,
  same,
  shuffled,
} from './marking';

let blocks: Block[] = [];
beforeAll(async () => {
  blocks = (await loadBuiltInLessons()).flatMap((l) =>
    l.sections.flatMap((s) => s.blocks),
  );
});
const first = <K extends Block['kind']>(kind: K) =>
  blocks.find((b): b is BlockOf<K> => b.kind === kind) as BlockOf<K>;

describe('marking the golden checks', () => {
  it('quiz: the right options, and only them', () => {
    const quiz = first('quiz');
    expect(markQuiz(quiz, quiz.correct)).toBe(true);
    const wrong = quiz.options.findIndex((_, i) => !quiz.correct.includes(i));
    expect(markQuiz(quiz, [...quiz.correct, wrong])).toBe(false);
  });

  it('predict: an option, or a free answer however it is spaced', () => {
    const withOptions = blocks.find(
      (b): b is BlockOf<'predict'> =>
        b.kind === 'predict' && b.options !== null,
    );
    if (withOptions) {
      expect(markPredict(withOptions, withOptions.answer as number)).toBe(true);
    }
    const free = blocks.find(
      (b): b is BlockOf<'predict'> =>
        b.kind === 'predict' && b.expected !== null,
    );
    expect(free).toBeDefined();
    if (free?.expected) {
      expect(markPredict(free, `  ${free.expected.toUpperCase()} `)).toBe(true);
      expect(markPredict(free, 'something else')).toBe(false);
    }
  });

  it('order, categorize, Parsons and cloze accept their own answers', () => {
    const order = first('order-steps');
    expect(
      markOrder(
        order,
        order.items.map((i) => i.id),
      ),
    ).toBe(true);
    expect(
      markOrder(
        order,
        shuffled(order.items, order.id).map((i) => i.id),
      ),
    ).toBe(false);

    const sort = first('categorize');
    const placed = Object.fromEntries(
      sort.items.map((i) => [i.id, i.category]),
    );
    expect(markCategorize(sort, placed)).toBe(true);
    expect(
      markCategorize(sort, { ...placed, [sort.items[0].id]: 'nowhere' }),
    ).toBe(false);

    const parsons = first('parsons');
    const answer = {
      lines: parsons.lines.map((l) => l.id),
      blanks: Object.fromEntries(parsons.blanks.map((b) => [b.line, b.answer])),
    };
    expect(markParsons(parsons, answer)).toBe(true);
    expect(
      markParsons(parsons, { ...answer, lines: answer.lines.slice(1) }),
    ).toBe(false);

    const cloze = first('cloze');
    const filled = Object.fromEntries(
      cloze.blanks.map((b) => [b.id, b.answers[0]]),
    );
    expect(markCloze(cloze, filled)).toBe(true);
    expect(clozeParts(cloze.text).filter((p) => 'blank' in p)).toHaveLength(
      cloze.blanks.length,
    );
  });

  it('predict-output: line by line, ignoring trailing spaces', () => {
    const block = first('predict-output');
    expect(
      markOutput(block, `${block.expected.replace(/\n/g, '  \n')}\n`),
    ).toBe(true);
    expect(
      markOutput(block, block.expected.split('\n').reverse().join('\n')),
    ).toBe(false);
  });
});

describe('shuffled', () => {
  it('is stable for a seed and never starts solved', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(shuffled(items, 'x')).toEqual(shuffled(items, 'x'));
    for (const seed of ['a', 'b', 'c', 'order-1', 'sort-2']) {
      expect(shuffled(items, seed)).not.toEqual(items);
      expect([...shuffled(items, seed)].sort()).toEqual(items);
    }
  });
});

describe('fuzzyMatch & typo tolerance', () => {
  it('accepts exact matches without flagging typo', () => {
    const res = fuzzyMatch('binary search', 'binary search');
    expect(res.matches).toBe(true);
    expect(res.isTypo).toBe(false);
    expect(same('binary search', 'binary search')).toBe(true);
  });

  it('accepts minor spelling typos in short and long words', () => {
    // 4-6 chars: 1 typo
    expect(same('parson', 'parsons')).toBe(true);
    expect(same('queu', 'queue')).toBe(true);
    expect(same('stak', 'stack')).toBe(true);

    // 7-11 chars: up to 2 typos
    expect(same('asynchonous', 'asynchronous')).toBe(true);
    expect(same('asynchronus', 'asynchronous')).toBe(true);
    expect(same('promiss', 'promise')).toBe(true);
    expect(same('colision', 'collision')).toBe(true);
    expect(same('recurssion', 'recursion')).toBe(true);

    // 12+ chars
    expect(same('microtask queue', 'microtask quene')).toBe(true);
  });

  it('tolerates trailing punctuation and surrounding quotes', () => {
    expect(same('"asynchronous"', 'asynchronous')).toBe(true);
    expect(same("'14'", '14')).toBe(true);
    expect(same('`log n`', 'log n')).toBe(true);
    expect(same('14.', '14')).toBe(true);
    expect(same('binary search;', 'binary search')).toBe(true);
  });

  it('extracts numeric values with units or word numbers', () => {
    expect(same('14 steps', '14')).toBe(true);
    expect(same('about 14 moves', '14')).toBe(true);
    expect(same('fourteen', '14')).toBe(true);
    expect(same('fourteen steps', '14')).toBe(true);
    expect(same('0', 'zero')).toBe(true);

    // Different numbers must NOT match
    expect(same('15', '14')).toBe(false);
    expect(same('15 steps', '14')).toBe(false);
  });

  it('normalizes algorithmic complexity notation', () => {
    expect(same('O(log n)', 'logn')).toBe(true);
    expect(same('log n', 'O(log n)')).toBe(true);
    expect(same('O(n)', 'n')).toBe(true);
    expect(same('O(n)', 'O(1)')).toBe(false);
  });

  it('recognizes CS abbreviations and technical synonyms', () => {
    expect(same('async', 'asynchronous')).toBe(true);
    expect(same('fn', 'function')).toBe(true);
    expect(same('arr', 'array')).toBe(true);
    expect(same('str', 'string')).toBe(true);
  });

  it('does NOT confuse antonyms despite low edit distance', () => {
    expect(same('async', 'sync')).toBe(false);
    expect(same('asynchronous', 'synchronous')).toBe(false);
    expect(same('true', 'false')).toBe(false);
    expect(same('push', 'pop')).toBe(false);
    expect(same('min', 'max')).toBe(false);
  });

  it('handles singular and plural stems', () => {
    expect(same('microtask', 'microtasks')).toBe(true);
    expect(same('steps', 'step')).toBe(true);
    expect(same('indexes', 'index')).toBe(true);
  });
});
