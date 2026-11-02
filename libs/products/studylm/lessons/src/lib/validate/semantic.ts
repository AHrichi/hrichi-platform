import type { Block, BlockKind, BlockOf } from '../spec/blocks';
import { LIMITS } from '../spec/primitives';
import type { Step } from '../spec/step';
import { type IssueList, pointer } from './issues';
import { bucketOf } from '../engines/hash';
import { LINKS } from '../engines/markdown';
import { applyArrayOp, applyStackQueueOp } from '../engines/replay';

/**
 * Rules a schema can't express: references resolve, operations are legal
 * when replayed in order, algorithms get inputs they can run on. Each
 * message says what to change, since it may go back to the model.
 */
type Check<K extends BlockKind> = (
  block: BlockOf<K>,
  at: string,
  out: IssueList,
) => void;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const list = (ids: Iterable<string>) => [...ids].slice(0, 16).join(', ');

/** Registers each item's id, reporting repeats. */
function ids(
  items: readonly { id: string }[],
  at: string,
  field: string,
  out: IssueList,
  seen = new Set<string>(),
): Set<string> {
  items.forEach((item, i) => {
    if (seen.has(item.id)) {
      out.error(
        pointer(at, field, i, 'id'),
        'duplicate-id',
        `The id "${item.id}" is used twice in this block; give it a new one.`,
      );
    }
    seen.add(item.id);
  });
  return seen;
}

/** True when `id` names something in `known`; reports it otherwise. */
function ref(
  id: string | null,
  known: ReadonlySet<string>,
  path: string,
  what: string,
  out: IssueList,
): boolean {
  if (id === null) return false;
  if (known.has(id)) return true;
  out.error(
    path,
    'unknown-ref',
    known.size
      ? `No ${what} has the id "${id}". Use one of: ${list(known)}.`
      : `This block declares no ids to refer to; leave it empty.`,
  );
  return false;
}

/** Reports a field an op needs but left null. */
function need(
  value: unknown,
  path: string,
  field: string,
  op: string,
  out: IssueList,
): boolean {
  if (value !== null && value !== undefined) return true;
  out.error(
    pointer(path, field),
    'missing-field',
    `The ${op} op needs "${field}".`,
  );
  return false;
}

function inRange(
  index: number | null,
  length: number,
  path: string,
  what: string,
  out: IssueList,
): boolean {
  if (index === null) return false;
  if (index < length) return true;
  out.error(
    path,
    'out-of-range',
    `${what} ${index} is outside 0–${length - 1}.`,
  );
  return false;
}

/** Narration length, unique step ids and `focus` references. */
function steps<TOp>(
  list: readonly Step<TOp>[],
  at: string,
  known: ReadonlySet<string>,
  out: IssueList,
  each: (op: TOp, path: string) => void,
): void {
  const seen = new Set<string>();
  list.forEach((step, i) => {
    const path = pointer(at, 'steps', i);
    if (seen.has(step.id)) {
      out.error(
        pointer(path, 'id'),
        'duplicate-id',
        `The step id "${step.id}" is used twice in this block.`,
      );
    }
    seen.add(step.id);
    const count = words(step.narration);
    if (count > LIMITS.narrationWords) {
      out.error(
        pointer(path, 'narration'),
        'too-long',
        `Keep the narration to ${LIMITS.narrationWords} words; it has ${count}.`,
      );
    }
    step.focus.forEach((id, f) =>
      ref(id, known, pointer(path, 'focus', f), 'element', out),
    );
    step.ops.forEach((op, o) => each(op, pointer(path, 'ops', o)));
  });
}

function atLeastOneStep(
  list: readonly unknown[],
  at: string,
  out: IssueList,
): void {
  if (list.length === 0) {
    out.error(
      pointer(at, 'steps'),
      'too-few',
      'Give at least one step: this visual plays as a sequence of steps.',
    );
  }
}

/** Visuals take either `simulate` (the app computes the steps) or steps. */
function simulateOrSteps(
  simulate: unknown,
  count: number,
  at: string,
  out: IssueList,
): void {
  if (simulate !== null && count > 0) {
    out.error(
      pointer(at, 'steps'),
      'mode-conflict',
      'Give either "simulate" or "steps", not both: with simulate, leave steps empty.',
    );
  } else if (simulate === null && count === 0) {
    out.error(
      pointer(at, 'steps'),
      'too-few',
      'Give steps, or set "simulate" with a supported algorithm.',
    );
  }
}

function codeShape(code: string, path: string, out: IssueList): number {
  const lines = code.split('\n');
  if (lines.length > LIMITS.codeLines) {
    out.error(
      path,
      'too-long',
      `Keep the code to ${LIMITS.codeLines} lines; it has ${lines.length}.`,
    );
  }
  lines.forEach((line, i) => {
    if (line.length > LIMITS.codeLineChars) {
      out.error(
        path,
        'too-long',
        `Line ${i + 1} has ${line.length} characters; keep lines to ${LIMITS.codeLineChars}.`,
      );
    }
    if (line.includes('\t')) {
      out.error(
        path,
        'bad-format',
        `Line ${i + 1} has a tab; indent with spaces.`,
      );
    }
  });
  return lines.length;
}

const isSortedNumbers = (values: readonly (number | string)[]) =>
  values.every(
    (value, i) =>
      typeof value === 'number' &&
      (i === 0 || (values[i - 1] as number) <= value),
  );

// --- text -------------------------------------------------------------------

