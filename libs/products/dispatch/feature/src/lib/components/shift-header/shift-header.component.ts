import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import { AhButton } from '@ah/ui';

@Component({
  selector: 'ah-shift-header',
  imports: [CommonModule, AhButton],
  template: `
    <header class="ops-header">
      <!-- Top Bar: Title, Live Time, Shift Toggle, Primary Actions -->
      <div class="top-row">
        <div class="brand-zone">
          <div class="brand-title-wrap">
            <div class="logo-box">
              <span class="logo-icon">🧺</span>
            </div>
            <div>
              <div class="brand-title">
                <h1>PulseOps</h1>
                <span class="status-dot"></span>
                <span class="status-text">Live Operations Hub</span>
              </div>
              <p class="brand-subtitle">
                Commercial Laundry & Dispatch Control Center · London Zones 1–4
              </p>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <!-- London Live Clock & Shift Pill -->
          <div class="shift-pill">
            <span class="clock-icon">🕒</span>
            <span class="clock-time">{{ store.londonTime() }} UK</span>
            <span class="shift-divider">|</span>
            <span class="shift-name">
              {{
                store.activeShift() === 'shift_a'
                  ? 'Shift A (07:00–13:00)'
                  : 'Shift B (13:00–19:00)'
              }}
            </span>
            <button
              type="button"
              class="shift-switch-btn"
              (click)="store.toggleShift()"
              title="Switch between Shift A and Shift B"
            >
              🔄 Switch Shift
            </button>
          </div>

          <!-- Active Coordinator Card -->
          <div class="coordinator-card">
            <span class="coordinator-avatar">{{
              store.activeCoordinator().avatar
            }}</span>
            <div class="coordinator-info">
              <span class="coord-label">Active Coordinator</span>
              <span class="coord-name">{{
                store.activeCoordinator().name
              }}</span>
            </div>
          </div>

          <!-- Handover & Sync Buttons -->
          <div class="action-buttons">
            <button
              type="button"
              class="header-add-order-btn"
              (click)="store.openAddOrderModal()"
              title="Create new commercial laundry order"
            >
              + New Order
            </button>

            <button
              type="button"
              ahButton="secondary"
              size="sm"
              [disabled]="store.isSyncingSheets()"
              (click)="store.syncGoogleSheets()"
              title="Sync with Google Sheets"
            >
              @if (store.isSyncingSheets()) {
                <span class="spinner">⏳</span> Syncing...
              } @else {
                <span>📊 Sync Sheets</span>
              }
            </button>

            <button
              type="button"
              ahButton="primary"
              size="sm"
              (click)="store.openHandoverModal()"
              title="Generate End-of-Shift Handover Report"
            >
              📋 Shift Handover
            </button>
          </div>
        </div>
      </div>

      <!-- Urgent Incident Banner (Ticker) -->
      @if (store.urgentIncident(); as incident) {
        <div
          class="incident-banner"
          [class.is-critical]="incident.severity === 'critical'"
        >
          <div class="incident-content">
            <span class="incident-icon">🚨</span>
            <div class="incident-text">
              <strong>OPERATIONAL ALERT:</strong>
              <span>{{ incident.title }}</span>
              <span class="incident-desc">— {{ incident.description }}</span>
            </div>
          </div>
          <div class="incident-actions">
            @if (incident.driverId === 'drv-harpreet') {
              <button
                type="button"
                class="banner-action-btn"
                (click)="store.reassignStops('drv-harpreet', 'drv-carlos')"
              >
                ⚡ Rapid Reroute to Standby Carlos
              </button>
            }
            <button
              type="button"
              class="banner-resolve-btn"
              (click)="store.resolveIncident(incident.id)"
            >
              ✓ Dismiss
            </button>
          </div>
        </div>
      }

      <!-- Operations Barometer (KPI Cells) -->
      <div class="barometer-grid">
        <div class="baro-card">
          <span class="baro-label">Orders Completed</span>
          <div class="baro-val-wrap">
            <span class="baro-val">{{ store.completedOrdersCount() }}</span>
            <span class="baro-total">/ {{ store.totalOrdersCount() }}</span>
          </div>
          <span class="baro-sub"
            >{{ store.pendingOrdersCount() }} pending delivery</span
          >
        </div>

        <div class="baro-card">
          <span class="baro-label">Total Delivered Weight</span>
          <div class="baro-val-wrap">
            <span class="baro-val">{{ store.totalWeightDeliveredKg() }}</span>
            <span class="baro-unit">kg</span>
          </div>
          <span class="baro-sub"
            >of {{ store.totalWeightProcessedKg() }} kg daily target</span
          >
        </div>

        <div class="baro-card">
          <span class="baro-label">SLA On-Time Rate</span>
          <div class="baro-val-wrap">
            <span class="baro-val text-success"
              >{{ store.onTimeRatePct() }}%</span
            >
          </div>
          <span class="baro-sub">Hospitality 14:00 check-in SLA</span>
        </div>

        <div class="baro-card">
          <span class="baro-label">Active Fleet Status</span>
          <div class="baro-val-wrap">
            <span class="baro-val">{{ store.activeFleetCount() }}</span>
            <span class="baro-total">/ 4 Vans</span>
          </div>
          <span
            class="baro-sub"
            [class.text-danger]="store.delayedFleetCount() > 0"
          >
            {{
              store.delayedFleetCount() > 0
                ? store.delayedFleetCount() + ' delayed / breakdown'
                : 'All vans on schedule'
            }}
          </span>
        </div>

        <div class="baro-card">
          <span class="baro-label">Subcontractor Plants</span>
          <div class="baro-val-wrap">
            <span class="baro-val">3</span>
            <span class="baro-unit">Active</span>
          </div>
          <span class="baro-sub">Tunnel washers & finishing</span>
        </div>

        <div class="baro-card">
          <span class="baro-label">Linen Stock Valuation</span>
          <div class="baro-val-wrap">
            <span class="baro-val"
              >£{{ store.stockTotalValuationGbp().toLocaleString() }}</span
            >
          </div>
          <span
            class="baro-sub"
            [class.text-warning]="store.lowStockCount() > 0"
          >
            {{
              store.lowStockCount() > 0
                ? store.lowStockCount() + ' SKUs below reserve'
                : 'Stock levels optimal'
            }}
          </span>
        </div>
      </div>
    </header>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .ops-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      margin-bottom: var(--space-4, 1rem);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .top-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4, 1rem);
    }

    .brand-zone {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .brand-title-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .logo-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg, 0.75rem);
      background: linear-gradient(
        135deg,
        rgba(37, 99, 235, 0.15),
        rgba(6, 182, 212, 0.2)
      );
      border: 1px solid rgba(37, 99, 235, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);

      h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--color-text-default);
      }
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      display: inline-block;
    }

    .status-text {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #10b981;
    }

    .brand-subtitle {
      margin: 2px 0 0;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }

    .shift-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: 9999px;
      font-size: 0.8125rem;
      color: var(--color-text-default);
      font-weight: 500;
    }

    .clock-icon {
      font-size: 0.875rem;
    }

    .clock-time {
      font-family: var(--font-family-mono, monospace);
      font-weight: 700;
      color: var(--color-accent-default);
    }

    .shift-divider {
      color: var(--color-border-default);
      margin: 0 2px;
    }

    .shift-name {
      font-weight: 600;
    }

    .shift-switch-btn {
      background: none;
      border: none;
      color: var(--color-accent-default);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: var(--radius-sm, 0.25rem);
      margin-left: 4px;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(37, 99, 235, 0.1);
      }
    }

    .coordinator-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
    }

    .coordinator-avatar {
      font-size: 1.25rem;
    }

    .coordinator-info {
      display: flex;
      flex-direction: column;
    }

    .coord-label {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .coord-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-add-order-btn {
      background: var(--color-accent-default, #0284c7);
      color: var(--color-accent-on, #fff);
      border: none;
      padding: 6px 12px;
      border-radius: var(--radius-md, 0.375rem);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .spinner {
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

    /* Incident Banner */
    .incident-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 0.75rem);
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md, 0.5rem);
      color: var(--color-text-default);
      font-size: 0.8125rem;
      animation: pulseAlert 2.5s infinite ease-in-out;
    }

    @keyframes pulseAlert {
      0%,
      100% {
        border-color: rgba(239, 68, 68, 0.3);
      }
      50% {
        border-color: rgba(239, 68, 68, 0.8);
      }
    }

    .incident-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .incident-icon {
      font-size: 1.1rem;
    }

    .incident-text strong {
      color: #ef4444;
      margin-right: 4px;
    }

    .incident-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .banner-action-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: var(--radius-sm, 0.25rem);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .banner-resolve-btn {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 5px 10px;
      border-radius: var(--radius-sm, 0.25rem);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: var(--color-bg-surface);
      }
    }

    /* Barometer Grid */
    .barometer-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--space-3, 0.75rem);
    }

    .baro-card {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      gap: 2px;
      transition:
        transform 0.15s ease,
        border-color 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
      }
    }

    .baro-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted);
    }

    .baro-val-wrap {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin: 4px 0 2px;
    }

    .baro-val {
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--color-text-default);
    }

    .baro-total {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .baro-unit {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .baro-sub {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-success {
      color: #10b981 !important;
    }
    .text-danger {
      color: #ef4444 !important;
      font-weight: 600;
    }
    .text-warning {
      color: #f59e0b !important;
    }

    @media (max-width: 1024px) {
      .barometer-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .ops-header {
        padding: var(--space-3, 0.75rem);
        gap: var(--space-3, 0.75rem);
      }

      .top-row {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .shift-pill {
        justify-content: space-between;
      }

      .action-buttons {
        width: 100%;

        button {
          flex: 1;
        }
      }

      .barometer-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .incident-banner {
        flex-direction: column;
        align-items: stretch;
      }

      .incident-actions {
        width: 100%;
        margin-top: 6px;

        button {
          flex: 1;
        }
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShiftHeaderComponent {
  readonly store = inject(DispatchStore);
}
