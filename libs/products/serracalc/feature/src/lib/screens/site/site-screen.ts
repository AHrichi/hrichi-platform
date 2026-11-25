import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhMetricCard, AhTabs, type AhTabItem } from '@ah/ui';
import {
  compartmentFigures,
  defaultEconomics,
  type EconomicsParams,
  energyHub,
  type GreenhouseProject,
  type SavedCalculation,
  seawaterRo,
  siteEconomics,
  siteTotals,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { CalcSteps, type CalcStep } from '../../ui/calc-steps/calc-steps';
import { FieldGrid, type FieldChange } from '../../ui/field-grid/field-grid';
import { NoteList } from '../../ui/note-list/note-list';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import { injectCalcEditing } from '../calc-editing';
import { ECONOMICS_FIELDS, moneyField } from '../fields';

type SiteTab = 'overview' | 'economics';
const TABS: readonly SiteTab[] = ['overview', 'economics'];

/** The newest saved result of a kind among some projects. */
function latest(
  projects: readonly GreenhouseProject[],
  kind: SavedCalculation['kind'],
): SavedCalculation | undefined {
  return projects
    .flatMap((p) => p.calculations)
    .filter((c) => c.kind === kind)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
}

/**
 * The site: its compartments (projects that share the site's name, each a
 * house repeated over its area), their totals, the shared RO and CHP
 * against them, and the year's economics.
 */
@Component({
  selector: 'sc-site-screen',
  imports: [
    AhMetricCard,
    AhTabs,
    CalcSteps,
    FieldGrid,
    NoteList,
    RouterLink,
    SaveBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-screen.html',
  styleUrls: ['../calc-screen.scss', './site-screen.scss'],
})
export class SiteScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;

  /** Sites by name, from the projects' "Site" field. */
  protected readonly sites = computed(() => {
    const names = new Set(this.store.projects().map((p) => p.site.trim()));
    return [...names].sort();
  });
  private readonly chosen = signal<string | null>(null);
  protected readonly site = computed(
    () =>
      this.chosen() ??
      this.store.activeProject()?.site.trim() ??
      this.sites()[0] ??
      '',
  );
  protected readonly members = computed(() =>
    this.store.projects().filter((p) => p.site.trim() === this.site()),
  );
  protected readonly compartments = computed(() =>
    this.members().map(compartmentFigures),
  );
  protected readonly totals = computed(() => siteTotals(this.compartments()));
  /** Share of the site's area, for the bar of compartments. */
  protected readonly shares = computed(() => {
    const total = Math.max(0.0001, this.totals().areaHa);
    return this.compartments().map((c) => ({
      id: c.projectId,
      title: c.title,
      pct: (c.areaHa / total) * 100,
    }));
  });

  /** The shared plants, from the newest RO and energy results saved here. */
  protected readonly roCheck = computed(() => {
    const saved = latest(this.members(), 'ro');
    if (saved?.kind !== 'ro') return null;
    const available =
      (saved.inputs.capacityM3Day * saved.inputs.availabilityPct) / 100;
    const need = Math.max(1, this.totals().peakWaterM3Day);
    return {
      label: saved.label,
      available,
      pct: (available / need) * 100,
      product: seawaterRo(saved.inputs).productEcDsM,
    };
  });
  protected readonly chpCheck = computed(() => {
    const saved = latest(this.members(), 'energy');
    if (saved?.kind !== 'energy') return null;
    const peak = Math.max(1, this.totals().heatPeakMw * 1000);
    return {
      label: saved.label,
      thermalKw: saved.inputs.chpThermalKw,
      pct: (saved.inputs.chpThermalKw / peak) * 100,
      share: energyHub(saved.inputs).chpSharePct,
    };
  });

  protected readonly editor = injectCalcEditing<SiteTab>({
    tabs: TABS,
    kinds: { overview: 'economics', economics: 'economics' },
    load: (saved) => {
      if (saved.kind === 'economics') this.econParams.set({ ...saved.inputs });
    },
  });
  protected readonly tab = this.editor.tab;
  protected readonly tabs = computed<AhTabItem<SiteTab>[]>(() =>
    TABS.map((id) => ({ id, label: this.t().site.tabs[id] })),
  );

  protected readonly currency = computed(() => this.store.context().currency);
  protected readonly econParams = signal<EconomicsParams>(
    defaultEconomics(this.store.context()),
  );
  protected readonly econ = computed(() => siteEconomics(this.econParams()));
  protected readonly econFields = computed(() => {
    const c = this.currency();
    return [
      ...ECONOMICS_FIELDS,
      moneyField('pricePerKg', `${c}/kg`, 100),
      moneyField('wagePerDay', `${c}/d`),
      moneyField('heatPricePerMwh', `${c}/MWh`),
      moneyField('waterPricePerM3', `${c}/m³`, 100),
      moneyField('inputsPerM2', `${c}/m²`, 500),
      moneyField('otherPerM2', `${c}/m²`, 500),
      moneyField('capexPerM2', `${c}/m²`),
    ];
  });
  /** The year's costs, as shares of the total for the bar. */
  protected readonly costParts = computed(() => {
    const r = this.econ();
    const total = Math.max(1, r.totalCost);
    const c = this.t().site.costs;
    return (
      [
        ['labour', r.labour],
        ['energy', r.energy],
        ['water', r.water],
        ['inputs', r.inputs],
        ['other', r.other],
      ] as const
    ).map(([id, value]) => ({
      id,
      label: c[id],
      value,
      pct: (value / total) * 100,
    }));
  });

  protected readonly suggestedLabel = computed(
    () =>
      `${this.t().kinds.economics} · ${this.i18n.num(this.econParams().areaHa, 1)} ha · ${this.i18n.money(this.econ().costPerKg, this.currency())}/kg`,
  );

  protected readonly steps = computed<CalcStep[]>(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const f = this.t().site.formulas;
    const p = this.econParams();
    const r = this.econ();
    return [
      {
        label: f.yield,
        math: `${n(p.areaHa, 2)} ha × ${n(p.yieldTHa, 0)} t/ha = ${n(r.yieldT, 0)} t`,
      },
      {
        label: f.cost,
        math: `${n(r.totalCost, 0)} / ${n(r.yieldT * 1000, 0)} kg = ${n(r.costPerKg, 3)} /kg`,
      },
      {
        label: f.payback,
        math: `${n(p.areaHa * 10_000 * p.capexPerM2, 0)} / ${n(r.margin, 0)} = ${r.paybackYears === null ? '—' : n(r.paybackYears)}`,
      },
    ];
  });

  constructor() {
    effect(() => {
      const ctx = this.store.context();
      untracked(() => {
        if (!this.editor.editing()) this.econParams.set(defaultEconomics(ctx));
      });
    });
  }

  protected chooseSite(event: Event): void {
    this.chosen.set((event.target as HTMLSelectElement).value);
  }

  protected setArea(project: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    void this.store.setProjectArea(project, value > 0 ? value : undefined);
  }

  protected open(id: string): void {
    this.store.setActiveProject(id);
  }

  protected setEcon(change: FieldChange): void {
    this.econParams.update((p) => ({ ...p, [change.key]: change.value }));
  }

  /** The site's totals into the economics. */
  protected takeTotals(): void {
    const s = this.totals();
    this.econParams.update((p) => ({
      ...p,
      areaHa: s.areaHa,
      heatMwhYear: s.heatMwhYear,
      waterM3Year: s.waterM3Year,
      yieldTHa: s.areaHa > 0 ? Math.round(s.yieldT / s.areaHa) : p.yieldTHa,
    }));
  }

  protected save(request: SaveRequest): Promise<void> {
    return this.editor.save(this.econParams(), request);
  }
}
