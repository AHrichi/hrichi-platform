import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChildren,
} from '@angular/core';

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

  private readonly tabButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  selectTab(tab: TabItem<T>): void {
    if (tab.disabled) return;
    this.selectedId.set(tab.id);
  }

  protected onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const list = this.tabs();
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % list.length;
    } else if (event.key === 'ArrowLeft') {
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
