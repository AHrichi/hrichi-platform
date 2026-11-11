import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type { CaptureItem } from '@ah/learning/contracts';
import { AhButton, type ButtonVariant } from '@ah/ui';
import { LearningClient } from './learning-client';

/**
 * "Learn this" (design §9): sends one or more ideas to the Learning
 * Engine's inbox, where they become concepts for the daily set. Host apps
 * pass the text and where it came from; the label is theirs to translate.
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
      [disabled]="!sendable()"
      (click)="send()"
    >
      <span aria-hidden="true">✦</span> {{ label() }}
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
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<'md' | 'sm'>('sm');
  /** After the hand-off, e.g. to say "Sent to your inbox". */
  readonly sent = output<number>();

  private readonly client = inject(LearningClient);
  protected readonly sendable = computed(() =>
    this.items().some((item) => item.text.trim()),
  );

  protected send(): void {
    this.client.capture(this.items());
    this.sent.emit(this.items().length);
  }
}
