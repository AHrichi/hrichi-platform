import type { BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';
import type { OpOf } from './contracts';
import { StepList, upTo } from './steps';

type GraphBlock = BlockOf<'graph'>;
type GraphOp = OpOf<'graph'>;

export interface GraphState {
  visited: string[];
  /** The queue or stack, oldest first. */
  frontier: string[];
  distances: Record<string, string>;
  /** Edges that joined the search tree or the shortest-path tree. */
  treeEdges: string[];
  output: string[];
  /** This step only. */
  activeNodes: string[];
  activeEdges: string[];
}

function op(fields: Partial<GraphOp> & Pick<GraphOp, 'op'>): GraphOp {
  return { node: null, edge: null, value: null, ...fields };
}

export function graphStateAt(
  block: GraphBlock,
  n: number,
  steps: readonly Step<GraphOp>[] = simulateGraph(block),
): GraphState {
  const state: GraphState = {
    visited: [],
    frontier: [],
    distances: {},
    treeEdges: [],
    output: [],
    activeNodes: [],
    activeEdges: [],
  };
  upTo(steps, n, (o, current) => {
    switch (o.op) {
      case 'visit':
        if (o.node && !state.visited.includes(o.node))
          state.visited.push(o.node);
        break;
      case 'enqueue':
      case 'push':
        if (o.node) state.frontier.push(o.node);
        break;
      case 'dequeue':
        state.frontier.shift();
        break;
      case 'pop':
        state.frontier.pop();
        break;
      case 'mark-edge':
        if (o.edge && !state.treeEdges.includes(o.edge))
          state.treeEdges.push(o.edge);
        break;
      case 'set-distance':
        if (o.node) state.distances[o.node] = o.value ?? '';
        break;
      case 'emit':
        state.output.push(o.value ?? o.node ?? '');
        break;
      case 'relax':
        break;
    }
    if (!current) return;
    if (o.node) state.activeNodes.push(o.node);
    if (o.edge) state.activeEdges.push(o.edge);
  });
  return state;
}

/** The most ops a step may carry (LIMITS.opsPerStep). */
const MAX_OPS = 6;

/**
 * Adds a step, moving what doesn't fit into follow-up steps, so simulated
 * steps stay within the format's limit on ops.
 */
function addSplit(
  out: StepList<GraphOp>,
  title: string,
  narration: string,
  ops: GraphOp[],
  more: { title: string; narration: string; ops: GraphOp[] },
): void {
  if (ops.length + more.ops.length <= MAX_OPS) {
    out.add(title, narration, [...ops, ...more.ops]);
    return;
  }
  out.add(title, narration, ops);
  for (let i = 0; i < more.ops.length; i += MAX_OPS) {
    out.add(more.title, more.narration, more.ops.slice(i, i + MAX_OPS));
  }
}

/** Neighbours in the order the edges were given; both ways if undirected. */
function neighbours(block: GraphBlock, id: string) {
  return block.edges.flatMap((edge) =>
    edge.from === id
      ? [{ node: edge.to, edge }]
      : !block.directed && edge.to === id
        ? [{ node: edge.from, edge }]
        : [],
  );
}

/** Steps for a graph block's `simulate`; its own steps otherwise. */
export function simulateGraph(block: GraphBlock): Step<GraphOp>[] {
  const sim = block.simulate;
  if (!sim) return block.steps;
  const out = new StepList<GraphOp>();
  const label = new Map(block.nodes.map((n) => [n.id, n.label]));
  const name = (id: string) => label.get(id) ?? id;
  const start = sim.start ?? block.nodes[0]?.id;

  switch (sim.algorithm) {
    case 'bfs': {
      if (!start) return [];
      const seen = new Set([start]);
      const queue = [start];
      out.add(
        `Start at ${name(start)}`,
        `Put ${name(start)} in the queue. BFS explores in rings: everything one edge away, then two, and so on.`,
        [op({ op: 'enqueue', node: start })],
      );
      while (queue.length) {
        const u = queue.shift() as string;
        const found = neighbours(block, u).filter(
          ({ node }) => !seen.has(node),
        );
        found.forEach(({ node }) => seen.add(node));
        queue.push(...found.map((f) => f.node));
        addSplit(
          out,
          `Visit ${name(u)}`,
          found.length
            ? `Take ${name(u)} from the front of the queue and add its new neighbours: ${found.map((f) => name(f.node)).join(', ')}.`
            : `Take ${name(u)} from the front of the queue. It has no new neighbours.`,
          [
            op({ op: 'dequeue', node: u }),
            op({ op: 'visit', node: u }),
            op({ op: 'emit', node: u, value: name(u) }),
          ],
          {
            title: `Queue ${name(u)}'s neighbours`,
            narration: `${found.map((f) => name(f.node)).join(', ')} join the back of the queue.`,
            ops: found.flatMap((f) => [
              op({ op: 'mark-edge', edge: f.edge.id }),
              op({ op: 'enqueue', node: f.node }),
            ]),
          },
        );
      }
      return out.list;
    }
    case 'dfs': {
      if (!start) return [];
      const seen = new Set<string>();
      const stack: { node: string; edge: string | null }[] = [
        { node: start, edge: null },
      ];
      out.add(
        `Start at ${name(start)}`,
        `Push ${name(start)} on the stack. DFS follows one path as deep as it goes, then backs up.`,
        [op({ op: 'push', node: start })],
      );
      while (stack.length) {
        const { node: u, edge } = stack.pop() as {
          node: string;
          edge: string | null;
        };
        if (seen.has(u)) {
          out.add(`Skip ${name(u)}`, `${name(u)} was already visited.`, [
            op({ op: 'pop', node: u }),
          ]);
          continue;
        }
        seen.add(u);
        const next = neighbours(block, u).filter(({ node }) => !seen.has(node));
        // Pushed in reverse, so the first neighbour is explored first.
        const pushed = [...next].reverse();
        stack.push(...pushed.map((f) => ({ node: f.node, edge: f.edge.id })));
        addSplit(
          out,
          `Visit ${name(u)}`,
          next.length
            ? `Pop ${name(u)}, visit it, and push its unvisited neighbours.`
            : `Pop ${name(u)} and visit it. Nothing new is reachable from here, so DFS backs up.`,
          [
            op({ op: 'pop', node: u }),
            op({ op: 'visit', node: u }),
            op({ op: 'emit', node: u, value: name(u) }),
            ...(edge ? [op({ op: 'mark-edge', edge })] : []),
          ],
          {
            title: `Push ${name(u)}'s neighbours`,
            narration: 'The last one pushed is explored next.',
            ops: pushed.map((f) => op({ op: 'push', node: f.node })),
          },
        );
      }
      return out.list;
    }
    case 'dijkstra': {
      if (!start) return [];
      const dist = new Map<string, number>([[start, 0]]);
      const via = new Map<string, string>();
      const done = new Set<string>();
      out.add(
        `Start at ${name(start)}`,
        `${name(start)} is 0 away from itself. Every other node starts at infinity.`,
        [op({ op: 'set-distance', node: start, value: '0' })],
      );
      for (;;) {
        const next = block.nodes
          .map((n) => n.id)
          .filter((id) => !done.has(id) && dist.has(id))
          .sort((a, b) => (dist.get(a) as number) - (dist.get(b) as number))[0];
        if (!next) break;
        done.add(next);
        const d = dist.get(next) as number;
        const ops = [op({ op: 'visit', node: next })];
        const viaEdge = via.get(next);
        if (viaEdge) ops.push(op({ op: 'mark-edge', edge: viaEdge }));
        const relaxOps: GraphOp[] = [];
        const relaxed: string[] = [];
        for (const { node, edge } of neighbours(block, next)) {
          if (done.has(node)) continue;
          const candidate = d + (edge.weight ?? 0);
          if (candidate < (dist.get(node) ?? Infinity)) {
            dist.set(node, candidate);
            via.set(node, edge.id);
            relaxed.push(`${name(node)} to ${candidate}`);
            relaxOps.push(
              op({ op: 'relax', edge: edge.id }),
              op({ op: 'set-distance', node, value: String(candidate) }),
            );
          }
        }
        addSplit(
          out,
          `Settle ${name(next)} at ${d}`,
          `${name(next)} is the closest unsettled node, so ${d} is final. ${relaxed.length ? `Shorter paths: ${relaxed.join(', ')}.` : 'No shorter paths through it.'}`,
          ops,
          {
            title: `Shorter paths through ${name(next)}`,
            narration: `Update ${relaxed.join(', ')}.`,
            ops: relaxOps,
          },
        );
      }
      return out.list;
    }
    case 'topological-sort': {
      const indegree = new Map(block.nodes.map((n) => [n.id, 0]));
      for (const edge of block.edges) {
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
      }
      const queue = block.nodes
        .map((n) => n.id)
        .filter((id) => indegree.get(id) === 0);
      out.add(
        'Nodes with no prerequisites',
        `${queue.map(name).join(', ')} depend on nothing, so they can go first.`,
        queue.map((node) => op({ op: 'enqueue', node })),
      );
      while (queue.length) {
        const u = queue.shift() as string;
        const freed: string[] = [];
        for (const edge of block.edges.filter((e) => e.from === u)) {
          const left = (indegree.get(edge.to) ?? 0) - 1;
          indegree.set(edge.to, left);
          if (left === 0) freed.push(edge.to);
        }
        queue.push(...freed);
        addSplit(
          out,
          `Output ${name(u)}`,
          freed.length
            ? `With ${name(u)} done, ${freed.map(name).join(', ')} have no prerequisites left.`
            : `Output ${name(u)}.`,
          [
            op({ op: 'dequeue', node: u }),
            op({ op: 'visit', node: u }),
            op({ op: 'emit', node: u, value: name(u) }),
          ],
          {
            title: 'Now free to go',
            narration: `${freed.map(name).join(', ')} join the queue.`,
            ops: freed.map((node) => op({ op: 'enqueue', node })),
          },
        );
      }
      return out.list;
    }
  }
}

/** Nodes on a circle, for undirected graphs, which have no flow to follow. */
export function circleLayout(
  ids: readonly string[],
  radius: number,
): Map<string, { x: number; y: number }> {
  return new Map(
    ids.map((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
      return [
        id,
        {
          x: radius + radius * Math.cos(angle),
          y: radius + radius * Math.sin(angle),
        },
      ];
    }),
  );
}
