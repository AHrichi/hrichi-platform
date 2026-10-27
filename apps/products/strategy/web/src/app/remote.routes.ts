import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/strategy. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/strategy/feature').then((m) => m.strategyRoutes),
  },
];
