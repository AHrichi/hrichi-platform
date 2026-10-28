import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import type {
  SubcontractorPlant,
  QualityClaim,
} from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-subcontractor-plants',
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './subcontractor-plants.component.html',
  styleUrl: './subcontractor-plants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubcontractorPlantsComponent {
  readonly store = inject(DispatchStore);
  readonly Math = Math;

  readonly activeClaimPlantId = signal<string | null>(null);

  readonly claimModel = signal<{
    client: string;
    type: QualityClaim['type'];
    count: number;
  }>({
    client: 'The Dorchester Mayfair',
    type: 'stain_rewash',
    count: 6,
  });

  readonly claimForm = form(
    this.claimModel,
    (schema) => {
      required(schema.client, { message: 'Client name is required.' });
      minLength(schema.client, 2, {
        message: 'Must be at least 2 characters.',
      });
      required(schema.count, { message: 'Item count is required.' });
      min(schema.count, 1, { message: 'Must be at least 1 item.' });
      max(schema.count, 500, { message: 'Cannot exceed 500 items.' });
    },
    {
      submission: {
        action: async () => this.submitClaim(),
      },
    },
  );

  openClaimForm(plantId: string): void {
    this.activeClaimPlantId.set(plantId);
  }

  async submitClaim(): Promise<undefined> {
    const plantId = this.activeClaimPlantId();
    if (!plantId) return undefined;

    const data = this.claimModel();
    this.store.logQualityClaim(
      plantId,
      data.client.trim(),
      'LIN-SHT-KNG',
      data.count,
      data.type,
    );
    this.activeClaimPlantId.set(null);
    return undefined;
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
