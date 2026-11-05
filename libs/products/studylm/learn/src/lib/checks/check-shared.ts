import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';

/** A check's answer as saved in the learner's progress. */
export interface CheckRecord {
  answer: unknown;
  correct: boolean;
}

/** Right or not, the explanation, solution reveal, and another go. */
@Component({
  selector: 'sl-check-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="feedback" [class.right]="correct()" role="status">
      <div class="verdict-row">
        <span class="verdict-icon" aria-hidden="true">{{
          correct() ? '✓' : '✗'
        }}</span>
        <div class="verdict-text-group">
          <p class="verdict">
            @if (correct()) {
              @if (isTypo()) {
                Right! (Accepted typing variation)
              } @else {
                Right! Well done.
              }
            } @else if (askingAi()) {
              Evaluating with AI…
            } @else {
              Not quite yet.
            }
          </p>
          @if (correct() && isTypo()) {
            <span class="badge-typo" aria-label="Typo tolerated"
              >Typo Tolerated</span
            >
          }
        </div>
      </div>

      @if (aiFeedback(); as aiText) {
        <div class="ai-feedback-box" role="note">
          <div class="ai-feedback-header">
            <span class="ai-sparkle" aria-hidden="true">✨</span>
            <span class="ai-label">AI Answer Evaluation</span>
          </div>
          <p class="ai-text">{{ aiText }}</p>
        </div>
      }

      @if (explanation(); as text) {
        <div class="explanation-box">
          <p class="explanation-title">Why:</p>
          <p class="explanation-text">{{ text }}</p>
        </div>
      }

      @if (showingSolution()) {
        <div class="solution-panel" role="region" aria-label="Solution details">
          <div class="solution-panel-header">
            <span class="badge-solution" aria-hidden="true">💡</span>
            <span class="solution-badge-label">Solution & Key Takeaway</span>
          </div>
          @if (solution(); as sol) {
            <p class="solution-text">{{ sol }}</p>
          }
          <ng-content select="[solution]" />
        </div>
      }

      <ng-content />

      <div class="feedback-actions">
        @if (!correct()) {
          <button
            type="button"
            class="action-btn retry-btn"
            (click)="retry.emit()"
            aria-label="Try this check again"
          >
            ↺ Try again
          </button>
          @if (canAskAi() && !askingAi()) {
            <button
              type="button"
              class="action-btn ai-btn"
              (click)="askAi.emit()"
              aria-label="Check with AI for typing issues"
            >
              🤖 Check with AI for typos
            </button>
          }
          <button
            type="button"
            class="action-btn solution-btn"
            [class.active]="showingSolution()"
            (click)="toggleSolution()"
            [attr.aria-expanded]="showingSolution()"
          >
            {{ showingSolution() ? '▲ Hide Solution' : '💡 Show Solution' }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .feedback {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-4);
      border-inline-start: 4px solid var(--color-warning-default, #f59e0b);
      border-radius: var(--radius-md);
      background: var(--color-warning-subtle, rgba(245, 158, 11, 0.08));
      transition: all var(--motion-duration-fast, 150ms) ease;
    }
    .right {
      border-color: var(--color-success-default, #10b981);
      background: var(--color-success-subtle, rgba(16, 185, 129, 0.08));
    }
    p {
      margin: 0;
    }
    .verdict-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .verdict-icon {
      font-size: 1.25rem;
      font-weight: var(--font-weight-bold);
    }
    .verdict-text-group {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .verdict {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-200);
    }
    .badge-typo {
      font-size: 0.72rem;
      font-weight: var(--font-weight-bold);
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      background: rgba(16, 185, 129, 0.15);
      color: #065f46;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .ai-feedback-box {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: rgba(99, 102, 241, 0.07);
      border: 1px solid rgba(99, 102, 241, 0.25);
    }
    .ai-feedback-header {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    .ai-sparkle {
      font-size: 0.9rem;
    }
    .ai-label {
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      color: var(--color-accent-default, #6366f1);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ai-text {
      line-height: 1.5;
      font-size: var(--font-size-200);
    }
    .explanation-box {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: var(--color-bg-surface, rgba(255, 255, 255, 0.6));
      border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
    }
    .explanation-title {
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .explanation-text {
      line-height: 1.5;
      font-size: var(--font-size-200);
    }
    .solution-panel {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-3);
      border: 1px dashed var(--color-accent-default, #6366f1);
      border-radius: var(--radius-md);
      background: var(--color-accent-subtle, rgba(99, 102, 241, 0.08));
      animation: fadeIn 180ms ease;
    }
    .solution-panel-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .solution-badge-label {
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      color: var(--color-accent-default, #6366f1);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .solution-text {
      font-size: var(--font-size-200);
      line-height: 1.5;
    }
    .feedback-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
      margin-top: var(--space-1);
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-block-size: 2.5rem;
      padding: 0 var(--space-3);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--color-text-default);
      font: inherit;
      font-size: var(--font-size-200);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all var(--motion-duration-fast, 150ms) ease;
    }
    .action-btn:hover {
      background: var(--color-bg-raised, rgba(0, 0, 0, 0.04));
      border-color: var(--color-text-default);
    }
    .ai-btn {
      border-color: #8b5cf6;
      color: #6d28d9;
      background: rgba(139, 92, 246, 0.08);
    }
    .ai-btn:hover {
      background: #8b5cf6;
      color: #ffffff;
    }
    .solution-btn {
      border-color: var(--color-accent-default, #6366f1);
      color: var(--color-accent-default, #6366f1);
      background: var(--color-accent-subtle, rgba(99, 102, 241, 0.05));
    }
    .solution-btn:hover,
    .solution-btn.active {
      background: var(--color-accent-default, #6366f1);
      color: var(--color-accent-on, #ffffff);
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class CheckFeedback {
  readonly correct = input.required<boolean>();
  readonly explanation = input<string | null>(null);
  readonly solution = input<string | null>(null);
  readonly isTypo = input<boolean>(false);
  readonly aiFeedback = input<string | null>(null);
  readonly askingAi = input<boolean>(false);
  readonly canAskAi = input<boolean>(false);
  readonly solutionToggled = output<boolean>();
  readonly retry = output<void>();
  readonly askAi = output<void>();

  protected readonly showingSolution = signal(false);

  protected toggleSolution(): void {
    const next = !this.showingSolution();
    this.showingSolution.set(next);
    this.solutionToggled.emit(next);
  }
}

/** The look every check shares, so a lesson reads as one cohesive piece. */
export const CHECK_STYLES = `
  :host {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    background: var(--color-bg-surface);
    transition: border-color var(--motion-duration-fast, 150ms) ease;
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
    justify-content: space-between;
    gap: var(--space-2);
    min-block-size: 2.75rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--motion-duration-fast, 150ms) ease;
  }
  .option:hover:not(:disabled) {
    border-color: var(--color-accent-default);
  }
  .option-label-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
  }
  .option-correct {
    border-color: var(--color-success-default, #10b981) !important;
    background: var(--color-success-subtle, rgba(16, 185, 129, 0.1)) !important;
  }
  .option-wrong {
    border-color: var(--color-danger-default, #ef4444) !important;
    background: var(--color-danger-subtle, rgba(239, 68, 68, 0.1)) !important;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: var(--font-size-100);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-pill, 9999px);
    white-space: nowrap;
  }
  .badge-correct {
    background: var(--color-success-default, #10b981);
    color: #ffffff;
  }
  .badge-wrong {
    background: var(--color-danger-default, #ef4444);
    color: #ffffff;
  }
  .solution-details {
    display: grid;
    gap: var(--space-2);
  }
  .solution-title {
    margin: 0;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-default);
    font-size: var(--font-size-200);
  }
  .solution-list {
    margin: 0;
    padding-inline-start: var(--space-4);
    display: grid;
    gap: var(--space-1);
    font-size: var(--font-size-200);
  }
  .solution-code {
    white-space: pre;
    font-family: var(--font-family-mono);
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--color-stage-bg);
    color: var(--color-stage-text);
    overflow-x: auto;
  }
  .solution-callout {
    margin: 0;
    font-size: var(--font-size-200);
    line-height: 1.5;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: 2.75rem;
    padding: 0 var(--space-4);
    border-radius: var(--radius-md);
    font: inherit;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all var(--motion-duration-fast, 150ms) ease;
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
    transition: all var(--motion-duration-fast, 150ms) ease;
  }
  .row-correct {
    border-color: var(--color-success-default, #10b981) !important;
    background: var(--color-success-subtle, rgba(16, 185, 129, 0.06)) !important;
  }
  .row-wrong {
    border-color: var(--color-danger-default, #ef4444) !important;
    background: var(--color-danger-subtle, rgba(239, 68, 68, 0.06)) !important;
  }
  .row .text {
    flex: 1;
  }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
