import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import type {
  ElectricalCalculationResult,
  ElectricalParams,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

const START = 64;
const LINE = 110;
/** Pixels per metre of cable. */
const K = 0.76;

export const CABLE_LIMITS = { min: 10, max: 500, step: 5 } as const;

/**
 * The feeder from the cabinet along the street. The voltage sags towards the
 * far end; the cable turns amber, then red, as the drop nears its limit. Drag
 * the far end to lengthen the run.
 */
@Component({
  selector: 'lp-cable-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cable-diagram.html',
  styleUrl: './cable-diagram.scss',
})
export class CableDiagram {
  readonly length = model.required<number>();
  readonly params = input.required<ElectricalParams>();
  readonly result = input.required<ElectricalCalculationResult>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly limits = CABLE_LIMITS;
  protected readonly line = LINE;
  protected readonly start = START;

  protected readonly end = computed(() => START + this.length() * K);

  protected readonly lamps = computed(() => {
    const count = Math.min(24, this.params().totalLuminairesCount);
    const span = this.end() - START;
    return Array.from(
      { length: count },
      (_, i) => START + ((i + 1) * span) / count,
    );
  });

  /** How much of the allowed drop is used: 1 means at the limit. */
  protected readonly usage = computed(
    () =>
      this.result().actualVoltageDropPct /
      Math.max(0.1, this.params().maxAllowableVoltageDropPct),
  );

  protected readonly endTone = computed(() =>
    this.usage() > 1
      ? 'var(--color-danger-default)'
      : this.usage() > 0.8
        ? 'var(--color-warning-default)'
        : 'var(--color-success-default)',
  );

  protected drag(point: SvgPoint): void {
    const { min, max, step } = CABLE_LIMITS;
    this.length.set(clamp(snap((point.x - START) / K, step), min, max));
  }

  protected key(event: KeyboardEvent): void {
    const { min, max, step } = CABLE_LIMITS;
    const next = stepByKey(event, this.length(), step, min, max);
    if (next !== null) this.length.set(next);
  }
}
