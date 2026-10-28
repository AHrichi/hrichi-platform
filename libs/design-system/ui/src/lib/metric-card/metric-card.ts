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
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
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
