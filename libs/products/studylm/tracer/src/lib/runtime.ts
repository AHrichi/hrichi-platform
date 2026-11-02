/**
 * What traced code gets in place of the browser's timers, microtasks and
 * Promise: a virtual event loop, so the run is deterministic, never waits,
 * and every scheduling step can be recorded.
 */

export type LoopOp =
  | 'push-stack'
  | 'pop-stack'
  | 'web-api'
  | 'queue-task'
  | 'queue-microtask'
  | 'run-task'
  | 'run-microtask'
  | 'log';

export interface LoopEvent {
  op: LoopOp;
  label: string | null;
}

interface Job {
  label: string;
  run: () => void;
}

/** Thrown inside the run when the step budget is spent. */
export class BudgetSpent extends Error {
  constructor() {
    super('The run was stopped after too many steps.');
  }
}

export class VirtualLoop {
  readonly events: LoopEvent[] = [];
  private readonly microtasks: Job[] = [];
  private timers: { at: number; seq: number; job: Job; id: number }[] = [];
  private seq = 0;
  private now = 0;

  record(op: LoopOp, label: string | null): void {
    this.events.push({ op, label });
  }

  queueMicrotask(label: string, run: () => void): void {
    this.record('queue-microtask', label);
    this.microtasks.push({ label, run });
  }

  setTimeout(label: string, run: () => void, ms: number): number {
    const id = ++this.seq;
    this.record('web-api', `${label} (${ms} ms)`);
    this.timers.push({
      at: this.now + Math.max(0, ms),
      seq: id,
      job: { label, run },
      id,
    });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers = this.timers.filter((t) => t.id !== id);
  }

  /**
   * After the script: every microtask, then the next timer as a task, then
   * its microtasks, and so on. `guard` throws once the budget is spent.
   */
  drain(guard: () => void): void {
    for (;;) {
      while (this.microtasks.length) {
        guard();
        const job = this.microtasks.shift() as Job;
        this.record('run-microtask', job.label);
        try {
          job.run();
        } finally {
          this.record('pop-stack', null);
        }
      }
      if (!this.timers.length) return;
      guard();
      this.timers.sort((a, b) => a.at - b.at || a.seq - b.seq);
      const timer = this.timers.shift() as (typeof this.timers)[number];
      this.now = timer.at;
      this.record('queue-task', timer.job.label);
      this.record('run-task', timer.job.label);
      try {
        timer.job.run();
      } finally {
        this.record('pop-stack', null);
      }
    }
  }
}

const labelOf = (fn: unknown, fallback: string) =>
  typeof fn === 'function' && fn.name ? fn.name : fallback;

/** A Promise whose reactions run on the virtual loop's microtask queue. */
export function promiseOn(loop: VirtualLoop) {
  type State = 'pending' | 'fulfilled' | 'rejected';
  type Reaction = () => void;

  class VirtualPromise<T = unknown> {
    private state: State = 'pending';
    private value: unknown;
    private reactions: Reaction[] = [];

    constructor(
      executor: (
        resolve: (value?: T | PromiseLike<T>) => void,
        reject: (reason?: unknown) => void,
      ) => void,
    ) {
      let done = false;
      const resolve = (value?: T | PromiseLike<T>) => {
        if (done) return;
        done = true;
        this.adopt(value);
      };
      const reject = (reason?: unknown) => {
        if (done) return;
        done = true;
        this.settle('rejected', reason);
      };
      try {
        executor(resolve, reject);
      } catch (error) {
        if (error instanceof BudgetSpent) throw error;
        reject(error);
      }
    }

    private adopt(value: unknown): void {
      const then =
        value && (typeof value === 'object' || typeof value === 'function')
          ? (value as { then?: unknown }).then
          : undefined;
      if (typeof then === 'function') {
        loop.queueMicrotask('resolve thenable', () =>
          then.call(
            value,
            (v: unknown) => this.adopt(v),
            (r: unknown) => this.settle('rejected', r),
          ),
        );
        return;
      }
      this.settle('fulfilled', value);
    }

    private settle(state: State, value: unknown): void {
      if (this.state !== 'pending') return;
      this.state = state;
      this.value = value;
      for (const reaction of this.reactions) reaction();
      this.reactions = [];
    }

    then<R1 = T, R2 = never>(
      onFulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
      onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
    ): VirtualPromise<R1 | R2> {
      return new VirtualPromise<R1 | R2>((resolve, reject) => {
        const react = () => {
          const fulfilled = this.state === 'fulfilled';
          const handler = fulfilled ? onFulfilled : onRejected;
          loop.queueMicrotask(
            labelOf(handler, fulfilled ? 'then callback' : 'catch callback'),
            () => {
              if (typeof handler !== 'function') {
                if (fulfilled) resolve(this.value as R1);
                else reject(this.value);
                return;
              }
              try {
                resolve((handler as (v: unknown) => R1)(this.value));
              } catch (error) {
                if (error instanceof BudgetSpent) throw error;
                reject(error);
              }
            },
          );
        };
        if (this.state === 'pending') this.reactions.push(react);
        else react();
      });
    }

    catch<R = never>(
      onRejected?: ((reason: unknown) => R | PromiseLike<R>) | null,
    ) {
      return this.then(undefined, onRejected);
    }

    finally(onFinally?: (() => void) | null) {
      return this.then(
        (value) => {
          onFinally?.();
          return value;
        },
        (reason) => {
          onFinally?.();
          throw reason;
        },
      );
    }

    static resolve<V>(value?: V): VirtualPromise<V> {
      return value instanceof VirtualPromise
        ? value
        : new VirtualPromise<V>((resolve) => resolve(value as V));
    }

    static reject(reason?: unknown): VirtualPromise<never> {
      return new VirtualPromise<never>((_, reject) => reject(reason));
    }

    static all(values: unknown[]): VirtualPromise<unknown[]> {
      return new VirtualPromise<unknown[]>((resolve, reject) => {
        const out: unknown[] = [];
        let left = values.length;
        if (!left) resolve(out);
        values.forEach((value, i) =>
          VirtualPromise.resolve(value).then((v) => {
            out[i] = v;
            if (--left === 0) resolve(out);
          }, reject),
        );
      });
    }
  }

  return VirtualPromise;
}

/** A value as the console would show it, kept short. */
export function show(value: unknown, depth = 0): string {
  if (typeof value === 'string') return depth ? JSON.stringify(value) : value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') return `ƒ ${value.name || 'anonymous'}`;
  if (typeof value !== 'object') return String(value);
  if (depth > 1) return Array.isArray(value) ? '[…]' : '{…}';
  if (Array.isArray(value)) {
    const items = value.slice(0, 8).map((v) => show(v, depth + 1));
    return `[${items.join(', ')}${value.length > 8 ? ', …' : ''}]`;
  }
  if (value instanceof Map) return `Map(${value.size})`;
  if (value instanceof Set) return `Set(${value.size})`;
  const entries = Object.entries(value as object).slice(0, 6);
  return `{ ${entries.map(([k, v]) => `${k}: ${show(v, depth + 1)}`).join(', ')}${
    Object.keys(value as object).length > 6 ? ', …' : ''
  } }`;
}
