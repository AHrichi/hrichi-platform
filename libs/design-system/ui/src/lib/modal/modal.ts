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
  template: `
    @if (open()) {
      <div
        class="ah-modal-backdrop"
        (click)="onBackdropClick($event)"
        aria-hidden="true"
      ></div>

      <div
        class="ah-modal-dialog"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [class.ah-modal--sm]="size() === 'sm'"
        [class.ah-modal--md]="size() === 'md'"
        [class.ah-modal--lg]="size() === 'lg'"
        [class.ah-modal--xl]="size() === 'xl'"
        #dialogRef
      >
        <div class="ah-modal-header">
          <div class="ah-modal-title-wrap">
            @if (eyebrow()) {
              <p class="ah-eyebrow">{{ eyebrow() }}</p>
            }
            <h2 [id]="titleId" class="ah-modal-title">{{ title() }}</h2>
          </div>

          <button
            type="button"
            class="ah-modal-close-btn"
            aria-label="Close dialog"
            (click)="close()"
          >
            ✕
          </button>
        </div>

        <div class="ah-modal-body">
          <ng-content />
        </div>

        <div class="ah-modal-footer">
          <ng-content select="[modal-actions]" />
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: contents;
    }

    .ah-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 15, 18, 0.72);
      backdrop-filter: blur(4px);
      z-index: 9998;
      animation: ah-fade-in var(--motion-duration-fast) ease-out;
    }

    .ah-modal-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      max-block-size: min(90vh, 52rem);
      inline-size: min(92vw, 36rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-raised);
      overflow: hidden;
      animation: ah-modal-pop var(--motion-duration-base)
        var(--motion-easing-standard);
    }

    .ah-modal--sm {
      inline-size: min(92vw, 24rem);
    }

    .ah-modal--md {
      inline-size: min(92vw, 36rem);
    }

    .ah-modal--lg {
      inline-size: min(94vw, 48rem);
    }

    .ah-modal--xl {
      inline-size: min(96vw, 64rem);
    }

    .ah-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-5);
      border-block-end: 1px solid var(--color-border-default);
      background: var(--color-bg-raised);
    }

    .ah-modal-title-wrap {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .ah-modal-title {
      margin: 0;
      font-size: var(--font-size-400);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-default);
      line-height: var(--font-line-height-snug);
    }

    .ah-modal-close-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 2rem;
      block-size: 2rem;
      padding: 0;
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      background: var(--color-bg-surface);
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 0.9rem;
      transition: all var(--motion-duration-fast) ease;
    }

    .ah-modal-close-btn:hover {
      background: var(--color-bg-surface);
      color: var(--color-text-default);
      border-color: var(--color-border-strong);
    }

    .ah-modal-close-btn:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }

    .ah-modal-body {
      padding: var(--space-5);
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .ah-modal-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--space-3);
      padding-block: var(--space-4);
      padding-inline: var(--space-5);
      border-block-start: 1px solid var(--color-border-default);
      background: var(--color-bg-raised);
    }

    .ah-modal-footer:empty {
      display: none;
    }

    @keyframes ah-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes ah-modal-pop {
      from {
        opacity: 0;
        transform: translate(-50%, -46%) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  `,
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
