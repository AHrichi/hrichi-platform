import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type {
  SubcontractorPlant,
  QualityClaim,
} from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-subcontractor-plants',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plants-wrapper">
      <div class="plants-intro-bar">
        <div>
          <h2 class="section-title">
            Subcontractor Laundry Plants (Partner Facilities)
          </h2>
          <p class="section-subtitle">
            Daily wash order lists, tunnel washer capacity limits, quality
            discrepancies, and damage credit claims.
          </p>
        </div>
        <div class="plants-actions">
          <button
            type="button"
            class="add-plant-btn"
            (click)="store.openAddPlantModal()"
          >
            + Add Partner Facility
          </button>
          @if (store.subcontractors().length > 0) {
            <button
              type="button"
              class="action-manifest-btn"
              (click)="generateAllManifests()"
            >
              📄 Send Daily Wash Lists (All
              {{ store.subcontractors().length }} Plants)
            </button>
          }
        </div>
      </div>

      <!-- Plant Cards Grid -->
      <div class="plants-grid">
        @for (plant of store.subcontractors(); track plant.id) {
          <div class="plant-card">
            <!-- Header -->
            <div class="plant-card-header">
              <div class="plant-title-wrap">
                <span class="plant-icon">🏭</span>
                <div>
                  <h3 class="plant-name">{{ plant.name }}</h3>
                  <span class="plant-loc"
                    >📍 {{ plant.location }} ({{ plant.postalCode }})</span
                  >
                </div>
              </div>

              <div class="plant-header-right">
                <div class="sla-badge">
                  <span class="sla-label">SLA Punctuality</span>
                  <span class="sla-val">{{ plant.slaPunctualityPct }}%</span>
                </div>
                <button
                  type="button"
                  class="delete-plant-btn"
                  (click)="store.deleteSubcontractor(plant.id)"
                  title="Remove Subcontractor"
                  aria-label="Remove Subcontractor"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Speciality -->
            <div class="speciality-box">
              <span class="spec-label">Speciality:</span>
              <span class="spec-val">{{ plant.speciality }}</span>
            </div>

            <!-- Capacity Progress -->
            <div class="capacity-section">
              <div class="capacity-meta">
                <span class="cap-label">Daily Capacity Utilization:</span>
                <span class="cap-val">
                  {{ plant.currentLoadKg }} kg / {{ plant.dailyCapacityKg }} kg
                  ({{
                    Math.round(
                      (plant.currentLoadKg / plant.dailyCapacityKg) * 100
                    )
                  }}%)
                </span>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  [style.width.%]="
                    (plant.currentLoadKg / plant.dailyCapacityKg) * 100
                  "
                  [class.is-near-limit]="
                    plant.currentLoadKg > plant.dailyCapacityKg * 0.85
                  "
                ></div>
              </div>
            </div>

            <!-- Batches & Metrics Row -->
            <div class="metrics-row">
              <div class="metric-cell">
                <span class="m-val">{{ plant.activeBatchCount }}</span>
                <span class="m-lbl">Batches in Wash</span>
              </div>
              <div class="metric-cell">
                <span class="m-val text-success">{{
                  plant.readyForPickupCount
                }}</span>
                <span class="m-lbl">Ready for Van Pickup</span>
              </div>
              <div class="metric-cell">
                <span
                  class="m-val"
                  [class.text-warning]="plant.defectRatePct > 0.5"
                  >{{ plant.defectRatePct }}%</span
                >
                <span class="m-lbl">Re-wash Defect Rate</span>
              </div>
            </div>

            <!-- Contact & Operations info -->
            <div class="contact-box">
              <div class="contact-row">
                <span class="c-lbl">Plant Manager:</span>
                <span class="c-val">{{ plant.contactPerson }}</span>
              </div>
              <div class="contact-row">
                <span class="c-lbl">Hotline:</span>
                <span class="c-val phone">{{ plant.phone }}</span>
              </div>
            </div>

            <!-- Claims & Discrepancies -->
            <div class="claims-section">
              <div class="claims-header">
                <span class="claims-title"
                  >Quality Claims & Discrepancies ({{
                    plant.claims.length
                  }})</span
                >
                <button
                  type="button"
                  class="add-claim-btn"
                  (click)="openClaimForm(plant.id)"
                >
                  + Log Stained / Missing Item
                </button>
              </div>

              <div class="claims-list">
                @for (claim of plant.claims; track claim.id) {
                  <div class="claim-item">
                    <div class="claim-top">
                      <span class="claim-type">
                        {{
                          claim.type === 'stain_rewash'
                            ? '🧼 Permanent Stain'
                            : '✂️ Torn / Scrapped'
                        }}
                      </span>
                      <span class="claim-credit"
                        >-£{{ claim.creditAmountGbp.toFixed(2) }}</span
                      >
                    </div>
                    <div class="claim-desc">
                      {{ claim.count }}x {{ claim.itemName }} ({{
                        claim.clientName
                      }})
                    </div>
                    <span class="claim-time"
                      >Logged at {{ claim.loggedAt }} · Status:
                      {{ claim.status | uppercase }}</span
                    >
                  </div>
                } @empty {
                  <span class="no-claims"
                    >Zero active quality discrepancies for today's run.</span
                  >
                }
              </div>
            </div>

            <!-- Plant Card Footer -->
            <div class="plant-card-footer">
              <button
                type="button"
                class="manifest-btn"
                (click)="generatePlantManifest(plant)"
              >
                📄 Send Order Manifest
              </button>
              <button
                type="button"
                class="chase-btn"
                (click)="chasePlant(plant)"
              >
                📞 Chase Plant Manager
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-plants-card">
            <span class="empty-plants-icon">🏭</span>
            <h3 class="empty-plants-title">
              No Subcontractor Plants Connected
            </h3>
            <p class="empty-plants-desc">
              Connect partner industrial laundry facilities to route orders,
              track tunnel wash loads, and log quality claims.
            </p>
            <button
              type="button"
              class="add-plant-btn"
              (click)="store.openAddPlantModal()"
            >
              + Connect First Partner Plant
            </button>
          </div>
        }
      </div>

      <!-- Quick Claim Modal -->
      @if (activeClaimPlantId()) {
        <div class="modal-overlay">
          <div class="claim-modal-card">
            <h3 class="modal-title">Log Quality Defect / Missing Item Claim</h3>
            <p class="modal-desc">
              File a re-wash request or credit deduction against partner laundry
              plant.
            </p>

            <form class="claim-form" (ngSubmit)="submitClaim()">
              <label class="form-label">Client Affected:</label>
              <input
                type="text"
                class="form-input"
                [(ngModel)]="claimClient"
                name="claimClient"
                placeholder="e.g. The Dorchester, Dishoom..."
                required
              />

              <label class="form-label">Defect Type:</label>
              <select
                class="form-select"
                [(ngModel)]="claimType"
                name="claimType"
              >
                <option value="stain_rewash">
                  Stain / Incomplete Wash (Re-wash required)
                </option>
                <option value="torn_damaged">
                  Torn / Ripped Linen (Scrap claim)
                </option>
                <option value="missing_count">
                  Short delivery / Missing pieces
                </option>
                <option value="creased_press">
                  Poor ironing / Creased finish
                </option>
              </select>

              <label class="form-label">Number of Items Affected:</label>
              <input
                type="number"
                class="form-input"
                [(ngModel)]="claimCount"
                name="claimCount"
                min="1"
                max="500"
                required
              />

              <div class="credit-calc-box">
                <span>Calculated Credit Deduction:</span>
                <strong>£{{ (claimCount * 3.5).toFixed(2) }}</strong>
              </div>

              <div class="modal-actions">
                <button
                  type="button"
                  class="btn-cancel"
                  (click)="activeClaimPlantId.set(null)"
                >
                  Cancel
                </button>
                <button type="submit" class="btn-submit">
                  Confirm & Deduct Credit
                </button>
              </div>
            </form>
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

    .plants-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .plants-intro-bar {
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

    .plants-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      flex-wrap: wrap;
    }

    .add-plant-btn {
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

    .action-manifest-btn {
      background: var(--color-accent-default);
      color: var(--color-accent-on);
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

    /* Plants Grid */
    .plants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: var(--space-4, 1rem);
    }

    .plant-card {
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
    }

    .plant-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .plant-title-wrap {
      display: flex;
      gap: 10px;
    }

    .plant-icon {
      font-size: 1.5rem;
    }

    .plant-name {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .plant-loc {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .plant-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .delete-plant-btn {
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

    .sla-badge {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 8px;
      border-radius: var(--radius-md, 0.5rem);
    }

    .sla-label {
      font-size: 0.625rem;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .sla-val {
      font-size: 0.9375rem;
      font-weight: 800;
      color: #10b981;
    }

    .speciality-box {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 6px 10px;
      font-size: 0.75rem;
      display: flex;
      gap: 6px;
    }

    .spec-label {
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .spec-val {
      color: var(--color-text-default);
      font-weight: 600;
    }

    /* Capacity */
    .capacity-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .capacity-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .cap-label {
      color: var(--color-text-muted);
    }

    .cap-val {
      font-weight: 700;
      color: var(--color-text-default);
    }

    .progress-track {
      height: 7px;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 9999px;
      transition: width 0.3s ease;

      &.is-near-limit {
        background: #f59e0b;
      }
    }

    /* Metrics Row */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .metric-cell {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .m-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-text-default);
    }

    .m-lbl {
      font-size: 0.625rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .text-success {
      color: #10b981 !important;
    }
    .text-warning {
      color: #f59e0b !important;
    }

    /* Contact */
    .contact-box {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 0.75rem;
      border-top: 1px dashed var(--color-border-default);
      padding-top: 6px;
    }

    .contact-row {
      display: flex;
      justify-content: space-between;
    }

    .c-lbl {
      color: var(--color-text-muted);
    }

    .c-val {
      font-weight: 600;
      color: var(--color-text-default);

      &.phone {
        font-family: var(--font-family-mono, monospace);
        color: var(--color-accent-default);
      }
    }

    /* Claims Section */
    .claims-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .claims-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .claims-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .add-claim-btn {
      background: none;
      border: none;
      color: var(--color-accent-default);
      font-size: 0.6875rem;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 4px;

      &:hover {
        text-decoration: underline;
      }
    }

    .claims-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 140px;
      overflow-y: auto;
    }

    .claim-item {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 6px 10px;
      font-size: 0.75rem;
    }

    .claim-top {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
    }

    .claim-type {
      color: #ef4444;
    }

    .claim-credit {
      color: #10b981;
    }

    .claim-desc {
      color: var(--color-text-default);
      margin: 2px 0;
    }

    .claim-time {
      font-size: 0.625rem;
      color: var(--color-text-muted);
    }

    .no-claims {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-style: italic;
      padding: 8px 0;
    }

    /* Footer */
    .plant-card-footer {
      display: flex;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border-default);
    }

    .manifest-btn {
      flex: 1;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 8px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-accent-default);
      }
    }

    .chase-btn {
      background: rgba(37, 99, 235, 0.1);
      border: 1px solid rgba(37, 99, 235, 0.3);
      color: var(--color-accent-default);
      padding: 8px 12px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;

      &:hover {
        background: rgba(37, 99, 235, 0.2);
      }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .claim-modal-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-5, 1.25rem);
      width: 90%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-text-default);
    }

    .modal-desc {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }

    .claim-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .form-input,
    .form-select {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 8px 12px;
      font-size: 0.875rem;
      color: var(--color-text-default);

      &:focus {
        outline: none;
        border-color: var(--color-accent-default);
      }
    }

    .credit-calc-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 8px 12px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      color: #10b981;
    }

    .modal-actions {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }

    .btn-cancel {
      flex: 1;
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 10px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit {
      flex: 2;
      background: #10b981;
      color: white;
      border: none;
      padding: 10px;
      border-radius: var(--radius-md, 0.5rem);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;

      &:hover {
        filter: brightness(1.1);
      }
    }
    .empty-plants-card {
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

    .empty-plants-icon {
      font-size: 2.5rem;
      margin-bottom: var(--space-2, 0.5rem);
    }

    .empty-plants-title {
      font-size: var(--text-lg, 1.125rem);
      font-weight: 700;
      color: var(--color-text-default);
      margin: 0;
    }

    .empty-plants-desc {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted);
      max-width: 440px;
      margin: 0 0 var(--space-3, 0.75rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubcontractorPlantsComponent {
  readonly store = inject(DispatchStore);
  readonly Math = Math;

  readonly activeClaimPlantId = signal<string | null>(null);
  claimClient = 'The Dorchester Mayfair';
  claimType: QualityClaim['type'] = 'stain_rewash';
  claimCount = 6;

  openClaimForm(plantId: string): void {
    this.activeClaimPlantId.set(plantId);
  }

  submitClaim(): void {
    const plantId = this.activeClaimPlantId();
    if (!plantId) return;

    this.store.logQualityClaim(
      plantId,
      this.claimClient,
      'LIN-SHT-KNG',
      this.claimCount,
      this.claimType,
    );
    this.activeClaimPlantId.set(null);
  }

  generatePlantManifest(plant: SubcontractorPlant): void {
    this.store.sendWhatsAppMessage(
      'production',
      `📄 DAILY PRODUCTION MANIFEST sent to ${plant.name}: ${plant.currentLoadKg} kg of soiled hotel linens scheduled for tunnel wash today. Punctuality SLA: 14:00 delivery window.`,
      true,
    );
  }

  generateAllManifests(): void {
    this.store.sendWhatsAppMessage(
      'production',
      `📄 DAILY WASH LISTS GENERATED: All 3 partner plants (Thames Valley, Apex Clean, Park Royal) manifests synchronized and sent to production managers.`,
      true,
    );
  }

  chasePlant(plant: SubcontractorPlant): void {
    this.store.sendWhatsAppMessage(
      'production',
      `Urgent chase to ${plant.contactPerson} (${plant.name}): Please confirm when Batch #408 will be through the steam ironers for driver collection.`,
      true,
    );
  }
}
