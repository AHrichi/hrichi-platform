import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /labs/sky. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@ah/labs/sky/feature').then((m) => m.SkyLabPage),
  },
];
