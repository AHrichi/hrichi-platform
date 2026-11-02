import type { BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';
import type { OpOf } from './contracts';
import { StepList, upTo } from './steps';

type TreeBlock = BlockOf<'tree'>;
type TreeOp = OpOf<'tree'>;

export interface TreeNodeState {
  id: string;
  label: string;
  parent: string | null;
  side: 'left' | 'right' | null;
}

export interface TreeState {
  nodes: TreeNodeState[];
  /** Every node visited so far, and what the traversal has output. */
  visited: string[];
  output: string[];
  /** This step only. */
  active: string[];
  compared: { node: string; value: string } | null;
  swapped: [string, string] | null;
}

const BINARY = new Set(['bst', 'binary', 'min-heap', 'max-heap']);

function op(fields: Partial<TreeOp> & Pick<TreeOp, 'op'>): TreeOp {
  return { node: null, other: null, value: null, ...fields };
}

/**
 * What one tree op does to the nodes. An inserted node goes on the side
 * its value belongs (a BST), or the first free side.
 */
export function applyTreeOp(
  nodes: TreeNodeState[],
  o: TreeOp,
  variant: TreeBlock['variant'],
): void {
  switch (o.op) {
    case 'insert': {
      if (!o.node) return;
      const parent = nodes.find((n) => n.id === o.other) ?? null;
      let side: TreeNodeState['side'] = null;
      if (parent && BINARY.has(variant)) {
        const taken = new Set(
          nodes.filter((n) => n.parent === parent.id).map((n) => n.side),
        );
        side =
          variant === 'bst'
            ? Number(o.value) < Number(parent.label)
              ? 'left'
              : 'right'
            : taken.has('left')
              ? 'right'
              : 'left';
      }
      nodes.push({
        id: o.node,
        label: o.value ?? '',
        parent: parent?.id ?? null,
        side,
      });
      return;
    }
    case 'remove': {
      const i = nodes.findIndex((n) => n.id === o.node);
      if (i >= 0) nodes.splice(i, 1);
      return;
    }
    case 'swap': {
      const a = nodes.find((n) => n.id === o.node);
      const b = nodes.find((n) => n.id === o.other);
      if (a && b) [a.label, b.label] = [b.label, a.label];
      return;
    }
    default:
      return;
  }
}

export function treeStateAt(
  block: TreeBlock,
  n: number,
  steps: readonly Step<TreeOp>[] = simulateTree(block),
): TreeState {
  const state: TreeState = {
    nodes: block.nodes.map((node) => ({ ...node })),
    visited: [],
    output: [],
    active: [],
    compared: null,
    swapped: null,
  };
  upTo(steps, n, (o, current) => {
    applyTreeOp(state.nodes, o, block.variant);
    if (o.op === 'visit' && o.node && !state.visited.includes(o.node)) {
      state.visited.push(o.node);
    }
    if (o.op === 'emit') state.output.push(o.value ?? '');
    if (!current) return;
    if (o.node && o.op !== 'remove') state.active.push(o.node);
    if (o.op === 'compare' && o.node) {
      state.compared = { node: o.node, value: o.value ?? '' };
    }
    if (o.op === 'swap' && o.node && o.other) {
      state.swapped = [o.node, o.other];
    }
  });
  return state;
}

/** Children in order: left then right, or in the order they were given. */
function childrenOf(nodes: TreeNodeState[], id: string): TreeNodeState[] {
  const kids = nodes.filter((n) => n.parent === id);
  return kids.sort((a, b) =>
    a.side === b.side ? 0 : a.side === 'left' || b.side === 'right' ? -1 : 1,
  );
}

const rootOf = (nodes: TreeNodeState[]) =>
  nodes.find((n) => n.parent === null) ?? null;

/** Level order, which is also array order for a heap. */
function levelOrder(nodes: TreeNodeState[]): TreeNodeState[] {
  const root = rootOf(nodes);
  const out: TreeNodeState[] = [];
  const queue = root ? [root] : [];
  while (queue.length) {
    const node = queue.shift() as TreeNodeState;
    out.push(node);
    queue.push(...childrenOf(nodes, node.id));
  }
  return out;
}

/** Steps for a tree block's `simulate`; its own steps otherwise. */
export function simulateTree(block: TreeBlock): Step<TreeOp>[] {
  const sim = block.simulate;
  if (!sim) return block.steps;
  const nodes = block.nodes.map((node) => ({ ...node }));
  const out = new StepList<TreeOp>();
  const apply = (ops: TreeOp[]) =>
    ops.forEach((o) => applyTreeOp(nodes, o, block.variant));
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? '';
  let fresh = 0;
  const newId = () => {
    let id: string;
    do id = `node-${++fresh}`;
    while (nodes.some((n) => n.id === id));
    return id;
  };

  switch (sim.algorithm) {
    case 'bst-insert':
    case 'bst-search': {
      for (const value of sim.values) {
        let at = rootOf(nodes);
        while (at) {
          const here = Number(at.label);
          if (sim.algorithm === 'bst-search' && here === value) {
            const ops = [
              op({ op: 'visit', node: at.id }),
              op({ op: 'highlight', node: at.id }),
            ];
            out.add(`Found ${value}`, `${here} is ${value}: found it.`, ops);
            return out.list;
          }
          const left = value < here;
          const next = childrenOf(nodes, at.id).find(
            (c) => c.side === (left ? 'left' : 'right'),
          );
          out.add(
            `Compare with ${here}`,
            `${value} is ${left ? 'smaller' : 'larger'} than ${here}, so go ${left ? 'left' : 'right'}.`,
            [
              op({ op: 'visit', node: at.id }),
              op({ op: 'compare', node: at.id, value: String(value) }),
            ],
          );
          if (!next) {
            if (sim.algorithm === 'bst-search') {
              out.add(
                'Not in the tree',
                `There is no ${left ? 'left' : 'right'} child: ${value} is not in the tree.`,
                [],
              );
              return out.list;
            }
            const ins = op({
              op: 'insert',
              node: newId(),
              other: at.id,
              value: String(value),
            });
            apply([ins]);
            out.add(
              `Insert ${value}`,
              `The ${left ? 'left' : 'right'} spot under ${here} is free: ${value} goes there.`,
              [ins],
            );
            break;
          }
          at = next;
        }
        if (!rootOf(nodes) || nodes.length === 0) {
          const ins = op({ op: 'insert', node: newId(), value: String(value) });
          apply([ins]);
          out.add(
            `Insert ${value}`,
            `The tree is empty, so ${value} becomes the root.`,
            [ins],
          );
        }
      }
      return out.list;
    }
    case 'inorder':
    case 'preorder':
    case 'postorder':
    case 'level-order': {
      const order: TreeNodeState[] = [];
      const walk = (node: TreeNodeState) => {
        const kids = childrenOf(nodes, node.id);
        const left = kids.find((k) => k.side !== 'right');
        const rest = kids.filter((k) => k !== left);
        if (sim.algorithm === 'preorder') order.push(node);
        if (left) walk(left);
        if (sim.algorithm === 'inorder') order.push(node);
        rest.forEach(walk);
        if (sim.algorithm === 'postorder') order.push(node);
      };
      const root = rootOf(nodes);
      if (sim.algorithm === 'level-order') order.push(...levelOrder(nodes));
      else if (root) walk(root);
      const why: Record<string, string> = {
        inorder: 'left subtree first, then the node, then the right',
        preorder: 'the node first, then its subtrees',
        postorder: 'both subtrees first, then the node',
        'level-order': 'one level at a time, left to right',
      };
      order.forEach((node, i) =>
        out.add(
          `Visit ${node.label}`,
          i === 0
            ? `${sim.algorithm} goes ${why[sim.algorithm]}. It starts at ${node.label}.`
            : `Output ${node.label}.`,
          [
            op({ op: 'visit', node: node.id }),
            op({ op: 'emit', node: node.id, value: node.label }),
          ],
        ),
      );
      return out.list;
    }
    case 'heap-push':
    case 'heap-pop': {
      const min = block.variant === 'min-heap';
      const before = (a: string, b: string) =>
        min ? Number(a) < Number(b) : Number(a) > Number(b);
      const word = min ? 'smaller' : 'larger';
      const siftUp = (id: string) => {
        let node = nodes.find((n) => n.id === id);
        while (node?.parent) {
          const parent = nodes.find(
            (n) => n.id === node?.parent,
          ) as TreeNodeState;
          if (!before(node.label, parent.label)) {
            out.add(
              'In place',
              `${node.label} is not ${word} than its parent ${parent.label}: the heap order holds.`,
              [op({ op: 'compare', node: parent.id, value: node.label })],
            );
            return;
          }
          const swap = op({ op: 'swap', node: node.id, other: parent.id });
          out.add(
            `Swap with ${parent.label}`,
            `${node.label} is ${word} than its parent ${parent.label}, so they swap.`,
            [op({ op: 'compare', node: parent.id, value: node.label }), swap],
          );
          apply([swap]);
          node = parent;
        }
      };
      const siftDown = (id: string) => {
        let node = nodes.find((n) => n.id === id);
        while (node) {
          const kids = childrenOf(nodes, node.id);
          if (!kids.length) return;
          const best = kids.reduce((a, b) =>
            before(b.label, a.label) ? b : a,
          );
          if (!before(best.label, node.label)) {
            out.add(
              'In place',
              `${node.label} is not ${min ? 'larger' : 'smaller'} than its children: the heap order holds.`,
              [op({ op: 'compare', node: best.id, value: node.label })],
            );
            return;
          }
          const swap = op({ op: 'swap', node: node.id, other: best.id });
          out.add(
            `Swap with ${best.label}`,
            `${best.label} is the ${min ? 'smaller' : 'larger'} child and beats ${node.label}, so they swap.`,
            [op({ op: 'compare', node: best.id, value: node.label }), swap],
          );
          apply([swap]);
          node = best;
        }
      };
      if (sim.algorithm === 'heap-push') {
        for (const value of sim.values) {
          const order = levelOrder(nodes);
          const parent =
            order.find((n) => childrenOf(nodes, n.id).length < 2) ?? null;
          const ins = op({
            op: 'insert',
            node: newId(),
            other: parent?.id ?? null,
            value: String(value),
          });
          apply([ins]);
          out.add(
            `Add ${value}`,
            parent
              ? `${value} goes in the next free spot, under ${parent.label}, keeping the tree complete.`
              : `${value} is the first value: it is the root.`,
            [ins],
          );
          siftUp(ins.node as string);
        }
        return out.list;
      }
      const order = levelOrder(nodes);
      const root = order[0];
      const last = order[order.length - 1];
      if (!root) return out.list;
      out.add(
        `Take ${root.label}`,
        `The root holds the ${min ? 'smallest' : 'largest'} value, ${root.label}.`,
        [op({ op: 'emit', node: root.id, value: root.label })],
      );
      if (root === last) {
        const rm = op({ op: 'remove', node: root.id });
        apply([rm]);
        out.add('Empty', 'It was the only node: the heap is empty.', [rm]);
        return out.list;
      }
      const swap = op({ op: 'swap', node: root.id, other: last.id });
      apply([swap]);
      const rm = op({ op: 'remove', node: last.id });
      out.add(
        'Move the last node up',
        `The last node's value, ${label(root.id)}, moves to the root and the last spot is removed.`,
        [swap, rm],
      );
      apply([rm]);
      siftDown(root.id);
      return out.list;
    }
  }
}

/**
 * Positions for a tree, in slots: leaves take consecutive columns, a parent
 * sits over its children, and a lone child of a binary node keeps its side.
 */
export function treeLayout(
  nodes: readonly TreeNodeState[],
  binary: boolean,
): { width: number; depth: number; at: Map<string, { x: number; y: number }> } {
  const at = new Map<string, { x: number; y: number }>();
  let column = 0;
  let depth = 0;
  const all = [...nodes];
  const place = (node: TreeNodeState, y: number): number => {
    depth = Math.max(depth, y);
    const kids = childrenOf(all, node.id);
    if (!kids.length) {
      const x = column++;
      at.set(node.id, { x, y });
      return x;
    }
    const xs: number[] = [];
    if (binary && kids.length === 1) {
      // A lone child stays to its side: a gap where its sibling would be.
      if (kids[0].side === 'right') column++;
      xs.push(place(kids[0], y + 1));
      if (kids[0].side !== 'right') column++;
    } else {
      for (const kid of kids) xs.push(place(kid, y + 1));
    }
    const x =
      binary && kids.length === 1
        ? kids[0].side === 'right'
          ? xs[0] - 0.5
          : xs[0] + 0.5
        : (xs[0] + xs[xs.length - 1]) / 2;
    at.set(node.id, { x, y });
    return x;
  };
  const root = rootOf(all);
  if (root) place(root, 0);
  return { width: Math.max(column, 1), depth: depth + 1, at };
}
