import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { DispatchStore } from './store/dispatch.store';
import { ShiftHeaderComponent } from './components/shift-header/shift-header.component';
import { WhatsAppHubComponent } from './components/whatsapp-hub/whatsapp-hub.component';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { DriverDispatchComponent } from './components/driver-dispatch/driver-dispatch.component';
import { SubcontractorPlantsComponent } from './components/subcontractor-plants/subcontractor-plants.component';
import { StockSheetComponent } from './components/stock-sheet/stock-sheet.component';
import { HandoverModalComponent } from './components/handover-modal/handover-modal.component';
import { EmergencyCourierModalComponent } from './components/emergency-courier-modal/emergency-courier-modal.component';
import { PodModalComponent } from './components/pod-modal/pod-modal.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';
import { AddOrderModalComponent } from './components/add-order-modal/add-order-modal.component';
import { AddDriverModalComponent } from './components/add-driver-modal/add-driver-modal.component';
import { AddPlantModalComponent } from './components/add-plant-modal/add-plant-modal.component';
import { AddStockModalComponent } from './components/add-stock-modal/add-stock-modal.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import type { DispatchTab } from './store/dispatch.state';

@Component({
  selector: 'ah-dispatch-app',
  imports: [
    CommonModule,
    ShiftHeaderComponent,
    WhatsAppHubComponent,
    KanbanBoardComponent,
    DriverDispatchComponent,
    SubcontractorPlantsComponent,
    StockSheetComponent,
    HandoverModalComponent,
    EmergencyCourierModalComponent,
    PodModalComponent,
    AnalyticsDashboardComponent,
    AddOrderModalComponent,
    AddDriverModalComponent,
    AddPlantModalComponent,
    AddStockModalComponent,
    AuthModalComponent,
  ],
  template: `
    <div class="pulseops-shell" [class.is-fullscreen]="isFullscreen()">
      <!-- Main Coordinator Cockpit Header -->
      <ah-shift-header />

      <!-- Module Navigation Tabs -->
      <nav class="module-nav" aria-label="PulseOps Operations Modules">
        <div class="nav-track" role="tablist">
          <button
            type="button"
            class="tab-btn"
            role="tab"
            [attr.aria-selected]="store.activeTab() === 'kanban'"
            [class.is-active]="store.activeTab() === 'kanban'"
            (click)="store.setTab('kanban')"
          >
            <span class="tab-icon">📥</span>
            <span class="tab-label">Order Pipeline (Kanban)</span>
            <span class="tab-badge">{{ store.totalOrdersCount() }}</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            role="tab"
            [attr.aria-selected]="store.activeTab() === 'whatsapp'"
            [class.is-active]="store.activeTab() === 'whatsapp'"
            (click)="store.setTab('whatsapp')"
          >
            <span class="tab-icon">💬</span>
            <span class="tab-label">WhatsApp Comms Hub</span>
            <span class="tab-badge pulse-badge">3</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            role="tab"
            [attr.aria-selected]="store.activeTab() === 'drivers'"
            [class.is-active]="store.activeTab() === 'drivers'"
            (click)="store.setTab('drivers')"
          >
            <span class="tab-icon">🚚</span>
            <span class="tab-label">Driver Fleet & Routes</span>
            <span class="tab-badge"
              >{{ store.activeFleetCount() }} on road</span
            >
          </button>

          <button
            type="button"
            class="tab-btn"
            role="tab"
            [attr.aria-selected]="store.activeTab() === 'plants'"
            [class.is-active]="store.activeTab() === 'plants'"
            (click)="store.setTab('plants')"
          >
            <span class="tab-icon">🏭</span>
            <span class="tab-label">Subcontractor Plants</span>
            <span class="tab-badge">3</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            role="tab"
            [attr.aria-selected]="store.activeTab() === 'stock'"
            [class.is-active]="store.activeTab() === 'stock'"
            (click)="store.setTab('stock')"
          >
            <span class="tab-icon">📊</span>
            <span class="tab-label">Linen Stock Sheet</span>
            <span class="tab-badge">Sheets Sync</span>
          </button>

          <button
            type="button"
            class="tab-btn"
            role="tab"
            [attr.aria-selected]="store.activeTab() === 'analytics'"
            [class.is-active]="store.activeTab() === 'analytics'"
            (click)="store.setTab('analytics')"
          >
            <span class="tab-icon">📈</span>
            <span class="tab-label">Analytics & SLAs</span>
          </button>
        </div>

        <div class="nav-controls">
          <button
            type="button"
            class="ctrl-btn role-btn"
            (click)="store.openAuthModal()"
            title="Switch User Persona (Owner, Coordinator, Driver, Subcontractor, Customer) or Sign In"
          >
            👤 Role: {{ store.currentUser().role }}
          </button>
          <button
            type="button"
            class="ctrl-btn"
            (click)="store.loadSampleData()"
            title="Load sample demonstration data"
          >
            📋 Load Demo
          </button>
          <button
            type="button"
            class="ctrl-btn"
            (click)="store.clearAllData()"
            title="Clear all data to work from clean slate"
          >
            🗑 Clear Data
          </button>
          <button
            type="button"
            class="ctrl-btn"
            (click)="toggleFullscreen()"
            [attr.aria-label]="
              isFullscreen() ? 'Exit Full Screen' : 'Enter Full Screen'
            "
          >
            {{ isFullscreen() ? '⤢ Exit Fullscreen' : '⤢ Fullscreen' }}
          </button>
        </div>
      </nav>

      <!-- Active Module View -->
      <main class="ops-main-viewport">
        @switch (store.activeTab()) {
          @case ('kanban') {
            <ah-kanban-board />
          }
          @case ('whatsapp') {
            <ah-whatsapp-hub />
          }
          @case ('drivers') {
            <ah-driver-dispatch />
          }
          @case ('plants') {
            <ah-subcontractor-plants />
          }
          @case ('stock') {
            <ah-stock-sheet />
          }
          @case ('analytics') {
            <ah-analytics-dashboard />
          }
        }
      </main>

      <!-- Modals -->
      <ah-handover-modal />
      <ah-emergency-courier-modal />
      <ah-pod-modal />
      <ah-add-order-modal />
      <ah-add-driver-modal />
      <ah-add-plant-modal />
      <ah-add-stock-modal />
      <ah-auth-modal />
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .pulseops-shell {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      margin: 0 auto;
      padding: var(--space-4, 1rem) 0;
      box-sizing: border-box;
      position: relative;
      color: var(--color-text-default);
    }

    .pulseops-shell.is-fullscreen {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      z-index: 99999;
      background: var(--color-bg-canvas);
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      overflow-y: auto;
    }

    /* Module Navigation */
    .module-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 0.75rem);
      margin-bottom: var(--space-4, 1rem);
      border-bottom: 1px solid var(--color-border-default);
      padding-bottom: var(--space-2, 0.5rem);
      overflow-x: auto;
    }

    .nav-track {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-text-default);
      }

      &.is-active {
        background: var(--color-accent-default);
        color: var(--color-accent-on);
        border-color: var(--color-accent-default);

        .tab-badge {
          background: rgba(255, 255, 255, 0.25);
          color: white;
        }
      }
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-label {
      font-weight: 700;
    }

    .tab-badge {
      font-size: 0.6875rem;
      font-weight: 700;
      background: var(--color-bg-canvas);
      padding: 2px 6px;
      border-radius: 9999px;
      color: var(--color-text-muted);

      &.pulse-badge {
        background: #10b981;
        color: white;
      }
    }

    .nav-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .ctrl-btn {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      color: var(--color-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: var(--radius-md, 0.5rem);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;

      &:hover {
        border-color: var(--color-accent-default);
        color: var(--color-text-default);
      }
    }

    .ops-main-viewport {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .module-nav {
        flex-direction: column;
        align-items: stretch;
      }

      .nav-track {
        width: 100%;
      }

      .nav-controls {
        justify-content: flex-end;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PulseOpsAppComponent {
  readonly store = inject(DispatchStore);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef);
  readonly isFullscreen = signal(false);

  toggleFullscreen(): void {
    const next = !this.isFullscreen();
    this.isFullscreen.set(next);

    const el = this.elementRef.nativeElement as HTMLElement;
    if (next) {
      if (el.requestFullscreen && !this.document.fullscreenElement) {
        el.requestFullscreen().catch(() => void 0);
      }
    } else {
      if (this.document.fullscreenElement && this.document.exitFullscreen) {
        this.document.exitFullscreen().catch(() => void 0);
      }
    }
  }
}
