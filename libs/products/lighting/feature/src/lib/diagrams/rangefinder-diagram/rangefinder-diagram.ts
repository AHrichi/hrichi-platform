import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import { measurePoleHeight } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { clamp, snap, stepByKey, SvgDrag, type SvgPoint } from '../svg-drag';

const GROUND = 262;
const EYE_X = 50;
const RIGHT = 430;
const TOP = 30;
/** At most this many pixels per metre, so a close pole isn't drawn huge. */
const MAX_SCALE = 34;

export const READING_LIMITS = {
  eye: { min: 1, max: 2.2, step: 0.05 },
  base: { min: 1, max: 60, step: 0.1 },
  top: { min: 1, max: 80, step: 0.1 },
} as const;

const DEG = 180 / Math.PI;

/**
 * The geometry behind the rangefinder, drawn to scale (zoomed to fit the
 * pole; the zoom holds still while a handle is dragged): the phone at eye height
 * h sights the pole's foot α below the horizon, then its top β above.
 * D = h / tan α and H = D × tan β + h. Each handle corrects one reading:
 * the eye moves h, the foot moves α, the top moves β.
 */
@Component({
  selector: 'lp-rangefinder-diagram',
  imports: [SvgDrag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rangefinder-diagram.html',
  styleUrl: './rangefinder-diagram.scss',
})
export class RangefinderDiagram {
  readonly eyeHeight = model.required<number>();
  /** α: degrees below the horizon to the pole's foot. */
  readonly baseAngle = model.required<number>();
  /** β: degrees above the horizon to the pole's top. */
  readonly topAngle = model.required<number>();

  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly ground = GROUND;
  protected readonly eyeX = EYE_X;
  protected readonly limits = READING_LIMITS;

  protected readonly measured = computed(() =>
    measurePoleHeight(this.eyeHeight(), this.baseAngle(), this.topAngle()),
  );

  /** Pixels per metre that fit the whole pole, the same both ways. */
  private readonly fit = computed(() => {
    const { distanceMeters, heightMeters } = this.measured();
    return Math.min(
      MAX_SCALE,
      (RIGHT - EYE_X) / Math.max(1, distanceMeters),
      (GROUND - TOP) / Math.max(1, heightMeters),
    );
  });
  /** The zoom at the start of a drag, so the handle stays under the finger. */
  private readonly held = signal<number | null>(null);
  private readonly k = computed(() => this.held() ?? this.fit());

  protected readonly eyeY = computed(
    () => GROUND - this.eyeHeight() * this.k(),
  );
  protected readonly poleX = computed(() =>
    Math.min(RIGHT + 30, EYE_X + this.measured().distanceMeters * this.k()),
  );
  protected readonly topY = computed(() =>
    Math.max(8, GROUND - this.measured().heightMeters * this.k()),
  );

  protected hold(): void {
    this.held.set(this.fit());
  }

  protected release(): void {
    this.held.set(null);
  }

  /** An arc of radius r from the horizon to the angle (negative = below). */
  protected arc(angle: number, r: number): string {
    const rad = angle / DEG;
    const x = EYE_X + r * Math.cos(rad);
    const y = this.eyeY() - r * Math.sin(rad);
    return `M${EYE_X + r} ${this.eyeY()}A${r} ${r} 0 0 ${angle > 0 ? 0 : 1} ${x} ${y}`;
  }

  protected dragEye(point: SvgPoint): void {
    const { min, max, step } = READING_LIMITS.eye;
    this.eyeHeight.set(
      clamp(snap((GROUND - point.y) / this.k(), step), min, max),
    );
  }

  protected dragBase(point: SvgPoint): void {
    const distance = clamp((point.x - EYE_X) / this.k(), 2, 60);
    const { min, max, step } = READING_LIMITS.base;
    this.baseAngle.set(
      clamp(snap(Math.atan(this.eyeHeight() / distance) * DEG, step), min, max),
    );
  }

  protected dragTop(point: SvgPoint): void {
    const height = Math.max(
      this.eyeHeight() + 0.1,
      (GROUND - point.y) / this.k(),
    );
    const rise = height - this.eyeHeight();
    const { min, max, step } = READING_LIMITS.top;
    this.topAngle.set(
      clamp(
        snap(Math.atan(rise / this.measured().distanceMeters) * DEG, step),
        min,
        max,
      ),
    );
  }

  protected keyEye(event: KeyboardEvent): void {
    const { min, max, step } = READING_LIMITS.eye;
    const next = stepByKey(event, this.eyeHeight(), step, min, max);
    if (next !== null) this.eyeHeight.set(next);
  }

  protected keyBase(event: KeyboardEvent): void {
    const { min, max, step } = READING_LIMITS.base;
    // Moving the foot away (right) makes α smaller.
    const next = stepByKey(event, this.baseAngle(), step, min, max, true);
    if (next !== null) this.baseAngle.set(next);
  }

  protected keyTop(event: KeyboardEvent): void {
    const { min, max, step } = READING_LIMITS.top;
    const next = stepByKey(event, this.topAngle(), step, min, max);
    if (next !== null) this.topAngle.set(next);
  }
}
