import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  CHEAT_TERMS,
  type CheatTerm,
  searchCourse,
  type SearchHit,
} from '@ah/products/system-design/domain';
import { SdIcon } from '@ah/products/system-design/ui';
import { SdNav } from '../services/sd-nav';
import { SystemDesignStore } from '../store/system-design.store';

/**
 * Course search dialog (`sd-search-dialog`).
 * Uses a native `<dialog>` inside the shell host so it inherits the paper look,
 * queries `searchCourse(query, curriculum, cheatTerms)`, groups hits by
 * Lessons / Cheatsheets, and supports `↑` / `↓` / `Enter` / `Esc`.
 */
@Component({
  selector: 'sd-search-dialog',
  imports: [SdIcon],
  templateUrl: './search-dialog.html',
  styleUrl: './search-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdSearchDialog {
  readonly open = input<boolean>(false);
  readonly cheatTerms = input<readonly CheatTerm[]>(CHEAT_TERMS);

  readonly closed = output<void>();

  protected readonly store = inject(SystemDesignStore);
  private readonly nav = inject(SdNav);

  private readonly dialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly inputRef =
    viewChild<ElementRef<HTMLInputElement>>('queryInput');

  protected readonly query = signal('');

  protected readonly hits = computed<readonly SearchHit[]>(() =>
    searchCourse(this.query(), this.store.curriculum(), this.cheatTerms()),
  );

  /**
   * Hits in the order they are shown (lessons, then cheatsheets), so ↑/↓
   * follow the screen, not the raw score order.
   */
  protected readonly ordered = computed<readonly SearchHit[]>(() => [
    ...this.hits().filter((h) => h.kind === 'lesson'),
    ...this.hits().filter((h) => h.kind === 'cheatsheet'),
  ]);

  /** The visible groups, each option carrying its index in `ordered`. */
  protected readonly groups = computed(() => {
    const items = this.ordered().map((hit, index) => ({ hit, index }));
    return [
      {
        kind: 'lesson',
        label: 'Lessons',
        items: items.filter((i) => i.hit.kind === 'lesson'),
      },
      {
        kind: 'cheatsheet',
        label: 'Cheatsheets',
        items: items.filter((i) => i.hit.kind === 'cheatsheet'),
      },
    ].filter((g) => g.items.length > 0);
  });

  /** Resets to the first option whenever the results change. */
  protected readonly activeIndex = linkedSignal<readonly SearchHit[], number>({
    source: this.ordered,
    computation: (list) => (list.length > 0 ? 0 : -1),
  });

  /** Option ids are positional, so two hits never share an id. */
  protected optionId(index: number): string {
    return `sd-hit-${index}`;
  }

  protected readonly activeId = computed(() =>
    this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null,
  );

  constructor() {
    // Keep the active option in view as ↑/↓ move it.
    afterRenderEffect(() => {
      const id = this.activeId();
      if (!id) return;
      const el = this.dialogRef()?.nativeElement.querySelector(`#${id}`);
      el?.scrollIntoView?.({ block: 'nearest' });
    });

    afterRenderEffect(() => {
      const isOpen = this.open();
      const dialog = this.dialogRef()?.nativeElement;
      if (!dialog) return;

      if (isOpen) {
        if (!dialog.open) {
          if (typeof dialog.showModal === 'function') {
            try {
              dialog.showModal();
            } catch {
              dialog.setAttribute('open', '');
            }
          } else {
            dialog.setAttribute('open', '');
          }
        }
        this.inputRef()?.nativeElement.focus();
      } else if (dialog.open || dialog.hasAttribute('open')) {
        if (typeof dialog.close === 'function') {
          try {
            dialog.close();
          } catch {
            dialog.removeAttribute('open');
          }
        } else {
          dialog.removeAttribute('open');
        }
      }
    });
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.query.set(target?.value ?? '');
  }

  protected onInputKey(event: KeyboardEvent): void {
    const list = this.ordered();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDialog();
      return;
    }
    if (list.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => (i + 1) % list.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => (i - 1 + list.length) % list.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = list[this.activeIndex()] ?? list[0];
      if (hit) this.selectHit(hit);
    }
  }

  protected selectHit(hit: SearchHit): void {
    this.closeDialog();
    if (hit.kind === 'lesson') {
      void this.nav.goToLesson(hit.id, 1);
    } else {
      void this.nav.goToCheatsheet(hit.id);
    }
  }

  protected closeDialog(): void {
    this.closed.emit();
  }
}
