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
  adviceParams,
  type CalcContext,
  COOLING_RULES,
  coolingAdvice,
  defaultFog,
  defaultPadFan,
  defaultVentilation,
  fogCooling,
  type FogParams,
  padAndFan,
  type PadFanParams,
  type SavedCalculation,
  type SolarLoadParams,
  ventilation,
  type VentilationParams,
} from '@ah/products/serracalc/domain';
import { FogDiagram } from '../../diagrams/fog/fog-diagram';
import { PadFanFlow } from '../../diagrams/pad-fan/pad-fan-flow';
import { VentAirflow } from '../../diagrams/vent-airflow/vent-airflow';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { AdviceCard } from '../../ui/advice-card/advice-card';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import {
  FOG_FIELDS,
  PAD_FAN_FIELDS,
  pick,
  SOLAR_FIELDS,
  VENTILATION_FIELDS,
} from '../fields';

type CoolingTab = 'ventilation' | 'padFan' | 'fog';
const TABS: readonly CoolingTab[] = ['ventilation', 'padFan', 'fog'];

const SOLAR_KEYS: readonly (keyof SolarLoadParams)[] = [
  'floorAreaM2',
  'coverAreaM2',
  'volumeM3',
  'uValue',
  'radiationWm2',
  'transmissionPct',
  'shadingPct',
  'evapotranspirationPct',
];
type VentExtra = Omit<VentilationParams, keyof SolarLoadParams>;
type PadExtra = Omit<PadFanParams, keyof SolarLoadParams>;
type FogExtra = Omit<FogParams, keyof SolarLoadParams>;
const VENT_KEYS: readonly (keyof VentExtra)[] = [
  'outsideC',
  'maxRiseK',
  'windMs',
  'ventOpeningM',
  'fanCapacityM3h',
];
const PAD_KEYS: readonly (keyof PadExtra)[] = [
  'outsideC',
  'outsideRhPct',
  'padEfficiencyPct',
  'riseK',
  'padFaceVelocityMs',
  'padHeightM',
  'padToFanM',
  'fanCapacityM3h',
  'hoursPerDay',
];

const FOG_KEYS: readonly (keyof FogExtra)[] = [
  'outsideC',
  'outsideRhPct',
  'ventPct',
  'ventOpeningM',
  'windMs',
  'nozzlesPer100M2',
  'nozzleLh',
  'pressureBar',
  'onS',
  'maxRhPct',
  'hoursPerDay',
];

