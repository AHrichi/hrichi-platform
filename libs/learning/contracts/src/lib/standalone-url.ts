/**
 * Standalone origins for the Learning Engine (`product-learning` in
 * `tools/federation/remotes.json`). Used both by embedded demos and host
 * apps linking directly to the full standalone app.
 */
export const LEARNING_STANDALONE_ORIGINS = {
  dev: 'http://localhost:4311',
  prod: 'https://product-learning.ahmed-hrichi.workers.dev',
} as const;

/** Resolves the standalone Learning Engine URL for local vs production hosts. */
export function resolveStandaloneLearningUrl(isLocalHost: boolean): string {
  return isLocalHost
    ? LEARNING_STANDALONE_ORIGINS.dev
    : LEARNING_STANDALONE_ORIGINS.prod;
}
