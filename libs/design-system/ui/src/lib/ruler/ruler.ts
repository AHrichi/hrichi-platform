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
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { isRtl } from '../direction';
import {
  bound,
  buzz,
  capture,
  decimalsOf,
  snapTo,
  valueForKey,
} from '../range';
import { injectReducedMotion } from '../reduced-motion';

/** Labels sit at least this far apart, px. */
const LABEL_GAP = 56;
/** A tick per step, this far apart on long scales, px… */
const TIGHTEST = 8;
/** …and at most this far apart on short ones. */
const LOOSEST = 24;
/** A flick keeps the tape coasting; it slows by this share every 16 ms. */
const FRICTION = 0.92;
/** The fastest a flick can send it, px per ms. */
const FASTEST_FLICK = 2.5;

/**
 * A tape measure under a fixed needle: swipe the tape sideways, flick it to
 * let it coast, or tap a mark to bring it under the needle. A tick per step,
 * a label on round numbers, and a buzz on phones as each label passes.
 *
 * Keyboard (WAI-ARIA slider): Up and Right add a step, Down and Left take one
 * off (right to left, Left adds, since the tape runs that way), Page Up and
 * Page Down jump from label to label, Home and End go to the ends.
 *
 * `companion` keeps it out of the tab order and the accessibility tree, for
 * a ruler under a typed field that already carries the label.
 */
@Component({
  selector: 'ah-ruler',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ruler.html',
  styleUrl: './ruler.scss',
  host: {
    class: 'ah-ruler',
    '[class.is-dragging]': 'dragging()',
    '[class.is-disabled]': 'disabled()',
  },
})
export class Ruler implements FormValueControl<number> {
  readonly value = model.required<number>();
  // Typed as Signal Forms binds them; `bound` keeps the default for undefined.
  readonly min = input<number | undefined, unknown>(0, {
    transform: bound(0),
  });
  readonly max = input<number | undefined, unknown>(100, {
    transform: bound(100),
  });
  readonly step = input(1);
  readonly label = input<string | null>(null);
  readonly labelledBy = input<string | null>(null);
  readonly unit = input('');
  readonly locale = input<string | undefined>(undefined);
  readonly valueText = input<((value: number) => string) | null>(null);
  readonly showValue = input(true);
  readonly companion = input(false);
  readonly disabled = input<boolean>(false);

  protected readonly lo = computed(() => this.min() ?? 0);
  protected readonly hi = computed(() => this.max() ?? 100);
  private readonly window =
    viewChild.required<ElementRef<HTMLElement>>('window');
  private readonly reduced = injectReducedMotion();
  private drag: {
    x: number;
    value: number;
    rtl: boolean;
    moved: boolean;
    samples: { x: number; t: number }[];
  } | null = null;
  private frame = 0;

  protected readonly dragging = signal(false);
  /** Taps and keys ease the tape into place; drags follow the finger. */
  protected readonly gliding = signal(false);

