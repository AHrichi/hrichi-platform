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
  climateById,
  CLIMATES,
  COOLING_BENCHMARK_KWH_M2,
  coolingYear,
  type CoolingYearParams,
  cropWater,
  defaultCoolingYear,
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
import { MonthBars, type MonthSeries } from '../../ui/month-bars/month-bars';
import { injectCalcEditing } from '../calc-editing';
import {
  COOLING_YEAR_FIELDS,
  ENERGY_FIELDS,
  priceField,
  REUSE_FIELDS,
} from '../fields';
import { Panel } from '../../ui/panel/panel';

type EnergyTab = 'chp' | 'reuse' | 'cooling';
const TABS: readonly EnergyTab[] = ['chp', 'reuse', 'cooling'];

/**
 * The energy hub: a gas CHP giving heat, power and CO₂ through a winter
 * day with a buffer for the night, the heat in chilled well water, and a
 * year of cooling electricity against the published range.
 */
@Component({
  selector: 'sc-energy-screen',
  imports: [
    Panel,
    AhMetricCard,
    AhTabs,
    CalcSteps,
    ContextBar,
    EnergyDay,
    FieldGrid,
    MonthBars,
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
  protected readonly climates = CLIMATES;
  protected readonly benchmark = COOLING_BENCHMARK_KWH_M2;

  protected readonly hubParams = signal<EnergyHubParams>(
    defaultEnergyHub(this.store.context()),
  );
  protected readonly reuseParams = signal<HeatReuseParams>(
    defaultHeatReuse(this.store.context()),
  );
  protected readonly hub = computed(() => energyHub(this.hubParams()));
  protected readonly reuse = computed(() => heatReuse(this.reuseParams()));
  protected readonly coolParams = signal<CoolingYearParams>(
    defaultCoolingYear(this.store.context()),
  );
  protected readonly cool = computed(() => coolingYear(this.coolParams()));
  protected readonly coolSeries = computed<MonthSeries[]>(() => [
    {
      label: this.t().energy.coolKwhM2,
      values: this.cool().months.map((m) => m.kwhM2),
    },
  ]);
  protected readonly coolAlt = computed(() =>
    this.t().energy.coolChartAlt(
      climateById(this.coolParams().climateId).name,
      this.i18n.num(this.cool().kwhM2Year, 1),
    ),
  );

  protected readonly editor = injectCalcEditing<EnergyTab>({
    tabs: TABS,
    kinds: { chp: 'energy', reuse: 'heatReuse', cooling: 'coolingYear' },
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
  protected readonly coolFields = computed(() => [
    ...COOLING_YEAR_FIELDS,
    priceField('electricityPrice', `${this.currency()}/kWh`),
  ]);

  /** Bars for the heat-reuse picture: chilled water against the need. */
  protected readonly reuseBars = computed(() => {
    const r = this.reuse();
    const need = this.reuseParams().heatDemandKwhDay;
    const top = Math.max(r.kwhDay, need, 1);
    // Bars start at x 140 of 560: up to 320 long leaves room for the label.
    return {
      water: (r.kwhDay / top) * 320,
      need: (need / top) * 320,
    };
  });

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    if (this.tab() === 'cooling') {
      const c = this.coolParams();
      return `${k.coolingYear} · ${climateById(c.climateId).name} · ${n(this.cool().kwhM2Year, 1)} kWh/m²`;
    }
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
    if (this.tab() === 'cooling') {
      const c = this.coolParams();
      const y = this.cool();
      const fanW = c.airflowM3hM2 * c.fanWPerM3h;
      return [
        {
          label: f.coolPower,
          math: `${n(c.airflowM3hM2, 0)} m³/h·m² × ${n(c.fanWPerM3h, 3)} W·h/m³ + ${n(c.pumpWm2)} W/m² = ${n(fanW + c.pumpWm2, 2)} W/m² → ${n(y.peakKw, 0)} kW`,
        },
        {
          label: f.coolShare,
          math: `f = min(1, (T − ${n(c.coolFromC)}) / ${n(c.fullAtK)} K) → ${n(y.hoursYear, 0)} h`,
        },
        {
          label: f.coolYear,
          math: `Σ = ${n(y.kwhM2Year)} kWh/m² × ${n(c.floorAreaM2, 0)} m² = ${n(y.mwhYear)} MWh`,
        },
        {
          label: f.coolCheck,
          math: `${n(y.kwhM2Year)} / ${n(COOLING_BENCHMARK_KWH_M2, 0)} = ${n(y.benchmarkPct, 0)} %`,
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
    this.coolParams.set(defaultCoolingYear(ctx));
  }

  private load(saved: SavedCalculation): void {
    if (saved.kind === 'energy') this.hubParams.set({ ...saved.inputs });
    if (saved.kind === 'heatReuse') this.reuseParams.set({ ...saved.inputs });
    if (saved.kind === 'coolingYear') this.coolParams.set({ ...saved.inputs });
  }

  protected setHub(change: FieldChange): void {
    this.hubParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setReuse(change: FieldChange): void {
    this.reuseParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setCool(change: FieldChange): void {
    this.coolParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setCoolClimate(id: string): void {
    this.coolParams.update((p) => ({ ...p, climateId: id }));
  }

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
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
    const tab = this.tab();
    return this.editor.save(
      tab === 'chp'
        ? this.hubParams()
        : tab === 'reuse'
          ? this.reuseParams()
          : this.coolParams(),
      request,
    );
  }
}
