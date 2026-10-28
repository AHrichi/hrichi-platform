import { Routes } from '@angular/router';
import { NgrxPracticePadComponent } from './ngrx-practice-pad.component';

export const ngrxLabRoutes: Routes = [
  {
    path: '',
    component: NgrxPracticePadComponent,
    children: [
      {
        path: '',
        redirectTo: 'store-flow',
        pathMatch: 'full',
      },
      {
        path: 'store-flow',
        loadComponent: () =>
          import('./exercises/store-flow/store-flow.component').then(
            (m) => m.StoreFlowComponent,
          ),
      },
      {
        path: 'signal-store',
        loadComponent: () =>
          import('./exercises/signal-store/signal-store.component').then(
            (m) => m.SignalStoreComponent,
          ),
      },
      {
        path: 'effects-cycle',
        loadComponent: () =>
          import('./exercises/effects-cycle/effects-cycle.component').then(
            (m) => m.EffectsCycleComponent,
          ),
      },
      {
        path: 'ngrx-vs-services',
        loadComponent: () =>
          import('./exercises/ngrx-vs-services/ngrx-vs-services.component').then(
            (m) => m.NgRxVsServicesComponent,
          ),
      },
    ],
  },
];
