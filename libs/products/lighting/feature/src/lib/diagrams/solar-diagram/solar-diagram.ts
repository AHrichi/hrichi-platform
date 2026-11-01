import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import type {
  SolarSizingParams,
  SolarSizingResult,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

type Profile = SolarSizingParams['dimmingProfile'];
type Stage = 1 | 2 | 3;

const BASE = 286;
const LEFT = 40;
/** Pixels per hour of night, and per percent of power. */
const PER_HOUR = 28;
const PER_PCT = 1.05;

/**
 * Where the energy goes: sun → panel → battery → lamp, then the night's
 * dimming steps. Drag a step's top to change its power; the area of the
 * bars is the energy the battery must hold.
 */
@Component({
  selector: 'lp-solar-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './solar-diagram.html',
  styleUrl: './solar-diagram.scss',
})
export class SolarDiagram {
  readonly profile = model.required<Profile>();
  readonly params = input.required<SolarSizingParams>();
  readonly result = input.required<SolarSizingResult>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly base = BASE;

  protected readonly bars = computed(() => {
    const p = this.profile();
    // Long winter nights shrink the scale so the night still fits.
    const total = p.hoursStage1 + p.hoursStage2 + p.hoursStage3;
    const perHour = Math.min(PER_HOUR, 400 / Math.max(1, total));
    let x = LEFT;
    return ([1, 2, 3] as const).map((stage) => {
      const hours = p[`hoursStage${stage}`];
      const pct = p[`pctStage${stage}`];
      const bar = {
        stage,
        hours,
        pct,
        x,
        width: hours * perHour,
        top: BASE - pct * PER_PCT,
      };
      x += bar.width;
      return bar;
    });
  });

  protected readonly nightEnd = computed(() => {
    const last = this.bars()[2];
    return last.x + last.width;
  });

  private setPct(stage: Stage, pct: number): void {
    this.profile.set({ ...this.profile(), [`pctStage${stage}`]: pct });
  }

  protected drag(stage: Stage, point: SvgPoint): void {
    this.setPct(stage, clamp(snap((BASE - point.y) / PER_PCT, 5), 0, 100));
  }

  protected key(stage: Stage, event: KeyboardEvent): void {
    const next = stepByKey(
      event,
      this.profile()[`pctStage${stage}`],
      5,
      0,
      100,
    );
    if (next !== null) this.setPct(stage, next);
  }
}
