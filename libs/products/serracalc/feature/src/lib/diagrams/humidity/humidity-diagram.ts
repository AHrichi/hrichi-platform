import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  HumidityParams,
  HumidityResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** Thermometers: −10…30 °C from y 214 up to y 94. */
const T_MIN = -10;
const T_MAX = 30;
const Y_COLD = 214;
const K_T = 3;
/** The humidity gauge: 50–100 % from y 200 up to y 100. */
const RH_MIN = 50;
const Y_RH0 = 200;
const K_RH = 2;

export const HUMIDITY_LIMITS = {
  inside: { min: 5, max: T_MAX, step: 0.5 },
  outside: { min: T_MIN, max: T_MAX, step: 0.5 },
  rh: { min: RH_MIN, max: 98, step: 1 },
} as const;

function yOf(t: number): number {
  return Y_COLD - (clamp(t, T_MIN, T_MAX) - T_MIN) * K_T;
}

function yRh(rh: number): number {
  return Y_RH0 - (clamp(rh, RH_MIN, 100) - RH_MIN) * K_RH;
}

/**
 * A night in the house: inside and outside temperatures, the humidity to
 * hold, the dew point beside the cover's inside temperature (drips when the
 * cover is colder), and the outside air brought in to carry the water out.
 * Drag both thermometers and the humidity gauge.
 */
@Component({
  selector: 'sc-humidity-diagram',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './humidity-diagram.html',
  styleUrl: './humidity-diagram.scss',
})
export class HumidityDiagram {
  readonly params = input.required<HumidityParams>();
  readonly result = input.required<HumidityResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = HUMIDITY_LIMITS;
  protected readonly yCold = Y_COLD;
  protected readonly yHot = yOf(T_MAX);
  protected readonly yRh0 = Y_RH0;
  protected readonly yRhTop = yRh(100);

  protected readonly yInside = computed(() => yOf(this.params().insideC));
  protected readonly yOutside = computed(() => yOf(this.params().outsideC));
  protected readonly yDew = computed(() => yOf(this.result().dewPointC));
  protected readonly yRhValue = computed(() => yRh(this.params().insideRhPct));
  protected readonly airWidth = computed(
    () => 2 + Math.min(10, (this.result().airChangesPerHour ?? 0) * 4),
  );
  protected readonly drips = [150, 178, 206, 330, 358, 386];

  protected readonly alt = computed(() =>
    this.t().diagrams.humidityAlt(
      this.i18n.num(this.params().insideC),
      this.i18n.num(this.params().insideRhPct, 0),
      this.i18n.num(this.result().dewPointC),
      this.i18n.num(this.result().coverSurfaceC),
    ),
  );

  protected readonly tempAt = (p: SvgPoint): number =>
    T_MIN + (Y_COLD - p.y) / K_T;
  protected readonly rhAt = (p: SvgPoint): number =>
    RH_MIN + (Y_RH0 - p.y) / K_RH;
}
