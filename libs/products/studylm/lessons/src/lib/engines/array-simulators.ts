import type { BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';
import type { OpOf, Simulator } from './contracts';

type ArrayBlock = BlockOf<'array'>;
type ArrayOp = OpOf<'array'>;
type Value = number | string;

/** An op with every field the format requires, unused ones null. */
function op(fields: Partial<ArrayOp> & Pick<ArrayOp, 'op'>): ArrayOp {
  return { i: null, j: null, value: null, name: null, ...fields };
}

const pointerAt = (name: string, i: number | null) =>
  op({ op: 'pointer', name, i });

/** Collects steps with ids that are unique and kebab-case. */
class Steps {
  readonly list: Step<ArrayOp>[] = [];

  add(title: string, narration: string, ops: ArrayOp[]): void {
    this.list.push({
      id: `s${this.list.length + 1}`,
      title,
      narration,
      focus: [],
      ops,
      pauseFor: null,
    });
  }
}

const num = (value: Value) => Number(value);
const less = (a: Value, b: Value) =>
  typeof a === 'number' && typeof b === 'number'
    ? a < b
    : String(a) < String(b);

function binarySearch(values: Value[], target: number): Step<ArrayOp>[] {
  const out = new Steps();
  let lo = 0;
  let hi = values.length - 1;
  out.add(
    'Search the whole array',
    `lo starts at the first index and hi at the last. The answer, if ${target} is here, lies between them.`,
    [
      pointerAt('lo', lo),
      pointerAt('hi', hi),
      op({ op: 'range', i: lo, j: hi }),
    ],
  );
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = num(values[mid]);
    if (value === target) {
      out.add(
        `Check index ${mid}`,
        `mid = (${lo} + ${hi}) / 2, rounded down: ${mid}. The value there is ${value}: found it.`,
        [pointerAt('mid', mid), op({ op: 'found', i: mid })],
      );
      return out.list;
    }
    const right = value < target;
    out.add(
      `Check index ${mid}`,
      `mid = (${lo} + ${hi}) / 2, rounded down: ${mid}. ${value} is ${right ? 'smaller' : 'larger'} than ${target}, so the ${right ? 'left' : 'right'} half can go.`,
      [pointerAt('mid', mid)],
    );
    if (right) lo = mid + 1;
    else hi = mid - 1;
    out.add(
      right ? 'Move lo past mid' : 'Move hi before mid',
      lo <= hi
        ? `Only indexes ${lo} to ${hi} are left: half as many as before.`
        : `lo has passed hi: nothing is left to search.`,
      [
        pointerAt(right ? 'lo' : 'hi', right ? lo : hi),
        pointerAt('mid', null),
        ...(lo <= hi ? [op({ op: 'range', i: lo, j: hi })] : []),
      ],
    );
  }
  out.add('Not here', `${target} is not in the array.`, [
    op({ op: 'not-found' }),
  ]);
  return out.list;
}

function linearSearch(values: Value[], target: number): Step<ArrayOp>[] {
  const out = new Steps();
  for (let i = 0; i < values.length; i++) {
    const hit = num(values[i]) === target;
    out.add(
      `Check index ${i}`,
      hit
        ? `${values[i]} is ${target}: found after ${i + 1} checks.`
        : `${values[i]} isn't ${target}; move on.`,
      [pointerAt('i', i), ...(hit ? [op({ op: 'found', i })] : [])],
    );
    if (hit) return out.list;
  }
  out.add(
    'Not here',
    `Every cell was checked: ${target} is not in the array.`,
    [pointerAt('i', null), op({ op: 'not-found' })],
  );
  return out.list;
}

