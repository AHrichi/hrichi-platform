import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
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
  clockFraction,
  decimalsOf,
  gaugeFraction,
  snapTo,
  valueForKey,
} from '../range';
import { injectReducedMotion } from '../reduced-motion';

/** A labelled position around a clock face. */
export interface DialMark {
  readonly value: number;
  readonly label: string;
}

export type DialVariant = 'gauge' | 'clock';

/** Gauge geometry, in viewBox units: a half moon over its centre line. */
const GAUGE = { width: 120, height: 70, cx: 60, cy: 61, r: 48 } as const;
/** Clock geometry: a ring, labels inside it, the value in the middle. */
const CLOCK = { size: 140, c: 70, r: 56, labels: 42 } as const;

/**
 * A round control for one number. Drag the knob, or tap anywhere on the
 * face to jump there.
 *
 * - `gauge` (the default) is a half moon that fills from the start side,
 *   suited to a share or a level: a percentage, an efficiency.
 * - `clock` is a full turn that wraps around, for values that come back
 *   to the start, like an hour of the day (`period` 24) or a week of the
 *   year (`zero` 1, `period` 52). `marks` labels positions on the face.
 *
 * Keyboard (WAI-ARIA slider): Up and Right add a step, Down and Left take one
 * off (a right-to-left gauge swaps Left and Right, like the face), Page Up
 * and Page Down move a tenth of the range, Home and End go to the ends. A
 * clock wraps from its last value to its first.
 *
 * `companion` is for a dial that sits beside a typed field which already
 * carries the label and the keyboard: the dial then stays out of the tab
 * order and the accessibility tree, as a pointer-only aid.
 */
@Component({
  selector: 'ah-dial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dial.html',
  styleUrl: './dial.scss',
  host: {
    class: 'ah-dial',
    '[class.is-clock]': "variant() === 'clock'",
    '[class.is-dragging]': 'dragging()',
    '[class.is-disabled]': 'disabled()',
  },
})
export class Dial implements FormValueControl<number> {
  readonly value = model.required<number>();
  // Typed as Signal Forms binds them; `bound` keeps the default for undefined.
  readonly min = input<number | undefined, unknown>(0, {
    transform: bound(0),
  });
  readonly max = input<number | undefined, unknown>(100, {
    transform: bound(100),
  });
  readonly step = input(1);
  readonly variant = input<DialVariant>('gauge');
  /** Clock: the value at the top. Defaults to min. */
  readonly zero = input<number | null>(null);
  /** Clock: how many values make a full turn. Defaults to the whole range. */
  readonly period = input<number | null>(null);
  readonly marks = input<readonly DialMark[]>([]);
  /** Accessible name; or `labelledBy`, the id of a visible label. */
  readonly label = input<string | null>(null);
  readonly labelledBy = input<string | null>(null);
  readonly unit = input('');
  /** Number format, e.g. `fr-FR`; the browser's own when unset. */
  readonly locale = input<string | undefined>(undefined);
  /** How a value reads, aloud and in the middle of a clock. */
  readonly valueText = input<((value: number) => string) | null>(null);
  /** Shows the value inside the face. */
  readonly showValue = input(true);
  readonly companion = input(false);
  readonly disabled = input<boolean>(false);

  protected readonly lo = computed(() => this.min() ?? 0);
  protected readonly hi = computed(() => this.max() ?? 100);
  protected readonly gauge = GAUGE;
  protected readonly clock = CLOCK;
  /** The gauge's empty arc, end to end. */
  protected readonly gaugeTrack = `M ${GAUGE.cx - GAUGE.r} ${GAUGE.cy} A ${GAUGE.r} ${GAUGE.r} 0 0 1 ${GAUGE.cx + GAUGE.r} ${GAUGE.cy}`;

  private readonly face = viewChild.required<ElementRef<HTMLElement>>('face');
  private readonly reduced = injectReducedMotion();
  protected readonly dragging = signal(false);

  private readonly range = computed(() => ({
    min: this.lo(),
    max: this.hi(),
    step: this.step(),
  }));
  private readonly turn = computed(
    () => this.period() ?? this.hi() - this.lo() + this.step(),
  );
  private readonly start = computed(() => this.zero() ?? this.lo());

  private readonly format = computed(
    () =>
      new Intl.NumberFormat(this.locale(), {
        maximumFractionDigits: decimalsOf(this.step()),
      }),
  );

  protected readonly text = computed(() => {
    const custom = this.valueText();
    if (custom) return custom(this.value());
    return `${this.format().format(this.value())} ${this.unit()}`.trim();
  });
  protected readonly minText = computed(() => this.format().format(this.lo()));
  protected readonly maxText = computed(() => this.format().format(this.hi()));

  /** How far round the value is: 0..1. */
  protected readonly fraction = computed(() => {
    const value = this.value();
    if (this.variant() === 'clock') {
      const turn = this.turn();
      return ((((value - this.start()) % turn) + turn) % turn) / turn;
    }
    const span = this.hi() - this.lo();
    return span > 0 ? Math.min(1, Math.max(0, (value - this.lo()) / span)) : 0;
  });

