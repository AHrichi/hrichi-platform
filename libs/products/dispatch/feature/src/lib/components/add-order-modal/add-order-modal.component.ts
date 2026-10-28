import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  max,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { DispatchStore } from '../../store/dispatch.store';
import type { Order, ClientSector } from '@ah/products/dispatch/domain';

export interface AddOrderModel {
  clientName: string;
  clientSector: ClientSector;
  zone: string;
  address: string;
  targetWindow: string;
  slaDeadline: string;
  totalWeightKg: number;
  itemsSummary: string;
  assignedDriverId: string | null;
  assignedPlantId: string;
  specialInstructions: string;
  isEmergency: boolean;
}

@Component({
  selector: 'ah-add-order-modal',
  imports: [FormField, FormRoot],
  templateUrl: './add-order-modal.component.html',
  styleUrl: './add-order-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddOrderModalComponent {
  readonly store = inject(DispatchStore);

  readonly model = signal<AddOrderModel>({
    clientName: '',
    clientSector: 'hotel',
    zone: 'W1 - Mayfair',
    address: '',
    targetWindow: '13:00 - 14:30',
    slaDeadline: '14:30',
    totalWeightKg: 85,
    itemsSummary: '40x King Sheets, 40x Duvets, 80x Pillowcases',
    assignedDriverId: null,
    assignedPlantId: 'plant-general',
    specialInstructions: '',
    isEmergency: false,
  });

  readonly orderForm = form(
    this.model,
    (path) => {
      required(path.clientName, {
        message: 'Client / venue name is required',
      });
      minLength(path.clientName, 2, {
        message: 'Client name must be at least 2 characters',
      });
      required(path.address, {
        message: 'A complete delivery address is required',
      });
      minLength(path.address, 5, {
        message: 'Address must be at least 5 characters',
      });
      required(path.zone, { message: 'Zone / area is required' });
      required(path.targetWindow, { message: 'Delivery window is required' });
      required(path.slaDeadline, { message: 'SLA deadline is required' });
      required(path.itemsSummary, {
        message: 'Linen items summary is required',
      });
      min(path.totalWeightKg, 5, { message: 'Weight must be at least 5 kg' });
      max(path.totalWeightKg, 1000, {
        message: 'Weight cannot exceed 1,000 kg',
      });
    },
    { submission: { action: async () => this.submitOrder() } },
  );

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);

  closeModal(): void {
    this.successMessage.set(null);
    this.store.closeAddOrderModal();
  }

  async submitOrder(): Promise<undefined> {
    this.isSubmitting.set(true);
    const m = this.model();
    const newId = `ORD-${Math.floor(8420 + Math.random() * 80)}`;
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newOrder: Order = {
      id: newId,
      clientName: m.clientName.trim(),
      clientSector: m.clientSector,
      address: m.address.trim(),
      zone: m.zone.trim(),
      status: 'intake',
      totalWeightKg: Number(m.totalWeightKg) || 50,
      items: [
        {
          sku: 'LIN-CUSTOM',
          name: m.itemsSummary.trim() || 'Custom Commercial Linen Set',
          quantity: 1,
          weightKg: Number(m.totalWeightKg) || 50,
        },
      ],
      slaDeadline: m.slaDeadline.trim() || '15:00',
      targetDeliveryWindow: m.targetWindow.trim() || '14:00 - 15:00',
      assignedDriverId: m.assignedDriverId,
      assignedPlantId: m.assignedPlantId,
      specialInstructions: m.specialInstructions.trim(),
      isEmergency: m.isEmergency,
      pod: null,
      createdAt: nowHhMm,
      updatedAt: nowHhMm,
    };

    this.store.addOrder(newOrder);

    this.successMessage.set(`✓ Order ${newId} added to Intake queue!`);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.orderForm().reset({
        clientName: '',
        clientSector: 'hotel',
        zone: 'W1 - Mayfair',
        address: '',
        targetWindow: '13:00 - 14:30',
        slaDeadline: '14:30',
        totalWeightKg: 85,
        itemsSummary: '40x King Sheets, 40x Duvets, 80x Pillowcases',
        assignedDriverId: null,
        assignedPlantId: 'plant-general',
        specialInstructions: '',
        isEmergency: false,
      });
      this.closeModal();
    }, 700);
    return undefined;
  }
}
