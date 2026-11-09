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
import {
  AhButton,
  AhCodeBlock,
  SectionHeading,
  SegmentedOption,
  Tag,
} from '@ah/ui';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';
import { injectRxjsLabCopy } from '../../i18n/rxjs-lab-copy';

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
  imports: [
    CommonModule,
    UseCaseFocusComponent,
    AhButton,
    Tag,
    SectionHeading,
    AhCodeBlock,
  ],
  templateUrl: './rxjs-vs-signals.component.html',
  styleUrls: ['./rxjs-vs-signals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RxjsVsSignalsComponent {
  readonly copy = injectRxjsLabCopy();

  // --- Focus View Options ---
  readonly focusOptions = computed<readonly SegmentedOption<string>[]>(() => {
    const opts = this.copy().rxjsVsSignals.focusOptions;
    return [
      { value: 'all', label: opts.all },
      { value: 'decision-matrix', label: opts.decisionMatrix },
      { value: 'search-debounce', label: opts.searchDebounce },
      { value: 'derived-state', label: opts.derivedState },
      { value: 'async-resource', label: opts.asyncResource },
      { value: 'linked-state', label: opts.linkedState },
      { value: 'coexistence', label: opts.coexistence },
    ];
  });
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
  readonly scenarios = computed<readonly ArchitectureScenario[]>(
    () => this.copy().rxjsVsSignals.scenarios,
  );

  selectedScenarioId = signal<string>('search');
  selectedScenario = computed(() => {
    const list = this.scenarios();
    return list.find((s) => s.id === this.selectedScenarioId()) ?? list[0];
  });

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
