import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/basecamp. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/basecamp/feature').then((m) => m.BASECAMP_ROUTES),
  },
];
