import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { BlockOf, StackQueueState } from '@ah/products/studylm/lessons';

/** A stack grows upwards; a queue runs from its front on the left. */
@Component({
  selector: 'sl-stack-queue-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <div class="frame" [class.stack]="block().mode === 'stack'" dir="ltr">
      @if (block().mode !== 'stack') {
        <span class="end">front</span>
      }
      <ol class="items">
        @for (
          item of s.items;
          track $index;
          let last = $last;
          let first = $first
        ) {
          <li
            [class.touched]="
              s.last !== null &&
              s.last.op !== 'pop' &&
              s.last.op !== 'dequeue' &&
              s.last.op !== 'pop-back' &&
              ((s.last.end === 'back' && last) ||
                (s.last.end === 'front' && first))
            "
          >
            {{ item }}
          </li>
        } @empty {
          <li class="empty">empty</li>
        }
      </ol>
      <span class="end">{{ block().mode === 'stack' ? 'top' : 'back' }}</span>
    </div>
    @if (s.last; as last) {
      <p class="last">
        {{ last.op }}{{ last.value !== null ? ': ' + last.value : '' }}
      </p>
    }
  `,
  styles: `
    .frame {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }
    .items {
      display: flex;
      gap: var(--space-1);
      margin: 0;
      padding: var(--space-2);
      border: 2px solid var(--color-stage-border);
      border-radius: var(--radius-md);
      list-style: none;
    }
    .stack {
      flex-direction: column-reverse;
      .items {
        flex-direction: column-reverse;
        border-block-start: none;
        border-radius: 0 0 var(--radius-md) var(--radius-md);
      }
    }
    li {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-data-2) 30%, transparent);
      font-family: var(--font-family-mono);
      text-align: center;
    }
    .touched {
      outline: 2px solid var(--color-data-3);
    }
    .empty {
      background: none;
      color: var(--sl-muted);
    }
    .end,
    .last {
      color: var(--sl-muted);
      font-size: var(--font-size-100);
    }
    .last {
      margin: var(--space-2) 0 0;
      text-align: center;
      font-family: var(--font-family-mono);
    }
  `,
})
export class StackQueueView {
  readonly block = input.required<BlockOf<'stack-queue'>>();
  readonly state = input.required<StackQueueState>();
}
