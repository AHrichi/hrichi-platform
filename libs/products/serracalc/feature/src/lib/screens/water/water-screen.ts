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
  CLIMATES,
  climateById,
  cropWater,
  type CropWaterParams,
  defaultRainwater,
  rainwater,
  type RainwaterParams,
  type SavedCalculation,
} from '@ah/products/serracalc/domain';
import { CropBalance } from '../../diagrams/crop-balance/crop-balance';
import { RainBasin } from '../../diagrams/rain-basin/rain-basin';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { MonthBars, type MonthSeries } from '../../ui/month-bars/month-bars';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import { DEMAND_FIELDS, IRRIGATION_FIELDS, pick, RAIN_FIELDS } from '../fields';

type WaterTab = 'crop' | 'rain';

const DEMAND_KEYS = [
  'climateId',
  'floorAreaM2',
  'cropAreaPct',
  'transmissionPct',
  'shadingPct',
  'transpirationPct',
  'canopyPct',
  'drainPct',
] as const satisfies readonly (keyof CropWaterParams)[];
const IRRIGATION_KEYS = [
  'plantsPerM2',
  'emittersPerPlant',
  'emitterLh',
  'shotMl',
  'pumpM3h',
] as const satisfies readonly (keyof CropWaterParams)[];
const RAIN_KEYS = [
  'catchmentM2',
  'runoffPct',
  'basinM3',
] as const satisfies readonly (keyof RainwaterParams)[];

type Demand = Pick<CropWaterParams, (typeof DEMAND_KEYS)[number]>;
type Irrigation = Pick<CropWaterParams, (typeof IRRIGATION_KEYS)[number]>;
type Rain = Pick<RainwaterParams, (typeof RAIN_KEYS)[number]>;

