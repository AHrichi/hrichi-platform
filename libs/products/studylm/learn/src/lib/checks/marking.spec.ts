import {
  type Block,
  type BlockOf,
  loadBuiltInLessons,
} from '@ah/products/studylm/lessons';
import {
  clozeParts,
  markCategorize,
  markCloze,
  markOrder,
  markOutput,
  markParsons,
  markPredict,
  markQuiz,
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
