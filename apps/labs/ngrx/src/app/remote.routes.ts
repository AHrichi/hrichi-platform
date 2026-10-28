import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /labs/ngrx. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/labs/ngrx/feature').then((m) => m.ngrxLabRoutes),
  },
];
