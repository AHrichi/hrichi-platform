import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { AhMetricCard, AhTabs, type AhTabItem } from '@ah/ui';
import {
  type CalcContext,
  cropWater,
  defaultCropWater,
  defaultEnergyHub,
  defaultHeatReuse,
  energyHub,
  type EnergyHubParams,
  GAS_KWH_PER_M3,
  heatReuse,
  type HeatReuseParams,
  type SavedCalculation,
} from '@ah/products/serracalc/domain';
import { EnergyDay } from '../../diagrams/energy/energy-day';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import { ENERGY_FIELDS, priceField, REUSE_FIELDS } from '../fields';

type EnergyTab = 'chp' | 'reuse';
const TABS: readonly EnergyTab[] = ['chp', 'reuse'];

/**
 * The energy hub: a gas CHP giving heat, power and CO₂ through a winter
 * day with a buffer for the night, and the heat in chilled well water.
 */
@Component({
  selector: 'sc-energy-screen',
  imports: [
    AhMetricCard,
    AhTabs,
    CalcSteps,
    ContextBar,
    EnergyDay,
    FieldGrid,
    NoteList,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './energy-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class EnergyScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly reuseFields = REUSE_FIELDS;

  protected readonly hubParams = signal<EnergyHubParams>(
    defaultEnergyHub(this.store.context()),
  );
  protected readonly reuseParams = signal<HeatReuseParams>(
    defaultHeatReuse(this.store.context()),
  );
  protected readonly hub = computed(() => energyHub(this.hubParams()));
  protected readonly reuse = computed(() => heatReuse(this.reuseParams()));

  protected readonly editor = injectCalcEditing<EnergyTab>({
    tabs: TABS,
    kinds: { chp: 'energy', reuse: 'heatReuse' },
    load: (saved) => this.load(saved),
  });
  protected readonly tab = this.editor.tab;
  protected readonly tabs = computed<AhTabItem<EnergyTab>[]>(() =>
    TABS.map((id) => ({ id, label: this.t().energy.tabs[id] })),
  );

  protected readonly currency = computed(() => this.store.context().currency);
  protected readonly hubFields = computed(() => [
    ...ENERGY_FIELDS,
    priceField('gasPrice', `${this.currency()}/m³`),
    priceField('powerPrice', `${this.currency()}/kWh`),
  ]);

  /** Bars for the heat-reuse picture: chilled water against the need. */
  protected readonly reuseBars = computed(() => {
    const r = this.reuse();
    const need = this.reuseParams().heatDemandKwhDay;
    const top = Math.max(r.kwhDay, need, 1);
    return {
      water: (r.kwhDay / top) * 400,
      need: (need / top) * 400,
    };
  });

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    return this.tab() === 'chp'
      ? `${k.energy} · ${n(this.hubParams().chpElectricKw)} kWe · ${n(this.hub().chpSharePct)} %`
      : `${k.heatReuse} · ${n(this.reuseParams().waterM3Day)} m³ · ${n(this.reuse().kwhDay / 1000, 1)} MWh`;
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().energy.formulas;
    if (this.tab() === 'chp') {
      const p = this.hubParams();
      const r = this.hub();
      const hours = r.powerKwh / Math.max(1, p.chpElectricKw);
      return [
        {
          label: f.demand,
          math: `${n(p.lossCoefficientWK, 0)} W/K × (${n(p.nightSetC)} − ${n(p.outsideMinC)}) × (1 − ${n(p.screenSavingPct, 0)} %) → ${n(r.peakDemandKw, 0)} kW`,
        },
        {
          label: f.buffer,
          math: `1.163 × ${n(p.bufferM3, 0)} m³ × ${n(p.bufferDeltaK, 0)} K = ${n(r.bufferCapacityKwh, 0)} kWh`,
        },
        {
          label: f.gas,
          math: `${n(p.chpElectricKw, 0)} kW / ${n(p.chpElectricPct, 0)} % / ${GAS_KWH_PER_M3} × ${n(hours, 0)} h + boiler = ${n(r.gasM3, 0)} m³`,
        },
        {
          label: f.co2,
          math: `CO₂ = 1.96 kg/m³ × CHP gas → ${n(r.co2Kg, 0)} kg (${n(r.co2NeedKg, 0)} kg needed)`,
        },
      ];
    }
    const p = this.reuseParams();
    const r = this.reuse();
    return [
      {
        label: f.reuse,
        math: `1.163 × ${n(p.waterM3Day, 0)} m³ × (${n(p.inC)} − ${n(p.outC)}) K = ${n(r.kwhDay, 0)} kWh`,
      },
    ];
  });

  constructor() {
    effect(() => {
      const ctx = this.store.context();
      untracked(() => {
        if (!this.editor.editing()) this.reset(ctx);
      });
    });
  }

  protected reset(ctx: CalcContext = this.store.context()): void {
    this.hubParams.set(defaultEnergyHub(ctx));
    this.reuseParams.set(defaultHeatReuse(ctx));
  }

  private load(saved: SavedCalculation): void {
    if (saved.kind === 'energy') this.hubParams.set({ ...saved.inputs });
    if (saved.kind === 'heatReuse') this.reuseParams.set({ ...saved.inputs });
  }

  protected setHub(change: FieldChange): void {
    this.hubParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setReuse(change: FieldChange): void {
    this.reuseParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  /** Links: the crop's peak-day water and the winter day's heat need. */
  protected takeLinks(): void {
    const ctx = this.store.context();
    this.reuseParams.update((p) => ({
      ...p,
      waterM3Day: Math.round(cropWater(defaultCropWater(ctx)).peakM3Day),
      heatDemandKwhDay: this.hub().demandKwh,
    }));
  }

  protected save(request: SaveRequest): Promise<void> {
    return this.editor.save(
      this.tab() === 'chp' ? this.hubParams() : this.reuseParams(),
      request,
    );
  }
}
