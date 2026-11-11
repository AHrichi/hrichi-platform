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

export type SwipeDirection = 'left' | 'right';

/** A drag past this share of the card's width counts as a swipe. */
const DISTANCE = 0.3;
/** …or a flick faster than this, in px per ms. */
const VELOCITY = 0.6;
const MAX_TILT_DEG = 8;

function prefersReducedMotion(): boolean {
  return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A card you swipe right or left (design §2). Swiping is never the only
 * way: the arrow keys work when the card has focus, and screens put
 * buttons beside it. With reduced motion the card doesn't fly off.
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
    '[class.is-dragging]': 'dragging()',
    '(pointerdown)': 'down($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'up($event)',
    '(pointercancel)': 'reset()',
    '(keydown.arrowleft)': 'swipe("left", $event)',
    '(keydown.arrowright)': 'swipe("right", $event)',
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      touch-action: pan-y;
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
  readonly swiped = output<SwipeDirection>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dx = signal(0);
  protected readonly dragging = signal(false);
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private pointerId: number | null = null;
  private horizontal: boolean | null = null;

  protected readonly transform = computed(() => {
    const dx = this.dx();
    if (!dx) return null;
    const width = this.host.nativeElement.offsetWidth || 1;
    const tilt = Math.max(-1, Math.min(1, dx / width)) * MAX_TILT_DEG;
    return `translateX(${dx}px) rotate(${tilt}deg)`;
  });

  protected down(event: PointerEvent): void {
    if (this.disabled() || event.button !== 0) return;
    // Let buttons and links inside the card work as usual.
    if ((event.target as HTMLElement).closest('button, a, summary, input')) {
      return;
    }
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTime = event.timeStamp;
    this.horizontal = null;
    this.dragging.set(true);
    this.host.nativeElement.setPointerCapture?.(event.pointerId);
  }

  protected move(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    // Decide once whether this is a swipe or a scroll.
    if (this.horizontal === null && Math.hypot(dx, dy) > 8) {
      this.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (this.horizontal) this.dx.set(dx);
  }

  protected up(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    const dx = this.dx();
    const width = this.host.nativeElement.offsetWidth || 1;
    const velocity =
      Math.abs(dx) / Math.max(1, event.timeStamp - this.startTime);
    this.pointerId = null;
    this.dragging.set(false);
    if (
      this.horizontal &&
      (Math.abs(dx) > width * DISTANCE || velocity > VELOCITY)
    ) {
      void this.flyOff(dx > 0 ? 'right' : 'left');
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
  }

  private async flyOff(direction: SwipeDirection): Promise<void> {
    const element = this.host.nativeElement;
    if (!prefersReducedMotion() && element.animate) {
      const width = element.offsetWidth || 300;
      const to = (direction === 'right' ? 1 : -1) * width * 1.5;
      const tilt = (direction === 'right' ? 1 : -1) * MAX_TILT_DEG * 2;
      await element
        .animate(
          [
            { transform: this.transform() ?? 'none', opacity: 1 },
            { transform: `translateX(${to}px) rotate(${tilt}deg)`, opacity: 0 },
          ],
          { duration: 220, easing: 'ease-in' },
        )
        .finished.catch(() => undefined);
    }
    this.dx.set(0);
    this.swiped.emit(direction);
  }
}
