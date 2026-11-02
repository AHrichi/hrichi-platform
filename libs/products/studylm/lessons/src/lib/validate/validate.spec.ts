import { GOLDEN_LESSONS } from '../../golden';
import { buildGenerateRequest } from '../prompts/request';
import type { Issue, IssueCode, ValidationResult } from './issues';
import { validateBlock, validateLesson, validateOutline } from './validate';

/** A deep copy of a golden lesson, to break on purpose. */
const golden = (name: string) => structuredClone(GOLDEN_LESSONS[name]);

/** Sets (or, with undefined, deletes) the value at a JSON pointer. */
function edit(target: unknown, path: string, value: unknown): void {
  const keys = path.split('/').slice(1);
  const last = keys.pop() as string;
  const parent = keys.reduce<unknown>(
    (node, key) => (node as Record<string, unknown>)[key],
    target,
  ) as Record<string, unknown>;
  if (value === undefined) delete parent[last];
  else parent[last] = value;
}

const read = (target: unknown, path: string): unknown =>
  path
    .split('/')
    .slice(1)
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown>)[key],
      target,
    );

const issuesOf = <T>(result: ValidationResult<T>): Issue[] =>
  result.ok ? result.warnings : result.issues;

const step = (n: number) => ({
  id: `s${n}`,
  title: 'A step',
  narration: 'Something happens.',
  focus: [],
  ops: [],
  pauseFor: null,
});

type Case = [
  name: string,
  lesson: string,
  breakIt: (lesson: unknown) => void,
  expected: { path: string; code: IssueCode },
];

