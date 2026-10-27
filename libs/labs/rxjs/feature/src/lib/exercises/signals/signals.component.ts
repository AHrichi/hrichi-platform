// src/app/exercises/signals/signals.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';
import { interval, Subscription, Observable, Subject } from 'rxjs';
import { tap, switchMap, takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../shared/services/notification.service';

interface LogEntry {
  id: number;
  message: string;
}

interface Marble {
  id: number;
  value: number;
  color: string;
}

@Component({
  selector: 'app-signals',
  standalone: true,
  imports: [],
  templateUrl: './signals.component.html',
  styleUrls: ['./signals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalsComponent {
  // --- Writable Signals (The "Source of Truth") ---
  firstName = signal('John');
  lastName = signal('Doe');
  quantity = signal(1);

  // --- Computed Signals (Derived State) ---
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
  isStockLow = computed(() => this.quantity() <= 5);
  stockMessage = computed(() =>
    this.isStockLow()
      ? `Only ${this.quantity()} left in stock - order soon!`
      : `${this.quantity()} in stock.`,
  );

  // --- Effect (Side Effect) ---
  logs = signal<LogEntry[]>([]);
  private logCounter = 0;
  private notificationService = inject(NotificationService);

  // --- RxJS Interop: toSignal ---
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

  constructor() {
    // Effect for native signals
    effect(() => {
      const name = this.fullName();
      const qty = this.quantity();
      const message = `Effect triggered: User is ${name}, Quantity is ${qty}.`;

      const newLog: LogEntry = { id: this.logCounter++, message };
      this.logs.update((currentLogs) => [newLog, ...currentLogs]);
      this.notificationService.show(message, 'info', 2000);
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
    // The signal will retain its last value. A more complex setup would be
    // needed to reset it to an initial value, but this is sufficient for the demo.
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
