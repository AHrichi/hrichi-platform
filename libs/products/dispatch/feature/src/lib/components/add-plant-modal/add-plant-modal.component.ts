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
import type { SubcontractorPlant } from '@ah/products/dispatch/domain';

export interface AddPlantModel {
  name: string;
  location: string;
  postalCode: string;
  speciality: string;
  dailyCapacityKg: number;
  contactPerson: string;
  phone: string;
  email: string;
}

@Component({
  selector: 'ah-add-plant-modal',
  imports: [FormField, FormRoot],
  templateUrl: './add-plant-modal.component.html',
  styleUrl: './add-plant-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPlantModalComponent {
  readonly store = inject(DispatchStore);

  readonly model = signal<AddPlantModel>({
    name: '',
    location: '',
    postalCode: 'NW10 7QQ',
    speciality: 'Hotel Bed Linen & Towels (Heavy Continuous Tunnel)',
    dailyCapacityKg: 3000,
    contactPerson: '',
    phone: '',
    email: '',
  });

  readonly plantForm = form(
    this.model,
    (path) => {
      required(path.name, {
        message: 'Plant name is required (min 2 characters)',
      });
      minLength(path.name, 2, {
        message: 'Plant name must be at least 2 characters',
      });
      required(path.location, { message: 'Plant address is required' });
      minLength(path.location, 5, {
        message: 'Address must be at least 5 characters',
      });
      required(path.postalCode, { message: 'Postal code is required' });
      required(path.phone, { message: 'Valid contact number is required' });
      minLength(path.phone, 7, {
        message: 'Contact number must be at least 7 digits',
      });
      min(path.dailyCapacityKg, 500, {
        message: 'Capacity must be at least 500 kg',
      });
      max(path.dailyCapacityKg, 25000, {
        message: 'Capacity cannot exceed 25,000 kg',
      });
    },
    { submission: { action: async () => this.submitPlant() } },
  );

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);

  closeModal(): void {
    this.successMessage.set(null);
    this.store.closeAddPlantModal();
  }

  async submitPlant(): Promise<undefined> {
    this.isSubmitting.set(true);
    const m = this.model();
    const newId = `plant-${Math.floor(100 + Math.random() * 899)}`;

    const newPlant: SubcontractorPlant = {
      id: newId,
      name: m.name.trim(),
      location: m.location.trim(),
      postalCode: m.postalCode.trim().toUpperCase(),
      speciality: m.speciality,
      dailyCapacityKg: Number(m.dailyCapacityKg) || 2500,
      currentLoadKg: 0,
      activeBatchCount: 0,
      readyForPickupCount: 0,
      defectRatePct: 0.0,
      slaPunctualityPct: 100,
      contactPerson: m.contactPerson.trim() || 'Plant Production Desk',
      phone: m.phone.trim(),
      email: m.email.trim() || `info@${newId}.laundry`,
      claims: [],
    };

    this.store.addSubcontractor(newPlant);

    this.successMessage.set('✓ Partner laundry facility connected!');
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.plantForm().reset({
        name: '',
        location: '',
        postalCode: 'NW10 7QQ',
        speciality: 'Hotel Bed Linen & Towels (Heavy Continuous Tunnel)',
        dailyCapacityKg: 3000,
        contactPerson: '',
        phone: '',
        email: '',
      });
      this.closeModal();
    }, 700);
    return undefined;
  }
}
