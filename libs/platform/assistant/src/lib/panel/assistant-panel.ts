import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { ActionCard, ChatComposer, ChatMessage } from '@ah/ui';
import { AssistantService } from '../assistant.service';

let nextId = 0;

/**
 * The assistant's conversation: messages, the cards waiting for Apply,
 * the notes (with Undo), and where to write. On a wide screen it is a
 * side sheet beside the app, not modal, so the reader watches the app
 * change; on a phone it fills the screen as a modal dialog. Escape and
 * Close shut it, and focus goes back to what opened it.
 *
 * The app passes the greeting, a few suggestions, the privacy line under
 * the composer and its placeholder, in the reader's language; the
 * panel's own words come with it, in five languages.
 */
@Component({
  selector: 'ah-assistant-panel',
  imports: [ActionCard, ChatComposer, ChatMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // A side sheet isn't modal, so the browser leaves Escape to us.
  host: { '(keydown.escape)': 'close()' },
  templateUrl: './assistant-panel.html',
  styleUrl: './assistant-panel.scss',
})
export class AssistantPanel {
  readonly open = model(false);
  readonly greeting = input('');
  readonly suggestions = input<readonly string[]>([]);
  /** Under the composer: where messages go. */
  readonly privacy = input<string | null>(null);
  readonly placeholder = input('');

  protected readonly assistant = inject(AssistantService);
  protected readonly copy = this.assistant.copy;
  protected readonly id = `ah-assistant-${nextId++}`;
  protected readonly waiting = computed(() =>
    this.assistant
      .entries()
      .some((entry) => entry.kind === 'action' && entry.status === 'pending'),
  );
  protected readonly labels = computed(() => {
    const copy = this.copy();
    return {
      apply: copy.apply,
      cancel: copy.cancel,
      applied: copy.applied,
      cancelled: copy.cancelled,
      failed: copy.failed,
    };
  });

  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly log = viewChild.required<ElementRef<HTMLElement>>('log');
  private readonly composer = viewChild.required(ChatComposer);
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.hide()));
    });
    // New messages scroll into view.
    effect(() => {
      this.assistant.entries();
      this.assistant.busy();
      untracked(() => setTimeout(() => this.scrollDown()));
    });
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  protected close(): void {
    this.open.set(false);
  }

  protected ask(text: string): void {
    void this.assistant.send(text);
  }

  /** The dialog closed itself (Escape on a modal one). */
  protected closed(): void {
    if (this.open()) this.open.set(false);
    else this.restoreFocus();
  }

  private show(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open) return;
    this.opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const wide =
      typeof matchMedia === 'function' &&
      matchMedia('(min-width: 48rem)').matches;
    dialog.classList.toggle('is-sheet', !wide);
    try {
      if (wide) dialog.show();
      else dialog.showModal();
    } catch {
      dialog.setAttribute('open', '');
    }
    setTimeout(() => {
      this.composer().focus();
      this.scrollDown();
    });
  }

  private hide(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) return;
    try {
      dialog.close();
    } catch {
      dialog.removeAttribute('open');
    }
    this.restoreFocus();
  }

  private restoreFocus(): void {
    const opener = this.opener;
    this.opener = null;
    if (opener?.isConnected) opener.focus();
  }

  private scrollDown(): void {
    const log = this.log().nativeElement;
    log.scrollTop = log.scrollHeight;
  }
}
