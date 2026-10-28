import { Route } from '@angular/router';
import { provideAppMode } from '@ah/platform/app-mode';
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
  {
    path: 'apps',
    loadChildren: () =>
      import('@ah/portfolio/feature-apps').then((m) => m.appsRoutes),
    title: 'Applications & Interactive Labs · Ahmed Hrichi',
  },
  {
    path: 'apps/strategy',
    providers: [provideAppMode('embedded-demo')],
    loadChildren: federatedRoutes('product-strategy'),
    title: 'StrategyApp · Financial Planning & Projections · Ahmed Hrichi',
  },
  {
    path: 'apps/dispatch',
    providers: [provideAppMode('embedded-demo')],
    loadChildren: federatedRoutes('product-dispatch'),
    title:
      'PulseOps · Commercial Operations & Dispatch Control Center · Ahmed Hrichi',
  },
  // The hello demo was replaced by the full applications & labs hub; redirect.
  { path: 'labs/hello', redirectTo: 'apps', pathMatch: 'full' },
  // Each lab's intro is prerendered around its remote (ADR-0014).
  {
    path: 'labs/sky',
    component: LabFrame,
    data: labs['lab-sky'],
    loadChildren: federatedRoutes('lab-sky'),
    title: 'Sky lab: the night sky anywhere · Ahmed Hrichi',
  },
  {
    path: 'labs/rxjs',
    component: LabFrame,
    data: labs['lab-rxjs'],
    loadChildren: federatedRoutes('lab-rxjs'),
    title: 'RxJS Practice Pad · Ahmed Hrichi',
  },
  {
    path: 'labs/ngrx',
    component: LabFrame,
    data: labs['lab-ngrx'],
    loadChildren: federatedRoutes('lab-ngrx'),
    title: 'NgRx State Lab & Architecture Guide · Ahmed Hrichi',
  },
  // The Orbit lab became the Sky lab (ADR-0016); keep old links working.
  { path: 'labs/orbit', redirectTo: 'labs/sky', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found').then((m) => m.NotFound),
    title: 'Page not found · Ahmed Hrichi',
  },
];
