import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

let nextModalId = 0;

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Accessible modal dialog with backdrop, focus trapping, Escape key support,
 * and customizable sizing.
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

  readonly closed = output<void>();

  protected readonly titleId = `ah-modal-title-${++nextModalId}`;
  protected readonly dialogRef =
    viewChild<ElementRef<HTMLElement>>('dialogRef');

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop()) {
      event.stopPropagation();
      this.close();
    }
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
  }
}
