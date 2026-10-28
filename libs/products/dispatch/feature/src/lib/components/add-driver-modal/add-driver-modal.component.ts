import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { Driver, DriverStatus } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-add-driver-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAddDriverModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">🚐</span>
              <div>
                <h2 class="modal-title">Register Driver & Van</h2>
                <span class="modal-sub">
                  Add courier van to the London fleet schedule
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

          <form class="modal-form" (ngSubmit)="submitDriver()" novalidate>
            <div class="modal-body">
              @if (successMessage()) {
                <div class="form-success-banner" role="status">
                  {{ successMessage() }}
                </div>
              }

              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label" for="driver-name"
                    >Driver Full Name *</label
                  >
                  <input
                    id="driver-name"
                    type="text"
                    class="form-input"
                    [class.has-error]="
                      nameRef.invalid && (nameRef.touched || submitted())
                    "
                    [(ngModel)]="name"
                    name="name"
                    #nameRef="ngModel"
                    placeholder="e.g. Tariq Mahmood, James Wilson..."
                    required
                    minlength="2"
                    [attr.aria-invalid]="
                      nameRef.invalid && (nameRef.touched || submitted())
                    "
                  />
                  @if (nameRef.invalid && (nameRef.touched || submitted())) {
                    <span class="field-error" role="alert"
                      >Driver full name is required (min 2 characters)</span
                    >
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-phone"
                    >Contact Phone / WhatsApp *</label
                  >
                  <input
                    id="driver-phone"
                    type="text"
                    class="form-input"
                    [class.has-error]="
                      phoneRef.invalid && (phoneRef.touched || submitted())
                    "
                    [(ngModel)]="phone"
                    name="phone"
                    #phoneRef="ngModel"
                    placeholder="e.g. +44 7700 900821"
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
                  <label class="form-label" for="driver-shift"
                    >Assigned Shift *</label
                  >
                  <select
                    id="driver-shift"
                    class="form-select"
                    [(ngModel)]="activeShift"
                    name="activeShift"
                    required
                  >
                    <option value="shift_a">Shift A (07:00 - 13:00)</option>
                    <option value="shift_b">Shift B (13:00 - 19:00)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-vehicle"
                    >Vehicle Make & Model *</label
                  >
                  <input
                    id="driver-vehicle"
                    type="text"
                    class="form-input"
                    [(ngModel)]="vehicle"
                    name="vehicle"
                    placeholder="e.g. Mercedes Sprinter LWB, Ford Transit Custom"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-reg"
                    >Registration Plate *</label
                  >
                  <input
                    id="driver-reg"
                    type="text"
                    class="form-input"
                    [class.has-error]="
                      regRef.invalid && (regRef.touched || submitted())
                    "
                    [(ngModel)]="registration"
                    name="registration"
                    #regRef="ngModel"
                    placeholder="e.g. LD72 XPR, VO23 GHL"
                    required
                    [attr.aria-invalid]="
                      regRef.invalid && (regRef.touched || submitted())
                    "
                  />
                  @if (regRef.invalid && (regRef.touched || submitted())) {
                    <span class="field-error" role="alert"
                      >Registration plate is required</span
                    >
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-zone"
                    >Zone Coverage *</label
                  >
                  <input
                    id="driver-zone"
                    type="text"
                    class="form-input"
                    [(ngModel)]="zone"
                    name="zone"
                    placeholder="e.g. West End (W1/SW1), City & Shoreditch (EC/E1)"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-location"
                    >Current / Starting Location *</label
                  >
                  <input
                    id="driver-location"
                    type="text"
                    class="form-input"
                    [(ngModel)]="currentLocation"
                    name="currentLocation"
                    placeholder="e.g. Park Lane / Mayfair or Stratford Depot"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-capacity"
                    >Max Payload Capacity (kg) *</label
                  >
                  <input
                    id="driver-capacity"
                    type="number"
                    class="form-input"
                    [(ngModel)]="capacityKg"
                    name="capacityKg"
                    min="200"
                    max="3500"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="driver-status"
                    >Initial Status</label
                  >
                  <select
                    id="driver-status"
                    class="form-select"
                    [(ngModel)]="status"
                    name="status"
                  >
                    <option value="idle">Idle / Ready at Base</option>
                    <option value="on_route">Active on Route</option>
                  </select>
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
                {{
                  isSubmitting() ? 'Registering...' : '✓ Register Van & Driver'
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

    .modal-form {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
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
      box-sizing: border-box;
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-3, 0.75rem);
      width: 100%;
      box-sizing: border-box;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .form-label {
      font-size: var(--text-xs, 0.75rem);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
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
      background: var(--color-bg-subtle, rgba(255, 255, 255, 0.04));
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.375rem);
      padding: 0.55rem 0.75rem;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-default);
      outline: none;
      text-overflow: ellipsis;
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
      align-items: center;
      gap: var(--space-3, 0.75rem);
      padding: 0.875rem 1.25rem;
      border-top: 1px solid var(--color-border-default);
      background: var(--color-bg-surface);
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
        grid-column: 1 / -1;
      }
      .modal-card {
        max-height: 94dvh;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDriverModalComponent {
  readonly store = inject(DispatchStore);

  name = '';
  phone = '';
  vehicle = 'Mercedes Sprinter LWB';
  registration = '';
  zone = 'West End & City';
  currentLocation = 'Park Lane Depot';
  capacityKg = 1200;
  activeShift: 'shift_a' | 'shift_b' = 'shift_a';
  status: DriverStatus = 'idle';

  submitted = signal(false);
  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);

  closeModal(): void {
    this.submitted.set(false);
    this.successMessage.set(null);
    this.store.closeAddDriverModal();
  }

  submitDriver(): void {
    this.submitted.set(true);

    if (
      !this.name.trim() ||
      this.name.trim().length < 2 ||
      !this.phone.trim() ||
      !this.registration.trim()
    ) {
      return;
    }

    this.isSubmitting.set(true);
    const newId = `DRV-${Math.floor(10 + Math.random() * 89)}`;

    const newDriver: Driver = {
      id: newId,
      name: this.name.trim(),
      phone: this.phone.trim(),
      vehicle: this.vehicle.trim(),
      registration: this.registration.trim().toUpperCase(),
      zone: this.zone.trim(),
      status: this.status,
      activeShift: this.activeShift,
      currentLocation: this.currentLocation.trim(),
      assignedOrderIds: [],
      completedOrderIds: [],
      stops: [],
      etaNextStop: null,
      incidentNotice: null,
      capacityKg: Number(this.capacityKg) || 1000,
      currentPayloadKg: 0,
    };

    this.store.addDriver(newDriver);

    this.successMessage.set('✓ Driver registered successfully!');
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.name = '';
      this.phone = '';
      this.registration = '';
      this.closeModal();
    }, 700);
  }
}
