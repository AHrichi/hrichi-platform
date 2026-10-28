import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { LinenSKU, LinenCategory } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-add-stock-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAddStockModal()) {
      <div class="modal-overlay" (click)="store.closeAddStockModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">📊</span>
              <div>
                <h2 class="modal-title">Add Linen Stock SKU</h2>
                <span class="modal-sub">
                  Track inventory on the Google Sheets synchronized stock ledger
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closeAddStockModal()"
            >
              ✕
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="submitStock()">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">SKU Code *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="sku"
                  name="sku"
                  placeholder="e.g. BED-SHT-KNG, BTH-TWL-SHT"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Category *</label>
                <select
                  class="form-select"
                  [(ngModel)]="category"
                  name="category"
                  required
                >
                  <option value="bedding">Bedding & Sheets</option>
                  <option value="bath">Bath & Towelling</option>
                  <option value="dining">Dining & Napery</option>
                  <option value="kitchen">Kitchen & Chefs</option>
                  <option value="uniform">Uniform & Workwear</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Item Description *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="name"
                  name="name"
                  placeholder="e.g. King Bed Sheet 300TC Percale White"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Unit Weight (grams) *</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="unitWeightGrams"
                  name="unitWeightGrams"
                  min="50"
                  max="5000"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Replacement Cost (£ GBP) *</label>
                <input
                  type="number"
                  step="0.5"
                  class="form-input"
                  [(ngModel)]="replacementCostGbp"
                  name="replacementCostGbp"
                  min="1"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Clean Reserve (On-Hand) *</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="inCleanReserve"
                  name="inCleanReserve"
                  min="0"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Currently in Circulation</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="inCirculation"
                  name="inCirculation"
                  min="0"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Minimum Par Threshold *</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="minThreshold"
                  name="minThreshold"
                  min="10"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">At Subcontractor Wash</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="atPlantWash"
                  name="atPlantWash"
                  min="0"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="store.closeAddStockModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="!sku.trim() || !name.trim()"
              >
                ✓ Add to Stock Ledger
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: var(--space-4, 1rem);
    }

    .modal-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .modal-header {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      border-bottom: 1px solid var(--color-border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .modal-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      color: var(--color-text-default);
      margin: 0;
    }

    .modal-sub {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted);
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md, 0.375rem);
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: var(--color-bg-muted);
      color: var(--color-text-default);
    }

    .modal-body {
      padding: var(--space-5, 1.25rem);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3, 0.75rem);
    }

    .full-width {
      grid-column: span 2;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: var(--text-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .form-input,
    .form-select {
      background: var(--color-bg-subtle, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.375rem);
      padding: 0.55rem 0.75rem;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-default);
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: var(--color-accent-blue, #0284c7);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 0.75rem);
      padding-top: var(--space-4, 1rem);
      border-top: 1px solid var(--color-border-default);
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid var(--color-border-default);
      color: var(--color-text-muted);
      padding: 0.55rem 1rem;
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 500;
      cursor: pointer;
    }

    .btn-cancel:hover {
      background: var(--color-bg-muted);
      color: var(--color-text-default);
    }

    .btn-submit {
      background: var(--color-accent-blue, #0284c7);
      color: #fff;
      border: none;
      padding: 0.55rem 1.25rem;
      border-radius: var(--radius-md, 0.375rem);
      font-size: var(--text-sm, 0.875rem);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStockModalComponent {
  readonly store = inject(DispatchStore);

  sku = '';
  name = '';
  category: LinenCategory = 'bedding';
  unitWeightGrams = 680;
  inCleanReserve = 250;
  inCirculation = 500;
  minThreshold = 100;
  atPlantWash = 150;
  replacementCostGbp = 18.5;

  submitStock(): void {
    if (!this.sku.trim() || !this.name.trim()) return;

    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: LinenSKU = {
      sku: this.sku.trim().toUpperCase(),
      name: this.name.trim(),
      category: this.category,
      unitWeightGrams: Number(this.unitWeightGrams) || 500,
      inCleanReserve: Number(this.inCleanReserve) || 0,
      inCirculation: Number(this.inCirculation) || 0,
      atPlantWash: Number(this.atPlantWash) || 0,
      damagedScrap: 0,
      disputedMissing: 0,
      minThreshold: Number(this.minThreshold) || 50,
      replacementCostGbp: Number(this.replacementCostGbp) || 10,
      lastUpdated: nowHhMm,
    };

    this.store.addStockItem(newItem);

    // Reset form
    this.sku = '';
    this.name = '';
  }
}
