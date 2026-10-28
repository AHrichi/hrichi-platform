import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import type { Driver } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-driver-dispatch',
  imports: [CommonModule],
  template: `
    <div class="dispatch-fleet-wrapper">
      <div class="fleet-intro-bar">
        <div>
          <h2 class="section-title">Fleet Dispatch & Driver Logistics</h2>
          <p class="section-subtitle">
            Live telemetry, route progression, vehicle capacity, and roadside
            breakdown contingencies.
          </p>
        </div>
        <div class="fleet-actions">
          <button
            type="button"
            class="add-driver-btn"
            (click)="store.openAddDriverModal()"
          >
            + Register Driver & Van
          </button>
          @if (store.drivers().length > 1) {
            <button
              type="button"
              class="emergency-rapid-btn"
              (click)="store.reassignStops('drv-harpreet', 'drv-carlos')"
            >
              ⚡ Reassign Stranded Stops to Standby Carlos
            </button>
          }
        </div>
      </div>

      <!-- Drivers Grid -->
      <div class="drivers-grid">
        @for (driver of store.drivers(); track driver.id) {
          <div
            class="driver-card"
            [class.is-breakdown]="driver.status === 'breakdown'"
            [class.is-delayed]="driver.status === 'delayed'"
          >
            <!-- Card Header -->
            <div class="driver-card-header">
              <div class="driver-profile">
                <span class="driver-avatar-box">
                  {{
                    driver.status === 'breakdown'
                      ? '🚨'
                      : driver.status === 'delayed'
                        ? '⚠️'
                        : '🚚'
                  }}
                </span>
                <div>
                  <h3 class="driver-name">{{ driver.name }}</h3>
                  <span class="driver-zone">{{ driver.zone }}</span>
                </div>
              </div>

              <div class="header-right-actions">
                <span
                  class="status-badge"
                  [class.status-route]="driver.status === 'on_route'"
                  [class.status-breakdown]="driver.status === 'breakdown'"
                  [class.status-delayed]="driver.status === 'delayed'"
                  [class.status-idle]="driver.status === 'idle'"
                >
                  {{ driver.status | uppercase }}
                </span>
                <button
                  type="button"
                  class="delete-driver-btn"
                  (click)="store.deleteDriver(driver.id)"
                  title="Remove Driver"
                  aria-label="Remove Driver"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Vehicle & Reg -->
            <div class="vehicle-info-bar">
              <div class="veh-item">
                <span class="veh-label">Van:</span>
                <span class="veh-val">{{ driver.vehicle }}</span>
              </div>
              <div class="veh-item">
                <span class="veh-label">Plate:</span>
                <span class="reg-plate">{{ driver.registration }}</span>
              </div>
            </div>

            <!-- Capacity Progress Bar -->
            <div class="payload-bar-wrap">
              <div class="payload-meta">
                <span class="payload-label">Payload Capacity:</span>
                <span class="payload-val">
                  {{ driver.currentPayloadKg }} kg / {{ driver.capacityKg }} kg
                  ({{
                    Math.round(
                      (driver.currentPayloadKg / driver.capacityKg) * 100
                    )
                  }}%)
                </span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  [style.width.%]="
                    (driver.currentPayloadKg / driver.capacityKg) * 100
                  "
                  [class.is-full]="
                    driver.currentPayloadKg > driver.capacityKg * 0.85
                  "
                ></div>
              </div>
            </div>

            <!-- Location & Incident Alert -->
            <div class="location-box">
              <span class="loc-icon">📍</span>
              <span class="loc-text">{{ driver.currentLocation }}</span>
            </div>

            @if (driver.incidentNotice) {
              <div class="incident-alert-box">
                {{ driver.incidentNotice }}
              </div>
            }

            <!-- Stops Sequence -->
            <div class="stops-section">
              <h4 class="stops-header">
                Route Schedule ({{ driver.assignedOrderIds.length }} stops
                assigned)
              </h4>

              <div class="stops-list">
                @for (stop of driver.stops; track stop.orderId) {
                  <div class="stop-item" [class.is-done]="stop.completed">
                    <span class="stop-status-icon">
                      {{ stop.completed ? '✅' : '⏳' }}
                    </span>
                    <div class="stop-content">
                      <div class="stop-title-row">
                        <span class="stop-name">{{ stop.clientName }}</span>
                        <span class="stop-time">{{ stop.targetTime }}</span>
                      </div>
                      <span class="stop-addr">{{ stop.address }}</span>
                      @if (stop.notes) {
                        <span class="stop-notes">Note: {{ stop.notes }}</span>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="no-stops">
                    <span>Standby vehicle — available for rapid rescue.</span>
                  </div>
                }
              </div>
            </div>

            <!-- Driver Actions Footer -->
            <div class="driver-card-footer">
              <button
                type="button"
                class="call-btn"
                (click)="callDriver(driver)"
              >
                📞 VoIP Call Driver
              </button>

              @if (driver.status === 'breakdown') {
                <button
                  type="button"
                  class="reroute-btn"
                  (click)="store.reassignStops('drv-harpreet', 'drv-carlos')"
                >
                  ⚡ Rescue Stops
                </button>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-fleet-card">
            <span class="empty-fleet-icon">🚐</span>
            <h3 class="empty-fleet-title">No Fleet Drivers Registered</h3>
            <p class="empty-fleet-desc">
              Register delivery vans, set London zone coverage and payload
              limits to start dispatching orders.
            </p>
            <button
              type="button"
              class="add-driver-btn"
              (click)="store.openAddDriverModal()"
            >
              + Register First Driver & Van
            </button>
          </div>
        }
      </div>

      <!-- Simulated VoIP Call Modal -->
      @if (callingDriver()) {
        <div class="voip-modal-overlay">
          <div class="voip-modal-card">
            <div class="voip-pulse-box">
              <span class="voip-icon">📞</span>
            </div>
            <h3 class="voip-title">Calling {{ callingDriver()?.name }}</h3>
            <p class="voip-sub">
              {{ callingDriver()?.phone }} · Zone {{ callingDriver()?.zone }}
            </p>
            <p class="voip-status">
              Connecting via VoIP softphone integration...
            </p>
            <button
              type="button"
              class="hangup-btn"
              (click)="callingDriver.set(null)"
            >
              End Call ✖
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .dispatch-fleet-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .fleet-intro-bar {
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

    .section-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .section-subtitle {
      margin: 2px 0 0;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .fleet-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      flex-wrap: wrap;
    }

    .add-driver-btn {
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

    .emergency-rapid-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    /* Drivers Grid */
    .drivers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-4, 1rem);
    }

    .driver-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      gap: var(--space-3, 0.75rem);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      transition: border-color 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
      }

      &.is-breakdown {
        border-color: rgba(239, 68, 68, 0.6);
        background: rgba(239, 68, 68, 0.02);
      }

      &.is-delayed {
        border-color: rgba(245, 158, 11, 0.6);
      }
    }

    .driver-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .driver-profile {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .driver-avatar-box {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .driver-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .driver-zone {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .status-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;

      &.status-route {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
      &.status-breakdown {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
      &.status-delayed {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }
      &.status-idle {
        background: rgba(107, 114, 128, 0.15);
        color: #6b7280;
      }
    }

    .vehicle-info-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 6px 10px;
      font-size: 0.75rem;
    }

    .veh-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .veh-label {
      color: var(--color-text-muted);
    }

    .veh-val {
      font-weight: 600;
      color: var(--color-text-default);
    }

    .reg-plate {
      font-family: var(--font-family-mono, monospace);
      font-weight: 700;
      background: #facc15;
      color: #000;
      padding: 1px 6px;
      border-radius: 3px;
    }

    /* Capacity Progress */
    .payload-bar-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .payload-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .payload-label {
      color: var(--color-text-muted);
    }

    .payload-val {
      font-weight: 600;
      color: var(--color-text-default);
    }

    .progress-track {
      height: 6px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-accent-default);
      border-radius: 9999px;
      transition: width 0.3s ease;

      &.is-full {
        background: #ef4444;
      }
    }

    .location-box {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .incident-alert-box {
      background: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
      padding: 6px 10px;
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 600;
      border-radius: 0 4px 4px 0;
    }

    /* Stops List */
    .stops-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .stops-header {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted);
    }

    .stops-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 220px;
      overflow-y: auto;
    }

    .stop-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 8px 10px;
      font-size: 0.75rem;

      &.is-done {
        opacity: 0.6;
        background: rgba(16, 185, 129, 0.05);
      }
    }

    .stop-status-icon {
      font-size: 0.875rem;
      margin-top: 1px;
    }

    .stop-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .stop-title-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .stop-name {
      font-weight: 700;
      color: var(--color-text-default);
    }

    .stop-time {
      font-family: var(--font-family-mono, monospace);
      font-size: 0.6875rem;
      color: var(--color-accent-default);
    }

    .stop-addr {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .stop-notes {
      font-size: 0.625rem;
      color: var(--color-accent-default);
      margin-top: 2px;
    }

    .no-stops {
      padding: var(--space-4, 1rem);
      text-align: center;
      border: 1px dashed var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Driver Card Footer */
    .driver-card-footer {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border-default);
    }

    .call-btn {
      flex: 1;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 8px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }
    }

    .reroute-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;

      &:hover {
        filter: brightness(1.1);
      }
    }

    /* VoIP Modal */
    .voip-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .voip-modal-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-6, 1.5rem);
      width: 90%;
      max-width: 360px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .voip-pulse-box {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      border: 2px solid #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      animation: pulseAlert 1.5s infinite ease-in-out;
    }

    .voip-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-text-default);
    }

    .voip-sub {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .voip-status {
      margin: 4px 0 12px;
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 600;
    }

    .hangup-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .header-right-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .delete-driver-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      padding: 2px 5px;
      border-radius: 4px;
      line-height: 1;
      opacity: 0.6;
      transition: all 0.15s ease;

      &:hover {
        opacity: 1;
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    }

    .empty-fleet-card {
      grid-column: 1 / -1;
      background: var(--color-bg-surface);
      border: 2px dashed var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-8, 2.5rem) var(--space-4, 1rem);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-2, 0.5rem);
    }

    .empty-fleet-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-2, 0.5rem);
    }

    .empty-fleet-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      color: var(--color-text-default);
      margin: 0;
    }

    .empty-fleet-desc {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted);
      max-width: 420px;
      margin: 0 0 var(--space-3, 0.75rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverDispatchComponent {
  readonly store = inject(DispatchStore);
  readonly Math = Math;
  readonly callingDriver = signal<Driver | null>(null);

  callDriver(driver: Driver): void {
    this.callingDriver.set(driver);
  }
}
