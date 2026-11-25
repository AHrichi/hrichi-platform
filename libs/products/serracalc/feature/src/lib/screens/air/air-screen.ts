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
  co2Enrichment,
  type Co2Params,
  type Co2Source,
  defaultCo2,
  defaultHumidity,
  defaultLight,
  type HumidityParams,
  humidityRatio,
  type LightParams,
  MOL_PER_MJ_PAR,
  nightHumidity,
  PAR_FRACTION,
  type SavedCalculation,
  supplementalLight,
} from '@ah/products/serracalc/domain';
import { Co2Diagram } from '../../diagrams/co2/co2-diagram';
import { HumidityDiagram } from '../../diagrams/humidity/humidity-diagram';
import { LightDiagram } from '../../diagrams/light/light-diagram';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import {
  MonthBars,
  type MonthRef,
  type MonthSeries,
} from '../../ui/month-bars/month-bars';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import {
  CO2_FIELDS,
  HUMIDITY_FIELDS,
  LIGHT_FIELDS,
  priceField,
} from '../fields';

type AirTab = 'light' | 'co2' | 'humidity';
const TABS: readonly AirTab[] = ['light', 'co2', 'humidity'];

/** Light, CO₂ and night humidity: the climate the crop grows in. */
@Component({
  selector: 'sc-air-screen',
  imports: [
    AhTabs,
    AhMetricCard,
    CalcSteps,
    Co2Diagram,
    ContextBar,
    FieldGrid,
    HumidityDiagram,
    LightDiagram,
    MonthBars,
    NoteList,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './air-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class AirScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly climates = CLIMATES;
  protected readonly humidityFields = HUMIDITY_FIELDS;
  protected readonly sources: readonly Co2Source[] = ['burner', 'liquid'];

  protected readonly lightParams = signal<LightParams>(
    defaultLight(this.store.context()),
  );
  protected readonly co2Params = signal<Co2Params>(
    defaultCo2(this.store.context()),
  );
  protected readonly humidityParams = signal<HumidityParams>(
    defaultHumidity(this.store.context()),
  );
  protected readonly light = computed(() =>
    supplementalLight(this.lightParams()),
  );
  protected readonly co2 = computed(() => co2Enrichment(this.co2Params()));
  protected readonly humidity = computed(() =>
    nightHumidity(this.humidityParams()),
  );

  protected readonly editor = injectCalcEditing<AirTab>({
    tabs: TABS,
    kinds: { light: 'light', co2: 'co2', humidity: 'humidity' },
    load: (saved) => this.load(saved),
  });
  protected readonly tab = this.editor.tab;
  protected readonly tabs = computed<AhTabItem<AirTab>[]>(() =>
    TABS.map((id) => ({ id, label: this.t().air.tabs[id] })),
  );

  protected readonly currency = computed(() => this.store.context().currency);
  protected readonly lightFields = computed(() => [
    ...LIGHT_FIELDS,
    priceField('electricityPrice', `${this.currency()}/kWh`),
  ]);
  protected readonly co2Fields = computed(() => [
    ...CO2_FIELDS,
    priceField('co2Price', `${this.currency()}/kg`),
    priceField('gasPrice', `${this.currency()}/m³`),
  ]);

  protected readonly lightSeries = computed<MonthSeries[]>(() => [
    {
      label: this.t().air.sunDli,
      values: this.light().months.map((m) => m.naturalDli),
    },
  ]);
  protected readonly lightRefs = computed<MonthRef[]>(() => [
    { label: this.t().diagrams.target, value: this.lightParams().targetDli },
    { label: this.t().diagrams.ceiling, value: this.lightParams().maxDli },
  ]);
  protected readonly lightAlt = computed(() =>
    this.t().air.chartAlt(
      climateById(this.lightParams().climateId).name,
      this.i18n.num(this.lightParams().targetDli, 0),
    ),
  );

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    switch (this.tab()) {
      case 'light': {
        const r = this.light();
        const place = climateById(this.lightParams().climateId).name;
        return r.fixtures > 0
          ? `${k.light} · ${place} · ${r.fixtures} × ${n(this.lightParams().fixtureW)} W`
          : `${k.light} · ${place} · ${n(r.maxShadePct)} %`;
      }
      case 'co2':
        return `${k.co2} · ${n(this.co2Params().targetPpm)} ppm · ${n(this.co2().supplyKgH, 1)} kg/h`;
      case 'humidity':
        return `${k.humidity} · ${n(this.humidityParams().insideC, 1)} °C ${n(this.humidityParams().insideRhPct)} % · ${n(this.humidity().airM3h ?? 0)} m³/h`;
    }
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().air.formulas;
    switch (this.tab()) {
      case 'light': {
        const p = this.lightParams();
        const r = this.light();
        const design = r.months[r.designMonth];
        const rg = climateById(p.climateId).months[r.designMonth].radiationMj;
        const shaded = r.months.reduce((a, b) =>
          b.shadePct > a.shadePct ? b : a,
        );
        return [
          {
            label: f.dli,
            math: `${n(rg)} MJ/m² × ${PAR_FRACTION} × ${MOL_PER_MJ_PAR} × ${n(p.transmissionPct, 0)} % = ${n(design.naturalDli)} mol/m²`,
          },
          {
            label: f.ppfd,
            math: `(${n(p.targetDli, 0)} − ${n(design.naturalDli)}) × 10⁶ / (${n(p.lampHours, 0)} h × 3600) = ${n(r.designPpfd, 0)} µmol/m²·s`,
          },
          {
            label: f.fixtures,
            math: `${n(r.designPpfd, 0)} / ${n(p.efficacyUmolJ)} × ${n(p.floorAreaM2, 0)} m² / ${n(p.fixtureW, 0)} W → ${r.fixtures}`,
          },
          {
            label: f.shade,
            math: `1 − ${n(p.maxDli, 0)} / ${n(shaded.naturalDli)} = ${n(shaded.shadePct, 0)} %`,
          },
        ];
      }
      case 'co2': {
        const p = this.co2Params();
        const r = this.co2();
        return [
          {
            label: f.leak,
            math: `${n(p.airChangesPerHour, 2)} × ${n(p.volumeM3, 0)} m³ × ${n(p.targetPpm - p.outsidePpm, 0)} ppm × 1.83 × 10⁻⁶ = ${n(r.ventLossKgH)} kg/h`,
          },
          {
            label: f.uptake,
            math: `${n(p.uptakeGm2h)} g/m²·h × ${n(p.floorAreaM2, 0)} m² = ${n(r.uptakeKgH)} kg/h`,
          },
          {
            label: f.burner,
            math: `${n(r.supplyKgH)} / 1.96 = ${n(r.gasM3h)} m³/h × 9.77 × ${n(p.burnerEfficiencyPct, 0)} % = ${n(r.burnerHeatKw, 0)} kW`,
          },
        ];
      }
      case 'humidity': {
        const p = this.humidityParams();
        const r = this.humidity();
        const dx =
          (humidityRatio(p.insideC, p.insideRhPct) -
            humidityRatio(p.outsideC, p.outsideRhPct)) *
          1000;
        return [
          {
            label: f.water,
            math: `${n(p.transpirationGm2h, 0)} g/m²·h × ${n(p.floorAreaM2, 0)} m² = ${n(r.moistureKgH)} kg/h`,
          },
          {
            label: f.air,
            math: `${n(r.moistureKgH)} / (1.2 × ${n(dx, 2)} g/kg) = ${r.airM3h === null ? '—' : n(r.airM3h, 0)} m³/h`,
          },
          {
            label: f.heat,
            math: `1.2 × 1005 × ${n((r.airM3h ?? 0) / 3600, 2)} m³/s × ${n(p.insideC - p.outsideC)} K = ${n(r.heatKw)} kW`,
          },
          {
            label: f.surface,
            math: `${n(p.insideC)} − ${n(p.uValue)}/8 × ${n(p.insideC - p.outsideC)} = ${n(r.coverSurfaceC)} °C (dew ${n(r.dewPointC)} °C)`,
          },
        ];
      }
    }
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
    this.lightParams.set(defaultLight(ctx));
    this.co2Params.set(defaultCo2(ctx));
    this.humidityParams.set(defaultHumidity(ctx));
  }

  private load(saved: SavedCalculation): void {
    switch (saved.kind) {
      case 'light':
        this.lightParams.set({ ...saved.inputs });
        break;
      case 'co2':
        this.co2Params.set({ ...saved.inputs });
        break;
      case 'humidity':
        this.humidityParams.set({ ...saved.inputs });
        break;
    }
  }

  protected setLight(change: FieldChange): void {
    this.lightParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setClimate(climateId: string): void {
    this.lightParams.update((p) => ({ ...p, climateId }));
  }

  protected setCo2(change: FieldChange): void {
    this.co2Params.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setSource(source: Co2Source): void {
    this.co2Params.update((p) => ({ ...p, source }));
  }

  protected setHumidity(change: FieldChange): void {
    this.humidityParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected save(request: SaveRequest): Promise<void> {
    const inputs =
      this.tab() === 'light'
        ? this.lightParams()
        : this.tab() === 'co2'
          ? this.co2Params()
          : this.humidityParams();
    return this.editor.save(inputs, request);
  }

  protected value(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
