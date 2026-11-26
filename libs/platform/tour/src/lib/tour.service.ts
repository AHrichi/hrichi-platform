import { computed, inject, Injectable, signal } from '@angular/core';
import { APP_MODE } from '@ah/platform/app-mode';
import type { TourDefinition, TourOutcome, TourStep } from './tour.model';
import {
  browserStorage,
  type TourRecord,
  tourKey,
  TourProgress,
} from './tour-progress';

interface ActiveTour {
  readonly definition: TourDefinition;
  readonly index: number;
}

/**
 * The tour that is running, if any, and what each app's tours left behind.
 * One tour at a time. `<ah-tour-host>` shows it; anything may start it: a
 * button, an invitation, an assistant.
 */
@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly demo =
    inject(APP_MODE, { optional: true }) === 'embedded-demo';
  private readonly progress = new TourProgress(browserStorage());
  /** Bumped on every write, so `isNew` is read again. */
  private readonly written = signal(0);
  private opener: HTMLElement | null = null;

  private readonly current = signal<ActiveTour | null>(null);

  /** The tour running now and its step's position. */
  readonly active = this.current.asReadonly();

  readonly step = computed<TourStep | null>(() => {
    const active = this.current();
    return active ? active.definition.steps[active.index] : null;
  });

  /** What a tour left behind on this device, or null if never seen. */
  record(definition: TourDefinition): TourRecord | null {
    this.written();
    return this.progress.read(tourKey(definition, this.demo));
  }

  /** Never finished, skipped or declined here: worth an invitation. */
  isNew(definition: TourDefinition): boolean {
    return this.record(definition) === null;
  }

  /**
   * Starts a tour at its first step (or `at`). `opener` gets the focus back
   * when the tour ends: the button that started it, usually.
   */
  start(
    definition: TourDefinition,
    opener: HTMLElement | null = null,
    at = 0,
  ): void {
    const index = Math.min(Math.max(at, 0), definition.steps.length - 1);
    this.opener = opener;
    this.current.set({ definition, index });
  }

  next(): void {
    const active = this.current();
    if (!active) return;
    if (active.index >= active.definition.steps.length - 1) {
      this.close('finished');
      return;
    }
    this.current.set({ ...active, index: active.index + 1 });
  }

  back(): void {
    const active = this.current();
    if (active && active.index > 0) {
      this.current.set({ ...active, index: active.index - 1 });
    }
  }

  /** Ends the running tour and remembers how. */
  close(outcome: Exclude<TourOutcome, 'dismissed'>): void {
    const active = this.current();
    if (!active) return;
    this.remember(active.definition, outcome);
    this.current.set(null);
    const opener = this.opener;
    this.opener = null;
    if (opener?.isConnected) opener.focus();
  }

  /** "Not now" on an invitation: it isn't offered again. */
  dismiss(definition: TourDefinition): void {
    this.remember(definition, 'dismissed');
  }

  private remember(definition: TourDefinition, status: TourOutcome): void {
    this.progress.write(tourKey(definition, this.demo), {
      v: 1,
      version: definition.version,
      status,
      at: new Date().toISOString(),
    });
    this.written.update((n) => n + 1);
  }
}
