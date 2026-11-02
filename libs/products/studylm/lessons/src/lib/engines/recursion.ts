import type { BlockOf } from '../spec/blocks';
import type { Step } from '../spec/step';
import type { OpOf } from './contracts';
import { StepList, upTo } from './steps';

type RecursionBlock = BlockOf<'recursion-tree'>;
type CallOp = OpOf<'recursion-tree'>;
type Call = RecursionBlock['calls'][number];

export type CallStatus = 'waiting' | 'open' | 'returned' | 'memo';

export interface RecursionState {
  status: Record<string, CallStatus>;
  values: Record<string, string>;
  /** The open calls, outermost first: the call stack. */
  stack: string[];
  /** This step only. */
  active: string[];
}

/** A recursion block with its calls and steps, computed when simulated. */
export interface PlayedRecursion {
  calls: Call[];
  steps: Step<CallOp>[];
}

const op = (o: CallOp['op'], call: string, value: string | null = null) => ({
  op: o,
  call,
  value,
});

export function recursionStateAt(
  block: RecursionBlock,
  n: number,
  played: PlayedRecursion = simulateRecursion(block),
): RecursionState {
  const state: RecursionState = {
    status: Object.fromEntries(played.calls.map((c) => [c.id, 'waiting'])),
    values: {},
    stack: [],
    active: [],
  };
  upTo(played.steps, n, (o, current) => {
    if (!o.call) return;
    if (o.op === 'call') {
      state.status[o.call] = 'open';
      state.stack.push(o.call);
    } else {
      state.status[o.call] = o.op === 'memo-hit' ? 'memo' : 'returned';
      state.values[o.call] = o.value ?? '';
      if (o.op === 'return') state.stack.pop();
    }
    if (current) state.active.push(o.call);
  });
  return state;
}

/** The calls and steps for `simulate`; the block's own otherwise. */
export function simulateRecursion(block: RecursionBlock): PlayedRecursion {
  return block.simulate
    ? buildPlayed(block.simulate)
    : { calls: block.calls, steps: block.steps };
}

/**
 * The simulation, written as an explicit walk: each call either answers at
 * once (a base case or a cache hit) or opens, calls its children in order,
 * and returns their combination.
 */
function buildPlayed(
  sim: NonNullable<RecursionBlock['simulate']>,
): PlayedRecursion {
  const calls: Call[] = [];
  const out = new StepList<CallOp>();
  const cache = new Map<string, string>();

  interface Plan {
    label: string;
    /** Child calls, or null for a base case. */
    children: (() => Plan)[] | null;
    combine: (values: number[]) => number;
    base: number;
    why: string;
  }

  const visit = (plan: Plan, parent: string | null): number => {
    const id = `c${calls.length + 1}`;
    calls.push({ id, label: plan.label, parent });
    if (sim.memo && cache.has(plan.label)) {
      const value = cache.get(plan.label) as string;
      out.add(
        `${plan.label} from the cache`,
        `${plan.label} was worked out before: the cache answers ${value} with no more calls.`,
        [op('memo-hit', id, value)],
      );
      return Number(value);
    }
    if (!plan.children) {
      out.add(plan.label, plan.why, [
        op('call', id),
        op('return', id, String(plan.base)),
      ]);
      if (sim.memo) cache.set(plan.label, String(plan.base));
      return plan.base;
    }
    out.add(`Call ${plan.label}`, plan.why, [op('call', id)]);
    const values = plan.children.map((child) => visit(child(), id));
    const value = plan.combine(values);
    out.add(
      `${plan.label} returns ${value}`,
      `With its calls answered, ${plan.label} = ${value}.`,
      [op('return', id, String(value))],
    );
    if (sim.memo) cache.set(plan.label, String(value));
    return value;
  };

  const fib = (k: number): Plan =>
    k < 2
      ? {
          label: `fib(${k})`,
          children: null,
          combine: () => k,
          base: k,
          why: `fib(${k}) is a base case: ${k}.`,
        }
      : {
          label: `fib(${k})`,
          children: [() => fib(k - 1), () => fib(k - 2)],
          combine: ([a, b]) => a + b,
          base: 0,
          why: `fib(${k}) = fib(${k - 1}) + fib(${k - 2}).`,
        };
  const fact = (k: number): Plan =>
    k <= 1
      ? {
          label: `fact(${k})`,
          children: null,
          combine: () => 1,
          base: 1,
          why: `fact(${k}) is a base case: 1.`,
        }
      : {
          label: `fact(${k})`,
          children: [() => fact(k - 1)],
          combine: ([a]) => k * a,
          base: 0,
          why: `fact(${k}) = ${k} × fact(${k - 1}).`,
        };
  // 2^k by halving: one call per halving, so about log k calls.
  const power = (k: number): Plan =>
    k === 0
      ? {
          label: 'pow(2, 0)',
          children: null,
          combine: () => 1,
          base: 1,
          why: 'Anything to the power 0 is 1.',
        }
      : {
          label: `pow(2, ${k})`,
          children: [() => power(Math.floor(k / 2))],
          combine: ([half]) => half * half * (k % 2 ? 2 : 1),
          base: 0,
          why:
            k % 2
              ? `${k} is odd: pow(2, ${k}) = 2 × pow(2, ${Math.floor(k / 2)})².`
              : `pow(2, ${k}) = pow(2, ${k / 2})², so only half as far to go.`,
        };
  // Subsets of {1..n}: each call decides one element, in or out.
  const subsets = (i: number, chosen: number[]): Plan =>
    i > sim.n
      ? {
          label: `{${chosen.join(',')}}`,
          children: null,
          combine: () => 1,
          base: 1,
          why: `Every element is decided: {${chosen.join(', ')}} is one subset.`,
        }
      : {
          label:
            i === 1 && !chosen.length
              ? `sub(${sim.n})`
              : `${i}? {${chosen.join(',')}}`,
          children: [
            () => subsets(i + 1, [...chosen, i]),
            () => subsets(i + 1, chosen),
          ],
          combine: ([a, b]) => a + b,
          base: 0,
          why: `Decide ${i}: one branch takes it, the other leaves it out.`,
        };

  const root = {
    fibonacci: () => fib(sim.n),
    factorial: () => fact(sim.n),
    power: () => power(sim.n),
    subsets: () => subsets(1, []),
  }[sim.algorithm]();
  visit(root, null);
  return { calls, steps: out.list };
}
