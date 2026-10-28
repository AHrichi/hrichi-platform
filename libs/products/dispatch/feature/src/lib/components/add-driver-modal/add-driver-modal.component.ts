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
import type { Driver, DriverStatus } from '@ah/products/dispatch/domain';

export interface AddDriverModel {
  name: string;
  phone: string;
  vehicle: string;
  registration: string;
  zone: string;
  currentLocation: string;
  capacityKg: number;
  activeShift: 'shift_a' | 'shift_b';
  status: DriverStatus;
}

@Component({
  selector: 'ah-add-driver-modal',
  imports: [FormField, FormRoot],
  templateUrl: './add-driver-modal.component.html',
  styleUrl: './add-driver-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDriverModalComponent {
  readonly store = inject(DispatchStore);

  readonly model = signal<AddDriverModel>({
    name: '',
    phone: '',
    vehicle: 'Mercedes Sprinter LWB (14m³)',
    registration: '',
    zone: 'West End & City',
    currentLocation: 'Park Lane Depot',
    capacityKg: 1200,
    activeShift: 'shift_a',
    status: 'idle',
  });

  readonly driverForm = form(
    this.model,
    (path) => {
      required(path.name, {
        message: 'Driver full name is required',
      });
      minLength(path.name, 2, {
        message: 'Driver full name must be at least 2 characters',
      });
      required(path.phone, { message: 'Valid contact number is required' });
      minLength(path.phone, 7, {
        message: 'Phone number must be at least 7 digits',
      });
      required(path.registration, {
        message: 'Vehicle registration is required',
      });
      minLength(path.registration, 3, {
        message: 'Registration must be at least 3 characters',
      });
      required(path.zone, { message: 'Primary delivery zone is required' });
      min(path.capacityKg, 100, {
        message: 'Capacity must be at least 100 kg',
      });
      max(path.capacityKg, 5000, {
        message: 'Capacity cannot exceed 5,000 kg',
      });
    },
    { submission: { action: async () => this.submitDriver() } },
  );

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);

  closeModal(): void {
    this.successMessage.set(null);
    this.store.closeAddDriverModal();
  }

  async submitDriver(): Promise<undefined> {
    this.isSubmitting.set(true);
    const m = this.model();
    const newId = `DRV-${Math.floor(10 + Math.random() * 89)}`;

    const newDriver: Driver = {
      id: newId,
      name: m.name.trim(),
      phone: m.phone.trim(),
      vehicle: m.vehicle.trim(),
      registration: m.registration.trim().toUpperCase(),
      zone: m.zone.trim(),
      status: m.status,
      activeShift: m.activeShift,
      currentLocation: m.currentLocation.trim(),
      assignedOrderIds: [],
      completedOrderIds: [],
      stops: [],
      etaNextStop: null,
      incidentNotice: null,
      capacityKg: Number(m.capacityKg) || 1000,
      currentPayloadKg: 0,
    };

    this.store.addDriver(newDriver);

    this.successMessage.set('✓ Driver registered successfully!');
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.driverForm().reset({
        name: '',
        phone: '',
        vehicle: 'Mercedes Sprinter LWB (14m³)',
        registration: '',
        zone: 'West End & City',
        currentLocation: 'Park Lane Depot',
        capacityKg: 1200,
        activeShift: 'shift_a',
        status: 'idle',
      });
      this.closeModal();
    }, 700);
    return undefined;
  }
}