const prose: Check<'prose'> = (block, at, out) => {
  const path = pointer(at, 'markdown');
  if (/<\/?[a-z!][^>]*>/i.test(block.markdown)) {
    out.error(path, 'markup', 'Remove the HTML: use the Markdown subset only.');
  }
  if (/^#{1,6}\s/m.test(block.markdown)) {
    out.error(
      path,
      'markup',
      'Remove the heading: sections already have titles.',
    );
  }
  if (/!\[/.test(block.markdown)) {
    out.error(
      path,
      'markup',
      'Remove the image: describe it, or use a visual block.',
    );
  }
  // Links as the renderer reads them; a code span can't hold one.
  const targets = [
    ...block.markdown.replace(/`[^`]*`/g, '').matchAll(LINKS),
  ].map((match) => match[2]);
  if (targets.some((target) => !target.startsWith('https://'))) {
    out.error(path, 'bad-format', 'Links must start with https://.');
  }
};

const compare: Check<'compare'> = (block, at, out) => {
  block.rows.forEach((row, i) => {
    if (row.cells.length !== block.columns.length) {
      out.error(
        pointer(at, 'rows', i, 'cells'),
        'shape',
        `Row "${row.label}" has ${row.cells.length} cells; give one per column (${block.columns.length}).`,
      );
    }
  });
};

// --- code -------------------------------------------------------------------

const codeWalkthrough: Check<'code-walkthrough'> = (block, at, out) => {
  const lines = codeShape(block.code, pointer(at, 'code'), out);
  atLeastOneStep(block.steps, at, out);
  steps(block.steps, at, new Set(), out, (op, path) => {
    if (!need(op.from, path, 'from', op.op, out)) return;
    if ((op.from ?? 0) > lines) {
      out.error(
        pointer(path, 'from'),
        'out-of-range',
        `Line ${op.from} doesn't exist; the code has ${lines} lines.`,
      );
    }
    if (op.op === 'lines' && need(op.to, path, 'to', 'lines', out)) {
      if ((op.to ?? 0) < (op.from ?? 0) || (op.to ?? 0) > lines) {
        out.error(
          pointer(path, 'to'),
          'out-of-range',
          `"to" must be from ${op.from} to ${lines}.`,
        );
      }
    }
    if (op.op === 'note') need(op.text, path, 'text', 'note', out);
  });
};

const codeTrace: Check<'code-trace'> = (block, at, out) => {
  const lines = codeShape(block.code, pointer(at, 'code'), out);
  if (block.mode === 'execute') {
    if (block.language !== 'javascript') {
      out.error(
        pointer(at, 'mode'),
        'precondition',
        'Only JavaScript can be executed; use "scripted" and write the frames.',
      );
    }
    if (block.frames.length > 0) {
      out.error(
        pointer(at, 'frames'),
        'mode-conflict',
        'With "execute" the app records the frames: leave frames empty.',
      );
    }
    return;
  }
  if (block.frames.length === 0) {
    out.error(
      pointer(at, 'frames'),
      'too-few',
      'A scripted trace needs frames.',
    );
  }
  const seen = new Set<string>();
  block.frames.forEach((frame, i) => {
    const path = pointer(at, 'frames', i);
    if (seen.has(frame.id)) {
      out.error(
        pointer(path, 'id'),
        'duplicate-id',
        `The frame id "${frame.id}" is used twice.`,
      );
    }
    seen.add(frame.id);
    if (frame.line > lines) {
      out.error(
        pointer(path, 'line'),
        'out-of-range',
        `Line ${frame.line} doesn't exist; the code has ${lines} lines.`,
      );
    }
    const count = words(frame.narration);
    if (count > LIMITS.narrationWords) {
      out.error(
        pointer(path, 'narration'),
        'too-long',
        `Keep the narration to ${LIMITS.narrationWords} words; it has ${count}.`,
      );
    }
  });
};

// --- data structures and algorithms -------------------------------------------

const array: Check<'array'> = (block, at, out) => {
  const numeric = block.values.every((value) => typeof value === 'number');
  if (!numeric && !block.values.every((value) => typeof value === 'string')) {
    out.error(
      pointer(at, 'values'),
      'wrong-type',
      'Use all numbers or all strings, not a mix.',
    );
  }
  simulateOrSteps(block.simulate, block.steps.length, at, out);
  const sim = block.simulate;
  if (sim) {
    const path = pointer(at, 'simulate');
    const needs = (ok: boolean, message: string) => {
      if (!ok) out.error(path, 'precondition', message);
    };
    switch (sim.algorithm) {
      case 'binary-search':
      case 'two-pointers-pair-sum':
        needs(
          isSortedNumbers(block.values),
          `${sim.algorithm} needs numbers sorted in ascending order.`,
        );
        needs(sim.target !== null, `${sim.algorithm} needs a "target".`);
        break;
      case 'linear-search':
        needs(sim.target !== null, 'linear-search needs a "target".');
        break;
      case 'sliding-window-max-sum':
        needs(numeric, 'sliding-window-max-sum needs numbers.');
        needs(
          sim.window !== null && sim.window <= block.values.length,
          `sliding-window-max-sum needs a "window" from 1 to ${block.values.length}.`,
        );
        break;
      case 'prefix-sum':
        needs(numeric, 'prefix-sum needs numbers.');
        break;
      default:
        break;
    }
  }
  const values = [...block.values];
  const pointers = new Set(block.pointers);
  steps(block.steps, at, new Set(), out, (op, path) => {
    const n = values.length;
    const index = (field: 'i' | 'j') =>
      need(op[field], path, field, op.op, out) &&
      inRange(op[field], n, pointer(path, field), 'Index', out);
    switch (op.op) {
      case 'compare':
        index('i');
        index('j');
        break;
      case 'swap':
        if (index('i') && index('j')) applyArrayOp(values, op);
        break;
      case 'set':
        if (index('i') && need(op.value, path, 'value', 'set', out)) {
          applyArrayOp(values, op);
        }
        break;
      case 'mark':
      case 'unmark':
      case 'found':
        index('i');
        break;
      case 'pointer':
        if (need(op.name, path, 'name', 'pointer', out)) {
          ref(
            op.name,
            pointers,
            pointer(path, 'name'),
            'declared pointer',
            out,
          );
        }
        inRange(op.i, n, pointer(path, 'i'), 'Index', out);
        break;
      case 'range':
        if (index('i') && index('j') && (op.i as number) > (op.j as number)) {
          out.error(pointer(path, 'j'), 'out-of-range', 'A range needs i ≤ j.');
        }
        break;
      case 'not-found':
        break;
    }
  });
};

const SQ_ALLOWED: Record<BlockOf<'stack-queue'>['mode'], readonly string[]> = {
  stack: ['push', 'pop', 'peek'],
  queue: ['enqueue', 'dequeue', 'peek'],
  deque: ['enqueue', 'dequeue', 'push-front', 'pop-back', 'peek'],
};

