import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell will mount these under /apps/learning (L4). */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/learning/feature').then((m) => m.LEARNING_ROUTES),
  },
];
