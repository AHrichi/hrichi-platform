import { Routes } from '@angular/router';
import { RxjsPracticePadComponent } from './rxjs-practice-pad.component';

export const rxjsLabRoutes: Routes = [
  {
    path: '',
    component: RxjsPracticePadComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'error-handling',
      },
      {
        path: 'error-handling',
        loadComponent: () =>
          import('./exercises/error-handling/error-handling.component').then(
            (m) => m.ErrorHandlingComponent,
          ),
        title: 'RxJS | Error Handling',
      },
      {
        path: 'combining-streams',
        loadComponent: () =>
          import(
            './exercises/combining-streams/combining-streams.component'
          ).then((m) => m.CombiningStreamsComponent),
        title: 'RxJS | Combining Streams',
      },
      {
        path: 'transforming-streams',
        loadComponent: () =>
          import(
            './exercises/transforming-streams/transforming-streams.component'
          ).then((m) => m.TransformingStreamsComponent),
        title: 'RxJS | Transforming Streams',
      },
      {
        path: 'sharing-data',
        loadComponent: () =>
          import('./exercises/sharing-data/sharing-data.component').then(
            (m) => m.SharingDataComponent,
          ),
        title: 'RxJS | Sharing Data',
      },
      {
        path: 'signals',
        loadComponent: () =>
          import('./exercises/signals/signals.component').then(
            (m) => m.SignalsComponent,
          ),
        title: 'Angular | Signals',
      },
      {
        path: 'rxjs-vs-signals',
        loadComponent: () =>
          import('./exercises/rxjs-vs-signals/rxjs-vs-signals.component').then(
            (m) => m.RxjsVsSignalsComponent,
          ),
        title: 'Angular | RxJS vs Signals',
      },
      {
        path: 'multicasting',
        loadComponent: () =>
          import('./exercises/multicasting/multicasting.component').then(
            (m) => m.MulticastingComponent,
          ),
        title: 'RxJS | Multicasting',
      },
      {
        path: 'reactive-caching',
        loadComponent: () =>
          import(
            './exercises/reactive-caching/reactive-caching.component'
          ).then((m) => m.ReactiveCachingComponent),
        title: 'RxJS | Reactive Caching',
      },
      {
        path: 'bulk-operations',
        loadComponent: () =>
          import('./exercises/bulk-operations/bulk-operations.component').then(
            (m) => m.BulkOperationsComponent,
          ),
        title: 'RxJS | Bulk Operations',
      },
      {
        path: 'quiz',
        loadComponent: () =>
          import('./exercises/quiz/quiz.component').then((m) => m.QuizComponent),
        title: 'RxJS | Challenge',
      },
    ],
  },
];
