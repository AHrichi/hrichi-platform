import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';

let nextTruncateId = 0;

export type TruncatePosition = 'top' | 'bottom';

/**
 * Accessible responsive truncated text container with interactive hover/tap tooltip popover.
 * Adheres to WCAG 2.5.5 touch target & WCAG 1.4.13 dismissible pointer-hover rules.
 */
@Component({
  selector: 'ah-truncated-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-truncated-text-host',
    '[class.ah-truncated-text--open]': 'isOpen()',
    '[attr.tabindex]': 'interactive() ? 0 : null',
    '[attr.role]': "interactive() ? 'button' : null",
    '[attr.aria-expanded]': 'interactive() ? isOpen() : null',
    '[attr.aria-describedby]': 'isOpen() ? tooltipId : null',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(click)': 'onClick($event)',
    '(keydown.escape)': 'close()',
    '(keydown.enter)': 'toggle()',
    '(keydown.space)': 'toggle()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()',
  },
  templateUrl: './truncated-text.html',
  styleUrl: './truncated-text.scss',
})
export class TruncatedText {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly text = input.required<string>();
  readonly lines = input<number>(1);
  readonly maxWidth = input<string>('100%');
  readonly position = input<TruncatePosition>('top');
  readonly interactive = input<boolean>(true);
  readonly tooltipTitle = input<string>();

  protected readonly tooltipId = `ah-truncate-${++nextTruncateId}`;
  protected readonly isOpen = signal<boolean>(false);

  protected onMouseEnter(): void {
    if (this.interactive()) this.isOpen.set(true);
  }

  protected onMouseLeave(): void {
    if (this.interactive()) this.isOpen.set(false);
  }

  protected onFocusIn(): void {
    if (this.interactive()) this.isOpen.set(true);
  }

  protected onFocusOut(): void {
    if (this.interactive()) this.isOpen.set(false);
  }

  protected onClick(event: MouseEvent): void {
    if (!this.interactive()) return;
    event.stopPropagation();
    this.isOpen.update((open) => !open);
  }

  protected toggle(): void {
    if (this.interactive()) {
      this.isOpen.update((open) => !open);
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
