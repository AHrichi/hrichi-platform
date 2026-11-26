import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Where a message is written: a text area that grows with what is typed,
 * and Send, which turns into Stop while an answer is on its way.
 *
 * Keyboard: Enter sends, Shift+Enter starts a new line, and Enter while an
 * input method is still composing (Arabic, Chinese…) only confirms the
 * composition. The text area is named by `label`; `hint` describes it.
 */
@Component({
  selector: 'ah-chat-composer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat-composer.html',
  styleUrl: './chat-composer.scss',
  host: { class: 'ah-chat-composer', '[class.is-busy]': 'busy()' },
})
export class ChatComposer {
  readonly label = input('Message');
  readonly placeholder = input('');
  readonly hint = input<string | null>(null);
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly maxLength = input(2000);
  readonly sendLabel = input('Send');
  readonly stopLabel = input('Stop');

  readonly send = output<string>();
  readonly stop = output<void>();

  private readonly field =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('field');
  protected readonly draft = signal('');
  protected readonly ready = computed(
    () => !this.disabled() && !this.busy() && this.draft().trim().length > 0,
  );
  protected readonly hintId = `ah-composer-${Math.random().toString(36).slice(2, 8)}`;

  /** Puts the caret in the text area. */
  focus(): void {
    this.field().nativeElement.focus();
  }

  protected key(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.submit();
  }

  protected submit(): void {
    if (!this.ready()) return;
    const text = this.draft().trim();
    this.draft.set('');
    this.field().nativeElement.value = '';
    this.send.emit(text);
  }
}