  /** The knob, on the gauge's arc or the clock's ring. */
  protected readonly knob = computed(() =>
    this.variant() === 'clock'
      ? this.onClock(this.fraction(), CLOCK.r)
      : this.onGauge(this.fraction(), GAUGE.r),
  );

  /** The filled part of the track, from the start to the knob. */
  protected readonly fill = computed(() => {
    const f = this.fraction();
    if (f <= 0) return '';
    if (this.variant() === 'clock') {
      const end = this.onClock(f, CLOCK.r);
      const large = f > 0.5 ? 1 : 0;
      return `M ${CLOCK.c} ${CLOCK.c - CLOCK.r} A ${CLOCK.r} ${CLOCK.r} 0 ${large} 1 ${end.x} ${end.y}`;
    }
    const end = this.onGauge(f, GAUGE.r);
    return `M ${GAUGE.cx - GAUGE.r} ${GAUGE.cy} A ${GAUGE.r} ${GAUGE.r} 0 0 1 ${end.x} ${end.y}`;
  });

  /** Gauge: a tick every tenth, longer at the ends and the middle. */
  protected readonly ticks = computed(() =>
    Array.from({ length: 11 }, (_, i) => {
      const major = i % 5 === 0;
      const outer = this.onGauge(i / 10, GAUGE.r - 9);
      const inner = this.onGauge(i / 10, GAUGE.r - (major ? 17 : 13));
      return { major, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y };
    }),
  );

  /** Clock: labels inside the ring, and a notch for each on the ring. */
  protected readonly faceMarks = computed(() => {
    const turn = this.turn();
    return this.marks().map((mark) => {
      const f = ((((mark.value - this.start()) % turn) + turn) % turn) / turn;
      const at = this.onClock(f, CLOCK.labels);
      const notch = this.onClock(f, CLOCK.r - 5);
      const edge = this.onClock(f, CLOCK.r + 5);
      return {
        ...mark,
        x: at.x,
        y: at.y,
        nx1: notch.x,
        ny1: notch.y,
        nx2: edge.x,
        ny2: edge.y,
      };
    });
  });

  protected key(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const clock = this.variant() === 'clock';
    const mirrored = !clock && isRtl(this.face().nativeElement);
    const next = valueForKey(event.key, this.value(), this.range(), {
      mirrored,
    });
    if (next === null) return;
    event.preventDefault();
    if (
      clock &&
      (event.key.startsWith('Arrow') || event.key.startsWith('Page'))
    ) {
      this.set(this.wrap(next));
    } else {
      this.set(next);
    }
  }

  protected down(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    event.preventDefault();
    capture(this.face().nativeElement, event.pointerId);
    this.dragging.set(true);
    this.point(event);
  }

  protected move(event: PointerEvent): void {
    if (this.dragging()) this.point(event);
  }

  protected up(): void {
    this.dragging.set(false);
  }

  private point(event: PointerEvent): void {
    const svg = this.face().nativeElement.querySelector('svg');
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    if (box.width === 0) return;
    const clock = this.variant() === 'clock';
    const width = clock ? CLOCK.size : GAUGE.width;
    const height = clock ? CLOCK.size : GAUGE.height;
    const x = ((event.clientX - box.left) / box.width) * width;
    const y = ((event.clientY - box.top) / box.height) * height;
    const before = this.value();
    if (clock) {
      const f = clockFraction(x - CLOCK.c, CLOCK.c - y);
      this.set(this.wrap(this.start() + f * this.turn()));
    } else {
      let f = gaugeFraction(x - GAUGE.cx, GAUGE.cy - y);
      if (isRtl(this.face().nativeElement)) f = 1 - f;
      this.set(this.lo() + f * (this.hi() - this.lo()));
    }
    const after = this.value();
    if (after !== before && this.isLandmark(after)) {
      buzz(event, this.reduced());
    }
  }

  private set(raw: number): void {
    const next = snapTo(raw, this.range());
    if (next !== this.value()) this.value.set(next);
  }

  /** Brings a value past either end of a clock back round. */
  private wrap(raw: number): number {
    const { min, max, step } = this.range();
    const turn = this.turn();
    let value = min + Math.round((raw - min) / step) * step;
    while (value > max + step / 2) value -= turn;
    while (value < min - step / 2) value += turn;
    return value;
  }

  /** The ends and the marks: where a finger feels a click. */
  private isLandmark(value: number): boolean {
    return (
      value === this.lo() ||
      value === this.hi() ||
      this.marks().some((mark) => mark.value === value)
    );
  }

  private onGauge(f: number, radius: number): { x: number; y: number } {
    const angle = Math.PI * (1 - f);
    return {
      x: round(GAUGE.cx + radius * Math.cos(angle)),
      y: round(GAUGE.cy - radius * Math.sin(angle)),
    };
  }

  private onClock(f: number, radius: number): { x: number; y: number } {
    const angle = 2 * Math.PI * f;
    return {
      x: round(CLOCK.c + radius * Math.sin(angle)),
      y: round(CLOCK.c - radius * Math.cos(angle)),
    };
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
