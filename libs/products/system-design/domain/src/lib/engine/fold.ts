/**
 * Folds the ops of steps 0 to `n` in order; `current` is true for step `n`'s
 * own ops. Same contract as `upTo` in `@ah/shared/steps` (ADR-0025).
 *
 * TODO(P1A): once `@ah/shared/steps` is on main, replace this body with
 * `export { upTo as foldSteps } from '@ah/shared/steps';`.
 */
export function foldSteps<TOp>(
  steps: readonly { readonly ops: readonly TOp[] }[],
  n: number,
  apply: (op: TOp, current: boolean) => void,
): void {
  const last = Math.min(n, steps.length - 1);
  for (let s = 0; s <= last; s++) {
    for (const op of steps[s].ops) apply(op, s === last);
  }
}
