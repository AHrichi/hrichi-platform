import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import { AhMetricCard } from '@ah/ui';
import { GhButton } from '@ah/products/greenhouse/ui';
import {
  parseAmount,
  type PlanEntry,
  type Weekday,
  weekDates,
} from '@ah/products/greenhouse/domain';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { WeekNav } from '../shared/week-nav';
import { FarmStore } from '../store/farm.store';
import {
  buildWeekView,
  pickedKg,
  shortageReport,
  withCellKg,
  withHours,
  withTeam,
} from './week-view';

const DEFAULT_HOURS = 8;

/**
 * The manager's week: expected kg per greenhouse and day, the team that
 * picks each greenhouse, the workers each needs, required against
 * available per day, and the shortage report for HR. Every change is
 * saved as it is made; HR sees the same screen, read-only.
 */
@Component({
  selector: 'gh-plan-screen',
  imports: [AhMetricCard, GhButton, WeekNav],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-screen.html',
  styleUrl: './plan-screen.scss',
})
export class PlanScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly copied = signal(false);
  /** Teams picked for greenhouses with nothing planned yet this week. */
  private readonly chosenTeams = signal<Record<string, string>>({});

  private readonly entries = computed(
    () => this.store.currentWeek()?.plan ?? [],
  );
  protected readonly hoursPerDay = computed(
    () => this.entries()[0]?.hoursPerDay ?? DEFAULT_HOURS,
  );
  protected readonly dates = computed(() => weekDates(this.store.weekStart()));
  protected readonly teams = computed(() => this.store.setup().teams);
  protected readonly view = computed(() => {
    const { greenhouses, workers } = this.store.setup();
    const week = this.store.currentWeek();
    return buildWeekView({
      weekStart: this.store.weekStart(),
      greenhouses,
      workers,
      absences: week?.absences ?? [],
      history: week?.history ?? [],
      entries: this.entries(),
    });
  });
  protected readonly picked = computed(() =>
    pickedKg(this.store.currentWeek()?.history ?? []),
  );
  /** Teams short somewhere that pooling would cover. */
  protected readonly rebalance = computed(() =>
    this.view().gap.days.some((d) => d.teamShortage > d.shortage),
  );

  protected readonly report = computed(() =>
    shortageReport(this.view().gap, this.t().report, {
      day: (date) => this.i18n.longDay(date),
      num: (value) => this.i18n.num(value),
    }),
  );
  protected readonly whatsappHref = computed(
    () => `https://wa.me/?text=${encodeURIComponent(this.report().body)}`,
  );
  protected readonly mailHref = computed(() => {
    const { subject, body } = this.report();
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  /** The team picking a greenhouse this week, or null if none is set. */
  protected rowTeam(greenhouseId: string): string | null {
    return (
      this.entries().find((e) => e.greenhouseId === greenhouseId)?.teamId ??
      this.chosenTeams()[greenhouseId] ??
      null
    );
  }

  protected setTeam(greenhouseId: string, teamId: string): void {
    if (!teamId) return;
    this.chosenTeams.update((teams) => ({ ...teams, [greenhouseId]: teamId }));
    const row = this.row(greenhouseId);
    if (row.length > 0) {
      void this.store.savePlanRow(greenhouseId, withTeam(row, teamId));
    }
    this.copied.set(false);
  }

  protected setKg(greenhouseId: string, day: Weekday, text: string): void {
    const value = text.trim() ? parseAmount(text) : null;
    if (value !== null && !(Number.isFinite(value) && value >= 0)) return;
    void this.store.savePlanRow(
      greenhouseId,
      withCellKg(this.row(greenhouseId), {
        weekStart: this.store.weekStart(),
        greenhouseId,
        day,
        expectedKg: value === null ? null : Math.round(value),
        teamId: this.rowTeam(greenhouseId),
        hoursPerDay: this.hoursPerDay(),
      }),
    );
    this.copied.set(false);
  }

  protected setHours(text: string): void {
    const value = parseAmount(text);
    if (!(Number.isFinite(value) && value > 0 && value <= 12)) return;
    const entries = withHours(this.entries(), value);
    for (const id of new Set(entries.map((e) => e.greenhouseId))) {
      void this.store.savePlanRow(
        id,
        entries.filter((e) => e.greenhouseId === id),
      );
    }
  }

  protected copyLastWeek(): void {
    if (
      this.entries().length > 0 &&
      !this.window?.confirm(this.t().plan.copyLastConfirm)
    ) {
      return;
    }
    void this.store.copyLastWeek();
  }

  protected async copyReport(): Promise<void> {
    const { subject, body } = this.report();
    try {
      await this.window?.navigator.clipboard.writeText(`${subject}\n\n${body}`);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  protected print(): void {
    this.window?.print();
  }

  protected cellLabel(greenhouse: string, date: string): string {
    return this.i18n.fill(this.t().plan.cell, {
      greenhouse,
      day: this.i18n.longDay(date),
    });
  }

  protected teamName(teamId: string | null): string {
    return (
      this.teams().find((t) => t.id === teamId)?.name ?? this.t().common.none
    );
  }

  private row(greenhouseId: string): PlanEntry[] {
    return this.entries().filter((e) => e.greenhouseId === greenhouseId);
  }
}
