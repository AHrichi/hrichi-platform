import { Routes } from '@angular/router';
import { RxjsPracticePadComponent } from './rxjs-practice-pad.component';
import { ErrorHandlingComponent } from './exercises/error-handling/error-handling.component';
import { CombiningStreamsComponent } from './exercises/combining-streams/combining-streams.component';
import { TransformingStreamsComponent } from './exercises/transforming-streams/transforming-streams.component';
import { SharingDataComponent } from './exercises/sharing-data/sharing-data.component';
import { SignalsComponent } from './exercises/signals/signals.component';
import { MulticastingComponent } from './exercises/multicasting/multicasting.component';
import { ReactiveCachingComponent } from './exercises/reactive-caching/reactive-caching.component';
import { BulkOperationsComponent } from './exercises/bulk-operations/bulk-operations.component';
import { QuizComponent } from './exercises/quiz/quiz.component';

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
        component: ErrorHandlingComponent,
        title: 'RxJS | Error Handling',
      },
      {
        path: 'combining-streams',
        component: CombiningStreamsComponent,
        title: 'RxJS | Combining Streams',
      },
      {
        path: 'transforming-streams',
        component: TransformingStreamsComponent,
        title: 'RxJS | Transforming Streams',
      },
      {
        path: 'sharing-data',
        component: SharingDataComponent,
        title: 'RxJS | Sharing Data',
      },
      {
        path: 'signals',
        component: SignalsComponent,
        title: 'Angular | Signals',
      },
      {
        path: 'multicasting',
        component: MulticastingComponent,
        title: 'RxJS | Multicasting',
      },
      {
        path: 'reactive-caching',
        component: ReactiveCachingComponent,
        title: 'RxJS | Reactive Caching',
      },
      {
        path: 'bulk-operations',
        component: BulkOperationsComponent,
        title: 'RxJS | Bulk Operations',
      },
      {
        path: 'quiz',
        component: QuizComponent,
        title: 'RxJS | Challenge',
      },
    ],
  },
];
