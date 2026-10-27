import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /labs/rxjs. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/labs/rxjs/feature').then((m) => m.rxjsLabRoutes),
  },
];
