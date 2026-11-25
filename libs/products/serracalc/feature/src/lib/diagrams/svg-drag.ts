import { Directive, ElementRef, inject, output } from '@angular/core';

export interface SvgPoint {
  x: number;
  y: number;
}

/**
 * Drags a diagram handle: emits the pointer's position in the SVG's own
 * coordinates (its viewBox), so a drag maps to the right value at any screen
 * size (LuxPath's lpSvgDrag, ADR-0019). Keyboard users get the same values
 * from the handle's arrow keys and from the fields beside the drawing.
 */
@Directive({
  selector: '[scSvgDrag]',
  host: {
    class: 'sc-drag-handle',
    // Chrome ignores touch-action inside an SVG, so a touch that starts on a
    // handle would scroll the page instead of dragging: cancel it here.
    '(touchstart)': '$event.preventDefault()',
    '(pointerdown)': 'start($event)',
    '(pointermove)': 'move($event)',
    '(pointerup)': 'end($event)',
    '(pointercancel)': 'end($event)',
  },
})
export class SvgDrag {
  readonly scSvgDrag = output<SvgPoint>();
  readonly scDragStart = output<void>();
  readonly scDragEnd = output<void>();
  private readonly element = inject<ElementRef<SVGGraphicsElement>>(ElementRef);
  private dragging = false;

  protected start(event: PointerEvent): void {
    this.dragging = true;
    this.element.nativeElement.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    this.scDragStart.emit();
  }

  protected move(event: PointerEvent): void {
    if (!this.dragging) return;
    const matrix = this.element.nativeElement.ownerSVGElement
      ?.getScreenCTM()
      ?.inverse();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix,
    );
    this.scSvgDrag.emit({ x: point.x, y: point.y });
  }

  protected end(event: PointerEvent): void {
    if (this.dragging) this.scDragEnd.emit();
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

/** Decimals a step shows: 1 → 0, 0.5 → 1, 0.05 → 2. */
export function stepDigits(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}

/**
 * Arrow keys on a handle: ±step, Shift for ×10; null for other keys.
 * `downIncreases` suits handles where moving down grows the value.
 */
export function stepByKey(
  key: string,
  shift: boolean,
  value: number,
  step: number,
  min: number,
  max: number,
  downIncreases = false,
): number | null {
  const vertical = downIncreases ? -1 : 1;
  const direction =
    key === 'ArrowRight'
      ? 1
      : key === 'ArrowLeft'
        ? -1
        : key === 'ArrowUp'
          ? vertical
          : key === 'ArrowDown'
            ? -vertical
            : 0;
  if (direction === 0) return null;
  return clamp(
    snap(value + direction * step * (shift ? 10 : 1), step),
    min,
    max,
  );
}
