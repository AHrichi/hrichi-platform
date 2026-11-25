import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { FogParams, FogResult } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** Thermometers: 10–50 °C from y 250 up to y 70. */
const T_MIN = 10;
const T_MAX = 50;
const Y_BASE = 250;
const K_T = 4.5;
/** The humidity gauge: 0–100 % over the same height. */
const K_RH = 1.8;
/** The cycle strip: ten minutes from x 40 to x 520. */
const STRIP_X = 40;
const STRIP_S = 600;
const K_S = 0.8;

export const FOG_LIMITS = {
  maxRh: { min: 50, max: 95, step: 1 },
  onS: { min: 10, max: 300, step: 5 },
} as const;

const yT = (t: number) => Y_BASE - (clamp(t, T_MIN, T_MAX) - T_MIN) * K_T;
const yRh = (rh: number) => Y_BASE - clamp(rh, 0, 100) * K_RH;

/**
 * A fogged afternoon: outside, the house with vents only, the house with
 * fog and the wet bulb it can't go below; the humidity inside against the
 * cap the controller holds; and ten minutes of the on/off cycle that holds
 * it. Drag the cap and the length of a burst.
 */
@Component({
  selector: 'sc-fog-diagram',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fog-diagram.html',
  styleUrl: './fog-diagram.scss',
})
export class FogDiagram {
  readonly params = input.required<FogParams>();
  readonly result = input.required<FogResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = FOG_LIMITS;
  protected readonly yBase = Y_BASE;
  protected readonly yTop = yT(T_MAX);
  protected readonly ticks = [10, 20, 30, 40, 50].map((t) => ({ t, y: yT(t) }));

  protected readonly columns = computed(() => {
    const p = this.params();
    const r = this.result();
    const d = this.t().diagrams;
    return [
      { x: 70, value: p.outsideC, label: d.outside, tone: 'hot' },
      { x: 160, value: r.ventOnlyC, label: d.ventsOnly, tone: 'warm' },
      { x: 250, value: r.insideC, label: d.withFog, tone: 'cool' },
      { x: 340, value: r.wetBulbC, label: d.wetBulb, tone: 'wet' },
    ].map((c) => ({ ...c, y: yT(c.value) }));
  });

  protected readonly rhOut = computed(() => yRh(this.params().outsideRhPct));
  protected readonly rhIn = computed(() => yRh(this.result().insideRhPct));
  protected readonly rhCap = computed(() => yRh(this.params().maxRhPct));

  protected readonly bursts = computed(() => {
    const r = this.result();
    const on = Math.max(5, r.onS);
    const period = r.offS > 0 ? on + r.offS : STRIP_S;
    const width = r.offS > 0 ? on : STRIP_S;
    const out: { x: number; w: number }[] = [];
    if (r.dutyPct <= 0) return out;
    for (let s = 0; s < STRIP_S && out.length < 120; s += period) {
      out.push({
        x: STRIP_X + s * K_S,
        w: Math.min(width, STRIP_S - s) * K_S,
      });
    }
    return out;
  });
  protected readonly burstEnd = computed(
    () => STRIP_X + clamp(this.params().onS, 0, STRIP_S) * K_S,
  );

  protected readonly alt = computed(() =>
    this.t().diagrams.fogAlt(
      this.i18n.num(this.params().outsideC),
      this.i18n.num(this.result().insideC),
      this.i18n.num(this.result().insideRhPct, 0),
      this.i18n.num(this.result().onS, 0),
      this.i18n.num(this.result().offS, 0),
    ),
  );

  protected readonly rhAt = (p: SvgPoint): number => (Y_BASE - p.y) / K_RH;
  protected readonly secondsAt = (p: SvgPoint): number => (p.x - STRIP_X) / K_S;
}
