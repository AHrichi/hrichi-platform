import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/dispatch. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/dispatch/feature').then((m) => m.dispatchRoutes),
  },
];
