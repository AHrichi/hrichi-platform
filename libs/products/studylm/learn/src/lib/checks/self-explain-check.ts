import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import type { BlockOf } from '@ah/products/studylm/lessons';
import { CHECK_STYLES, type CheckRecord } from './check-shared';

interface SelfExplainAnswer {
  text: string;
  /** The rubric points the learner says their answer covered. */
  covered: number[];
}

/**
 * Explain it in your own words, then compare with a model answer
 * (self-explanation, Bisra et al., 2018). The learner marks their own
 * answer against the rubric; AI feedback comes in a later phase.
 */
@Component({
  selector: 'sl-self-explain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Explain it yourself</p>
    <label class="question" [for]="b.id + '-text'">{{ b.prompt }}</label>
    <textarea
      [id]="b.id + '-text'"
      [value]="text()"
      (input)="text.set($any($event.target).value)"
      [disabled]="comparing() || done()"
      placeholder="In your own words…"
    ></textarea>
    @if (!comparing() && !done()) {
      <div class="actions">
        <button
          type="button"
          class="primary"
          [disabled]="!text().trim()"
          (click)="comparing.set(true)"
        >
          Compare with a model answer
        </button>
      </div>
    } @else {
      <fieldset>
        <legend class="question">Did your answer cover…</legend>
        @for (point of b.rubric; track $index) {
          <label class="option">
            <input
              type="checkbox"
              [checked]="covered().includes($index)"
              [disabled]="done()"
              (change)="toggle($index)"
            />
            {{ point }}
          </label>
        }
      </fieldset>
      <div class="model">
        <p class="kind">A model answer</p>
        <p>{{ b.modelAnswer }}</p>
      </div>
      @if (!done()) {
        <div class="actions">
          <button type="button" class="primary" (click)="finish()">Done</button>
        </div>
      } @else {
        <p role="status">
          {{
            correct()
              ? '✓ You covered most of it.'
              : 'Worth another look: read the model answer, then try in your own words again.'
          }}
        </p>
        <div class="actions">
          <button type="button" class="ghost" (click)="again()">
            Write it again
          </button>
        </div>
      }
    }
  `,
  styles: [
    CHECK_STYLES,
    `
      .model {
        padding: var(--space-3);
        border-radius: var(--radius-md);
        background: var(--color-info-subtle);
      }
      .model p {
        margin: 0 0 var(--space-1);
        line-height: 1.6;
      }
      legend {
        margin-block-end: var(--space-2);
      }
    `,
  ],
})
export class SelfExplainCheck {
  readonly block = input.required<BlockOf<'self-explain'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  private readonly savedAnswer = computed(
    () => this.saved()?.answer as SelfExplainAnswer | undefined,
  );
  protected readonly text = linkedSignal(() => this.savedAnswer()?.text ?? '');
  protected readonly covered = linkedSignal(
    () => this.savedAnswer()?.covered ?? [],
  );
  protected readonly done = linkedSignal(() => this.saved() !== null);
  protected readonly comparing = signal(false);
  protected readonly correct = computed(
    () => this.covered().length * 2 >= this.block().rubric.length,
  );

  protected toggle(index: number): void {
    this.covered.update((covered) =>
      covered.includes(index)
        ? covered.filter((i) => i !== index)
        : [...covered, index],
    );
  }

  protected finish(): void {
    this.done.set(true);
    this.answered.emit({
      answer: { text: this.text(), covered: this.covered() },
      correct: this.correct(),
    });
  }

  protected again(): void {
    this.done.set(false);
    this.comparing.set(false);
    this.covered.set([]);
  }
}
