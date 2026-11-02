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
import {
  clozeParts,
  markCloze,
  markOutput,
  markParsons,
  type ParsonsAnswer,
} from './marking';
import { expectedOutput } from '../player/executed';

interface PoolLine {
  /** A solution line's id, or `distractor-<n>`. */
  id: string;
  code: string;
  indent: number;
}

/**
 * A faded Parsons problem: put the right lines in order, leave the
 * distractors out, and fill the blanks (Weinman et al., 2021).
 */
@Component({
  selector: 'sl-parsons',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Build the code</p>
    <p class="question">{{ b.prompt }}</p>
    <div class="columns" dir="ltr">
      <section [attr.aria-label]="'Lines to use'">
        <p class="label">Lines</p>
        <ul class="list">
          @for (line of pool(); track line.id) {
            <li class="row">
              <code class="text">{{ line.code }}</code>
              <button
                type="button"
                class="icon"
                (click)="use(line.id)"
                [disabled]="result() !== null"
                [attr.aria-label]="'Use: ' + line.code"
              >
                +
              </button>
            </li>
          } @empty {
            <li class="empty">Every line is in your answer.</li>
          }
        </ul>
      </section>
      <section [attr.aria-label]="'Your answer'">
        <p class="label">Your answer</p>
        <ol class="list">
          @for (
            line of solution();
            track line.id;
            let first = $first;
            let last = $last
          ) {
            <li
              class="row"
              [style.padding-inline-start.ch]="2 + line.indent * 2"
            >
              <code class="text">
                @for (part of parts(line.code); track $index) {
                  @if (part === null) {
                    <input
                      type="text"
                      class="blank"
                      [value]="blanks()[line.id] ?? ''"
                      (input)="fill(line.id, $any($event.target).value)"
                      [disabled]="result() !== null"
                      aria-label="Fill the blank"
                    />
                  } @else {
                    <span [textContent]="part"></span>
                  }
                }
              </code>
              <button
                type="button"
                class="icon"
                (click)="move($index, -1)"
                [disabled]="first || result() !== null"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                class="icon"
                (click)="move($index, 1)"
                [disabled]="last || result() !== null"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                class="icon"
                (click)="remove(line.id)"
                [disabled]="result() !== null"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          } @empty {
            <li class="empty">Add lines with +.</li>
          }
        </ol>
      </section>
    </div>
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
        (retry)="result.set(null)"
      />
    }
  `,
  styles: [
    CHECK_STYLES,
    `
      .columns {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
        gap: var(--space-3);
      }
      .label {
        margin: 0 0 var(--space-1);
        color: var(--color-text-muted);
        font-size: var(--font-size-100);
        font-weight: var(--font-weight-semibold);
      }
      .text {
        white-space: pre-wrap;
        font-size: var(--font-size-200);
      }
      .blank {
        inline-size: 8ch;
        min-block-size: 2rem;
        font-family: var(--font-family-mono);
      }
      .empty {
        color: var(--color-text-muted);
        font-size: var(--font-size-200);
      }
    `,
  ],
})
export class ParsonsCheck {
  readonly block = input.required<BlockOf<'parsons'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  private readonly lines = computed<PoolLine[]>(() => {
    const block = this.block();
    return [
      ...block.lines.map((line) => ({ ...line })),
      ...block.distractors.map((code, i) => ({
        id: `distractor-${i}`,
        code,
        indent: 0,
      })),
    ];
  });
  private readonly saved$ = computed(
    () => this.saved()?.answer as ParsonsAnswer | undefined,
  );
  protected readonly chosen = linkedSignal(() => this.saved$()?.lines ?? []);
  protected readonly blanks = linkedSignal<Record<string, string>>(
    () => this.saved$()?.blanks ?? {},
  );
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );

  private readonly byId = computed(
    () => new Map(this.lines().map((line) => [line.id, line])),
  );
  protected readonly pool = computed(() => {
    const used = new Set(this.chosen());
    return shuffledLines(this.lines(), this.block().id).filter(
      (line) => !used.has(line.id),
    );
  });
  protected readonly solution = computed(() =>
    this.chosen().flatMap((id) => this.byId().get(id) ?? []),
  );

  /** A line split around its blank: null is where the input goes. */
  protected parts(code: string): (string | null)[] {
    const [before, ...rest] = code.split('___');
    return rest.length ? [before, null, rest.join('___')] : [code];
  }

  protected use(id: string): void {
    this.chosen.update((chosen) => [...chosen, id]);
  }

  protected remove(id: string): void {
    this.chosen.update((chosen) => chosen.filter((c) => c !== id));
  }

  protected move(index: number, by: number): void {
    this.chosen.update((chosen) => {
      const next = [...chosen];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  protected fill(line: string, value: string): void {
    this.blanks.update((blanks) => ({ ...blanks, [line]: value }));
  }

  protected submit(): void {
    const answer: ParsonsAnswer = {
      lines: this.chosen(),
      blanks: this.blanks(),
    };
    const correct = markParsons(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }
}

function shuffledLines(lines: PoolLine[], seed: string): PoolLine[] {
  // Sorted by a hash of each id: stable across reloads, never the solution.
  const order = [...lines].sort((a, b) =>
    hash(a.id + seed) < hash(b.id + seed) ? -1 : 1,
  );
  return order.every((line, i) => line === lines[i])
    ? [...order.slice(1), order[0]]
    : order;
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Read the code, then write exactly what it prints. */
@Component({
  selector: 'sl-predict-output',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Predict the output</p>
    <pre dir="ltr"><code>{{ b.code }}</code></pre>
    <label class="question" [for]="b.id + '-out'">What does it print?</label>
    <textarea
      class="mono"
      dir="ltr"
      [id]="b.id + '-out'"
      [value]="text()"
      (input)="text.set($any($event.target).value)"
      [disabled]="result() !== null"
      placeholder="One line per printed line"
    ></textarea>
    @if (result() === null) {
      <div class="actions">
        <button
          type="button"
          class="primary"
          [disabled]="!text().trim()"
          (click)="submit()"
        >
          Check
        </button>
      </div>
    } @else {
      <sl-check-feedback
        [correct]="result() === true"
        [explanation]="b.explanation"
        (retry)="result.set(null)"
      >
        @if (result() === false) {
          <p>It prints:</p>
          <pre dir="ltr"><code>{{ run().expected }}</code></pre>
        }
        @if (run().executed) {
          <p class="source">
            {{
              run().corrected
                ? 'Checked by running the code, which corrected the lesson’s written answer.'
                : 'Checked by running the code.'
            }}
          </p>
        }
      </sl-check-feedback>
    }
  `,
  styles: CHECK_STYLES,
})
export class PredictOutputCheck {
  readonly block = input.required<BlockOf<'predict-output'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  /** For JavaScript, what the code really prints, from the tracer. */
  protected readonly run = computed(() => expectedOutput(this.block()));
  protected readonly text = linkedSignal(
    () => (this.saved()?.answer as string | undefined) ?? '',
  );
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );

  protected submit(): void {
    const answer = this.text();
    const correct = markOutput(
      { ...this.block(), expected: this.run().expected },
      answer,
    );
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }
}

