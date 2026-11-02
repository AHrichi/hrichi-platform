import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/** A check's answer as saved in the learner's progress. */
export interface CheckRecord {
  answer: unknown;
  correct: boolean;
}

/** Right or not, the explanation, and another go. */
@Component({
  selector: 'sl-check-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="feedback" [class.right]="correct()" role="status">
      <p class="verdict">{{ correct() ? '✓ Right' : '✗ Not quite' }}</p>
      @if (explanation(); as text) {
        <p>{{ text }}</p>
      }
      <ng-content />
      @if (!correct()) {
        <button type="button" class="ghost" (click)="retry.emit()">
          Try again
        </button>
      }
    </div>
  `,
  styles: `
    .feedback {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-3);
      border-inline-start: 4px solid var(--color-warning-default);
      border-radius: var(--radius-md);
      background: var(--color-warning-subtle);
    }
    .right {
      border-color: var(--color-success-default);
      background: var(--color-success-subtle);
    }
    p {
      margin: 0;
    }
    .verdict {
      font-weight: var(--font-weight-bold);
    }
    button {
      justify-self: start;
      min-block-size: 2.75rem;
      padding: 0 var(--space-4);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
  `,
})
export class CheckFeedback {
  readonly correct = input.required<boolean>();
  readonly explanation = input<string | null>(null);
  readonly retry = output<void>();
}

/** The look every check shares, so a lesson reads as one piece. */
export const CHECK_STYLES = `
  :host {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
  }
  .kind {
    margin: 0;
    color: var(--color-accent-default);
    font-size: var(--font-size-100);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .question {
    margin: 0;
    font-weight: var(--font-weight-semibold);
    line-height: 1.5;
  }
  pre {
    margin: 0;
    padding: var(--space-3);
    overflow-x: auto;
    border-radius: var(--radius-md);
    background: var(--color-stage-bg);
    color: var(--color-stage-text);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-200);
  }
  fieldset {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: none;
  }
  .option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-block-size: 2.75rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
  }
  input[type='text'],
  textarea,
  select {
    min-block-size: 2.75rem;
    padding: var(--space-2);
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    background: var(--color-bg-canvas);
    color: var(--color-text-default);
    font: inherit;
  }
  textarea {
    min-block-size: 6rem;
    resize: vertical;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .primary,
  .ghost {
    min-block-size: 2.75rem;
    padding: 0 var(--space-4);
    border-radius: var(--radius-md);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
  }
  .primary {
    border: none;
    background: var(--color-accent-default);
    color: var(--color-accent-on);
  }
  .primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .ghost {
    border: 1px solid var(--color-border-strong);
    background: transparent;
    color: var(--color-text-default);
  }
  .list {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    background: var(--color-bg-canvas);
  }
  .row .text {
    flex: 1;
  }
  .icon {
    min-inline-size: 2.75rem;
    min-block-size: 2.75rem;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    background: var(--color-bg-raised);
    color: var(--color-text-default);
    cursor: pointer;
  }
  .icon:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  code,
  .mono {
    font-family: var(--font-family-mono);
  }
`;
