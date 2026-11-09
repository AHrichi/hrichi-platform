import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { isRtl } from '../direction';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  hint?: string;
}

export type SelectSize = 'sm' | 'md' | 'lg';

let nextSelectId = 0;
const TYPEAHEAD_RESET_MS = 500;

/**
 * Single-select dropdown on the WAI-ARIA 1.2 select-only combobox pattern.
 *
 * - The trigger keeps focus; the active option is announced through
 *   `aria-activedescendant`.
 * - Arrow keys skip disabled options; Home/End; typeahead by first letters.
 * - The list opens in the top layer (Popover API) at fixed coordinates, so a
 *   modal or a scrolling container never clips it; it flips above the trigger
 *   when there's no room below, and aligns to the inline start in RTL.
 * - Escape closes the list without also closing a surrounding dialog.
 * - Works as a Signal Forms control (`[formField]`): value, disabled,
 *   required, invalid and touched.
 */
@Component({
  selector: 'ah-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-select-host',
    '[class.ah-select--sm]': "size() === 'sm'",
    '[class.ah-select--md]': "size() === 'md'",
    '[class.ah-select--lg]': "size() === 'lg'",
    '[class.ah-select--open]': 'isOpen()',
    '[class.ah-select--disabled]': 'disabled()',
    '[class.ah-select--invalid]': 'invalid()',
    '(document:click)': 'onDocumentClick($event)',
  },
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select<T = string> implements FormValueControl<T | null> {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input.required<readonly SelectOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly placeholder = input<string>('Select an option...');
  readonly label = input<string>();
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  readonly touched = model<boolean>(false);
  readonly size = input<SelectSize>('md');

  protected readonly selectId = `ah-select-${++nextSelectId}`;
  protected readonly listboxId = `${this.selectId}-listbox`;

  protected readonly isOpen = signal<boolean>(false);
  protected readonly activeIndex = signal<number>(-1);
  /** Fixed-position coordinates of the list while open. */
  protected readonly placement = signal<Record<string, string>>({});

  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly popover = viewChild<ElementRef<HTMLElement>>('popover');

  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly selectedOption = computed(() => {
    const val = this.value();
    if (val === null || val === undefined) return null;
    return this.options().find((opt) => opt.value === val) ?? null;
  });

  protected readonly activeDescendant = computed(() =>
    this.isOpen() && this.activeIndex() >= 0
      ? this.optionId(this.activeIndex())
      : null,
  );

  constructor() {
    const reposition = () => this.isOpen() && this.place();
    const win = this.elementRef.nativeElement.ownerDocument.defaultView;
    win?.addEventListener('resize', reposition);
    win?.addEventListener('scroll', reposition, true);
    inject(DestroyRef).onDestroy(() => {
      win?.removeEventListener('resize', reposition);
      win?.removeEventListener('scroll', reposition, true);
      clearTimeout(this.typeaheadTimer);
    });

    // Put the list in the top layer when it renders, and keep the active
    // option visible while arrowing through a long list.
    afterRenderEffect({
      write: () => {
        const popover = this.popover()?.nativeElement;
        if (popover && this.isOpen()) {
          if (
            typeof popover.showPopover === 'function' &&
            !popover.matches(':popover-open')
          ) {
            popover.showPopover();
          }
          const active = popover.ownerDocument.getElementById(
            this.optionId(this.activeIndex()),
          );
          active?.scrollIntoView?.({ block: 'nearest' });
        }
      },
    });
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    if (this.disabled()) return;
    const selectedIdx = this.options().findIndex(
      (opt) => opt.value === this.value() && !opt.disabled,
    );
    this.activeIndex.set(
      selectedIdx >= 0 ? selectedIdx : this.nextEnabled(-1, 1),
    );
    this.place();
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectOption(option: SelectOption<T>): void {
    if (option.disabled || this.disabled()) return;
    this.value.set(option.value);
    this.close();
    this.trigger().nativeElement.focus();
  }

  protected onBlur(): void {
    this.touched.set(true);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    if (!this.isOpen()) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.open();
      } else if (this.isPrintable(event)) {
        this.open();
        this.onTypeahead(event.key);
      }
      return;
    }

    const opts = this.options();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set(this.nextEnabled(this.activeIndex(), 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set(this.nextEnabled(this.activeIndex(), -1));
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(this.nextEnabled(-1, 1));
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(this.nextEnabled(opts.length, -1));
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = opts[this.activeIndex()];
        if (active && !active.disabled) {
          this.selectOption(active);
        }
        break;
      }
      case 'Escape':
        // Close the list only: don't let a surrounding <dialog> see it.
        event.preventDefault();
        event.stopPropagation();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
      default:
        if (this.isPrintable(event)) {
          this.onTypeahead(event.key);
        }
    }
  }

  /** The next enabled option from `from` in `step` direction, or `from`. */
  private nextEnabled(from: number, step: 1 | -1): number {
    const opts = this.options();
    for (let i = from + step; i >= 0 && i < opts.length; i += step) {
      if (!opts[i].disabled) return i;
    }
    return from >= 0 && from < opts.length ? from : -1;
  }

  private isPrintable(event: KeyboardEvent): boolean {
    return (
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    );
  }

  /** Jump to the first enabled option whose label starts with what was typed. */
  private onTypeahead(key: string): void {
    clearTimeout(this.typeaheadTimer);
    this.typeahead += key.toLowerCase();
    this.typeaheadTimer = setTimeout(
      () => (this.typeahead = ''),
      TYPEAHEAD_RESET_MS,
    );
    const opts = this.options();
    const start = this.typeahead.length === 1 ? this.activeIndex() + 1 : 0;
    for (let n = 0; n < opts.length; n++) {
      const i = (start + n) % opts.length;
      if (
        !opts[i].disabled &&
        opts[i].label.toLowerCase().startsWith(this.typeahead)
      ) {
        this.activeIndex.set(i);
        return;
      }
    }
  }

  /** Fixed coordinates under (or above) the trigger, aligned to its start. */
  private place(): void {
    const trigger = this.trigger().nativeElement;
    const view = trigger.ownerDocument.defaultView;
    if (!view || typeof trigger.getBoundingClientRect !== 'function') return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const roomBelow = view.innerHeight - rect.bottom;
    const above = roomBelow < 220 && rect.top > roomBelow;
    const rtl = isRtl(this.elementRef.nativeElement);
    this.placement.set({
      'min-inline-size': `${rect.width}px`,
      ...(above
        ? { bottom: `${view.innerHeight - rect.top + gap}px` }
        : { top: `${rect.bottom + gap}px` }),
      ...(rtl
        ? { right: `${view.innerWidth - rect.right}px` }
        : { left: `${rect.left}px` }),
      'max-block-size': `${Math.max(160, (above ? rect.top : roomBelow) - 16)}px`,
    });
  }
}
