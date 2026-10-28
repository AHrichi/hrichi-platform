import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { Driver, DriverStatus } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-add-driver-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showAddDriverModal()) {
      <div class="modal-overlay" (click)="store.closeAddDriverModal()">
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
              (click)="store.closeAddDriverModal()"
            >
              ✕
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="submitDriver()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Driver Full Name *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="name"
                  name="name"
                  placeholder="e.g. Tariq Mahmood, James Wilson..."
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Contact Phone / WhatsApp *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="phone"
                  name="phone"
                  placeholder="e.g. +44 7700 900821"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Assigned Shift *</label>
                <select
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
                <label class="form-label">Vehicle Make & Model *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="vehicle"
                  name="vehicle"
                  placeholder="e.g. Mercedes Sprinter LWB, Ford Transit Custom"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Registration Plate *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="registration"
                  name="registration"
                  placeholder="e.g. LD72 XPR, VO23 GHL"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Zone Coverage *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="zone"
                  name="zone"
                  placeholder="e.g. West End (W1/SW1), City & Shoreditch (EC/E1)"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Current / Starting Location *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="currentLocation"
                  name="currentLocation"
                  placeholder="e.g. Park Lane / Mayfair or Stratford Depot"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Max Payload Capacity (kg) *</label>
                <input
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
                <label class="form-label">Initial Status</label>
                <select class="form-select" [(ngModel)]="status" name="status">
                  <option value="idle">Idle / Ready at Base</option>
                  <option value="on_route">Active on Route</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn-cancel"
                (click)="store.closeAddDriverModal()"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-submit"
                [disabled]="
                  !name.trim() || !phone.trim() || !registration.trim()
                "
              >
                ✓ Register Van & Driver
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

  submitDriver(): void {
    if (!this.name.trim() || !this.phone.trim() || !this.registration.trim())
      return;

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

    // Reset form
    this.name = '';
    this.phone = '';
    this.registration = '';
  }
}