const stackQueue: Check<'stack-queue'> = (block, at, out) => {
  atLeastOneStep(block.steps, at, out);
  const items = [...block.initial];
  steps(block.steps, at, new Set(), out, (op, path) => {
    if (!SQ_ALLOWED[block.mode].includes(op.op)) {
      out.error(
        pointer(path, 'op'),
        'illegal-op',
        `A ${block.mode} uses ${SQ_ALLOWED[block.mode].join(', ')}; not ${op.op}.`,
      );
      return;
    }
    const adds = ['push', 'enqueue', 'push-front'].includes(op.op);
    if (adds) {
      if (!need(op.value, path, 'value', op.op, out)) return;
      if (items.length >= LIMITS.stackDepth) {
        out.error(path, 'too-many', `Keep at most ${LIMITS.stackDepth} items.`);
        return;
      }
      applyStackQueueOp(items, op, block.mode);
      return;
    }
    if (items.length === 0) {
      out.error(
        pointer(path, 'op'),
        'illegal-op',
        `${op.op} on an empty ${block.mode}.`,
      );
      return;
    }
    applyStackQueueOp(items, op, block.mode);
  });
};

export { bucketOf };

const hashTable: Check<'hash-table'> = (block, at, out) => {
  atLeastOneStep(block.steps, at, out);
  let buckets = block.buckets;
  const keys = new Set<string>();
  steps(block.steps, at, new Set(), out, (op, path) => {
    if (op.op === 'resize') {
      if (block.hash === 'given') {
        out.error(
          path,
          'precondition',
          'resize needs "mod" or "char-sum-mod", so the app can rehash.',
        );
      }
      if (need(op.size, path, 'size', 'resize', out))
        buckets = op.size as number;
      return;
    }
    if (!need(op.key, path, 'key', op.op, out)) return;
    const key = op.key as string;
    if (block.hash === 'given') {
      if (need(op.bucket, path, 'bucket', `${op.op} with a given hash`, out)) {
        inRange(op.bucket, buckets, pointer(path, 'bucket'), 'Bucket', out);
      }
    } else {
      const computed = bucketOf(key, block.hash, buckets);
      if (computed === null) {
        out.error(
          pointer(path, 'key'),
          'wrong-type',
          `"mod" needs whole-number keys; got "${key}".`,
        );
      } else if (op.bucket !== null && op.bucket !== computed) {
        out.error(
          pointer(path, 'bucket'),
          'illegal-op',
          `"${key}" hashes to bucket ${computed} with ${block.hash} over ${buckets} buckets, not ${op.bucket}.`,
        );
      }
    }
    if (op.op === 'insert') keys.add(key);
    if (op.op === 'delete') {
      if (!keys.has(key)) {
        out.error(
          pointer(path, 'key'),
          'illegal-op',
          `"${key}" isn't in the table, so it can't be deleted.`,
        );
      }
      keys.delete(key);
    }
  });
};

const BINARY_VARIANTS = ['bst', 'binary', 'min-heap', 'max-heap'];

const tree: Check<'tree'> = (block, at, out) => {
  const known = new Set<string>();
  const children = new Map<string, Set<string>>();
  const label = new Map<string, number>();
  let roots = 0;
  const binary = BINARY_VARIANTS.includes(block.variant);
  block.nodes.forEach((node, i) => {
    const path = pointer(at, 'nodes', i);
    if (known.has(node.id)) {
      out.error(
        pointer(path, 'id'),
        'duplicate-id',
        `The id "${node.id}" is used twice in this block.`,
      );
    }
    if (node.parent === null) {
      roots++;
    } else if (!known.has(node.parent)) {
      out.error(
        pointer(path, 'parent'),
        'unknown-ref',
        `"${node.parent}" isn't declared before "${node.id}"; list parents before their children.`,
      );
    } else if (binary) {
      const siblings = children.get(node.parent) ?? new Set<string>();
      if (node.side === null) {
        out.error(
          pointer(path, 'side'),
          'missing-field',
          `A ${block.variant} child needs a side: left or right.`,
        );
      } else if (siblings.has(node.side)) {
        out.error(
          pointer(path, 'side'),
          'shape',
          `"${node.parent}" already has a ${node.side} child.`,
        );
      } else {
        siblings.add(node.side);
      }
      children.set(node.parent, siblings);
    }
    known.add(node.id);
    const n = Number(node.label);
    if (Number.isFinite(n)) label.set(node.id, n);
  });
  if (block.nodes.length > 0 && roots !== 1) {
    out.error(
      pointer(at, 'nodes'),
      'shape',
      `A tree has exactly one root (parent null); this one has ${roots}.`,
    );
  }
  const ordered = block.variant === 'bst' || block.variant.endsWith('heap');
  if (ordered && block.nodes.some((node) => !label.has(node.id))) {
    out.error(
      pointer(at, 'nodes'),
      'wrong-type',
      `A ${block.variant} needs numeric labels.`,
    );
  } else if (block.variant === 'bst') {
    // Every node lies between the bounds its ancestors set.
    // Each node's own interval: its parent's, cut at the parent's value.
    const bounds = new Map<string, [number, number]>();
    block.nodes.forEach((node, i) => {
      const value = label.get(node.id) as number;
      let interval: [number, number] = [-Infinity, Infinity];
      if (node.parent !== null) {
        const [low, high] = bounds.get(node.parent) ?? [-Infinity, Infinity];
        const parentValue = label.get(node.parent) as number;
        interval =
          node.side === 'left' ? [low, parentValue] : [parentValue, high];
      }
      if (value <= interval[0] || value >= interval[1]) {
        out.error(
          pointer(at, 'nodes', i, 'label'),
          'shape',
          `${value} breaks the BST order: it must be between ${interval[0]} and ${interval[1]}.`,
        );
      }
      bounds.set(node.id, interval);
    });
  } else if (block.variant.endsWith('heap')) {
    const min = block.variant === 'min-heap';
    block.nodes.forEach((node, i) => {
      if (node.parent === null) return;
      const value = label.get(node.id) as number;
      const parent = label.get(node.parent) as number;
      if (min ? value < parent : value > parent) {
        out.error(
          pointer(at, 'nodes', i, 'label'),
          'shape',
          `${value} breaks the ${block.variant} order under ${parent}.`,
        );
      }
    });
  }
  simulateOrSteps(block.simulate, block.steps.length, at, out);
  const sim = block.simulate;
  if (sim) {
    const path = pointer(at, 'simulate');
    const fits: Record<string, (variant: string) => boolean> = {
      'bst-insert': (variant) => variant === 'bst',
      'bst-search': (variant) => variant === 'bst',
      'heap-push': (variant) => variant.endsWith('heap'),
      'heap-pop': (variant) => variant.endsWith('heap'),
    };
    const fit =
      fits[sim.algorithm] ??
      ((variant: string) => BINARY_VARIANTS.includes(variant));
    if (!fit(block.variant)) {
      out.error(
        path,
        'precondition',
        `${sim.algorithm} doesn't fit a ${block.variant} tree.`,
      );
    }
    const wantValues: Record<string, string> = {
      'bst-insert': 'at least one value',
      'heap-push': 'at least one value',
      'bst-search': 'exactly one value',
    };
    const want = wantValues[sim.algorithm];
    if (
      (want === 'at least one value' && sim.values.length === 0) ||
      (want === 'exactly one value' && sim.values.length !== 1) ||
      (!want && sim.values.length > 0)
    ) {
      out.error(
        pointer(path, 'values'),
        'precondition',
        `${sim.algorithm} takes ${want ?? 'no values'}.`,
      );
    }
    if (
      !['bst-insert', 'heap-push'].includes(sim.algorithm) &&
      block.nodes.length === 0
    ) {
      out.error(
        pointer(at, 'nodes'),
        'precondition',
        `${sim.algorithm} needs a tree to start from.`,
      );
    }
  }
  const live = new Set(known);
  const kids = new Map<string, number>();
  block.nodes.forEach((node) => {
    if (node.parent) kids.set(node.parent, (kids.get(node.parent) ?? 0) + 1);
  });
  steps(block.steps, at, live, out, (op, path) => {
    switch (op.op) {
      case 'insert':
        if (
          need(op.node, path, 'node', 'insert', out) &&
          need(op.value, path, 'value', 'insert', out)
        ) {
          if (live.has(op.node as string)) {
            out.error(
              pointer(path, 'node'),
              'duplicate-id',
              `"${op.node}" already exists; insert takes a new id.`,
            );
          }
          if (op.other !== null)
            ref(op.other, live, pointer(path, 'other'), 'node', out);
          live.add(op.node as string);
          if (op.other) kids.set(op.other, (kids.get(op.other) ?? 0) + 1);
        }
        break;
      case 'remove':
        if (
          need(op.node, path, 'node', 'remove', out) &&
          ref(op.node, live, pointer(path, 'node'), 'node', out)
        ) {
          if ((kids.get(op.node as string) ?? 0) > 0) {
            out.error(
              pointer(path, 'node'),
              'illegal-op',
              `Remove leaves only; "${op.node}" has children.`,
            );
          }
          live.delete(op.node as string);
        }
        break;
      case 'swap':
        if (need(op.node, path, 'node', 'swap', out))
          ref(op.node, live, pointer(path, 'node'), 'node', out);
        if (need(op.other, path, 'other', 'swap', out))
          ref(op.other, live, pointer(path, 'other'), 'node', out);
        break;
      case 'emit':
        if (op.node === null && op.value === null) {
          out.error(path, 'missing-field', 'emit needs a node or a value.');
        }
        if (op.node !== null)
          ref(op.node, live, pointer(path, 'node'), 'node', out);
        break;
      default:
        if (need(op.node, path, 'node', op.op, out))
          ref(op.node, live, pointer(path, 'node'), 'node', out);
    }
  });
};

