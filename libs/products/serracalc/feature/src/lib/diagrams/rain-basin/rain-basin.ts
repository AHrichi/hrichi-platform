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
  RainwaterParams,
  RainwaterResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import type { SvgPoint } from '../svg-drag';

const BOTTOM = 214;
const TANK_H = 150;
const TANK_X = 270;
const TANK_W = 120;

export const BASIN_LIMITS = { min: 0, max: 50000, step: 10 } as const;

/**
 * Rain off the roof into the basin, and out to the drippers. The tank is
 * drawn to scale against the suggested size, filled to its fullest month,
 * and spills when it overflows. Drag its top to resize it; the scale holds
 * while dragging.
 */
@Component({
  selector: 'sc-rain-basin',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rain-basin.html',
  styleUrl: './rain-basin.scss',
})
export class RainBasin {
  readonly params = input.required<RainwaterParams>();
  readonly result = input.required<RainwaterResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = BASIN_LIMITS;
  protected readonly bottom = BOTTOM;
  protected readonly tankX = TANK_X;
  protected readonly tankW = TANK_W;

  /** m³ at the top of the drawing, held while the tank is dragged. */
  private readonly held = signal<number | null>(null);
  private readonly scaleMax = computed(
    () =>
      this.held() ??
      Math.max(
        50,
        this.result().suggestedBasinM3 * 1.6,
        this.params().basinM3 * 1.25,
      ),
  );

  private yOf(m3: number): number {
    return BOTTOM - (Math.max(0, m3) / this.scaleMax()) * TANK_H;
  }

  protected readonly yTank = computed(() => this.yOf(this.params().basinM3));
  protected readonly ySuggested = computed(() =>
    this.yOf(this.result().suggestedBasinM3),
  );
  protected readonly yFill = computed(() =>
    this.yOf(Math.max(0, ...this.result().months.map((m) => m.storedEndM3))),
  );
  protected readonly overflow = computed(() =>
    this.result().months.reduce((s, m) => s + m.overflowM3, 0),
  );
  /** More drops for a wetter climate. */
  protected readonly drops = computed(() => {
    const n = Math.min(
      16,
      Math.max(2, Math.round(this.result().annualRainMm / 40)),
    );
    return Array.from({ length: n }, (_, i) => ({
      x: 40 + ((i * 37) % 170),
      y: 34 + ((i * 23) % 50),
    }));
  });

  protected readonly alt = computed(() =>
    this.t().diagrams.rainAlt(
      this.i18n.num(this.params().basinM3, 0),
      this.i18n.num(this.result().coveragePct, 0),
    ),
  );

  protected readonly basinAt = (p: SvgPoint): number =>
    ((BOTTOM - p.y) / TANK_H) * this.scaleMax();

  protected hold(): void {
    this.held.set(this.scaleMax());
  }

  protected release(): void {
    this.held.set(null);
  }
}
