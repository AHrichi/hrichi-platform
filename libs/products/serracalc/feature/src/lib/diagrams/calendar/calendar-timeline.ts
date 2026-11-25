import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  type CalendarParams,
  type CalendarResult,
  type CalendarWeek,
  monthOfWeek,
  WEEKS_PER_YEAR,
  wrapWeek,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** Weeks 1–52 across, from x 108 to x 628. */
const X0 = 108;
const X1 = 628;
const KW = (X1 - X0) / WEEKS_PER_YEAR;
/** The temperature strip: −5…45 °C from y 104 up to y 40. */
const T_LOW = -5;
const T_HIGH = 45;
const TY0 = 104;
const TY1 = 40;
const KT = (TY0 - TY1) / (T_HIGH - T_LOW);

const xOf = (week: number) => X0 + (wrapWeek(week) - 1) * KW;
const yT = (t: number) => TY0 - (clamp(t, T_LOW, T_HIGH) - T_LOW) * KT;

type SystemKey = 'heating' | 'co2' | 'shade' | 'fog';
const SYSTEMS: readonly { key: SystemKey; y: number }[] = [
  { key: 'heating', y: 190 },
  { key: 'co2', y: 212 },
  { key: 'shade', y: 234 },
  { key: 'fog', y: 256 },
];

interface Run {
  stage: CalendarWeek['stage'];
  x: number;
  w: number;
}

/**
 * The crop year on one strip: outside temperatures, the crop's stages, the
 * nursery for the next crop, and the weeks each system runs, with this
 * week marked. Drag the planting week and the end of the crop.
 */
@Component({
  selector: 'sc-calendar-timeline',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-timeline.html',
  styleUrl: './calendar-timeline.scss',
})
export class CalendarTimeline {
  readonly params = input.required<CalendarParams>();
  readonly result = input.required<CalendarResult>();
  /** Today's ISO week. */
  readonly today = input.required<number>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly x0 = X0;
  protected readonly x1 = X1;
  protected readonly kw = KW;
  protected readonly systems = SYSTEMS;

  /** Calendar order, January first. */
  private readonly byWeek = computed(() =>
    [...this.result().weeks].sort((a, b) => a.week - b.week),
  );

  protected readonly months = computed(() => {
    const out: { x: number; label: string }[] = [];
    let last = -1;
    for (let week = 1; week <= WEEKS_PER_YEAR; week++) {
      const month = monthOfWeek(week);
      if (month !== last) {
        out.push({ x: xOf(week), label: this.t().monthsShort[month] });
        last = month;
      }
    }
    return out;
  });

  protected readonly tempArea = computed(() => {
    const weeks = this.byWeek();
    const top = weeks.map((w) => `${xOf(w.week) + KW / 2} ${yT(w.tMaxC)}`);
    const bottom = weeks
      .map((w) => `${xOf(w.week) + KW / 2} ${yT(w.tMinC)}`)
      .reverse();
    return `M${top.join('L')}L${bottom.join('L')}Z`;
  });
  protected readonly setLine = computed(() => yT(this.params().nightSetC));
  protected readonly coolLine = computed(() => yT(this.params().coolAboveC));
  protected readonly tTicks = [0, 20, 40].map((t) => ({ t, y: yT(t) }));

  protected readonly runs = computed<Run[]>(() => {
    const runs: Run[] = [];
    for (const w of this.byWeek()) {
      const last = runs[runs.length - 1];
      if (
        last &&
        last.stage === w.stage &&
        Math.abs(last.x + last.w - xOf(w.week)) < 0.5
      ) {
        last.w += KW;
      } else {
        runs.push({ stage: w.stage, x: xOf(w.week), w: KW });
      }
    }
    return runs;
  });

  protected readonly nursery = computed(() =>
    this.byWeek()
      .filter((w) => w.nursery)
      .map((w) => xOf(w.week)),
  );

  protected readonly cells = computed(() =>
    SYSTEMS.map((s) => ({
      ...s,
      xs: this.byWeek()
        .filter((w) => w[s.key])
        .map((w) => xOf(w.week)),
    })),
  );

  protected readonly todayX = computed(() => xOf(this.today()) + KW / 2);
  protected readonly plantX = computed(() => xOf(this.params().plantingWeek));
  protected readonly endX = computed(() => xOf(this.result().endWeek) + KW);

  protected readonly alt = computed(() =>
    this.t().diagrams.calendarAlt(
      String(this.params().plantingWeek),
      String(this.result().firstHarvestWeek),
      String(this.result().endWeek),
      String(this.result().heatingFromWeek || '—'),
    ),
  );

  protected readonly weekAt = (p: SvgPoint): number => 1 + (p.x - X0) / KW;
  /** The end handle sets the crop's length from the planting week. */
  protected readonly lengthAt = (p: SvgPoint): number => {
    const week = Math.round((p.x - X0) / KW);
    return (
      ((week - this.params().plantingWeek + WEEKS_PER_YEAR * 2) %
        WEEKS_PER_YEAR) +
      1
    );
  };
}
