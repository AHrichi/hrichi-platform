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
  decimalsOf,
  snapTo,
  valueForKey,
} from '../range';
import { injectReducedMotion } from '../reduced-motion';

/** Colours from cold to hot, mixed between neighbours. */
const HEAT = [
  'var(--color-blue-500)',
  'var(--color-teal-500)',
  'var(--color-amber-500)',
  'var(--color-red-600)',
] as const;

/**
 * A temperature on a thermometer: the column rises from the bulb and turns
 * from blue through teal and amber to red as it warms, and the bulb glows
 * at either extreme. The colour follows the temperature itself (`cold` and
 * `hot`), not the range, so 35 °C looks hot on every scale. Drag the column,
 * or tap the tube to send it there.
 *
 * Keyboard (WAI-ARIA slider): Up and Right warm by a step, Down and Left
 * cool (right to left, Left warms, since the tube runs that way), Page Up
 * and Page Down move a tenth of the range, Home and End go to the ends.
 *
 * `companion` keeps it out of the tab order and the accessibility tree, for
 * a thermometer beside a typed field that already carries the label.
 */
@Component({
  selector: 'ah-thermometer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './thermometer.html',
  styleUrl: './thermometer.scss',
  host: {
    class: 'ah-thermometer',
    '[class.is-dragging]': 'dragging()',
    '[class.is-disabled]': 'disabled()',
  },
})
export class Thermometer implements FormValueControl<number> {
  readonly value = model.required<number>();
  // Typed as Signal Forms binds them; `bound` keeps the default for undefined.
  readonly min = input<number | undefined, unknown>(-10, {
    transform: bound(-10),
  });
  readonly max = input<number | undefined, unknown>(40, {
    transform: bound(40),
  });
  readonly step = input(0.5);
  /** The temperature drawn coldest (blue)… */
  readonly cold = input(0);
  /** …and hottest (red). */
  readonly hot = input(40);
  readonly label = input<string | null>(null);
  readonly labelledBy = input<string | null>(null);
  readonly unit = input('°C');
  readonly locale = input<string | undefined>(undefined);
  readonly valueText = input<((value: number) => string) | null>(null);
  readonly showValue = input(true);
  readonly companion = input(false);
  readonly disabled = input<boolean>(false);

  protected readonly lo = computed(() => this.min() ?? -10);
  protected readonly hi = computed(() => this.max() ?? 40);
  private readonly scale = viewChild.required<ElementRef<HTMLElement>>('scale');
  private readonly tube = viewChild.required<ElementRef<HTMLElement>>('tube');
  private readonly reduced = injectReducedMotion();
  /** A pointer is down; a drag starts once it moves. */
  private pressing = false;
  protected readonly dragging = signal(false);

  private readonly range = computed(() => ({
    min: this.lo(),
    max: this.hi(),
    step: this.step(),
  }));

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
  protected readonly zeroText = computed(() => this.format().format(0));

  protected readonly fraction = computed(() => this.share(this.value()));

  /** Where 0 °C sits, when the range crosses it. */
  protected readonly zero = computed(() =>
    this.lo() < 0 && this.hi() > 0 ? this.share(0) : null,
  );

  /** The 0 label, unless it would crowd the end labels. */
  protected readonly zeroLabel = computed(() => {
    const at = this.zero();
    return at !== null && at > 0.15 && at < 0.85 ? at : null;
  });

  /** 0 at `cold`, 1 at `hot`. */
  private readonly heat = computed(() => {
    const span = this.hot() - this.cold();
    const heat = span > 0 ? (this.value() - this.cold()) / span : 0;
    return Math.min(1, Math.max(0, heat));
  });

  protected readonly mercury = computed(() => {
    const at = this.heat() * (HEAT.length - 1);
    const from = Math.min(HEAT.length - 2, Math.floor(at));
    const share = Math.round((at - from) * 100);
    return `color-mix(in oklab, ${HEAT[from + 1]} ${share}%, ${HEAT[from]})`;
  });

  /** The bulb glows at the extremes: 0 in the mild middle, 1 at either end. */
  protected readonly glow = computed(
    () => Math.max(0, Math.abs(this.heat() - 0.5) * 2 - 0.4) / 0.6,
  );

  protected key(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const next = valueForKey(event.key, this.value(), this.range(), {
      mirrored: isRtl(this.scale().nativeElement),
    });
    if (next === null) return;
    event.preventDefault();
    this.set(next);
  }

  protected down(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    event.preventDefault();
    capture(this.scale().nativeElement, event.pointerId);
    this.pressing = true;
    // A tap glides there; only a drag follows the finger without easing.
    this.point(event);
  }

  protected move(event: PointerEvent): void {
    if (!this.pressing) return;
    this.dragging.set(true);
    this.point(event);
  }

  protected up(): void {
    this.pressing = false;
    this.dragging.set(false);
  }

  private point(event: PointerEvent): void {
    const tube = this.tube().nativeElement;
    const box = tube.getBoundingClientRect();
    // The tube starts under the bulb; the scale starts at the bulb's edge.
    const hidden = parseFloat(getComputedStyle(tube).paddingInlineStart) || 0;
    const travel = box.width - hidden;
    if (travel <= 0) return;
    const along = isRtl(tube)
      ? box.right - hidden - event.clientX
      : event.clientX - box.left - hidden;
    const before = this.value();
    this.set(this.lo() + (along / travel) * (this.hi() - this.lo()));
    const after = this.value();
    if (
      after !== before &&
      (after === this.lo() || after === this.hi() || after === 0)
    ) {
      buzz(event, this.reduced());
    }
  }

  private set(raw: number): void {
    const next = snapTo(raw, this.range());
    if (next !== this.value()) this.value.set(next);
  }

  private share(value: number): number {
    const span = this.hi() - this.lo();
    return span > 0 ? Math.min(1, Math.max(0, (value - this.lo()) / span)) : 0;
  }
}