function bubbleSort(values: Value[]): Step<ArrayOp>[] {
  const a = [...values];
  const out = new Steps();
  for (let end = a.length - 1; end > 0; end--) {
    let swapped = false;
    for (let j = 0; j < end; j++) {
      const swap = less(a[j + 1], a[j]);
      out.add(
        `Compare ${j} and ${j + 1}`,
        swap
          ? `${a[j]} is larger than ${a[j + 1]}: swap them, so the larger one bubbles right.`
          : `${a[j]} and ${a[j + 1]} are in order.`,
        [
          op({ op: 'compare', i: j, j: j + 1 }),
          ...(swap ? [op({ op: 'swap', i: j, j: j + 1 })] : []),
        ],
      );
      if (swap) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    out.add(
      `Index ${end} is final`,
      `The largest value left, ${a[end]}, has reached index ${end}.`,
      [op({ op: 'mark', i: end, name: 'sorted' })],
    );
    if (!swapped) {
      out.add(
        'No swaps: sorted',
        'A pass without a swap means everything is in order.',
        Array.from({ length: end }, (_, i) =>
          op({ op: 'mark', i, name: 'sorted' }),
        ),
      );
      return out.list;
    }
  }
  out.add('Sorted', 'Every value is in place.', [
    op({ op: 'mark', i: 0, name: 'sorted' }),
  ]);
  return out.list;
}

function insertionSort(values: Value[]): Step<ArrayOp>[] {
  const a = [...values];
  const out = new Steps();
  for (let i = 1; i < a.length; i++) {
    out.add(
      `Insert ${a[i]}`,
      `Indexes 0 to ${i - 1} are sorted. Take ${a[i]} and slide it left to its place.`,
      [pointerAt('i', i), op({ op: 'range', i: 0, j: i })],
    );
    for (let j = i; j > 0; j--) {
      const swap = less(a[j], a[j - 1]);
      out.add(
        `Compare ${j - 1} and ${j}`,
        swap
          ? `${a[j]} is smaller than ${a[j - 1]}: swap.`
          : `${a[j - 1]} is not larger than ${a[j]}: it stays here.`,
        [
          op({ op: 'compare', i: j - 1, j }),
          ...(swap ? [op({ op: 'swap', i: j - 1, j })] : []),
        ],
      );
      if (!swap) break;
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
    }
  }
  out.add('Sorted', 'The sorted part now covers the whole array.', [
    pointerAt('i', null),
    op({ op: 'range', i: 0, j: a.length - 1 }),
  ]);
  return out.list;
}

function selectionSort(values: Value[]): Step<ArrayOp>[] {
  const a = [...values];
  const out = new Steps();
  for (let i = 0; i < a.length - 1; i++) {
    let min = i;
    out.add(
      `Find the smallest from ${i}`,
      `Assume ${a[i]}, at index ${i}, is the smallest of the rest.`,
      [pointerAt('i', i), pointerAt('min', i)],
    );
    for (let j = i + 1; j < a.length; j++) {
      const smaller = less(a[j], a[min]);
      out.add(
        `Compare ${min} and ${j}`,
        smaller
          ? `${a[j]} is smaller than ${a[min]}: it is the new minimum.`
          : `${a[j]} is not smaller than ${a[min]}.`,
        [
          op({ op: 'compare', i: min, j }),
          ...(smaller ? [pointerAt('min', j)] : []),
        ],
      );
      if (smaller) min = j;
    }
    out.add(
      `Place ${a[min]}`,
      min === i
        ? `${a[i]} was already the smallest; index ${i} is final.`
        : `Swap ${a[min]} into index ${i}; that index is final.`,
      [
        ...(min === i ? [] : [op({ op: 'swap', i, j: min })]),
        op({ op: 'mark', i, name: 'sorted' }),
      ],
    );
    [a[i], a[min]] = [a[min], a[i]];
  }
  out.add('Sorted', 'The last value is the largest, so it is in place too.', [
    op({ op: 'mark', i: a.length - 1, name: 'sorted' }),
    pointerAt('i', null),
    pointerAt('min', null),
  ]);
  return out.list;
}

function mergeSort(values: Value[]): Step<ArrayOp>[] {
  const a = [...values];
  const out = new Steps();
  // Bottom-up: merge runs of 1, then 2, then 4…
  for (let size = 1; size < a.length; size *= 2) {
    for (let lo = 0; lo < a.length - size; lo += 2 * size) {
      const mid = lo + size - 1;
      const hi = Math.min(lo + 2 * size - 1, a.length - 1);
      const merged: Value[] = [];
      let l = lo;
      let r = mid + 1;
      while (l <= mid || r <= hi) {
        if (r > hi || (l <= mid && !less(a[r], a[l]))) merged.push(a[l++]);
        else merged.push(a[r++]);
      }
      out.add(
        `Merge ${lo}–${mid} with ${mid + 1}–${hi}`,
        `Both runs are sorted. Take the smaller front value each time: ${merged.join(', ')}.`,
        [
          op({ op: 'range', i: lo, j: hi }),
          ...merged.map((value, k) => op({ op: 'set', i: lo + k, value })),
        ],
      );
      merged.forEach((value, k) => (a[lo + k] = value));
    }
  }
  out.add('Sorted', 'One run covers the whole array.', [
    op({ op: 'range', i: 0, j: a.length - 1 }),
  ]);
  return out.list;
}

function quickSort(values: Value[]): Step<ArrayOp>[] {
  const a = [...values];
  const out = new Steps();
  const sort = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      out.add(`Index ${lo} is final`, 'A part of one value is sorted.', [
        op({ op: 'mark', i: lo, name: 'sorted' }),
      ]);
      return;
    }
    const pivot = a[hi];
    out.add(
      `Partition ${lo}–${hi}`,
      `The pivot is ${pivot}, the last value. Smaller values move to its left.`,
      [op({ op: 'range', i: lo, j: hi }), pointerAt('pivot', hi)],
    );
    let store = lo;
    for (let j = lo; j < hi; j++) {
      const move = less(a[j], pivot);
      out.add(
        `Compare ${j} with the pivot`,
        move
          ? `${a[j]} is smaller than ${pivot}: swap it to index ${store}.`
          : `${a[j]} is not smaller than ${pivot}: leave it.`,
        [
          op({ op: 'compare', i: j, j: hi }),
          ...(move && store !== j ? [op({ op: 'swap', i: store, j })] : []),
        ],
      );
      if (move) {
        [a[store], a[j]] = [a[j], a[store]];
        store++;
      }
    }
    out.add(
      `Place the pivot at ${store}`,
      `Everything left of index ${store} is smaller than ${pivot}; it is final there.`,
      [
        ...(store !== hi ? [op({ op: 'swap', i: store, j: hi })] : []),
        op({ op: 'mark', i: store, name: 'sorted' }),
        pointerAt('pivot', null),
      ],
    );
    [a[store], a[hi]] = [a[hi], a[store]];
    sort(lo, store - 1);
    sort(store + 1, hi);
  };
  sort(0, a.length - 1);
  return out.list;
}

