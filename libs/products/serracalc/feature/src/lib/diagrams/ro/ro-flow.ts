import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { RoParams, RoResult } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** The membrane vessel: recovery 30–60 % along x 220–420. */
const R_MIN = 30;
const R_MAX = 60;
const V_X0 = 220;
const V_X1 = 420;
/** The product tank: 0.5–7 days from y 150 up to y 66. */
const D_MIN = 0.5;
const D_MAX = 7;
const T_Y0 = 150;
const T_Y1 = 66;

export const RO_LIMITS = {
  recovery: { min: R_MIN, max: R_MAX, step: 1 },
  days: { min: D_MIN, max: D_MAX, step: 0.5 },
} as const;

const xOf = (r: number) =>
  V_X0 + ((clamp(r, R_MIN, R_MAX) - R_MIN) / (R_MAX - R_MIN)) * (V_X1 - V_X0);
const yOf = (d: number) =>
  T_Y0 - ((clamp(d, D_MIN, D_MAX) - D_MIN) / (D_MAX - D_MIN)) * (T_Y0 - T_Y1);

/**
 * Seawater to the crop: intake, the high-pressure pump and the membranes,
 * product to the tank and brine to the sea, each line as wide as its flow.
 * Drag the recovery along the membranes and the storage up the tank.
 */
@Component({
  selector: 'sc-ro-flow',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ro-flow.html',
  styleUrl: './ro-flow.scss',
})
export class RoFlow {
  readonly params = input.required<RoParams>();
  readonly result = input.required<RoResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = RO_LIMITS;
  protected readonly vx0 = V_X0;
  protected readonly vx1 = V_X1;
  protected readonly ty0 = T_Y0;

  /** Line widths: the feed is 14 px, the rest in proportion. */
  private readonly scale = computed(() =>
    this.result().feedM3Day > 0 ? 14 / this.result().feedM3Day : 0,
  );
  protected readonly feedW = 14;
  protected readonly productW = computed(() =>
    Math.max(2, this.result().needM3Day * this.scale()),
  );
  protected readonly brineW = computed(() =>
    Math.max(2, this.result().brineM3Day * this.scale()),
  );
  protected readonly recoveryX = computed(() => xOf(this.params().recoveryPct));
  protected readonly tankY = computed(() => yOf(this.params().storageDays));

  protected readonly alt = computed(() =>
    this.t().diagrams.roAlt(
      this.i18n.num(this.result().feedM3Day, 0),
      this.i18n.num(this.result().needM3Day, 0),
      this.i18n.num(this.result().brineM3Day, 0),
      this.i18n.num(this.result().brineSalinityGL),
    ),
  );

  protected readonly recoveryAt = (p: SvgPoint): number =>
    R_MIN + ((p.x - V_X0) / (V_X1 - V_X0)) * (R_MAX - R_MIN);
  protected readonly daysAt = (p: SvgPoint): number =>
    D_MIN + ((T_Y0 - p.y) / (T_Y0 - T_Y1)) * (D_MAX - D_MIN);
}
