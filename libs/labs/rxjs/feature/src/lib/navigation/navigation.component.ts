import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tag } from '@ah/ui';

export interface LabExerciseItem {
  readonly path: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

export interface LabCategory {
  readonly id: string;
  readonly title: string;
  readonly badge: string;
  readonly exercises: readonly LabExerciseItem[];
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, Tag],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  readonly isOpen = input.required<boolean>();

  readonly categories: readonly LabCategory[] = [
    {
      id: 'foundations',
      title: 'Core Mechanics',
      badge: 'Tier 1',
      exercises: [
        {
          path: './error-handling',
          label: 'Error Handling',
          description: 'catchError, retry, throwError',
          icon: 'alert-circle',
        },
        {
          path: './combining-streams',
          label: 'Combining Streams',
          description: 'withLatestFrom, combineLatest',
          icon: 'git-merge',
        },
        {
          path: './transforming-streams',
          label: 'Transforming Streams',
          description: 'concatMap, switchMap, mergeMap',
          icon: 'git-branch',
        },
        {
          path: './sharing-data',
          label: 'Sharing Data',
          description: 'Subject, BehaviorSubject',
          icon: 'share-2',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'Production Resilience',
      badge: 'Tier 2',
      exercises: [
        {
          path: './multicasting',
          label: 'Multicasting',
          description: 'Hot vs Cold, shareReplay',
          icon: 'cast',
        },
        {
          path: './reactive-caching',
          label: 'Reactive Caching',
          description: 'Cache-then-network, TTL',
          icon: 'database',
        },
        {
          path: './bulk-operations',
          label: 'Bulk Operations',
          description: 'forkJoin, bufferCount, toArray',
          icon: 'layers',
        },
      ],
    },
    {
      id: 'angular22',
      title: 'Angular 22 & Interop',
      badge: 'Tier 3',
      exercises: [
        {
          path: './signals',
          label: 'Power of Signals',
          description: 'signal, linkedSignal, rxResource',
          icon: 'zap',
        },
        {
          path: './rxjs-vs-signals',
          label: 'RxJS vs Signals',
          description: 'Mental models & Coexistence',
          icon: 'refresh-cw',
        },
        {
          path: './quiz',
          label: 'RxJS Challenge',
          description: 'Interactive mastery test',
          icon: 'award',
        },
      ],
    },
  ];
}
