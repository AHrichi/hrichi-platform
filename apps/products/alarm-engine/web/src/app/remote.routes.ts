import { Routes } from '@angular/router';

export const remoteRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('@ah/products/alarm-engine/feature').then(
        (m) => m.ALARM_ENGINE_ROUTES,
      ),
  },
];
