import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { AhButton, SectionHeading, Tag } from '@ah/ui';

export type PatternKey =
  'service-signals' | 'service-rxjs' | 'signal-store' | 'global-store';

export interface ArchitectureComparison {
  key: PatternKey;
  name: string;
  tagline: string;
  badge: 'simplest' | 'stream-heavy' | 'recommended' | 'enterprise';
  bundleWeight: string;
  reactivityModel: string;
  learningCurve: 'Gentle' | 'Moderate' | 'Steep';
  timeTravelSupport:
    'None' | 'Manual' | 'Custom Plugin' | 'Full Redux DevTools';
  whenToUse: string[];
  whenToAvoid: string[];
  codeSample: string;
}

@Component({
  selector: 'ah-ngrx-vs-services',
  imports: [SectionHeading, AhButton, Tag],
  templateUrl: './ngrx-vs-services.component.html',
  styleUrl: './ngrx-vs-services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgRxVsServicesComponent {
  readonly expandedFaqId = signal<string | null>('signals-vs-ngrx');

  toggleFaq(id: string): void {
    this.expandedFaqId.update((curr) => (curr === id ? null : id));
  }

  readonly interviewFaqs = [
    {
      id: 'signals-vs-ngrx',
      question: 'Does Angular Signals replace NgRx in Angular 22?',
      answer:
        'No. Angular Signals is a fine-grained reactivity and change detection primitive (solving how the UI updates synchronously without Zone.js overhead). NgRx is a state architecture framework (solving how state is organized, normalized in O(1) dictionaries, shared across lazy features, audited via DevTools, and coordinated across complex asynchronous streams). They work in synergy: NgRx exposes signals for template binding.',
      takeaway:
        'Use Signals to expose data to templates; use NgRx to architect, normalize, and coordinate state lifecycle.',
    },
    {
      id: 'anti-pattern',
      question: 'When is NgRx considered an anti-pattern or over-engineering?',
      answer:
        'NgRx is an anti-pattern for simple CRUD applications with independent pages, isolated forms, and zero cross-feature state sharing. Writing Actions, Reducers, and Selectors just to toggle an isModalOpen boolean or submit a 3-field form introduces needless ceremony and indirection without tangible benefit.',
      takeaway:
        'Default to simple Signal Services or Component state; promote to SignalStore when state is shared or requires normalized caching.',
    },
    {
      id: 'signalstore-vs-global',
      question:
        'Why choose NgRx SignalStore over traditional NgRx Global Store?',
      answer:
        'SignalStore reduces boilerplate by ~80% while retaining full type-safety and immutability. It requires no action types or reducer switch statements, is 100% tree-shakeable, supports modular plugin composition (withEntities, withComputed, withMethods), and connects seamlessly to RxJS via rxMethod.',
      takeaway:
        'For new Angular features in 2026, SignalStore is the recommended default standard.',
    },
    {
      id: 'optimistic-rollback',
      question:
        'How do you handle optimistic UI updates with rollback in NgRx?',
      answer:
        'In SignalStore, call patchState(store, updateEntity(optimisticData)) immediately upon user action. The rxMethod then triggers the backend HTTP call; if the network call fails, the tapResponse error callback executes patchState(store, updateEntity(previousSnapshot)) and displays a user error toast.',
      takeaway:
        'Always capture previous state before optimistic mutations to enable instant rollback upon error.',
    },
  ];

  // Wizard state inputs
  readonly stateScope = signal<'local' | 'modular' | 'global'>('modular');
  readonly asyncComplexity = signal<'simple' | 'streams' | 'choreography'>(
    'simple',
  );
  readonly auditLevel = signal<'standard' | 'strict'>('standard');

  readonly selectedPatternKey = signal<PatternKey>('signal-store');

  readonly wizardRecommendation = computed(() => {
    const scope = this.stateScope();
    const asyncType = this.asyncComplexity();
    const audit = this.auditLevel();

    if (audit === 'strict' || asyncType === 'choreography') {
      return {
        winner: 'NgRx Global Store + Effects',
        patternKey: 'global-store' as PatternKey,
        rationale:
          'Your requirement for strict compliance, time-travel auditability, or cross-feature event choreography makes the classic NgRx Store and Effects the safest choice. Actions document every transaction in Redux DevTools.',
      };
    }

    if (scope === 'local' && asyncType === 'simple') {
      return {
        winner: 'Service with Signals (signal & computed)',
        patternKey: 'service-signals' as PatternKey,
        rationale:
          'For co-located UI state or single-feature components with straightforward CRUD, a plain injectable Service with Signals offers zero boilerplate and instantaneous push-pull reactivity with 0kB overhead.',
      };
    }

    if (asyncType === 'streams' && scope === 'local') {
      return {
        winner: 'Service with RxJS (BehaviorSubject)',
        patternKey: 'service-rxjs' as PatternKey,
        rationale:
          'When you need complex stream coordination, debounced search, or WebSockets within a local component without global entity indexing, an RxJS Service leverages full operator power.',
      };
    }

    // Default senior recommendation for Angular 22
    return {
      winner: 'NgRx SignalStore (@ngrx/signals)',
      patternKey: 'signal-store' as PatternKey,
      rationale:
        'The modern gold standard for Angular 22 Zoneless! SignalStore provides modular state composition (withEntities, withMethods, rxMethod), type-safety, and native signals with a tiny 1.5kB footprint.',
    };
  });

  readonly patterns: ArchitectureComparison[] = [
    {
      key: 'service-signals',
      name: 'Service with Signals',
      tagline:
        'Pure Angular 22 signals, writable signal() and derived computed().',
      badge: 'simplest',
      bundleWeight: '0 kB (Built-in)',
      reactivityModel: 'Push-Pull Glitch-Free',
      learningCurve: 'Gentle',
      timeTravelSupport: 'None',
      whenToUse: [
        'Component-local UI state (modals, tabs, pagination, active rows)',
        'Simple CRUD services without normalized cross-entity relationships',
        'Small to medium applications where team wants zero third-party dependencies',
        'Direct synchronous derivations using computed()',
      ],
      whenToAvoid: [
        'Multi-entity normalized collections needing $O(1)$ lookups by ID',
        'Complex cross-feature state orchestration across independent micro-frontends',
        'Regulated applications requiring Redux DevTools time-travel auditing',
      ],
      codeSample: `@Injectable({ providedIn: 'root' })
export class CounterService {
  private readonly _count = signal(0);
  readonly count = this._count.asReadonly();
  readonly double = computed(() => this._count() * 2);

  increment(): void {
    this._count.update(c => c + 1);
  }
}`,
    },
    {
      key: 'service-rxjs',
      name: 'Service with RxJS',
      tagline:
        'Observable event streaming with BehaviorSubject and higher-order operators.',
      badge: 'stream-heavy',
      bundleWeight: '~4 kB (RxJS)',
      reactivityModel: 'Push Stream Observables',
      learningCurve: 'Moderate',
      timeTravelSupport: 'Manual',
      whenToUse: [
        'Complex stream orchestration (switchMap, debounceTime, combineLatest)',
        'Real-time streaming inputs (WebSockets, SSE, Canvas animation loops)',
        'Managing async request cancellation and retry-backoff policies',
      ],
      whenToAvoid: [
        'Simple synchronous state where async pipes clutter templates',
        'Zoneless components where signal-first change detection is preferred',
        'Teams prone to memory leaks from unclosed subscriptions',
      ],
      codeSample: `@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly query$ = new Subject<string>();
  readonly results$ = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.http.get<Item[]>(\`/api/search?q=\${q}\`))
  );

  search(q: string): void {
    this.query$.next(q);
  }
}`,
    },
    {
      key: 'signal-store',
      name: 'NgRx SignalStore',
      tagline:
        'Modern functional composition: withEntities, withMethods, rxMethod & withHooks.',
      badge: 'recommended',
      bundleWeight: '~1.5 kB (@ngrx/signals)',
      reactivityModel: 'Native Signals + rxMethod',
      learningCurve: 'Moderate',
      timeTravelSupport: 'Custom Plugin',
      whenToUse: [
        'Recommended default for modern Angular 22 & Zoneless applications',
        'Modular feature state requiring entity normalization (ids array + entityMap)',
        'Async stream integration using rxMethod without manual subscriptions',
        'Composing reusable custom plugins across multiple feature teams',
      ],
      whenToAvoid: [
        'Extremely strict enterprise requirements strictly demanding Redux DevTools extension replay',
        'Tiny single-line ephemeral states where a simple signal() suffices',
      ],
      codeSample: `export const UsersStore = signalStore(
  { providedIn: 'root' },
  withEntities<User>(),
  withState({ isLoading: false }),
  withMethods((store, usersApi = inject(UsersApi)) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() => usersApi.getAll().pipe(
          tapResponse({
            next: users => patchState(store, setAllEntities(users), { isLoading: false }),
            error: err => patchState(store, { isLoading: false })
          })
        ))
      )
    )
  }))
);`,
    },
    {
      key: 'global-store',
      name: 'NgRx Global Store + Effects',
      tagline:
        'Classic Redux: ActionGroups, Feature Reducers, Memoized Selectors, and Effects.',
      badge: 'enterprise',
      bundleWeight: '~15-20 kB (@ngrx/store+effects)',
      reactivityModel: 'Action-Driven Redux',
      learningCurve: 'Steep',
      timeTravelSupport: 'Full Redux DevTools',
      whenToUse: [
        'Large enterprise apps with multiple distributed development teams',
        'Mission-critical financial or compliance workflows requiring full action auditing',
        'Complex cross-feature event choreography and multi-entity global caching',
        'Strict architectural boundaries where components are completely decoupled from side-effects',
      ],
      whenToAvoid: [
        'Simple CRUD applications where Redux boilerplate slows down development velocity',
        'Performance-sensitive micro-frontends prioritizing tiny bundle footprints',
      ],
      codeSample: `export const OrdersActions = createActionGroup({
  source: 'Orders',
  events: {
    'Load Orders': emptyProps(),
    'Load Orders Success': props<{ orders: Order[] }>(),
  }
});

export const ordersFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialState,
    on(OrdersActions.loadOrdersSuccess, (state, { orders }) => ({ ...state, orders }))
  )
});`,
    },
  ];

  selectPattern(key: PatternKey): void {
    this.selectedPatternKey.set(key);
  }

  currentPattern = computed(() => {
    return this.patterns.find((p) => p.key === this.selectedPatternKey());
  });
}
