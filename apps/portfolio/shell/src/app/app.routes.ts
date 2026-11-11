import { Route } from '@angular/router';
import { federatedRoutes, LabFrame } from '@ah/platform/federation';
import { labs } from '@ah/shared/content';
import { appAvailableGuard } from './app-available.guard';

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
    canMatch: [appAvailableGuard('strategy')],
    loadChildren: federatedRoutes('product-strategy'),
    title: 'StrategyApp · Financial Planning & Projections · Ahmed Hrichi',
  },
  {
    path: 'apps/dispatch',
    canMatch: [appAvailableGuard('dispatch')],
    loadChildren: federatedRoutes('product-dispatch'),
    title:
      'PulseOps · Commercial Operations & Dispatch Control Center · Ahmed Hrichi',
  },
  {
    path: 'apps/studylm',
    canMatch: [appAvailableGuard('studylm')],
    loadChildren: federatedRoutes('product-studylm'),
    title:
      'StudyLM · AI-Powered Multi-Tier Learning & Drill Arena · Ahmed Hrichi',
  },
  // Keep alias for study
  {
    path: 'apps/study',
    canMatch: [appAvailableGuard('studylm')],
    redirectTo: 'apps/studylm',
    pathMatch: 'full',
  },
  {
    path: 'apps/whatsapp',
    canMatch: [appAvailableGuard('whatsapp')],
    loadChildren: federatedRoutes('product-whatsapp'),
    title:
      'ChatPulse · WhatsApp Chat & AI Relationship Intelligence · Ahmed Hrichi',
  },
  {
    path: 'apps/chatpulse',
    canMatch: [appAvailableGuard('whatsapp')],
    redirectTo: 'apps/whatsapp',
    pathMatch: 'full',
  },
  {
    path: 'apps/lighting',
    canMatch: [appAvailableGuard('lighting')],
    loadChildren: federatedRoutes('product-lighting'),
    title:
      'LuxPath · Public & Solar Street Lighting Field Engineering Platform · Ahmed Hrichi',
  },
  {
    path: 'apps/luxpath',
    canMatch: [appAvailableGuard('lighting')],
    redirectTo: 'apps/lighting',
    pathMatch: 'full',
  },
  {
    path: 'apps/basecamp',
    canMatch: [appAvailableGuard('basecamp')],
    loadChildren: federatedRoutes('product-basecamp'),
    title: 'Basecamp · Camping Trip Planner · Ahmed Hrichi',
  },
  {
    path: 'apps/learning',
    canMatch: [appAvailableGuard('learning')],
    loadChildren: federatedRoutes('product-learning'),
    title: 'Learning Engine · Capture and Daily Review · Ahmed Hrichi',
  },
  {
    path: 'apps/alarm-engine',
    canMatch: [appAvailableGuard('alarm-engine')],
    loadChildren: () =>
      import('@ah/products/alarm-engine/feature').then(
        (m) => m.ALARM_ENGINE_ROUTES,
      ),
    title:
      'Nightly Alarm Decision Engine · Spaced Repetition & Daily Schedules · Ahmed Hrichi',
  },
  {
    path: 'apps/alarm',
    canMatch: [appAvailableGuard('alarm-engine')],
    redirectTo: 'apps/alarm-engine',
    pathMatch: 'full',
  },
  {
    path: 'apps/nightly-alarm',
    canMatch: [appAvailableGuard('alarm-engine')],
    redirectTo: 'apps/alarm-engine',
    pathMatch: 'full',
  },
  {
    path: 'apps/solarlux',
    canMatch: [appAvailableGuard('lighting')],
    redirectTo: 'apps/lighting',
    pathMatch: 'full',
  },
  {
    path: 'apps/autosphere',
    canMatch: [appAvailableGuard('autosphere')],
    loadChildren: () =>
      import('@ah/products/autosphere/feature').then(
        (m) => m.AUTOSPHERE_ROUTES,
      ),
    title:
      'AutoSphere · Digital Showroom & Dynamic Configurator · Ahmed Hrichi',
  },
  // The hello demo was replaced by the full applications & labs hub; redirect.
  { path: 'labs/hello', redirectTo: 'apps', pathMatch: 'full' },
  // Each lab's intro is prerendered around its remote (ADR-0014).
  {
    path: 'labs/sky',
    canMatch: [appAvailableGuard('sky')],
    component: LabFrame,
    data: { ...labs['lab-sky'], labKey: 'lab-sky' },
    loadChildren: federatedRoutes('lab-sky'),
    title: 'Sky lab: the night sky anywhere · Ahmed Hrichi',
  },
  {
    path: 'labs/rxjs',
    canMatch: [appAvailableGuard('rxjs')],
    component: LabFrame,
    data: { ...labs['lab-rxjs'], labKey: 'lab-rxjs' },
    loadChildren: federatedRoutes('lab-rxjs'),
    title: 'RxJS Practice Pad · Ahmed Hrichi',
  },
  {
    path: 'labs/ngrx',
    canMatch: [appAvailableGuard('ngrx')],
    component: LabFrame,
    data: { ...labs['lab-ngrx'], labKey: 'lab-ngrx' },
    loadChildren: federatedRoutes('lab-ngrx'),
    title: 'NgRx State Lab & Architecture Guide · Ahmed Hrichi',
  },
  // The Orbit lab became the Sky lab (ADR-0016); keep old links working.
  {
    path: 'labs/orbit',
    canMatch: [appAvailableGuard('sky')],
    redirectTo: 'labs/sky',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found').then((m) => m.NotFound),
    title: 'Page not found · Ahmed Hrichi',
  },
];
