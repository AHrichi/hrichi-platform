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
  addDays,
  isWeekStart,
  type PlanEntry,
  sampleFarm,
  startOfWeek,
  todayOnFarm,
  type Weekday,
  weekDates,
} from '@ah/products/greenhouse/domain';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { buildWeekView, shortageReport, withExpectedKg } from './week-view';

const DEFAULT_HOURS = 8;

/**
 * The manager's week: expected kg per greenhouse and day (editable), the
 * workers each needs, required against available per day, and the
 * shortage report for HR, all recomputed as the numbers change.
 */
@Component({
  selector: 'gh-plan-screen',
  imports: [AhMetricCard, GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-screen.html',
  styleUrl: './plan-screen.scss',
})
export class PlanScreen {
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly weekStart = signal(startOfWeek(todayOnFarm()));
  protected readonly hoursPerDay = signal(DEFAULT_HOURS);
  /** The manager's changes, per week; the demo doesn't save them. */
  private readonly edits = signal<Record<string, PlanEntry[]>>({});
  protected readonly copied = signal(false);

  /** The sample farm stands in for Supabase until the dashboard reads it. */
  private readonly farm = computed(() => sampleFarm(this.weekStart()));
  private readonly entries = computed(() =>
    (this.edits()[this.weekStart()] ?? this.farm().plan).map((e) => ({
      ...e,
      hoursPerDay: this.hoursPerDay(),
    })),
  );
  protected readonly dates = computed(() => weekDates(this.weekStart()));
  protected readonly view = computed(() => {
    const farm = this.farm();
    return buildWeekView({
      weekStart: this.weekStart(),
      greenhouses: farm.greenhouses,
      workers: farm.workers,
      absences: farm.absences,
      history: farm.history,
      entries: this.entries(),
    });
  });
  protected readonly teamNames = computed(
    () => new Map(this.farm().teams.map((t) => [t.id, t.name])),
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

  protected shiftWeek(weeks: number): void {
    this.weekStart.update((week) => addDays(week, 7 * weeks));
    this.copied.set(false);
  }

  protected goToThisWeek(): void {
    this.weekStart.set(startOfWeek(todayOnFarm()));
    this.copied.set(false);
  }

  protected isThisWeek(): boolean {
    return this.weekStart() === startOfWeek(todayOnFarm());
  }

  protected setKg(greenhouseId: string, day: Weekday, text: string): void {
    const value = Number(text.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0) return;
    const week = this.weekStart();
    if (!isWeekStart(week)) return;
    this.edits.update((edits) => ({
      ...edits,
      [week]: withExpectedKg(edits[week] ?? this.farm().plan, {
        weekStart: week,
        greenhouseId,
        day,
        expectedKg: Math.round(value),
        hoursPerDay: this.hoursPerDay(),
      }),
    }));
    this.copied.set(false);
  }

  protected setHours(text: string): void {
    const value = Number(text.replace(',', '.'));
    if (Number.isFinite(value) && value > 0 && value <= 12) {
      this.hoursPerDay.set(value);
    }
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

  protected teamsOf(teamIds: string[]): string {
    return teamIds.map((id) => this.teamNames().get(id) ?? id).join(', ');
  }
}
