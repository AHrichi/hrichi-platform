import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { SubcontractorPlant } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-add-plant-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAddPlantModal()) {
      <div class="modal-overlay" (click)="closeModal()">
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
              (click)="closeModal()"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="submitPlant()" novalidate>
            @if (successMessage()) {
              <div class="form-success-banner" role="status">
                {{ successMessage() }}
              </div>
            }

            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label" for="plant-name">Plant Name *</label>
                <input
                  id="plant-name"
                  type="text"
                  class="form-input"
                  [class.has-error]="
                    nameRef.invalid && (nameRef.touched || submitted())
                  "
                  [(ngModel)]="name"
                  name="name"
                  #nameRef="ngModel"
                  placeholder="e.g. Thames Industrial Laundries, Acton Royal Wash..."
                  required
                  minlength="2"
                  [attr.aria-invalid]="
                    nameRef.invalid && (nameRef.touched || submitted())
                  "
                />
                @if (nameRef.invalid && (nameRef.touched || submitted())) {
                  <span class="field-error" role="alert"
                    >Plant name is required (min 2 characters)</span
                  >
                }
              </div>

              <div class="form-group full-width">
                <label class="form-label" for="plant-location"
                  >Plant Facility Address *</label
                >
                <input
                  id="plant-location"
                  type="text"
                  class="form-input"
                  [class.has-error]="
                    locRef.invalid && (locRef.touched || submitted())
                  "
                  [(ngModel)]="location"
                  name="location"
                  #locRef="ngModel"
                  placeholder="e.g. Unit 4, Park Royal Trading Estate, London"
                  required
                  minlength="5"
                  [attr.aria-invalid]="
                    locRef.invalid && (locRef.touched || submitted())
                  "
                />
                @if (locRef.invalid && (locRef.touched || submitted())) {
                  <span class="field-error" role="alert"
                    >Plant address is required</span
                  >
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="plant-postcode"
                  >Postal Code *</label
                >
                <input
                  id="plant-postcode"
                  type="text"
                  class="form-input"
                  [(ngModel)]="postalCode"
                  name="postalCode"
                  placeholder="e.g. NW10 7QQ, E16 2EZ"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="plant-spec"
                  >Speciality Wash *</label
                >
                <select
                  id="plant-spec"
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
                <label class="form-label" for="plant-capacity"
                  >Daily Capacity (kg) *</label
                >
                <input
                  id="plant-capacity"
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
                <label class="form-label" for="plant-contact"
                  >Plant Manager / Contact</label
                >
                <input
                  id="plant-contact"
                  type="text"
                  class="form-input"
                  [(ngModel)]="contactPerson"
                  name="contactPerson"
                  placeholder="e.g. Vikram Sharma, Dave Mitchell"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="plant-phone"
                  >Production Phone / WhatsApp *</label
                >
                <input
                  id="plant-phone"
                  type="text"
                  class="form-input"
                  [class.has-error]="
                    phoneRef.invalid && (phoneRef.touched || submitted())
                  "
                  [(ngModel)]="phone"
                  name="phone"
                  #phoneRef="ngModel"
                  placeholder="e.g. +44 20 8965 4100"
                  required
                  minlength="7"
                  [attr.aria-invalid]="
                    phoneRef.invalid && (phoneRef.touched || submitted())
                  "
                />
                @if (phoneRef.invalid && (phoneRef.touched || submitted())) {
                  <span class="field-error" role="alert"
                    >Valid contact number is required</span
                  >
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="plant-email"
                  >Dispatch Email</label
                >
                <input
                  id="plant-email"
                  type="email"
                  class="form-input"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="e.g. dispatch@thameslaundry.co.uk"
                />
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
                {{
                  isSubmitting()
                    ? 'Connecting...'
                    : '✓ Connect Subcontractor Plant'
                }}
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
      flex-shrink: 0;
    }

    .close-btn:hover {
      background: var(--color-bg-muted);
      color: var(--color-text-default);
    }

    .modal-body {
      padding: var(--space-5, 1.25rem);
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .form-success-banner {
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
      padding: 0.75rem;
      border-radius: var(--radius-md, 0.375rem);
      font-weight: 600;
      font-size: var(--text-sm, 0.875rem);
      text-align: center;
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
      transition:
        border-color 0.2s,
        box-shadow 0.2s;
    }

    .form-input:focus,
    .form-select:focus {
      border-color: var(--color-accent-blue, #0284c7);
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 0.75rem);
      padding-top: var(--space-4, 1rem);
      border-top: 1px solid var(--color-border-default);
      flex-shrink: 0;
      flex-wrap: wrap;
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
      .modal-card {
        max-height: 94dvh;
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

  submitted = signal(false);
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);

  closeModal(): void {
    this.submitted.set(false);
    this.successMessage.set(null);
    this.store.closeAddPlantModal();
  }

  submitPlant(): void {
    this.submitted.set(true);

    if (
      !this.name.trim() ||
      this.name.trim().length < 2 ||
      !this.location.trim() ||
      !this.phone.trim()
    ) {
      return;
    }

    this.isSubmitting.set(true);
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

    this.successMessage.set('✓ Partner laundry facility connected!');
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.name = '';
      this.location = '';
      this.contactPerson = '';
      this.phone = '';
      this.closeModal();
    }, 700);
  }
}
