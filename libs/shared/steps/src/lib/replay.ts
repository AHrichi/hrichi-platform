/** Anything that carries a list of ops to replay, such as a lesson step. */
export interface OpStep<TOp> {
  readonly ops: readonly TOp[];
}

/**
 * Folds the ops of steps 0 to `n` in order. `current` is true for the ops
 * of step `n` itself, for what shows only during its own step.
 */
export function upTo<TOp>(
  steps: readonly OpStep<TOp>[],
  n: number,
  apply: (op: TOp, current: boolean) => void,
): void {
  const last = Math.min(n, steps.length - 1);
  for (let s = 0; s <= last; s++) {
    for (const op of steps[s].ops) apply(op, s === last);
  }
}
