import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/lighting. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/lighting/feature').then((m) => m.LIGHTING_ROUTES),
  },
];