function pairSum(values: Value[], target: number): Step<ArrayOp>[] {
  const out = new Steps();
  let i = 0;
  let j = values.length - 1;
  out.add(
    'Start at both ends',
    `i at the smallest value, j at the largest. Look for two that add up to ${target}.`,
    [pointerAt('i', i), pointerAt('j', j)],
  );
  while (i < j) {
    const sum = num(values[i]) + num(values[j]);
    if (sum === target) {
      out.add('Found the pair', `${values[i]} + ${values[j]} = ${target}.`, [
        op({ op: 'found', i }),
        op({ op: 'found', i: j }),
      ]);
      return out.list;
    }
    const up = sum < target;
    out.add(
      `${values[i]} + ${values[j]} = ${sum}`,
      up
        ? `Too small: only a larger left value can help, so move i right.`
        : `Too large: only a smaller right value can help, so move j left.`,
      [
        op({ op: 'compare', i, j }),
        up ? pointerAt('i', i + 1) : pointerAt('j', j - 1),
      ],
    );
    if (up) i++;
    else j--;
  }
  out.add('No pair', `The pointers met: no two values add up to ${target}.`, [
    op({ op: 'not-found' }),
  ]);
  return out.list;
}

function slidingWindow(values: Value[], k: number): Step<ArrayOp>[] {
  const out = new Steps();
  let sum = 0;
  for (let i = 0; i < k; i++) sum += num(values[i]);
  let best = sum;
  let bestAt = 0;
  out.add(
    'The first window',
    `Add the first ${k} values: ${sum}. That is the best so far.`,
    [op({ op: 'range', i: 0, j: k - 1 })],
  );
  for (let start = 1; start + k <= values.length; start++) {
    const enter = num(values[start + k - 1]);
    const leave = num(values[start - 1]);
    sum += enter - leave;
    const better = sum > best;
    if (better) {
      best = sum;
      bestAt = start;
    }
    out.add(
      `Slide to ${start}–${start + k - 1}`,
      `Add ${enter}, drop ${leave}: ${sum}. ${better ? 'A new best.' : `The best is still ${best}.`}`,
      [op({ op: 'range', i: start, j: start + k - 1 })],
    );
  }
  out.add(
    `The best window: ${best}`,
    `Indexes ${bestAt} to ${bestAt + k - 1} add up to ${best}, found in one pass instead of re-adding every window.`,
    [
      op({ op: 'range', i: bestAt, j: bestAt + k - 1 }),
      op({ op: 'found', i: bestAt }),
    ],
  );
  return out.list;
}

