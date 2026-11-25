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
        path: 'site',
        title: title('site'),
        loadComponent: () =>
          import('./screens/site/site-screen').then((m) => m.SiteScreen),
      },
      {
        path: 'energy',
        title: title('energy'),
        loadComponent: () =>
          import('./screens/energy/energy-screen').then((m) => m.EnergyScreen),
      },
      {
        path: 'calendar',
        title: title('calendar'),
        loadComponent: () =>
          import('./screens/calendar/calendar-screen').then(
            (m) => m.CalendarScreen,
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
        path: 'supply',
        title: title('supply'),
        loadComponent: () =>
          import('./screens/supply/supply-screen').then((m) => m.SupplyScreen),
      },
      {
        path: 'air',
        title: title('air'),
        loadComponent: () =>
          import('./screens/air/air-screen').then((m) => m.AirScreen),
      },
      {
        path: 'operations',
        title: title('operations'),
        loadComponent: () =>
          import('./screens/operations/operations-screen').then(
            (m) => m.OperationsScreen,
          ),
      },
      {
        path: 'data',
        title: title('data'),
        loadComponent: () =>
          import('./screens/data/data-screen').then((m) => m.DataScreen),
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
        path: 'science',
        title: title('science'),
        loadComponent: () =>
          import('./screens/science/science-screen').then(
            (m) => m.ScienceScreen,
          ),
      },
      {
        path: 'report',
        title: title('report'),
        loadComponent: () =>
          import('./screens/report/report-screen').then((m) => m.ReportScreen),
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
