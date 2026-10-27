import { Route } from '@angular/router';
import { federatedRoutes, LabFrame } from '@ah/platform/federation';
import { labs } from '@ah/shared/content';

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
  // Each lab's intro is prerendered around its remote (ADR-0014).
  {
    path: 'labs/hello',
    component: LabFrame,
    data: labs['lab-hello'],
    loadChildren: federatedRoutes('lab-hello'),
    title: 'Hello lab · Ahmed Hrichi',
  },
  {
    path: 'labs/orbit',
    component: LabFrame,
    data: labs['lab-orbit'],
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
