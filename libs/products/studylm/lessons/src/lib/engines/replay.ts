import type { BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';
import { simulateArray } from './array-simulators';
import type { OpOf } from './contracts';
import { simulateGraph } from './graph';
import { simulateGrid } from './grid';
import { simulateRecursion } from './recursion';
import { upTo } from './steps';
import { simulateTree } from './tree';

/**
 * What each stepped visual looks like after a step. Steps carry ops; state
 * at step `n` folds the ops of steps 0 to `n` onto the block's scene, so the
 * player can jump to any step. Some ops last (a swap, a pointer); others
 * only show during their own step (a comparison, a packet in flight).
 * `n` = -1 is the scene before the first step.
 */

export type SteppedKind =
  | 'array'
  | 'stack-queue'
  | 'hash-table'
  | 'tree'
  | 'graph'
  | 'grid'
  | 'recursion-tree'
  | 'flow'
  | 'sequence'
  | 'state-machine'
  | 'pipeline'
  | 'event-loop'
  | 'git-graph'
  | 'concept-map'
  | 'code-walkthrough';

/**
 * The steps a stepped block plays: computed by its simulator when it has
 * `simulate`. An event loop in execute mode gets its steps from the tracer.
 */
export function stepsOf(block: BlockOf<SteppedKind>): readonly Step<unknown>[] {
  switch (block.kind) {
    case 'array':
      return simulateArray(block);
    case 'tree':
      return simulateTree(block);
    case 'graph':
      return simulateGraph(block);
    case 'grid':
      return simulateGrid(block);
    case 'recursion-tree':
      return simulateRecursion(block).steps;
    default:
      return block.steps;
  }
}

// --- array ------------------------------------------------------------------

/**
 * What one array op does to the values. The validator replays with this
 * too, so a block it accepts plays exactly as it was checked.
 */
export function applyArrayOp(
  values: (number | string)[],
  op: OpOf<'array'>,
): void {
  if (op.op === 'swap' && op.i !== null && op.j !== null) {
    [values[op.i], values[op.j]] = [values[op.j], values[op.i]];
  }
  if (op.op === 'set' && op.i !== null && op.value !== null) {
    values[op.i] = op.value;
  }
}

export interface ArrayState {
  values: (number | string)[];
  /** Pointer name → index, for the pointers on show. */
  pointers: Record<string, number>;
  /** Index → label, such as "sorted". */
  marks: Record<number, string>;
  /** The part still in play. */
  range: [number, number] | null;
  found: number[];
  notFound: boolean;
  /** This step only: the pair compared, the pair swapped, cells set. */
  compared: [number, number] | null;
  swapped: [number, number] | null;
  changed: number[];
}

export function arrayStateAt(
  block: BlockOf<'array'>,
  n: number,
  steps = simulateArray(block),
): ArrayState {
  const state: ArrayState = {
    values: [...block.values],
    pointers: {},
    marks: {},
    range: null,
    found: [],
    notFound: false,
    compared: null,
    swapped: null,
    changed: [],
  };
  upTo(steps, n, (op, current) => {
    const i = op.i ?? -1;
    const j = op.j ?? -1;
    switch (op.op) {
      case 'compare':
        if (current) state.compared = [i, j];
        break;
      case 'swap':
        applyArrayOp(state.values, op);
        if (current) state.swapped = [i, j];
        break;
      case 'set':
        applyArrayOp(state.values, op);
        if (current) state.changed.push(i);
        break;
      case 'mark':
        state.marks[i] = op.name ?? '';
        break;
      case 'unmark':
        delete state.marks[i];
        break;
      case 'pointer':
        if (op.name === null) break;
        if (op.i === null) delete state.pointers[op.name];
        else state.pointers[op.name] = op.i;
        break;
      case 'range':
        state.range = [i, j];
        break;
      case 'found':
        state.found.push(i);
        break;
      case 'not-found':
        state.notFound = true;
        break;
    }
  });
  return state;
}

// --- stack and queue -----------------------------------------------------------

export interface StackQueueState {
  /** Bottom (stack) or front (queue) first. */
  items: string[];
  /** This step only: what was added, removed or peeked at, and where. */
  last: {
    op: OpOf<'stack-queue'>['op'];
    value: string | null;
    end: 'front' | 'back';
  } | null;
}

/**
 * What one stack or queue op does: the items change, and it reports the
 * value it added, removed or read, and at which end. Shared with the
 * validator, like applyArrayOp.
 */
export function applyStackQueueOp(
  items: string[],
  op: OpOf<'stack-queue'>,
  mode: BlockOf<'stack-queue'>['mode'],
): { value: string | null; end: 'front' | 'back' } {
  switch (op.op) {
    case 'push':
    case 'enqueue':
      items.push(op.value ?? '');
      return { value: op.value, end: 'back' };
    case 'push-front':
      items.unshift(op.value ?? '');
      return { value: op.value, end: 'front' };
    case 'pop':
    case 'pop-back':
      return { value: items.pop() ?? null, end: 'back' };
    case 'dequeue':
      return { value: items.shift() ?? null, end: 'front' };
    case 'peek': {
      const end = mode === 'stack' ? 'back' : 'front';
      return {
        value: (end === 'back' ? items.at(-1) : items[0]) ?? null,
        end,
      };
    }
  }
}

export function stackQueueStateAt(
  block: BlockOf<'stack-queue'>,
  n: number,
): StackQueueState {
  const state: StackQueueState = { items: [...block.initial], last: null };
  upTo(block.steps, n, (op, current) => {
    const { value, end } = applyStackQueueOp(state.items, op, block.mode);
    if (current) state.last = { op: op.op, value, end };
  });
  return state;
}

// --- flow ---------------------------------------------------------------------

export type FlowNodeStatus = 'idle' | 'active' | 'stored' | 'failed';

export interface FlowPacket {
  edge: string;
  /** forward: from the edge's `from` to its `to`; back: the reverse. */
  direction: 'forward' | 'back';
  label: string | null;
  payload: string | null;
}

export interface FlowState {
  /** This step only. */
  nodes: Record<string, FlowNodeStatus>;
  packets: FlowPacket[];
  highlighted: string[];
  failedEdges: string[];
  /** Every node and edge used so far, to show the path taken. */
  visitedNodes: string[];
  visitedEdges: string[];
}

export function flowStateAt(block: BlockOf<'flow'>, n: number): FlowState {
  const state: FlowState = {
    nodes: {},
    packets: [],
    highlighted: [],
    failedEdges: [],
    visitedNodes: [],
    visitedEdges: [],
  };
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>();
  const edges = new Map(block.edges.map((edge) => [edge.id, edge]));
  upTo(block.steps, n, (op, current) => {
    const edge = op.edge ? edges.get(op.edge) : undefined;
    if (edge) {
      visitedEdges.add(edge.id);
      visitedNodes.add(edge.from).add(edge.to);
    }
    if (op.node) visitedNodes.add(op.node);
    if (!current) return;
    switch (op.op) {
      case 'send':
      case 'respond':
        if (op.edge) {
          state.packets.push({
            edge: op.edge,
            direction: op.op === 'send' ? 'forward' : 'back',
            label: op.packet,
            payload: op.payload,
          });
        }
        break;
      case 'process':
        if (op.node) state.nodes[op.node] = 'active';
        break;
      case 'store':
        if (op.node) state.nodes[op.node] = 'stored';
        break;
      case 'fail':
        if (op.node) state.nodes[op.node] = 'failed';
        if (op.edge) state.failedEdges.push(op.edge);
        break;
      case 'highlight':
        for (const id of [op.node, op.edge]) {
          if (id) state.highlighted.push(id);
        }
        break;
    }
  });
  state.visitedNodes = [...visitedNodes];
  state.visitedEdges = [...visitedEdges];
  return state;
}

// --- sequence -------------------------------------------------------------------

export interface SequenceState {
  /** Message ids on show, in the order they appeared. */
  shown: string[];
  /** This step only. */
  highlighted: string[];
  notes: { actor: string; text: string }[];
}

export function sequenceStateAt(
  block: BlockOf<'sequence'>,
  n: number,
): SequenceState {
  const state: SequenceState = { shown: [], highlighted: [], notes: [] };
  upTo(block.steps, n, (op, current) => {
    if (op.op === 'show' && op.message && !state.shown.includes(op.message)) {
      state.shown.push(op.message);
    }
    if (!current) return;
    if (op.op === 'show' && op.message) state.highlighted.push(op.message);
    if (op.op === 'highlight') {
      for (const id of [op.message, op.actor]) {
        if (id) state.highlighted.push(id);
      }
    }
    if (op.op === 'note' && op.actor && op.text) {
      state.notes.push({ actor: op.actor, text: op.text });
    }
  });
  return state;
}

// --- code walkthrough ---------------------------------------------------------------

export interface WalkthroughState {
  /** The lines in focus, from 1; null before the first `lines`. */
  lines: [number, number] | null;
  /** This step only. */
  notes: { line: number; text: string }[];
}

export function walkthroughStateAt(
  block: BlockOf<'code-walkthrough'>,
  n: number,
): WalkthroughState {
  const state: WalkthroughState = { lines: null, notes: [] };
  upTo(block.steps, n, (op, current) => {
    if (op.op === 'lines' && op.from !== null) {
      state.lines = [op.from, op.to ?? op.from];
    }
    if (current && op.op === 'note' && op.from !== null && op.text) {
      state.notes.push({ line: op.from, text: op.text });
    }
  });
  return state;
}
