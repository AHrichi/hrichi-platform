import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormRoot, required } from '@angular/forms/signals';
import { DispatchStore } from '../../store/dispatch.store';

@Component({
  selector: 'ah-emergency-courier-modal',
  imports: [CommonModule, FormRoot],
  templateUrl: './emergency-courier-modal.component.html',
  styleUrl: './emergency-courier-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmergencyCourierModalComponent {
  readonly store = inject(DispatchStore);

  readonly courierModel = signal({
    selectedCourier: 'Gophr London Rapid',
  });

  readonly courierForm = form(
    this.courierModel,
    (schema) => {
      required(schema.selectedCourier, {
        message: 'Carrier selection is required.',
      });
    },
    {
      submission: {
        action: async () => this.confirmBooking(),
      },
    },
  );

  get targetOrder() {
    const id = this.store.emergencyOrderTargetId();
    return () => this.store.orders().find((o) => o.id === id);
  }

  async confirmBooking(): Promise<undefined> {
    const id = this.store.emergencyOrderTargetId();
    if (!id) return undefined;
    this.store.dispatchEmergencyCourier(
      id,
      this.courierModel().selectedCourier,
    );
    return undefined;
  }
}
