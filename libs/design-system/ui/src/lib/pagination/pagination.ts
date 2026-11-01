import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type PaginationPageItem =
  { type: 'page'; page: number } | { type: 'ellipsis'; id: string };

@Component({
  selector: 'ah-pagination',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalItems() > 0) {
      <nav
        class="ah-pagination"
        [class.ah-pagination--compact]="compact()"
        [attr.aria-label]="ariaLabel()"
      >
        <div class="ah-pagination__summary">
          <span>
            Showing <strong>{{ startItem() | number }}</strong
            >–<strong>{{ endItem() | number }}</strong> of
            <strong>{{ totalItems() | number }}</strong> {{ itemLabel() }}
          </span>

          @if (showPageSizeSelector() && pageSizeOptions().length > 1) {
            <label class="ah-pagination__size-label">
              <span class="sr-only">Items per page</span>
              <select
                class="ah-pagination__size-select"
                [value]="pageSize()"
                (change)="onSizeSelectChange($event)"
              >
                @for (opt of pageSizeOptions(); track opt) {
                  <option [value]="opt" [selected]="opt === pageSize()">
                    {{ opt }} / page
                  </option>
                }
              </select>
            </label>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="ah-pagination__controls">
            <button
              type="button"
              class="ah-pagination__btn"
              [disabled]="safeCurrentPage() <= 1"
              (click)="goToPage(1)"
              title="First page"
              aria-label="First page"
            >
              «
            </button>
            <button
              type="button"
              class="ah-pagination__btn"
              [disabled]="safeCurrentPage() <= 1"
              (click)="goToPage(safeCurrentPage() - 1)"
              title="Previous page"
            >
              <span aria-hidden="true">‹</span> Prev
            </button>

            <div class="ah-pagination__pages">
              @for (item of visiblePageItems(); track $index) {
                @if (item.type === 'ellipsis') {
                  <span class="ah-pagination__ellipsis" aria-hidden="true"
                    >…</span
                  >
                } @else {
                  <button
                    type="button"
                    class="ah-pagination__page-btn"
                    [class.is-active]="item.page === safeCurrentPage()"
                    [attr.aria-current]="
                      item.page === safeCurrentPage() ? 'page' : null
                    "
                    (click)="goToPage(item.page)"
                  >
                    {{ item.page }}
                  </button>
                }
              }
            </div>

            <button
              type="button"
              class="ah-pagination__btn"
              [disabled]="safeCurrentPage() >= totalPages()"
              (click)="goToPage(safeCurrentPage() + 1)"
              title="Next page"
            >
              Next <span aria-hidden="true">›</span>
            </button>
            <button
              type="button"
              class="ah-pagination__btn"
              [disabled]="safeCurrentPage() >= totalPages()"
              (click)="goToPage(totalPages())"
              title="Last page"
              aria-label="Last page"
            >
              »
            </button>
          </div>
        }
      </nav>
    }
  `,
  styles: `
    :host {
      display: block;
      inline-size: 100%;
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .ah-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      flex-wrap: wrap;
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      background: var(--color-bg-subtle, rgba(148, 163, 184, 0.08));
      border: 1px solid var(--color-border-default, rgba(148, 163, 184, 0.2));
      border-radius: var(--radius-md, 0.65rem);
      font-size: var(--font-size-100, 0.85rem);
      color: var(--color-text-muted, #94a3b8);
    }

    .ah-pagination--compact {
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      font-size: 0.78rem;
    }

    .ah-pagination__summary {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      flex-wrap: wrap;

      strong {
        color: var(--color-text-default, #f8fafc);
        font-weight: var(--font-weight-semibold, 600);
      }
    }

    .ah-pagination__size-select {
      background: var(--color-bg-raised, #1e293b);
      color: var(--color-text-default, #f8fafc);
      border: 1px solid var(--color-border-default, rgba(148, 163, 184, 0.25));
      border-radius: var(--radius-sm, 0.45rem);
      padding: 0.22rem 0.55rem;
      font-size: 0.78rem;
      font-family: inherit;
      cursor: pointer;

      &:focus-visible {
        outline: 2px solid var(--color-accent-default, #38bdf8);
        outline-offset: 1px;
      }
    }

    .ah-pagination__controls {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      flex-wrap: wrap;
    }

    .ah-pagination__pages {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .ah-pagination__btn,
    .ah-pagination__page-btn {
      appearance: none;
      background: var(--color-bg-raised, #1e293b);
      color: var(--color-text-default, #f8fafc);
      border: 1px solid var(--color-border-default, rgba(148, 163, 184, 0.25));
      border-radius: var(--radius-sm, 0.45rem);
      padding: 0.28rem 0.6rem;
      min-inline-size: 2rem;
      font-size: 0.78rem;
      font-weight: var(--font-weight-medium, 500);
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        border-color: var(--color-success-default, #25d366);
        color: var(--color-success-default, #25d366);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .ah-pagination__page-btn.is-active {
      background: var(--color-success-default, #25d366);
      border-color: var(--color-success-default, #25d366);
      color: var(--color-bg-canvas);
      font-weight: var(--font-weight-bold, 700);
    }

    .ah-pagination__ellipsis {
      padding: 0 0.3rem;
      color: var(--color-text-muted, #94a3b8);
      user-select: none;
    }

    @media (max-width: 640px) {
      .ah-pagination {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
        padding: 0.6rem 0.75rem;
      }
      .ah-pagination__summary {
        justify-content: space-between;
        font-size: 0.76rem;
      }
      .ah-pagination__controls {
        justify-content: center;
        gap: 0.22rem;
      }
      .ah-pagination__pages {
        gap: 0.18rem;
        flex-wrap: wrap;
        justify-content: center;
      }
      .ah-pagination__btn,
      .ah-pagination__page-btn {
        min-inline-size: 1.85rem;
        min-block-size: 1.95rem;
        padding: 0.22rem 0.45rem;
        font-size: 0.74rem;
      }
    }
  `,
})
export class Pagination {
  readonly totalItems = input.required<number>();
  readonly pageSize = input<number>(10);
  readonly currentPage = input<number>(1);
  readonly pageSizeOptions = input<readonly number[]>([10, 25, 50]);
  readonly itemLabel = input<string>('items');
  readonly ariaLabel = input<string>('Pagination navigation');
  readonly showPageSizeSelector = input<boolean>(true);
  readonly compact = input<boolean>(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly totalPages = computed(() => {
    const size = Math.max(1, this.pageSize());
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  readonly safeCurrentPage = computed(() => {
    const cur = this.currentPage();
    return Math.max(1, Math.min(this.totalPages(), cur));
  });

  readonly startItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.safeCurrentPage() - 1) * this.pageSize() + 1;
  });

  readonly endItem = computed(() => {
    if (this.totalItems() === 0) return 0;
    return Math.min(
      this.totalItems(),
      this.safeCurrentPage() * this.pageSize(),
    );
  });

  readonly visiblePageItems = computed<readonly PaginationPageItem[]>(() => {
    const total = this.totalPages();
    const cur = this.safeCurrentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => ({
        type: 'page' as const,
        page: i + 1,
      }));
    }

    const items: PaginationPageItem[] = [{ type: 'page', page: 1 }];
    if (cur > 3) {
      items.push({ type: 'ellipsis', id: 'start-el' });
    }

    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', page: p });
    }

    if (cur < total - 2) {
      items.push({ type: 'ellipsis', id: 'end-el' });
    }

    items.push({ type: 'page', page: total });
    return items;
  });

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(this.totalPages(), page));
    if (clamped !== this.safeCurrentPage()) {
      this.pageChange.emit(clamped);
    }
  }

  onSizeSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nextSize = Number(select.value);
    if (!Number.isNaN(nextSize) && nextSize > 0) {
      this.pageSizeChange.emit(nextSize);
      this.pageChange.emit(1);
    }
  }
}
