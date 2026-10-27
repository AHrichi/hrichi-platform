import { Route } from '@angular/router';
import { federatedRoutes } from '@ah/platform/federation';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('@ah/portfolio/feature-home').then((m) => m.homeRoutes),
  },
  {
    path: 'work',
    loadChildren: () =>
      import('@ah/portfolio/feature-work').then((m) => m.workRoutes),
  },
  {
    path: 'experience',
    loadChildren: () =>
      import('@ah/portfolio/feature-experience').then(
        (m) => m.experienceRoutes,
      ),
  },
  {
    path: 'services',
    loadChildren: () =>
      import('@ah/portfolio/feature-services').then((m) => m.servicesRoutes),
  },
  {
    path: 'contact',
    loadChildren: () =>
      import('@ah/portfolio/feature-services').then((m) => m.contactRoutes),
  },
  {
    path: 'cv',
    loadChildren: () =>
      import('@ah/portfolio/feature-cv').then((m) => m.cvRoutes),
  },
  {
    path: 'labs/hello',
    loadChildren: federatedRoutes('lab-hello'),
    title: 'Hello lab · Ahmed Hrichi',
  },
  {
    path: 'labs/orbit',
    loadChildren: federatedRoutes('lab-orbit'),
    title: 'Orbit lab: live satellites · Ahmed Hrichi',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found').then((m) => m.NotFound),
    title: 'Page not found · Ahmed Hrichi',
  },
];
