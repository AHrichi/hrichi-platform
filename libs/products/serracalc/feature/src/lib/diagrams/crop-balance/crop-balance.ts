import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  climateById,
  type CropWaterParams,
  type CropWaterResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import type { SvgPoint } from '../svg-drag';

const SLAB = 200;
/** The plant grows 0.9 px per percent of canopy, from 30 px. */
const PLANT_BASE = 30;
const PLANT_K = 0.9;
/** The applied-water column: drain at the bottom, transpiration above. */
const COL_TOP = 54;
const COL_H = 146;

export const CROP_LIMITS = {
  canopy: { min: 10, max: 100, step: 5 },
  drain: { min: 0, max: 60, step: 1 },
} as const;

/**
 * A peak day's water for one m² of crop: sunlight in, the plant transpiring
 * (bigger with more canopy), and the day's irrigation split into what the
 * crop uses and what drains. Drag the plant's top for the canopy and the
 * line in the column for the drain share.
 */
@Component({
  selector: 'sc-crop-balance',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crop-balance.html',
  styleUrl: './crop-balance.scss',
})
export class CropBalance {
  readonly params = input.required<CropWaterParams>();
  readonly result = input.required<CropWaterResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = CROP_LIMITS;
  protected readonly slab = SLAB;
  protected readonly colTop = COL_TOP;
  protected readonly colH = COL_H;

  protected readonly peak = computed(
    () => this.result().months[this.result().peakMonth],
  );
  protected readonly outsideMj = computed(
    () =>
      climateById(this.params().climateId).months[this.result().peakMonth]
        .radiationMj,
  );
  protected readonly plantTop = computed(
    () => SLAB - PLANT_BASE - this.params().canopyPct * PLANT_K,
  );
  /** Leaves along the stem, wider with more canopy. */
  protected readonly leaves = computed(() => {
    const top = this.plantTop();
    const size = 8 + this.params().canopyPct * 0.14;
    const count = Math.max(2, Math.round((SLAB - top) / 26));
    return Array.from({ length: count }, (_, i) => ({
      y: top + 14 + i * ((SLAB - top - 24) / count),
      side: i % 2 === 0 ? -1 : 1,
      size,
    }));
  });
  protected readonly yDrain = computed(
    () => COL_TOP + COL_H * (1 - this.params().drainPct / 100),
  );
  protected readonly drainLm2 = computed(
    () => this.peak().grossLm2 - this.peak().netLm2,
  );

  protected readonly alt = computed(() =>
    this.t().diagrams.cropAlt(
      this.i18n.num(this.peak().grossLm2),
      this.i18n.num(this.peak().netLm2),
      this.i18n.num(this.params().drainPct, 0),
    ),
  );

  protected readonly canopyAt = (p: SvgPoint): number =>
    (SLAB - PLANT_BASE - p.y) / PLANT_K;
  protected readonly drainAt = (p: SvgPoint): number =>
    100 * (1 - (p.y - COL_TOP) / COL_H);
}