/** True when the directed graph has a cycle. */
function hasCycle(
  nodes: readonly string[],
  edges: readonly { from: string; to: string }[],
): boolean {
  const next = new Map(nodes.map((id) => [id, [] as string[]]));
  edges.forEach((edge) => next.get(edge.from)?.push(edge.to));
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'open') return true;
    if (state.get(id) === 'done') return false;
    state.set(id, 'open');
    const cyclic = (next.get(id) ?? []).some(visit);
    state.set(id, 'done');
    return cyclic;
  };
  return nodes.some(visit);
}

const graph: Check<'graph'> = (block, at, out) => {
  const nodes = ids(block.nodes, at, 'nodes', out);
  const edges = ids(block.edges, at, 'edges', out, new Set());
  edges.forEach((id) => {
    if (nodes.has(id)) {
      out.error(
        pointer(at, 'edges'),
        'duplicate-id',
        `"${id}" names both a node and an edge.`,
      );
    }
  });
  block.edges.forEach((edge, i) => {
    const path = pointer(at, 'edges', i);
    ref(edge.from, nodes, pointer(path, 'from'), 'node', out);
    ref(edge.to, nodes, pointer(path, 'to'), 'node', out);
    if (block.weighted !== (edge.weight !== null)) {
      out.error(
        pointer(path, 'weight'),
        'shape',
        block.weighted
          ? 'A weighted graph needs a weight on every edge.'
          : 'An unweighted graph has null weights.',
      );
    }
  });
  simulateOrSteps(block.simulate, block.steps.length, at, out);
  const sim = block.simulate;
  if (sim) {
    const path = pointer(at, 'simulate');
    if (sim.algorithm === 'topological-sort') {
      if (!block.directed)
        out.error(
          path,
          'precondition',
          'topological-sort needs a directed graph.',
        );
      if (hasCycle([...nodes], block.edges)) {
        out.error(
          path,
          'precondition',
          'topological-sort needs a graph without cycles.',
        );
      }
    } else if (need(sim.start, path, 'start', sim.algorithm, out)) {
      ref(sim.start, nodes, pointer(path, 'start'), 'node', out);
    }
    if (sim.algorithm === 'dijkstra') {
      if (!block.weighted)
        out.error(path, 'precondition', 'dijkstra needs a weighted graph.');
      if (block.edges.some((edge) => (edge.weight ?? 0) < 0)) {
        out.error(path, 'precondition', 'dijkstra needs weights of 0 or more.');
      }
    }
  }
  const all = new Set([...nodes, ...edges]);
  steps(block.steps, at, all, out, (op, path) => {
    if (op.op === 'relax' || op.op === 'mark-edge') {
      if (need(op.edge, path, 'edge', op.op, out))
        ref(op.edge, edges, pointer(path, 'edge'), 'edge', out);
    } else if (op.op === 'emit') {
      if (op.node === null && op.value === null)
        out.error(path, 'missing-field', 'emit needs a node or a value.');
      if (op.node !== null)
        ref(op.node, nodes, pointer(path, 'node'), 'node', out);
    } else {
      if (need(op.node, path, 'node', op.op, out))
        ref(op.node, nodes, pointer(path, 'node'), 'node', out);
      if (op.op === 'set-distance')
        need(op.value, path, 'value', 'set-distance', out);
    }
  });
};

