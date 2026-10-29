import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/studylm. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/studylm/feature').then((m) => m.studyLmRoutes),
  },
];
