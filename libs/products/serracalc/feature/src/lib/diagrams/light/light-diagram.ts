import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { LightParams, LightResult } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** The light column: 0–50 mol/m²·d from y 220 up to y 40. */
const DLI_MAX = 50;
const Y_ZERO = 220;
const K_DLI = 3.6;
/** The day bar: 24 hours across 240 px. */
const DAY_X = 220;
const K_HOUR = 10;
const MAX_LAMPS = 8;

export const LIGHT_LIMITS = {
  target: { min: 5, max: 40, step: 1 },
  ceiling: { min: 10, max: 50, step: 1 },
  hours: { min: 2, max: 20, step: 1 },
} as const;

function yOf(dli: number): number {
  return Y_ZERO - clamp(dli, 0, DLI_MAX) * K_DLI;
}

/**
 * The darkest month's light: the sun's share and what the lamps add to
 * reach the target, under the ceiling where shading starts. Lamps over the
 * crop, and their hours on a 24-hour bar. Drag the target, the ceiling and
 * the end of the lamps' hours.
 */
@Component({
  selector: 'sc-light-diagram',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './light-diagram.html',
  styleUrl: './light-diagram.scss',
})
export class LightDiagram {
  readonly params = input.required<LightParams>();
  readonly result = input.required<LightResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = LIGHT_LIMITS;
  protected readonly yZero = Y_ZERO;
  protected readonly dayX = DAY_X;
  protected readonly dayW = 24 * K_HOUR;

  protected readonly design = computed(
    () => this.result().months[this.result().designMonth],
  );
  protected readonly ySun = computed(() => yOf(this.design().naturalDli));
  protected readonly yTarget = computed(() => yOf(this.params().targetDli));
  protected readonly yCeiling = computed(() => yOf(this.params().maxDli));
  protected readonly xHours = computed(
    () => DAY_X + this.params().lampHours * K_HOUR,
  );
  /** Lamps drawn over the crop, more for more watts per m². */
  protected readonly lamps = computed(() => {
    const n =
      this.result().fixtures === 0
        ? 0
        : Math.min(
            MAX_LAMPS,
            Math.max(1, Math.round(this.result().wPerM2 / 20)),
          );
    const gap = 240 / Math.max(1, n);
    return Array.from({ length: n }, (_, i) => DAY_X + gap * (i + 0.5));
  });

  protected readonly alt = computed(() =>
    this.t().diagrams.lightAlt(
      this.i18n.month(this.result().designMonth),
      this.i18n.num(this.design().naturalDli),
      this.i18n.num(this.params().targetDli, 0),
      this.i18n.num(this.result().designPpfd, 0),
    ),
  );

  protected readonly dliAt = (p: SvgPoint): number => (Y_ZERO - p.y) / K_DLI;
  protected readonly hoursAt = (p: SvgPoint): number => (p.x - DAY_X) / K_HOUR;
}
