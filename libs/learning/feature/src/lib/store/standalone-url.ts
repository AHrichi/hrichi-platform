import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  computed,
  inject,
  type Signal,
  signal,
} from '@angular/core';
import {
  LEARNING_STANDALONE_ORIGINS,
  resolveStandaloneLearningUrl,
} from '@ah/learning/contracts';

export { LEARNING_STANDALONE_ORIGINS, resolveStandaloneLearningUrl };

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
