import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchStore } from '../../store/dispatch.store';
import type { Order, OrderStatus } from '@ah/products/dispatch/domain';
import { isOrderAtRisk } from '@ah/products/dispatch/domain';

interface KanbanColumn {
  id: OrderStatus;
  title: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'ah-kanban-board',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kanban-wrapper">
      <!-- Controls Bar: Filter by Sector, Search, At-Risk Highlight -->
      <div class="kanban-controls">
        <div class="filter-group">
          <label class="control-label" for="sectorFilter">Sector:</label>
          <select
            id="sectorFilter"
            class="control-select"
            [ngModel]="store.filterSector()"
            (ngModelChange)="store.setFilterSector($event)"
          >
            <option value="all">
              All Sectors (Hotels, Dining, Airbnbs, Spas)
            </option>
            <option value="hotel">Hotels & Hospitality</option>
            <option value="restaurant">Restaurants & Kitchens</option>
            <option value="airbnb">Airbnbs & Short-Lets</option>
            <option value="spa_gym">Spas & Health Clubs</option>
            <option value="corporate">Corporate Suites</option>
          </select>
        </div>

        <div class="search-group">
          <input
            type="search"
            class="control-input"
            placeholder="Search by client, ID (ORD-8401), zone, or driver..."
            [ngModel]="store.searchQuery()"
            (ngModelChange)="store.setSearchQuery($event)"
          />
        </div>

        <div class="stat-pills">
          @if (store.atRiskOrdersCount() > 0) {
            <span class="at-risk-badge">
              ⚠️ {{ store.atRiskOrdersCount() }} Deliveries Near SLA Deadline
              (&lt; 45m)
            </span>
          }
          <span class="active-count-badge">
            {{ store.filteredOrders().length }} Active Orders
          </span>
        </div>
      </div>

