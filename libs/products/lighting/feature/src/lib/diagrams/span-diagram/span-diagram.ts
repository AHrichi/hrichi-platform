import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import type {
  PoleRole,
  SpanCalculationResult,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

const GROUND = 206;
const XL = 70;
const X_MIN = 150;
const X_MAX = 420;
/** Pixels per metre of height. Spans are squeezed to fit, heights are not. */
const K = 14;

export const SPAN_LIMITS = { min: 10, max: 120, step: 0.5 } as const;

/**
 * Side view of a span: two poles, the wire strung (solid) and on a hot day
 * (dashed), the required clearance, and the pull on the first pole when it
 * ends the line or turns a corner. Drag the second pole to change the span.
 */
@Component({
  selector: 'lp-span-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './span-diagram.html',
  styleUrl: './span-diagram.scss',
})
export class SpanDiagram {
  readonly span = model.required<number>();
  readonly poleHeight = input.required<number>();
  readonly attachment = input.required<number>();
  readonly clearance = input.required<number>();
  readonly role = input.required<PoleRole>();
  readonly result = input.required<SpanCalculationResult>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = SPAN_LIMITS;
  protected readonly ground = GROUND;
  protected readonly xL = XL;

  protected readonly xR = computed(
    () =>
      X_MIN +
      ((this.span() - SPAN_LIMITS.min) / (SPAN_LIMITS.max - SPAN_LIMITS.min)) *
        (X_MAX - X_MIN),
  );
  protected readonly top = computed(() => GROUND - this.poleHeight() * K);
  protected readonly yA = computed(() => GROUND - this.attachment() * K);
  protected readonly yClear = computed(() => GROUND - this.clearance() * K);

  /** A parabola as a quadratic Bézier: its control point sits at twice the sag. */
  private wire(sagM: number): { d: string; low: number } {
    // True to scale, like the heights, so the wire and the clearance line
    // compare honestly; the label carries the exact figure.
    const sag = sagM * K;
    const mid = (XL + this.xR()) / 2;
    return {
      d: `M${XL} ${this.yA()} Q${mid} ${this.yA() + 2 * sag} ${this.xR()} ${this.yA()}`,
      low: this.yA() + sag,
    };
  }
  protected readonly strung = computed(() =>
    this.wire(this.result().sagEverydayMeters),
  );
  protected readonly hot = computed(() =>
    this.wire(this.result().sagHotMeters),
  );
  protected readonly mid = computed(() => (XL + this.xR()) / 2);

  protected readonly clearanceTone = computed(() =>
    this.result().meetsClearance ? 'ok' : 'bad',
  );
  protected readonly poleTone = computed(() => {
    const u = this.result().poleUtilization;
    return u > 1 ? 'bad' : u > 0.8 ? 'warn' : 'ok';
  });

  protected dragSpan(point: SvgPoint): void {
    const { min, max, step } = SPAN_LIMITS;
    const value = min + ((point.x - X_MIN) / (X_MAX - X_MIN)) * (max - min);
    this.span.set(clamp(snap(value, step), min, max));
  }

  protected keySpan(event: KeyboardEvent): void {
    const { min, max } = SPAN_LIMITS;
    const next = stepByKey(event, this.span(), 1, min, max);
    if (next !== null) this.span.set(next);
  }
}
