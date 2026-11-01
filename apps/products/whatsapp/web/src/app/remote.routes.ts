import { Routes } from '@angular/router';

/** Exposed as `./routes`; the shell mounts these under /apps/whatsapp. */
export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/whatsapp/feature').then((m) => m.whatsappRoutes),
  },
];
