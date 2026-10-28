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
      <div class="modal-overlay" (click)="closeModal()">
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
              (click)="closeModal()"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <form class="modal-form" (ngSubmit)="submitOrder()" novalidate>
            <div class="modal-body">
              @if (successMessage()) {
                <div class="form-success-banner" role="status">
                  {{ successMessage() }}
                </div>
              }

              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label" for="order-client"
                    >Client Name *</label
                  >
                  <input
                    id="order-client"
                    type="text"
                    class="form-input"
                    [class.has-error]="
                      clientRef.invalid && (clientRef.touched || submitted())
                    "
                    [(ngModel)]="clientName"
                    name="clientName"
                    #clientRef="ngModel"
                    placeholder="e.g. The Claridge's Hotel London, Hawksmoor Guildhall..."
                    required
                    minlength="2"
                    [attr.aria-invalid]="
                      clientRef.invalid && (clientRef.touched || submitted())
                    "
                  />
                  @if (
                    clientRef.invalid && (clientRef.touched || submitted())
                  ) {
                    <span class="field-error" role="alert"
                      >Client / venue name is required</span
                    >
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="order-sector">Sector *</label>
                  <select
                    id="order-sector"
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
                  <label class="form-label" for="order-zone"
                    >Zone / Area *</label
                  >
                  <input
                    id="order-zone"
                    type="text"
                    class="form-input"
                    [(ngModel)]="zone"
                    name="zone"
                    placeholder="e.g. W1 - Mayfair, E1 - Shoreditch"
                    required
                  />
                </div>

                <div class="form-group full-width">
                  <label class="form-label" for="order-address"
                    >Delivery Address *</label
                  >
                  <input
                    id="order-address"
                    type="text"
                    class="form-input"
                    [class.has-error]="
                      addressRef.invalid && (addressRef.touched || submitted())
                    "
                    [(ngModel)]="address"
                    name="address"
                    #addressRef="ngModel"
                    placeholder="e.g. Brook St, Mayfair, London W1K 4HR"
                    required
                    minlength="5"
                    [attr.aria-invalid]="
                      addressRef.invalid && (addressRef.touched || submitted())
                    "
                  />
                  @if (
                    addressRef.invalid && (addressRef.touched || submitted())
                  ) {
                    <span class="field-error" role="alert"
                      >A complete delivery address is required</span
                    >
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="order-window"
                    >Target Delivery Window *</label
                  >
                  <input
                    id="order-window"
                    type="text"
                    class="form-input"
                    [(ngModel)]="targetWindow"
                    name="targetWindow"
                    placeholder="e.g. 13:00 - 14:30"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="order-sla"
                    >SLA Cutoff Time (24h) *</label
                  >
                  <input
                    id="order-sla"
                    type="text"
                    class="form-input"
                    [(ngModel)]="slaDeadline"
                    name="slaDeadline"
                    placeholder="e.g. 14:30"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="order-weight"
                    >Total Linen Weight (kg) *</label
                  >
                  <input
                    id="order-weight"
                    type="number"
                    class="form-input"
                    [class.has-error]="
                      weightRef.invalid && (weightRef.touched || submitted())
                    "
                    [(ngModel)]="totalWeightKg"
                    name="totalWeightKg"
                    #weightRef="ngModel"
                    min="5"
                    max="1000"
                    required
                    [attr.aria-invalid]="
                      weightRef.invalid && (weightRef.touched || submitted())
                    "
                  />
                  @if (
                    weightRef.invalid && (weightRef.touched || submitted())
                  ) {
                    <span class="field-error" role="alert"
                      >Weight must be between 5 and 1,000 kg</span
                    >
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="order-items"
                    >Linen Description *</label
                  >
                  <input
                    id="order-items"
                    type="text"
                    class="form-input"
                    [class.has-error]="
                      itemsRef.invalid && (itemsRef.touched || submitted())
                    "
                    [(ngModel)]="itemsSummary"
                    name="itemsSummary"
                    #itemsRef="ngModel"
                    placeholder="e.g. 50x King Sheets, 50x Duvets, 100x Bath Sheets"
                    required
                    [attr.aria-invalid]="
                      itemsRef.invalid && (itemsRef.touched || submitted())
                    "
                  />
                  @if (itemsRef.invalid && (itemsRef.touched || submitted())) {
                    <span class="field-error" role="alert"
                      >Linen items summary is required</span
                    >
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="order-driver"
                    >Assign Driver</label
                  >
                  <select
                    id="order-driver"
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
                  <label class="form-label" for="order-plant"
                    >Assign Subcontract Plant</label
                  >
                  <select
                    id="order-plant"
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
                  <label class="form-label" for="order-notes"
                    >Special Delivery / Access Instructions</label
                  >
                  <input
                    id="order-notes"
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
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" (click)="closeModal()">
                Cancel
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="isSubmitting()"
              >
                {{ isSubmitting() ? 'Adding...' : '✓ Add Order to Kanban' }}
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
      width: min(100%, 640px);
      max-height: min(90dvh, 52rem);
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
      flex-shrink: 0;
      background: var(--color-bg-surface);
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
      flex-shrink: 0;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }

    .modal-body {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
      box-sizing: border-box;
    }

    .form-success-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      padding: 0.75rem;
      border-radius: var(--radius-md, 0.5rem);
      font-weight: 600;
      font-size: var(--text-sm, 0.875rem);
      text-align: center;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-default);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .form-input,
    .form-select {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      min-width: 0;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 9px 12px;
      font-size: 0.8125rem;
      color: var(--color-text-default);
      text-overflow: ellipsis;
      transition:
        border-color 0.2s,
        box-shadow 0.2s;

      &:focus {
        outline: none;
        border-color: var(--color-accent-default);
        box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
      }
    }

    .form-input.has-error {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.04);
    }

    .form-input.has-error:focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }

    .field-error {
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 500;
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
      align-items: center;
      gap: 10px;
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      border-top: 1px solid var(--color-border-default);
      background: var(--color-bg-surface);
      flex-shrink: 0;
      flex-wrap: wrap;
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
        grid-column: 1 / -1;
      }
      .modal-card {
        max-height: 94dvh;
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

  submitted = signal(false);
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);

  closeModal(): void {
    this.submitted.set(false);
    this.successMessage.set(null);
    this.store.closeAddOrderModal();
  }

  submitOrder(): void {
    this.submitted.set(true);

    if (
      !this.clientName.trim() ||
      this.clientName.trim().length < 2 ||
      !this.address.trim() ||
      this.address.trim().length < 5 ||
      !this.itemsSummary.trim()
    ) {
      return;
    }

    this.isSubmitting.set(true);
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

    this.successMessage.set(`✓ Order ${newId} added to Intake queue!`);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.clientName = '';
      this.address = '';
      this.specialInstructions = '';
      this.closeModal();
    }, 700);
  }
}
