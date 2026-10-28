import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanBoardComponent {
  readonly store = inject(DispatchStore);

  onSectorChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.store.setFilterSector(val);
  }

  onSearchChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.store.setSearchQuery(val);
  }

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
