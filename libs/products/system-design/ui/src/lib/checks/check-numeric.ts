import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { type Marked, markCheck } from '@ah/products/system-design/domain';
import { SdInlineText } from '../inline-text/inline-text';
import type { CheckAnswerEvent, NumericCheck } from './check-types';

/**
 * Numeric estimation practice question (`sd-check-numeric`).
 * Input plus unit badge, marks with relative tolerance via `markCheck()`,
 * and displays `"within ±N%"` after answering.
 */
@Component({
  selector: 'sd-check-numeric',
  imports: [SdInlineText],
  templateUrl: './check-numeric.html',
  styleUrl: './check-numeric.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdCheckNumeric {
  readonly check = input.required<NumericCheck>();
  readonly initialValue = input<string>('');
  readonly initialSubmitted = input<boolean>(false);

  readonly answered = output<CheckAnswerEvent>();
  readonly reviewStep = output<string>();

  protected readonly rawValue = linkedSignal<string>(() => this.initialValue());

  protected readonly parsedValue = computed<number | null>(() => {
    const raw = this.rawValue().trim().replace(/,/g, '');
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  });

  protected readonly result = linkedSignal<Marked | null>(() => {
    const num = this.parsedValue();
    if (this.initialSubmitted() && num !== null) {
      return markCheck(this.check(), num);
    }
    return null;
  });

  protected readonly inputId = computed(
    () => `sd-numeric-input-${this.check().id}`,
  );

  protected readonly tolerancePercent = computed(() =>
    Math.round(this.check().tolerance * 100),
  );

  protected onInput(event: Event): void {
    if (this.result() !== null) return;
    const target = event.target as HTMLInputElement | null;
    this.rawValue.set(target?.value ?? '');
  }

  protected submit(): void {
    const num = this.parsedValue();
    if (num === null || this.result() !== null) return;
    const marked = markCheck(this.check(), num);
    this.result.set(marked);
    this.answered.emit({
      checkId: this.check().id,
      response: num,
      ...marked,
    });
  }
}