const grid: Check<'grid'> = (block, at, out) => {
  const width = block.rows[0]?.length ?? 0;
  block.rows.forEach((row, i) => {
    const path = pointer(at, 'rows', i);
    if (row.length !== width) {
      out.error(
        path,
        'shape',
        `Every row needs ${width} cells; this one has ${row.length}.`,
      );
    }
    if (!/^[.#SG0-9]*$/.test(row)) {
      out.error(path, 'bad-format', 'Use only ".", "#", "S", "G" and digits.');
    }
  });
  const count = (char: string) =>
    block.rows.reduce((sum, row) => sum + row.split(char).length - 1, 0);
  simulateOrSteps(block.simulate, block.steps.length, at, out);
  const sim = block.simulate;
  if (sim) {
    const path = pointer(at, 'simulate');
    if (sim.algorithm === 'lcs') {
      need(sim.a, path, 'a', 'lcs', out);
      need(sim.b, path, 'b', 'lcs', out);
      if (block.rows.length > 0) {
        out.error(
          pointer(at, 'rows'),
          'mode-conflict',
          'lcs builds its own table: leave rows empty.',
        );
      }
    } else {
      if (block.rows.length === 0) {
        out.error(
          pointer(at, 'rows'),
          'too-few',
          `${sim.algorithm} needs a grid.`,
        );
      }
      if (
        ['grid-bfs', 'a-star'].includes(sim.algorithm) &&
        (count('S') !== 1 || count('G') !== 1)
      ) {
        out.error(
          pointer(at, 'rows'),
          'precondition',
          `${sim.algorithm} needs exactly one "S" and one "G".`,
        );
      }
      if (sim.algorithm === 'flood-fill' && count('S') !== 1) {
        out.error(
          pointer(at, 'rows'),
          'precondition',
          'flood-fill starts from exactly one "S".',
        );
      }
      if (
        sim.algorithm === 'min-path-sum' &&
        block.rows.some((row) => !/^[0-9]*$/.test(row))
      ) {
        out.error(
          pointer(at, 'rows'),
          'precondition',
          'min-path-sum needs a digit in every cell.',
        );
      }
    }
  } else if (block.rows.length === 0) {
    out.error(pointer(at, 'rows'), 'too-few', "Give the grid's rows.");
  }
  steps(block.steps, at, new Set(), out, (op, path) => {
    if (need(op.row, path, 'row', op.op, out))
      inRange(op.row, block.rows.length, pointer(path, 'row'), 'Row', out);
    if (need(op.col, path, 'col', op.op, out))
      inRange(op.col, width, pointer(path, 'col'), 'Column', out);
    if (op.op === 'set') need(op.value, path, 'value', 'set', out);
  });
};

const RECURSION_MAX: Record<string, number> = {
  fibonacci: 6,
  factorial: 8,
  power: 8,
  subsets: 3,
};

const recursionTree: Check<'recursion-tree'> = (block, at, out) => {
  const sim = block.simulate;
  if (sim) {
    if (block.calls.length > 0 || block.steps.length > 0) {
      out.error(
        pointer(at, 'calls'),
        'mode-conflict',
        'With simulate the app builds the calls: leave calls and steps empty.',
      );
    }
    if (sim.n > RECURSION_MAX[sim.algorithm]) {
      out.error(
        pointer(at, 'simulate', 'n'),
        'out-of-range',
        `${sim.algorithm} takes n up to ${RECURSION_MAX[sim.algorithm]}.`,
      );
    }
    return;
  }
  if (block.calls.length === 0) {
    out.error(
      pointer(at, 'calls'),
      'too-few',
      'Give the calls, or set "simulate".',
    );
  }
  atLeastOneStep(block.steps, at, out);
  const known = new Set<string>();
  const parent = new Map<string, string | null>();
  let roots = 0;
  block.calls.forEach((call, i) => {
    const path = pointer(at, 'calls', i);
    if (known.has(call.id))
      out.error(
        pointer(path, 'id'),
        'duplicate-id',
        `The id "${call.id}" is used twice.`,
      );
    if (call.parent === null) roots++;
    else if (!known.has(call.parent)) {
      out.error(
        pointer(path, 'parent'),
        'unknown-ref',
        `"${call.parent}" isn't declared before "${call.id}".`,
      );
    }
    known.add(call.id);
    parent.set(call.id, call.parent);
  });
  if (block.calls.length > 0 && roots !== 1) {
    out.error(
      pointer(at, 'calls'),
      'shape',
      `Exactly one call has parent null; here ${roots} do.`,
    );
  }
  const open: string[] = [];
  const started = new Set<string>();
  steps(block.steps, at, known, out, (op, path) => {
    if (
      !need(op.call, path, 'call', op.op, out) ||
      !ref(op.call, known, pointer(path, 'call'), 'call', out)
    )
      return;
    const call = op.call as string;
    const top = open[open.length - 1] ?? null;
    if (op.op === 'return') {
      if (call !== top) {
        out.error(
          pointer(path, 'call'),
          'illegal-op',
          `Only the innermost open call${top ? ` ("${top}")` : ''} can return.`,
        );
      } else {
        open.pop();
      }
      need(op.value, path, 'value', 'return', out);
      return;
    }
    if (started.has(call)) {
      out.error(
        pointer(path, 'call'),
        'illegal-op',
        `"${call}" has already started.`,
      );
    } else if (parent.get(call) !== top) {
      out.error(
        pointer(path, 'call'),
        'illegal-op',
        `"${call}" is called by "${parent.get(call) ?? 'nobody'}", but the innermost open call is "${top ?? 'none'}".`,
      );
    }
    started.add(call);
    if (op.op === 'call') open.push(call);
    else need(op.value, path, 'value', 'memo-hit', out);
  });
};

// --- systems ----------------------------------------------------------------------

const flow: Check<'flow'> = (block, at, out) => {
  const nodes = ids(block.nodes, at, 'nodes', out);
  const edges = ids(block.edges, at, 'edges', out, new Set(nodes));
  const edgeIds = new Set(block.edges.map((edge) => edge.id));
  block.edges.forEach((edge, i) => {
    ref(edge.from, nodes, pointer(at, 'edges', i, 'from'), 'node', out);
    ref(edge.to, nodes, pointer(at, 'edges', i, 'to'), 'node', out);
  });
  atLeastOneStep(block.steps, at, out);
  steps(block.steps, at, edges, out, (op, path) => {
    switch (op.op) {
      case 'send':
      case 'respond':
        if (need(op.edge, path, 'edge', op.op, out))
          ref(op.edge, edgeIds, pointer(path, 'edge'), 'edge', out);
        need(op.packet, path, 'packet', op.op, out);
        break;
      case 'process':
      case 'store':
        if (need(op.node, path, 'node', op.op, out))
          ref(op.node, nodes, pointer(path, 'node'), 'node', out);
        break;
      default:
        if (op.node === null && op.edge === null) {
          out.error(path, 'missing-field', `${op.op} needs a node or an edge.`);
        }
        if (op.node !== null)
          ref(op.node, nodes, pointer(path, 'node'), 'node', out);
        if (op.edge !== null)
          ref(op.edge, edgeIds, pointer(path, 'edge'), 'edge', out);
    }
  });
};

const sequence: Check<'sequence'> = (block, at, out) => {
  const actors = ids(block.actors, at, 'actors', out);
  const all = ids(block.messages, at, 'messages', out, new Set(actors));
  const messages = new Set(block.messages.map((message) => message.id));
  block.messages.forEach((message, i) => {
    const path = pointer(at, 'messages', i);
    ref(message.from, actors, pointer(path, 'from'), 'actor', out);
    ref(message.to, actors, pointer(path, 'to'), 'actor', out);
    if ((message.style === 'self') !== (message.from === message.to)) {
      out.error(
        pointer(path, 'style'),
        'shape',
        message.style === 'self'
          ? 'A self message goes from an actor to itself.'
          : 'A message to the same actor has style "self".',
      );
    }
  });
  atLeastOneStep(block.steps, at, out);
  const shown = new Set<string>();
  steps(block.steps, at, all, out, (op, path) => {
    if (op.op === 'note') {
      if (need(op.actor, path, 'actor', 'note', out))
        ref(op.actor, actors, pointer(path, 'actor'), 'actor', out);
      need(op.text, path, 'text', 'note', out);
      return;
    }
    if (op.op === 'highlight' && op.message === null) {
      if (need(op.actor, path, 'actor', 'highlight', out))
        ref(op.actor, actors, pointer(path, 'actor'), 'actor', out);
      return;
    }
    if (
      !need(op.message, path, 'message', op.op, out) ||
      !ref(op.message, messages, pointer(path, 'message'), 'message', out)
    )
      return;
    if (op.op === 'show') {
      if (shown.has(op.message as string)) {
        out.error(
          pointer(path, 'message'),
          'illegal-op',
          `"${op.message}" is already shown.`,
        );
      }
      shown.add(op.message as string);
    }
  });
};

const stateMachine: Check<'state-machine'> = (block, at, out) => {
  const states = ids(block.states, at, 'states', out);
  const all = ids(block.transitions, at, 'transitions', out, new Set(states));
  const initial = block.states.filter((state) => state.initial);
  if (initial.length !== 1) {
    out.error(
      pointer(at, 'states'),
      'shape',
      `Exactly one state is initial; here ${initial.length} are.`,
    );
  }
  const byId = new Map(block.transitions.map((t) => [t.id, t]));
  block.transitions.forEach((t, i) => {
    ref(t.from, states, pointer(at, 'transitions', i, 'from'), 'state', out);
    ref(t.to, states, pointer(at, 'transitions', i, 'to'), 'state', out);
  });
  atLeastOneStep(block.steps, at, out);
  let current = initial[0]?.id ?? null;
  steps(block.steps, at, all, out, (op, path) => {
    if (op.op === 'fire') {
      if (!need(op.transition, path, 'transition', 'fire', out)) return;
      const t = byId.get(op.transition as string);
      if (!t) {
        ref(
          op.transition,
          new Set(byId.keys()),
          pointer(path, 'transition'),
          'transition',
          out,
        );
        return;
      }
      if (t.from !== current) {
        out.error(
          pointer(path, 'transition'),
          'illegal-op',
          `"${t.id}" leaves "${t.from}", but the machine is in "${current}".`,
        );
      }
      current = t.to;
      return;
    }
    if (!need(op.event, path, 'event', 'reject', out)) return;
    const handled = block.transitions.find(
      (t) => t.from === current && t.event === op.event,
    );
    if (handled) {
      out.error(
        pointer(path, 'event'),
        'illegal-op',
        `"${current}" handles "${op.event}" through "${handled.id}"; use fire instead.`,
      );
    }
  });
};

const pipeline: Check<'pipeline'> = (block, at, out) => {
  const stages = ids(block.stages, at, 'stages', out);
  atLeastOneStep(block.steps, at, out);
  steps(block.steps, at, stages, out, (op, path) => {
    if (need(op.stage, path, 'stage', op.op, out))
      ref(op.stage, stages, pointer(path, 'stage'), 'stage', out);
    if (op.op !== 'fail') need(op.data, path, 'data', op.op, out);
  });
};

const eventLoop: Check<'event-loop'> = (block, at, out) => {
  codeShape(block.code, pointer(at, 'code'), out);
  if (block.mode === 'execute') {
    if (block.steps.length > 0) {
      out.error(
        pointer(at, 'steps'),
        'mode-conflict',
        'With "execute" the app records the steps: leave steps empty.',
      );
    }
    return;
  }
  atLeastOneStep(block.steps, at, out);
  const stack: string[] = [];
  const tasks: string[] = [];
  const microtasks: string[] = [];
  steps(block.steps, at, new Set(), out, (op, path) => {
    switch (op.op) {
      case 'push-stack':
        if (need(op.label, path, 'label', op.op, out))
          stack.push(op.label as string);
        break;
      case 'pop-stack':
        if (stack.length === 0)
          out.error(
            pointer(path, 'op'),
            'illegal-op',
            'pop-stack on an empty call stack.',
          );
        stack.pop();
        break;
      case 'web-api':
      case 'log':
        need(op.label, path, 'label', op.op, out);
        break;
      case 'queue-task':
        if (need(op.label, path, 'label', op.op, out))
          tasks.push(op.label as string);
        break;
      case 'queue-microtask':
        if (need(op.label, path, 'label', op.op, out))
          microtasks.push(op.label as string);
        break;
      case 'run-microtask':
        if (stack.length > 0) {
          out.error(
            pointer(path, 'op'),
            'illegal-op',
            'Microtasks run only when the call stack is empty.',
          );
        }
        if (microtasks.length === 0) {
          out.error(
            pointer(path, 'op'),
            'illegal-op',
            'run-microtask with an empty microtask queue.',
          );
        } else {
          stack.push(microtasks.shift() as string);
        }
        break;
      case 'run-task':
        if (stack.length > 0) {
          out.error(
            pointer(path, 'op'),
            'illegal-op',
            'A task runs only when the call stack is empty.',
          );
        }
        if (microtasks.length > 0) {
          out.error(
            pointer(path, 'op'),
            'illegal-op',
            `run-task while "${microtasks[0]}" waits in the microtask queue: microtasks run first.`,
          );
        }
        if (tasks.length === 0) {
          out.error(
            pointer(path, 'op'),
            'illegal-op',
            'run-task with an empty task queue.',
          );
        } else {
          stack.push(tasks.shift() as string);
        }
        break;
    }
  });
};

const gitGraph: Check<'git-graph'> = (block, at, out) => {
  atLeastOneStep(block.steps, at, out);
  const branches = new Map([[block.start.branch, block.start.commit]]);
  const tags = new Set<string>();
  const commits = new Set([block.start.commit]);
  let head = block.start.branch;
  const newCommit = (id: string | null, path: string, op: string) => {
    if (!need(id, path, 'commit', op, out)) return false;
    if (commits.has(id as string)) {
      out.error(
        pointer(path, 'commit'),
        'duplicate-id',
        `The commit id "${id}" is already used.`,
      );
      return false;
    }
    commits.add(id as string);
    return true;
  };
  steps(block.steps, at, new Set(), out, (op, path) => {
    const branch = () =>
      need(op.ref, path, 'ref', op.op, out) &&
      ref(
        op.ref,
        new Set(branches.keys()),
        pointer(path, 'ref'),
        'branch',
        out,
      );
    switch (op.op) {
      case 'commit':
        need(op.message, path, 'message', 'commit', out);
        if (newCommit(op.commit, path, 'commit'))
          branches.set(head, op.commit as string);
        break;
      case 'branch':
      case 'tag':
        if (need(op.ref, path, 'ref', op.op, out)) {
          if (branches.has(op.ref as string) || tags.has(op.ref as string)) {
            out.error(
              pointer(path, 'ref'),
              'duplicate-id',
              `"${op.ref}" already exists.`,
            );
          } else if (op.op === 'branch') {
            branches.set(op.ref as string, branches.get(head) as string);
          } else {
            tags.add(op.ref as string);
          }
        }
        break;
      case 'checkout':
        if (branch()) head = op.ref as string;
        break;
      case 'merge':
      case 'rebase':
        if (branch() && op.ref === head) {
          out.error(
            pointer(path, 'ref'),
            'illegal-op',
            `"${head}" is the current branch; ${op.op} another one.`,
          );
        }
        if (op.op === 'merge') {
          need(op.message, path, 'message', 'merge', out);
          if (newCommit(op.commit, path, 'merge'))
            branches.set(head, op.commit as string);
        }
        break;
      case 'reset':
        if (need(op.commit, path, 'commit', 'reset', out)) {
          if (ref(op.commit, commits, pointer(path, 'commit'), 'commit', out)) {
            branches.set(head, op.commit as string);
          }
        }
        break;
    }
  });
};

// --- concepts -------------------------------------------------------------------

const conceptMap: Check<'concept-map'> = (block, at, out) => {
  const nodes = ids(block.nodes, at, 'nodes', out);
  const all = ids(block.links, at, 'links', out, new Set(nodes));
  const links = new Set(block.links.map((link) => link.id));
  block.links.forEach((link, i) => {
    ref(link.from, nodes, pointer(at, 'links', i, 'from'), 'node', out);
    ref(link.to, nodes, pointer(at, 'links', i, 'to'), 'node', out);
  });
  steps(block.steps, at, all, out, (op, path) => {
    if (op.node === null && op.link === null)
      out.error(path, 'missing-field', `${op.op} needs a node or a link.`);
    if (op.node !== null)
      ref(op.node, nodes, pointer(path, 'node'), 'node', out);
    if (op.link !== null)
      ref(op.link, links, pointer(path, 'link'), 'link', out);
  });
};

const chart: Check<'chart'> = (block, at, out) => {
  ids(block.series, at, 'series', out);
  if (block.chart === 'line') {
    if (block.x === null) {
      out.error(pointer(at, 'x'), 'missing-field', 'A line chart needs "x".');
      return;
    }
    const points = block.x.to - block.x.from + 1;
    if (points < 2 || points > LIMITS.chartPoints) {
      out.error(
        pointer(at, 'x'),
        'out-of-range',
        `x needs 2 to ${LIMITS.chartPoints} points; from ${block.x.from} to ${block.x.to} gives ${points}.`,
      );
    }
    if (block.categories.length > 0) {
      out.error(
        pointer(at, 'categories'),
        'mode-conflict',
        'A line chart has no categories.',
      );
    }
    block.series.forEach((series, i) => {
      const path = pointer(at, 'series', i);
      if ((series.fn === null) === (series.values === null)) {
        out.error(path, 'mode-conflict', 'Give either "fn" or "values".');
      } else if (series.values && series.values.length !== points) {
        out.error(
          pointer(path, 'values'),
          'shape',
          `Give one value per x: ${points}.`,
        );
      }
      if (
        series.fn !== null &&
        ['log n', 'n log n'].includes(series.fn) &&
        (block.x?.from ?? 0) < 1
      ) {
        out.error(
          pointer(at, 'x', 'from'),
          'precondition',
          `${series.fn} needs x from 1.`,
        );
      }
    });
    return;
  }
  if (block.x !== null)
    out.error(
      pointer(at, 'x'),
      'mode-conflict',
      'A bar chart has no "x"; use categories.',
    );
  if (block.categories.length === 0)
    out.error(
      pointer(at, 'categories'),
      'too-few',
      'A bar chart needs categories.',
    );
  block.series.forEach((series, i) => {
    const path = pointer(at, 'series', i);
    if (series.fn !== null || series.values === null) {
      out.error(
        path,
        'mode-conflict',
        'Bar series give "values" and a null "fn".',
      );
    } else if (series.values.length !== block.categories.length) {
      out.error(
        pointer(path, 'values'),
        'shape',
        `Give one value per category: ${block.categories.length}.`,
      );
    }
  });
};

// --- checks -----------------------------------------------------------------------

const predict: Check<'predict'> = (block, at, out) => {
  const choice = block.options !== null;
  if (
    choice !== (block.answer !== null) ||
    choice === (block.expected !== null)
  ) {
    out.error(
      at,
      'mode-conflict',
      'Give "options" with "answer" (and a null "expected"), or a free "expected" answer with null options and answer.',
    );
  } else if (block.options && block.answer !== null) {
    inRange(
      block.answer,
      block.options.length,
      pointer(at, 'answer'),
      'Answer',
      out,
    );
  }
};

const quiz: Check<'quiz'> = (block, at, out) => {
  const seen = new Set<number>();
  block.correct.forEach((index, i) => {
    inRange(
      index,
      block.options.length,
      pointer(at, 'correct', i),
      'Option',
      out,
    );
    if (seen.has(index))
      out.error(
        pointer(at, 'correct', i),
        'duplicate-id',
        `Option ${index} is listed twice.`,
      );
    seen.add(index);
  });
  if (block.correct.length >= block.options.length) {
    out.error(
      pointer(at, 'correct'),
      'too-many',
      'At least one option must be wrong.',
    );
  }
  if (block.code) codeShape(block.code.code, pointer(at, 'code', 'code'), out);
};

const orderSteps: Check<'order-steps'> = (block, at, out) => {
  ids(block.items, at, 'items', out);
};

const categorize: Check<'categorize'> = (block, at, out) => {
  const categories = ids(block.categories, at, 'categories', out);
  ids(block.items, at, 'items', out, new Set(categories));
  const used = new Set<string>();
  block.items.forEach((item, i) => {
    if (
      ref(
        item.category,
        categories,
        pointer(at, 'items', i, 'category'),
        'category',
        out,
      )
    )
      used.add(item.category);
  });
  block.categories.forEach((category, i) => {
    if (!used.has(category.id)) {
      out.error(
        pointer(at, 'categories', i),
        'shape',
        `No item belongs to "${category.label}"; use every category.`,
      );
    }
  });
};

const parsons: Check<'parsons'> = (block, at, out) => {
  const lines = ids(block.lines, at, 'lines', out);
  const blanksPerLine = new Map<string, number>();
  block.blanks.forEach((blank, i) => {
    if (ref(blank.line, lines, pointer(at, 'blanks', i, 'line'), 'line', out)) {
      blanksPerLine.set(blank.line, (blanksPerLine.get(blank.line) ?? 0) + 1);
    }
  });
  block.lines.forEach((line, i) => {
    const holes = line.code.split('___').length - 1;
    const given = blanksPerLine.get(line.id) ?? 0;
    if (holes !== given) {
      out.error(
        pointer(at, 'lines', i, 'code'),
        'shape',
        `This line has ${holes} "___" but ${given} blank${given === 1 ? '' : 's'}; give one blank per "___".`,
      );
    }
  });
  const solution = new Set(block.lines.map((line) => line.code.trim()));
  block.distractors.forEach((line, i) => {
    if (solution.has(line.trim())) {
      out.error(
        pointer(at, 'distractors', i),
        'shape',
        'A distractor must differ from every solution line.',
      );
    }
  });
};

const predictOutput: Check<'predict-output'> = (block, at, out) => {
  codeShape(block.code, pointer(at, 'code'), out);
  if (block.mode === 'execute' && block.language !== 'javascript') {
    out.error(
      pointer(at, 'mode'),
      'precondition',
      'Only JavaScript can be executed; use "given".',
    );
  }
};

const cloze: Check<'cloze'> = (block, at, out) => {
  const blanks = ids(block.blanks, at, 'blanks', out);
  const used = [...block.text.matchAll(/\{\{([^}]*)\}\}/g)].map(
    (match) => match[1],
  );
  const seen = new Set<string>();
  used.forEach((id) => {
    if (!blanks.has(id)) {
      out.error(
        pointer(at, 'text'),
        'unknown-ref',
        `"{{${id}}}" has no blank; declare it in blanks.`,
      );
    }
    if (seen.has(id))
      out.error(
        pointer(at, 'text'),
        'duplicate-id',
        `"{{${id}}}" appears twice.`,
      );
    seen.add(id);
  });
  block.blanks.forEach((blank, i) => {
    if (!seen.has(blank.id)) {
      out.error(
        pointer(at, 'blanks', i),
        'shape',
        `"${blank.id}" isn't in the text; write it as {{${blank.id}}}.`,
      );
    }
  });
};

