import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type {
  HudMetric,
  MetricTone,
  MetricValue,
} from '@ah/products/system-design/domain';
import { SdIcon } from '../icon/icon';

export interface HudChipView {
  id: string;
  label: string;
  icon: HudMetric['icon'];
  value: string;
  tone: MetricTone;
  fresh: boolean;
}

/**
 * Row of HUD metric chips displayed over the stage card (`sd-hud`).
 * Combines `lesson.hud` definitions with the current step's `sceneAt().metrics`.
 */
@Component({
  selector: 'sd-hud',
  imports: [SdIcon],
  templateUrl: './hud.html',
  styleUrl: './hud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdHud {
  readonly hud = input.required<readonly HudMetric[]>();
  readonly metrics = input<Readonly<Record<string, MetricValue>>>({});
  readonly fresh = input<ReadonlySet<string>>(new Set());

  protected readonly chips = computed<readonly HudChipView[]>(() => {
    const values = this.metrics();
    const freshSet = this.fresh();
    return this.hud().map((m) => {
      const current = values[m.id];
      return {
        id: m.id,
        label: m.label,
        icon: m.icon,
        value: current ? current.value : m.value,
        tone: current ? current.tone : 'normal',
        fresh: freshSet.has(m.id),
      };
    });
  });
}
