// src/app/exercises/signals/signals.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  linkedSignal,
  resource,
} from '@angular/core';

import { toSignal, toObservable, rxResource } from '@angular/core/rxjs-interop';
import { interval, Observable, Subject, timer } from 'rxjs';
import { tap, switchMap, takeUntil, map, debounceTime } from 'rxjs/operators';
import { AhButton, SectionHeading, SegmentedOption, Tag } from '@ah/ui';
import { NotificationService } from '../../shared/services/notification.service';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

interface LogEntry {
  id: number;
  message: string;
}

interface Marble {
  id: number;
  value: number;
  color: string;
}

export type PlanTier = 'Starter' | 'Pro' | 'Enterprise';

export interface UserProfile {
  name: string;
  role: string;
  quota: string;
}

@Component({
  selector: 'app-signals',
  standalone: true,
  imports: [UseCaseFocusComponent, AhButton, Tag, SectionHeading],
  templateUrl: './signals.component.html',
  styleUrls: ['./signals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsComponent {
  // --- Focus View Options ---
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Signal Topics' },
    { value: 'basics', label: 'Signal Basics' },
    { value: 'toSignal', label: 'toSignal()' },
    { value: 'linkedSignal', label: 'linkedSignal()' },
    { value: 'rxResource', label: 'rxResource()' },
    { value: 'resource', label: 'resource() [Promise]' },
    { value: 'toObservable', label: 'toObservable()' },
  ];
  readonly activeCase = signal<string>('all');

  // --- 1. Writable Signals (The "Source of Truth") ---
  firstName = signal('John');
  lastName = signal('Doe');
  quantity = signal(1);

  // --- 2. Computed Signals (Derived State) ---
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  isStockLow = computed(() => this.quantity() <= 5);
  stockMessage = computed(() =>
    this.isStockLow()
      ? `Only ${this.quantity()} left in stock - order soon!`
      : `${this.quantity()} in stock.`,
  );

  // --- 3. Effect (Side Effect) ---
  logs = signal<LogEntry[]>([]);
  private logCounter = 0;
  private notificationService = inject(NotificationService);

  // --- 4. RxJS Interop: toSignal ---
  private marbleCounter = 0;
  private colors = ['#f87171', '#60a5fa', '#4ade80', '#facc15', '#a78bfa'];

  private start$ = new Subject<void>();
  private stop$ = new Subject<void>();

  observableMarbles = signal<Marble[]>([]);
  isCounterRunning = signal(false);

  counter$: Observable<number> = this.start$.pipe(
    switchMap(() =>
      interval(1000).pipe(
        tap((value) => this.addMarble(value)),
        takeUntil(this.stop$),
      ),
    ),
  );

  counterSignal = toSignal(this.counter$);
  isEven = computed(() => (this.counterSignal() ?? -1) % 2 === 0);

  // --- 5. Angular 22 linkedSignal() ---
  planTier = signal<PlanTier>('Pro');
  computeCredits = linkedSignal<PlanTier, number>({
    source: () => this.planTier(),
    computation: (tier) =>
      tier === 'Enterprise' ? 100 : tier === 'Pro' ? 25 : 5,
  });

  defaultCreditsForCurrentTier = computed(() => {
    const tier = this.planTier();
    return tier === 'Enterprise' ? 100 : tier === 'Pro' ? 25 : 5;
  });

  isCreditsCustomized = computed(
    () => this.computeCredits() !== this.defaultCreditsForCurrentTier(),
  );

  // --- 6. Angular 22 rxResource() ---
  selectedUserId = signal<number>(1);
  userProfileResource = rxResource<UserProfile, { id: number }>({
    params: () => ({ id: this.selectedUserId() }),
    stream: ({ params }) => {
      const profiles: Record<number, UserProfile> = {
        1: {
          name: 'Alice Martin',
          role: 'Staff Frontend Architect',
          quota: '85% compute used',
        },
        2: {
          name: 'Bob Vance',
          role: 'Senior Platform Engineer',
          quota: '42% compute used',
        },
        3: {
          name: 'Carol Danvers',
          role: 'Engineering Director',
          quota: '98% compute used',
        },
      };
      return timer(500).pipe(
        map(
          () =>
            profiles[params.id] ?? {
              name: 'Guest Developer',
              role: 'Contributor',
              quota: '10% compute used',
            },
        ),
      );
    },
  });

  // --- 7. Bidirectional Interop: toObservable() + toSignal() ---
  searchQuery = signal('Angular 22');
  searchQuery$ = toObservable(this.searchQuery);
  debouncedSearch = toSignal(
    this.searchQuery$.pipe(
      debounceTime(350),
      map((q) => q.toUpperCase().trim()),
    ),
    { initialValue: 'ANGULAR 22' },
  );

  // --- 8. Angular 22 resource() (Promise + AbortSignal) ---
  resourceSearchTopic = signal('Angular');
  articleResource = resource({
    params: () => ({ topic: this.resourceSearchTopic() }),
    loader: async ({
      params,
      abortSignal,
    }: {
      params: { topic: string };
      abortSignal: AbortSignal;
    }) => {
      await new Promise((r) => setTimeout(r, 450));
      if (abortSignal.aborted) {
        throw new DOMException('Aborted by newer request', 'AbortError');
      }
      return {
        title: `${params.topic} 22 Deep Dive`,
        summary: `Exploring fine-grained reactivity, signals, and zoneless change detection in ${params.topic}.`,
        readTime: '5 min read',
      };
    },
  });

  setResourceTopic(topic: string) {
    this.resourceSearchTopic.set(topic);
  }

  reloadArticleResource() {
    this.articleResource.reload();
  }

  constructor() {
    // Effect with onCleanup hook
    effect((onCleanup) => {
      const name = this.fullName();
      const qty = this.quantity();
      const message = `Effect triggered: User is ${name}, Quantity is ${qty}.`;

      const newLog: LogEntry = { id: this.logCounter++, message };
      this.logs.update((currentLogs) => [newLog, ...currentLogs.slice(0, 9)]);
      this.notificationService.show(message, 'info', 2000);

      onCleanup(() => {
        // Disposed when dependency changes or component is destroyed
      });
    });

    // Effect for toSignal
    effect(() => {
      const value = this.counterSignal();
      if (value !== undefined) {
        this.notificationService.show(
          `Signal from Observable updated to: ${value}`,
          'success',
          2000,
        );
      }
    });
  }

  // --- Methods for native signals ---
  onFirstNameChange(event: Event) {
    this.firstName.set((event.target as HTMLInputElement).value);
  }
  onLastNameChange(event: Event) {
    this.lastName.set((event.target as HTMLInputElement).value);
  }
  increment() {
    this.quantity.update((q) => q + 1);
  }
  decrement() {
    this.quantity.update((q) => (q > 0 ? q - 1 : 0));
  }

  // --- Methods for linkedSignal ---
  selectPlanTier(tier: PlanTier) {
    this.planTier.set(tier);
    this.notificationService.show(
      `Plan changed to ${tier}. Credits reset to default.`,
      'info',
    );
  }

  incrementCredits() {
    this.computeCredits.update((c) => c + 5);
  }

  decrementCredits() {
    this.computeCredits.update((c) => Math.max(0, c - 5));
  }

  resetCreditsToDefault() {
    this.computeCredits.set(this.defaultCreditsForCurrentTier());
    this.notificationService.show(
      'Credits restored to plan default.',
      'success',
    );
  }

  // --- Methods for rxResource ---
  selectUser(id: number) {
    this.selectedUserId.set(id);
  }

  reloadUserResource() {
    this.userProfileResource.reload();
    this.notificationService.show('Reloading rxResource stream...', 'info');
  }

  // --- Methods for toObservable Search ---
  onSearchChange(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  // --- Methods for RxJS Interop ---
  startCounter() {
    if (this.isCounterRunning()) return;
    this.isCounterRunning.set(true);
    this.start$.next();
  }

  stopCounter() {
    if (!this.isCounterRunning()) return;
    this.isCounterRunning.set(false);
    this.stop$.next();
  }

  resetCounter() {
    this.stopCounter();
    this.observableMarbles.set([]);
  }

  private addMarble(value: number) {
    const color = this.colors[value % this.colors.length];
    const marble: Marble = { id: this.marbleCounter++, value, color };
    this.observableMarbles.update((marbles) => [...marbles, marble]);
    setTimeout(() => {
      this.observableMarbles.update((marbles) =>
        marbles.filter((m) => m.id !== marble.id),
      );
    }, 4000);
  }
}
