import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * A returning visitor's service worker serves the version it cached, and
 * downloads a newer one in the background. Once that is ready, the next
 * in-app navigation loads the target page fresh, so a deploy shows up within
 * one click instead of one whole visit. Call from an injection context.
 */
export function reloadOnNavigationWhenUpdated(): void {
  // Absent in unit tests; disabled in development builds and while prerendering.
  const updates = inject(SwUpdate, { optional: true });
  if (!updates?.isEnabled) {
    return;
  }
  const window = inject(DOCUMENT).defaultView;
  let ready = false;
  updates.versionUpdates
    .pipe(
      filter((event) => event.type === 'VERSION_READY'),
      takeUntilDestroyed(),
    )
    .subscribe(() => (ready = true));
  inject(Router)
    .events.pipe(
      filter((event) => event instanceof NavigationStart),
      takeUntilDestroyed(),
    )
    .subscribe((event) => {
      if (ready && window) {
        ready = false;
        void updates
          .activateUpdate()
          .then(() => window.location.assign(event.url));
      }
    });
}
