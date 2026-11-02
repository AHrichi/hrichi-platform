import * as v from 'valibot';
import { Caption, Id, LIMITS, list, Ref, text } from '../primitives';
import { stepsSchema } from '../step';

/** A value shown in a cell: numbers for algorithms, short strings for words. */
const Value = v.union([v.number(), v.pipe(v.string(), v.maxLength(16))]);
const Index = v.pipe(v.number(), v.integer(), v.minValue(0));

// --- array ---------------------------------------------------------------

export const ARRAY_ALGORITHMS = [
  'bubble-sort',
  'insertion-sort',
  'selection-sort',
  'merge-sort',
  'quick-sort',
  'binary-search',
  'linear-search',
  'two-pointers-pair-sum',
  'sliding-window-max-sum',
  'prefix-sum',
  'reverse',
] as const;

export const ARRAY_OPS = [
  'compare',
  'swap',
  'set',
  'mark',
  'unmark',
  'pointer',
  'range',
  'found',
  'not-found',
] as const;

export const ArrayOp = v.strictObject({
  op: v.picklist(ARRAY_OPS),
  i: v.nullable(Index),
  j: v.nullable(Index),
  value: v.nullable(Value),
  name: v.nullable(text(16, 'A pointer name or a mark label.')),
});

export const ArrayBlock = v.strictObject({
  id: Id,
  kind: v.literal('array'),
  title: Caption,
  values: list(
    Value,
    1,
    LIMITS.arrayLength,
    'The array, all numbers or all strings.',
  ),
  pointers: v.pipe(
    v.array(text(12, 'A pointer name such as "lo", "hi", "mid", "i" or "j".')),
    v.maxLength(LIMITS.pointers),
    v.description(
      `The pointer names the steps use, at most ${LIMITS.pointers}.`,
    ),
  ),
  simulate: v.nullable(
    v.strictObject({
      algorithm: v.picklist(ARRAY_ALGORITHMS),
      target: v.nullable(
        v.pipe(
          v.number(),
          v.description(
            'The value searched for, or the pair sum. Null if unused.',
          ),
        ),
      ),
      window: v.nullable(
        v.pipe(
          v.number(),
          v.integer(),
          v.minValue(1),
          v.description(
            'The window size for a sliding window. Null if unused.',
          ),
        ),
      ),
    }),
  ),
  steps: stepsSchema(
    ArrayOp,
    'compare (i, j); swap (i, j); set (i, value); mark (i, name: label); unmark (i); pointer (name, i, or i null to hide it); range (i to j, the active part); found (i); not-found. Unused fields are null.',
  ),
});

// --- stack and queue -------------------------------------------------------

export const SQ_MODES = ['stack', 'queue', 'deque'] as const;
export const SQ_OPS = [
  'push',
  'pop',
  'enqueue',
  'dequeue',
  'peek',
  'push-front',
  'pop-back',
] as const;

export const StackQueueOp = v.strictObject({
  op: v.picklist(SQ_OPS),
  value: v.nullable(text(24, 'The value pushed or enqueued; null otherwise.')),
});

export const StackQueueBlock = v.strictObject({
  id: Id,
  kind: v.literal('stack-queue'),
  title: Caption,
  mode: v.pipe(
    v.picklist(SQ_MODES),
    v.description(
      'stack: push, pop, peek at the top (the end). queue: enqueue at the back, dequeue and peek at the front. deque: enqueue, dequeue, push-front, pop-back, peek.',
    ),
  ),
  initial: v.pipe(
    v.array(text(24, 'A value.')),
    v.maxLength(LIMITS.stackDepth),
    v.description('The starting contents, bottom or front first.'),
  ),
  steps: stepsSchema(
    StackQueueOp,
    'One operation; value only for adding ones.',
  ),
});

// --- hash table -------------------------------------------------------------

export const HASH_FUNCTIONS = ['mod', 'char-sum-mod', 'given'] as const;
export const HASH_OPS = ['insert', 'lookup', 'delete', 'resize'] as const;

