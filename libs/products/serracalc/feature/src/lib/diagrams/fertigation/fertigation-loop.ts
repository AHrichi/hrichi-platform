import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  FertigationParams,
  FertigationResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** The drain valve: 0–100 % reused along x 300–460. */
const V_X0 = 300;
const V_X1 = 460;
/** The sodium chart: 0–120 days across x 60–540, 0–NA_MAX mmol/L up. */
const C_X0 = 60;
const C_X1 = 540;
const C_Y0 = 300;
const C_Y1 = 200;
const DAYS = 120;
const NA_MAX = 16;

export const FERT_LIMITS = {
  recycle: { min: 0, max: 100, step: 5 },
  naLimit: { min: 2, max: NA_MAX, step: 0.5 },
} as const;

const xRecycle = (pct: number) =>
  V_X0 + (clamp(pct, 0, 100) / 100) * (V_X1 - V_X0);
const xDay = (day: number) =>
  C_X0 + (clamp(day, 0, DAYS) / DAYS) * (C_X1 - C_X0);
const yNa = (na: number) =>
  C_Y0 - (clamp(na, 0, NA_MAX) / NA_MAX) * (C_Y0 - C_Y1);

/**
 * The closed loop: fresh water and the A and B stocks into the dripper, the
 * crop, its drain split between reuse and discharge; under it, sodium in the
 * loop over 120 days against the flush limit. Drag the share reused and the
 * sodium limit.
 */
@Component({
  selector: 'sc-fertigation-loop',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fertigation-loop.html',
  styleUrl: './fertigation-loop.scss',
})
export class FertigationLoop {
  readonly params = input.required<FertigationParams>();
  readonly result = input.required<FertigationResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = FERT_LIMITS;
  protected readonly cx0 = C_X0;
  protected readonly cx1 = C_X1;
  protected readonly cy0 = C_Y0;
  protected readonly cy1 = C_Y1;

  protected readonly valveX = computed(() =>
    xRecycle(this.params().recyclePct),
  );
  protected readonly limitY = computed(() => yNa(this.params().naLimitMmolL));
  protected readonly line = computed(
    () =>
      'M' +
      this.result()
        .days.map(
          (d) => `${xDay(d.day).toFixed(1)} ${yNa(d.naMmolL).toFixed(1)}`,
        )
        .join('L'),
  );
  protected readonly flushX = computed(() => {
    const day = this.result().flushDay;
    return day !== null && day <= DAYS ? xDay(day) : null;
  });
  protected readonly ticks = [0, 30, 60, 90, 120].map((d) => ({
    d,
    x: xDay(d),
  }));
  protected readonly naTicks = [0, 4, 8, 12, 16].map((na) => ({
    na,
    y: yNa(na),
  }));
  /** Line widths of the reused and discharged drain, 2–10 px. */
  protected readonly reusedW = computed(
    () => 2 + (this.params().recyclePct / 100) * 8,
  );
  protected readonly dischargedW = computed(
    () => 2 + ((100 - this.params().recyclePct) / 100) * 8,
  );

  protected readonly alt = computed(() =>
    this.t().diagrams.fertAlt(
      this.i18n.num(this.params().recyclePct, 0),
      this.i18n.num(this.result().drainEcDsM, 1),
      this.result().flushDay === null
        ? this.t().common.none
        : String(this.result().flushDay),
    ),
  );

  protected readonly recycleAt = (p: SvgPoint): number =>
    ((p.x - V_X0) / (V_X1 - V_X0)) * 100;
  protected readonly naAt = (p: SvgPoint): number =>
    ((C_Y0 - p.y) / (C_Y0 - C_Y1)) * NA_MAX;
}
