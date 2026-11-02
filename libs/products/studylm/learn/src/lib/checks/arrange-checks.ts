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
        <li class="row">
          <span class="text">{{ item.text }}</span>
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
        (retry)="result.set(null)"
      />
    }
  `,
  styles: CHECK_STYLES,
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
        <li class="row">
          <label class="text" [for]="b.id + '-' + item.id">{{
            item.text
          }}</label>
          <select
            [id]="b.id + '-' + item.id"
            [disabled]="result() !== null"
            (change)="place(item.id, $any($event.target).value)"
          >
            <option value="" [selected]="!placed()[item.id]">Choose…</option>
            @for (category of b.categories; track category.id) {
              <option
                [value]="category.id"
                [selected]="placed()[item.id] === category.id"
              >
                {{ category.label }}
              </option>
            }
          </select>
          @if (result() !== null) {
            <span
              [attr.aria-label]="
                placed()[item.id] === item.category ? 'right' : 'wrong'
              "
            >
              {{ placed()[item.id] === item.category ? '✓' : '✗' }}
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
        (retry)="result.set(null)"
      />
    }
  `,
  styles: CHECK_STYLES,
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
  protected readonly complete = computed(() =>
    this.block().items.every((item) => this.placed()[item.id]),
  );

  protected place(item: string, category: string): void {
    this.placed.update((placed) => ({ ...placed, [item]: category }));
  }

  protected submit(): void {
    const answer = this.placed();
    const correct = markCategorize(this.block(), answer);
    this.result.set(correct);
    this.answered.emit({ answer, correct });
  }
}
