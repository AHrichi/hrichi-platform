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
import type { CheckAnswerEvent, ChoiceCheck } from './check-types';

/**
 * Multiple-choice practice question (`sd-check-choice`).
 * Renders an accessible radio group, marks the response via `markCheck()`,
 * shows explanation feedback, and links back to the lesson step when present.
 */
@Component({
  selector: 'sd-check-choice',
  imports: [SdInlineText],
  templateUrl: './check-choice.html',
  styleUrl: './check-choice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdCheckChoice {
  readonly check = input.required<ChoiceCheck>();
  /** Optional pre-selected option index (for stories or restored state). */
  readonly initialChoice = input<number | null>(null);
  /** Whether the initial choice should start already marked. */
  readonly initialSubmitted = input<boolean>(false);

  readonly answered = output<CheckAnswerEvent>();
  readonly reviewStep = output<string>();

  protected readonly selectedIndex = linkedSignal<number | null>(() =>
    this.initialChoice(),
  );

  protected readonly result = linkedSignal<Marked | null>(() => {
    const choice = this.initialChoice();
    if (this.initialSubmitted() && choice !== null) {
      return markCheck(this.check(), choice);
    }
    return null;
  });

  protected readonly promptId = computed(() => `sd-choice-${this.check().id}`);

  protected choose(index: number): void {
    if (this.result() !== null) return;
    this.selectedIndex.set(index);
  }

  protected submit(): void {
    const idx = this.selectedIndex();
    if (idx === null || this.result() !== null) return;
    const marked = markCheck(this.check(), idx);
    this.result.set(marked);
    this.answered.emit({
      checkId: this.check().id,
      response: idx,
      ...marked,
    });
  }
}
