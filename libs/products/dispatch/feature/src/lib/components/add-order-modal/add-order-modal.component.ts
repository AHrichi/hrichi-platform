import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { Order, ClientSector } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-add-order-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAddOrderModal()) {
      <div class="modal-overlay" (click)="store.closeAddOrderModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">📦</span>
              <div>
                <h2 class="modal-title">Create New Order from Scratch</h2>
                <span class="modal-sub">
                  Add custom hotel, restaurant, or Airbnb laundry dispatch job
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closeAddOrderModal()"
            >
              ✕
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="submitOrder()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Client Name *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="clientName"
                  name="clientName"
                  placeholder="e.g. The Claridge's Hotel London, Hawksmoor Guildhall..."
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Sector *</label>
                <select
                  class="form-select"
                  [(ngModel)]="clientSector"
                  name="clientSector"
                  required
                >
                  <option value="hotel">Hotel & Hospitality</option>
                  <option value="restaurant">Restaurant & Kitchen</option>
                  <option value="airbnb">Airbnb & Short-Let</option>
                  <option value="spa_gym">Spa & Health Club</option>
                  <option value="corporate">Corporate Suite</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Zone / Area *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="zone"
                  name="zone"
                  placeholder="e.g. W1 - Mayfair, E1 - Shoreditch"
                  required
                />
              </div>

              <div class="form-group full-width">
                <label class="form-label">Delivery Address *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="address"
                  name="address"
                  placeholder="e.g. Brook St, Mayfair, London W1K 4HR"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Target Delivery Window *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="targetWindow"
                  name="targetWindow"
                  placeholder="e.g. 13:00 - 14:30"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">SLA Cutoff Time (24h) *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="slaDeadline"
                  name="slaDeadline"
                  placeholder="e.g. 14:30"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Total Linen Weight (kg) *</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="totalWeightKg"
                  name="totalWeightKg"
                  min="5"
                  max="1000"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Linen Description *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="itemsSummary"
                  name="itemsSummary"
                  placeholder="e.g. 50x King Sheets, 50x Duvets, 100x Bath Sheets"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Assign Driver</label>
                <select
                  class="form-select"
                  [(ngModel)]="assignedDriverId"
                  name="assignedDriverId"
                >
                  <option [ngValue]="null">-- Unassigned --</option>
                  @for (driver of store.drivers(); track driver.id) {
                    <option [value]="driver.id">
                      {{ driver.name }} ({{ driver.zone }})
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Assign Subcontract Plant</label>
                <select
                  class="form-select"
                  [(ngModel)]="assignedPlantId"
                  name="assignedPlantId"
                >
                  <option value="plant-general">General Partner Plant</option>
                  @for (plant of store.subcontractors(); track plant.id) {
                    <option [value]="plant.id">{{ plant.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group full-width">
                <label class="form-label"
                  >Special Delivery / Access Instructions</label
                >
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="specialInstructions"
                  name="specialInstructions"
                  placeholder="e.g. Deliver to rear loading bay off Deanery St, ask for security."
                />
              </div>

              <div class="form-group full-width checkbox-row">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    [(ngModel)]="isEmergency"
                    name="isEmergency"
                  />
                  <span>Mark as Urgent / Priority Express</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="store.closeAddOrderModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="!clientName.trim() || !address.trim()"
              >
                ✓ Add Order to Kanban
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
      max-width: 620px;
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
      gap: 12px;
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .modal-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-text-default);
    }

    .modal-sub {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    .modal-body {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .full-width {
      grid-column: span 2;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .form-input,
    .form-select {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 9px 12px;
      font-size: 0.8125rem;
      color: var(--color-text-default);

      &:focus {
        outline: none;
        border-color: var(--color-accent-default);
      }
    }

    .checkbox-row {
      margin-top: 4px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-default);
      cursor: pointer;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }

    .btn-cancel {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 9px 16px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit {
      background: #10b981;
      color: white;
      border: none;
      padding: 9px 20px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    @media (max-width: 640px) {
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
export class AddOrderModalComponent {
  readonly store = inject(DispatchStore);

  clientName = '';
  clientSector: ClientSector = 'hotel';
  zone = 'W1 - Mayfair';
  address = '';
  targetWindow = '13:00 - 14:30';
  slaDeadline = '14:30';
  totalWeightKg = 85;
  itemsSummary = '40x King Sheets, 40x Duvets, 80x Pillowcases';
  assignedDriverId: string | null = null;
  assignedPlantId = 'plant-general';
  specialInstructions = '';
  isEmergency = false;

  submitOrder(): void {
    if (!this.clientName.trim() || !this.address.trim()) return;

    const newId = `ORD-${Math.floor(8420 + Math.random() * 80)}`;
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newOrder: Order = {
      id: newId,
      clientName: this.clientName.trim(),
      clientSector: this.clientSector,
      address: this.address.trim(),
      zone: this.zone.trim(),
      status: 'intake',
      totalWeightKg: Number(this.totalWeightKg) || 50,
      items: [
        {
          sku: 'LIN-CUSTOM',
          name: this.itemsSummary.trim() || 'Custom Commercial Linen Set',
          quantity: 1,
          weightKg: Number(this.totalWeightKg) || 50,
        },
      ],
      slaDeadline: this.slaDeadline.trim() || '15:00',
      targetDeliveryWindow: this.targetWindow.trim() || '14:00 - 15:00',
      assignedDriverId: this.assignedDriverId,
      assignedPlantId: this.assignedPlantId,
      specialInstructions: this.specialInstructions.trim(),
      isEmergency: this.isEmergency,
      pod: null,
      createdAt: nowHhMm,
      updatedAt: nowHhMm,
    };

    this.store.addOrder(newOrder);

    // Reset form
    this.clientName = '';
    this.address = '';
    this.specialInstructions = '';
  }
}
