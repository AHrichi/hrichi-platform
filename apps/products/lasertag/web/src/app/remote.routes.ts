import { Routes } from '@angular/router';

/** Exposed as `./routes`; standalone for now; the portfolio will mount them later. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/lasertag/feature').then((m) => m.LASERTAG_ROUTES),
  },
];
