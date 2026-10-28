import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';

@Component({
  selector: 'ah-pod-modal',
  imports: [CommonModule],
  template: `
    @if (targetOrder(); as order) {
      <div class="modal-overlay" (click)="store.closePodModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="title-wrap">
              <span class="modal-icon">✅</span>
              <div>
                <h2 class="modal-title">Digital Proof of Delivery (POD)</h2>
                <span class="modal-sub">
                  Verified dropoff for {{ order.clientName }} · {{ order.id }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="store.closePodModal()"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            @if (order.pod; as pod) {
              <!-- Recipient & Delivery Meta -->
              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-lbl">Signed By:</span>
                  <strong class="meta-val">{{ pod.recipientName }}</strong>
                </div>
                <div class="meta-item">
                  <span class="meta-lbl">Title:</span>
                  <span class="meta-val">{{ pod.recipientTitle }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-lbl">Delivered At:</span>
                  <span class="meta-val font-mono">{{ pod.deliveredAt }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-lbl">Cages / Bags Count:</span>
                  <span class="meta-val">{{ pod.bagsCount }} Sealed Bags</span>
                </div>
              </div>

              <!-- Security Bag Seal Numbers -->
              <div class="seals-box">
                <span class="seals-lbl"
                  >Security Tamper-Proof Seal Numbers:</span
                >
                <div class="seals-pills">
                  @for (seal of pod.sealNumbers; track seal) {
                    <span class="seal-pill">{{ seal }}</span>
                  }
                </div>
              </div>

              <!-- Digital Signature Pad Preview -->
              <div class="signature-box">
                <span class="sig-lbl">Recipient Digital Signature:</span>
                <div class="sig-canvas">
                  <svg width="240" height="70" viewBox="0 0 120 40">
                    <path
                      [attr.d]="pod.signatureSvg"
                      fill="none"
                      stroke="#2563eb"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
              </div>

              @if (pod.notes) {
                <div class="notes-box">
                  <span class="notes-lbl">Driver & Security Notes:</span>
                  <p class="notes-text">"{{ pod.notes }}"</p>
                </div>
              }
            } @else {
              <div class="no-pod-box">
                <p>Digital POD not yet submitted for this order.</p>
              </div>
            }
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn-close"
              (click)="store.closePodModal()"
            >
              Done
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
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.8125rem;
    }

    .meta-lbl {
      font-size: 0.6875rem;
      text-transform: uppercase;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .meta-val {
      color: var(--color-text-default);
    }

    .font-mono {
      font-family: var(--font-family-mono, monospace);
    }

    .seals-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .seals-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .seals-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .seal-pill {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
      font-family: var(--font-family-mono, monospace);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .signature-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sig-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .sig-canvas {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notes-box {
      background: var(--color-bg-canvas);
      border-left: 3px solid #10b981;
      border-radius: 0 4px 4px 0;
      padding: 8px 12px;
      font-size: 0.75rem;
    }

    .notes-lbl {
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      font-size: 0.6875rem;
      display: block;
      margin-bottom: 2px;
    }

    .notes-text {
      margin: 0;
      color: var(--color-text-default);
      font-style: italic;
    }

    .no-pod-box {
      padding: var(--space-6, 1.5rem);
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
    }

    .modal-footer {
      padding: var(--space-3, 0.75rem) var(--space-5, 1.25rem);
      border-top: 1px solid var(--color-border-default);
      display: flex;
      justify-content: flex-end;
      background: var(--color-bg-surface);
    }

    .btn-close {
      background: var(--color-accent-default);
      color: var(--color-accent-on);
      border: none;
      padding: 8px 18px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodModalComponent {
  readonly store = inject(DispatchStore);

  get targetOrder() {
    const id = this.store.selectedOrderIdForPod();
    return () => this.store.orders().find((o) => o.id === id);
  }
}
