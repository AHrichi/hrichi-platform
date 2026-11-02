import Sval from 'sval';
import { HOOKS, instrument } from './instrument';
import {
  BudgetSpent,
  type LoopEvent,
  promiseOn,
  show,
  VirtualLoop,
} from './runtime';

/** Calls deeper than this stop the run as runaway recursion. */
const MAX_DEPTH = 200;

export const UNSUPPORTED_AWAIT =
  'Code with await can’t be run here yet; the lesson shows the written steps.';

/** One moment of the run: the line about to run and the state before it. */
export interface ExecutedFrame {
  line: number;
  vars: { scope: string; name: string; value: string }[];
  stack: string[];
  output: string;
}

export interface RunResult {
  /** The first `maxFrames` frames. */
  frames: ExecutedFrame[];
  /** How many frames the whole run had. */
  totalFrames: number;
  /** Everything printed, one line per console.log. */
  output: string;
  /** True when the step budget stopped the run. */
  truncated: boolean;
  /** What the program threw, if anything. */
  error: string | null;
  /** The event loop's moves, in order: script, logs, timers, microtasks. */
  events: LoopEvent[];
}

export interface RunOptions {
  /** A call to run after the code, such as "binarySearch([1, 3], 3)". */
  call?: string | null;
  /** Hook calls allowed before the run is stopped. */
  budget?: number;
  maxFrames?: number;
  /** Variables shown per frame, innermost scope first. */
  maxVars?: number;
  maxStack?: number;
}

/**
 * Runs JavaScript and records it, without eval: acorn instruments the code
 * and Sval interprets it. Timers, microtasks and Promise run on a virtual
 * loop, so the result is the same every time and nothing waits. The budget
 * guarantees an end, even for an infinite loop or runaway recursion.
 */
export function runJavaScript(
  code: string,
  options: RunOptions = {},
): RunResult {
  const {
    call = null,
    budget = 2000,
    maxFrames = 40,
    maxVars = 12,
    maxStack = 8,
  } = options;
  const lines = code.split('\n').length;
  const loop = new VirtualLoop();
  const frames: ExecutedFrame[] = [];
  const stack: string[] = [];
  const printed: string[] = [];
  let spent = 0;
  let totalFrames = 0;

  const guard = () => {
    if (++spent > budget) throw new BudgetSpent();
  };

  const frame = (
    line: number,
    groups: [string, [string, () => unknown][]][],
  ) => {
    guard();
    if (line === 0) return;
    totalFrames++;
    if (frames.length >= maxFrames) return;
    const vars: ExecutedFrame['vars'] = [];
    // Innermost scope first: it's what the line is working with.
    for (const [scope, getters] of [...groups].reverse()) {
      for (const [name, get] of getters) {
        if (vars.length >= maxVars) break;
        let value: unknown;
        try {
          value = get();
        } catch {
          continue; // Declared below, not yet initialised.
        }
        if (typeof value === 'function' || value === undefined) continue;
        vars.push({ scope, name, value: show(value, 1) });
      }
    }
    frames.push({
      line,
      vars,
      stack: stack.slice(-maxStack),
      output: printed.join('\n'),
    });
  };

  const VirtualPromise = promiseOn(loop);
  const sandbox = {
    [HOOKS.frame]: frame,
    [HOOKS.enter]: (name: string) => {
      guard();
      // Runaway recursion would overflow the interpreter's own stack first.
      if (stack.length >= MAX_DEPTH) throw new BudgetSpent();
      stack.push(name);
    },
    [HOOKS.exit]: () => {
      stack.pop();
    },
    [HOOKS.ret]: (value: unknown) => {
      stack.pop();
      return value;
    },
    console: {
      log: (...args: unknown[]) => {
        const text = args.map((a) => show(a)).join(' ');
        printed.push(text);
        loop.record('log', text.slice(0, 48));
      },
    },
    setTimeout: (fn: () => void, ms = 0) =>
      loop.setTimeout(fn?.name || 'callback', () => fn(), Number(ms) || 0),
    clearTimeout: (id: number) => loop.clearTimeout(id),
    queueMicrotask: (fn: () => void) =>
      loop.queueMicrotask(fn?.name || 'microtask', () => fn()),
    Promise: VirtualPromise,
  };

  let truncated = false;
  let error: string | null = null;
  // The interpreter resumes `await` on the real Promise, outside the
  // virtual loop, so its continuations would be lost: say so instead.
  if (/\bawait\b/.test(code)) {
    return {
      frames: [],
      totalFrames: 0,
      output: '',
      truncated: false,
      error: UNSUPPORTED_AWAIT,
      events: [],
    };
  }
  try {
    const source = instrument(call ? `${code}\n${call};` : code, lines);
    const interpreter = new Sval({ ecmaVer: 'latest', sandBox: true });
    interpreter.import(sandbox);
    loop.record('push-stack', 'script');
    try {
      interpreter.run(source);
    } finally {
      loop.record('pop-stack', null);
    }
    loop.drain(guard);
  } catch (thrown) {
    if (thrown instanceof BudgetSpent) truncated = true;
    else
      error =
        thrown instanceof Error
          ? `${thrown.name}: ${thrown.message}`
          : String(thrown);
  }

  return {
    frames,
    totalFrames,
    output: printed.join('\n'),
    truncated,
    error,
    events: loop.events,
  };
}
