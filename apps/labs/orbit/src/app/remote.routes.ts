import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /labs/orbit. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@ah/labs/orbit/feature').then((m) => m.OrbitLabPage),
  },
];
