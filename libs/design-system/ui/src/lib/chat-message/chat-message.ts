import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/** Who a message is from: the reader, the assistant, or the app itself. */
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);

/**
 * Keeps a temperature's unit whole in right-to-left text: without an
 * isolate, Arabic shows "0 °C" as "C° 0". A model doesn't add one, so the
 * message does; in left-to-right text the isolate changes nothing.
 */
export function isolateUnits(text: string): string {
  return text.replace(
    /°\s?[CFK](?![A-Za-z])/g,
    (unit) => `${LRI}${unit}${PDI}`,
  );
}

export type ChatMessageFrom = 'user' | 'assistant' | 'notice';

/**
 * One message in a conversation, as plain text (never HTML: whatever a
 * model writes is shown, not run). The reader's messages sit on the
 * reading end, the assistant's on the start; a notice (an error, a
 * change made) spans the column. `typing` shows three dots, announced
 * once as `typingLabel`. Text in another script than the page reads in
 * its own direction (`dir="auto"`).
 */
@Component({
  selector: 'ah-chat-message',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bubble">
      @if (typing()) {
        <span class="dots" role="status" [attr.aria-label]="typingLabel()">
          <i></i><i></i><i></i>
        </span>
      } @else {
        <p class="text" dir="auto">{{ shown() }}</p>
      }
      @if (meta(); as meta) {
        <small class="meta" dir="auto">{{ meta }}</small>
      }
    </div>
  `,
  styleUrl: './chat-message.scss',
  host: {
    class: 'ah-chat-message',
    '[attr.data-from]': 'from()',
    '[attr.data-tone]': 'tone()',
  },
})
export class ChatMessage {
  readonly from = input<ChatMessageFrom>('assistant');
  readonly text = input('');
  /** A small line under the text: which model answered, a time. */
  readonly meta = input<string | null>(null);
  readonly tone = input<'default' | 'error'>('default');
  readonly typing = input(false);
  readonly typingLabel = input('Writing…');

  protected readonly shown = computed(() => isolateUnits(this.text()));
}
