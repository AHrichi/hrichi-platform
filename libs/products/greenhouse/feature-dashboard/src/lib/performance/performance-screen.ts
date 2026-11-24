import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhMetricCard } from '@ah/ui';
import {
  checkTarget,
  costPerKg,
  costStatus,
  kgPerHour,
  type Metric,
  METRICS,
  payCoverage,
  rejectionRate,
  startOfWeek,
  type TargetInput,
  targetFor,
  todayOnFarm,
  type WorkTotals,
} from '@ah/products/greenhouse/domain';
import { GhButton } from '@ah/products/greenhouse/ui';
import { DashboardI18n } from '../i18n/dashboard-i18n';
import { type FieldProblems, formText } from '../shared/problems';
import { FarmStore } from '../store/farm.store';
import { buildPerformanceView } from './performance-view';

/** The periods a manager can look back over, in whole weeks. */
const PERIODS = [4, 8, 12] as const;

/** Workers shown before "show all". */
const TOP_WORKERS = 10;

/**
 * How the farm picks and what it costs, over the last weeks: kg per
 * worker-hour, rejected crates, and labour cost per kg against the
 * target; teams and workers ranked. Cost needs pay, so only managers and
 * HR see it. Managers set the targets here.
 */
@Component({
  selector: 'gh-performance-screen',
  imports: [AhMetricCard, GhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './performance-screen.html',
  styleUrls: ['../shared/screen.scss', './performance-screen.scss'],
})
export class PerformanceScreen {
  protected readonly store = inject(FarmStore);
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly periods = PERIODS;

  protected readonly metric = signal<Metric>('kgPerHour');
  protected readonly team = signal<string | null>(null);
  protected readonly showAll = signal(false);
  protected readonly problems = signal<FieldProblems<keyof TargetInput>>({});
  protected readonly saved = signal(false);

  /** Cost per kg is only there for those who may see pay. */
  protected readonly metrics = computed(() =>
    METRICS.filter((m) => m !== 'costPerKg' || this.store.canSeePay()),
  );
  protected readonly thisWeek = startOfWeek(todayOnFarm());

  protected readonly view = computed(() => {
    const performance = this.store.performance();
    if (!performance) return null;
    const { teams, workers } = this.store.setup();
    return buildPerformanceView({
      performance,
      teams,
      workers,
      metric: this.metric(),
      team: this.team(),
    });
  });

  protected readonly shownWorkers = computed(() => {
    const workers = this.view()?.workers ?? [];
    return this.showAll() ? workers : workers.slice(0, TOP_WORKERS);
  });

  /** The target in force this week, which the form changes. */
  protected readonly currentTarget = computed(() => {
    const performance = this.store.performance();
    return performance ? targetFor(performance.targets, this.thisWeek) : null;
  });

  protected readonly kgPerHour = kgPerHour;
  protected readonly rejectionRate = rejectionRate;
  protected readonly costPerKg = costPerKg;
  protected readonly costStatus = costStatus;
  protected readonly payCoverage = payCoverage;

  constructor() {
    void this.store.showPerformance();
  }

  protected setPeriod(weeks: number): void {
    this.showAll.set(false);
    void this.store.showPerformance(weeks);
  }

  protected setMetric(value: string): void {
    const metric = this.metrics().find((m) => m === value);
    if (metric) this.metric.set(metric);
  }

  protected setTeam(value: string): void {
    this.team.set(value || null);
    this.showAll.set(false);
  }

  protected teamName(teamId: string | null): string {
    if (teamId === null) return this.t().common.noTeam;
    return (
      this.store.setup().teams.find((t) => t.id === teamId)?.name ??
      this.t().common.none
    );
  }

  /** A metric's value, formatted, or a dash when there is none. */
  protected show(metric: Metric, totals: WorkTotals): string {
    switch (metric) {
      case 'kgPerHour': {
        const value = kgPerHour(totals);
        return value === null ? this.t().common.none : this.i18n.num(value, 1);
      }
      case 'rejectionRate': {
        const value = rejectionRate(totals);
        return value === null ? this.t().common.none : this.i18n.percent(value);
      }
      case 'costPerKg': {
        const value = costPerKg(totals);
        return value === null ? this.t().common.none : this.i18n.money(value);
      }
    }
  }

  /** A bar's length, as a share of the best week (0 to 100). */
  protected barSize(totals: WorkTotals): number {
    const best = this.view()?.bestWeekRate ?? 0;
    const rate = kgPerHour(totals) ?? 0;
    return best > 0 ? Math.round((rate / best) * 100) : 0;
  }

  protected async saveTarget(form: HTMLFormElement): Promise<void> {
    const values = formText(form);
    const result = checkTarget({
      costPerKg: values['costPerKg'] ?? '',
      kgPerWeek: values['kgPerWeek'] ?? '',
    });
    this.saved.set(false);
    if (!result.ok) {
      this.problems.set(result.errors);
      return;
    }
    this.problems.set({});
    if (
      await this.store.saveTarget({ weekStart: this.thisWeek, ...result.value })
    ) {
      this.saved.set(true);
    }
  }

  protected problem(field: keyof TargetInput): string | null {
    const problem = this.problems()[field];
    return problem ? this.t().common.errors[problem] : null;
  }
}
