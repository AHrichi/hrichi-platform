import type { Routes } from '@angular/router';
import { LearningShell } from './shell/learning-shell';

export const LEARNING_ROUTES: Routes = [
  {
    path: '',
    component: LearningShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'today' },
      {
        path: 'today',
        title: 'Today · Learning',
        loadComponent: () =>
          import('./screens/today/today-screen').then((m) => m.TodayScreen),
      },
      {
        path: 'inbox',
        title: 'Inbox · Learning',
        loadComponent: () =>
          import('./screens/inbox/inbox-screen').then((m) => m.InboxScreen),
      },
      {
        path: 'concepts',
        title: 'Library · Learning',
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
      {
        // A host app asks to link (design §9); reached from the host only.
        path: 'connect',
        title: 'Link an app · Learning',
        loadComponent: () =>
          import('./screens/connect/connect-screen').then(
            (m) => m.ConnectScreen,
          ),
      },
      {
        path: 'guide',
        title: 'Guide · Learning',
        loadComponent: () =>
          import('./screens/guide/guide-screen').then((m) => m.GuideScreen),
      },
      {
        path: 'garden',
        title: 'Garden · Learning',
        loadComponent: () =>
          import('./screens/garden/garden-screen').then((m) => m.GardenScreen),
      },
      {
        path: 'settings',
        title: 'Settings · Learning',
        loadComponent: () =>
          import('./screens/settings/settings-screen').then(
            (m) => m.SettingsScreen,
          ),
      },
      { path: '**', redirectTo: 'today' },
    ],
  },
];
