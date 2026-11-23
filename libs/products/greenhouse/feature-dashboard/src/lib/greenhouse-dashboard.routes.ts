import type { Routes } from '@angular/router';
import { DashboardShell } from './shell/dashboard-shell';

/** The manager's dashboard; the shell mounts it under /apps/greenhouse. */
export const GREENHOUSE_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'plan' },
      {
        path: 'plan',
        loadComponent: () =>
          import('./plan/plan-screen').then((m) => m.PlanScreen),
      },
      { path: '**', redirectTo: 'plan' },
    ],
  },
];
