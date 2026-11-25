import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { AhMetricCard } from '@ah/ui';
import {
  type CalcContext,
  type CalendarParams,
  CLIMATES,
  CROP_IDS,
  type CropId,
  cropCalendar,
  defaultCalendar,
  isoWeek,
  SOURCES,
  STAGES,
  stageTargets,
  targetSource,
} from '@ah/products/serracalc/domain';
import { CalendarTimeline } from '../../diagrams/calendar/calendar-timeline';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import { CALENDAR_FIELDS } from '../fields';
import { Panel } from '../../ui/panel/panel';

type CalendarTab = 'plan';

/**
 * The crop year: stages from the nursery to the clean-out, the climate each
 * stage wants, and the weeks heating, CO₂, shade and fog run.
 */
@Component({
  selector: 'sc-calendar-screen',
  imports: [
    Panel,
    AhMetricCard,
    CalendarTimeline,
    ContextBar,
    FieldGrid,
    NoteList,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class CalendarScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly climates = CLIMATES;
  protected readonly crops = CROP_IDS;
  protected readonly fields = CALENDAR_FIELDS;
  protected readonly today = isoWeek(new Date());

  protected readonly params = signal<CalendarParams>(
    defaultCalendar(this.store.context()),
  );
  protected readonly result = computed(() => cropCalendar(this.params()));

  protected readonly editor = injectCalcEditing<CalendarTab>({
    tabs: ['plan'],
    kinds: { plan: 'calendar' },
    load: (saved) => {
      if (saved.kind === 'calendar') this.params.set({ ...saved.inputs });
    },
  });

  /** Where the crop is this week, if it is in the house. */
  protected readonly now = computed(() =>
    this.result().weeks.find((w) => w.week === this.today),
  );

  protected readonly stageRows = computed(() =>
    STAGES.map((stage) => {
      const span = this.result().stages.find((s) => s.stage === stage);
      return {
        stage,
        span,
        targets: stageTargets(this.params().crop, stage),
        source: SOURCES[targetSource(this.params().crop, stage)],
      };
    }),
  );

  protected readonly suggestedLabel = computed(() => {
    const p = this.params();
    return `${this.t().kinds.calendar} · ${this.t().crops[p.crop]} · ${this.t().app.week} ${p.plantingWeek}`;
  });

  constructor() {
    effect(() => {
      const ctx = this.store.context();
      untracked(() => {
        if (!this.editor.editing()) this.reset(ctx);
      });
    });
  }

  protected reset(ctx: CalcContext = this.store.context()): void {
    this.params.set(defaultCalendar(ctx));
  }

  protected set(change: FieldChange): void {
    this.params.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setClimate(climateId: string): void {
    this.params.update((p) => ({ ...p, climateId }));
  }

  /** A new crop brings its own set points. */
  protected setCrop(crop: CropId): void {
    const fresh = defaultCalendar({ ...this.store.context(), crop });
    this.params.update((p) => ({
      ...p,
      crop,
      nightSetC: fresh.nightSetC,
      ventilateAboveC: fresh.ventilateAboveC,
      maxDli: fresh.maxDli,
    }));
  }

  protected save(request: SaveRequest): Promise<void> {
    return this.editor.save(this.params(), request);
  }

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
