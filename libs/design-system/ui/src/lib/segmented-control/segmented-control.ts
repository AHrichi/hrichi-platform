import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChildren,
} from '@angular/core';

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
  template: `
    <div class="track" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options(); track option.value; let i = $index) {
        <button
          #segment
          type="button"
          role="radio"
          class="segment"
          [attr.aria-checked]="option.value === value()"
          [tabIndex]="option.value === value() ? 0 : -1"
          (click)="value.set(option.value)"
          (keydown)="onKeydown($event, i)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    .track {
      display: inline-flex;
      max-inline-size: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      gap: var(--space-1);
      padding: var(--space-1);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-pill);

      &::-webkit-scrollbar {
        display: none;
      }
    }
    .segment {
      padding-block: var(--space-1);
      padding-inline: var(--space-3);
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background-color var(--motion-duration-fast)
        var(--motion-easing-standard);
    }
    .segment:hover {
      color: var(--color-text-default);
    }
    .segment[aria-checked='true'] {
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      box-shadow: var(--shadow-raised);
    }
  `,
})
export class SegmentedControl<T extends string> {
  readonly options = input.required<readonly SegmentedOption<T>[]>();
  readonly value = model.required<T>();
  /** Accessible name of the group, e.g. "View this site as". */
  readonly label = input.required<string>();

  private readonly segments =
    viewChildren<ElementRef<HTMLButtonElement>>('segment');

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
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
