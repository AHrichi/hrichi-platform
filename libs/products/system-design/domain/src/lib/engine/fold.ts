/**
 * Folds the ops of steps 0 to `n` in order; `current` is true for step `n`'s
 * own ops. The shared fold StudyLM uses too (ADR-0025).
 */
export { upTo as foldSteps } from '@ah/shared/steps';