  constructor() {
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.frame));
  }

  private readonly range = computed(() => ({
    min: this.lo(),
    max: this.hi(),
    step: this.step(),
  }));

  private readonly steps = computed(() =>
    Math.max(1, Math.round((this.hi() - this.lo()) / this.step())),
  );

  /** Pixels per step: roomy on a short scale, tight on a long one. */
  protected readonly spacing = computed(() =>
    Math.min(LOOSEST, Math.max(TIGHTEST, 320 / this.steps())),
  );

  protected readonly length = computed(() => this.steps() * this.spacing());

  /** Where the value sits on the tape, px from its start. */
  protected readonly offset = computed(
    () => ((this.value() - this.lo()) / this.step()) * this.spacing(),
  );

  /** Steps from label to label: a round amount, never too crowded. */
  private readonly labelEvery = computed(() => {
    const step = this.step();
    const fewest = Math.ceil(LABEL_GAP / this.spacing());
    const target = fewest * step;
    const order = Math.floor(Math.log10(target));
    for (let k = order - 1; k <= order + 2; k++) {
      for (const m of [1, 2, 5]) {
        const size = m * 10 ** k;
        const count = size / step;
        if (
          size + 1e-9 >= target &&
          Math.abs(count - Math.round(count)) < 1e-6
        ) {
          return Math.round(count);
        }
      }
    }
    return fewest;
  });

  protected readonly labelGap = computed(
    () => this.labelEvery() * this.spacing(),
  );

  private readonly format = computed(
    () =>
      new Intl.NumberFormat(this.locale(), {
        maximumFractionDigits: decimalsOf(this.step()),
      }),
  );

  protected readonly marks = computed(() => {
    const { min, max, step } = this.range();
    const size = this.labelEvery() * step;
    const digits = Math.max(decimalsOf(size), decimalsOf(min));
    const format = new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: digits,
    });
    const marks: { value: number; at: number; text: string }[] = [];
    for (
      let i = Math.ceil((min - 1e-9) / size);
      i * size <= max + 1e-9 && marks.length < 400;
      i++
    ) {
      const value = Number((i * size).toFixed(digits));
      marks.push({
        value,
        at: ((value - min) / step) * this.spacing(),
        text: format.format(value),
      });
    }
    return marks;
  });

  protected readonly firstMark = computed(() => this.marks()[0]?.at ?? 0);

  protected readonly text = computed(() => {
    const custom = this.valueText();
    if (custom) return custom(this.value());
    return `${this.format().format(this.value())} ${this.unit()}`.trim();
  });

  protected key(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const next = valueForKey(event.key, this.value(), this.range(), {
      mirrored: isRtl(this.window().nativeElement),
      page: this.labelEvery() * this.step(),
    });
    if (next === null) return;
    event.preventDefault();
    this.stopCoasting();
    this.gliding.set(true);
    this.set(next);
  }

  protected down(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    this.stopCoasting();
    const window = this.window().nativeElement;
    capture(window, event.pointerId);
    if (!this.companion()) window.focus({ preventScroll: true });
    this.drag = {
      x: event.clientX,
      value: this.value(),
      rtl: isRtl(window),
      moved: false,
      samples: [{ x: event.clientX, t: event.timeStamp }],
    };
  }

  protected move(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      this.dragging.set(true);
      this.gliding.set(false);
    }
    // Pulling the tape back (left, or right in RTL) brings bigger numbers.
    const sign = drag.rtl ? 1 : -1;
    this.set(drag.value + ((sign * dx) / this.spacing()) * this.step(), event);
    drag.samples.push({ x: event.clientX, t: event.timeStamp });
    while (
      drag.samples.length > 2 &&
      event.timeStamp - drag.samples[0].t > 100
    ) {
      drag.samples.shift();
    }
  }

  protected up(event: PointerEvent): void {
    const drag = this.drag;
    this.drag = null;
    this.dragging.set(false);
    if (!drag) return;
    const sign = drag.rtl ? 1 : -1;
    if (!drag.moved) {
      // A tap brings that mark under the needle.
      const box = this.window().nativeElement.getBoundingClientRect();
      const fromNeedle = event.clientX - (box.left + box.width / 2);
      this.gliding.set(true);
      this.set(
        this.value() - ((sign * fromNeedle) / this.spacing()) * this.step(),
        event,
      );
      return;
    }
    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const ms = last.t - first.t;
    const measured = ms > 0 ? (last.x - first.x) / ms : 0;
    const pxPerMs = Math.max(-FASTEST_FLICK, Math.min(FASTEST_FLICK, measured));
    if (!this.reduced() && Math.abs(pxPerMs) > 0.3) {
      this.coast(((sign * pxPerMs) / this.spacing()) * this.step(), event);
    }
  }

  protected cancel(): void {
    this.drag = null;
    this.dragging.set(false);
  }

  /** A flick: the tape keeps going and slows down, or stops at an end. */
  private coast(perMs: number, event: PointerEvent): void {
    let speed = perMs;
    let raw = this.value();
    let then = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - then);
      then = now;
      raw += speed * dt;
      speed *= FRICTION ** (dt / 16);
      this.set(raw, event);
      const stuck = this.value() === this.lo() || this.value() === this.hi();
      const slow = Math.abs(speed * 16) < this.step() / 2;
      this.frame = stuck || slow ? 0 : requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stopCoasting(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private set(raw: number, event?: PointerEvent): void {
    const next = snapTo(raw, this.range());
    if (next === this.value()) return;
    this.value.set(next);
    if (event && this.isLandmark(next)) buzz(event, this.reduced());
  }

  /** The ends and the labels: where a finger feels a click. */
  private isLandmark(value: number): boolean {
    if (value === this.lo() || value === this.hi()) return true;
    const size = this.labelEvery() * this.step();
    const units = value / size;
    return Math.abs(units - Math.round(units)) < 1e-6;
  }
}
