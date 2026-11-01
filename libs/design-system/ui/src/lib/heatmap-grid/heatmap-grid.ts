import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

export interface HeatmapRowData {
  readonly label: string;
  readonly shortLabel?: string;
  readonly values: readonly number[];
}

export interface HeatmapActiveCell {
  readonly rowLabel: string;
  readonly colLabel: string;
  readonly value: number;
}

/**
 * Accessible 2D intensity matrix grid (e.g., 7 days × 24 hours) with 5-level
 * semantic color scaling for both Light and Dark themes, plus hover/focus readout.
 */
@Component({
  selector: 'ah-heatmap-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-heatmap-grid',
  },
  templateUrl: './heatmap-grid.html',
  styleUrl: './heatmap-grid.scss',
})
export class HeatmapGrid {
  readonly rows = input.required<readonly HeatmapRowData[]>();
  readonly colLabels = input.required<readonly string[]>();
  readonly cornerLabel = input<string>('Day \\ Hr');
  readonly unitLabel = input<string>('msgs');
  readonly maxValue = input<number>(0);

  protected readonly activeCell = signal<HeatmapActiveCell | null>(null);

  protected readonly resolvedMax = computed(() => {
    const explicitMax = this.maxValue();
    if (explicitMax > 0) return explicitMax;
    let max = 1;
    for (const r of this.rows()) {
      for (const v of r.values) {
        if (v > max) max = v;
      }
    }
    return max;
  });

  protected cellLevel(value: number): number {
    const max = this.resolvedMax();
    if (value <= 0 || max <= 0) return 0;
    const ratio = value / max;
    if (ratio <= 0.2) return 1;
    if (ratio <= 0.45) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  }

  protected setActive(rowLabel: string, colLabel: string, value: number): void {
    this.activeCell.set({ rowLabel, colLabel, value });
  }
}
