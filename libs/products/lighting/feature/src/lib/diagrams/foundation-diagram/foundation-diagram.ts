import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import type { FoundationCalculationResult } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

const GROUND = 130;
const CENTER = 240;
/** Pixels per metre below ground (the pole above is not to scale). */
const K = 70;

export const DEPTH_LIMITS = { min: 0.6, max: 2.6, step: 0.05 } as const;

/**
 * Cross-section of the concrete block: the wind pushes on the pole (and the
 * solar panel), the block and the soil hold it. Drag the block's bottom to try
 * an excavation depth against the minimum.
 */
@Component({
  selector: 'lp-foundation-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foundation-diagram.html',
  styleUrl: './foundation-diagram.scss',
})
export class FoundationDiagram {
  readonly depth = model.required<number>();
  readonly result = input.required<FoundationCalculationResult>();
  readonly hasSolarPanel = input(false);

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = DEPTH_LIMITS;
  protected readonly ground = GROUND;
  protected readonly center = CENTER;

  protected readonly halfWidth = computed(
    () => (this.result().recommendedBlockWidthMeters * K) / 2,
  );
  protected readonly bottom = computed(() => GROUND + this.depth() * K);
  protected readonly minLine = computed(
    () => GROUND + this.result().minRecommendedDepthMeters * K,
  );
  protected readonly boltLength = computed(
    () => (this.result().anchorBolts.lengthMm / 1000) * K,
  );
  protected readonly tone = computed(() => {
    switch (this.result().depthComplianceVerdict) {
      case 'safe':
        return 'is-safe';
      case 'marginal':
        return 'is-marginal';
      default:
        return 'is-unsafe';
    }
  });

  protected drag(point: SvgPoint): void {
    const { min, max, step } = DEPTH_LIMITS;
    this.depth.set(clamp(snap((point.y - GROUND) / K, step), min, max));
  }

  protected key(event: KeyboardEvent): void {
    const { min, max, step } = DEPTH_LIMITS;
    // The down arrow digs deeper, as on the drawing.
    const next = stepByKey(event, this.depth(), step, min, max, true);
    if (next !== null) this.depth.set(next);
  }
}
