import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { CaptureItem, HostCaptureItem } from '@ah/learning/contracts';
import { AhButton, type ButtonVariant } from '@ah/ui';
import { LearningClient } from './learning-client';
import { LearningLink } from './learning-link';

/**
 * "Learn this" (design §9): sends one or more ideas to the Learning
 * Engine, where they become concepts for the daily set. Host apps pass the
 * text and where it came from; the labels are theirs to translate.
 *
 * A linked host sends through the engine's API and stays on the page; the
 * button then says the cards are in the reviews. Otherwise it hands the
 * ideas to the learning app's inbox in a new tab.
 */
@Component({
  selector: 'ah-learn-this',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [ahButton]="variant()"
      [size]="size()"
      [disabled]="!sendable() || allSent()"
      (click)="send()"
    >
      <span aria-hidden="true">{{ allSent() ? '✓' : '✦' }}</span>
      {{ allSent() ? sentLabel() : label() }}
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }
  `,
})
export class LearnThis {
  readonly items = input.required<readonly CaptureItem[]>();
  readonly label = input('Learn this');
  /** Shown once a linked host has sent every item. */
  readonly sentLabel = input('In your reviews');
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<'md' | 'sm'>('sm');
  /** After the hand-off, e.g. to say "Sent to your inbox". */
  readonly sent = output<number>();

  private readonly client = inject(LearningClient);
  private readonly link = inject(LearningLink);
  protected readonly sendable = computed(() =>
    this.items().some((item) => item.text.trim()),
  );
  /** Every item has a source: the link needs it as the card's identity. */
  private readonly linkable = computed(
    () =>
      this.link.linked() && this.items().every((item) => item.source !== null),
  );
  protected readonly allSent = computed(
    () =>
      this.linkable() &&
      this.items().every((item) =>
        this.link.isSent(
          item.source?.objectType ?? '',
          item.source?.objectId ?? '',
        ),
      ),
  );

  protected send(): void {
    if (this.linkable()) {
      this.link.send(this.items() as readonly HostCaptureItem[]);
    } else {
      this.client.capture(this.items());
    }
    this.sent.emit(this.items().length);
  }
}
