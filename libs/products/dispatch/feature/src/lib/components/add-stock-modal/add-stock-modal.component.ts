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
  minLength,
  required,
} from '@angular/forms/signals';
import { DispatchStore } from '../../store/dispatch.store';
import type { LinenSKU, LinenCategory } from '@ah/products/dispatch/domain';

export interface AddStockModel {
  sku: string;
  name: string;
  category: LinenCategory;
  unitWeightGrams: number;
  inCleanReserve: number;
  inCirculation: number;
  minThreshold: number;
  atPlantWash: number;
  replacementCostGbp: number;
}

@Component({
  selector: 'ah-add-stock-modal',
  imports: [FormField, FormRoot],
  templateUrl: './add-stock-modal.component.html',
  styleUrl: './add-stock-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddStockModalComponent {
  readonly store = inject(DispatchStore);

  readonly model = signal<AddStockModel>({
    sku: '',
    name: '',
    category: 'bedding',
    unitWeightGrams: 680,
    inCleanReserve: 250,
    inCirculation: 500,
    minThreshold: 100,
    atPlantWash: 150,
    replacementCostGbp: 18.5,
  });

  readonly stockForm = form(
    this.model,
    (path) => {
      required(path.sku, { message: 'SKU code is required (min 3 chars)' });
      minLength(path.sku, 3, {
        message: 'SKU code must be at least 3 characters',
      });
      required(path.name, { message: 'Item name is required' });
      minLength(path.name, 3, {
        message: 'Item name must be at least 3 characters',
      });
    },
    { submission: { action: async () => this.submitStock() } },
  );

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);

  closeModal(): void {
    this.successMessage.set(null);
    this.store.closeAddStockModal();
  }

  async submitStock(): Promise<undefined> {
    this.isSubmitting.set(true);
    const m = this.model();
    const nowHhMm = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: LinenSKU = {
      sku: m.sku.trim().toUpperCase(),
      name: m.name.trim(),
      category: m.category,
      unitWeightGrams: Number(m.unitWeightGrams) || 500,
      inCleanReserve: Number(m.inCleanReserve) || 0,
      inCirculation: Number(m.inCirculation) || 0,
      atPlantWash: Number(m.atPlantWash) || 0,
      damagedScrap: 0,
      disputedMissing: 0,
      minThreshold: Number(m.minThreshold) || 50,
      replacementCostGbp: Number(m.replacementCostGbp) || 10,
      lastUpdated: nowHhMm,
    };

    this.store.addStockItem(newItem);

    this.successMessage.set(`✓ SKU ${newItem.sku} added to Stock Ledger!`);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.stockForm().reset({
        sku: '',
        name: '',
        category: 'bedding',
        unitWeightGrams: 680,
        inCleanReserve: 250,
        inCirculation: 500,
        minThreshold: 100,
        atPlantWash: 150,
        replacementCostGbp: 18.5,
      });
      this.closeModal();
    }, 700);
    return undefined;
  }
}
