import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type ProgressBarVariant =
  'primary' | 'accent' | 'success' | 'warning' | 'danger';
export type ProgressBarSize = 'sm' | 'md' | 'lg';

/**
 * Accessible, token-styled progress bar with percentage clamping,
 * semantic color variants, and accessible ARIA attributes.
 */
@Component({
  selector: 'ah-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-progress-bar-host',
    '[class.ah-progress--sm]': "size() === 'sm'",
    '[class.ah-progress--md]': "size() === 'md'",
    '[class.ah-progress--lg]': "size() === 'lg'",
  },
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly max = input<number>(100);
  readonly label = input<string>();
  readonly variant = input<ProgressBarVariant>('primary');
  readonly size = input<ProgressBarSize>('md');
  readonly showValue = input<boolean>(false);
  readonly showDetails = input<boolean>(false);
  readonly striped = input<boolean>(false);

  protected readonly percentage = computed(() => {
    const val = Number(this.value()) || 0;
    const maxVal = Number(this.max()) || 100;
    if (maxVal <= 0) return 0;
    const pct = (val / maxVal) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  protected readonly displayPercent = computed(() => {
    return Math.round(this.percentage());
  });
}
