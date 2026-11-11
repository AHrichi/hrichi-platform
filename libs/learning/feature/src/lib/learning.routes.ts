import type { Routes } from '@angular/router';
import { LearningShell } from './shell/learning-shell';

export const LEARNING_ROUTES: Routes = [
  {
    path: '',
    component: LearningShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inbox' },
      {
        path: 'inbox',
        title: 'Inbox · Learning',
        loadComponent: () =>
          import('./screens/inbox/inbox-screen').then((m) => m.InboxScreen),
      },
      {
        path: 'concepts',
        title: 'Concepts · Learning',
        loadComponent: () =>
          import('./screens/concepts/concepts-screen').then(
            (m) => m.ConceptsScreen,
          ),
      },
      {
        path: 'devices',
        title: 'Devices · Learning',
        loadComponent: () =>
          import('./screens/devices/devices-screen').then(
            (m) => m.DevicesScreen,
          ),
      },
      { path: '**', redirectTo: 'inbox' },
    ],
  },
];
