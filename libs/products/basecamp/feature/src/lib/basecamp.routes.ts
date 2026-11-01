import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';
import { BasecampI18n } from './i18n/basecamp-i18n';
import { type BasecampScreen, BasecampShell } from './shell/basecamp-shell';

/** The tab's title in the reader's language. */
function title(screen: BasecampScreen): ResolveFn<string> {
  return () => `${inject(BasecampI18n).t().nav[screen]} · Basecamp`;
}

export const BASECAMP_ROUTES: Routes = [
  {
    path: '',
    component: BasecampShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'trips' },
      {
        path: 'trips',
        title: title('trips'),
        loadComponent: () =>
          import('./screens/trips/trips-screen').then((m) => m.TripsScreen),
      },
      {
        path: 'weather',
        title: title('weather'),
        loadComponent: () =>
          import('./screens/weather/weather-screen').then(
            (m) => m.WeatherScreen,
          ),
      },
      {
        path: 'nights',
        title: title('nights'),
        loadComponent: () =>
          import('./screens/nights/nights-screen').then((m) => m.NightsScreen),
      },
      {
        path: 'packing',
        title: title('packing'),
        loadComponent: () =>
          import('./screens/packing/packing-screen').then(
            (m) => m.PackingScreen,
          ),
      },
      {
        path: 'gear',
        title: title('gear'),
        loadComponent: () =>
          import('./screens/gear/gear-screen').then((m) => m.GearScreen),
      },
      {
        path: 'guide',
        title: title('guide'),
        loadComponent: () =>
          import('./screens/guide/guide-screen').then((m) => m.GuideScreen),
      },
      { path: '**', redirectTo: 'trips' },
    ],
  },
];
