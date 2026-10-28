import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';

@Component({
  selector: 'ah-emergency-courier-modal',
  imports: [CommonModule, FormsModule],
  template: `
    @if (store.showEmergencyModal()) {
      <div class="modal-overlay" (click)="store.closeEmergencyModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">🚨</span>
              <div>
                <h2 class="modal-title">
                  Book Emergency Courier (Addison Lee / Gophr)
                </h2>
                <span class="modal-sub">
                  Rapid roadside delivery rescue for high-risk hotel check-in
                  SLA
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closeEmergencyModal()"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            @if (targetOrder(); as order) {
              <div class="target-order-summary">
                <div class="order-top">
                  <span class="order-id">{{ order.id }}</span>
                  <span class="order-client">{{ order.clientName }}</span>
                </div>
                <p class="order-address">📍 {{ order.address }}</p>
                <div class="sla-warning">
                  <span
                    >⏰ Strict Deadline: {{ order.slaDeadline }} ({{
                      order.totalWeightKg
                    }}
                    kg clean linen)</span
                  >
                </div>
              </div>
            }

            <div class="courier-options">
              <label class="section-label"
                >Select Rapid Response Carrier:</label
              >

              <label
                class="courier-card"
                [class.is-selected]="selectedCourier() === 'Gophr London Rapid'"
              >
                <input
                  type="radio"
                  name="courierOption"
                  value="Gophr London Rapid"
                  [ngModel]="selectedCourier()"
                  (ngModelChange)="selectedCourier.set($event)"
                />
                <div class="courier-info">
                  <div class="c-top">
                    <strong>Gophr London On-Demand Courier</strong>
                    <span class="c-price">£28.50</span>
                  </div>
                  <span class="c-desc"
                    >Electric Cargo Van · 15m roadside arrival · Live GPS
                    link</span
                  >
                </div>
              </label>

              <label
                class="courier-card"
                [class.is-selected]="
                  selectedCourier() === 'Addison Lee Priority Van'
                "
              >
                <input
                  type="radio"
                  name="courierOption"
                  value="Addison Lee Priority Van"
                  [ngModel]="selectedCourier()"
                  (ngModelChange)="selectedCourier.set($event)"
                />
                <div class="courier-info">
                  <div class="c-top">
                    <strong>Addison Lee Express Cargo</strong>
                    <span class="c-price">£34.00</span>
                  </div>
                  <span class="c-desc"
                    >LWB Transit · 20m arrival · Tail-lift capable for laundry
                    cages</span
                  >
                </div>
              </label>

              <label
                class="courier-card"
                [class.is-selected]="
                  selectedCourier() === 'Stuart Logistics London'
                "
              >
                <input
                  type="radio"
                  name="courierOption"
                  value="Stuart Logistics London"
                  [ngModel]="selectedCourier()"
                  (ngModelChange)="selectedCourier.set($event)"
                />
                <div class="courier-info">
                  <div class="c-top">
                    <strong>Stuart Urban Dispatch</strong>
                    <span class="c-price">£22.00</span>
                  </div>
                  <span class="c-desc"
                    >Medium Van · 18m arrival · Direct dropoff to hotel loading
                    bay</span
                  >
                </div>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn-cancel"
              (click)="store.closeEmergencyModal()"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn-confirm-courier"
              (click)="confirmBooking()"
            >
              ⚡ Confirm & Dispatch Courier
            </button>
          </div>
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
      max-width: 520px;
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
      gap: 12px;
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .modal-title {
      margin: 0;
      font-size: 1.05rem;
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
      overflow-x: hidden;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .target-order-summary {
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md, 0.5rem);
      padding: 10px 14px;
    }

    .order-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .order-id {
      font-family: var(--font-family-mono, monospace);
      font-weight: 800;
      color: #ef4444;
      font-size: 0.8125rem;
    }

    .order-client {
      font-weight: 700;
      color: var(--color-text-default);
      font-size: 0.9375rem;
    }

    .order-address {
      margin: 2px 0 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .sla-warning {
      font-size: 0.75rem;
      font-weight: 700;
      color: #ef4444;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted);
      margin-bottom: 6px;
      display: block;
    }

    .courier-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .courier-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 12px;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
      }

      &.is-selected {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.04);
      }

      input[type='radio'] {
        margin-top: 3px;
      }
    }

    .courier-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .c-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--color-text-default);
    }

    .c-price {
      font-weight: 800;
      color: #10b981;
    }

    .c-desc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .modal-footer {
      padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
      border-top: 1px solid var(--color-border-default);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
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

    .btn-confirm-courier {
      background: #ef4444;
      color: white;
      border: none;
      padding: 9px 18px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmergencyCourierModalComponent {
  readonly store = inject(DispatchStore);
  readonly selectedCourier = signal('Gophr London Rapid');

  get targetOrder() {
    const id = this.store.emergencyOrderTargetId();
    return () => this.store.orders().find((o) => o.id === id);
  }

  confirmBooking(): void {
    const id = this.store.emergencyOrderTargetId();
    if (!id) return;
    this.store.dispatchEmergencyCourier(id, this.selectedCourier());
  }
}
