import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { LogRow } from '@ah/products/greenhouse/data-access';
import {
  checkWorkLog,
  HIGH_KG_PER_HOUR,
  MAX_SHIFT_HOURS,
  type Worker,
  type WorkLogDraft,
  type WorkLogError,
} from '@ah/products/greenhouse/domain';
import { fill, FieldI18n } from '../../i18n/field-i18n';
import { FieldStore } from '../../store/field.store';
import { BadgeScanner, canScanBadges } from '../../ui/badge-scanner';
import { Stepper } from '../../ui/stepper';

const DEFAULT_HOURS = 8;

/**
 * Logging one greenhouse's day: find the worker (badge scan, typed code or
 * the list), count their crates and hours, save on the phone. The form
 * resets for the next worker straight away; sending happens on its own.
 */
@Component({
  selector: 'gh-log-screen',
  imports: [RouterLink, BadgeScanner, Stepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './log-screen.html',
  styleUrl: './log-screen.scss',
})
export class LogScreen {
  /** From the route, `/log/:greenhouseId`. */
  readonly greenhouseId = input.required<string>();

  protected readonly store = inject(FieldStore);
  protected readonly i18n = inject(FieldI18n);
  protected readonly t = this.i18n.t;
  protected readonly canScan = canScanBadges();
  protected readonly maxHours = MAX_SHIFT_HOURS;

  protected readonly greenhouse = computed(
    () =>
      this.store.greenhouses().find((g) => g.id === this.greenhouseId()) ??
      null,
  );
  protected readonly entries = computed(
    () => this.store.logsByGreenhouse().get(this.greenhouseId()) ?? [],
  );
  /** The worker list, grouped by team, for the fallback picker. */
  protected readonly teams = computed(() => {
    const names = this.store.teamNames();
    const groups = new Map<string, Worker[]>();
    for (const worker of this.store.workers()) {
      const key = worker.teamId ?? '';
      groups.set(key, [...(groups.get(key) ?? []), worker]);
    }
    return [...groups.entries()]
      .map(([teamId, workers]) => ({
        label: names.get(teamId) ?? this.t().log.noTeam,
        workers,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  // Who.
  protected readonly badge = signal('');
  protected readonly lookupError = signal<string | null>(null);
  protected readonly cameraBlocked = signal(false);
  protected readonly worker = signal<Worker | null>(null);
  protected readonly editing = signal<LogRow | null>(null);

  // How much.
  protected readonly crates = signal<number | null>(null);
  protected readonly rejected = signal<number | null>(0);
  protected readonly kg = signal<number | null>(null);
  protected readonly hours = signal<number | null>(DEFAULT_HOURS);

  /** Errors show once the supervisor has tried to save. */
  protected readonly submitted = signal(false);
  /** A rate that looks like a typo needs a second tap. */
  protected readonly confirmHigh = signal(false);
  /** The last thing done, kept as a key so it follows a language switch. */
  private readonly done = signal<{
    what: 'saved' | 'changed' | 'deleted';
    name?: string;
  } | null>(null);
  protected readonly notice = computed(() => {
    const done = this.done();
    if (!done) return '';
    const text = this.t().log[done.what];
    return done.name ? `${text} ${done.name}` : text;
  });
  protected readonly busy = signal(false);

  protected readonly draft = computed<WorkLogDraft>(() => ({
    date: this.store.date(),
    workerId: this.worker()?.id ?? null,
    greenhouseId: this.greenhouse()?.id ?? null,
    crates: this.crates(),
    kg: this.kg(),
    rejectedCrates: this.rejected(),
    hours: this.hours(),
  }));
  protected readonly check = computed(() =>
    checkWorkLog(this.draft(), this.greenhouse()?.kgPerCrate ?? 1),
  );
  /** "About 312 kg", while the kg come from the crates. */
  protected readonly estimate = computed(() => {
    const kg = this.check().kg;
    return this.kg() === null && kg !== null
      ? fill(this.t().log.estimate, { kg: this.i18n.num(kg, 1) })
      : null;
  });
  /** What this worker already has here today, to catch a double entry. */
  protected readonly loggedToday = computed(() => {
    const worker = this.worker();
    if (!worker) return null;
    const editingId = this.editing()?.id;
    const rows = this.entries().filter(
      (r) => r.workerId === worker.id && r.id !== editingId,
    );
    if (rows.length === 0) return null;
    const kg = rows.reduce((total, r) => total + r.kg, 0);
    return fill(this.t().log.alreadyToday, { kg: this.i18n.num(kg, 1) });
  });
  protected readonly highRate = computed(() =>
    this.check().warnings.includes('high-rate')
      ? fill(this.t().log.highRate, { rate: HIGH_KG_PER_HOUR })
      : null,
  );

  constructor() {
    // Any change to the numbers needs a fresh look at the warning.
    effect(() => {
      this.draft();
      untracked(() => this.confirmHigh.set(false));
    });
  }

  protected error(field: keyof ReturnType<typeof checkWorkLog>['errors']) {
    const code: WorkLogError | undefined = this.check().errors[field];
    if (!code) return null;
    // Wrong input shows at once; a missing one only after a save attempt.
    if (code === 'required' && !this.submitted()) return null;
    return this.t().log.errors[code];
  }

  protected setBadge(value: string): void {
    this.badge.set(value);
    this.lookupError.set(null);
  }

  protected async lookup(): Promise<void> {
    const found = await this.store.findWorker(this.badge());
    if (found) {
      this.choose(found);
    } else {
      this.lookupError.set(this.t().log.unknownBadge);
    }
  }

  protected onScanned(code: string): void {
    this.badge.set(code);
    void this.lookup();
  }

  protected pick(workerId: string): void {
    const found = this.store.workers().find((w) => w.id === workerId);
    if (found) this.choose(found);
  }

  /** Starts a fresh entry for `worker`, keeping the last hours used. */
  private choose(worker: Worker): void {
    const hours = this.hours();
    this.reset();
    this.hours.set(hours ?? DEFAULT_HOURS);
    this.worker.set(worker);
    this.done.set(null);
  }

  protected edit(row: LogRow): void {
    const worker = this.store
      .roster()
      ?.workers.find((w) => w.id === row.workerId);
    if (!worker) return;
    this.choose(worker);
    this.editing.set(row);
    this.crates.set(row.crates);
    this.rejected.set(row.rejectedCrates);
    this.hours.set(row.hours);
    // Kg worked out from crates show as an estimate again, not a weight.
    const perCrate = this.greenhouse()?.kgPerCrate ?? 0;
    const fromCrates =
      Math.round((row.crates - row.rejectedCrates) * perCrate * 100) / 100;
    this.kg.set(row.crates > 0 && row.kg === fromCrates ? null : row.kg);
  }

  protected async save(): Promise<void> {
    this.submitted.set(true);
    const check = this.check();
    const worker = this.worker();
    const greenhouse = this.greenhouse();
    if (!check.valid || check.kg === null || !worker || !greenhouse) return;
    if (check.warnings.length > 0 && !this.confirmHigh()) {
      this.confirmHigh.set(true);
      return;
    }
    this.busy.set(true);
    try {
      const editing = this.editing();
      if (editing) {
        await this.store.update(editing.id, {
          kg: check.kg,
          crates: this.crates() ?? 0,
          rejectedCrates: this.rejected() ?? 0,
          hours: this.hours() ?? 0,
        });
        this.done.set({ what: 'changed' });
      } else {
        await this.store.save(this.draft(), worker, greenhouse);
        this.done.set({ what: 'saved', name: worker.fullName });
      }
      this.reset();
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(row: LogRow): Promise<void> {
    if (!globalThis.confirm?.(this.t().log.deleteConfirm)) return;
    if (await this.store.remove(row.id)) {
      this.done.set({ what: 'deleted' });
      if (this.editing()?.id === row.id) this.reset();
    }
  }

  protected reset(): void {
    this.worker.set(null);
    this.editing.set(null);
    this.badge.set('');
    this.lookupError.set(null);
    this.crates.set(null);
    this.rejected.set(0);
    this.kg.set(null);
    this.hours.set(this.hours() ?? DEFAULT_HOURS);
    this.submitted.set(false);
  }

  protected nameOf(workerId: string): string {
    return this.store.workerNames().get(workerId) ?? workerId;
  }

  protected summary(row: LogRow): string {
    return fill(this.t().log.summary, {
      kg: this.i18n.num(row.kg, 1),
      crates: this.i18n.num(row.crates),
      rejected: this.i18n.num(row.rejectedCrates),
      hours: this.i18n.num(row.hours, 1),
    });
  }
}
