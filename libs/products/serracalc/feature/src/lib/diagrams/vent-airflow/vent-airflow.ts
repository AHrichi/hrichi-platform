import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  VentilationParams,
  VentilationResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

const T_MAX = 48;
const Y_ZERO = 205;
const KT = 2.5;
/** The roof vent: hinged at the ridge, drawn 22 px per metre of opening. */
const HINGE = { x: 260, y: 74 };
const FLAP = { dx: 40, dy: 14 };
const KV = 22;

export const VENT_LIMITS = {
  outside: { min: 0, max: T_MAX, step: 0.5 },
  rise: { min: 1, max: 10, step: 0.5 },
  opening: { min: 0.2, max: 3, step: 0.1 },
} as const;

function yOf(t: number): number {
  return Y_ZERO - clamp(t, 0, T_MAX) * KT;
}

/**
 * A sunny day in cross-section: sunlight in, cool air through the side,
 * warm air out of the roof vent. Drag the outside thermometer, the inside
 * one (how much warmer the house may get) and the vent flap's opening.
 */
@Component({
  selector: 'sc-vent-airflow',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vent-airflow.html',
  styleUrl: './vent-airflow.scss',
})
export class VentAirflow {
  readonly params = input.required<VentilationParams>();
  readonly result = input.required<VentilationResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = VENT_LIMITS;
  protected readonly hinge = HINGE;
  protected readonly yHot = yOf(T_MAX);
  protected readonly yZero = Y_ZERO;

  protected readonly yOutside = computed(() => yOf(this.params().outsideC));
  protected readonly yInside = computed(() =>
    yOf(this.params().outsideC + this.params().maxRiseK),
  );
  protected readonly flapTip = computed(() => ({
    x: HINGE.x + FLAP.dx,
    y: HINGE.y + FLAP.dy - this.params().ventOpeningM * KV,
  }));
  /** Air arrows thicken with the air changes an hour. */
  protected readonly airWidth = computed(
    () => 2 + Math.min(12, this.result().airChangesPerHour / 6),
  );
  protected readonly sunWidth = computed(
    () => 1 + 3 * (1 - this.params().shadingPct / 100),
  );

  protected readonly alt = computed(() =>
    this.t().diagrams.ventAlt(
      this.i18n.num(this.params().outsideC),
      this.i18n.num(this.params().maxRiseK),
      this.i18n.num(this.result().ventAreaM2, 0),
    ),
  );

  protected readonly tempAt = (p: SvgPoint): number => (Y_ZERO - p.y) / KT;
  protected readonly riseAt = (p: SvgPoint): number =>
    this.tempAt(p) - this.params().outsideC;
  protected readonly openingAt = (p: SvgPoint): number =>
    (HINGE.y + FLAP.dy - p.y) / KV;
}