      <!-- Kanban 6-Column Pipeline -->
      <div class="columns-track">
        @for (col of columns; track col.id) {
          <div
            class="kanban-column"
            [class.is-delivered-col]="col.id === 'delivered'"
          >
            <!-- Column Header -->
            <div class="col-header">
              <div class="col-title-wrap">
                <span class="col-icon">{{ col.icon }}</span>
                <span class="col-title">{{ col.title }}</span>
              </div>
              <span class="col-count">
                {{ getOrdersForColumn(col.id).length }}
              </span>
            </div>
            <p class="col-desc">{{ col.description }}</p>

            <!-- Cards Container -->
            <div class="cards-list">
              @for (order of getOrdersForColumn(col.id); track order.id) {
                <div
                  class="order-card"
                  [class.is-emergency]="order.isEmergency"
                  [class.is-at-risk]="isAtRisk(order)"
                >
                  <!-- Card Top: ID, Sector Badge, Emergency Tag -->
                  <div class="card-top">
                    <div class="id-wrap">
                      <span class="order-id">{{ order.id }}</span>
                      @if (order.isEmergency) {
                        <span class="emergency-tag">⚡ EXPRESS</span>
                      }
                      @if (isAtRisk(order)) {
                        <span class="at-risk-tag">⏳ SLA AT RISK</span>
                      }
                    </div>
                    <span
                      class="sector-pill"
                      [class]="'sector-' + order.clientSector"
                    >
                      {{ order.clientSector | titlecase }}
                    </span>
                  </div>

                  <!-- Client Name & Zone -->
                  <h3 class="client-name">{{ order.clientName }}</h3>
                  <p class="order-address">📍 {{ order.address }}</p>

                  <!-- Weight & Item Breakdown -->
                  <div class="weight-row">
                    <span class="weight-badge"
                      >⚖️ {{ order.totalWeightKg }} kg</span
                    >
                    <span class="items-count"
                      >{{ order.items.length }} linen types</span
                    >
                  </div>

                  <!-- Linen items mini-pills -->
                  <div class="items-preview">
                    @for (item of order.items.slice(0, 2); track item.sku) {
                      <span class="item-pill">
                        {{ item.quantity }}x {{ item.name }}
                      </span>
                    }
                    @if (order.items.length > 2) {
                      <span class="item-pill more-pill">
                        +{{ order.items.length - 2 }} more
                      </span>
                    }
                  </div>

                  <!-- Subcontractor & Driver assignment info -->
                  <div class="logistics-info">
                    <div class="info-row">
                      <span class="info-label">🏭 Subcontractor:</span>
                      <span class="info-value">{{
                        getPlantName(order.assignedPlantId)
                      }}</span>
                    </div>
                    @if (order.subcontractStage) {
                      <div class="info-row">
                        <span class="info-label">⚙️ Plant Stage:</span>
                        <span class="stage-tag">{{
                          order.subcontractStage | uppercase
                        }}</span>
                      </div>
                    }
                    <div class="info-row">
                      <span class="info-label">🚚 Assigned Driver:</span>
                      <span class="info-value driver-name">
                        {{ getDriverName(order.assignedDriverId) }}
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">⏰ SLA Target:</span>
                      <span class="info-value time-val"
                        >{{ order.targetDeliveryWindow }} (Cutoff:
                        {{ order.slaDeadline }})</span
                      >
                    </div>
                  </div>

                  @if (order.specialInstructions) {
                    <div class="instructions-box">
                      <strong>Note:</strong> {{ order.specialInstructions }}
                    </div>
                  }

                  <!-- Card Actions -->
                  <div class="card-footer">
                    @if (order.status === 'delivered') {
                      <button
                        type="button"
                        class="pod-btn"
                        (click)="store.openPodModal(order.id)"
                      >
                        📄 View Signed POD
                      </button>
                    } @else {
                      <div class="stage-buttons">
                        <button
                          type="button"
                          class="nav-stage-btn"
                          [disabled]="order.status === 'intake'"
                          (click)="store.regressOrderStatus(order.id)"
                          title="Move to previous pipeline stage"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          class="advance-stage-btn"
                          (click)="store.advanceOrderStatus(order.id)"
                        >
                          Advance Stage ▶
                        </button>
                      </div>

                      @if (
                        isAtRisk(order) ||
                        order.assignedDriverId === 'drv-harpreet'
                      ) {
                        <button
                          type="button"
                          class="emergency-dispatch-btn"
                          (click)="store.openEmergencyModal(order.id)"
                        >
                          🚨 Emergency Courier
                        </button>
                      }
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-column">
                  <span>No orders in this stage</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    .kanban-wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    /* Controls Bar */
    .kanban-controls {
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

    .filter-group,
    .search-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .control-select,
    .control-input {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      padding: 7px 12px;
      font-size: 0.8125rem;
      color: var(--color-text-default);

      &:focus {
        outline: none;
        border-color: var(--color-accent-default);
      }
    }

    .control-input {
      min-width: 320px;
    }

    .stat-pills {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .at-risk-badge {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      animation: pulseAlert 2.5s infinite ease-in-out;
    }

    .active-count-badge {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
    }

    /* Columns Track */
    .columns-track {
      display: grid;
      grid-template-columns: repeat(6, minmax(280px, 1fr));
      gap: var(--space-3, 0.75rem);
      overflow-x: auto;
      padding-bottom: var(--space-3, 0.75rem);
    }

    .kanban-column {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-xl, 1rem);
      padding: var(--space-3, 0.75rem);
      display: flex;
      flex-direction: column;
      min-height: 580px;

      &.is-delivered-col {
        background: rgba(16, 185, 129, 0.02);
      }
    }

    .col-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .col-title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .col-icon {
      font-size: 1.1rem;
    }

    .col-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text-default);
    }

    .col-count {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 9999px;
      color: var(--color-text-default);
    }

    .col-desc {
      margin: 0 0 10px;
      font-size: 0.6875rem;
      color: var(--color-text-muted);
    }

    .cards-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }

    /* Order Card */
    .order-card {
      background: var(--color-bg-canvas);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        border-color 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.is-emergency {
        border-color: rgba(239, 68, 68, 0.6);
        background: rgba(239, 68, 68, 0.03);
      }

      &.is-at-risk {
        border-color: rgba(245, 158, 11, 0.6);
      }
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .id-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .order-id {
      font-family: var(--font-family-mono, monospace);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-accent-default);
    }

    .emergency-tag {
      background: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .at-risk-tag {
      background: #f59e0b;
      color: black;
      font-size: 0.625rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .sector-pill {
      font-size: 0.6875rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;

      &.sector-hotel {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }
      &.sector-restaurant {
        background: rgba(245, 158, 11, 0.15);
        color: #d97706;
      }
      &.sector-airbnb {
        background: rgba(236, 72, 153, 0.15);
        color: #ec4899;
      }
      &.sector-spa_gym {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
      &.sector-corporate {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }
    }

    .client-name {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-text-default);
      line-height: 1.25;
    }

    .order-address {
      margin: 0;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .weight-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
    }

    .weight-badge {
      font-weight: 700;
      color: var(--color-text-default);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .items-count {
      color: var(--color-text-muted);
    }

    .items-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .item-pill {
      font-size: 0.6875rem;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-default);

      &.more-pill {
        color: var(--color-accent-default);
        font-weight: 600;
      }
    }

    .logistics-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-top: 6px;
      border-top: 1px dashed var(--color-border-default);
      font-size: 0.75rem;
    }

    .info-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
    }

    .info-label {
      color: var(--color-text-muted);
      font-size: 0.6875rem;
    }

    .info-value {
      font-weight: 600;
      color: var(--color-text-default);
      text-align: right;

      &.driver-name {
        color: var(--color-accent-default);
      }

      &.time-val {
        font-family: var(--font-family-mono, monospace);
        font-size: 0.6875rem;
      }
    }

    .stage-tag {
      font-size: 0.625rem;
      font-weight: 700;
      background: rgba(139, 92, 246, 0.15);
      color: #8b5cf6;
      padding: 1px 5px;
      border-radius: 3px;
    }

    .instructions-box {
      background: var(--color-bg-surface);
      border-left: 3px solid var(--color-accent-default);
      padding: 4px 8px;
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      border-radius: 0 4px 4px 0;
      line-height: 1.35;
    }

    /* Card Footer & Stage Buttons */
    .card-footer {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }

    .stage-buttons {
      display: flex;
      gap: 6px;
    }

    .nav-stage-btn {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-default);
      padding: 6px 10px;
      border-radius: var(--radius-sm, 0.25rem);
      cursor: pointer;
      font-size: 0.75rem;

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        border-color: var(--color-accent-default);
      }
    }

    .advance-stage-btn {
      flex: 1;
      background: var(--color-accent-default);
      color: var(--color-accent-on);
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

    .emergency-dispatch-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: var(--radius-sm, 0.25rem);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .pod-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: var(--radius-sm, 0.25rem);
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;

      &:hover {
        filter: brightness(1.1);
      }
    }

    .empty-column {
      border: 2px dashed var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-6, 1.5rem) var(--space-3, 0.75rem);
      text-align: center;
      color: var(--color-text-muted);
      font-size: 0.75rem;
    }

    @media (max-width: 768px) {
      .kanban-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .control-input {
        min-width: 100%;
      }

      .stat-pills {
        justify-content: space-between;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent {
  readonly store = inject(DispatchStore);

  readonly columns: readonly KanbanColumn[] = [
    {
      id: 'intake',
      title: 'Intake / Confirmed',
      icon: '📥',
      description: 'Customer pickup scheduled & bagged',
    },
    {
      id: 'collection_transit',
      title: 'In-Transit (Collection)',
      icon: '🚚',
      description: 'Driver collecting dirty linen',
    },
    {
      id: 'subcontractor_plant',
      title: 'At Subcontractor Plant',
      icon: '🏭',
      description: 'Tunnel wash, drying & calendering',
    },
    {
      id: 'qc_ready',
      title: 'Plant QC & Ready',
      icon: '✨',
      description: 'Clean linen bagged & tagged',
    },
    {
      id: 'delivery_transit',
      title: 'In-Transit (Delivery)',
      icon: '🛣️',
      description: 'Driver delivering clean linen',
    },
    {
      id: 'delivered',
      title: 'Delivered & Reconciled',
      icon: '✅',
      description: 'Signed proof of delivery & verified seals',
    },
  ];

  getOrdersForColumn(status: OrderStatus): Order[] {
    return this.store.filteredOrders().filter((o) => o.status === status);
  }

  isAtRisk(order: Order): boolean {
    return isOrderAtRisk(order, this.store.londonTime());
  }

  getDriverName(driverId: string | null): string {
    if (!driverId) return 'Unassigned';
    const driver = this.store.drivers().find((d) => d.id === driverId);
    return driver ? driver.name : 'Unassigned';
  }

  getPlantName(plantId: string): string {
    const plant = this.store.subcontractors().find((p) => p.id === plantId);
    return plant ? plant.name : 'Subcontract Plant';
  }
}
