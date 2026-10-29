import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  hint?: string;
}

export type SelectSize = 'sm' | 'md' | 'lg';

let nextSelectId = 0;

/**
 * Accessible custom single-select dropdown with keyboard navigation (WAI-ARIA 1.2 Combobox pattern),
 * token-based theming, dark mode support, and option icons/hints.
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
  },
  templateUrl: './select.html',
  styleUrl: './select.scss',
})
export class Select<T = string> {
  private readonly elementRef = inject(ElementRef);

  readonly options = input.required<readonly SelectOption<T>[]>();
  readonly value = model<T | null>(null);
  readonly placeholder = input<string>('Select an option...');
  readonly label = input<string>();
  readonly disabled = input<boolean>(false);
  readonly size = input<SelectSize>('md');

  protected readonly selectId = `ah-select-${++nextSelectId}`;
  protected readonly listboxId = `${this.selectId}-listbox`;

  protected readonly isOpen = signal<boolean>(false);
  protected readonly activeIndex = signal<number>(-1);

  protected readonly selectedOption = computed(() => {
    const val = this.value();
    if (val === null || val === undefined) return null;
    return this.options().find((opt) => opt.value === val) ?? null;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
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
    this.isOpen.set(true);
    const selectedIdx = this.options().findIndex(
      (opt) => opt.value === this.value(),
    );
    this.activeIndex.set(selectedIdx >= 0 ? selectedIdx : 0);
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectOption(option: SelectOption<T>): void {
    if (option.disabled || this.disabled()) return;
    this.value.set(option.value);
    this.close();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    if (!this.isOpen()) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        this.open();
      }
      return;
    }

    const opts = this.options();
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = Math.min(this.activeIndex() + 1, opts.length - 1);
        this.activeIndex.set(next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = Math.max(this.activeIndex() - 1, 0);
        this.activeIndex.set(prev);
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.activeIndex.set(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.activeIndex.set(opts.length - 1);
        break;
      }
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
      case 'Tab': {
        this.close();
        break;
      }
    }
  }
}
