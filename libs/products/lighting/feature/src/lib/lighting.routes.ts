import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';
import { LuxPathI18n } from './i18n/luxpath-i18n';
import { type LuxPathScreen, LuxPathShell } from './shell/luxpath-shell';

/** The tab's title in the reader's language. */
function title(screen: LuxPathScreen): ResolveFn<string> {
  return () => `${inject(LuxPathI18n).t().nav[screen]} · LuxPath`;
}

export const LIGHTING_ROUTES: Routes = [
  {
    path: '',
    component: LuxPathShell,
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
        path: 'calculations',
        title: title('calculations'),
        loadComponent: () =>
          import('./screens/calculations/calculations-screen').then(
            (m) => m.CalculationsScreen,
          ),
      },
      {
        path: 'camera',
        title: title('camera'),
        loadComponent: () =>
          import('./screens/camera/camera-screen').then((m) => m.CameraScreen),
      },
      {
        path: 'map',
        title: title('map'),
        loadComponent: () =>
          import('./screens/map/map-screen').then((m) => m.MapScreen),
      },
      {
        path: 'verticality',
        title: title('verticality'),
        loadComponent: () =>
          import('./screens/verticality/verticality-screen').then(
            (m) => m.VerticalityScreen,
          ),
      },
      {
        path: 'concrete',
        title: title('concrete'),
        loadComponent: () =>
          import('./screens/concrete/concrete-screen').then(
            (m) => m.ConcreteScreen,
          ),
      },
      {
        path: 'standards',
        title: title('standards'),
        loadComponent: () =>
          import('./screens/standards/standards-screen').then(
            (m) => m.StandardsScreen,
          ),
      },
      {
        path: 'materials',
        title: title('materials'),
        loadComponent: () =>
          import('./screens/materials/materials-screen').then(
            (m) => m.MaterialsScreen,
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
