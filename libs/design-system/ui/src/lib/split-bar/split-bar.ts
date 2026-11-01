import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SplitBarSegment {
  readonly label: string;
  readonly percentage: number;
  readonly value?: string | number;
  readonly color?: string;
}

export type SplitBarSize = 'sm' | 'md' | 'lg';

/**
 * Multi-segment proportional distribution bar for comparing participant shares,
 * resource allocations, or categorical splits across light and dark themes.
 */
@Component({
  selector: 'ah-split-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-split-bar',
    '[class.ah-split-bar--sm]': "size() === 'sm'",
    '[class.ah-split-bar--md]': "size() === 'md'",
    '[class.ah-split-bar--lg]': "size() === 'lg'",
  },
  templateUrl: './split-bar.html',
  styleUrl: './split-bar.scss',
})
export class SplitBar {
  readonly segments = input.required<readonly SplitBarSegment[]>();
  readonly size = input<SplitBarSize>('md');
  readonly showLegend = input<boolean>(true);
  readonly ariaLabel = input<string>('Proportional comparison bar');
}
