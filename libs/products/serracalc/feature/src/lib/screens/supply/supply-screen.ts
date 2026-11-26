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
  defaultFertigation,
  defaultRo,
  fertigation,
  type FertigationParams,
  type FlushStrategy,
  type FlushStrategyResult,
  type RoParams,
  type SavedCalculation,
  seawaterRo,
} from '@ah/products/serracalc/domain';
import { FertigationLoop } from '../../diagrams/fertigation/fertigation-loop';
import { RoFlow } from '../../diagrams/ro/ro-flow';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { ContextBar } from '../../ui/context-bar/context-bar';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import { FERTIGATION_FIELDS, priceField, RO_FIELDS } from '../fields';
import { Panel } from '../../ui/panel/panel';

type SupplyTab = 'ro' | 'fertigation';
const TABS: readonly SupplyTab[] = ['ro', 'fertigation'];

/** Strategy columns where the lowest figure is the best, in table order. */
type StrategyCol =
  | 'letGoM3Year'
  | 'freshM3Year'
  | 'stockLostLYear'
  | 'meanRootEcDsM'
  | 'yieldLossPct';
const STRATEGY_COLS: readonly StrategyCol[] = [
  'letGoM3Year',
  'freshM3Year',
  'stockLostLYear',
  'meanRootEcDsM',
  'yieldLossPct',
];

/** Sodium's share of the salt left in RO water (NaCl: 23 of 58.4). */
const NA_SHARE = 23 / 58.44;

/**
 * The water chain: seawater RO sized from the crop's peak day, and the
 * nutrient loop with drain recycling, fed by that RO water.
 */
