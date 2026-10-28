import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { SubcontractorPlant } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-add-plant-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAddPlantModal()) {
      <div class="modal-overlay" (click)="store.closeAddPlantModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">🏭</span>
              <div>
                <h2 class="modal-title">Partner Laundry Facility</h2>
                <span class="modal-sub">
                  Add external subcontractor commercial washing plant
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closeAddPlantModal()"
            >
              ✕
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="submitPlant()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Plant Name *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="name"
                  name="name"
                  placeholder="e.g. Thames Industrial Laundries, Acton Royal Wash..."
                  required
                />
              </div>

              <div class="form-group full-width">
                <label class="form-label">Plant Facility Address *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="location"
                  name="location"
                  placeholder="e.g. Unit 4, Park Royal Trading Estate, London"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Postal Code *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="postalCode"
                  name="postalCode"
                  placeholder="e.g. NW10 7QQ, E16 2EZ"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Speciality Wash *</label>
                <select
                  class="form-select"
                  [(ngModel)]="speciality"
                  name="speciality"
                  required
                >
                  <option
                    value="Hotel Bed Linen & Towels (Heavy Continuous Tunnel)"
                  >
                    Hotel Bed Linen & Towels (Continuous Tunnel)
                  </option>
                  <option
                    value="F&B Table Linen & Kitchen Linens (High Temp Degreasing)"
                  >
                    F&B Table Linen & Kitchen Linens
                  </option>
                  <option value="Short-Let / Airbnb Turn Linen (Rapid Express)">
                    Short-Let / Airbnb Turn Linen (Rapid Express)
                  </option>
                  <option value="Dry Cleaning & Luxury Uniforms">
                    Dry Cleaning & Luxury Uniforms
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Daily Capacity (kg) *</label>
                <input
                  type="number"
                  class="form-input"
                  [(ngModel)]="dailyCapacityKg"
                  name="dailyCapacityKg"
                  min="500"
                  max="15000"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Plant Manager / Contact *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="contactPerson"
                  name="contactPerson"
                  placeholder="e.g. Vikram Sharma, Dave Mitchell"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Production Phone / WhatsApp *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="phone"
                  name="phone"
                  placeholder="e.g. +44 20 8965 4100"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Dispatch Email</label>
                <input
                  type="email"
                  class="form-input"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="e.g. dispatch@thameslaundry.co.uk"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="store.closeAddPlantModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="!name.trim() || !location.trim() || !phone.trim()"
              >
                ✓ Connect Subcontractor Plant
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
export class AddPlantModalComponent {
  readonly store = inject(DispatchStore);

  name = '';
  location = '';
  postalCode = 'NW10 7QQ';
  speciality = 'Hotel Bed Linen & Towels (Heavy Continuous Tunnel)';
  dailyCapacityKg = 3000;
  contactPerson = '';
  phone = '';
  email = '';

  submitPlant(): void {
    if (!this.name.trim() || !this.location.trim() || !this.phone.trim())
      return;

    const newId = `plant-${Math.floor(100 + Math.random() * 899)}`;

    const newPlant: SubcontractorPlant = {
      id: newId,
      name: this.name.trim(),
      location: this.location.trim(),
      postalCode: this.postalCode.trim().toUpperCase(),
      speciality: this.speciality,
      dailyCapacityKg: Number(this.dailyCapacityKg) || 2500,
      currentLoadKg: 0,
      activeBatchCount: 0,
      readyForPickupCount: 0,
      defectRatePct: 0.0,
      slaPunctualityPct: 100,
      contactPerson: this.contactPerson.trim() || 'Plant Production Desk',
      phone: this.phone.trim(),
      email: this.email.trim() || `info@${newId}.laundry`,
      claims: [],
    };

    this.store.addSubcontractor(newPlant);

    // Reset form
    this.name = '';
    this.location = '';
    this.contactPerson = '';
    this.phone = '';
  }
}
