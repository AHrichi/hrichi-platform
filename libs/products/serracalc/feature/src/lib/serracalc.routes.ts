import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';
import { SerraI18n } from './i18n/serra-i18n';
import { type SerraScreen, SerraShell } from './shell/serra-shell';

/** The tab's title in the reader's language. */
function title(screen: SerraScreen): ResolveFn<string> {
  return () => `${inject(SerraI18n).t().nav[screen]} · SerraCalc`;
}

export const SERRACALC_ROUTES: Routes = [
  {
    path: '',
    component: SerraShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projects' },
      {
        path: 'projects',
        title: title('projects'),
        loadComponent: () =>
          import('./screens/projects/projects-screen').then(
            (m) => m.ProjectsScreen,
          ),
      },
      {
        path: 'greenhouse',
        title: title('greenhouse'),
        loadComponent: () =>
          import('./screens/greenhouse/greenhouse-screen').then(
            (m) => m.GreenhouseScreen,
          ),
      },
      {
        path: 'heating',
        title: title('heating'),
        loadComponent: () =>
          import('./screens/heating/heating-screen').then(
            (m) => m.HeatingScreen,
          ),
      },
      {
        path: 'cooling',
        title: title('cooling'),
        loadComponent: () =>
          import('./screens/cooling/cooling-screen').then(
            (m) => m.CoolingScreen,
          ),
      },
      {
        path: 'water',
        title: title('water'),
        loadComponent: () =>
          import('./screens/water/water-screen').then((m) => m.WaterScreen),
      },
      {
        path: 'climate',
        title: title('climate'),
        loadComponent: () =>
          import('./screens/climate/climate-screen').then(
            (m) => m.ClimateScreen,
          ),
      },
      {
        path: 'guide',
        title: title('guide'),
        loadComponent: () =>
          import('./screens/guide/guide-screen').then((m) => m.GuideScreen),
      },
      { path: '**', redirectTo: 'projects' },
    ],
  },
];