@Component({
  selector: 'sc-water-screen',
  imports: [
    AhTabs,
    AhMetricCard,
    CalcSteps,
    ContextBar,
    CropBalance,
    FieldGrid,
    MonthBars,
    NoteList,
    RainBasin,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './water-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class WaterScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  protected readonly demandFields = DEMAND_FIELDS;
  protected readonly irrigationFields = IRRIGATION_FIELDS;
  protected readonly rainFields = RAIN_FIELDS;
  protected readonly climates = CLIMATES;

  private readonly start = defaultRainwater(this.store.context());
  protected readonly demand = signal<Demand>(pick(this.start, DEMAND_KEYS));
  protected readonly irrigation = signal<Irrigation>(
    pick(this.start, IRRIGATION_KEYS),
  );
  protected readonly rainInputs = signal<Rain>(pick(this.start, RAIN_KEYS));

  protected readonly cropParams = computed<CropWaterParams>(() => ({
    ...this.demand(),
    ...this.irrigation(),
  }));
  protected readonly rainParams = computed<RainwaterParams>(() => ({
    ...this.cropParams(),
    ...this.rainInputs(),
  }));
  protected readonly crop = computed(() => cropWater(this.cropParams()));
  protected readonly rain = computed(() => rainwater(this.rainParams()));

  protected readonly editor = injectCalcEditing<WaterTab>({
    tabs: ['crop', 'rain'],
    kinds: { crop: 'cropWater', rain: 'rainwater' },
    load: (saved) => this.load(saved),
  });
  protected readonly tab = this.editor.tab;

  protected readonly tabs = computed<AhTabItem<WaterTab>[]>(() =>
    (['crop', 'rain'] as const).map((id) => ({
      id,
      label: this.t().water.tabs[id],
    })),
  );

  protected readonly cropSeries = computed<MonthSeries[]>(() => [
    {
      label: this.t().water.peak,
      values: this.crop().months.map((m) => m.grossLm2),
    },
  ]);
  protected readonly cropAlt = computed(() =>
    this.t().water.monthlyAlt(
      this.i18n.month(this.crop().peakMonth),
      this.i18n.num(this.crop().peakGrossLm2),
    ),
  );
  protected readonly rainSeries = computed<MonthSeries[]>(() => {
    const w = this.t().water;
    const months = this.rain().months;
    return [
      { label: w.harvest, values: months.map((m) => m.harvestM3) },
      { label: w.demand, values: months.map((m) => m.demandM3) },
    ];
  });
  protected readonly rainAlt = computed(() =>
    this.t().water.rainAlt(this.i18n.num(this.rain().coveragePct, 0)),
  );

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    const place = climateById(this.demand().climateId).name;
    return this.tab() === 'crop'
      ? `${k.cropWater} · ${place} · ${n(this.crop().peakGrossLm2, 1)} L/m² · ${n(this.crop().annualM3)} m³`
      : `${k.rainwater} · ${place} · ${n(this.rainInputs().basinM3)} m³ · ${n(this.rain().coveragePct)} %`;
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().water.formulas;
    const p = this.cropParams();
    const r = this.crop();
    const peak = r.months[r.peakMonth];
    const rg = climateById(p.climateId).months[r.peakMonth].radiationMj;
    const common: CalcStep[] = [
      {
        label: f.inside,
        math: `${n(rg)} MJ/m² × ${n(p.transmissionPct, 0)} % × (1 − ${n(p.shadingPct, 0)} %) = ${n(peak.radiationInMj)} MJ/m²`,
      },
      {
        label: f.net,
        math: `${n(p.transpirationPct, 0)} % × ${n(p.canopyPct, 0)} % × ${n(peak.radiationInMj)} / 2.45 = ${n(peak.netLm2, 2)} L/m²`,
      },
      {
        label: f.gross,
        math: `${n(peak.netLm2, 2)} / (1 − ${n(p.drainPct, 0)} %) = ${n(peak.grossLm2, 2)} L/m²`,
      },
    ];
    if (this.tab() === 'crop') {
      return [
        ...common,
        {
          label: f.house,
          math: `${n(peak.grossLm2, 2)} L/m² × ${n(p.floorAreaM2, 0)} m² × ${n(p.cropAreaPct, 0)} % = ${n(peak.houseM3Day)} m³`,
        },
        {
          label: f.drippers,
          math: `${n((p.floorAreaM2 * p.cropAreaPct) / 100, 0)} m² × ${n(p.plantsPerM2)} × ${p.emittersPerPlant} = ${n(r.emitters, 0)}`,
        },
        {
          label: f.shots,
          math: `${n(r.litresPerEmitterPeak, 2)} L / ${n(p.shotMl / 1000, 2)} L → ${r.shotsPerDayPeak}`,
        },
      ];
    }
    const q = this.rainParams();
    return [
      ...common,
      {
        label: f.harvest,
        math: `${n(this.rain().annualRainMm, 0)} mm × ${n(q.catchmentM2, 0)} m² × ${n(q.runoffPct, 0)} % = ${n(this.rain().annualHarvestM3, 0)} m³`,
      },
      {
        label: f.basin,
        math: `${n(q.basinM3, 0)} m³ → ${n(this.rain().annualUsedM3, 0)} / ${n(this.rain().annualDemandM3, 0)} m³ = ${n(this.rain().coveragePct, 0)} %`,
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
    const start = defaultRainwater(ctx);
    this.demand.set(pick(start, DEMAND_KEYS));
    this.irrigation.set(pick(start, IRRIGATION_KEYS));
    this.rainInputs.set(pick(start, RAIN_KEYS));
  }

  private load(saved: SavedCalculation): void {
    if (saved.kind === 'cropWater' || saved.kind === 'rainwater') {
      this.demand.set(pick(saved.inputs, DEMAND_KEYS));
      this.irrigation.set(pick(saved.inputs, IRRIGATION_KEYS));
    }
    if (saved.kind === 'rainwater') {
      this.rainInputs.set(pick(saved.inputs, RAIN_KEYS));
    }
  }

  protected setDemand(change: FieldChange): void {
    this.demand.update((d) => ({ ...d, [change.key]: change.value }));
  }

  protected setClimate(climateId: string): void {
    this.demand.update((d) => ({ ...d, climateId }));
  }

  protected setIrrigation(change: FieldChange): void {
    this.irrigation.update((d) => ({ ...d, [change.key]: change.value }));
  }

  protected setRain(change: FieldChange): void {
    this.rainInputs.update((d) => ({ ...d, [change.key]: change.value }));
  }

  protected useSuggested(): void {
    this.rainInputs.update((d) => ({
      ...d,
      basinM3: this.rain().suggestedBasinM3,
    }));
  }

  protected save(request: SaveRequest): Promise<void> {
    return this.editor.save(
      this.tab() === 'crop' ? this.cropParams() : this.rainParams(),
      request,
    );
  }

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
