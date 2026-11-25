import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  EnergyHubParams,
  EnergyHubResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** Hours 0–24 across x 56–584. */
const X0 = 56;
const X1 = 584;
const KH = (X1 - X0) / 24;
/** Heat: 0–max kW from y 196 up to y 44. Buffer: 0–capacity, y 286 up to 228. */
const HY0 = 196;
const HY1 = 44;
const BY0 = 286;
const BY1 = 228;

const xOf = (hour: number) => X0 + clamp(hour, 0, 24) * KH;

/**
 * A winter design day hour by hour: the heat the house needs (the line)
 * and where it comes from (CHP, the buffer, the boiler), the CHP's run
 * and, below, the heat in the buffer. Drag the start and end of the run.
 */
@Component({
  selector: 'sc-energy-day',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './energy-day.html',
  styleUrl: './energy-day.scss',
})
export class EnergyDay {
  readonly params = input.required<EnergyHubParams>();
  readonly result = input.required<EnergyHubResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly x0 = X0;
  protected readonly x1 = X1;
  protected readonly hy0 = HY0;
  protected readonly by0 = BY0;
  protected readonly by1 = BY1;
  protected readonly kh = KH;
  protected readonly hourTicks = [0, 6, 12, 18, 24].map((h) => ({
    h,
    x: xOf(h),
  }));

  private readonly maxKw = computed(() => {
    const r = this.result();
    const top = Math.max(
      r.peakDemandKw,
      this.params().chpThermalKw,
      ...r.hours.map((h) => h.chpKw + h.fromBufferKw + h.boilerKw),
    );
    return top > 0 ? top * 1.1 : 1;
  });
  private readonly yKw = (kw: number) =>
    HY0 - (Math.max(0, kw) / this.maxKw()) * (HY0 - HY1);

  protected readonly kwTicks = computed(() => {
    const step = niceStep(this.maxKw() / 4);
    const out: { kw: number; y: number }[] = [];
    for (let kw = 0; kw <= this.maxKw(); kw += step) {
      out.push({ kw, y: this.yKw(kw) });
    }
    return out;
  });

  protected readonly bars = computed(() =>
    this.result().hours.map((h) => {
      const x = xOf(h.hour) + 1.5;
      const chpTop = this.yKw(h.chpKw);
      const bufTop = this.yKw(h.chpKw + h.fromBufferKw);
      const boilTop = this.yKw(h.chpKw + h.fromBufferKw + h.boilerKw);
      return {
        hour: h.hour,
        x,
        w: KH - 3,
        chp: { y: chpTop, h: HY0 - chpTop },
        buffer: { y: bufTop, h: chpTop - bufTop },
        boiler: { y: boilTop, h: bufTop - boilTop },
      };
    }),
  );

  protected readonly demandLine = computed(() => {
    const parts: string[] = [];
    for (const h of this.result().hours) {
      const y = this.yKw(h.demandKw).toFixed(1);
      parts.push(`${parts.length ? 'L' : 'M'}${xOf(h.hour).toFixed(1)} ${y}`);
      parts.push(`L${xOf(h.hour + 1).toFixed(1)} ${y}`);
    }
    return parts.join('');
  });

  protected readonly bufferArea = computed(() => {
    const cap = Math.max(1, this.result().bufferCapacityKwh);
    const y = (kwh: number) => BY0 - (clamp(kwh, 0, cap) / cap) * (BY0 - BY1);
    const pts = this.result().hours.map(
      (h) => `${xOf(h.hour + 1).toFixed(1)} ${y(h.bufferKwh).toFixed(1)}`,
    );
    return `M${X0} ${BY0}L${pts.join('L')}L${X1} ${BY0}Z`;
  });

  protected readonly run = computed(() => {
    const p = this.params();
    const start = xOf(p.chpStartHour);
    const end = xOf(p.chpEndHour);
    return start <= end
      ? [{ x: start, w: end - start }]
      : [
          { x: X0, w: end - X0 },
          { x: start, w: X1 - start },
        ];
  });
  protected readonly startX = computed(() => xOf(this.params().chpStartHour));
  protected readonly endX = computed(() => xOf(this.params().chpEndHour));

  protected readonly alt = computed(() =>
    this.t().diagrams.energyAlt(
      this.i18n.num(this.result().peakDemandKw, 0),
      String(this.params().chpStartHour),
      String(this.params().chpEndHour),
      this.i18n.num(this.result().chpSharePct, 0),
    ),
  );

  protected readonly hourAt = (p: SvgPoint): number => (p.x - X0) / KH;
}

/** A round step for an axis: 1, 2 or 5 times a power of ten. */
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const f = raw / power;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * power;
}
