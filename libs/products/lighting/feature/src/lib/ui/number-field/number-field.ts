import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

let nextId = 0;

/**
 * A labelled number with a slider: type an exact value, or drag on a phone.
 * Values outside min..max are clamped when the field loses focus.
 */
@Component({
  selector: 'lp-number-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './number-field.html',
  styleUrl: './number-field.scss',
})
export class NumberField {
  readonly label = input.required<string>();
  readonly unit = input<string>();
  readonly hint = input<string>();
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly value = model.required<number>();

  protected readonly id = `lp-number-${nextId++}`;

  protected onInput(raw: string): void {
    const value = Number(raw);
    if (raw !== '' && Number.isFinite(value)) {
      this.value.set(value);
    }
  }

  protected clamp(): void {
    const value = Math.min(this.max(), Math.max(this.min(), this.value()));
    if (value !== this.value()) {
      this.value.set(value);
    }
  }
}