@Component({
  selector: 'sc-supply-screen',
  imports: [
    Panel,
    AhMetricCard,
    AhTabs,
    CalcSteps,
    ContextBar,
    FertigationLoop,
    FieldGrid,
    NoteList,
    RoFlow,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './supply-screen.html',
  styleUrl: '../calc-screen.scss',
})
export class SupplyScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly fertFields = FERTIGATION_FIELDS;

  protected readonly roParams = signal<RoParams>(
    defaultRo(this.store.context()),
  );
  protected readonly fertParams = signal<FertigationParams>(
    defaultFertigation(this.store.context()),
  );
  protected readonly ro = computed(() => seawaterRo(this.roParams()));
  protected readonly fert = computed(() => fertigation(this.fertParams()));
  protected readonly strategyCols = STRATEGY_COLS;

  /** Which strategy is lowest in each column (bold in the table). */
  protected readonly lowest = computed(() => {
    const rows = this.fert().strategies;
    const best = {} as Record<StrategyCol, FlushStrategy>;
    for (const col of STRATEGY_COLS) {
      best[col] = rows.reduce((a, b) => (b[col] < a[col] ? b : a)).id;
    }
    return best;
  });

  /** The flush card's hint: the limit that ends the loop, or where it levels. */
  protected readonly flushHint = computed(() => {
    const r = this.fert();
    const n = (v: number) => this.i18n.num(v);
    const s = this.t().supply;
    if (r.flushDay !== null) return s.limitBy[r.limitBy];
    if (r.naEquilibriumMmolL === null) return '';
    return `${s.levelsAt} Na ${n(r.naEquilibriumMmolL)} · Cl ${n(r.clEquilibriumMmolL ?? 0)} mmol/L`;
  });

  protected readonly editor = injectCalcEditing<SupplyTab>({
    tabs: TABS,
    kinds: { ro: 'ro', fertigation: 'fertigation' },
    load: (saved) => this.load(saved),
  });
  protected readonly tab = this.editor.tab;
  protected readonly tabs = computed<AhTabItem<SupplyTab>[]>(() =>
    TABS.map((id) => ({ id, label: this.t().supply.tabs[id] })),
  );

  protected readonly currency = computed(() => this.store.context().currency);
  protected readonly roFields = computed(() => [
    ...RO_FIELDS,
    priceField('electricityPrice', `${this.currency()}/kWh`),
  ]);
  /** The project's crop on its peak day, m³: what the chain must deliver. */
  protected readonly cropPeak = computed(
    () => cropWater(defaultCropWater(this.store.context())).peakM3Day,
  );

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 0) => this.i18n.num(v, d);
    const k = this.t().kinds;
    return this.tab() === 'ro'
      ? `${k.ro} · ${n(this.ro().needM3Day)} m³/d · R ${n(this.roParams().recoveryPct)} %`
      : `${k.fertigation} · ${n(this.fertParams().recyclePct)} % · EC ${n(this.fert().drainEcDsM, 1)}`;
  });

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().supply.formulas;
    if (this.tab() === 'ro') {
      const p = this.roParams();
      const r = this.ro();
      return [
        {
          label: f.roFeed,
          math: `${n(r.needM3Day, 0)} m³ / ${n(p.recoveryPct / 100, 2)} = ${n(r.feedM3Day, 0)} m³/d`,
        },
        {
          label: f.roBrine,
          math: `${n(r.feedM3Day, 0)} − ${n(r.needM3Day, 0)} = ${n(r.brineM3Day, 0)} m³/d · ${n(p.feedSalinityGL)} / (1 − ${n(p.recoveryPct / 100, 2)}) ≈ ${n(r.brineSalinityGL)} g/L`,
        },
        {
          label: f.roEnergy,
          math: `${n(p.secKwhM3)} kWh/m³ × ${n(r.needM3Day, 0)} m³ = ${n(r.energyKwhDay, 0)} kWh/d`,
        },
      ];
    }
    const p = this.fertParams();
    const r = this.fert();
    const uptake = p.appliedM3Day - r.drainM3Day;
    return [
      {
        label: f.fertDrain,
        math: `(${n(p.appliedM3Day, 0)} × ${n(p.targetEcDsM)} − ${n(uptake, 0)} × ${n(p.uptakeEcDsM)}) / ${n(r.drainM3Day, 0)} = ${n(r.drainEcDsM, 2)} dS/m`,
      },
      {
        label: f.fertNa,
        math:
          r.naEquilibriumMmolL === null
            ? `${n(p.systemM3, 0)} × (${n(p.naLimitMmolL)} × ${n(r.drainM3Day, 0)} / ${n(p.appliedM3Day, 0)} − ${n(p.sourceNaMmolL)}) / (${n(p.sourceNaMmolL)} × ${n(r.freshM3Day, 0)}) = ${r.flushDay ?? '—'} d`
            : `${n(p.sourceNaMmolL)} × ${n(r.freshM3Day, 0)} / ${n(r.dischargedM3Day, 0)} = ${n(r.naEquilibriumMmolL)} mmol/L`,
      },
      {
        label: f.fertYield,
        math: `1 − ${n(p.yieldSlopePct / 100, 3)} × (${n(r.rootEcDsM)} − ${n(p.yieldThresholdEc)}) = ${n(100 - r.yieldLossPct)} %`,
      },
      {
        label: f.fertStock,
        math: `1 : ${n(p.dilution, 0)} → ${n(r.stockLDay, 0)} L/d · ${n(p.stockTankM3)} m³ → ${n(r.stockDays)} d`,
      },
    ];
  });

  protected cell(row: FlushStrategyResult, col: StrategyCol): string {
    const digits = col === 'meanRootEcDsM' ? 2 : col === 'yieldLossPct' ? 1 : 0;
    return this.i18n.num(row[col], digits);
  }

  constructor() {
    effect(() => {
      const ctx = this.store.context();
      untracked(() => {
        if (!this.editor.editing()) this.reset(ctx);
      });
    });
  }

  protected reset(ctx: CalcContext = this.store.context()): void {
    this.roParams.set(defaultRo(ctx));
    this.fertParams.set(defaultFertigation(ctx));
  }

  private load(saved: SavedCalculation): void {
    if (saved.kind === 'ro') this.roParams.set({ ...saved.inputs });
    if (saved.kind === 'fertigation') {
      // Results saved before chloride was tracked lack its two fields;
      // before the drain had its own limit, the flush ceiling was it.
      this.fertParams.set({
        ...defaultFertigation(this.store.context()),
        ...saved.inputs,
        drainEcMaxDsM: saved.inputs.drainEcMaxDsM ?? saved.inputs.flushEcDsM,
      });
    }
  }

  protected setRo(change: FieldChange): void {
    this.roParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  protected setFert(change: FieldChange): void {
    this.fertParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  /** Links the chain to the crop: the peak day's water. */
  protected takeDemand(): void {
    const peak = Math.round(this.cropPeak() * 10) / 10;
    if (this.tab() === 'ro') {
      this.roParams.update((p) => ({ ...p, demandM3Day: Math.round(peak) }));
    } else {
      this.fertParams.update((p) => ({ ...p, appliedM3Day: peak }));
    }
  }

  /** Feeds the nutrient loop with the RO plant's water. */
  protected useRoWater(): void {
    const r = this.ro();
    const na = (r.productMgL * NA_SHARE) / 23;
    this.fertParams.update((p) => ({
      ...p,
      sourceEcDsM: Math.round(r.productEcDsM * 100) / 100,
      sourceNaMmolL: Math.round(na * 10) / 10,
      // Sodium chloride: as many chloride ions as sodium ones.
      sourceClMmolL: Math.round(na * 10) / 10,
    }));
  }

  protected save(request: SaveRequest): Promise<void> {
    return this.editor.save(
      this.tab() === 'ro' ? this.roParams() : this.fertParams(),
      request,
    );
  }
}
