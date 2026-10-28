import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type MetricCardVariant =
  'default' | 'accent' | 'success' | 'warning' | 'danger';
export type MetricCardElevation = 'flat' | 'raised';

export interface MetricTrend {
  readonly direction: 'up' | 'down' | 'neutral';
  readonly label: string;
  readonly positive?: boolean;
}

/**
 * Metric/KPI summary card displaying a primary value, optional trend, icon,
 * and contextual explanation. Fully token-driven for dark and light themes.
 */
@Component({
  selector: 'ah-metric-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-card ah-metric-card',
    '[class.ah-metric-card--raised]': "elevation() === 'raised'",
    '[class.ah-metric-card--accent]': "variant() === 'accent'",
    '[class.ah-metric-card--success]': "variant() === 'success'",
    '[class.ah-metric-card--warning]': "variant() === 'warning'",
    '[class.ah-metric-card--danger]': "variant() === 'danger'",
  },
  template: `
    <div class="ah-metric-head">
      <span class="ah-metric-label">{{ label() }}</span>
      @if (icon()) {
        <span class="ah-metric-icon" aria-hidden="true">{{ icon() }}</span>
      }
    </div>

    <div class="ah-metric-value-row">
      <span class="ah-metric-value">{{ value() }}</span>
      @if (unit()) {
        <span class="ah-metric-unit">{{ unit() }}</span>
      }
    </div>

    @if (trend(); as t) {
      <div
        class="ah-metric-trend"
        [class.ah-metric-trend--positive]="t.positive === true"
        [class.ah-metric-trend--negative]="t.positive === false"
      >
        <span class="ah-metric-trend-arrow" aria-hidden="true">{{
          trendArrow()
        }}</span>
        <span>{{ t.label }}</span>
      </div>
    }

    @if (hint()) {
      <p class="ah-metric-hint">{{ hint() }}</p>
    }

    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      transition:
        border-color var(--motion-duration-fast) ease,
        box-shadow var(--motion-duration-fast) ease;
    }

    :host(.ah-metric-card--raised) {
      background: var(--color-bg-raised);
      box-shadow: var(--shadow-raised);
    }

    :host(.ah-metric-card--accent) {
      border-color: var(--color-accent-default);
    }

    :host(.ah-metric-card--success) {
      border-color: var(--color-success-default);
    }

    :host(.ah-metric-card--warning) {
      border-color: var(--color-amber-300);
    }

    :host(.ah-metric-card--danger) {
      border-color: var(--color-crimson-500);
    }

    .ah-metric-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
    }

    .ah-metric-label {
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      letter-spacing: -0.01em;
    }

    .ah-metric-icon {
      font-size: 1.25rem;
      line-height: 1;
      opacity: 0.85;
    }

    .ah-metric-value-row {
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .ah-metric-value {
      font-size: var(--font-size-500);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-default);
      line-height: var(--font-line-height-tight);
      letter-spacing: -0.02em;
    }

    .ah-metric-unit {
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
    }

    .ah-metric-trend {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
    }

    .ah-metric-trend--positive {
      color: var(--color-success-default);
    }

    .ah-metric-trend--negative {
      color: var(--color-crimson-500);
    }

    .ah-metric-trend-arrow {
      font-size: 0.9em;
      line-height: 1;
    }

    .ah-metric-hint {
      margin: 0;
      font-size: var(--font-size-100);
      color: var(--color-text-muted);
      line-height: var(--font-line-height-normal);
    }
  `,
})
export class MetricCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input<string>();
  readonly icon = input<string>();
  readonly hint = input<string>();
  readonly trend = input<MetricTrend>();
  readonly variant = input<MetricCardVariant>('default');
  readonly elevation = input<MetricCardElevation>('flat');

  protected readonly trendArrow = computed(() => {
    const t = this.trend();
    if (!t) return '';
    if (t.direction === 'up') return '↑';
    if (t.direction === 'down') return '↓';
    return '→';
  });
}
