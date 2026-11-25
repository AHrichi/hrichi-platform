import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { PadFanParams, PadFanResult } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import type { SvgPoint } from '../svg-drag';

const X_PAD = 72;
const X_MAX = 452;
const FLOOR = 200;
const ROOF = 84;
/** Pad height and the warming bar, pixels per metre and per kelvin. */
const K_PAD = 30;
const K_RISE = 11;

export const PAD_LIMITS = {
  distance: { min: 10, max: 150, step: 1 },
  rise: { min: 1, max: 10, step: 0.5 },
} as const;

/**
 * Fan and pad along the house: outside air through the wet pad, cooler,
 * warming on its way to the fans. Drag the fan wall for the pad-to-fan
 * distance (the scale holds while dragging) and the bar by the fans for
 * how much the air may warm.
 */
@Component({
  selector: 'sc-pad-fan-flow',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pad-fan-flow.html',
  styleUrl: './pad-fan-flow.scss',
})
export class PadFanFlow {
  readonly params = input.required<PadFanParams>();
  readonly result = input.required<PadFanResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = PAD_LIMITS;
  protected readonly xPad = X_PAD;
  protected readonly floor = FLOOR;
  protected readonly roof = ROOF;

  /** Pixels per metre along the house, held while the fan wall moves. */
  private readonly held = signal<number | null>(null);
  private readonly k = computed(
    () =>
      this.held() ??
      (X_MAX - X_PAD) / Math.max(40, this.params().padToFanM * 1.15),
  );

  protected readonly xFan = computed(
    () => X_PAD + this.params().padToFanM * this.k(),
  );
  protected readonly padTop = computed(
    () => FLOOR - Math.min(3, this.params().padHeightM) * K_PAD,
  );
  protected readonly xBar = computed(() => this.xFan() - 30);
  protected readonly yRise = computed(
    () => FLOOR - 8 - this.params().riseK * K_RISE,
  );
  protected readonly tooFar = computed(() => this.params().padToFanM > 50);

  protected readonly alt = computed(() =>
    this.t().diagrams.padAlt(
      this.i18n.num(this.params().outsideC),
      this.i18n.num(this.result().padOutletC),
      this.i18n.num(this.result().exhaustC),
      this.i18n.num(this.params().padToFanM, 0),
    ),
  );

  protected readonly distanceAt = (p: SvgPoint): number =>
    (p.x - X_PAD) / this.k();
  protected readonly riseAt = (p: SvgPoint): number =>
    (FLOOR - 8 - p.y) / K_RISE;

  protected hold(): void {
    this.held.set(this.k());
  }

  protected release(): void {
    this.held.set(null);
  }
}