export const HashOp = v.strictObject({
  op: v.picklist(HASH_OPS),
  key: v.nullable(text(24, 'The key; null for resize.')),
  value: v.nullable(text(24, 'The value stored by insert; null otherwise.')),
  bucket: v.nullable(
    v.pipe(
      Index,
      v.description(
        'The bucket the key hashes to. Required with "given"; with "mod" or "char-sum-mod", null or the computed bucket.',
      ),
    ),
  ),
  size: v.nullable(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(2),
      v.maxValue(24),
      v.description('The new bucket count, for resize; null otherwise.'),
    ),
  ),
});

export const HashTableBlock = v.strictObject({
  id: Id,
  kind: v.literal('hash-table'),
  title: Caption,
  buckets: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(2),
    v.maxValue(LIMITS.buckets),
    v.description('The starting number of buckets.'),
  ),
  hash: v.pipe(
    v.picklist(HASH_FUNCTIONS),
    v.description(
      "mod: integer keys, key % buckets. char-sum-mod: the sum of the key's character codes % buckets, so anagrams collide. given: you supply each bucket.",
    ),
  ),
  steps: stepsSchema(HashOp, 'One operation on the table.'),
});

// --- tree -------------------------------------------------------------------

export const TREE_VARIANTS = [
  'bst',
  'binary',
  'min-heap',
  'max-heap',
  'general',
] as const;
export const TREE_ALGORITHMS = [
  'bst-insert',
  'bst-search',
  'inorder',
  'preorder',
  'postorder',
  'level-order',
  'heap-push',
  'heap-pop',
] as const;
export const TREE_OPS = [
  'visit',
  'compare',
  'insert',
  'remove',
  'swap',
  'highlight',
  'emit',
] as const;

export const TreeNode = v.strictObject({
  id: Id,
  label: text(16, 'What the node shows; a number for bst and heaps.'),
  parent: v.nullable(
    v.pipe(Ref, v.description('The parent node id; null for the root.')),
  ),
  side: v.nullable(
    v.pipe(
      v.picklist(['left', 'right']),
      v.description(
        'For binary trees, heaps and bst: which child it is. Null for the root and general trees.',
      ),
    ),
  ),
});

export const TreeOp = v.strictObject({
  op: v.picklist(TREE_OPS),
  node: v.nullable(Ref),
  other: v.nullable(
    v.pipe(
      Ref,
      v.description('Second node for compare or swap; the parent for insert.'),
    ),
  ),
  value: v.nullable(
    text(
      24,
      'The label of an inserted node, the value compared, or the value emitted.',
    ),
  ),
});

export const TreeBlock = v.strictObject({
  id: Id,
  kind: v.literal('tree'),
  title: Caption,
  variant: v.picklist(TREE_VARIANTS),
  nodes: v.pipe(
    v.array(TreeNode),
    v.maxLength(LIMITS.treeNodes),
    v.description(
      `The tree as a flat list, parents before children, at most ${LIMITS.treeNodes} nodes.`,
    ),
  ),
  simulate: v.nullable(
    v.strictObject({
      algorithm: v.picklist(TREE_ALGORITHMS),
      values: v.pipe(
        v.array(v.number()),
        v.maxLength(8),
        v.description(
          'Values to insert or push, or the one value to search for. Empty for traversals.',
        ),
      ),
    }),
  ),
  steps: stepsSchema(
    TreeOp,
    'visit (node); compare (node, value); insert (node: the new id, other: its parent, value: its label); remove (node); swap (node, other); highlight (node); emit (node, value: appended to the output).',
  ),
});

// --- graph ------------------------------------------------------------------

export const GRAPH_ALGORITHMS = [
  'bfs',
  'dfs',
  'dijkstra',
  'topological-sort',
] as const;
export const GRAPH_OPS = [
  'visit',
  'enqueue',
  'dequeue',
  'push',
  'pop',
  'relax',
  'mark-edge',
  'set-distance',
  'emit',
] as const;

export const GraphOp = v.strictObject({
  op: v.picklist(GRAPH_OPS),
  node: v.nullable(Ref),
  edge: v.nullable(Ref),
  value: v.nullable(text(24, 'A distance, or a value appended to the output.')),
});

