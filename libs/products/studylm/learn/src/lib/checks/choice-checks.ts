import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import type { BlockOf } from '@ah/products/studylm/lessons';
import { CHECK_STYLES, CheckFeedback, type CheckRecord } from './check-shared';
import { markPredict, markQuiz } from './marking';

/** One or more right options; checkboxes when more than one is right. */
@Component({
  selector: 'sl-quiz',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Quiz</p>
    <p class="question" [id]="b.id + '-q'">{{ b.question }}</p>
    @if (b.code) {
      <pre dir="ltr"><code>{{ b.code.code }}</code></pre>
    }
    <fieldset
      [attr.aria-labelledby]="b.id + '-q'"
      [disabled]="result() !== null"
    >
      @for (option of b.options; track $index) {
        <label class="option">
          <input
            [type]="multiple() ? 'checkbox' : 'radio'"
            [name]="b.id"
            [checked]="chosen().includes($index)"
            (change)="toggle($index)"
          />
          {{ option }}
        </label>
      }
    </fieldset>
    @if (result() === null) {
      <div class="actions">
        <button
          type="button"
          class="primary"
          [disabled]="!chosen().length"
          (click)="submit()"
        >
          Check
        </button>
      </div>
    } @else {
      <sl-check-feedback
        [correct]="result() === true"
        [explanation]="b.explanation"
        (retry)="retry()"
      />
    }
  `,
  styles: CHECK_STYLES,
})
export class QuizCheck {
  readonly block = input.required<BlockOf<'quiz'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  protected readonly multiple = computed(() => this.block().correct.length > 1);
  protected readonly chosen = linkedSignal(
    () => (this.saved()?.answer as number[] | undefined) ?? [],
  );
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );

  protected toggle(index: number): void {
    this.chosen.update((chosen) =>
      this.multiple()
        ? chosen.includes(index)
          ? chosen.filter((i) => i !== index)
          : [...chosen, index]
        : [index],
    );
  }

  protected submit(): void {
    const answer = this.chosen();
    const correct = markQuiz(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }

  protected retry(): void {
    this.result.set(null);
    this.chosen.set([]);
  }
}

/**
 * Predict first, then see it: guessing before the visual shows the answer
 * helps even when the guess is wrong (the pretesting effect).
 */
@Component({
  selector: 'sl-predict',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Predict first</p>
    <p class="question" [id]="b.id + '-q'">{{ b.question }}</p>
    @if (b.options) {
      <fieldset
        [attr.aria-labelledby]="b.id + '-q'"
        [disabled]="result() !== null"
      >
        @for (option of b.options; track $index) {
          <label class="option">
            <input
              type="radio"
              [name]="b.id"
              [checked]="choice() === $index"
              (change)="choice.set($index)"
            />
            {{ option }}
          </label>
        }
      </fieldset>
    } @else {
      <input
        type="text"
        [attr.aria-labelledby]="b.id + '-q'"
        [value]="text()"
        (input)="text.set($any($event.target).value)"
        [disabled]="result() !== null"
        placeholder="Your prediction"
      />
    }
    @if (result() === null) {
      <div class="actions">
        <button
          type="button"
          class="primary"
          [disabled]="!ready()"
          (click)="submit()"
        >
          Lock in my prediction
        </button>
      </div>
    } @else {
      <sl-check-feedback
        [correct]="result() === true"
        [explanation]="b.explanation"
        (retry)="retry()"
      >
        @if (!b.options && b.expected && result() === false) {
          <p>
            The answer: <strong>{{ b.expected }}</strong>
          </p>
        }
        @if (b.reveal) {
          <div class="actions">
            <button type="button" class="ghost" (click)="reveal.emit()">
              See it in the visual
            </button>
          </div>
        }
      </sl-check-feedback>
    }
  `,
  styles: CHECK_STYLES,
})
export class PredictCheck {
  readonly block = input.required<BlockOf<'predict'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();
  readonly reveal = output<void>();

  protected readonly choice = linkedSignal<number | null>(() => {
    const answer = this.saved()?.answer;
    return typeof answer === 'number' ? answer : null;
  });
  protected readonly text = linkedSignal(() => {
    const answer = this.saved()?.answer;
    return typeof answer === 'string' ? answer : '';
  });
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );
  protected readonly ready = computed(() =>
    this.block().options ? this.choice() !== null : this.text().trim() !== '',
  );

  protected submit(): void {
    const answer = this.block().options
      ? (this.choice() as number)
      : this.text();
    const correct = markPredict(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }

  protected retry(): void {
    this.result.set(null);
  }
}
