import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { isRtl } from '../direction';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * A single-choice switch with radio-group semantics: one tab stop, arrow keys
 * move and select (WAI-ARIA radio group pattern).
 */
@Component({
  selector: 'ah-segmented-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.scss',
})
export class SegmentedControl<T extends string> {
  readonly options = input.required<readonly SegmentedOption<T>[]>();
  readonly value = model.required<T>();
  /** Accessible name of the group, e.g. "View this site as". */
  readonly label = input.required<string>();

  private readonly segments =
    viewChildren<ElementRef<HTMLButtonElement>>('segment');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected onKeydown(event: KeyboardEvent, index: number): void {
    // Right-to-left, the right arrow goes to the previous option.
    const forward = isRtl(this.host.nativeElement) ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const step =
      event.key === forward || event.key === 'ArrowDown'
        ? 1
        : event.key === back || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const options = this.options();
    const next = (index + step + options.length) % options.length;
    this.value.set(options[next].value);
    this.segments()[next]?.nativeElement.focus();
  }
}