export const GraphBlock = v.strictObject({
  id: Id,
  kind: v.literal('graph'),
  title: Caption,
  directed: v.boolean(),
  weighted: v.boolean(),
  nodes: list(
    v.strictObject({ id: Id, label: text(16, 'What the node shows.') }),
    1,
    LIMITS.graphNodes,
    'The nodes.',
  ),
  edges: v.pipe(
    v.array(
      v.strictObject({
        id: Id,
        from: Ref,
        to: Ref,
        weight: v.nullable(
          v.pipe(
            v.number(),
            v.description('The weight if weighted, otherwise null.'),
          ),
        ),
      }),
    ),
    v.maxLength(LIMITS.graphEdges),
    v.description(`The edges, at most ${LIMITS.graphEdges}.`),
  ),
  simulate: v.nullable(
    v.strictObject({
      algorithm: v.picklist(GRAPH_ALGORITHMS),
      start: v.nullable(
        v.pipe(
          Ref,
          v.description('The start node; null for topological sort.'),
        ),
      ),
    }),
  ),
  steps: stepsSchema(
    GraphOp,
    'visit, enqueue, dequeue, push, pop (node); relax or mark-edge (edge); set-distance (node, value); emit (node or value).',
  ),
});

// --- grid -------------------------------------------------------------------

export const GRID_ALGORITHMS = [
  'grid-bfs',
  'flood-fill',
  'a-star',
  'unique-paths',
  'min-path-sum',
  'lcs',
] as const;
export const GRID_OPS = [
  'visit',
  'frontier',
  'set',
  'path',
  'compare',
  'wall',
] as const;

export const GridOp = v.strictObject({
  op: v.picklist(GRID_OPS),
  row: v.nullable(Index),
  col: v.nullable(Index),
  value: v.nullable(text(8, 'A value written into the cell by set.')),
});

export const GridBlock = v.strictObject({
  id: Id,
  kind: v.literal('grid'),
  title: Caption,
  rows: v.pipe(
    v.array(
      v.pipe(
        v.string(),
        v.maxLength(LIMITS.gridSize),
        v.description(
          'One row, one character per cell: "." open, "#" wall, "S" start, "G" goal, or a digit.',
        ),
      ),
    ),
    v.maxLength(LIMITS.gridSize),
    v.description(
      `The grid, top row first, at most ${LIMITS.gridSize} rows of equal length. Empty only for lcs.`,
    ),
  ),
  simulate: v.nullable(
    v.strictObject({
      algorithm: v.picklist(GRID_ALGORITHMS),
      a: v.nullable(text(8, 'For lcs: the first string.')),
      b: v.nullable(text(8, 'For lcs: the second string.')),
    }),
  ),
  steps: stepsSchema(
    GridOp,
    'visit, frontier, path, compare, wall (row, col); set (row, col, value). Rows and columns count from 0.',
  ),
});

// --- recursion tree ---------------------------------------------------------

export const RECURSION_ALGORITHMS = [
  'fibonacci',
  'factorial',
  'power',
  'subsets',
] as const;
export const CALL_OPS = ['call', 'return', 'memo-hit'] as const;

export const CallOp = v.strictObject({
  op: v.picklist(CALL_OPS),
  call: v.nullable(Ref),
  value: v.nullable(text(24, 'The value returned, for return and memo-hit.')),
});

export const RecursionTreeBlock = v.strictObject({
  id: Id,
  kind: v.literal('recursion-tree'),
  title: Caption,
  fn: text(24, 'The function, such as "fib(n)".'),
  simulate: v.nullable(
    v.strictObject({
      algorithm: v.picklist(RECURSION_ALGORITHMS),
      n: v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(8),
        v.description(
          'The argument: fibonacci up to 6, factorial and power up to 8, subsets up to 3.',
        ),
      ),
      memo: v.pipe(v.boolean(), v.description('Whether results are cached.')),
    }),
  ),
  calls: v.pipe(
    v.array(
      v.strictObject({
        id: Id,
        label: text(24, 'The call, such as "fib(3)".'),
        parent: v.nullable(
          v.pipe(Ref, v.description('The calling call; null for the first.')),
        ),
      }),
    ),
    v.maxLength(LIMITS.recursionCalls),
    v.description(
      `For scripted trees: every call, at most ${LIMITS.recursionCalls}. Empty with simulate.`,
    ),
  ),
  steps: stepsSchema(
    CallOp,
    'call (call): the call starts, as a child of the innermost open call; return (call, value): the innermost open call returns; memo-hit (call, value): the call is answered from the cache.',
  ),
});
