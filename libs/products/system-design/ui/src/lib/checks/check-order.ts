import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { type Marked, markCheck } from '@ah/products/system-design/domain';
import { SdInlineText } from '../inline-text/inline-text';
import type { CheckAnswerEvent, OrderCheck } from './check-types';

/**
 * Deterministic starting order when `initialOrder` is not supplied: rotates
 * the items by one slot so the list never starts already solved yet renders
 * identically across test runs and Storybook snapshots.
 */
export function defaultScrambledOrder(items: readonly string[]): string[] {
  if (items.length <= 1) return [...items];
  return [...items.slice(1), items[0]];
}

/**
 * Sequence-ordering practice question (`sd-check-order`).
 * Keyboard-accessible up/down buttons reorder items without drag-and-drop.
 */
@Component({
  selector: 'sd-check-order',
  imports: [SdInlineText],
  templateUrl: './check-order.html',
  styleUrl: './check-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdCheckOrder {
  readonly check = input.required<OrderCheck>();
  readonly initialOrder = input<readonly string[] | null>(null);
  readonly initialSubmitted = input<boolean>(false);

  readonly answered = output<CheckAnswerEvent>();
  readonly reviewStep = output<string>();

  protected readonly currentItems = linkedSignal<string[]>(() => {
    const custom = this.initialOrder();
    return custom ? [...custom] : defaultScrambledOrder(this.check().items);
  });

  protected readonly result = linkedSignal<Marked | null>(() => {
    if (!this.initialSubmitted()) return null;
    const custom = this.initialOrder();
    const order = custom
      ? [...custom]
      : defaultScrambledOrder(this.check().items);
    return markCheck(this.check(), order);
  });

  protected move(index: number, delta: -1 | 1): void {
    if (this.result() !== null) return;
    const list = [...this.currentItems()];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    this.currentItems.set(list);
  }

  protected submit(): void {
    if (this.result() !== null) return;
    const order = this.currentItems();
    const marked = markCheck(this.check(), order);
    this.result.set(marked);
    this.answered.emit({
      checkId: this.check().id,
      response: order,
      ...marked,
    });
  }
}
