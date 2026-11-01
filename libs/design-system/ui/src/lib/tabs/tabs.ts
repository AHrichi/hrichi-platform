import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  viewChildren,
} from '@angular/core';
import { isRtl } from '../direction';
import { ScrollHint } from '../scroll-hint/scroll-hint';

export interface TabItem<T extends string = string> {
  readonly id: T;
  readonly label: string;
  readonly icon?: string;
  readonly count?: number;
  readonly disabled?: boolean;
}

/**
 * Accessible WAI-ARIA tablist supporting arrow key navigation, badge counts,
 * icon adornments, and token-driven active indicators.
 */
@Component({
  selector: 'ah-tabs',
  imports: [ScrollHint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-tabs',
  },
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class Tabs<T extends string = string> {
  readonly tabs = input.required<readonly TabItem<T>[]>();
  readonly selectedId = model.required<T>();
  readonly ariaLabel = input<string>('Navigation Tabs');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tabButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  constructor() {
    // A row opened on a later tab (from a link, or a narrow phone) shows it.
    // Only the row scrolls, sideways, so the page never jumps.
    afterRenderEffect(() => {
      const index = this.tabs().findIndex((t) => t.id === this.selectedId());
      const button = this.tabButtons()[index]?.nativeElement;
      const row = button?.parentElement;
      if (!button || !row || row.scrollWidth <= row.clientWidth) return;
      const tab = button.getBoundingClientRect();
      const box = row.getBoundingClientRect();
      // Clear of the scroll hint's chevron on that edge.
      const edge = 32;
      const delta =
        tab.left < box.left
          ? tab.left - box.left - edge
          : Math.max(0, tab.right - box.right + edge);
      if (delta) row.scrollBy({ left: delta });
    });
  }

  selectTab(tab: TabItem<T>): void {
    if (tab.disabled) return;
    this.selectedId.set(tab.id);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const list = this.tabs();
    let nextIndex = currentIndex;

    // Right-to-left, the right arrow goes to the previous tab.
    const forward = isRtl(this.host.nativeElement) ? 'ArrowLeft' : 'ArrowRight';
    const back = forward === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === forward) {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % list.length;
    } else if (event.key === back) {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + list.length) % list.length;
    } else if (event.key === 'Home') {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      nextIndex = list.length - 1;
    } else {
      return;
    }

    const targetTab = list[nextIndex];
    if (targetTab && !targetTab.disabled) {
      this.selectedId.set(targetTab.id);
      this.tabButtons()[nextIndex]?.nativeElement.focus();
    }
  }
}
