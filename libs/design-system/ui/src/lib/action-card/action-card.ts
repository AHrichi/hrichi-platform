import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { AhButton } from '../button/button';

let nextId = 0;

/** Where a proposed action stands. */
export type ActionCardStatus = 'pending' | 'applied' | 'cancelled' | 'failed';

export interface ActionCardLabels {
  readonly apply: string;
  readonly cancel: string;
  readonly applied: string;
  readonly cancelled: string;
  readonly failed: string;
}

const ENGLISH: ActionCardLabels = {
  apply: 'Apply',
  cancel: 'Cancel',
  applied: 'Done',
  cancelled: 'Cancelled',
  failed: 'Didn’t work',
};

/**
 * Something about to change, waiting for the reader's go-ahead: what it is
 * (`heading`), what it will do (`lines`), and Apply / Cancel. Its words
 * come from the app, never from a model, so what is shown is what will
 * run. A `danger` card (deleting) is marked as such. Once decided, the
 * buttons give way to the outcome, announced to screen readers.
 */
@Component({
  selector: 'ah-action-card',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-card.html',
  styleUrl: './action-card.scss',
  host: {
    class: 'ah-action-card',
    role: 'group',
    '[attr.aria-labelledby]': 'id',
    '[attr.data-tone]': 'tone()',
    '[attr.data-status]': 'status()',
  },
})
export class ActionCard {
  readonly heading = input.required<string>();
  readonly lines = input<readonly string[]>([]);
  readonly tone = input<'default' | 'danger'>('default');
  readonly status = input<ActionCardStatus>('pending');
  /** Why it failed, when it did. */
  readonly detail = input<string | null>(null);
  readonly labels = input<ActionCardLabels>(ENGLISH);

  /** Apply was pressed. */
  readonly accept = output<void>();
  /** Cancel was pressed. */
  readonly decline = output<void>();

  protected readonly id = `ah-action-${nextId++}`;
}
