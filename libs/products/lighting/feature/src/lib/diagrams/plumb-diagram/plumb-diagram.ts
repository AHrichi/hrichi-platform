import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import type { VerticalityCheckResult } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

const LEVEL = { x: 120, y: 150, r: 100 };
/** Level pixels per degree: the 1° ring has a 45 px radius. */
const PER_DEG = 45;
/** The pole's lean is drawn ten times larger than life. */
const EXAGGERATION = 10;
const POLE = { x: 350, ground: 268, length: 210 };
const LIMIT = 2.2;

/**
 * Left, a level: the dot shows which way and how far the pole leans, inside
 * the 1° tolerance ring (EN 40) or outside it. Drag the dot to enter a reading
 * by hand. Right, the pole with its lean exaggerated ×10 and the offset at the
 * top that the lean causes.
 */
@Component({
  selector: 'lp-plumb-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plumb-diagram.html',
  styleUrl: './plumb-diagram.scss',
})
export class PlumbDiagram {
  /** Lean along the north–south axis, degrees (+ towards north). */
  readonly pitch = model.required<number>();
  /** Lean along the east–west axis, degrees (+ towards east). */
  readonly roll = model.required<number>();
  readonly result = input.required<VerticalityCheckResult>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly level = LEVEL;
  protected readonly pole = POLE;
  protected readonly ring = PER_DEG;

  protected readonly dot = computed(() => {
    const x = this.roll() * PER_DEG;
    const y = -this.pitch() * PER_DEG;
    const length = Math.hypot(x, y);
    const scale = length > LEVEL.r - 8 ? (LEVEL.r - 8) / length : 1;
    return { x: LEVEL.x + x * scale, y: LEVEL.y + y * scale };
  });

  /** The pole leans in the drawing's plane by the total tilt, exaggerated. */
  protected readonly tip = computed(() => {
    const sign = this.roll() < 0 ? -1 : 1;
    const angle =
      (sign * this.result().tiltDegrees * EXAGGERATION * Math.PI) / 180;
    return {
      x: POLE.x + POLE.length * Math.sin(angle),
      y: POLE.ground - POLE.length * Math.cos(angle),
    };
  });

  protected readonly cone = computed(() => {
    const angle =
      (this.result().maxAllowableTiltDegrees * EXAGGERATION * Math.PI) / 180;
    const dx = POLE.length * Math.sin(angle);
    const y = POLE.ground - POLE.length * Math.cos(angle);
    return `M${POLE.x - dx} ${y}L${POLE.x} ${POLE.ground}L${POLE.x + dx} ${y}`;
  });

  protected readonly tone = computed(() => {
    switch (this.result().status) {
      case 'perfect':
        return 'ok';
      case 'acceptable':
        return 'warn';
      default:
        return 'bad';
    }
  });

  protected drag(point: SvgPoint): void {
    this.roll.set(
      clamp(snap((point.x - LEVEL.x) / PER_DEG, 0.05), -LIMIT, LIMIT),
    );
    this.pitch.set(
      clamp(snap((LEVEL.y - point.y) / PER_DEG, 0.05), -LIMIT, LIMIT),
    );
  }

  protected key(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const next = stepByKey(event, this.pitch(), 0.05, -LIMIT, LIMIT);
      if (next !== null) this.pitch.set(next);
    } else {
      const next = stepByKey(event, this.roll(), 0.05, -LIMIT, LIMIT);
      if (next !== null) this.roll.set(next);
    }
  }
}
