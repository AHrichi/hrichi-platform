import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SerraI18n } from '../i18n/serra-i18n';
import {
  clamp,
  snap,
  stepByKey,
  stepDigits,
  SvgDrag,
  type SvgPoint,
} from './svg-drag';

const ARROWS = {
  x: 'M-2 -4l-4 4 4 4M2 -4l4 4-4 4',
  y: 'M-4 -2l4-4 4 4M-4 2l4 4 4-4',
} as const;

/**
 * A round handle on a drawing, for one number. Drag it (the drawing says how
 * a point maps to a value) or use its arrow keys; it's a slider to screen
 * readers, and the number field beside the drawing shows the same value.
 */
@Component({
  // Inside an <svg> only SVG elements render, so the handle is a <g> with an
  // attribute, not an <sc-…> element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'g[scHandle]',
  hostDirectives: [
    { directive: SvgDrag, outputs: ['scDragStart', 'scDragEnd'] },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'slider',
    tabindex: '0',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.transform]': "'translate(' + x() + ' ' + y() + ')'",
    '(keydown)': 'key($event)',
  },
  template: `
    <svg:circle class="hit" r="28" />
    <svg:circle class="dot" r="11" />
    <svg:path class="arrows" [attr.d]="arrows()" />
  `,
  styleUrl: './drag-handle.scss',
})
export class DragHandle {
  readonly x = input.required<number>();
  readonly y = input.required<number>();
  readonly axis = input<'x' | 'y'>('y');
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly step = input.required<number>();
  readonly label = input.required<string>();
  readonly unit = input('');
  /** Maps a pointer position (viewBox units) to a value, before snapping. */
  readonly fromPoint = input.required<(point: SvgPoint) => number>();
  /** For handles where moving down grows the value (a depth). */
  readonly downIncreases = input(false);
  readonly valueChange = output<number>();

  private readonly i18n = inject(SerraI18n);
  protected readonly arrows = computed(() => ARROWS[this.axis()]);
  protected readonly valueText = computed(() =>
    `${this.i18n.num(this.value(), stepDigits(this.step()))} ${this.unit()}`.trim(),
  );

  constructor() {
    inject(SvgDrag).scSvgDrag.subscribe((point) =>
      this.set(this.fromPoint()(point)),
    );
  }

  protected key(event: KeyboardEvent): void {
    const next = stepByKey(
      event.key,
      event.shiftKey,
      this.value(),
      this.step(),
      this.min(),
      this.max(),
      this.downIncreases(),
    );
    if (next === null) return;
    event.preventDefault();
    this.set(next);
  }

  private set(raw: number): void {
    if (!Number.isFinite(raw)) return;
    const value = clamp(snap(raw, this.step()), this.min(), this.max());
    if (value !== this.value()) this.valueChange.emit(value);
  }
}
