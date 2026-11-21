import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/system-design. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/system-design/feature').then(
        (m) => m.SYSTEM_DESIGN_ROUTES,
      ),
  },
];
