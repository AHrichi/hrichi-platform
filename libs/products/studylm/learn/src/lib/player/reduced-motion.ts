import {
  DestroyRef,
  DOCUMENT,
  inject,
  signal,
  type Signal,
} from '@angular/core';

/**
 * Whether the learner asked for less motion, kept up to date. The global CSS
 * switch doesn't reach animations started from script, so the player reads
 * this and changes steps instantly instead.
 */
export function injectReducedMotion(): Signal<boolean> {
  const query = inject(DOCUMENT).defaultView?.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  );
  const reduced = signal(query?.matches ?? false);
  if (query) {
    const update = (event: MediaQueryListEvent) => reduced.set(event.matches);
    query.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() =>
      query.removeEventListener('change', update),
    );
  }
  return reduced.asReadonly();
}
