import type { Step } from '../spec/step';

/** Collects simulated steps, with ids that are unique and kebab-case. */
export class StepList<TOp> {
  readonly list: Step<TOp>[] = [];

  add(title: string, narration: string, ops: TOp[]): void {
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

/**
 * Folds the ops of steps 0 to `n` in order. `current` is true for the ops
 * of step `n` itself, for what shows only during its own step.
 */
export function upTo<TOp>(
  steps: readonly Step<TOp>[],
  n: number,
  apply: (op: TOp, current: boolean) => void,
): void {
  const last = Math.min(n, steps.length - 1);
  for (let s = 0; s <= last; s++) {
    for (const op of steps[s].ops) apply(op, s === last);
  }
}
