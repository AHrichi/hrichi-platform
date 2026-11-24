import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type {
  HotWaterParams,
  HotWaterResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

const T_MIN = 10;
const T_MAX = 95;
const Y_COLD = 225;
const Y_HOT = 55;
const KT = (Y_COLD - Y_HOT) / (T_MAX - T_MIN);
/** The house in plan: headers on the left, loops running right. */
const X_HEADER = 96;
const X_END = 462;
const Y_TOP = 44;
const Y_BOTTOM = 224;
const MAX_LOOPS = 6;

export const PIPE_LIMITS = {
  supply: { min: 20, max: 95, step: 1 },
  return: { min: 15, max: 90, step: 1 },
  loop: { min: 10, max: 500, step: 1 },
} as const;

function yOf(t: number): number {
  return Y_COLD - (clamp(t, T_MIN, T_MAX) - T_MIN) * KT;
}

/**
 * The heating loops in plan: water leaves the supply header hot, runs along
 * the house, turns and comes back cooler. Drag the two thermometers for the
 * supply and return temperatures, and a loop's far end for its length; the
 * scale holds while dragging.
 */
@Component({
  selector: 'sc-pipe-loops',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pipe-loops.html',
  styleUrl: './pipe-loops.scss',
})
export class PipeLoops {
  readonly params = input.required<HotWaterParams>();
  readonly result = input.required<HotWaterResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = PIPE_LIMITS;
  protected readonly xHeader = X_HEADER;
  protected readonly yTop = Y_TOP;
  protected readonly yBottom = Y_BOTTOM;
  protected readonly yHot = Y_HOT;
  protected readonly yCold = Y_COLD;

  /** Pixels per metre of run, held while the loop end is dragged. */
  private readonly held = signal<number | null>(null);
  private readonly k = computed(
    () =>
      this.held() ??
      (X_END - X_HEADER) / Math.max(30, (this.params().loopLengthM / 2) * 1.25),
  );

  protected readonly ySupply = computed(() => yOf(this.params().supplyC));
  protected readonly yReturn = computed(() => yOf(this.params().returnC));
  protected readonly yAir = computed(() => yOf(this.params().airC));

  protected readonly loops = computed(() => {
    const drawn = Math.min(MAX_LOOPS, Math.max(1, this.result().loops));
    const lane = (Y_BOTTOM - Y_TOP) / drawn;
    const xEnd = X_HEADER + (this.params().loopLengthM / 2) * this.k();
    return Array.from({ length: drawn }, (_, i) => {
      const top = Y_TOP + i * lane + lane * 0.25;
      const bottom = top + lane * 0.5;
      const r = (bottom - top) / 2;
      return {
        supply: `M${X_HEADER} ${top}H${xEnd - r}A${r} ${r} 0 0 1 ${xEnd} ${top + r}`,
        back: `M${xEnd} ${top + r}A${r} ${r} 0 0 1 ${xEnd - r} ${bottom}H${X_HEADER}`,
        mid: top + r,
        xEnd,
      };
    });
  });

  protected readonly more = computed(() =>
    Math.max(0, this.result().loops - MAX_LOOPS),
  );

  protected readonly alt = computed(() =>
    this.t().diagrams.pipesAlt(
      String(this.result().loops),
      this.i18n.num(this.params().loopLengthM, 0),
      this.i18n.num(this.params().supplyC, 0),
      this.i18n.num(this.params().returnC, 0),
    ),
  );

  protected readonly tempAt = (p: SvgPoint): number =>
    T_MIN + (Y_COLD - p.y) / KT;
  protected readonly loopAt = (p: SvgPoint): number =>
    (2 * (p.x - X_HEADER)) / this.k();

  protected hold(): void {
    this.held.set(this.k());
  }

  protected release(): void {
    this.held.set(null);
  }
}