const CASES: Case[] = [
  [
    'an unknown block kind',
    'binary-search',
    (l) => edit(l, '/sections/0/blocks/0/kind', 'pie-chart'),
    { path: '/sections/0/blocks/0/kind', code: 'unknown-kind' },
  ],
  [
    'a missing field',
    'binary-search',
    (l) => edit(l, '/sections/1/blocks/0/title', undefined),
    { path: '/sections/1/blocks/0/title', code: 'missing-field' },
  ],
  [
    'an extra field',
    'binary-search',
    (l) => edit(l, '/sections/1/blocks/0/colour', 'red'),
    { path: '/sections/1/blocks/0/colour', code: 'unknown-field' },
  ],
  [
    'an id that is not kebab-case',
    'binary-search',
    (l) => edit(l, '/sections/1/blocks/0/id', 'Promise Card'),
    { path: '/sections/1/blocks/0/id', code: 'bad-id' },
  ],
  [
    'two blocks with one id',
    'binary-search',
    (l) => edit(l, '/sections/1/blocks/0/id', 'hook-text'),
    { path: '/sections/1/blocks/0/id', code: 'duplicate-id' },
  ],
  [
    'narration over 40 words',
    'http-request',
    (l) =>
      edit(
        l,
        '/sections/1/blocks/0/steps/0/narration',
        'word '.repeat(41).trim(),
      ),
    { path: '/sections/1/blocks/0/steps/0/narration', code: 'too-long' },
  ],
  [
    'more than 40 steps',
    'http-request',
    (l) =>
      edit(
        l,
        '/sections/2/blocks/2/steps',
        Array.from({ length: 41 }, (_, i) => step(i)),
      ),
    { path: '/sections/2/blocks/2/steps', code: 'too-many' },
  ],
  [
    'focus on an id that does not exist',
    'http-request',
    (l) => edit(l, '/sections/2/blocks/1/steps/0/focus/1', 'cnd'),
    { path: '/sections/2/blocks/1/steps/0/focus/1', code: 'unknown-ref' },
  ],
  [
    'binary search on unsorted input',
    'binary-search',
    (l) => edit(l, '/sections/1/blocks/1/values', [9, 1, 3]),
    { path: '/sections/1/blocks/1/simulate', code: 'precondition' },
  ],
  [
    'simulate and steps together',
    'binary-search',
    (l) => edit(l, '/sections/1/blocks/1/steps', [step(1)]),
    { path: '/sections/1/blocks/1/steps', code: 'mode-conflict' },
  ],
  [
    'a task running before the microtasks',
    'event-loop',
    (l) => {
      const steps = read(l, '/sections/1/blocks/1/steps') as unknown[];
      [steps[7], steps[8]] = [steps[8], steps[7]];
    },
    { path: '/sections/1/blocks/1/steps/7/ops/0/op', code: 'illegal-op' },
  ],
  [
    'a pop from an empty stack',
    'recursion',
    (l) => {
      const steps = read(l, '/sections/1/blocks/1/steps') as unknown[];
      steps.splice(0, 3);
    },
    { path: '/sections/1/blocks/1/steps/0/ops/0/op', code: 'illegal-op' },
  ],
  [
    'a key in the wrong bucket',
    'lookups',
    (l) => edit(l, '/sections/1/blocks/0/steps/0/ops/0/bucket', 3),
    { path: '/sections/1/blocks/0/steps/0/ops/0/bucket', code: 'illegal-op' },
  ],
  [
    'a node that breaks the BST order',
    'lookups',
    (l) => edit(l, '/sections/2/blocks/0/nodes/7/label', '9'),
    { path: '/sections/2/blocks/0/nodes/7/label', code: 'shape' },
  ],
  [
    'checking out a branch that does not exist',
    'git-branching',
    (l) => edit(l, '/sections/1/blocks/2/steps/2/ops/0/ref', 'feat'),
    { path: '/sections/1/blocks/2/steps/2/ops/0/ref', code: 'unknown-ref' },
  ],
  [
    'a transition from the wrong state',
    'event-loop',
    (l) =>
      edit(l, '/sections/2/blocks/0/steps/1/ops/0', {
        op: 'fire',
        transition: 't-reject',
        event: null,
      }),
    {
      path: '/sections/2/blocks/0/steps/1/ops/0/transition',
      code: 'illegal-op',
    },
  ],
  [
    'a cloze blank that is not declared',
    'event-loop',
    (l) =>
      edit(
        l,
        '/sections/2/blocks/1/text',
        'Promise callbacks wait in the {{q1}} queue, emptied {{q2}} tasks; timers use the {{q4}} queue.',
      ),
    { path: '/sections/2/blocks/1/text', code: 'unknown-ref' },
  ],
  [
    'a Parsons line with a blank but no answer',
    'binary-search',
    (l) => (read(l, '/sections/3/blocks/0/blanks') as unknown[]).pop(),
    { path: '/sections/3/blocks/0/lines/6/code', code: 'shape' },
  ],
  [
    'a prediction revealed by a visual that does not exist',
    'binary-search',
    (l) => edit(l, '/sections/0/blocks/1/reveal/block', 'search'),
    { path: '/sections/0/blocks/1/reveal/block', code: 'unknown-ref' },
  ],
  [
    'a pause for something that is not a check',
    'git-branching',
    (l) => edit(l, '/sections/1/blocks/2/steps/5/pauseFor', 'git-model'),
    { path: '/sections/1/blocks/2/steps/5/pauseFor', code: 'unknown-ref' },
  ],
  [
    'executing Python',
    'recursion',
    (l) => edit(l, '/sections/1/blocks/0/mode', 'execute'),
    { path: '/sections/1/blocks/0/mode', code: 'precondition' },
  ],
  [
    'Dijkstra on an unweighted graph',
    'bfs',
    (l) =>
      edit(l, '/sections/1/blocks/0/simulate', {
        algorithm: 'dijkstra',
        start: 'a',
      }),
    { path: '/sections/1/blocks/0/simulate', code: 'precondition' },
  ],
  [
    'a maze with two starts',
    'bfs',
    (l) => edit(l, '/sections/2/blocks/0/rows/4', 'S..#..G'),
    { path: '/sections/2/blocks/0/rows', code: 'precondition' },
  ],
  [
    'a queue operation on a stack',
    'recursion',
    (l) => edit(l, '/sections/1/blocks/1/steps/0/ops/0/op', 'enqueue'),
    { path: '/sections/1/blocks/1/steps/0/ops/0/op', code: 'illegal-op' },
  ],
  [
    'a self message between two actors',
    'http-request',
    (l) => edit(l, '/sections/1/blocks/0/messages/0/style', 'self'),
    { path: '/sections/1/blocks/0/messages/0/style', code: 'shape' },
  ],
  [
    'a line chart missing values',
    'lookups',
    (l) =>
      edit(l, '/sections/2/blocks/1/series/0', {
        id: 's-hash',
        label: 'Hash',
        fn: null,
        values: [1, 1, 1],
      }),
    { path: '/sections/2/blocks/1/series/0/values', code: 'shape' },
  ],
  [
    'HTML in prose',
    'binary-search',
    (l) => edit(l, '/sections/0/blocks/0/markdown', 'Click <b>here</b>.'),
    { path: '/sections/0/blocks/0/markdown', code: 'markup' },
  ],
  [
    'a link that is not https',
    'binary-search',
    (l) =>
      edit(
        l,
        '/sections/0/blocks/0/markdown',
        'See [the spec](http://tc39.es/ecma262/).',
      ),
    { path: '/sections/0/blocks/0/markdown', code: 'bad-format' },
  ],
  [
    'a quiz with no wrong option',
    'git-branching',
    (l) => edit(l, '/sections/2/blocks/1/correct', [0, 1, 2, 3]),
    { path: '/sections/2/blocks/1/correct', code: 'too-many' },
  ],
  [
    'a category nothing belongs to',
    'recursion',
    (l) =>
      edit(l, '/sections/3/blocks/0/categories/2', {
        id: 'loop',
        label: 'Loop',
      }),
    { path: '/sections/3/blocks/0/categories/2', code: 'shape' },
  ],
];

