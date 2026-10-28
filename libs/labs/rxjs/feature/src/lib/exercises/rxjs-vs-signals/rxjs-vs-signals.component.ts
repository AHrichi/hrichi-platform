import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal, rxResource } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  interval,
  Observable,
  of,
  Subject,
  timer,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  take,
} from 'rxjs/operators';
import { AhButton, SectionHeading, SegmentedOption, Tag } from '@ah/ui';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

export interface ArchitectureScenario {
  id: string;
  title: string;
  category: 'Events' | 'State' | 'Hybrid';
  winner: 'RxJS' | 'Signals' | 'Hybrid (Both)';
  summary: string;
  rxjsApproach: string;
  signalsApproach: string;
  hybridApproach: string;
  ruleOfThumb: string;
}

@Component({
  selector: 'ah-rxjs-vs-signals',
  standalone: true,
  imports: [CommonModule, UseCaseFocusComponent, AhButton, Tag, SectionHeading],
  templateUrl: './rxjs-vs-signals.component.html',
  styleUrls: ['./rxjs-vs-signals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RxjsVsSignalsComponent {
  // --- Focus View Options ---
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Architectures' },
    { value: 'decision-matrix', label: 'Decision Matrix' },
    { value: 'search-debounce', label: 'Search & Debounce' },
    { value: 'derived-state', label: 'Derived Calculations' },
    { value: 'async-resource', label: 'Async Data Fetching' },
    { value: 'linked-state', label: 'Resetting Dependent State' },
    { value: 'coexistence', label: 'Coexistence Philosophy' },
  ];
  readonly activeCase = signal<string>('all');

  readonly codeSnippets = {
    derived: `// ⚡ Signals: Synchronous, elegant, auto-tracked
total = computed(() => {
  const subtotal = Math.max(0, this.basePrice() - this.discount());
  return Math.round(subtotal * (1 + this.taxRate()) * 100) / 100;
});

// 🌊 RxJS: Requires manual streams and subscription management
total$ = combineLatest([this.basePrice$, this.discount$, this.taxRate$]).pipe(
  map(([price, disc, tax]) => Math.round(Math.max(0, price - disc) * (1 + tax) * 100) / 100)
);`,
    debounce: `// 1. Raw user input signal
searchQuery = signal('');

// 2. Bridge to Observable to tap into RxJS time operators
private searchQuery$ = toObservable(this.searchQuery);

// 3. Debounce and sanitize, then bridge back to Signal for template
debouncedQuery = toSignal(
  this.searchQuery$.pipe(
    debounceTime(400),
    distinctUntilChanged(),
    map(q => q.trim().toUpperCase())
  ),
  { initialValue: '' }
);`,
    resource: `// Angular 22: Declarative async stream resource
cityWeather = rxResource<Weather, { id: string }>({
  params: () => ({ id: this.selectedCityId() }),
  stream: ({ params }) => this.weatherApi.getWeather(params.id),
});

// In zoneless template:
// cityWeather.isLoading()
// cityWeather.value()
// cityWeather.status()`,
    linked: `selectedPlan = signal<'Basic' | 'Pro' | 'Enterprise'>('Pro');

// linkedSignal automatically tracks selectedPlan and recomputes default,
// yet allows direct mutation via customQuota.set() or customQuota.update()!
customQuota = linkedSignal({
  source: () => this.selectedPlan(),
  computation: (plan) => (plan === 'Enterprise' ? 500 : plan === 'Pro' ? 100 : 20),
});`,
  };

  // --- Scenarios Data for Interactive Decision Tool ---
  readonly scenarios: readonly ArchitectureScenario[] = [
    {
      id: 'search',
      title: 'Typeahead / Search Autocomplete',
      category: 'Hybrid',
      winner: 'Hybrid (Both)',
      summary:
        'Handling asynchronous key events with debounce and cancellation, then projecting the result into synchronous UI state.',
      rxjsApproach:
        'searchInput$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => api.search(q)))',
      signalsApproach:
        'Signals do not natively support time-based throttling or debouncing without external timer plumbing.',
      hybridApproach:
        'query = signal(""); query$ = toObservable(this.query); results = toSignal(this.query$.pipe(debounceTime(300), switchMap(q => api.search(q))), { initialValue: [] })',
      ruleOfThumb:
        'Use RxJS to coordinate the asynchronous event stream over time, then terminate with toSignal() for clean, zoneless template rendering.',
    },
    {
      id: 'derived',
      title: 'Cart Total & Price Calculations',
      category: 'State',
      winner: 'Signals',
      summary:
        'Deriving synchronous computation from multiple state sources (items, quantity, discount, tax).',
      rxjsApproach:
        'combineLatest([items$, discount$, tax$]).pipe(map(([items, d, t]) => calculate(items, d, t))) — requires subscription, pipe, and manual change detection triggers in zoneless.',
      signalsApproach:
        'total = computed(() => calculate(this.items(), this.discount(), this.tax())) — automatic dynamic dependency tracking, synchronous pull, zero subscriptions, zero memory leaks.',
      hybridApproach:
        'Pure Signals win hands-down here. No RxJS needed for synchronous in-memory state derivation.',
      ruleOfThumb:
        'If state is synchronous in memory, always prefer signal() and computed().',
    },
    {
      id: 'websockets',
      title: 'Real-Time WebSockets & Event Feeds',
      category: 'Events',
      winner: 'RxJS',
      summary:
        'Continuous stream of push-based network packets, reconnection backoff, heartbeat intervals, and message filtering.',
      rxjsApproach:
        'webSocket$.pipe(retry({ delay: 2000 }), filter(isRelevant), scan(accumulateFeed, [])) — RxJS is designed specifically for push-based streams over time.',
      signalsApproach:
        'Signals only represent the latest discrete value; they do not natively model multi-emission push streams, dropouts, or packet queues.',
      hybridApproach:
        'Manage the socket lifecycle and buffering in RxJS, then expose feed = toSignal(feed$) for declarative template binding.',
      ruleOfThumb:
        'Whenever events are pushed over time (sockets, message buses, sensor feeds), RxJS is the gold standard.',
    },
    {
      id: 'spam-prevention',
      title: 'Form Submission & Double-Click Prevention',
      category: 'Events',
      winner: 'RxJS',
      summary:
        'Ensuring an in-flight submission blocks any rapid duplicate button clicks until the backend response returns.',
      rxjsApproach:
        'submitClick$.pipe(exhaustMap(() => authService.login(credentials))) — exhaustMap automatically discards clicks while the inner request is active.',
      signalsApproach:
        'Requires manual flag management: isSubmitting = signal(false); if (this.isSubmitting()) return; this.isSubmitting.set(true); try { ... } finally { this.isSubmitting.set(false); }',
      hybridApproach:
        'Use exhaustMap or a resource with disabled button state.',
      ruleOfThumb:
        'Use exhaustMap when concurrency requires ignoring incoming triggers during an active asynchronous operation.',
    },
    {
      id: 'dependent-reset',
      title: 'Dependent State Reset (e.g. Master-Detail)',
      category: 'State',
      winner: 'Signals',
      summary:
        'Changing a parent category resets the selected item to a default, while still permitting user selection.',
      rxjsApproach:
        'Historically required nested subjects or complex switchMap state resets in a service.',
      signalsApproach:
        'selectedItem = linkedSignal({ source: () => this.category(), computation: (cat) => cat.defaultItem }) — resets automatically on source change, yet directly writable with selectedItem.set()!',
      hybridApproach:
        'Pure Angular 22 linkedSignal() is the cleanest pattern for this in the entire frontend ecosystem.',
      ruleOfThumb:
        'Use linkedSignal() for writable local state that must stay in sync with a source dependency.',
    },
  ];

  selectedScenarioId = signal<string>('search');
  selectedScenario = computed(
    () =>
      this.scenarios.find((s) => s.id === this.selectedScenarioId()) ??
      this.scenarios[0],
  );

  // --- Live Sandbox 1: Derived Calculations (combineLatest vs computed) ---
  basePrice = signal(100);
  taxRate = signal(0.2); // 20%
  discount = signal(15);

  // Computed Signal version (clean, synchronous, pull-based)
  computedTotal = computed(() => {
    const subtotal = Math.max(0, this.basePrice() - this.discount());
    return Math.round(subtotal * (1 + this.taxRate()) * 100) / 100;
  });

  // RxJS Stream equivalent
  private basePrice$ = new BehaviorSubject(100);
  private taxRate$ = new BehaviorSubject(0.2);
  private discount$ = new BehaviorSubject(15);
  rxjsTotal$ = combineLatest([
    this.basePrice$,
    this.taxRate$,
    this.discount$,
  ]).pipe(
    map(([price, tax, disc]) => {
      const subtotal = Math.max(0, price - disc);
      return Math.round(subtotal * (1 + tax) * 100) / 100;
    }),
  );
  rxjsTotalSignal = toSignal(this.rxjsTotal$, { initialValue: 102 });

  // --- Live Sandbox 2: Interactive Debounced Search Hybrid ---
  searchQuery = signal('Angular 22');
  private searchQuery$ = toObservable(this.searchQuery);

  debouncedQuery = toSignal(
    this.searchQuery$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      map((q) => q.trim().toUpperCase()),
    ),
    { initialValue: 'ANGULAR 22' },
  );

  // --- Live Sandbox 3: Angular 22 linkedSignal Demonstration ---
  selectedPlan = signal<'Basic' | 'Pro' | 'Enterprise'>('Pro');
  customQuota = linkedSignal<'Basic' | 'Pro' | 'Enterprise', number>({
    source: () => this.selectedPlan(),
    computation: (plan) =>
      plan === 'Enterprise' ? 500 : plan === 'Pro' ? 100 : 20,
  });

  defaultQuotaForPlan = computed(() => {
    const p = this.selectedPlan();
    return p === 'Enterprise' ? 500 : p === 'Pro' ? 100 : 20;
  });

  isQuotaOverridden = computed(
    () => this.customQuota() !== this.defaultQuotaForPlan(),
  );

  // --- Live Sandbox 4: Async Resource vs RxJS Data Fetching ---
  selectedCityId = signal<'paris' | 'tokyo' | 'nyc'>('paris');
  cityWeather = rxResource<
    { city: string; temp: string; condition: string },
    { id: 'paris' | 'tokyo' | 'nyc' }
  >({
    params: () => ({ id: this.selectedCityId() }),
    stream: ({ params }) => {
      const weatherData: Record<
        'paris' | 'tokyo' | 'nyc',
        { city: string; temp: string; condition: string }
      > = {
        paris: { city: 'Paris', temp: '19°C', condition: 'Partly Cloudy' },
        tokyo: { city: 'Tokyo', temp: '24°C', condition: 'Sunny' },
        nyc: { city: 'New York', temp: '16°C', condition: 'Breezy' },
      };
      return timer(400).pipe(map(() => weatherData[params.id]));
    },
  });

  // Methods
  selectScenario(id: string) {
    this.selectedScenarioId.set(id);
  }

  setCity(city: 'paris' | 'tokyo' | 'nyc') {
    this.selectedCityId.set(city);
  }

  reloadWeather() {
    this.cityWeather.reload();
  }

  updateBasePrice(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) {
      this.basePrice.set(val);
      this.basePrice$.next(val);
    }
  }

  updateDiscount(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) {
      this.discount.set(val);
      this.discount$.next(val);
    }
  }

  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  setPlan(plan: 'Basic' | 'Pro' | 'Enterprise') {
    this.selectedPlan.set(plan);
  }

  incrementQuota() {
    this.customQuota.update((q) => q + 10);
  }

  decrementQuota() {
    this.customQuota.update((q) => Math.max(0, q - 10));
  }

  resetQuota() {
    this.customQuota.set(this.defaultQuotaForPlan());
  }
}
