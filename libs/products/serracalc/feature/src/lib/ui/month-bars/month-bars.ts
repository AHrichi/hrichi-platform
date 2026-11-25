import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { SerraI18n } from '../../i18n/serra-i18n';
import { ticks } from './month-ticks';

/** A level drawn across the chart, such as a target, labelled at its end. */
export interface MonthRef {
  readonly label: string;
  readonly value: number;
}

export interface MonthSeries {
  readonly label: string;
  /** Twelve values, January first. */
  readonly values: readonly number[];
}

interface Bar {
  readonly key: string;
  readonly path: string;
  readonly series: number;
  readonly tip: string;
}

const W = 480;
const H = 220;
const LEFT = 40;
const RIGHT = 8;
const TOP = 26;
const BOTTOM = 26;
const RADIUS = 4;
/** Surface gap between stacked segments and neighbouring bars. */
const GAP = 2;

/** A bar from y0 (baseline side) to y1, rounded only at its data end. */
function bar(x: number, w: number, y0: number, y1: number): string {
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  const h = bottom - top;
  if (h <= 0.5) return '';
  const r = Math.min(RADIUS, h, w / 2);
  return [
    `M${x} ${bottom}`,
    `V${top + r}`,
    `Q${x} ${top} ${x + r} ${top}`,
    `H${x + w - r}`,
    `Q${x + w} ${top} ${x + w} ${top + r}`,
    `V${bottom}`,
    'Z',
  ].join(' ');
}

/**
 * Twelve months as bars on one axis: one series, two side by side, or
 * stacked. With `low`, each bar floats from its low value (a range, such
 * as the day's minimum to maximum). Hover a bar for its value; the legend
 * names each series when there are two.
 */
@Component({
  selector: 'sc-month-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-bars.html',
  styleUrl: './month-bars.scss',
})
export class MonthBars {
  readonly series = input.required<readonly MonthSeries[]>();
  readonly stacked = input(false);
  /** Bars float from these values (one series only). */
  readonly low = input<readonly number[] | null>(null);
  readonly unit = input('');
  readonly digits = input(0);
  readonly ariaLabel = input.required<string>();
  /** Dashed levels across the chart, on the same axis. */
  readonly refs = input<readonly MonthRef[]>([]);

  protected readonly i18n = inject(SerraI18n);
  protected readonly width = W;
  protected readonly height = H;
  protected readonly left = LEFT;
  protected readonly right = W - RIGHT;

  private readonly range = computed(() => {
    const series = this.series();
    const low = this.low();
    let max = 0;
    let min = 0;
    for (let m = 0; m < 12; m++) {
      const values = series.map((s) => s.values[m] ?? 0);
      const top = this.stacked()
        ? values.reduce((a, b) => a + b, 0)
        : Math.max(...values);
      max = Math.max(max, top, ...this.refs().map((r) => r.value));
      if (low) min = Math.min(min, low[m] ?? 0);
    }
    const t = ticks(min, max > min ? max : min + 1);
    return { min: t[0], max: t[t.length - 1], ticks: t };
  });

  protected readonly yTicks = computed(() =>
    this.range().ticks.map((v) => ({ v, y: this.y(v) })),
  );

  protected readonly levels = computed(() =>
    this.refs().map((r) => ({ ...r, y: this.y(r.value) })),
  );

  protected readonly baseline = computed(() =>
    this.y(Math.max(0, this.range().min)),
  );

  protected readonly months = computed(() => {
    const band = (W - LEFT - RIGHT) / 12;
    return this.i18n.t().monthsShort.map((label, i) => ({
      label,
      x: LEFT + band * (i + 0.5),
    }));
  });

  protected readonly bars = computed<Bar[]>(() => {
    const series = this.series();
    const low = this.low();
    const band = (W - LEFT - RIGHT) / 12;
    const grouped = !this.stacked() && series.length > 1;
    const groupWidth = band * 0.7;
    const barWidth = grouped
      ? (groupWidth - GAP * (series.length - 1)) / series.length
      : groupWidth;
    const out: Bar[] = [];
    const unit = this.unit();
    const name = this.i18n.t().months;
    for (let m = 0; m < 12; m++) {
      const x0 = LEFT + band * m + (band - groupWidth) / 2;
      let stack = 0;
      series.forEach((s, i) => {
        const value = s.values[m] ?? 0;
        // Nothing to draw for an empty month (a range always draws).
        if (!low && value <= 0) return;
        let from: number;
        let to: number;
        let x = x0;
        if (this.stacked()) {
          from = stack;
          to = stack + value;
          stack = to;
        } else {
          from = low ? (low[m] ?? 0) : 0;
          to = value;
          if (grouped) x = x0 + i * (barWidth + GAP);
        }
        // Leave a surface gap between stacked segments.
        const y0 = this.y(from) - (this.stacked() && i > 0 ? GAP : 0);
        const path = bar(x, barWidth, y0, this.y(to));
        if (!path) return;
        const shown = low
          ? `${this.i18n.num(from, this.digits())} – ${this.i18n.num(to, this.digits())}`
          : this.i18n.num(value, this.digits());
        out.push({
          key: `${m}-${i}`,
          path,
          series: i,
          tip: `${name[m]} · ${s.label}: ${shown} ${unit}`.trim(),
        });
      });
    }
    return out;
  });

  private y(value: number): number {
    const { min, max } = this.range();
    const span = max - min || 1;
    return TOP + (1 - (value - min) / span) * (H - TOP - BOTTOM);
  }
}
