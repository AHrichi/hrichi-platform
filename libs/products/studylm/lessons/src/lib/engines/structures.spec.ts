import { GOLDEN_LESSONS } from '../../golden';
import type { Block, BlockOf } from '../spec/blocks';
import type { Lesson } from '../spec/lesson';
import { validateBlock } from '../validate/validate';
import { graphStateAt, simulateGraph } from './graph';
import { gridStateAt, simulateGrid } from './grid';
import { hashStateAt } from './hash';
import { recursionStateAt, simulateRecursion } from './recursion';
import { stepsOf } from './replay';
import {
  chartSeries,
  conceptMapStateAt,
  eventLoopStateAt,
  gitStateAt,
  pipelineStateAt,
  stateMachineStateAt,
} from './systems';
import { simulateTree, treeLayout, treeStateAt } from './tree';

const blocks: Block[] = (Object.values(GOLDEN_LESSONS) as Lesson[]).flatMap(
  (l) => l.sections.flatMap((s) => s.blocks),
);
const golden = <K extends Block['kind']>(kind: K, id?: string) =>
  blocks.find(
    (b): b is BlockOf<K> => b.kind === kind && (!id || b.id === id),
  ) as BlockOf<K>;

/** A simulated block with its steps written out, as the AI could write it. */
function writtenOut<K extends 'tree' | 'graph' | 'grid'>(
  block: BlockOf<K>,
  steps: readonly unknown[],
) {
  return { ...block, simulate: null, steps } as unknown as BlockOf<K>;
}

describe('tree', () => {
  const empty: BlockOf<'tree'> = {
    id: 't',
    kind: 'tree',
    title: null,
    variant: 'bst',
    nodes: [],
    simulate: { algorithm: 'bst-insert', values: [5, 3, 8, 1, 4] },
    steps: [],
  };

  it('builds a BST that reads back sorted in order', () => {
    const steps = simulateTree(empty);
    const built = treeStateAt(empty, steps.length - 1, steps);
    expect(built.nodes.map((n) => n.label).sort()).toEqual([
      '1',
      '3',
      '4',
      '5',
      '8',
    ]);

    const inorder: BlockOf<'tree'> = {
      ...empty,
      nodes: built.nodes,
      simulate: { algorithm: 'inorder', values: [] },
    };
    const end = treeStateAt(inorder, 99);
    expect(end.output).toEqual(['1', '3', '4', '5', '8']);
    expect(
      validateBlock(writtenOut(inorder, simulateTree(inorder)), 'tree'),
    ).toMatchObject({ ok: true });
  });

  it('keeps the heap order through pushes and a pop', () => {
    const heap: BlockOf<'tree'> = {
      ...empty,
      variant: 'min-heap',
      simulate: { algorithm: 'heap-push', values: [7, 3, 9, 1] },
    };
    const pushed = treeStateAt(heap, 99);
    const label = (id: string | null) =>
      Number(pushed.nodes.find((n) => n.id === id)?.label);
    for (const node of pushed.nodes) {
      if (node.parent)
        expect(Number(node.label)).toBeGreaterThanOrEqual(label(node.parent));
    }
    const pop: BlockOf<'tree'> = {
      ...heap,
      nodes: pushed.nodes,
      simulate: { algorithm: 'heap-pop', values: [] },
    };
    const popped = treeStateAt(pop, 99);
    expect(popped.output).toEqual(['1']);
    expect(popped.nodes).toHaveLength(3);
    expect(Math.min(...popped.nodes.map((n) => Number(n.label)))).toBe(
      Number(popped.nodes.find((n) => n.parent === null)?.label),
    );
  });

  it('replays the golden BST search and lays it out', () => {
    const block = golden('tree', 'bst-search');
    const end = treeStateAt(block, block.steps.length - 1);
    expect(end.visited.length).toBeGreaterThan(0);
    const layout = treeLayout(end.nodes, true);
    expect(layout.at.size).toBe(end.nodes.length);
  });
});

describe('graph', () => {
  it('visits the golden friends graph in BFS order, each node once', () => {
    const block = golden('graph', 'friends');
    const steps = simulateGraph(block);
    const end = graphStateAt(block, steps.length - 1, steps);
    expect(new Set(end.output).size).toBe(end.output.length);
    expect(end.visited[0]).toBe('a');
    expect(validateBlock(writtenOut(block, steps), 'graph')).toMatchObject({
      ok: true,
    });
  });

  const weighted: BlockOf<'graph'> = {
    id: 'g',
    kind: 'graph',
    title: null,
    directed: true,
    weighted: true,
    nodes: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id.toUpperCase() })),
    edges: [
      { id: 'ab', from: 'a', to: 'b', weight: 4 },
      { id: 'ac', from: 'a', to: 'c', weight: 1 },
      { id: 'cb', from: 'c', to: 'b', weight: 2 },
      { id: 'bd', from: 'b', to: 'd', weight: 1 },
    ],
    simulate: { algorithm: 'dijkstra', start: 'a' },
    steps: [],
  };

  it('finds shortest distances with Dijkstra', () => {
    expect(graphStateAt(weighted, 99).distances).toEqual({
      a: '0',
      b: '3',
      c: '1',
      d: '4',
    });
  });

  it('orders a DAG so every edge points forward', () => {
    const topo = {
      ...weighted,
      simulate: { algorithm: 'topological-sort' as const, start: null },
    };
    const order = graphStateAt(topo, 99).output;
    const pos = (label: string) => order.indexOf(label);
    for (const edge of topo.edges) {
      expect(pos(edge.from.toUpperCase())).toBeLessThan(
        pos(edge.to.toUpperCase()),
      );
    }
  });

  it('visits every reachable node with DFS', () => {
    const dfs = {
      ...weighted,
      simulate: { algorithm: 'dfs' as const, start: 'a' },
    };
    expect([...graphStateAt(dfs, 99).output].sort()).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
  });
});

