import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { parseNumber, stepValue } from './numbers';

let nextId = 0;

/**
 * A number field with large − and + buttons either side, for gloved hands.
 * Typing works too, in Latin or Arabic-Indic digits.
 */
@Component({
  selector: 'gh-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
})
export class GhStepper {
  readonly label = input.required<string>();
  readonly lessLabel = input.required<string>();
  readonly moreLabel = input.required<string>();
  /** Empty is null; text that isn't a number is NaN. */
  readonly value = model<number | null>(null);
  readonly step = input(1);
  readonly min = input(0);
  readonly max = input(9999);
  /** Decimal input (for kg and hours) or whole numbers. */
  readonly decimal = input(false);
  readonly error = input<string | null>(null);
  readonly hint = input<string | null>(null);

  protected readonly id = `gh-stepper-${++nextId}`;
  /** What's in the box while typing, so `7,` isn't rewritten as `7`. */
  private readonly typed = signal<string | null>(null);
  protected readonly text = computed(() => {
    const typed = this.typed();
    if (typed !== null) return typed;
    const value = this.value();
    return value === null || Number.isNaN(value) ? '' : String(value);
  });
  protected readonly atMin = computed(() => (this.value() ?? 0) <= this.min());
  protected readonly atMax = computed(() => (this.value() ?? 0) >= this.max());

  protected onInput(text: string): void {
    this.typed.set(text);
    this.value.set(parseNumber(text));
  }

  protected onBlur(): void {
    this.typed.set(null);
  }

  protected bump(direction: 1 | -1): void {
    this.typed.set(null);
    this.value.set(
      stepValue(this.value(), direction * this.step(), {
        min: this.min(),
        max: this.max(),
      }),
    );
  }
}
