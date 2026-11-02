import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { type BlockOf, chartSeries } from '@ah/products/studylm/lessons';

const W = 520;
const H = 260;
const PAD = { left: 48, right: 16, top: 16, bottom: 40 };
const COLOURS = [1, 2, 3, 4, 5].map((i) => `var(--color-data-${i})`);

/**
 * A line or bar chart. Growth functions are computed, not drawn from the
 * model's numbers; one that explodes (2^n, n!) is clipped at the top so
 * the others stay readable.
 */
@Component({
  selector: 'sl-chart-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = chart();
    <svg
      class="diagram"
      [attr.viewBox]="'0 0 ' + w + ' ' + h"
      role="img"
      [attr.aria-label]="label()"
    >
      <line
        class="axis"
        [attr.x1]="pad.left"
        [attr.y1]="h - pad.bottom"
        [attr.x2]="w - pad.right"
        [attr.y2]="h - pad.bottom"
      />
      <line
        class="axis"
        [attr.x1]="pad.left"
        [attr.y1]="pad.top"
        [attr.x2]="pad.left"
        [attr.y2]="h - pad.bottom"
      />
      <text
        class="tick"
        [attr.x]="pad.left - 6"
        [attr.y]="pad.top"
        text-anchor="end"
      >
        {{ c.max }}
      </text>
      <text
        class="tick"
        [attr.x]="pad.left - 6"
        [attr.y]="h - pad.bottom"
        text-anchor="end"
      >
        0
      </text>
      <text class="axis-label" [attr.x]="(w + pad.left) / 2" [attr.y]="h - 8">
        {{ block().xLabel }}
      </text>
      <text
        class="axis-label"
        x="12"
        [attr.y]="h / 2"
        [attr.transform]="'rotate(-90 12 ' + h / 2 + ')'"
      >
        {{ block().yLabel }}
      </text>
      @for (tick of c.ticks; track tick.x) {
        <text class="tick" [attr.x]="tick.x" [attr.y]="h - pad.bottom + 14">
          {{ tick.label }}
        </text>
      }
      @for (s of c.series; track s.id; let i = $index) {
        @if (block().chart === 'line') {
          <path
            [attr.d]="s.d"
            [style.stroke]="colours[i % colours.length]"
            class="line"
          />
        } @else {
          @for (bar of s.bars; track $index) {
            <rect
              [attr.x]="bar.x"
              [attr.y]="bar.y"
              [attr.width]="bar.w"
              [attr.height]="bar.h"
              [style.fill]="colours[i % colours.length]"
            />
          }
        }
      }
    </svg>
    <ul class="legend">
      @for (s of c.series; track s.id; let i = $index) {
        <li>
          <span
            class="swatch"
            [style.background]="colours[i % colours.length]"
          ></span
          >{{ s.label }}{{ s.clipped ? ' (off the top)' : '' }}
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      background: var(--color-stage-bg);
      color: var(--color-stage-text);
    }
    .diagram {
      display: block;
      inline-size: 100%;
    }
    .axis {
      stroke: var(--color-stage-border);
      stroke-width: 1.5;
    }
    .line {
      fill: none;
      stroke-width: 2.5;
    }
    text {
      fill: var(--color-stage-text);
      font-size: 11px;
      text-anchor: middle;
    }
    .tick {
      fill: color-mix(
        in srgb,
        var(--color-stage-text) 72%,
        var(--color-stage-bg)
      );
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin: var(--space-2) 0 0;
      padding: 0;
      list-style: none;
      font-size: var(--font-size-200);
    }
    .swatch {
      display: inline-block;
      inline-size: 0.8em;
      block-size: 0.8em;
      margin-inline-end: var(--space-1);
      border-radius: 2px;
    }
  `,
})
export class ChartView {
  readonly block = input.required<BlockOf<'chart'>>();
  protected readonly w = W;
  protected readonly h = H;
  protected readonly pad = PAD;
  protected readonly colours = COLOURS;

  protected readonly chart = computed(() => {
    const { xs, series } = chartSeries(this.block());
    const peaks = series
      .map((s) => Math.max(...s.values, 0))
      .sort((a, b) => a - b);
    // A series 20× above the next one would flatten everything else: clip it.
    const highest = peaks.at(-1) ?? 1;
    const next = peaks.at(-2) ?? highest;
    const top = next > 0 && highest > next * 20 ? next * 1.5 : highest;
    const max = Math.max(top, 1);
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (xs.length > 1 ? (i / (xs.length - 1)) * plotW : plotW / 2);
    const y = (v: number) => PAD.top + plotH - (Math.min(v, max) / max) * plotH;
    const band = plotW / Math.max(xs.length, 1);
    const step = Math.max(1, Math.ceil(xs.length / 8));
    return {
      max: Number.isInteger(max) ? max : Number(max.toPrecision(3)),
      ticks: xs
        .map((label, i) => ({
          label: String(label),
          x: this.block().chart === 'bar' ? PAD.left + band * (i + 0.5) : x(i),
        }))
        .filter((_, i) => i % step === 0),
      series: series.map((s, si) => ({
        ...s,
        clipped: s.values.some((v) => v > max),
        d: s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' '),
        bars: s.values.map((v, i) => {
          const bw = band / (series.length + 1);
          return {
            x: PAD.left + band * i + bw * (si + 0.5),
            y: y(v),
            w: bw,
            h: PAD.top + plotH - y(v),
          };
        }),
      })),
    };
  });

  protected readonly label = computed(
    () =>
      `${this.block().title ?? 'Chart'}: ${chartSeries(this.block())
        .series.map((s) => s.label)
        .join(', ')}`,
  );
}
