import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import {
  rhForVpd,
  type VpdParams,
  type VpdResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** The plot: 10–40 °C across, 100–30 % humidity down. */
const T_MIN = 10;
const T_MAX = 40;
const RH_MIN = 30;
const RH_MAX = 100;
const X0 = 56;
const X1 = 536;
const Y0 = 20;
const Y1 = 300;
const KX = (X1 - X0) / (T_MAX - T_MIN);
const KY = (Y1 - Y0) / (RH_MAX - RH_MIN);

export const VPD_LIMITS = {
  air: { min: T_MIN, max: T_MAX, step: 0.5 },
  rh: { min: RH_MIN, max: 99, step: 1 },
} as const;

const xOf = (t: number) => X0 + (clamp(t, T_MIN, T_MAX) - T_MIN) * KX;
const yOf = (rh: number) => Y0 + (RH_MAX - clamp(rh, RH_MIN, RH_MAX)) * KY;

/** An iso-VPD line across the plot, left to right (or back). */
function curve(vpd: number, reverse = false): string[] {
  const points: string[] = [];
  for (let t = T_MIN; t <= T_MAX; t += 1) {
    const rh = rhForVpd(t, vpd) ?? 0;
    points.push(`${xOf(t).toFixed(1)} ${yOf(rh).toFixed(1)}`);
  }
  return reverse ? points.reverse() : points;
}

/**
 * The VPD map: every temperature and humidity coloured by what the crop
 * makes of it at this stage and light (too wet, good, ideal, too dry), the
 * temperature band, and the air now as a point. Drag the temperature along
 * the bottom and the humidity up the side.
 */
@Component({
  selector: 'sc-vpd-chart',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vpd-chart.html',
  styleUrl: './vpd-chart.scss',
})
export class VpdChart {
  readonly params = input.required<VpdParams>();
  readonly result = input.required<VpdResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = VPD_LIMITS;
  protected readonly x0 = X0;
  protected readonly x1 = X1;
  protected readonly y0 = Y0;
  protected readonly y1 = Y1;

  protected readonly tTicks = [10, 15, 20, 25, 30, 35, 40].map((t) => ({
    t,
    x: xOf(t),
  }));
  protected readonly rhTicks = [30, 40, 50, 60, 70, 80, 90, 100].map((rh) => ({
    rh,
    y: yOf(rh),
  }));

  protected readonly wet = computed(
    () =>
      `M${X0} ${Y0}L${X1} ${Y0}L${curve(this.result().band.min, true).join('L')}Z`,
  );
  protected readonly dry = computed(
    () =>
      `M${curve(this.result().band.max).join('L')}L${X1} ${Y1}L${X0} ${Y1}Z`,
  );
  protected readonly good = computed(() => {
    const b = this.result().band;
    return `M${curve(b.min).join('L')}L${curve(b.max, true).join('L')}Z`;
  });
  protected readonly ideal = computed(() => {
    const b = this.result().idealBand;
    return `M${curve(b.min).join('L')}L${curve(b.max, true).join('L')}Z`;
  });
  protected readonly lines = computed(() => {
    const r = this.result();
    return [r.band.min, r.idealBand.min, r.idealBand.max, r.band.max].map(
      (vpd) => {
        const end = rhForVpd(T_MAX, vpd) ?? 0;
        return {
          vpd,
          d: `M${curve(vpd).join('L')}`,
          y: yOf(end),
        };
      },
    );
  });

  protected readonly tBand = computed(() => {
    const b = this.result().temperatureBand;
    return { x: xOf(b.min), w: xOf(b.max) - xOf(b.min) };
  });
  protected readonly rhBand = computed(() => {
    const b = this.result().rhBand;
    return { y: yOf(b.max), h: yOf(b.min) - yOf(b.max) };
  });

  protected readonly px = computed(() => xOf(this.params().airC));
  protected readonly py = computed(() => yOf(this.params().rhPct));

  protected readonly alt = computed(() =>
    this.t().diagrams.vpdAlt(
      this.i18n.num(this.params().airC),
      this.i18n.num(this.params().rhPct, 0),
      this.i18n.num(this.result().vpdKpa, 2),
      this.t().vpd.status[this.result().status],
    ),
  );

  protected readonly airAt = (p: SvgPoint): number => T_MIN + (p.x - X0) / KX;
  protected readonly rhAt = (p: SvgPoint): number => RH_MAX - (p.y - Y0) / KY;
}
