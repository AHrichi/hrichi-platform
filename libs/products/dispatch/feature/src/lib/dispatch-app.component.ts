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
  templateUrl: './dispatch-app.component.html',
  styleUrl: './dispatch-app.component.scss',
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
