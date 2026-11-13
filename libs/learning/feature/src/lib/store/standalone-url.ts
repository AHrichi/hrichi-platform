import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  inject,
  type Signal,
  signal,
} from '@angular/core';

/**
 * Standalone origins for the Learning Engine (`product-learning` in
 * `tools/federation/remotes.json`). Used inside embedded-demo notices so
 * learners can jump straight to the full standalone app.
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

/**
 * Provides the standalone Learning Engine URL without causing SSR hydration
 * mismatches by upgrading to localhost only after browser render.
 */
export function injectStandaloneLearningUrl(): Signal<string> {
  const doc = inject(DOCUMENT, { optional: true });
  const isLocal = signal(false);

  afterNextRender(() => {
    const host = doc?.defaultView?.location.hostname ?? '';
    isLocal.set(host === 'localhost' || host === '127.0.0.1');
  });

  return computed(() => resolveStandaloneLearningUrl(isLocal()));
}
