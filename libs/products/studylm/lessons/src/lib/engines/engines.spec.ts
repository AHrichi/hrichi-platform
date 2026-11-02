import { GOLDEN_LESSONS } from '../../golden';
import type { Block, BlockOf } from '../spec/blocks';
import type { Lesson } from '../spec/lesson';
import { validateBlock } from '../validate/validate';
import { simulateArray, simulatedPointers } from './array-simulators';
import { layeredLayout } from './layout';
import { parseInline, parseMarkdown } from './markdown';
import {
  arrayStateAt,
  flowStateAt,
  sequenceStateAt,
  stackQueueStateAt,
  stepsOf,
  walkthroughStateAt,
} from './replay';

const lessons = Object.values(GOLDEN_LESSONS) as Lesson[];
const blocks: Block[] = lessons.flatMap((l) =>
  l.sections.flatMap((s) => s.blocks),
);
const ofKind = <K extends Block['kind']>(kind: K) =>
  blocks.filter((b): b is BlockOf<K> => b.kind === kind);

type Algorithm = NonNullable<BlockOf<'array'>['simulate']>['algorithm'];

function arrayBlock(
  values: number[],
  algorithm: Algorithm,
  target: number | null = null,
  window: number | null = null,
): BlockOf<'array'> {
  return {
    id: 'a',
    kind: 'array',
    title: null,
    values,
    pointers: [],
    simulate: { algorithm, target, window },
    steps: [],
  };
}

/** The simulated steps written out, as an AI would write them. */
function written(block: BlockOf<'array'>) {
  return {
    ...block,
    simulate: null,
    pointers: simulatedPointers(block),
    steps: simulateArray(block),
  };
}

describe('array simulators', () => {
  it('finds 9 in the golden binary search with three comparisons', () => {
    const [block] = ofKind('array').filter(
      (b) => b.simulate?.algorithm === 'binary-search',
    );
    const steps = simulateArray(block);
    expect(steps.filter((s) => s.title.startsWith('Check'))).toHaveLength(3);
    expect(arrayStateAt(block, steps.length - 1).found).toEqual([4]);
  });

  const sorts: Algorithm[] = [
    'bubble-sort',
    'insertion-sort',
    'selection-sort',
    'merge-sort',
    'quick-sort',
  ];
  it.each(sorts)('%s sorts, in steps the format accepts', (algorithm) => {
    const block = arrayBlock([5, 2, 4, 1], algorithm);
    const steps = simulateArray(block);
    expect(arrayStateAt(block, steps.length - 1).values).toEqual([1, 2, 4, 5]);
    expect(validateBlock(written(block), 'array')).toMatchObject({ ok: true });
  });

  const searches: [Algorithm, number | null, number | null, boolean][] = [
    ['binary-search', 6, null, false],
    ['linear-search', 7, null, true],
    ['two-pointers-pair-sum', 12, null, true],
    ['two-pointers-pair-sum', 100, null, false],
    ['sliding-window-max-sum', null, 2, true],
  ];
  it.each(searches)(
    '%s (target %s, window %s) finds: %s',
    (algorithm, target, window, hit) => {
      const block = arrayBlock([1, 3, 5, 7, 9], algorithm, target, window);
      const end = arrayStateAt(block, simulateArray(block).length - 1);
      expect(end.found.length > 0).toBe(hit);
      expect(end.notFound).toBe(!hit);
      expect(validateBlock(written(block), 'array')).toMatchObject({
        ok: true,
      });
    },
  );

  it('computes prefix sums and reverses', () => {
    expect(
      arrayStateAt(arrayBlock([1, 2, 3, 4], 'prefix-sum'), 99).values,
    ).toEqual([1, 3, 6, 10]);
    expect(
      arrayStateAt(arrayBlock([1, 2, 3, 4, 5], 'reverse'), 99).values,
    ).toEqual([5, 4, 3, 2, 1]);
  });
});

