import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/serracalc. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/serracalc/feature').then((m) => m.SERRACALC_ROUTES),
  },
];
