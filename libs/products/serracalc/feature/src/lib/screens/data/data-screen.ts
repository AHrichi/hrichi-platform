import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AhMetricCard } from '@ah/ui';
import {
  analyseReadings,
  type AlertCode,
  climateById,
  type CropStage,
  parseReadingsCsv,
  readingsToCsv,
  sampleWeek,
  STAGES,
  stageTargets,
  vpdBandsFor,
} from '@ah/products/serracalc/domain';
import { HourlyChart } from '../../diagrams/hourly/hourly-chart';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { NoteList } from '../../ui/note-list/note-list';

/**
 * Live data: readings imported from a logger's CSV (or a sample week),
 * compared with what the calculators expect: VPD against the stage's band,
 * day and night temperatures, the drain; VPD by hour; alerts.
 */
@Component({
  selector: 'sc-data-screen',
  imports: [AhMetricCard, HourlyChart, NoteList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-screen.html',
  styleUrls: ['../calc-screen.scss', './data-screen.scss'],
})
export class DataScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly stages = STAGES;

  protected readonly pasted = signal('');
  protected readonly message = signal<string | null>(null);
  protected readonly stage = signal<CropStage>('harvest');
  protected readonly flushEc = signal(4.5);
  protected readonly drainPlan = signal(30);

  protected readonly readings = computed(
    () => this.store.activeProject()?.readings ?? [],
  );
  protected readonly analysis = computed(() =>
    analyseReadings(this.readings(), {
      crop: this.store.context().crop,
      stage: this.stage(),
      flushEcDsM: this.flushEc(),
      drainPct: this.drainPlan(),
    }),
  );
  protected readonly vpdBand = computed(
    () =>
      vpdBandsFor(stageTargets(this.store.context().crop, this.stage()), 'sun')
        .band,
  );
  protected readonly dayBand = computed(
    () => stageTargets(this.store.context().crop, this.stage()).dayC,
  );
  protected readonly vpdByHour = computed(() =>
    this.analysis().hours.map((h) => h.vpdKpa),
  );
  protected readonly tempByHour = computed(() =>
    this.analysis().hours.map((h) => h.airC),
  );

  /** A sample file to try the import with, saved like a backup. */
  protected downloadSample(): void {
    const week = sampleWeek(
      climateById(this.store.context().climateId),
      0,
      '2026-01-12',
    );
    const file = new File([readingsToCsv(week)], 'serracalc-sample-week.csv', {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected alertTitle(code: AlertCode): string {
    return this.t().data.alerts[code];
  }

  protected async importText(text: string): Promise<void> {
    const r = parseReadingsCsv(text);
    if (r.error) {
      this.message.set(this.t().data.errors[r.error]);
      return;
    }
    await this.store.setReadings(r.readings);
    this.message.set(
      this.t().data.imported(String(r.readings.length), String(r.skipped)),
    );
    this.pasted.set('');
  }

  protected async onFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await this.importText(await file.text());
    (event.target as HTMLInputElement).value = '';
  }

  protected async loadSample(): Promise<void> {
    const week = sampleWeek(
      climateById(this.store.context().climateId),
      0,
      '2026-01-12',
    );
    await this.store.setReadings(week);
    this.message.set(this.t().data.imported(String(week.length), '0'));
  }

  protected async clear(): Promise<void> {
    await this.store.setReadings([]);
    this.message.set(null);
  }

  protected number(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected when(iso: string): string {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(this.i18n.locale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date);
  }
}