@Component({
  selector: 'sc-cooling-screen',
  imports: [
    AdviceCard,
    AhTabs,
    AhMetricCard,
    CalcSteps,
    ContextBar,
    FieldGrid,
    FogDiagram,
    NoteList,
    PadFanFlow,
    SaveBar,
    VentAirflow,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cooling-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class CoolingScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  protected readonly solarFields = SOLAR_FIELDS;
  protected readonly ventFields = VENTILATION_FIELDS;
  protected readonly padFields = PAD_FAN_FIELDS;
  protected readonly fogFields = FOG_FIELDS;
  protected readonly ventLimit = COOLING_RULES.ventLimitPct;

  private readonly startVent = defaultVentilation(this.store.context());
  private readonly startPad = defaultPadFan(this.store.context());
  private readonly startFog = defaultFog(this.store.context());
  /** Sun and house for ventilation, and for the pads (which assume shade). */
  protected readonly ventSolar = signal<SolarLoadParams>(
    pick(this.startVent, SOLAR_KEYS),
  );
  protected readonly padSolar = signal<SolarLoadParams>(
    pick(this.startPad, SOLAR_KEYS),
  );
  protected readonly ventExtra = signal<VentExtra>(
    pick(this.startVent, VENT_KEYS),
  );
  protected readonly padExtra = signal<PadExtra>(pick(this.startPad, PAD_KEYS));
  protected readonly fogSolar = signal<SolarLoadParams>(
    pick(this.startFog, SOLAR_KEYS),
  );
  protected readonly fogExtra = signal<FogExtra>(pick(this.startFog, FOG_KEYS));

  protected readonly ventParams = computed<VentilationParams>(() => ({
    ...this.ventSolar(),
    ...this.ventExtra(),
  }));
  protected readonly padParams = computed<PadFanParams>(() => ({
    ...this.padSolar(),
    ...this.padExtra(),
  }));
  protected readonly vent = computed(() => ventilation(this.ventParams()));
  protected readonly pad = computed(() => padAndFan(this.padParams()));
  protected readonly fogParams = computed<FogParams>(() => ({
    ...this.fogSolar(),
    ...this.fogExtra(),
  }));
  protected readonly fog = computed(() => fogCooling(this.fogParams()));
  /** The strategy for the ventilation tab's afternoon. */
  protected readonly advice = computed(() =>
    coolingAdvice(adviceParams(this.ventParams(), this.store.context())),
  );

  protected readonly editor = injectCalcEditing<CoolingTab>({
    tabs: TABS,
    kinds: { ventilation: 'ventilation', padFan: 'padFan', fog: 'fog' },
    load: (saved) => this.load(saved),
  });
  protected readonly tab = this.editor.tab;

  protected readonly tabs = computed<AhTabItem<CoolingTab>[]>(() =>
    TABS.map((id) => ({
      id,
      label: this.t().cooling.tabs[id],
    })),
  );

  protected readonly solar = computed(() => this.solarSignal()());

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    if (this.tab() === 'fog') {
      return `${k.fog} · ${n(this.fogExtra().outsideC, 1)} → ${n(this.fog().insideC, 1)} °C · ${n(this.fog().waterM3Day, 1)} m³/d`;
    }
    return this.tab() === 'ventilation'
      ? `${k.ventilation} · ${n(this.ventExtra().outsideC, 1)} °C · ${n(this.vent().airChangesPerHour)} /h`
      : `${k.padFan} · ${n(this.padExtra().outsideC, 1)} °C · ${this.pad().fans} × ${n(this.padExtra().fanCapacityM3h)} m³/h`;
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().cooling.formulas;
    if (this.tab() === 'ventilation') {
      const p = this.ventParams();
      const r = this.vent();
      return [
        {
          label: f.solar,
          math: `${n(p.transmissionPct, 0)} % × (1 − ${n(p.shadingPct, 0)} %) × ${n(p.radiationWm2, 0)} W/m² × ${n(p.floorAreaM2, 0)} m² × (1 − ${n(p.evapotranspirationPct, 0)} %) = ${n(r.solarLoadW / 1000, 0)} kW`,
        },
        {
          label: f.conduction,
          math: `${n(p.uValue)} × ${n(p.coverAreaM2, 0)} m² × ${n(p.maxRiseK)} K = ${n(r.conductionW / 1000, 0)} kW`,
        },
        {
          label: f.flow,
          math: `${n(r.netLoadW / 1000, 0)} kW / (1.2 × 1005 × ${n(p.maxRiseK)} K) = ${n(r.flowM3s)} m³/s = ${n(r.flowM3h, 0)} m³/h`,
        },
        {
          label: f.vents,
          math: `A = 2 × ${n(r.flowM3s)} / (0.65 × √(2 × 9.81 × ${n(p.maxRiseK)}/${n(p.outsideC + 273.15, 0)} × ${n(p.ventOpeningM)}/4 + 0.1 × ${n(p.windMs)}²)) = ${n(r.ventAreaM2, 0)} m²`,
        },
      ];
    }
    if (this.tab() === 'fog') {
      const p = this.fogParams();
      const r = this.fog();
      return [
        {
          label: f.fogRate,
          math: `${r.nozzles} × ${n(p.nozzleLh)} L/h / ${n(p.floorAreaM2, 0)} m² = ${n(r.fogGm2Min)} g/m²·min`,
        },
        {
          label: f.fogBalance,
          math: `${n(p.outsideC)} + (S − 2.45 MJ × E) / (1.2 × 1005 × ${n(r.airFlowM3h / 3600, 0)} m³/s + U·A) = ${n(r.insideC)} °C`,
        },
        {
          label: f.fogCycle,
          math: `${n(r.dutyPct, 0)} % → ${n(r.onS, 0)} s / ${n(r.offS, 0)} s (RH ≤ ${n(p.maxRhPct, 0)} %)`,
        },
        {
          label: f.fogWater,
          math: `${n(r.fogGm2Min)} × ${n(p.floorAreaM2, 0)} × ${n((p.hoursPerDay * 60 * r.dutyPct) / 100, 0)} min / 10⁶ = ${n(r.waterM3Day)} m³`,
        },
      ];
    }
    const p = this.padParams();
    const r = this.pad();
    return [
      {
        label: f.padOutlet,
        math: `${n(p.outsideC)} − ${n(p.padEfficiencyPct, 0)} % × (${n(p.outsideC)} − ${n(r.wetBulbC)}) = ${n(r.padOutletC)} °C`,
      },
      {
        label: f.padFlow,
        math: `${n(r.netLoadW / 1000, 0)} kW / (1.2 × 1005 × ${n(p.riseK)} K) = ${n(r.flowM3h, 0)} m³/h`,
      },
      {
        label: f.pad,
        math: `${n(r.flowM3h / 3600)} m³/s / ${n(p.padFaceVelocityMs, 2)} m/s = ${n(r.padAreaM2)} m² → ${n(r.padLengthM)} m × ${n(p.padHeightM)} m`,
      },
      {
        label: f.water,
        math: `1.2 × ${n(r.flowM3h / 3600)} × 1005 × (${n(p.outsideC)} − ${n(r.padOutletC)}) / 2.45 MJ × 3600 = ${n(r.evaporationLh, 0)} L/h`,
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
    const vent = defaultVentilation(ctx);
    const pad = defaultPadFan(ctx);
    const fog = defaultFog(ctx);
    this.fogSolar.set(pick(fog, SOLAR_KEYS));
    this.fogExtra.set(pick(fog, FOG_KEYS));
    this.ventSolar.set(pick(vent, SOLAR_KEYS));
    this.ventExtra.set(pick(vent, VENT_KEYS));
    this.padSolar.set(pick(pad, SOLAR_KEYS));
    this.padExtra.set(pick(pad, PAD_KEYS));
  }

  private load(saved: SavedCalculation): void {
    if (saved.kind === 'ventilation') {
      this.ventSolar.set(pick(saved.inputs, SOLAR_KEYS));
      this.ventExtra.set(pick(saved.inputs, VENT_KEYS));
    } else if (saved.kind === 'padFan') {
      this.padSolar.set(pick(saved.inputs, SOLAR_KEYS));
      this.padExtra.set(pick(saved.inputs, PAD_KEYS));
    } else if (saved.kind === 'fog') {
      this.fogSolar.set(pick(saved.inputs, SOLAR_KEYS));
      this.fogExtra.set(pick(saved.inputs, FOG_KEYS));
    }
  }

  protected setSolar(change: FieldChange): void {
    this.solarSignal().update((s) => ({ ...s, [change.key]: change.value }));
  }

  protected setVent(change: FieldChange): void {
    this.ventExtra.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setPad(change: FieldChange): void {
    this.padExtra.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setFog(change: FieldChange): void {
    this.fogExtra.update((p) => ({ ...p, [change.key]: change.value }));
  }

  /** The advisor's button: fog this house on its design afternoon. */
  protected openFog(): void {
    this.editor.select('fog');
  }

  /** The sun-and-house inputs of the open tab. */
  private solarSignal() {
    const tab = this.tab();
    return tab === 'ventilation'
      ? this.ventSolar
      : tab === 'padFan'
        ? this.padSolar
        : this.fogSolar;
  }

  protected save(request: SaveRequest): Promise<void> {
    const tab = this.tab();
    return this.editor.save(
      tab === 'ventilation'
        ? this.ventParams()
        : tab === 'padFan'
          ? this.padParams()
          : this.fogParams(),
      request,
    );
  }
}
