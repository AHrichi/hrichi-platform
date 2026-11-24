import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { AhButton, AhMetricCard } from '@ah/ui';
import {
  CLIMATES,
  climateById,
  dayLengthHours,
  midMonthDay,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { MonthBars, type MonthSeries } from '../../ui/month-bars/month-bars';

/** The climate presets: monthly normals and the design days. */
@Component({
  selector: 'sc-climate-screen',
  imports: [AhButton, AhMetricCard, MonthBars],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './climate-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class ClimateScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly climates = CLIMATES;

  protected readonly climateId = signal(this.store.context().climateId);
  protected readonly climate = computed(() => climateById(this.climateId()));
  protected readonly inUse = computed(
    () => this.store.activeProject()?.climateId === this.climateId(),
  );

  protected readonly rows = computed(() => {
    const c = this.climate();
    return c.months.map((m, i) => ({
      month: i,
      ...m,
      dayHours: dayLengthHours(c.latitude, midMonthDay(i)),
    }));
  });

  protected readonly rainYear = computed(() =>
    this.climate().months.reduce((s, m) => s + m.rainMm, 0),
  );

  /** One axis per chart: the temperature range, then the rain. */
  protected readonly temperatures = computed<MonthSeries[]>(() => [
    {
      label: `${this.t().climate.table.tMin} – ${this.t().climate.table.tMax}`,
      values: this.climate().months.map((m) => m.tMaxC),
    },
  ]);
  protected readonly lows = computed(() =>
    this.climate().months.map((m) => m.tMinC),
  );
  protected readonly rain = computed<MonthSeries[]>(() => [
    {
      label: this.t().climate.table.rain,
      values: this.climate().months.map((m) => m.rainMm),
    },
  ]);

  constructor() {
    effect(() => {
      const id = this.store.context().climateId;
      untracked(() => this.climateId.set(id));
    });
  }

  protected choose(event: Event): void {
    this.climateId.set((event.target as HTMLSelectElement).value);
  }

  protected useForProject(): Promise<void> {
    return this.store.updateProject({ climateId: this.climateId() });
  }
}