/** Fill the gaps in a sentence or a line of code. */
@Component({
  selector: 'sl-cloze',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Fill the gaps</p>
    <p class="sentence">
      @for (part of parts(); track $index) {
        @if ('blank' in part) {
          <input
            type="text"
            class="gap"
            [value]="filled()[part.blank] ?? ''"
            (input)="fill(part.blank, $any($event.target).value)"
            [disabled]="result() !== null"
            [attr.aria-label]="'Gap ' + ($index + 1)"
          />
        } @else {
          <span [textContent]="part.text"></span>
        }
      }
    </p>
    @if (result() === null) {
      <div class="actions">
        <button
          type="button"
          class="primary"
          [disabled]="!complete()"
          (click)="submit()"
        >
          Check
        </button>
      </div>
    } @else {
      <sl-check-feedback
        [correct]="result() === true"
        [explanation]="b.explanation"
        (retry)="result.set(null)"
      >
        @if (result() === false) {
          <p>Accepted: {{ answers() }}</p>
        }
      </sl-check-feedback>
    }
  `,
  styles: [
    CHECK_STYLES,
    `
      .sentence {
        margin: 0;
        line-height: 2.4;
      }
      .gap {
        inline-size: 10ch;
        margin-inline: var(--space-1);
      }
    `,
  ],
})
export class ClozeCheck {
  readonly block = input.required<BlockOf<'cloze'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  protected readonly parts = computed(() => clozeParts(this.block().text));
  protected readonly filled = linkedSignal<Record<string, string>>(
    () => (this.saved()?.answer as Record<string, string> | undefined) ?? {},
  );
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );
  protected readonly complete = computed(() =>
    this.block().blanks.every((blank) => this.filled()[blank.id]?.trim()),
  );
  protected readonly answers = computed(() =>
    this.block()
      .blanks.map((blank) => blank.answers[0])
      .join(', '),
  );

  protected fill(blank: string, value: string): void {
    this.filled.update((filled) => ({ ...filled, [blank]: value }));
  }

  protected submit(): void {
    const answer = this.filled();
    const correct = markCloze(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }
}
