import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhBadge, AhButton, AhModal, AhSegmentedControl } from '@ah/ui';
import type {
  PoleItem,
  PoleStatus,
  PoleType,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../../i18n/luxpath-i18n';
import {
  isSolarPole,
  LightingStore,
  type PoleFilter,
} from '../../../store/lighting.store';
import { MapPicker } from '@ah/platform/maps';
import { NumberField } from '../../../ui/number-field/number-field';
import { PolePhotos } from '../../../ui/pole-photos/pole-photos';
import { POLE_STATUSES, POLE_TYPES } from '../../options';

const STATUS_BADGE: Record<
  PoleStatus,
  'neutral' | 'info' | 'warning' | 'accent' | 'success'
> = {
  planned: 'neutral',
  excavated: 'info',
  poured: 'warning',
  erected: 'accent',
  active: 'success',
};

/** The project's poles: filter, add, edit every field, delete. */
@Component({
  selector: 'lp-pole-list',
  imports: [
    AhBadge,
    AhButton,
    AhModal,
    AhSegmentedControl,
    NumberField,
    PolePhotos,
    RouterLink,
    MapPicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pole-list.html',
  styleUrl: './pole-list.scss',
})
export class PoleList {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly types = POLE_TYPES;
  protected readonly statuses = POLE_STATUSES;
  protected readonly badge = STATUS_BADGE;
  protected readonly isSolar = isSolarPole;

  protected readonly filters = computed(() =>
    (['all', 'solar', 'grid'] as const).map((value) => ({
      value,
      label: this.t().poles.filters[value],
    })),
  );

  /** The pole being edited; a pole without an id is a new one. */
  protected readonly draft = signal<PoleItem | null>(null);
  /** The project's other poles, shown faintly on the form's map. */
  protected readonly otherPoles = computed(() =>
    (this.store.activeProject()?.poles ?? [])
      .filter((p) => p.id !== this.draft()?.id)
      .map((p) => p.gps),
  );
  protected readonly isNew = signal(false);
  protected readonly removing = signal<PoleItem | null>(null);

  protected setFilter(filter: PoleFilter): void {
    this.store.setPoleFilter(filter);
  }

  protected add(): void {
    const project = this.store.activeProject();
    if (!project) return;
    this.isNew.set(true);
    this.draft.set({
      id: '',
      code: `M-${String(project.poles.length + 1).padStart(2, '0')}`,
      projectId: project.id,
      type:
        project.lightingType === 'grid_only'
          ? 'conventional_ac'
          : 'solar_autonomous',
      status: 'planned',
      gps: { ...project.gpsCenter },
      heightMeters: 8,
      armLengthMeters: 1.5,
      tiltAngleDegrees: 5,
      material: 'galvanized_steel',
      luminaireModel: 'LED 50 W',
      luminaireWattage: 50,
      luminaireLumens: 7500,
      colorTemperatureK: 4000,
      foundationWidthMeters: 0.8,
      foundationDepthMeters: 1.3,
      soilType: project.defaultSoil,
    });
  }

  protected edit(pole: PoleItem): void {
    this.isNew.set(false);
    this.draft.set({ ...pole, gps: { ...pole.gps } });
  }

  protected patch(change: Partial<PoleItem>): void {
    const draft = this.draft();
    if (draft) this.draft.set({ ...draft, ...change });
  }

  protected setType(type: PoleType): void {
    const solar = type.startsWith('solar');
    this.patch({
      type,
      solarPanelWatts: solar
        ? (this.draft()?.solarPanelWatts ?? 150)
        : undefined,
      solarBatteryWh: solar ? (this.draft()?.solarBatteryWh ?? 600) : undefined,
    });
  }

  protected async saveDraft(): Promise<void> {
    const draft = this.draft();
    if (!draft || !draft.code.trim()) return;
    if (this.isNew()) {
      await this.store.addPole(draft);
    } else {
      await this.store.updatePole(draft);
    }
    this.draft.set(null);
  }

  protected async confirmRemove(): Promise<void> {
    const pole = this.removing();
    if (pole) await this.store.removePole(pole.id);
    this.removing.set(null);
  }

  protected closeEditor(open: boolean): void {
    if (!open) this.draft.set(null);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
