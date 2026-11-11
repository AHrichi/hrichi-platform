import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export type SwipeDirection = 'left' | 'right' | 'up';

/** A drag past this share of the card's size counts as a swipe. */
const DISTANCE = 0.3;
/** …or a flick faster than this, in px per ms. */
const VELOCITY = 0.6;
const MAX_TILT_DEG = 8;

function prefersReducedMotion(): boolean {
  return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A card you swipe right or left, and up when `allowUp` (design §2).
 * Swiping is never the only way: the arrow keys work when the card has
 * focus, and screens put buttons beside it. With reduced motion the card
 * doesn't fly off.
 */
@Component({
  selector: 'lrn-swipe-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'swipe-card',
    tabindex: '0',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[style.transform]': 'transform()',
    '[style.touch-action]': "allowUp() ? 'none' : 'pan-y'",
    '[class.is-dragging]': 'dragging()',
    '(pointerdown)': 'down($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'up($event)',
    '(pointercancel)': 'reset()',
    '(keydown.arrowleft)': 'swipe("left", $event)',
    '(keydown.arrowright)': 'swipe("right", $event)',
    '(keydown.arrowup)': 'allowUp() && swipe("up", $event)',
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      user-select: none;
      cursor: grab;
      will-change: transform;
    }

    :host(.is-dragging) {
      cursor: grabbing;
    }

    :host(:focus-visible) {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 3px;
    }
  `,
})
export class SwipeCard {
  readonly label = input('Swipe right to keep, left to discard');
  readonly disabled = input(false);
  /** Allow an upward swipe too (the review's "shaky"). */
  readonly allowUp = input(false);
  readonly swiped = output<SwipeDirection>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dx = signal(0);
  private readonly dy = signal(0);
  protected readonly dragging = signal(false);
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private pointerId: number | null = null;
  /** Decided once per drag: a horizontal swipe, an upward one, or a scroll. */
  private axis: 'x' | 'y' | 'none' | null = null;

  protected readonly transform = computed(() => {
    const dx = this.dx();
    const dy = this.dy();
    if (!dx && !dy) return null;
    const width = this.host.nativeElement.offsetWidth || 1;
    const tilt = Math.max(-1, Math.min(1, dx / width)) * MAX_TILT_DEG;
    return `translate(${dx}px, ${dy}px) rotate(${tilt}deg)`;
  });

  protected down(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    // Let buttons, links and fields inside the card work as usual.
    if (
      (event.target as HTMLElement).closest(
        'button, a, summary, input, textarea, label',
      )
    ) {
      return;
    }
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTime = event.timeStamp;
    this.axis = null;
    this.dragging.set(true);
    this.host.nativeElement.setPointerCapture?.(event.pointerId);
  }

  protected move(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (this.axis === null && Math.hypot(dx, dy) > 8) {
      if (Math.abs(dx) > Math.abs(dy)) this.axis = 'x';
      else this.axis = this.allowUp() && dy < 0 ? 'y' : 'none';
    }
    if (this.axis === 'x') this.dx.set(dx);
    if (this.axis === 'y') this.dy.set(Math.min(0, dy));
  }

  protected up(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    const element = this.host.nativeElement;
    const elapsed = Math.max(1, event.timeStamp - this.startTime);
    const dx = this.dx();
    const dy = this.dy();
    this.pointerId = null;
    this.dragging.set(false);
    if (
      this.axis === 'x' &&
      (Math.abs(dx) > (element.offsetWidth || 1) * DISTANCE ||
        Math.abs(dx) / elapsed > VELOCITY)
    ) {
      void this.flyOff(dx > 0 ? 'right' : 'left');
    } else if (
      this.axis === 'y' &&
      (-dy > (element.offsetHeight || 1) * DISTANCE || -dy / elapsed > VELOCITY)
    ) {
      void this.flyOff('up');
    } else {
      this.reset();
    }
  }

  protected swipe(direction: SwipeDirection, event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    void this.flyOff(direction);
  }

  protected reset(): void {
    this.pointerId = null;
    this.dragging.set(false);
    this.dx.set(0);
    this.dy.set(0);
  }

  private async flyOff(direction: SwipeDirection): Promise<void> {
    const element = this.host.nativeElement;
    if (!prefersReducedMotion() && element.animate) {
      const width = element.offsetWidth || 300;
      const height = element.offsetHeight || 300;
      const end =
        direction === 'up'
          ? `translate(0, ${-height * 1.5}px)`
          : `translate(${(direction === 'right' ? 1 : -1) * width * 1.5}px, 0) rotate(${(direction === 'right' ? 1 : -1) * MAX_TILT_DEG * 2}deg)`;
      await element
        .animate(
          [
            { transform: this.transform() ?? 'none', opacity: 1 },
            { transform: end, opacity: 0 },
          ],
          { duration: 220, easing: 'ease-in' },
        )
        .finished.catch(() => undefined);
    }
    this.reset();
    this.swiped.emit(direction);
  }
}
