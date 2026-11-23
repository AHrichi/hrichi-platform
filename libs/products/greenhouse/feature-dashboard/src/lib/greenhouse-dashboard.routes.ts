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
      {
        path: 'performance',
        loadComponent: () =>
          import('./performance/performance-screen').then(
            (m) => m.PerformanceScreen,
          ),
      },
      {
        path: 'absences',
        loadComponent: () =>
          import('./absences/absences-screen').then((m) => m.AbsencesScreen),
      },
      {
        path: 'workers',
        loadComponent: () =>
          import('./setup/workers-screen').then((m) => m.WorkersScreen),
      },
      {
        path: 'badges',
        loadComponent: () =>
          import('./setup/badges-screen').then((m) => m.BadgesScreen),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./setup/teams-screen').then((m) => m.TeamsScreen),
      },
      {
        path: 'greenhouses',
        loadComponent: () =>
          import('./setup/greenhouses-screen').then((m) => m.GreenhousesScreen),
      },
      {
        path: 'people',
        loadComponent: () =>
          import('./people/people-screen').then((m) => m.PeopleScreen),
      },
      { path: '**', redirectTo: 'plan' },
    ],
  },
];
