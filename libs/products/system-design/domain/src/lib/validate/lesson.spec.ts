import type { LessonMeta } from '../model/course';
import type { Lesson, LessonStep } from '../model/lesson';
import { fixtureLesson, fixtureMeta } from '../testing/fixtures';
import { validateLesson } from './lesson';

type Break = (lesson: Lesson, meta: LessonMeta) => [Lesson, LessonMeta];

const step = (l: Lesson, i: number, patch: Partial<LessonStep>): Lesson => ({
  ...l,
  steps: l.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)),
});

describe('validateLesson', () => {
  it('accepts the fixture', () => {
    expect(validateLesson(fixtureMeta(), fixtureLesson())).toEqual([]);
  });

  const cases: [string, Break, string][] = [
    [
      'meta id style',
      (l, m) => [l, { ...m, id: 'Bad_Id' }],
      'meta id "Bad_Id" is not kebab-case',
    ],
    [
      'meta and lesson ids',
      (l, m) => [{ ...l, id: 'other' }, m],
      'meta id "fixture" ≠ lesson id "other"',
    ],
    [
      'title length',
      (l, m) => [l, { ...m, title: 'x'.repeat(33) }],
      'title is over 32',
    ],
    [
      'summary length',
      (l, m) => [l, { ...m, summary: 'x'.repeat(111) }],
      'summary is over 110',
    ],
    ['minutes', (l, m) => [l, { ...m, minutes: 30 }], 'minutes must be 5–15'],
    [
      'keywords',
      (l, m) => [l, { ...m, keywords: ['one'] }],
      'keywords must number 3–10',
    ],
    [
      'learn count',
      (l, m) => [{ ...l, learn: ['a', 'b'] }, m],
      'learn must have 3–6',
    ],
    [
      'learn length',
      (l, m) => [{ ...l, learn: [...l.learn.slice(0, 2), 'x'.repeat(61)] }, m],
      'learn[2] is over 60',
    ],
    [
      'hud size',
      (l, m) => [
        {
          ...l,
          hud: Array.from({ length: 6 }, (_, i) => ({
            id: `m${i}`,
            label: 'M',
            icon: 'gauge' as const,
            value: '—',
          })),
        },
        m,
      ],
      'more than 5 metrics',
    ],
    [
      'duplicate step ids',
      (l, m) => [step(l, 1, { id: 'slow' }), m],
      'step id "slow" is used twice',
    ],
    [
      'scene id style',
      (l, m) => [
        {
          ...l,
          scene: {
            ...l.scene,
            zones: [
              {
                id: 'Zone',
                from: { x: 0, y: 0 },
                to: { x: 1, y: 1 },
                hue: 'green',
              },
            ],
          },
        },
        m,
      ],
      'scene id "Zone"',
    ],
    [
      'step count',
      (l, m) => [{ ...l, steps: l.steps.slice(0, 5) }, m],
      'steps must number 6–12',
    ],
    [
      'first step kind',
      (l, m) => [step(l, 0, { kind: 'technique' }), m],
      'first step must be a problem',
    ],
    [
      'last step kind',
      (l, m) => [step(l, 5, { kind: 'case', takeaways: undefined }), m],
      'last step must be a recap',
    ],
    [
      'a case step',
      (l, m) => [step(l, 3, { kind: 'technique' }), m],
      'needs at least one case step',
    ],
    [
      'a watch-out step',
      (l, m) => [step(l, 4, { kind: 'technique' }), m],
      'needs at least one watch-out step',
    ],
    [
      'recap only last',
      (l, m) => [step(l, 4, { kind: 'recap', takeaways: ['a', 'b', 'c'] }), m],
      'only the last step may be a recap',
    ],
    [
      'label length',
      (l, m) => [step(l, 1, { label: 'x'.repeat(15) }), m],
      'label must be 1–14',
    ],
    [
      'title length',
      (l, m) => [step(l, 1, { title: '' }), m],
      'title must be 1–48',
    ],
    [
      'paragraphs',
      (l, m) => [step(l, 1, { body: [] }), m],
      'body must have 1–3',
    ],
    [
      'words',
      (l, m) => [step(l, 1, { body: ['word '.repeat(81)] }), m],
      'body has 81 words',
    ],
    [
      'callouts',
      (l, m) => [
        step(l, 1, {
          callouts: Array(3).fill({ kind: 'key-idea', text: 'x' }),
        }),
        m,
      ],
      'more than 2 callouts',
    ],
    [
      'changes',
      (l, m) => [
        step(l, 1, { changes: Array(5).fill({ type: 'added', text: 'x' }) }),
        m,
      ],
      'more than 4 changes',
    ],
    [
      'ops',
      (l, m) => [
        step(l, 0, {
          ops: Array(13).fill({ op: 'set-metric', id: 'p50', value: '1' }),
        }),
        m,
      ],
      'more than 12 ops',
    ],
    [
      'learns range',
      (l, m) => [step(l, 1, { learns: [0, 9] }), m],
      'learns index 9 is out of range',
    ],
    [
      'learn ticked',
      (l, m) => [step(l, 4, { learns: [] }), m],
      'learn[2] is never ticked',
    ],
    [
      'recap takeaways',
      (l, m) => [step(l, 5, { takeaways: ['one'] }), m],
      'a recap needs 3–5 takeaways',
    ],
    [
      'takeaways elsewhere',
      (l, m) => [step(l, 2, { takeaways: ['x'] }), m],
      'only the recap has takeaways',
    ],
    [
      'reference at run time',
      (l, m) => [
        step(l, 0, {
          ops: [{ op: 'packet', edge: 'app-cache', kind: 'request' }],
        }),
        m,
      ],
      'step 1 ("slow"): packet on unknown edge "app-cache"',
    ],
    [
      'shared cell',
      (l, m) => [
        step(l, 1, {
          ops: [
            {
              op: 'add-node',
              node: {
                id: 'cache',
                kind: 'cache',
                at: { x: 2, y: 2 },
                label: 'C',
              },
            },
            {
              op: 'add-edge',
              edge: { id: 'app-cache', from: 'app', to: 'cache' },
            },
          ],
        }),
        m,
      ],
      'nodes "app" and "cache" share cell 2,2',
    ],
    [
      'grid size',
      (l, m) => [
        {
          ...l,
          scene: {
            ...l.scene,
            nodes: [
              l.scene.nodes[0],
              { ...l.scene.nodes[1], at: { x: 14, y: 0 } },
            ],
          },
        },
        m,
      ],
      'node "db" is outside the 14×10 grid',
    ],
    [
      'baseline note anchor',
      (l, m) => [
        {
          ...l,
          scene: {
            ...l.scene,
            notes: [
              { id: 'n', anchor: { node: 'x' }, text: 't' },
              { id: 'e', anchor: { edge: 'x' }, text: 't' },
            ],
          },
        },
        m,
      ],
      'baseline: note "n" is anchored to unknown node "x"',
    ],
    [
      'baseline edge',
      (l, m) => [
        {
          ...l,
          scene: { ...l.scene, edges: [{ id: 'e', from: 'app', to: 'x' }] },
        },
        m,
      ],
      'baseline: edge "e" joins an unknown node',
    ],
    [
      'check count',
      (l, m) => [{ ...l, checks: l.checks.slice(0, 2) }, m],
      'checks must number 3–8',
    ],
    [
      'check text',
      (l, m) => [
        {
          ...l,
          checks: [{ ...l.checks[0], prompt: ' ' }, ...l.checks.slice(1)],
        },
        m,
      ],
      'check "q1": needs a prompt',
    ],
    [
      'check step',
      (l, m) => [
        {
          ...l,
          checks: [{ ...l.checks[0], step: 'nope' }, ...l.checks.slice(1)],
        },
        m,
      ],
      'check "q1": unknown step "nope"',
    ],
    [
      'choice options',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'choice',
              prompt: 'p',
              options: ['a'],
              answer: 0,
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'needs 2–5 options',
    ],
    [
      'distinct options',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'choice',
              prompt: 'p',
              options: ['a', 'a'],
              answer: 0,
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'options must be distinct',
    ],
    [
      'choice answer',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'choice',
              prompt: 'p',
              options: ['a', 'b'],
              answer: 2,
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'answer is out of range',
    ],
    [
      'numeric answer',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'numeric',
              prompt: 'p',
              unit: 'u',
              answer: Number.NaN,
              tolerance: 0.1,
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'answer must be a number',
    ],
    [
      'tolerance',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'numeric',
              prompt: 'p',
              unit: 'u',
              answer: 1,
              tolerance: 0.9,
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'tolerance must be 0.05–0.5',
    ],
    [
      'order items',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'order',
              prompt: 'p',
              items: ['a', 'b'],
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'needs 3–6 items',
    ],
    [
      'distinct items',
      (l, m) => [
        {
          ...l,
          checks: [
            {
              id: 'q1',
              kind: 'order',
              prompt: 'p',
              items: ['a', 'a', 'b'],
              explain: 'e',
            },
            ...l.checks.slice(1),
          ],
        },
        m,
      ],
      'items must be distinct',
    ],
    [
      'card count',
      (l, m) => [{ ...l, cards: l.cards.slice(0, 2) }, m],
      'cards must number 3–6',
    ],
    [
      'card text',
      (l, m) => [
        { ...l, cards: [{ front: '', back: 'b' }, ...l.cards.slice(1)] },
        m,
      ],
      'card 1 needs a front and a back',
    ],
  ];

  it.each(cases)('reports %s', (_, breakIt, expected) => {
    const [lesson, meta] = breakIt(fixtureLesson(), fixtureMeta());
    const problems = validateLesson(meta, lesson);
    expect(
      problems.some((p) => p.includes(expected)),
      problems.join('\n'),
    ).toBe(true);
  });
});