function prefixSum(values: Value[]): Step<ArrayOp>[] {
  const out = new Steps();
  let total = num(values[0]);
  out.add(
    'Start with the first value',
    `The sum of the values up to index 0 is just ${total}.`,
    [pointerAt('i', 0)],
  );
  for (let i = 1; i < values.length; i++) {
    const before = total;
    total += num(values[i]);
    out.add(
      `Running total at ${i}`,
      `${before} + ${values[i]} = ${total}: the sum of everything up to index ${i}.`,
      [pointerAt('i', i), op({ op: 'set', i, value: total })],
    );
  }
  return out.list;
}

function reverse(values: Value[]): Step<ArrayOp>[] {
  const out = new Steps();
  for (let i = 0, j = values.length - 1; i < j; i++, j--) {
    out.add(
      `Swap ${i} and ${j}`,
      `Swap the outer pair ${values[i]} and ${values[j]}, then move both pointers in.`,
      [pointerAt('i', i), pointerAt('j', j), op({ op: 'swap', i, j })],
    );
  }
  out.add('Reversed', 'The pointers met in the middle.', [
    pointerAt('i', null),
    pointerAt('j', null),
  ]);
  return out.list;
}

/**
 * Steps for an array block's `simulate`, in the format the AI would write.
 * Without `simulate`, the block's own steps are returned.
 */
export const simulateArray: Simulator<'array'> = (block: ArrayBlock) => {
  const sim = block.simulate;
  if (!sim) return block.steps;
  const values = block.values;
  const target = sim.target ?? 0;
  switch (sim.algorithm) {
    case 'binary-search':
      return binarySearch(values, target);
    case 'linear-search':
      return linearSearch(values, target);
    case 'bubble-sort':
      return bubbleSort(values);
    case 'insertion-sort':
      return insertionSort(values);
    case 'selection-sort':
      return selectionSort(values);
    case 'merge-sort':
      return mergeSort(values);
    case 'quick-sort':
      return quickSort(values);
    case 'two-pointers-pair-sum':
      return pairSum(values, target);
    case 'sliding-window-max-sum':
      return slidingWindow(values, Math.min(sim.window ?? 1, values.length));
    case 'prefix-sum':
      return prefixSum(values);
    case 'reverse':
      return reverse(values);
  }
};

/** The pointer names a simulated algorithm uses. */
export function simulatedPointers(block: ArrayBlock): string[] {
  switch (block.simulate?.algorithm) {
    case 'binary-search':
      return ['lo', 'hi', 'mid'];
    case 'selection-sort':
      return ['i', 'min'];
    case 'quick-sort':
      return ['pivot'];
    case 'linear-search':
    case 'insertion-sort':
    case 'prefix-sum':
      return ['i'];
    case 'two-pointers-pair-sum':
    case 'reverse':
      return ['i', 'j'];
    default:
      return [];
  }
}
