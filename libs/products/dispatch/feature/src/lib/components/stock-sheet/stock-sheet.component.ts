import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import * as XLSX from 'xlsx';

@Component({
  selector: 'ah-stock-sheet',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sheet-wrapper">
      <!-- Sheet Toolbar -->
      <div class="sheet-toolbar">
        <div class="toolbar-brand">
          <span class="sheets-icon">📊</span>
          <div>
            <h2 class="sheet-title">Commercial Linen & Stock Sheet</h2>
            <span class="sheet-status">
              Live Google Sheets 2-Way Sync · Last update:
              {{ store.lastSheetsSyncedAt() }}
            </span>
          </div>
        </div>

        <div class="toolbar-actions">
          <button
            type="button"
            class="add-stock-btn"
            (click)="store.openAddStockModal()"
          >
            + Add Linen SKU
          </button>

          <button
            type="button"
            class="sync-btn"
            [disabled]="store.isSyncingSheets()"
            (click)="store.syncGoogleSheets()"
          >
            @if (store.isSyncingSheets()) {
              <span class="spin-icon">⏳</span> Synchronizing...
            } @else {
              <span>🔄 Sync to Google Sheets</span>
            }
          </button>

          <button type="button" class="export-btn" (click)="exportToExcel()">
            📥 Export Excel (.xlsx)
          </button>
        </div>
      </div>

      <!-- Google Sheets Style Grid -->
      <div class="sheet-table-container">
        <table class="sheets-table">
          <thead>
            <tr class="col-headers-row">
              <th class="row-num-col">#</th>
              <th>SKU</th>
              <th>Linen Item Name</th>
              <th>Category</th>
              <th class="num-col">In Circulation</th>
              <th class="num-col">At Plant Wash</th>
              <th class="num-col">Clean Reserve</th>
              <th class="num-col">Damaged / Scrap</th>
              <th class="num-col">Missing</th>
              <th class="num-col">Unit Weight</th>
              <th class="num-col">Total Asset Value</th>
              <th class="actions-col">Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            @for (item of store.stock(); track item.sku; let idx = $index) {
              <tr
                [class.is-low-stock]="item.inCleanReserve < item.minThreshold"
              >
                <td class="row-num">{{ idx + 1 }}</td>
                <td class="sku-cell">{{ item.sku }}</td>
                <td class="name-cell">
                  <strong>{{ item.name }}</strong>
                  @if (item.inCleanReserve < item.minThreshold) {
                    <span class="low-stock-alert"
                      >⚠️ LOW STOCK (&lt; {{ item.minThreshold }})</span
                    >
                  }
                </td>
                <td>
                  <span class="cat-pill" [class]="'cat-' + item.category">
                    {{ item.category | uppercase }}
                  </span>
                </td>
                <td class="num-cell">
                  {{ item.inCirculation.toLocaleString() }}
                </td>
                <td class="num-cell wash-cell">
                  {{ item.atPlantWash.toLocaleString() }}
                </td>
                <td
                  class="num-cell reserve-cell"
                  [class.text-danger]="item.inCleanReserve < item.minThreshold"
                >
                  {{ item.inCleanReserve.toLocaleString() }}
                </td>
                <td class="num-cell scrap-cell">
                  {{ item.damagedScrap.toLocaleString() }}
                </td>
                <td class="num-cell missing-cell">
                  {{ item.disputedMissing.toLocaleString() }}
                </td>
                <td class="num-cell">{{ item.unitWeightGrams }}g</td>
                <td class="num-cell value-cell">
                  £{{
                    (
                      (item.inCirculation +
                        item.atPlantWash +
                        item.inCleanReserve) *
                      item.replacementCostGbp
                    ).toLocaleString()
                  }}
                </td>
                <td class="adjust-cell">
                  <button
                    type="button"
                    class="adj-btn"
                    (click)="
                      store.updateStockItem(item.sku, 'inCleanReserve', -10)
                    "
                    title="Dispatch 10 clean units"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    class="adj-btn add-btn"
                    (click)="
                      store.updateStockItem(item.sku, 'inCleanReserve', 10)
                    "
                    title="Receive 10 clean units"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    class="adj-btn scrap-btn"
                    (click)="store.updateStockItem(item.sku, 'damagedScrap', 1)"
                    title="Scrap 1 damaged unit"
                  >
                    +1 Scrap
                  </button>
                  <button
                    type="button"
                    class="adj-btn delete-stock-btn"
                    (click)="store.deleteStockItem(item.sku)"
                    title="Delete SKU"
                    aria-label="Delete SKU"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="12" class="empty-stock-cell">
                  <div class="empty-stock-content">
                    <span class="empty-stock-icon">📊</span>
                    <h3 class="empty-stock-title">Stock Ledger is Empty</h3>
                    <p class="empty-stock-desc">
                      Add hotel bed sheets, towelling, or dining linen SKUs to
                      track circulation, reserve levels, and replacement asset
                      values.
                    </p>
                    <button
                      type="button"
                      class="add-stock-btn"
                      (click)="store.openAddStockModal()"
                    >
                      + Add First Linen SKU
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="4" class="totals-label">TOTAL FLEET INVENTORY</td>
              <td class="num-cell">
                {{ getTotal('inCirculation').toLocaleString() }}
              </td>
              <td class="num-cell">
                {{ getTotal('atPlantWash').toLocaleString() }}
              </td>
              <td class="num-cell">
                {{ getTotal('inCleanReserve').toLocaleString() }}
              </td>
              <td class="num-cell">
                {{ getTotal('damagedScrap').toLocaleString() }}
              </td>
              <td class="num-cell">
                {{ getTotal('disputedMissing').toLocaleString() }}
              </td>
              <td>-</td>
              <td class="num-cell val-total">
                £{{ store.stockTotalValuationGbp().toLocaleString() }}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .sheet-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
    }

    .sheet-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 0.75rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
    }

    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sheets-icon {
      font-size: 1.75rem;
    }

    .sheet-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .sheet-status {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .add-stock-btn {
      background: var(--color-accent-default, #0284c7);
      color: var(--color-accent-on, #fff);
      border: none;
      padding: 8px 14px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .sync-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: filter 0.15s ease;

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .export-btn {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 8px 14px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }
    }

    .spin-icon {
      display: inline-block;
      animation: spin 1s infinite linear;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    /* Table Container */
    .sheet-table-container {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      overflow-x: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .sheets-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }

    .col-headers-row th {
      background: var(--color-bg-canvas);
      color: var(--color-text-muted);
      font-weight: 700;
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 10px 12px;
      border-bottom: 2px solid var(--color-border-default);
      border-right: 1px solid var(--color-border-default);
      white-space: nowrap;
    }

    .row-num-col,
    .row-num {
      width: 36px;
      text-align: center;
      background: var(--color-bg-canvas);
      color: var(--color-text-muted);
      font-size: 0.6875rem;
      font-family: var(--font-family-mono, monospace);
      border-right: 2px solid var(--color-border-default);
    }

    .sheets-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-border-default);
      border-right: 1px solid var(--color-border-default);
      color: var(--color-text-default);
    }

    .is-low-stock td {
      background: rgba(245, 158, 11, 0.04);
    }

    .sku-cell {
      font-family: var(--font-family-mono, monospace);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-accent-default);
      white-space: nowrap;
    }

    .name-cell {
      min-width: 260px;
    }

    .low-stock-alert {
      display: inline-block;
      margin-left: 8px;
      font-size: 0.625rem;
      font-weight: 800;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.15);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .cat-pill {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;

      &.cat-bedding {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.cat-bath {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
      &.cat-dining {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      &.cat-uniform {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }
      &.cat-kitchen {
        background: rgba(236, 72, 153, 0.15);
        color: #ec4899;
      }
    }

    .num-col,
    .num-cell {
      text-align: right;
      font-family: var(--font-family-mono, monospace);
      white-space: nowrap;
    }

    .wash-cell {
      color: #3b82f6;
    }
    .reserve-cell {
      font-weight: 700;
      color: #10b981;
    }
    .scrap-cell {
      color: #ef4444;
    }
    .missing-cell {
      color: #f59e0b;
    }
    .value-cell {
      font-weight: 700;
      color: var(--color-text-default);
    }

    .adjust-cell {
      display: flex;
      gap: 4px;
      justify-content: flex-end;
      white-space: nowrap;
    }

    .adj-btn {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }

      &.add-btn:hover {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10b981;
        color: #10b981;
      }

      &.scrap-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
      }

      &.delete-stock-btn {
        opacity: 0.6;
        &:hover {
          opacity: 1;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.4);
        }
      }
    }

    .empty-stock-cell {
      padding: var(--space-8, 2.5rem) var(--space-4, 1rem) !important;
      text-align: center;
      background: var(--color-bg-surface);
    }

    .empty-stock-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      max-width: 440px;
      margin: 0 auto;
    }

    .empty-stock-icon {
      font-size: 2.5rem;
    }

    .empty-stock-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      color: var(--color-text-default);
      margin: 0;
    }

    .empty-stock-desc {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted);
      margin: 0 0 var(--space-3, 0.75rem);
    }

    .totals-row td {
      background: var(--color-bg-canvas);
      font-weight: 800;
      border-top: 2px solid var(--color-border-default);
    }

    .totals-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      letter-spacing: 0.05em;
    }

    .val-total {
      color: var(--color-accent-default);
      font-size: 0.875rem;
    }

    .text-danger {
      color: #ef4444 !important;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockSheetComponent {
  readonly store = inject(DispatchStore);

  getTotal(
    field:
      | 'inCirculation'
      | 'atPlantWash'
      | 'inCleanReserve'
      | 'damagedScrap'
      | 'disputedMissing',
  ): number {
    return this.store
      .stock()
      .reduce((sum, item) => sum + (item[field] || 0), 0);
  }

  exportToExcel(): void {
    const data = this.store.stock().map((item, idx) => ({
      Row: idx + 1,
      SKU: item.sku,
      Name: item.name,
      Category: item.category.toUpperCase(),
      'In Circulation': item.inCirculation,
      'At Subcontractor Wash': item.atPlantWash,
      'Clean Hub Reserve': item.inCleanReserve,
      'Damaged / Scrap': item.damagedScrap,
      'Disputed / Missing': item.disputedMissing,
      'Unit Weight (g)': item.unitWeightGrams,
      'Replacement Cost (£)': item.replacementCostGbp,
      'Total Value (£)':
        (item.inCirculation + item.atPlantWash + item.inCleanReserve) *
        item.replacementCostGbp,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linen Stock Sheet');
    XLSX.writeFile(workbook, 'PulseOps_London_Linen_Stock.xlsx');
  }
}
