import { Route } from '@angular/router';
import { federatedRoutes } from '@ah/platform/federation';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.Home),
    title: 'Ahmed Hrichi · Angular & Full-Stack Developer',
  },
  {
    path: 'labs/hello',
    loadChildren: federatedRoutes('lab-hello'),
    title: 'Hello lab · Ahmed Hrichi',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found').then((m) => m.NotFound),
    title: 'Page not found · Ahmed Hrichi',
  },
];
