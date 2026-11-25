import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  HeatLossParams,
  HeatLossResult,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import type { FieldChange } from '../../ui/field-grid/field-grid';
import { DragHandle } from '../drag-handle';
import { clamp, type SvgPoint } from '../svg-drag';

/** The thermometers' range and where it sits in the drawing. */
const T_MIN = -20;
const T_MAX = 35;
const Y_COLD = 205;
const Y_HOT = 70;
const K = (Y_COLD - Y_HOT) / (T_MAX - T_MIN);

export const HEAT_LOSS_LIMITS = {
  inside: { min: 0, max: 30, step: 0.5 },
  outside: { min: T_MIN, max: 20, step: 0.5 },
} as const;

function yOf(t: number): number {
  return Y_COLD - (clamp(t, T_MIN, T_MAX) - T_MIN) * K;
}

/** Stroke width for a share of the heat: thin to thick. */
function thickness(part: number, total: number): number {
  return 3 + 8 * (total > 0 ? part / total : 0);
}

/**
 * Where the heat goes on the design night: arrows through the cover, out
 * by the leaks and down through the footing, each as thick as its share.
 * Drag the thermometers for the inside and outside temperatures.
 */
@Component({
  selector: 'sc-heat-loss-diagram',
  imports: [DragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './heat-loss-diagram.html',
  styleUrl: './heat-loss-diagram.scss',
})
export class HeatLossDiagram {
  readonly params = input.required<HeatLossParams>();
  readonly result = input.required<HeatLossResult>();
  readonly changed = output<FieldChange>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = HEAT_LOSS_LIMITS;
  protected readonly ticks = [-20, -10, 0, 10, 20, 30].map((v) => ({
    v,
    y: yOf(v),
  }));
  protected readonly yCold = Y_COLD;
  protected readonly yHot = Y_HOT;

  protected readonly yInside = computed(() => yOf(this.params().insideC));
  protected readonly yOutside = computed(() =>
    yOf(this.params().outsideDesignC),
  );

  protected readonly widths = computed(() => {
    const r = this.result();
    return {
      cover: thickness(r.transmissionW, r.totalW),
      leak: thickness(r.infiltrationW, r.totalW),
      ground: thickness(r.perimeterW, r.totalW),
    };
  });

  protected readonly showScreen = computed(
    () => this.params().screen !== 'none' && this.params().screenClosed,
  );

  protected readonly alt = computed(() =>
    this.t().diagrams.heatAlt(
      this.i18n.num(this.params().insideC),
      this.i18n.num(this.params().outsideDesignC),
      this.i18n.num(this.result().totalW / 1000, 0),
    ),
  );

  protected kw(w: number): string {
    return `${this.i18n.num(w / 1000, 0)} kW`;
  }

  protected readonly tempAt = (p: SvgPoint): number =>
    T_MIN + (Y_COLD - p.y) / K;
}