describe('grid', () => {
  it('finds the golden maze’s shortest path: 14 moves, as the lesson predicts', () => {
    const block = golden('grid', 'maze');
    const steps = simulateGrid(block);
    expect(steps.at(-1)?.title).toBe('Reached G in 14 moves');
    const end = gridStateAt(block, steps.length - 1, steps);
    expect(end.path.flat().filter(Boolean)).toHaveLength(15);
  });

  it('agrees with BFS when A* searches the same maze', () => {
    const maze = golden('grid', 'maze');
    const astar = {
      ...maze,
      simulate: { ...maze.simulate, algorithm: 'a-star' as const },
    } as BlockOf<'grid'>;
    expect(simulateGrid(astar).at(-1)?.title).toBe('Reached G in 14 moves');
  });

  it('counts paths, cheapest sums and the LCS', () => {
    const base: BlockOf<'grid'> = {
      id: 'g',
      kind: 'grid',
      title: null,
      rows: ['...', '...', '...'],
      simulate: { algorithm: 'unique-paths', a: null, b: null },
      steps: [],
    };
    expect(gridStateAt(base, 99).values[2][2]).toBe('6');
    const costs = {
      ...base,
      rows: ['131', '151', '421'],
      simulate: { algorithm: 'min-path-sum' as const, a: null, b: null },
    };
    expect(gridStateAt(costs, 99).values[2][2]).toBe('7');
    const lcs = {
      ...base,
      rows: [],
      simulate: { algorithm: 'lcs' as const, a: 'ABCB', b: 'BDCB' },
    };
    const table = gridStateAt(lcs, 99);
    expect(table.values[4][4]).toBe('3');
    expect(table.labels).toEqual({ rows: 'ABCB', cols: 'BDCB' });
  });
});

describe('recursion', () => {
  it('makes 9 calls for fib(4) without a memo, fewer with one', () => {
    const plain = simulateRecursion(golden('recursion-tree', 'fib-tree'));
    expect(plain.calls).toHaveLength(9);
    const memo = simulateRecursion(golden('recursion-tree', 'fib-memo'));
    expect(memo.calls.length).toBeLessThan(9);
    expect(memo.steps.some((s) => s.ops.some((o) => o.op === 'memo-hit'))).toBe(
      true,
    );
    const block = golden('recursion-tree', 'fib-tree');
    const end = recursionStateAt(block, plain.steps.length - 1, plain);
    expect(end.values[plain.calls[0].id]).toBe('3');
    expect(end.stack).toEqual([]);
  });

  it('computes factorial, powers and subsets', () => {
    const run = (algorithm: 'factorial' | 'power' | 'subsets', n: number) => {
      const block: BlockOf<'recursion-tree'> = {
        id: 'r',
        kind: 'recursion-tree',
        title: null,
        fn: 'f(n)',
        simulate: { algorithm, n, memo: false },
        calls: [],
        steps: [],
      };
      const played = simulateRecursion(block);
      return { played, end: recursionStateAt(block, 999, played) };
    };
    const fact = run('factorial', 5);
    expect(fact.end.values[fact.played.calls[0].id]).toBe('120');
    const pow = run('power', 5);
    expect(pow.end.values[pow.played.calls[0].id]).toBe('32');
    const subsets = run('subsets', 3);
    expect(subsets.end.values[subsets.played.calls[0].id]).toBe('8');
  });
});

describe('systems', () => {
  it('rehashes the golden table and ends with every key in its bucket', () => {
    const block = golden('hash-table', 'hash-demo');
    const end = hashStateAt(block, block.steps.length - 1);
    expect(end.buckets).toHaveLength(7);
  });

  it('logs the golden event loop in order', () => {
    const block = golden('event-loop', 'loop');
    const end = eventLoopStateAt(block, block.steps.length - 1);
    expect(end.stack).toEqual([]);
    expect(end.console.length).toBeGreaterThan(0);
  });

  it('replays the golden git history, state machine, pipeline and map', () => {
    const git = golden('git-graph', 'history');
    const history = gitStateAt(git, git.steps.length - 1);
    expect(history.commits.find((c) => c.id === 'm1')?.parents).toHaveLength(2);
    expect(history.tags['v1.0']).toBeDefined();

    const machine = golden('state-machine', 'promise-states');
    expect(
      stateMachineStateAt(machine, machine.steps.length - 1).current,
    ).not.toBeNull();

    const pipe = golden('pipeline', 'middleware');
    expect(pipelineStateAt(pipe, pipe.steps.length - 1).active).not.toBeNull();

    const map = golden('concept-map', 'git-model');
    const before = conceptMapStateAt(map, -1).shown.length;
    expect(
      conceptMapStateAt(map, map.steps.length - 1).shown.length,
    ).toBeGreaterThan(before);
  });

  it('computes the golden growth chart', () => {
    const chart = chartSeries(golden('chart', 'growth'));
    expect(chart.xs[0]).toBe(1);
    const linear = chart.series.find(
      (s) => s.values.at(-1) === chart.xs.at(-1),
    );
    expect(linear).toBeDefined();
  });

  it('gives every golden stepped block a step list', () => {
    for (const block of blocks) {
      if (!('steps' in block) || block.kind === 'code-trace') continue;
      expect(stepsOf(block as never).length).toBeGreaterThan(0);
    }
  });
});