const nothing = () => undefined;

export const SEMANTIC_CHECKS: { [K in BlockKind]: Check<K> } = {
  prose,
  callout: nothing,
  compare,
  'code-walkthrough': codeWalkthrough,
  'code-trace': codeTrace,
  array,
  'stack-queue': stackQueue,
  'hash-table': hashTable,
  tree,
  graph,
  grid,
  'recursion-tree': recursionTree,
  flow,
  sequence,
  'state-machine': stateMachine,
  pipeline,
  'event-loop': eventLoop,
  'git-graph': gitGraph,
  'concept-map': conceptMap,
  chart,
  predict,
  quiz,
  'self-explain': nothing,
  'order-steps': orderSteps,
  categorize,
  parsons,
  'predict-output': predictOutput,
  cloze,
};

export function checkBlock(block: Block, at: string, out: IssueList): void {
  (SEMANTIC_CHECKS[block.kind] as Check<BlockKind>)(block as never, at, out);
}

/** The ids of a block's steps (or a trace's frames), for references. */
export function stepIdsOf(block: Block): Set<string> {
  if (block.kind === 'code-trace')
    return new Set(block.frames.map((frame) => frame.id));
  return 'steps' in block
    ? new Set((block.steps as readonly { id: string }[]).map((step) => step.id))
    : new Set();
}
