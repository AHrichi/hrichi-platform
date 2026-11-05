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
import { CHECK_STYLES, CheckFeedback, type CheckRecord } from './check-shared';
import { markCategorize, markOrder, shuffled } from './marking';

/** Put steps in order with the arrow buttons, which work from the keyboard. */
@Component({
  selector: 'sl-order-steps',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Put in order</p>
    <p class="question" [id]="b.id + '-q'">{{ b.prompt }}</p>
    <ol class="list" [attr.aria-labelledby]="b.id + '-q'">
      @for (
        item of items();
        track item.id;
        let first = $first;
        let last = $last
      ) {
        @let isCorrect = result() !== null && b.items[$index].id === item.id;
        <li
          class="row"
          [class.row-correct]="result() !== null && isCorrect"
          [class.row-wrong]="result() !== null && !isCorrect"
        >
          <span class="step-num">{{ $index + 1 }}.</span>
          <span class="text">{{ item.text }}</span>
          @if (result() !== null) {
            <span
              class="badge"
              [class.badge-correct]="isCorrect"
              [class.badge-wrong]="!isCorrect"
              [attr.aria-label]="
                isCorrect ? 'Correct position' : 'Misplaced step'
              "
            >
              {{ isCorrect ? '✓' : '✗' }}
            </span>
          }
          <button
            type="button"
            class="icon"
            (click)="move($index, -1)"
            [disabled]="first || result() !== null"
            [attr.aria-label]="'Move up: ' + item.text"
          >
            ↑
          </button>
          <button
            type="button"
            class="icon"
            (click)="move($index, 1)"
            [disabled]="last || result() !== null"
            [attr.aria-label]="'Move down: ' + item.text"
          >
            ↓
          </button>
        </li>
      }
    </ol>
    @if (result() === null) {
      <div class="actions">
        <button type="button" class="primary" (click)="submit()">Check</button>
      </div>
    } @else {
      <sl-check-feedback
        [correct]="result() === true"
        [explanation]="b.explanation"
        (solutionToggled)="showingSolution.set($event)"
        (retry)="retry()"
      >
        <div solution class="solution-details">
          <p class="solution-title"><strong>Correct Step Order:</strong></p>
          <ol class="solution-list">
            @for (item of b.items; track item.id) {
              <li>{{ item.text }}</li>
            }
          </ol>
        </div>
      </sl-check-feedback>
    }
  `,
  styles: [
    CHECK_STYLES,
    `
      .step-num {
        font-weight: var(--font-weight-bold);
        color: var(--color-text-muted);
        min-inline-size: 1.5rem;
      }
    `,
  ],
})
export class OrderStepsCheck {
  readonly block = input.required<BlockOf<'order-steps'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  protected readonly items = linkedSignal(() => {
    const block = this.block();
    const saved = this.saved()?.answer as string[] | undefined;
    const byId = new Map(block.items.map((item) => [item.id, item]));
    return saved?.every((id) => byId.has(id))
      ? saved.map((id) => byId.get(id) as (typeof block.items)[number])
      : shuffled(block.items, block.id);
  });
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );
  protected readonly showingSolution = signal(false);

  protected move(index: number, by: number): void {
    this.items.update((items) => {
      const next = [...items];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  protected submit(): void {
    const answer = this.items().map((item) => item.id);
    const correct = markOrder(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }

  protected retry(): void {
    this.showingSolution.set(false);
    this.result.set(null);
  }
}

/** Sort each item into a category. */
@Component({
  selector: 'sl-categorize',
  imports: [CheckFeedback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let b = block();
    <p class="kind">Sort into groups</p>
    <p class="question">{{ b.prompt }}</p>
    <ul class="list">
      @for (item of items(); track item.id) {
        @let placedCat = placed()[item.id];
        @let isEvaluated = result() !== null;
        @let isRight = placedCat === item.category;
        <li
          class="row"
          [class.row-correct]="isEvaluated && isRight"
          [class.row-wrong]="isEvaluated && !isRight"
        >
          <label class="text" [for]="b.id + '-' + item.id">{{
            item.text
          }}</label>
          <select
            [id]="b.id + '-' + item.id"
            [disabled]="result() !== null"
            (change)="place(item.id, $any($event.target).value)"
          >
            <option value="" [selected]="!placedCat">Choose category…</option>
            @for (category of b.categories; track category.id) {
              <option
                [value]="category.id"
                [selected]="placedCat === category.id"
              >
                {{ category.label }}
              </option>
            }
          </select>
          @if (isEvaluated) {
            <span
              class="badge"
              [class.badge-correct]="isRight"
              [class.badge-wrong]="!isRight"
            >
              @if (isRight) {
                ✓ {{ categoryLabel(item.category) }}
              } @else {
                ✗ Belongs to: {{ categoryLabel(item.category) }}
              }
            </span>
          }
        </li>
      }
    </ul>
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
        (solutionToggled)="showingSolution.set($event)"
        (retry)="retry()"
      >
        <div solution class="solution-details">
          <p class="solution-title">
            <strong>Correct Category Groupings:</strong>
          </p>
          <div class="category-groups-grid">
            @for (cat of b.categories; track cat.id) {
              <div class="category-card">
                <p class="category-card-title">
                  <strong>{{ cat.label }}:</strong>
                </p>
                <ul class="solution-list">
                  @for (it of itemsForCategory(cat.id); track it.id) {
                    <li>{{ it.text }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      </sl-check-feedback>
    }
  `,
  styles: [
    CHECK_STYLES,
    `
      .category-groups-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: var(--space-3);
        margin-top: var(--space-2);
      }
      .category-card {
        padding: var(--space-2) var(--space-3);
        border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.08));
        border-radius: var(--radius-sm);
        background: var(--color-bg-surface);
      }
      .category-card-title {
        margin: 0 0 var(--space-1);
        color: var(--color-accent-default);
        font-size: var(--font-size-200);
      }
    `,
  ],
})
export class CategorizeCheck {
  readonly block = input.required<BlockOf<'categorize'>>();
  readonly saved = input<CheckRecord | null>(null);
  readonly answered = output<CheckRecord>();

  protected readonly items = computed(() =>
    shuffled(this.block().items, this.block().id),
  );
  protected readonly placed = linkedSignal<Record<string, string>>(
    () => (this.saved()?.answer as Record<string, string> | undefined) ?? {},
  );
  protected readonly result = linkedSignal<boolean | null>(
    () => this.saved()?.correct ?? null,
  );
  protected readonly showingSolution = signal(false);
  protected readonly complete = computed(() =>
    this.block().items.every((item) => this.placed()[item.id]),
  );

  protected categoryLabel(catId: string): string {
    return this.block().categories.find((c) => c.id === catId)?.label ?? catId;
  }

  protected itemsForCategory(catId: string): BlockOf<'categorize'>['items'] {
    return this.block().items.filter((item) => item.category === catId);
  }

  protected place(item: string, category: string): void {
    this.placed.update((placed) => ({ ...placed, [item]: category }));
  }

  protected submit(): void {
    const answer = this.placed();
    const correct = markCategorize(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }

  protected retry(): void {
    this.showingSolution.set(false);
    this.result.set(null);
  }
}
