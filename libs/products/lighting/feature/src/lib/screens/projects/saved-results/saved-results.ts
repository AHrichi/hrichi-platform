import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhModal } from '@ah/ui';
import {
  calculateElectricalNetwork,
  calculateFoundation,
  calculatePoleSpacing,
  calculateSolarSizing,
  calculateSpan,
  type HeightMeasurement,
  type SavedCalculation,
  validateConcreteMix,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../../i18n/luxpath-i18n';
import { LightingStore } from '../../../store/lighting.store';

interface Row {
  id: string;
  kind: SavedCalculation['kind'] | 'measurement';
  icon: string;
  label: string;
  summary: string;
  savedAt: string;
  link: string;
  query: Record<string, string>;
}

const ICONS: Record<Row['kind'], string> = {
  spacing: '📏',
  foundation: '🏗️',
  solar: '☀️',
  electrical: '🔌',
  concrete: '🧱',
  span: '〰️',
  measurement: '📷',
};

/**
 * Everything saved to the project: reopen it in its tool to correct and
 * re-save, rename it, or delete it. Results are recomputed from the saved
 * inputs, so they always follow the current rules.
 */
@Component({
  selector: 'lp-saved-results',
  imports: [AhButton, AhModal, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './saved-results.html',
  styleUrl: './saved-results.scss',
})
export class SavedResults {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;

  protected readonly rows = computed<Row[]>(() => {
    const calculations = this.store
      .calculations()
      .map((c) => this.calculationRow(c));
    const measurements = this.store
      .measurements()
      .map((m) => this.measurementRow(m));
    return [...calculations, ...measurements].sort((a, b) =>
      b.savedAt.localeCompare(a.savedAt),
    );
  });

  protected readonly renaming = signal<Row | null>(null);
  protected readonly newLabel = signal('');
  protected readonly removing = signal<Row | null>(null);

  private calculationRow(c: SavedCalculation): Row {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    let summary: string;
    switch (c.kind) {
      case 'spacing': {
        const r = calculatePoleSpacing(c.inputs);
        summary = `S/H ${n(r.spacingRatio, 2)} · ${n(r.estimatedAverageLux)} lx · ${r.isCompliant ? '✓' : '✕'}${c.inputs.overheadCable ? ` · ${this.t().cableCheck.short}` : ''}`;
        break;
      }
      case 'foundation': {
        const r = calculateFoundation(c.inputs);
        summary = `D ${n(r.actualDepthMeters, 2)} / ${n(r.minRecommendedDepthMeters, 2)} m · SF ${n(r.safetyFactor, 2)}`;
        break;
      }
      case 'solar': {
        const r = calculateSolarSizing(c.inputs);
        summary = `${r.commercialPanelSizeWatts} Wp · ${r.commercialBatteryCapacityAh} Ah`;
        break;
      }
      case 'electrical': {
        const r = calculateElectricalNetwork(c.inputs);
        summary = `${r.recommendedCrossSectionMm2} mm² · ΔU ${n(r.actualVoltageDropPct, 2)} %`;
        break;
      }
      case 'span': {
        const r = calculateSpan(c.inputs);
        summary = `L ${n(c.inputs.spanMeters, 0)} m · f ${n(r.sagHotMeters, 2)} m · max ${n(r.maxSpanMeters, 0)} m · ${r.isCompliant ? '✓' : '✕'}`;
        break;
      }
      case 'concrete': {
        const r = validateConcreteMix(c.inputs);
        summary = `E/C ${n(r.providedWaterCementRatio, 2)} · ${r.slumpClassification} · ${r.currentStrengthPctOf28Days} %`;
        break;
      }
    }
    const concrete = c.kind === 'concrete';
    return {
      id: c.id,
      kind: c.kind,
      icon: ICONS[c.kind],
      label: c.label,
      summary,
      savedAt: c.savedAt,
      link: concrete ? '../concrete' : '../calculations',
      query: concrete ? { edit: c.id } : { tab: c.kind, edit: c.id },
    };
  }

  private measurementRow(m: HeightMeasurement): Row {
    return {
      id: m.id,
      kind: 'measurement',
      icon: ICONS.measurement,
      label: m.label,
      summary: `H ${this.i18n.num(m.heightMeters)} m · D ${this.i18n.num(m.distanceMeters)} m`,
      savedAt: m.savedAt,
      link: '../camera',
      query: { edit: m.id },
    };
  }

  protected startRename(row: Row): void {
    this.newLabel.set(row.label);
    this.renaming.set(row);
  }

  protected async rename(): Promise<void> {
    const row = this.renaming();
    const label = this.newLabel().trim();
    if (!row || !label) return;
    if (row.kind === 'measurement') {
      const m = this.store.measurements().find((x) => x.id === row.id);
      if (m) await this.store.saveMeasurement({ ...m, label });
    } else {
      const c = this.store.calculations().find((x) => x.id === row.id);
      if (c) await this.store.saveCalculation({ ...c, label });
    }
    this.renaming.set(null);
  }

  protected async remove(): Promise<void> {
    const row = this.removing();
    if (row?.kind === 'measurement') {
      await this.store.deleteMeasurement(row.id);
    } else if (row) {
      await this.store.deleteCalculation(row.id);
    }
    this.removing.set(null);
  }

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
