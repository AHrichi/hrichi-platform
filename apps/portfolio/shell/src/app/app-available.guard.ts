import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { isAppEnabled, type PortfolioAppKey } from '@ah/shared/content';

/**
 * Route guard that prevents navigation to hidden/disabled applications or labs.
 * If the app is disabled in PORTFOLIO_APPS_CONFIG, the user is redirected to `/apps`
 * so they are never stranded on an empty or failing remote page.
 */
export function appAvailableGuard(appKey: PortfolioAppKey): CanMatchFn {
  return (_route: Route, _segments: UrlSegment[]) => {
    if (isAppEnabled(appKey)) {
      return true;
    }
    const router = inject(Router);
    return router.createUrlTree(['/apps']);
  };
}
