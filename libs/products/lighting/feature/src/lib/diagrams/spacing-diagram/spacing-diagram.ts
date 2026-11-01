import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import type { SpacingCalculationResult } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

const GROUND = 176;
const X0 = 50;
/** Pixels per metre, the same both ways so S/H looks the way it is. */
const K = 6.5;

export const SPACING_LIMITS = {
  height: { min: 4, max: 16, step: 0.5 },
  spacing: { min: 10, max: 60, step: 1 },
} as const;

/**
 * Side view of two poles and their light. Each beam reaches about 2 H on the
 * road, so the pools meet near S/H = 4; past that a dark band shows between
 * them. Drag the first pole's top for H, the second pole's foot for S.
 */
@Component({
  selector: 'lp-spacing-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spacing-diagram.html',
  styleUrl: './spacing-diagram.scss',
})
export class SpacingDiagram {
  readonly height = model.required<number>();
  readonly spacing = model.required<number>();
  readonly result = input.required<SpacingCalculationResult>();
  /** Whether the overhead cable holds at this spacing; null when there's none. */
  readonly cableFits = input<boolean | null>(null);

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = SPACING_LIMITS;
  protected readonly ground = GROUND;
  protected readonly x0 = X0;

  protected readonly top = computed(() => GROUND - this.height() * K);
  protected readonly xB = computed(() => X0 + this.spacing() * K);

  protected readonly cones = computed(() =>
    [X0, this.xB()].map((x) => {
      const lampX = x + 16;
      const lampY = this.top() + 6;
      const half = 2 * this.height() * K;
      return `${lampX},${lampY} ${lampX - half},${GROUND} ${lampX + half},${GROUND}`;
    }),
  );

  /** The unlit stretch of road between the two beams, if any. */
  protected readonly darkGap = computed(() => {
    const reach = 2 * this.height() * K;
    const from = X0 + 16 + reach;
    const to = this.xB() + 16 - reach;
    return to > from ? { from, to } : null;
  });

  protected readonly tone = computed(() => {
    switch (this.result().ratioEvaluation) {
      case 'optimal':
        return 'ok';
      case 'acceptable':
      case 'too_close':
        return 'warn';
      default:
        return 'bad';
    }
  });

  protected dragHeight(point: SvgPoint): void {
    const { min, max, step } = SPACING_LIMITS.height;
    this.height.set(clamp(snap((GROUND - point.y) / K, step), min, max));
  }

  protected dragSpacing(point: SvgPoint): void {
    const { min, max, step } = SPACING_LIMITS.spacing;
    this.spacing.set(clamp(snap((point.x - X0) / K, step), min, max));
  }

  protected keyHeight(event: KeyboardEvent): void {
    const { min, max, step } = SPACING_LIMITS.height;
    const next = stepByKey(event, this.height(), step, min, max);
    if (next !== null) this.height.set(next);
  }

  protected keySpacing(event: KeyboardEvent): void {
    const { min, max, step } = SPACING_LIMITS.spacing;
    const next = stepByKey(event, this.spacing(), step, min, max);
    if (next !== null) this.spacing.set(next);
  }
}
