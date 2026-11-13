import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { AhButton } from '@ah/ui';

export interface SectionActionMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: 'refresh' | 'open';
  readonly disabled?: boolean;
  readonly action: () => void;
}

let nextMenuId = 0;

function isRtlElement(el: HTMLElement): boolean {
  const dir = el.closest('[dir]')?.getAttribute('dir');
  if (dir === 'rtl' || dir === 'ltr') return dir === 'rtl';
  return el.ownerDocument.defaultView?.getComputedStyle(el).direction === 'rtl';
}

/**
 * Overflow menu for secondary section maintenance actions (rewrite/regenerate).
 * Opens in the top layer (`popover="manual"`) so collapsible card bodies with
 * `overflow: hidden` never clip it.
 */
@Component({
  selector: 'studylm-section-actions-menu',
  standalone: true,
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'section-actions-menu-host',
    '(document:click)': 'onDocumentClick($event)',
  },
  templateUrl: './section-actions-menu.html',
  styleUrl: './section-actions-menu.scss',
})
export class SectionActionsMenuComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly items = input.required<readonly SectionActionMenuItem[]>();
  readonly label = input.required<string>();

  protected readonly menuId = `studylm-section-menu-${++nextMenuId}`;
  protected readonly isOpen = signal(false);
  protected readonly focusedIndex = signal(0);
  protected readonly placement = signal<Record<string, string>>({});

  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly popover = viewChild<ElementRef<HTMLElement>>('popover');
  private readonly menuItems =
    viewChildren<ElementRef<HTMLButtonElement>>('menuItem');

  private pendingFocusIndex: number | null = null;

  constructor() {
    const reposition = () => this.isOpen() && this.place();
    const win = this.elementRef.nativeElement.ownerDocument.defaultView;
    win?.addEventListener('resize', reposition);
    win?.addEventListener('scroll', reposition, true);
    inject(DestroyRef).onDestroy(() => {
      win?.removeEventListener('resize', reposition);
      win?.removeEventListener('scroll', reposition, true);
    });

    afterRenderEffect({
      write: () => {
        const popoverEl = this.popover()?.nativeElement;
        if (!popoverEl || !this.isOpen()) return;
        if (
          typeof popoverEl.showPopover === 'function' &&
          !popoverEl.matches(':popover-open')
        ) {
          popoverEl.showPopover();
        }
        if (this.pendingFocusIndex !== null) {
          const target =
            this.menuItems()[this.pendingFocusIndex]?.nativeElement;
          this.pendingFocusIndex = null;
          if (target) {
            target.focus();
          } else {
            popoverEl.focus();
          }
        }
      },
    });
  }

  protected toggle(): void {
    if (this.isOpen()) {
      this.close(false);
    } else {
      this.open('first');
    }
  }

  protected open(focusTarget: 'first' | 'last'): void {
    const idx =
      focusTarget === 'last'
        ? this.nextEnabled(this.items().length, -1)
        : this.nextEnabled(-1, 1);
    const startIdx = idx >= 0 ? idx : 0;
    this.focusedIndex.set(startIdx);
    this.pendingFocusIndex = idx >= 0 ? idx : -1;
    this.place();
    this.isOpen.set(true);
  }

  protected close(restoreFocus: boolean): void {
    const popoverEl = this.popover()?.nativeElement;
    if (
      popoverEl &&
      typeof popoverEl.hidePopover === 'function' &&
      popoverEl.matches(':popover-open')
    ) {
      popoverEl.hidePopover();
    }
    this.pendingFocusIndex = null;
    this.isOpen.set(false);
    if (restoreFocus) {
      this.trigger().nativeElement.focus();
    }
  }

  protected select(item: SectionActionMenuItem): void {
    if (item.disabled) return;
    this.close(true);
    item.action();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
      return;
    }
    if (this.isOpen()) return;
    if (
      event.key === 'ArrowDown' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      this.open('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.open('last');
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.items();
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = this.nextEnabledWrapped(this.focusedIndex(), 1);
        if (next >= 0) this.focusItem(next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = this.nextEnabledWrapped(this.focusedIndex(), -1);
        if (prev >= 0) this.focusItem(prev);
        break;
      }
      case 'Home': {
        event.preventDefault();
        const first = this.nextEnabled(-1, 1);
        if (first >= 0) this.focusItem(first);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = this.nextEnabled(items.length, -1);
        if (last >= 0) this.focusItem(last);
        break;
      }
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
        break;
      case 'Tab':
        this.close(false);
        break;
    }
  }

  private focusItem(index: number): void {
    this.focusedIndex.set(index);
    this.menuItems()[index]?.nativeElement.focus();
  }

  private nextEnabled(from: number, step: 1 | -1): number {
    const list = this.items();
    for (let i = from + step; i >= 0 && i < list.length; i += step) {
      if (!list[i].disabled) return i;
    }
    return -1;
  }

  private nextEnabledWrapped(from: number, step: 1 | -1): number {
    const list = this.items();
    if (!list.length) return -1;
    for (let n = 1; n <= list.length; n++) {
      const idx = (from + step * n + list.length) % list.length;
      if (!list[idx].disabled) return idx;
    }
    return -1;
  }

  private place(): void {
    const triggerEl = this.trigger().nativeElement;
    const view = triggerEl.ownerDocument.defaultView;
    if (!view || typeof triggerEl.getBoundingClientRect !== 'function') return;
    const rect = triggerEl.getBoundingClientRect();
    const gap = 4;
    const roomBelow = view.innerHeight - rect.bottom;
    const above = roomBelow < 180 && rect.top > roomBelow;
    const rtl = isRtlElement(this.elementRef.nativeElement);
    this.placement.set({
      ...(above
        ? { bottom: `${view.innerHeight - rect.top + gap}px` }
        : { top: `${rect.bottom + gap}px` }),
      ...(rtl
        ? { left: `${Math.max(8, rect.left)}px` }
        : { right: `${Math.max(8, view.innerWidth - rect.right)}px` }),
    });
  }
}
