import { Directive, ElementRef, inject, output } from '@angular/core';

export interface SvgPoint {
  x: number;
  y: number;
}

/**
 * Drags a diagram handle: emits the pointer's position in the SVG's own
 * coordinates (its viewBox), so a drag maps to the right value at any screen
 * size. Keyboard users get the same values from the handle's arrow keys
 * (role="slider") and from the fields beside the diagram.
 */
@Directive({
  selector: '[lpSvgDrag]',
  host: {
    class: 'lp-drag-handle',
    '(pointerdown)': 'start($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'end($event)',
    '(pointercancel)': 'end($event)',
  },
})
export class SvgDrag {
  readonly lpSvgDrag = output<SvgPoint>();
  readonly lpDragStart = output<void>();
  readonly lpDragEnd = output<void>();
  private readonly element = inject<ElementRef<SVGGraphicsElement>>(ElementRef);
  private dragging = false;

  protected start(event: PointerEvent): void {
    this.dragging = true;
    this.element.nativeElement.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    this.lpDragStart.emit();
  }

  protected move(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const matrix = this.element.nativeElement.ownerSVGElement
      ?.getScreenCTM()
      ?.inverse();
    if (!matrix) {
      return;
    }
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix,
    );
    this.lpSvgDrag.emit({ x: point.x, y: point.y });
  }

  protected end(event: PointerEvent): void {
    if (this.dragging) {
      this.lpDragEnd.emit();
    }
    this.dragging = false;
    if (this.element.nativeElement.hasPointerCapture?.(event.pointerId)) {
      this.element.nativeElement.releasePointerCapture(event.pointerId);
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Rounds to the step's precision, so 0.1 steps never show 0.30000000000000004. */
export function snap(value: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return Number((Math.round(value / step) * step).toFixed(decimals));
}

/**
 * Arrow keys on a diagram handle: ±step, Shift for ×10; null for other keys.
 * `downIncreases` suits handles where moving down grows the value (a depth).
 */
export function stepByKey(
  event: KeyboardEvent,
  value: number,
  step: number,
  min: number,
  max: number,
  downIncreases = false,
): number | null {
  const vertical = downIncreases ? -1 : 1;
  const direction =
    event.key === 'ArrowRight'
      ? 1
      : event.key === 'ArrowLeft'
        ? -1
        : event.key === 'ArrowUp'
          ? vertical
          : event.key === 'ArrowDown'
            ? -vertical
            : 0;
  if (direction === 0) {
    return null;
  }
  event.preventDefault();
  return clamp(
    snap(value + direction * step * (event.shiftKey ? 10 : 1), step),
    min,
    max,
  );
}
