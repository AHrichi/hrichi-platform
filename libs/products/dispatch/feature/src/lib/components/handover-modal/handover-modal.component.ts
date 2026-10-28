import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import { generateHandoverWhatsAppText } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-handover-modal',
  imports: [CommonModule],
  template: `
    @if (store.showHandoverModal()) {
      <div class="modal-overlay" (click)="store.closeHandoverModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">📋</span>
              <div>
                <h2 class="modal-title">End-of-Shift Handover Report</h2>
                <span class="modal-sub">
                  {{ report().shift.toUpperCase() }} ({{ report().shiftHours }})
                  · {{ report().date }} · Generated at
                  {{ report().generatedAt }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closeHandoverModal()"
            >
              ✕
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <!-- Coordinators Info -->
            <div class="coord-bar">
              <div class="coord-box">
                <span class="c-tag">Outgoing Coordinator (Handing Over)</span>
                <strong class="c-val"
                  >👨‍💼 {{ report().outgoingCoordinator }}</strong
                >
              </div>
              <div class="coord-arrow">➔</div>
              <div class="coord-box">
                <span class="c-tag">Incoming Coordinator (Receiving)</span>
                <strong class="c-val"
                  >👩‍💼 {{ report().incomingCoordinator }}</strong
                >
              </div>
            </div>

            <!-- KPI Summary Grid -->
            <div class="kpi-grid">
              <div class="kpi-box">
                <span class="kpi-num"
                  >{{ report().ordersCompleted }} /
                  {{ report().ordersTarget }}</span
                >
                <span class="kpi-lbl">Orders Completed</span>
              </div>
              <div class="kpi-box">
                <span class="kpi-num">{{ report().totalKgDelivered }} kg</span>
                <span class="kpi-lbl">Delivered Linen</span>
              </div>
              <div class="kpi-box">
                <span class="kpi-num text-success"
                  >{{ report().onTimePunctualityPct }}%</span
                >
                <span class="kpi-lbl">SLA On-Time Rate</span>
              </div>
            </div>

            <!-- Incidents / Problems Section -->
            <div class="section-card">
              <h3 class="card-heading">
                ⚠️ Open Incidents & Roadblocks ({{
                  report().unresolvedIncidents.length
                }})
              </h3>
              @if (report().unresolvedIncidents.length > 0) {
                <div class="incident-list">
                  @for (inc of report().unresolvedIncidents; track inc.id) {
                    <div class="incident-item">
                      <span class="inc-badge">{{ inc.status }}</span>
                      <span class="inc-title">{{ inc.title }}</span>
                    </div>
                  }
                </div>
              } @else {
                <p class="clean-state">
                  ✅ All incidents resolved during this shift.
                </p>
              }
            </div>

            <!-- Pending Drops for Incoming Coordinator -->
            <div class="section-card">
              <h3 class="card-heading">
                ⏳ Pending Deliveries for Incoming Shift ({{
                  report().criticalPendingDrops.length
                }})
              </h3>
              <div class="pending-table-wrap">
                <table class="pending-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Client Name</th>
                      <th>SLA Target</th>
                      <th>Current Stage</th>
                      <th>Driver Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (
                      drop of report().criticalPendingDrops;
                      track drop.orderId
                    ) {
                      <tr>
                        <td class="font-mono">{{ drop.orderId }}</td>
                        <td>
                          <strong>{{ drop.clientName }}</strong>
                        </td>
                        <td class="font-mono text-accent">
                          {{ drop.deadline }}
                        </td>
                        <td>
                          <span class="stage-pill">{{ drop.status }}</span>
                        </td>
                        <td>{{ drop.driverName }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Handover Notes -->
            <div class="section-card">
              <h3 class="card-heading">📝 Coordinator Handover Notes</h3>
              <div class="notes-quote">"{{ report().notesForIncoming }}"</div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            @if (copiedText()) {
              <span class="copied-toast"
                >✓ WhatsApp format copied to clipboard!</span
              >
            }

            <button
              type="button"
              class="copy-wa-btn"
              (click)="copyWhatsAppText()"
            >
              💬 Copy WhatsApp Group Handover
            </button>

            <button type="button" class="print-btn" (click)="downloadReport()">
              📥 Download Report (.txt)
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
      max-width: 680px;
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
      font-size: 1.75rem;
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
      padding: 4px;

      &:hover {
        color: var(--color-text-default);
      }
    }

    .modal-body {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .coord-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 10px 16px;
    }

    .coord-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .c-tag {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }

    .c-val {
      font-size: 0.9375rem;
      color: var(--color-text-default);
    }

    .coord-arrow {
      font-size: 1.25rem;
      color: var(--color-accent-default);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .kpi-box {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
    }

    .kpi-num {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-text-default);
    }

    .kpi-lbl {
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      margin-top: 2px;
      text-transform: uppercase;
    }

    .text-success {
      color: #10b981 !important;
    }
    .text-accent {
      color: var(--color-accent-default) !important;
    }

    .section-card {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-heading {
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--color-text-default);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .incident-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .incident-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
    }

    .inc-badge {
      font-size: 0.625rem;
      font-weight: 800;
      background: #ef4444;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .inc-title {
      color: var(--color-text-default);
    }

    .clean-state {
      margin: 0;
      font-size: 0.8125rem;
      color: #10b981;
      font-weight: 600;
    }

    .pending-table-wrap {
      overflow-x: auto;
    }

    .pending-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;

      th {
        text-align: left;
        color: var(--color-text-muted);
        padding: 6px 8px;
        border-bottom: 1px solid var(--color-border-default);
      }

      td {
        padding: 6px 8px;
        border-bottom: 1px solid var(--color-border-default);
        color: var(--color-text-default);
      }
    }

    .stage-pill {
      background: rgba(37, 99, 235, 0.1);
      color: var(--color-accent-default);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .font-mono {
      font-family: var(--font-family-mono, monospace);
    }

    .notes-quote {
      font-size: 0.8125rem;
      font-style: italic;
      color: var(--color-text-default);
      line-height: 1.45;
      background: var(--color-bg-surface);
      border-left: 3px solid var(--color-accent-default);
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
    }

    /* Footer */
    .modal-footer {
      padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
      border-top: 1px solid var(--color-border-default);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      background: var(--color-bg-surface);
    }

    .copied-toast {
      font-size: 0.75rem;
      color: #10b981;
      font-weight: 700;
      margin-right: auto;
    }

    .copy-wa-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 9px 16px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s ease;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .print-btn {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 9px 14px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        border-color: var(--color-accent-default);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverModalComponent {
  readonly store = inject(DispatchStore);
  readonly report = this.store.handoverReport;
  readonly copiedText = signal(false);

  copyWhatsAppText(): void {
    const text = generateHandoverWhatsAppText(this.report());
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => void 0);
    }
    this.copiedText.set(true);
    setTimeout(() => this.copiedText.set(false), 3000);
  }

  downloadReport(): void {
    const text = generateHandoverWhatsAppText(this.report());
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PulseOps_Shift_Handover_${this.report().shift}_28Oct2026.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
