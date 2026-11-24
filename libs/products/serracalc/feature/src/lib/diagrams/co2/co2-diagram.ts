import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { Co2Params, Co2Result } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** The ppm gauge: 300–1500 ppm from y 220 up to y 50. */
const PPM_MIN = 300;
const PPM_MAX = 1500;
const Y_LOW = 220;
const K_PPM = 170 / (PPM_MAX - PPM_MIN);
/** The leak arrow leaves the right wall, 5 px per air change an hour. */
const WALL_X = 400;
const K_ACH = 5;

export const CO2_LIMITS = {
  target: { min: 400, max: 1500, step: 10 },
  ach: { min: 0.2, max: 12, step: 0.1 },
} as const;

function yOf(ppm: number): number {
  return Y_LOW - (clamp(ppm, PPM_MIN, PPM_MAX) - PPM_MIN) * K_PPM;
}

/**
 * Enrichment in the house: the gauge's target against outside air, CO₂
 * from the burner or the tank, some taken up by the crop, the rest leaking
 * out. Drag the gauge for the target and the leak's arrow for the air
 * changes an hour.
 */
@Component({
  selector: 'sc-co2-diagram',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './co2-diagram.html',
  styleUrl: './co2-diagram.scss',
})
export class Co2Diagram {
  readonly params = input.required<Co2Params>();
  readonly result = input.required<Co2Result>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = CO2_LIMITS;
  protected readonly yLow = Y_LOW;
  protected readonly yHigh = yOf(PPM_MAX);
  protected readonly wallX = WALL_X;
  protected readonly ticks = [400, 800, 1200].map((v) => ({ v, y: yOf(v) }));

  protected readonly yTarget = computed(() => yOf(this.params().targetPpm));
  protected readonly yOutside = computed(() => yOf(this.params().outsidePpm));
  protected readonly leakEnd = computed(
    () =>
      WALL_X +
      12 +
      clamp(this.params().airChangesPerHour, 0, CO2_LIMITS.ach.max) * K_ACH,
  );
  protected readonly leakWidth = computed(() => {
    const r = this.result();
    return 3 + 8 * (r.supplyKgH > 0 ? r.ventLossKgH / r.supplyKgH : 0);
  });
  protected readonly uptakeWidth = computed(() => {
    const r = this.result();
    return 3 + 8 * (r.supplyKgH > 0 ? r.uptakeKgH / r.supplyKgH : 0);
  });
  /** More dots in the air for a higher target. */
  protected readonly dots = computed(() => {
    const n = Math.round(this.params().targetPpm / 50);
    return Array.from({ length: n }, (_, i) => ({
      x: 140 + ((i * 53) % 240),
      y: 132 + ((i * 29) % 46),
    }));
  });

  protected readonly alt = computed(() =>
    this.t().diagrams.co2Alt(
      this.i18n.num(this.params().targetPpm, 0),
      this.i18n.num(this.result().supplyKgH),
      this.i18n.num(this.result().usedPct, 0),
    ),
  );

  protected readonly ppmAt = (p: SvgPoint): number =>
    PPM_MIN + (Y_LOW - p.y) / K_PPM;
  protected readonly achAt = (p: SvgPoint): number =>
    (p.x - WALL_X - 12) / K_ACH;
}
