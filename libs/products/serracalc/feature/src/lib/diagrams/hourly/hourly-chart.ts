import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { Band } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';

const X0 = 48;
const X1 = 584;
const Y0 = 170;
const Y1 = 20;
const KH = (X1 - X0) / 24;

/**
 * A value for each hour of the day (the mean over the imported days) as
 * bars on one axis, coloured by whether they sit in the target band, which
 * is drawn behind them.
 */
@Component({
  selector: 'sc-hourly-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 600 200" role="img" [attr.aria-label]="label()">
      <rect class="backdrop" width="600" height="200" rx="12" />
      @if (bandBox(); as b) {
        <rect
          class="band"
          [attr.x]="x0"
          [attr.y]="b.y"
          [attr.width]="x1 - x0"
          [attr.height]="b.h"
        />
      }
      @for (tick of ticks(); track tick.v) {
        <path class="grid" [attr.d]="'M' + x0 + ' ' + tick.y + 'H' + x1" />
        <text
          class="tick"
          [attr.x]="x0 - 6"
          [attr.y]="tick.y + 4"
          text-anchor="end"
        >
          {{ i18n.num(tick.v, digits()) }}
        </text>
      }
      @for (bar of bars(); track bar.hour) {
        @if (bar.h > 0) {
          <rect
            class="bar"
            [class.out]="!bar.ok"
            [attr.x]="bar.x"
            [attr.y]="bar.y"
            [attr.width]="bar.w"
            [attr.height]="bar.h"
            rx="2"
          >
            <title>
              {{ bar.hour }}:00 · {{ i18n.num(bar.v, digits()) }} {{ unit() }}
            </title>
          </rect>
        }
      }
      @for (h of hourTicks; track h) {
        <text class="tick" [attr.x]="x0 + h * kh" y="188" text-anchor="middle">
          {{ h }}:00
        </text>
      }
      <text class="tick" x="8" y="14">{{ unit() }}</text>
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    svg {
      display: block;
      inline-size: 100%;
      block-size: auto;
      direction: ltr;
      font-family: var(--font-family-sans);
    }

    .backdrop {
      fill: var(--color-bg-surface);
    }

    .band {
      fill: var(--color-success-default);
      opacity: 0.14;
    }

    .grid {
      fill: none;
      stroke: var(--color-border-default);
      stroke-width: 1;
      opacity: 0.6;
    }

    .tick {
      fill: var(--color-text-muted);
      font-size: 11px;
    }

    .bar {
      fill: var(--color-accent-default);

      &.out {
        fill: var(--color-warning-default);
      }
    }
  `,
})
export class HourlyChart {
  readonly values = input.required<readonly (number | null)[]>();
  readonly band = input<Band | null>(null);
  readonly unit = input('');
  readonly digits = input(1);
  readonly label = input.required<string>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly x0 = X0;
  protected readonly x1 = X1;
  protected readonly kh = KH;
  protected readonly hourTicks = [0, 6, 12, 18, 24];

  private readonly top = computed(() => {
    const values = this.values().filter((v): v is number => v !== null);
    const max = Math.max(1e-6, ...values, this.band()?.max ?? 0);
    return max * 1.15;
  });
  private readonly y = (v: number) =>
    Y0 - (Math.max(0, v) / this.top()) * (Y0 - Y1);

  protected readonly ticks = computed(() => {
    const step = this.top() / 4;
    return [0, 1, 2, 3, 4].map((i) => ({ v: step * i, y: this.y(step * i) }));
  });
  protected readonly bandBox = computed(() => {
    const b = this.band();
    return b ? { y: this.y(b.max), h: this.y(b.min) - this.y(b.max) } : null;
  });
  protected readonly bars = computed(() =>
    this.values().map((v, hour) => {
      const value = v ?? 0;
      const b = this.band();
      return {
        hour,
        v: value,
        ok: !b || (value >= b.min && value <= b.max),
        x: X0 + hour * KH + 2,
        w: KH - 4,
        y: this.y(value),
        h: v === null ? 0 : Y0 - this.y(value),
      };
    }),
  );
}