describe('replay', () => {
  it('replays every golden stepped block to each of its steps', () => {
    const replays: Partial<
      Record<Block['kind'], (b: never, n: number) => unknown>
    > = {
      array: arrayStateAt,
      'stack-queue': stackQueueStateAt,
      flow: flowStateAt,
      sequence: sequenceStateAt,
      'code-walkthrough': walkthroughStateAt,
    };
    const kinds = new Set<string>();
    for (const block of blocks) {
      const replay = replays[block.kind];
      if (!replay) continue;
      kinds.add(block.kind);
      const total = stepsOf(block as BlockOf<'flow'>).length;
      for (let n = -1; n < total; n++) {
        expect(() => replay(block as never, n)).not.toThrow();
      }
    }
    expect([...kinds].sort()).toEqual(Object.keys(replays).sort());
  });

  it('keeps a swap, but shows a comparison only in its own step', () => {
    const block: BlockOf<'array'> = {
      ...arrayBlock([2, 1], 'bubble-sort'),
      simulate: null,
      steps: [
        {
          id: 's1',
          title: 'Compare',
          narration: 'Compare and swap.',
          focus: [],
          ops: [
            { op: 'compare', i: 0, j: 1, value: null, name: null },
            { op: 'swap', i: 0, j: 1, value: null, name: null },
          ],
          pauseFor: null,
        },
        {
          id: 's2',
          title: 'Done',
          narration: 'Done.',
          focus: [],
          ops: [],
          pauseFor: null,
        },
      ],
    };
    expect(arrayStateAt(block, -1).values).toEqual([2, 1]);
    expect(arrayStateAt(block, 0)).toMatchObject({
      values: [1, 2],
      compared: [0, 1],
    });
    expect(arrayStateAt(block, 1)).toMatchObject({
      values: [1, 2],
      compared: null,
    });
  });

  it('moves packets along the golden flows', () => {
    for (const flow of ofKind('flow')) {
      const states = flow.steps.map((_, n) => flowStateAt(flow, n));
      expect(states.some((s) => s.packets.length > 0)).toBe(true);
      expect(states.at(-1)?.visitedEdges.length).toBeGreaterThan(0);
    }
  });

  it('shows each golden sequence message once, in order', () => {
    for (const block of ofKind('sequence')) {
      const end = sequenceStateAt(block, block.steps.length - 1);
      expect(new Set(end.shown).size).toBe(end.shown.length);
    }
  });
});

describe('layeredLayout', () => {
  it('lays out every golden flow without overlapping boxes', () => {
    for (const flow of ofKind('flow')) {
      const layout = layeredLayout({
        direction: flow.direction,
        nodes: flow.nodes.map((n) => ({ id: n.id, width: 120, height: 56 })),
        edges: flow.edges,
      });
      for (const a of layout.nodes) {
        for (const b of layout.nodes) {
          if (a === b) continue;
          expect(Math.abs(a.x - b.x) >= 120 || Math.abs(a.y - b.y) >= 56).toBe(
            true,
          );
        }
      }
      expect(layout.edges).toHaveLength(flow.edges.length);
    }
  });

  it('puts each node after the ones leading to it, even with a cycle', () => {
    const input = {
      direction: 'lr' as const,
      nodes: ['a', 'b', 'c'].map((id) => ({ id, width: 40, height: 20 })),
      edges: [
        { id: 'ab', from: 'a', to: 'b' },
        { id: 'bc', from: 'b', to: 'c' },
        { id: 'ca', from: 'c', to: 'a' },
      ],
    };
    const layout = layeredLayout(input);
    const x = Object.fromEntries(layout.nodes.map((n) => [n.id, n.x]));
    expect(x['a']).toBeLessThan(x['b']);
    expect(x['b']).toBeLessThan(x['c']);
    // The same input always lays out the same way.
    expect(layeredLayout(input)).toEqual(layout);
  });
});

describe('parseMarkdown', () => {
  it('reads paragraphs, lists, emphasis, code and https links', () => {
    expect(
      parseMarkdown(
        'Guess *higher* or **lower**, then `mid`.\n\n- one\n- two [MDN](https://developer.mozilla.org)',
      ),
    ).toEqual([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Guess ' },
          { type: 'em', children: [{ type: 'text', text: 'higher' }] },
          { type: 'text', text: ' or ' },
          { type: 'strong', children: [{ type: 'text', text: 'lower' }] },
          { type: 'text', text: ', then ' },
          { type: 'code', text: 'mid' },
          { type: 'text', text: '.' },
        ],
      },
      {
        type: 'list',
        ordered: false,
        items: [
          [{ type: 'text', text: 'one' }],
          [
            { type: 'text', text: 'two ' },
            {
              type: 'link',
              href: 'https://developer.mozilla.org/',
              children: [{ type: 'text', text: 'MDN' }],
            },
          ],
        ],
      },
    ]);
  });

  it('keeps no link that is not https, and builds no markup', () => {
    expect(parseInline('[click](javascript:alert) <b>x</b>')).toEqual([
      { type: 'text', text: 'click' },
      { type: 'text', text: ' <b>x</b>' },
    ]);
  });

  it('reads a * b * c as arithmetic, not emphasis', () => {
    expect(parseInline('n * log n * 2')).toEqual([
      { type: 'text', text: 'n * log n * 2' },
    ]);
  });

  it('parses every golden prose block', () => {
    for (const block of ofKind('prose')) {
      expect(parseMarkdown(block.markdown).length).toBeGreaterThan(0);
    }
  });
});
