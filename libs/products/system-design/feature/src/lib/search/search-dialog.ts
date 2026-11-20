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
  readonly cheatTerms = input<readonly CheatTerm[]>([]);

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

  protected readonly lessonHits = computed(() =>
    this.hits().filter((h) => h.kind === 'lesson'),
  );

  protected readonly cheatsheetHits = computed(() =>
    this.hits().filter((h) => h.kind === 'cheatsheet'),
  );

  /** Resets active index to 0 whenever hits change. */
  protected readonly activeIndex = linkedSignal<readonly SearchHit[], number>({
    source: this.hits,
    computation: (list) => (list.length > 0 ? 0 : -1),
  });

  protected readonly activeHitId = computed(() => {
    const idx = this.activeIndex();
    const list = this.hits();
    const hit = list[idx];
    return hit ? `sd-hit-${hit.kind}-${hit.id}` : null;
  });

  constructor() {
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
    const list = this.hits();
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

  protected isHitActive(hit: SearchHit): boolean {
    const current = this.hits()[this.activeIndex()];
    return Boolean(
      current && current.kind === hit.kind && current.id === hit.id,
    );
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
