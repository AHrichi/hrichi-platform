import type { Routes } from '@angular/router';
import { BadgeScreen } from './screens/badge/badge-screen';
import { ClaimScreen } from './screens/claim/claim-screen';
import { WelcomeScreen } from './screens/welcome/welcome-screen';
import { BarqShell } from './shell/barq-shell';

/**
 * BARQ's screens. The badge opens without a connection, so it isn't lazy;
 * sign-up, recovery and the staff counter load on demand.
 */
export const LASERTAG_ROUTES: Routes = [
  {
    path: '',
    component: BarqShell,
    children: [
      { path: '', component: WelcomeScreen },
      { path: 'badge', component: BadgeScreen },
      { path: 'claim', component: ClaimScreen },
      {
        path: 'join',
        loadComponent: () =>
          import('./screens/join/join-screen').then((m) => m.JoinScreen),
      },
      {
        path: 'recover',
        loadComponent: () =>
          import('./screens/recover/recover-screen').then(
            (m) => m.RecoverScreen,
          ),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./screens/staff/staff-screen').then((m) => m.StaffScreen),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
