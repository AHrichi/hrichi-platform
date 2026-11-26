import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { isRtl } from '../direction';
import { bound, capture, nextRound, snapTo } from '../range';

let nextId = 0;

/** How long a held button waits before repeating, then the first gap, ms. */
const HOLD_DELAY = 380;
const FIRST_GAP = 150;
/** Each repeat comes a little sooner, down to this gap. */
const FASTEST_GAP = 35;

/**
 * A number between − and +: tap for a step, hold to keep going, faster the
 * longer you hold, with a glow on each change and a small bump at the ends.
 * `adaptive` steps to the next round number instead (12 345 → 13 000 →
 * 14 000), for ranges far too wide for single steps, like an area or a price.
 *
 * Keyboard: the input in the middle is a native spinbutton (Up and Down by a
 * step, or type a value; it's clamped to min..max when it loses focus).
 * Page Up and Page Down make a big nudge: ten steps, or the next round number
 * when adaptive. The − and + buttons stay out of the tab order, since the
 * arrow keys do the same; screen readers can still press them.
 *
 * Give it a `label`, or point a `<label for>` at its `inputId`. Works as a
 * Signal Forms control (`[formField]`).
 */
@Component({
  selector: 'ah-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  host: {
    class: 'ah-stepper',
    '[class.is-disabled]': 'disabled()',
    '[attr.data-wall]': 'wall()',
  },
})
export class Stepper implements FormValueControl<number> {
  readonly value = model.required<number>();
  // Typed as Signal Forms binds them; `bound` keeps the default for undefined.
  readonly min = input<number | undefined, unknown>(0, {
    transform: bound(0),
  });
  readonly max = input<number | undefined, unknown>(100, {
    transform: bound(100),
  });
  readonly step = input(1);
  /** Step to the next round number, for very wide ranges. */
  readonly adaptive = input(false);
  /** The input's id, for a `<label for>` outside. */
  readonly inputId = input(`ah-stepper-${nextId++}`);
  /** Accessible name, when no `<label for>` names the input. */
  readonly label = input<string | null>(null);
  readonly describedBy = input<string | null>(null);
  /** A unit shown inside the box, after the number. */
  readonly unit = input<string | null>(null);
  readonly decreaseLabel = input('Decrease');
  readonly increaseLabel = input('Increase');
  readonly disabled = input<boolean>(false);

  protected readonly lo = computed(() => this.min() ?? 0);
  protected readonly hi = computed(() => this.max() ?? 100);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The button a pointer pressed, so its click doesn't count twice. */
  private pressed = false;
  private pulses = 0;
  private walls = 0;

  /** Alternates, so the same CSS animation starts again on every change. */
  protected readonly pulse = signal<string | null>(null);
  protected readonly wall = signal<string | null>(null);
  protected readonly holding = signal<1 | -1 | 0>(0);
  protected readonly atMin = computed(() => this.value() <= this.lo());
  protected readonly atMax = computed(() => this.value() >= this.hi());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release());
  }

  /** One nudge down (-1) or up (1). False at the end of the range. */
  nudge(direction: 1 | -1, big = false): boolean {
    const value = this.value();
    const range = { min: this.lo(), max: this.hi(), step: this.step() };
    const target =
      this.adaptive() || big
        ? this.adaptive()
          ? nextRound(value, direction, range.step)
          : value + direction * range.step * 10
        : value + direction * range.step;
    const next = snapTo(target, range);
    if (next === value) {
      this.bump(direction);
      return false;
    }
    this.value.set(next);
    this.pulse.set(`${direction > 0 ? 'up' : 'down'}-${this.pulses++ % 2}`);
    return true;
  }

  protected press(event: PointerEvent, direction: 1 | -1): void {
    if (event.button !== 0 || this.disabled()) return;
    // Keeps the caret where it is, and no text selection on a long press.
    event.preventDefault();
    this.pressed = true;
    capture(event.currentTarget as HTMLElement, event.pointerId);
    this.release();
    if (!this.nudge(direction)) return;
    this.holding.set(direction);
    let gap = FIRST_GAP;
    const repeat = () => {
      if (!this.nudge(direction)) {
        this.release();
        return;
      }
      gap = Math.max(FASTEST_GAP, gap * 0.86);
      this.timer = setTimeout(repeat, gap);
    };
    this.timer = setTimeout(repeat, HOLD_DELAY);
  }

  protected release(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.holding.set(0);
  }

  /** A click with no pointer press behind it: a screen reader, Enter, Space. */
  protected clicked(direction: 1 | -1): void {
    if (this.pressed) {
      this.pressed = false;
      return;
    }
    if (!this.disabled()) this.nudge(direction);
  }

  protected key(event: KeyboardEvent): void {
    const direction =
      event.key === 'PageUp' ? 1 : event.key === 'PageDown' ? -1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    this.nudge(direction, true);
  }

  protected typed(raw: string): void {
    const value = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(value)) {
      this.value.set(value);
    }
  }

  /** Typed values may sit between steps, but never outside the range. */
  protected settle(input: HTMLInputElement): void {
    const value = Math.min(this.hi(), Math.max(this.lo(), this.value()));
    if (value !== this.value()) this.value.set(value);
    input.value = String(this.value());
  }

  /** The box knocks against the end it was pushed towards. */
  private bump(direction: 1 | -1): void {
    const towardsRight = direction > 0 !== isRtl(this.host.nativeElement);
    this.wall.set(`${towardsRight ? 'end' : 'start'}-${this.walls++ % 2}`);
  }
}