describe('Lesson validation', () => {
  it.each(CASES)('catches %s', (_, name, breakIt, expected) => {
    const lesson = golden(name);
    breakIt(lesson);
    const result = validateLesson(lesson);
    expect(result.ok).toBe(false);
    expect(issuesOf(result)).toContainEqual(expect.objectContaining(expected));
  });

  it('says what to change, for the repair call', () => {
    const lesson = golden('lookups');
    edit(lesson, '/sections/1/blocks/0/steps/0/ops/0/bucket', 3);
    const [issue] = issuesOf(validateLesson(lesson));
    expect(issue.message).toBe(
      '"cat" hashes to bucket 2 with char-sum-mod over 5 buckets, not 3.',
    );
  });

  // A lesson on the ECMAScript spec wrote this; it was taken for a link.
  it('lets spec notation and code spans through as text, not links', () => {
    const lesson = golden('binary-search');
    edit(
      lesson,
      '/sections/0/blocks/0/markdown',
      'Step 2 returns O.[[Get]](P, Receiver), or `O.[[Get]](P)` for short. [MDN](https://developer.mozilla.org/) has more.',
    );
    expect(validateLesson(lesson)).toMatchObject({ ok: true });
  });

  it('warns, without failing, when a lesson asks nothing', () => {
    const lesson = golden('binary-search') as {
      sections: { blocks: { kind: string }[] }[];
    };
    lesson.sections = [
      { ...lesson.sections[1], blocks: [lesson.sections[1].blocks[0]] },
    ] as typeof lesson.sections;
    const result = validateLesson(lesson);
    expect(result.ok).toBe(true);
    expect(issuesOf(result).map((issue) => issue.code)).toEqual(['pedagogy']);
  });
});

describe('Block validation', () => {
  const tree = {
    id: 'calls',
    kind: 'recursion-tree',
    title: null,
    fn: 'fib(n)',
    simulate: null,
    calls: [
      { id: 'f2', label: 'fib(2)', parent: null },
      { id: 'f1', label: 'fib(1)', parent: 'f2' },
      { id: 'f0', label: 'fib(0)', parent: 'f2' },
    ],
    steps: [
      { ...step(1), ops: [{ op: 'call', call: 'f2', value: null }] },
      { ...step(2), ops: [{ op: 'call', call: 'f1', value: null }] },
      { ...step(3), ops: [{ op: 'return', call: 'f1', value: '1' }] },
      { ...step(4), ops: [{ op: 'call', call: 'f0', value: null }] },
      { ...step(5), ops: [{ op: 'return', call: 'f0', value: '0' }] },
      { ...step(6), ops: [{ op: 'return', call: 'f2', value: '1' }] },
    ],
  };

  it('accepts a block on its own, as lesson-block returns it', () => {
    expect(validateBlock(tree, 'recursion-tree').ok).toBe(true);
  });

  it('replays calls in stack order', () => {
    const broken = structuredClone(tree);
    [broken.steps[2], broken.steps[3]] = [broken.steps[3], broken.steps[2]];
    expect(issuesOf(validateBlock(broken, 'recursion-tree'))).toContainEqual(
      expect.objectContaining({
        path: '/steps/2/ops/0/call',
        code: 'illegal-op',
      }),
    );
  });

  it('refuses a block of another kind than asked for', () => {
    expect(issuesOf(validateBlock(tree, 'graph'))).toEqual([
      expect.objectContaining({ path: '/kind', code: 'unknown-kind' }),
    ]);
  });
});

describe('Outlines and requests', () => {
  const outline = {
    title: 'Binary search',
    minutes: 15,
    objectives: ['Explain why binary search needs sorted input'],
    sections: [
      {
        id: 'hook',
        title: 'Guess the number',
        intent: 'hook',
        blocks: [
          {
            id: 'hook-text',
            kind: 'prose',
            brief:
              'The 1–100 guessing game: halving finds any number in 7 guesses.',
          },
          {
            id: 'guess',
            kind: 'predict',
            brief:
              'How many comparisons to find 9 in [1, 3, 5, 7, 9, 11, 13]? Answer 3.',
          },
        ],
      },
    ],
    cards: [
      {
        type: 'fact',
        front: 'What does binary search need?',
        back: 'Sorted input.',
      },
    ],
  };

  it('accepts a sound outline and catches a repeated id', () => {
    expect(validateOutline(outline).ok).toBe(true);
    const broken = structuredClone(outline);
    broken.sections[0].blocks[1].id = 'hook';
    expect(issuesOf(validateOutline(broken))).toContainEqual(
      expect.objectContaining({
        path: '/sections/0/blocks/1/id',
        code: 'duplicate-id',
      }),
    );
  });

  it('builds a request the webhook accepts, and refuses oversized input', () => {
    const input = {
      subject: 'Algorithms',
      sectionTitle: 'Binary search',
      sectionSummary: 'Searching sorted arrays by halving.',
      subtopics: ['Invariants', 'Off-by-one errors'],
      tier: 'beginner' as const,
      minutes: 15,
    };
    const request = buildGenerateRequest('lesson-outline', input);
    expect(request.ok && request.value).toEqual({
      action: 'generate_lesson_part',
      task: 'lesson-outline',
      specVersion: 1,
      input,
    });
    const tooLong = buildGenerateRequest('lesson-outline', {
      ...input,
      subject: 'x'.repeat(121),
    });
    expect(issuesOf(tooLong)).toContainEqual(
      expect.objectContaining({ path: '/input/subject', code: 'too-long' }),
    );
  });
});
