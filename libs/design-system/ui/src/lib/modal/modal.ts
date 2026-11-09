import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

let nextModalId = 0;
/** Open modals across the page, so the scroll lock lifts with the last one. */
let openModals = 0;

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

/**
 * Modal dialog on the native `<dialog>` element, opened with `showModal()`.
 *
 * The browser provides the accessibility contract: the page behind becomes
 * inert, focus stays inside, Escape fires `cancel`, and the dialog sits in the
 * top layer (above every z-index, never clipped). On top of that the modal:
 * - focuses the first field in the body (else the dialog itself) on open,
 * - returns focus to whatever opened it on close,
 * - locks page scroll while any modal is open,
 * - closes on a backdrop click when `closeOnBackdrop` is set.
 *
 * The content is only rendered while open, as before.
 */
@Component({
  selector: 'ah-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  readonly open = model<boolean>(false);
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly size = input<ModalSize>('md');
  readonly closeOnBackdrop = input<boolean>(true);
  /** The close button's accessible name, in the page's language. */
  readonly closeLabel = input<string>('Close dialog');

  readonly closed = output<void>();

  protected readonly titleId = `ah-modal-title-${++nextModalId}`;
  private readonly dialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly document = inject(DOCUMENT);
  private returnFocusTo: HTMLElement | null = null;
  private locked = false;

  constructor() {
    // A modal destroyed while open must not leave the page locked.
    inject(DestroyRef).onDestroy(() => this.lockScroll(false));
    afterRenderEffect({
      write: () => {
        const dialog = this.dialogRef().nativeElement;
        if (this.open() && !dialog.open) {
          this.show(dialog);
        } else if (!this.open() && dialog.open) {
          this.hide(dialog);
        }
      },
    });
  }

  close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  /** Escape: close through the component so `open` and `closed` stay true. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  /** A click on the dialog element itself (not its surface) is the backdrop. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) {
      if (this.closeOnBackdrop()) this.close();
    }
  }

  private show(dialog: HTMLDialogElement): void {
    const active = this.document.activeElement;
    this.returnFocusTo = active instanceof HTMLElement ? active : null;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    this.lockScroll(true);
    const body = dialog.querySelector<HTMLElement>('.ah-modal-body');
    const first = body?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog).focus();
  }

  private hide(dialog: HTMLDialogElement): void {
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
    this.lockScroll(false);
    if (this.returnFocusTo?.isConnected) {
      this.returnFocusTo.focus();
    }
    this.returnFocusTo = null;
  }

  private lockScroll(lock: boolean): void {
    if (lock === this.locked) return;
    this.locked = lock;
    openModals += lock ? 1 : -1;
    this.document.documentElement.classList.toggle(
      'ah-scroll-locked',
      openModals > 0,
    );
  }
}
