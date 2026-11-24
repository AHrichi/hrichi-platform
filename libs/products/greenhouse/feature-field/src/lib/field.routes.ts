import type { Routes } from '@angular/router';
import { FieldShell } from './shell/field-shell';

/**
 * The field app. `/log/:greenhouseId` and `/hygiene/:greenhouseId` bind to
 * their screen's input; the shell
 * keeps the page title in the supervisor's language.
 */
export const FIELD_ROUTES: Routes = [
  {
    path: '',
    component: FieldShell,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./screens/home/home-screen').then((m) => m.HomeScreen),
      },
      {
        path: 'log/:greenhouseId',
        loadComponent: () =>
          import('./screens/log/log-screen').then((m) => m.LogScreen),
      },
      {
        path: 'hygiene/:greenhouseId',
        loadComponent: () =>
          import('./screens/hygiene/hygiene-screen').then(
            (m) => m.HygieneScreen,
          ),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
