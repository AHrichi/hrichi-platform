import type { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell will mount these under /apps/greenhouse. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/greenhouse/feature-dashboard').then(
        (m) => m.GREENHOUSE_DASHBOARD_ROUTES,
      ),
  },
];
