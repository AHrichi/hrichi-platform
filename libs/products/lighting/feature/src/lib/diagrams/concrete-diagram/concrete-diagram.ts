import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  calculateConcreteCuringStrengthPct,
  type ConcreteMixValidationResult,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

// Abrams cone: 30 cm tall, 20 cm base, 10 cm top, drawn at 6 px per cm.
const CONE = { x: 80, base: 230, cm: 6, height: 30 };
// Strength chart: 28 days across, 0–100 % up.
const CHART = { left: 40, right: 280, bottom: 220, top: 40 };
const PER_DAY = (CHART.right - CHART.left) / 28;
const PER_PCT = (CHART.bottom - CHART.top) / 100;

export const SLUMP_LIMITS = { min: 0, max: 25, step: 0.5 } as const;
export const CURING_LIMITS = { min: 1, max: 28, step: 1 } as const;

/**
 * Left, the slump test: lift the cone and measure how far the concrete sinks
 * (drag its top). Right, how strength grows while the concrete cures
 * (Eurocode 2): drag the day; poles go up from 70 %.
 */
@Component({
  selector: 'lp-concrete-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concrete-diagram.html',
  styleUrl: './concrete-diagram.scss',
})
export class ConcreteDiagram {
  readonly slump = model.required<number>();
  readonly days = model.required<number>();
  readonly result = input.required<ConcreteMixValidationResult>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly cone = CONE;
  protected readonly chart = CHART;
  protected readonly slumpLimits = SLUMP_LIMITS;
  protected readonly curingLimits = CURING_LIMITS;
  protected readonly coneTop = CONE.base - CONE.height * CONE.cm;
  protected readonly liftLine = CHART.bottom - 70 * PER_PCT;

  /** The slumped heap: lower and wider the more it sinks. */
  protected readonly heap = computed(() => {
    const s = this.slump();
    const top = CONE.base - (CONE.height - s) * CONE.cm;
    const bottomHalf = 60 + s * 1.8;
    const topHalf = 30 + s * 1.4;
    return {
      top,
      path: `M${CONE.x - bottomHalf} ${CONE.base}L${CONE.x - topHalf} ${top}Q${CONE.x} ${top - 6} ${CONE.x + topHalf} ${top}L${CONE.x + bottomHalf} ${CONE.base}Z`,
    };
  });

  protected readonly curve = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    return `${CHART.left + day * PER_DAY},${CHART.bottom - calculateConcreteCuringStrengthPct(day) * PER_PCT}`;
  }).join(' ');

  protected readonly marker = computed(() => ({
    x: CHART.left + this.days() * PER_DAY,
    y: CHART.bottom - this.result().currentStrengthPctOf28Days * PER_PCT,
  }));

  protected readonly slumpTone = computed(() =>
    this.result().isSlumpAcceptable ? 'ok' : 'warn',
  );

  protected dragSlump(point: SvgPoint): void {
    const { min, max, step } = SLUMP_LIMITS;
    this.slump.set(
      clamp(snap((point.y - this.coneTop) / CONE.cm, step), min, max),
    );
  }

  protected dragDays(point: SvgPoint): void {
    const { min, max } = CURING_LIMITS;
    this.days.set(
      clamp(Math.round((point.x - CHART.left) / PER_DAY), min, max),
    );
  }

  protected keySlump(event: KeyboardEvent): void {
    const { min, max, step } = SLUMP_LIMITS;
    // Down sinks the heap: a bigger slump.
    const next = stepByKey(event, this.slump(), step, min, max, true);
    if (next !== null) this.slump.set(next);
  }

  protected keyDays(event: KeyboardEvent): void {
    const { min, max, step } = CURING_LIMITS;
    const next = stepByKey(event, this.days(), step, min, max);
    if (next !== null) this.days.set(next);
  }
}
