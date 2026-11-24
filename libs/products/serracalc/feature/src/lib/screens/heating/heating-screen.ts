import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  AhMetricCard,
  AhSplitBar,
  AhTabs,
  type AhTabItem,
  type SplitBarSegment,
} from '@ah/ui';
import {
  annualHeating,
  type AnnualHeatingParams,
  type CalcContext,
  CLIMATES,
  climateById,
  COVER_IDS,
  COVERS,
  type CoverMaterial,
  defaultAnnualHeating,
  defaultFuelPrice,
  defaultHeatLoss,
  defaultHotWater,
  type EnvelopeParams,
  FUEL_IDS,
  FUELS,
  type FuelType,
  heatLoss,
  type HeatLossParams,
  hotWaterHeating,
  type HotWaterParams,
  PIPE_IDS,
  type PipeType,
  type SavedCalculation,
  SCREEN_IDS,
  SCREEN_SAVINGS,
  type ScreenType,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { MonthBars, type MonthSeries } from '../../ui/month-bars/month-bars';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import {
  ENVELOPE_FIELDS,
  fuelPriceField,
  HOT_WATER_FIELDS,
  PEAK_FIELDS,
  pick,
  YEAR_FIELDS,
} from '../fields';

type HeatingTab = 'peak' | 'year' | 'pipes';

const ENVELOPE_KEYS: readonly (keyof EnvelopeParams)[] = [
  'floorAreaM2',
  'coverAreaM2',
  'volumeM3',
  'perimeterM',
  'cover',
  'uValue',
  'airChangesPerHour',
  'perimeterInsulated',
  'screen',
  'screenSavingPct',
];

type PeakExtra = Omit<HeatLossParams, keyof EnvelopeParams>;
type YearExtra = Omit<AnnualHeatingParams, keyof EnvelopeParams>;
const PEAK_KEYS: readonly (keyof PeakExtra)[] = [
  'insideC',
  'outsideDesignC',
  'screenClosed',
  'marginPct',
];
const YEAR_KEYS: readonly (keyof YearExtra)[] = [
  'climateId',
  'nightSetC',
  'daySetC',
  'transmissionPct',
  'solarGainPct',
  'fuel',
  'efficiencyPct',
  'fuelPrice',
];

@Component({
  selector: 'sc-heating-screen',
  imports: [
    AhTabs,
    AhMetricCard,
    AhSplitBar,
    CalcSteps,
    ContextBar,
    FieldGrid,
    MonthBars,
    NoteList,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './heating-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class HeatingScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  protected readonly envelopeFields = ENVELOPE_FIELDS;
  protected readonly peakFields = PEAK_FIELDS;
  protected readonly pipeFields = HOT_WATER_FIELDS;
  protected readonly covers = COVER_IDS;
  protected readonly screens = SCREEN_IDS;
  protected readonly climates = CLIMATES;
  protected readonly fuels = FUEL_IDS;
  protected readonly pipes = PIPE_IDS;

  private readonly start = defaultHeatLoss(this.store.context());
  protected readonly envelope = signal<EnvelopeParams>(
    pick(this.start, ENVELOPE_KEYS),
  );
  protected readonly peakExtra = signal<PeakExtra>(pick(this.start, PEAK_KEYS));
  protected readonly yearExtra = signal<YearExtra>(
    pick(defaultAnnualHeating(this.store.context()), YEAR_KEYS),
  );
  protected readonly pipeParams = signal<HotWaterParams>(
    defaultHotWater(this.store.context()),
  );

  protected readonly peakParams = computed<HeatLossParams>(() => ({
    ...this.envelope(),
    ...this.peakExtra(),
  }));
  protected readonly yearParams = computed<AnnualHeatingParams>(() => ({
    ...this.envelope(),
    ...this.yearExtra(),
  }));
  protected readonly peak = computed(() => heatLoss(this.peakParams()));
  protected readonly year = computed(() => annualHeating(this.yearParams()));
  protected readonly hotWater = computed(() =>
    hotWaterHeating(this.pipeParams()),
  );

  protected readonly editor = injectCalcEditing<HeatingTab>({
    tabs: ['peak', 'year', 'pipes'],
    kinds: { peak: 'heatPeak', year: 'heatYear', pipes: 'hotWater' },
    load: (saved) => this.load(saved),
  });
  protected readonly tab = this.editor.tab;

  protected readonly tabs = computed<AhTabItem<HeatingTab>[]>(() =>
    (['peak', 'year', 'pipes'] as const).map((id) => ({
      id,
      label: this.t().heating.tabs[id],
    })),
  );

  protected readonly currency = computed(() => this.store.context().currency);
  protected readonly fuelUnit = computed(
    () => this.t().fuelUnits[FUELS[this.yearExtra().fuel].unit],
  );
  protected readonly yearFields = computed(() => [
    ...YEAR_FIELDS,
    fuelPriceField(`${this.currency()}/${this.fuelUnit()}`),
  ]);

  protected readonly designNight = computed(() => {
    const climate = climateById(this.store.context().climateId);
    return this.t().heating.designNight(
      climate.name,
      this.i18n.num(climate.designWinterC),
    );
  });

  protected readonly breakdown = computed<SplitBarSegment[]>(() => {
    const r = this.peak();
    const parts = this.t().heating.parts;
    const total = Math.max(1, r.totalW);
    const kw = (w: number) => `${this.i18n.num(w / 1000, 0)} kW`;
    const pct = (w: number) => Math.round((w / total) * 100);
    return [
      {
        label: parts.transmission,
        percentage: pct(r.transmissionW),
        value: kw(r.transmissionW),
      },
      {
        label: parts.infiltration,
        percentage: pct(r.infiltrationW),
        value: kw(r.infiltrationW),
      },
      {
        label: parts.perimeter,
        percentage: pct(r.perimeterW),
        value: kw(r.perimeterW),
      },
    ];
  });

  protected readonly monthly = computed<MonthSeries[]>(() => {
    const h = this.t().heating;
    const months = this.year().months;
    return [
      { label: h.night, values: months.map((m) => m.nightKwh / 1000) },
      { label: h.day, values: months.map((m) => m.dayKwh / 1000) },
    ];
  });

  protected readonly monthlyAlt = computed(() =>
    this.t().heating.monthlyAlt(
      this.i18n.month(this.year().peakMonth),
      this.i18n.num(this.year().annualKwh / 1000, 0),
    ),
  );

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    switch (this.tab()) {
      case 'peak':
        return `${k.heatPeak} · ${n(this.peak().designKw)} kW · ${n(this.peakExtra().outsideDesignC, 1)} °C`;
      case 'year':
        return `${k.heatYear} · ${n(this.year().annualKwh / 1000)} MWh · ${climateById(this.yearExtra().climateId).name}`;
      case 'pipes':
        return `${k.hotWater} · ${n(this.hotWater().flowM3h, 1)} m³/h · ${n(this.hotWater().pipeLengthM)} m`;
    }
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().heating.formulas;
    switch (this.tab()) {
      case 'peak': {
        const p = this.peakParams();
        const r = this.peak();
        const saving = p.screenClosed ? p.screenSavingPct : 0;
        return [
          {
            label: f.transmission,
            math: `${n(p.uValue)} × (1 − ${n(saving, 0)} %) × ${n(p.coverAreaM2, 0)} m² × ${n(r.deltaT)} K = ${n(r.transmissionW / 1000)} kW`,
          },
          {
            label: f.infiltration,
            math: `0.335 × ${n(p.airChangesPerHour, 2)} × ${n(p.volumeM3, 0)} m³ × (1 − ${n(saving, 0)} %) × ${n(r.deltaT)} K = ${n(r.infiltrationW / 1000)} kW`,
          },
          {
            label: f.perimeter,
            math: `${p.perimeterInsulated ? '0.7' : '1.4'} × ${n(p.perimeterM, 0)} m × ${n(r.deltaT)} K = ${n(r.perimeterW / 1000)} kW`,
          },
          {
            label: f.design,
            math: `${n(r.totalW / 1000)} kW × (1 + ${n(p.marginPct, 0)} %) = ${n(r.designKw)} kW`,
          },
        ];
      }
      case 'year': {
        const p = this.yearParams();
        const r = this.year();
        const jan = r.months[0];
        const fuel = FUELS[p.fuel];
        return [
          {
            label: f.night,
            math: `(${n(p.nightSetC)} − ${n(jan.nightMeanC)}) °C × ${n(jan.nightHours)} h × 31 → ${n(jan.nightKwh / 1000)} MWh`,
          },
          {
            label: f.day,
            math: `(${n(p.daySetC)} − ${n(jan.dayMeanC)}) °C, ${n(p.solarGainPct, 0)} % × ${n(p.transmissionPct, 0)} % sun → ${n(jan.dayKwh / 1000)} MWh`,
          },
          {
            label: f.fuel,
            math: `${n(r.annualKwh, 0)} kWh / (${n(fuel.kwhPerUnit, 2)} × ${n(p.efficiencyPct, 0)} %) = ${n(r.fuelUnits, 0)} ${this.fuelUnit()}`,
          },
        ];
      }
      case 'pipes': {
        const p = this.pipeParams();
        const r = this.hotWater();
        return [
          {
            label: f.flow,
            math: `${n(p.heatDemandKw, 0)} kW / (1.163 × ${n(r.deltaWaterK)} K) = ${n(r.flowM3h)} m³/h`,
          },
          {
            label: f.output,
            math: `π × D × (${n(r.convectionWm2K, 2)} + ${n(r.radiationWm2K, 2)}) × ${n(r.pipeDeltaK)} K = ${n(r.pipeOutputWPerM)} W/m`,
          },
          {
            label: f.length,
            math: `${n(p.heatDemandKw * 1000, 0)} W / ${n(r.pipeOutputWPerM)} W/m = ${n(r.pipeLengthM, 0)} m`,
          },
          {
            label: f.pump,
            math: `1000 × 9.81 × ${n(r.flowM3h / 3600, 4)} m³/s × ${n(p.pumpHeadM)} m / ${n(p.pumpEfficiencyPct, 0)} % = ${n(r.pumpKw, 2)} kW`,
          },
        ];
      }
    }
  });

  constructor() {
    // Follow the active project, unless a saved result is open.
    effect(() => {
      const ctx = this.store.context();
      untracked(() => {
        if (!this.editor.editing()) this.reset(ctx);
      });
    });
  }

  protected reset(ctx: CalcContext = this.store.context()): void {
    const peak = defaultHeatLoss(ctx);
    const year = defaultAnnualHeating(ctx);
    this.envelope.set(pick(peak, ENVELOPE_KEYS));
    this.peakExtra.set(pick(peak, PEAK_KEYS));
    this.yearExtra.set(pick(year, YEAR_KEYS));
    this.pipeParams.set({
      ...defaultHotWater(ctx),
      heatDemandKw: heatLoss(peak).designKw,
      annualHeatKwh: annualHeating(year).annualKwh,
    });
  }

  private load(saved: SavedCalculation): void {
    switch (saved.kind) {
      case 'heatPeak':
        this.envelope.set(pick(saved.inputs, ENVELOPE_KEYS));
        this.peakExtra.set(pick(saved.inputs, PEAK_KEYS));
        break;
      case 'heatYear':
        this.envelope.set(pick(saved.inputs, ENVELOPE_KEYS));
        this.yearExtra.set(pick(saved.inputs, YEAR_KEYS));
        break;
      case 'hotWater':
        this.pipeParams.set({ ...saved.inputs });
        break;
    }
  }

  protected setEnvelope(change: FieldChange): void {
    this.envelope.update((e) => ({ ...e, [change.key]: change.value }));
  }

  protected setCover(cover: CoverMaterial): void {
    this.envelope.update((e) => ({
      ...e,
      cover,
      uValue: COVERS[cover].uValue,
      airChangesPerHour: COVERS[cover].airChangesPerHour,
    }));
  }

  protected setScreen(screen: ScreenType): void {
    this.envelope.update((e) => ({
      ...e,
      screen,
      screenSavingPct: SCREEN_SAVINGS[screen],
    }));
  }

  protected setInsulated(perimeterInsulated: boolean): void {
    this.envelope.update((e) => ({ ...e, perimeterInsulated }));
  }

  protected setPeak(change: FieldChange): void {
    this.peakExtra.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setScreenClosed(screenClosed: boolean): void {
    this.peakExtra.update((p) => ({ ...p, screenClosed }));
  }

  protected setYear(change: FieldChange): void {
    this.yearExtra.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setClimate(climateId: string): void {
    this.yearExtra.update((p) => ({ ...p, climateId }));
  }

  protected setFuel(fuel: FuelType): void {
    this.yearExtra.update((p) => ({
      ...p,
      fuel,
      efficiencyPct: FUELS[fuel].efficiencyPct,
      fuelPrice: defaultFuelPrice(fuel, this.currency()),
    }));
  }

  protected setPipes(change: FieldChange): void {
    this.pipeParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setPipe(pipe: PipeType): void {
    this.pipeParams.update((p) => ({ ...p, pipe }));
  }

  protected usePeak(): void {
    this.pipeParams.update((p) => ({
      ...p,
      heatDemandKw: this.peak().designKw,
    }));
  }

  protected useYear(): void {
    this.pipeParams.update((p) => ({
      ...p,
      annualHeatKwh: this.year().annualKwh,
    }));
  }

  protected save(request: SaveRequest): Promise<void> {
    const inputs =
      this.tab() === 'peak'
        ? this.peakParams()
        : this.tab() === 'year'
          ? this.yearParams()
          : this.pipeParams();
    return this.editor.save(inputs, request);
  }

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
