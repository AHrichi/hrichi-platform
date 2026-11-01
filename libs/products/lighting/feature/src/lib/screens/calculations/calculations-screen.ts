import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AhMetricCard, AhTabs, type AhTabItem } from '@ah/ui';
import {
  calculateElectricalNetwork,
  calculateEnergy,
  calculateFoundation,
  calculatePoleSpacing,
  calculateSolarSizing,
  calculateSpan,
  checkSpacingCable,
  CONDUCTORS,
  type ConductorType,
  type ElectricalParams,
  type EnergyParams,
  type FoundationCalculationParams,
  type PoleKind,
  type PoleMaterial,
  type PoleRole,
  POLE_KIND_LOADS,
  type RoadLightingClass,
  type SavedCalculation,
  type SoilType,
  type SolarSizingParams,
  type SpacingCalculationParams,
  type SpanCalculationParams,
  type WindZone,
} from '@ah/products/lighting/domain';
import { CableDiagram } from '../../diagrams/cable-diagram/cable-diagram';
import { EnergyDiagram } from '../../diagrams/energy-diagram/energy-diagram';
import { FoundationDiagram } from '../../diagrams/foundation-diagram/foundation-diagram';
import { SolarDiagram } from '../../diagrams/solar-diagram/solar-diagram';
import { SpacingDiagram } from '../../diagrams/spacing-diagram/spacing-diagram';
import { SpanDiagram } from '../../diagrams/span-diagram/span-diagram';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import { HowTo } from '../../ui/how-to/how-to';
import { NoteList } from '../../ui/note-list/note-list';
import { NumberField } from '../../ui/number-field/number-field';
import { SaveBar, type SaveRequest } from '../../ui/save-bar/save-bar';
import {
  CONDUCTOR_TYPES,
  POLE_KINDS,
  POLE_ROLES,
  ROAD_CLASSES,
  SOIL_TYPES,
  WIND_ZONES,
} from '../options';

export type CalculatorTab =
  'spacing' | 'foundation' | 'solar' | 'electrical' | 'span' | 'energy';
const TABS: readonly CalculatorTab[] = [
  'spacing',
  'foundation',
  'solar',
  'electrical',
  'span',
  'energy',
];

function isTab(value: string | null): value is CalculatorTab {
  return TABS.includes(value as CalculatorTab);
}

@Component({
  selector: 'lp-calculations-screen',
  imports: [
    AhTabs,
    AhMetricCard,
    NumberField,
    NoteList,
    SaveBar,
    SpacingDiagram,
    FoundationDiagram,
    SolarDiagram,
    CableDiagram,
    SpanDiagram,
    EnergyDiagram,
    HowTo,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calculations-screen.html',
  styleUrl: './calculations-screen.scss',
})
export class CalculationsScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly roadClasses = ROAD_CLASSES;
  protected readonly soilTypes = SOIL_TYPES;
  protected readonly windZones = WIND_ZONES;
  protected readonly conductorTypes = CONDUCTOR_TYPES;
  protected readonly poleRoles = POLE_ROLES;
  protected readonly poleKinds = POLE_KINDS;
  protected readonly materials: readonly PoleMaterial[] = [
    'galvanized_steel',
    'aluminum',
    'fiberglass',
  ];

  protected readonly tab = signal<CalculatorTab>('spacing');
  protected readonly tabs = computed<AhTabItem<CalculatorTab>[]>(() =>
    TABS.map((id) => ({ id, label: this.t().calc.tabs[id] })),
  );

  // Spacing (EN 13201)
  protected readonly sHeight = signal(8);
  protected readonly sSpacing = signal(28);
  protected readonly sRoadWidth = signal(7);
  protected readonly sRoadClass = signal<RoadLightingClass>('M3');
  protected readonly sLumens = signal(7500);
  protected readonly sMaintenance = signal(0.8);
  // The overhead cable the poles carry, if any, and what the poles are.
  protected readonly sCable = signal(true);
  protected readonly sConductor = signal<ConductorType>('abc_2x16');
  protected readonly sPoleKind = signal<PoleKind>('steel');
  protected readonly sNominal = signal(POLE_KIND_LOADS.steel);
  protected readonly sWindZone = signal<WindZone>(2);
  protected readonly spacingParams = computed<SpacingCalculationParams>(() => ({
    mountingHeightMeters: this.sHeight(),
    spacingMeters: this.sSpacing(),
    roadWidthMeters: this.sRoadWidth(),
    roadClass: this.sRoadClass(),
    luminaireLumens: this.sLumens(),
    maintenanceFactor: this.sMaintenance(),
    overheadCable: this.sCable()
      ? {
          conductor: this.sConductor(),
          poleKind: this.sPoleKind(),
          poleNominalLoadDaN: this.sNominal(),
          windZone: this.sWindZone(),
        }
      : undefined,
  }));
  protected readonly spacing = computed(() =>
    calculatePoleSpacing(this.spacingParams()),
  );
  /** The spacing checked against the cable and the poles' rated load. */
  protected readonly spacingCable = computed(() => {
    const params = this.spacingParams();
    return params.overheadCable
      ? checkSpacingCable(params, params.overheadCable)
      : null;
  });
  protected readonly spacingCableLimit = computed(() => {
    const limit = this.spacingCable()?.span.limitingFactor;
    return limit ? this.t().spanLimits[limit] : '';
  });

  /** Choosing a pole type fills in its typical rated load. */
  protected setSpacingPoleKind(kind: PoleKind): void {
    this.sPoleKind.set(kind);
    this.sNominal.set(POLE_KIND_LOADS[kind]);
  }

  // Foundation (Eurocode 7)
  protected readonly fHeight = signal(8);
  protected readonly fWindZone = signal<WindZone>(2);
  protected readonly fSoil = signal<SoilType>('compact_gravel');
  protected readonly fSolar = signal(true);
  protected readonly fPanelArea = signal(1.2);
  protected readonly fMaterial = signal<PoleMaterial>('galvanized_steel');
  protected readonly fDepth = signal(1.45);
  protected readonly foundationParams = computed<FoundationCalculationParams>(
    () => ({
      poleHeightMeters: this.fHeight(),
      windZone: this.fWindZone(),
      soilType: this.fSoil(),
      hasSolarPanel: this.fSolar(),
      solarPanelAreaM2: this.fPanelArea(),
      poleMaterial: this.fMaterial(),
      excavationDepthMeters: this.fDepth(),
    }),
  );
  protected readonly foundation = computed(() =>
    calculateFoundation(this.foundationParams()),
  );

  // Solar autonomy
  protected readonly pLed = signal(40);
  protected readonly pSunHours = signal(4.8);
  protected readonly pAutonomy = signal(3);
  protected readonly pVoltage = signal<12 | 24>(24);
  protected readonly pChemistry = signal<'LiFePO4' | 'Gel_AGM'>('LiFePO4');
  protected readonly pProfile = signal<SolarSizingParams['dimmingProfile']>({
    hoursStage1: 4,
    pctStage1: 100,
    hoursStage2: 4,
    pctStage2: 50,
    hoursStage3: 3,
    pctStage3: 30,
  });
  protected readonly solarParams = computed<SolarSizingParams>(() => {
    const p = this.pProfile();
    return {
      ledWattage: this.pLed(),
      dailyOperatingHours: p.hoursStage1 + p.hoursStage2 + p.hoursStage3,
      peakSunHours: this.pSunHours(),
      autonomyDays: this.pAutonomy(),
      systemVoltage: this.pVoltage(),
      batteryChemistry: this.pChemistry(),
      dimmingProfile: p,
    };
  });
  protected readonly solar = computed(() =>
    calculateSolarSizing(this.solarParams()),
  );

  // Electrical (NF C 17-200)
  protected readonly eVoltage = signal<230 | 400>(230);
  protected readonly eLength = signal(120);
  protected readonly eCount = signal(6);
  protected readonly eWattage = signal(60);
  protected readonly eMaterial = signal<'copper' | 'aluminum'>('copper');
  protected readonly eMaxDrop = signal(3);
  protected readonly electricalParams = computed<ElectricalParams>(() => ({
    circuitVoltage: this.eVoltage(),
    cableLengthMeters: this.eLength(),
    totalLuminairesCount: this.eCount(),
    wattagePerLuminaire: this.eWattage(),
    conductorMaterial: this.eMaterial(),
    maxAllowableVoltageDropPct: this.eMaxDrop(),
  }));
  protected readonly electrical = computed(() =>
    calculateElectricalNetwork(this.electricalParams()),
  );

  // Overhead wire and span (NF C 11-201)
  protected readonly lSpan = signal(35);
  protected readonly lConductor = signal<ConductorType>('abc_4x16');
  protected readonly lEveryday = signal(12);
  protected readonly lWindZone = signal<WindZone>(2);
  protected readonly lRole = signal<PoleRole>('intermediate');
  protected readonly lDeviation = signal(30);
  protected readonly lPoleHeight = signal(8);
  protected readonly lAttachment = signal(7.5);
  protected readonly lNominal = signal(250);
  protected readonly lPoleKind = signal<PoleKind>('concrete');
  protected readonly lClearance = signal(6);
  protected readonly spanParams = computed<SpanCalculationParams>(() => ({
    spanMeters: this.lSpan(),
    conductor: this.lConductor(),
    everydayTensionPct: this.lEveryday(),
    windZone: this.lWindZone(),
    poleRole: this.lRole(),
    deviationDegrees: this.lDeviation(),
    poleHeightMeters: this.lPoleHeight(),
    attachmentHeightMeters: Math.min(this.lAttachment(), this.lPoleHeight()),
    poleNominalLoadDaN: this.lNominal(),
    requiredClearanceMeters: this.lClearance(),
    poleKind: this.lPoleKind(),
  }));

  protected setSpanPoleKind(kind: PoleKind): void {
    this.lPoleKind.set(kind);
    this.lNominal.set(POLE_KIND_LOADS[kind]);
  }
  protected readonly span = computed(() => calculateSpan(this.spanParams()));
  /** What stops the span growing, in words; empty when nothing does by 150 m. */
  protected readonly spanLimit = computed(() => {
    const limit = this.span().limitingFactor;
    return limit ? this.t().spanLimits[limit] : '';
  });

  // A year of energy and cost, LEDs against the old lamps
  protected readonly gLuminaires = signal(20);
  protected readonly gLed = signal(60);
  protected readonly gOld = signal(170);
  protected readonly gHours = signal(11.5);
  protected readonly gDimming = signal(30);
  protected readonly gTariff = signal(0.12);
  protected readonly gCo2 = signal(0.47);
  protected readonly gRetrofit = signal(250);
  protected readonly energyParams = computed<EnergyParams>(() => ({
    luminaires: this.gLuminaires(),
    ledWatts: this.gLed(),
    oldWatts: this.gOld(),
    hoursPerNight: this.gHours(),
    dimmingSavingPct: this.gDimming(),
    tariffPerKwh: this.gTariff(),
    co2KgPerKwh: this.gCo2(),
    retrofitCostPerLuminaire: this.gRetrofit(),
  }));
  protected readonly energy = computed(() =>
    calculateEnergy(this.energyParams()),
  );

  /** The saved calculation being edited (from ?edit=), if any. */
  protected readonly editing = signal<SavedCalculation | null>(null);
  protected readonly editingLabel = computed(() =>
    this.editing()?.kind === this.tab()
      ? (this.editing()?.label ?? null)
      : null,
  );

  protected readonly suggestedLabel = computed(() => {
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    const name = this.t().calc.tabs[this.tab()];
    switch (this.tab()) {
      case 'spacing':
        return `${name} · ${this.sRoadClass()} · H ${n(this.sHeight())} m · S ${n(this.sSpacing(), 0)} m`;
      case 'foundation':
        return `${name} · H ${n(this.fHeight())} m · D ${n(this.fDepth(), 2)} m`;
      case 'solar':
        return `${name} · ${this.pLed()} W · ${this.solar().commercialPanelSizeWatts} Wp`;
      case 'electrical':
        return `${name} · ${n(this.eLength(), 0)} m · ${this.electrical().recommendedCrossSectionMm2} mm²`;
      case 'span':
        return `${name} · L ${n(this.lSpan())} m · ${this.t().poleRoles[this.lRole()]}`;
      case 'energy':
        return `${name} · ${this.gLuminaires()} × ${this.gLed()} W · −${this.energy().savingPct} %`;
    }
  });

  /** Where each input comes from on site. */
  protected readonly howTo = computed(() => this.t().howTo[this.tab()]);

  /** "How it's calculated": each formula with today's numbers in it. */
  protected readonly steps = computed(() => {
    const f = this.t().formulas;
    const n = (v: number, d = 1) => this.i18n.num(v, d);
    switch (this.tab()) {
      case 'spacing': {
        const r = this.spacing();
        return [
          {
            label: f.ratio,
            math: `S / H = ${n(this.sSpacing(), 0)} / ${n(this.sHeight())} = ${n(r.spacingRatio, 2)}`,
          },
          {
            label: f.illuminance,
            math: `E = Φ × UF × MF / (W × S) = ${n(this.sLumens(), 0)} × ${n(r.utilizationFactor, 2)} × ${n(this.sMaintenance(), 2)} / (${n(this.sRoadWidth())} × ${n(this.sSpacing(), 0)}) = ${n(r.estimatedAverageLux)} lx`,
          },
          {
            label: f.target(this.sRoadClass()),
            math: `E ≥ ${n(r.requiredAverageLux)} lx · U₀ ≥ ${n(r.requiredUniformity, 2)}`,
          },
        ];
      }
      case 'foundation': {
        const r = this.foundation();
        return [
          {
            label: f.minDepth,
            math: `D_min = (H / 10 + 0.5${this.fSolar() ? ' + 0.25' : ''}) × k_soil × k_wind = ${n(r.minRecommendedDepthMeters, 2)} m`,
          },
          {
            label: f.moment,
            math: `M = Σ F × ${this.i18n.word(f.leverArm)} = ${n(r.overturningMomentDanM, 0)} daN·m`,
          },
          {
            label: f.safety,
            math: `SF = M_stab / M = ${n(r.safetyFactor, 2)} (≥ 1.5)`,
          },
          {
            label: f.volume,
            math: `V = B × B × D = ${n(r.recommendedBlockWidthMeters, 2)}² × ${n(r.minRecommendedDepthMeters, 2)} = ${n(r.recommendedVolumeM3, 2)} m³ ≈ ${n(r.minConcreteMassKg, 0)} kg`,
          },
        ];
      }
      case 'solar': {
        const r = this.solar();
        const p = this.pProfile();
        const dod = r.maxDischargeDepthPct / 100;
        const eff = this.pChemistry() === 'LiFePO4' ? 0.95 : 0.85;
        return [
          {
            label: f.effectiveHours,
            math: `h = ${n(p.hoursStage1)}×${p.pctStage1}% + ${n(p.hoursStage2)}×${p.pctStage2}% + ${n(p.hoursStage3)}×${p.pctStage3}% = ${n(r.effectiveFullPowerHours, 2)} h`,
          },
          {
            label: f.nightEnergy,
            math: `E = P × h / 0.9 = ${this.pLed()} × ${n(r.effectiveFullPowerHours, 2)} / 0.9 = ${n(r.dailyEnergyConsumptionWh, 0)} Wh`,
          },
          {
            label: f.panel,
            math: `Wp ≥ E / (PSH × 0.75) = ${n(r.dailyEnergyConsumptionWh, 0)} / (${n(this.pSunHours())} × 0.75) = ${n(r.minSolarPanelPeakWatts, 0)} → ${r.commercialPanelSizeWatts} Wp`,
          },
          {
            label: f.battery,
            math: `C ≥ E × ${this.pAutonomy()} / (${n(dod, 2)} × ${n(eff, 2)}) = ${n(r.minBatteryCapacityWh, 0)} Wh = ${n(r.minBatteryCapacityAh, 0)} Ah → ${r.commercialBatteryCapacityAh} Ah`,
          },
        ];
      }
      case 'electrical': {
        const r = this.electrical();
        const three = this.eVoltage() === 400;
        return [
          {
            label: f.current,
            math: `I = P / (${three ? '√3 × ' : ''}V × cos φ) = ${n(r.totalPowerWatts, 0)} / (${three ? '√3 × ' : ''}${this.eVoltage()} × 0.95) = ${n(r.totalCurrentAmperes, 2)} A`,
          },
          {
            label: f.drop,
            math: `ΔU = ${three ? '√3' : '2'} × ρ × 0.55 L × I × cos φ / S = ${n(r.actualVoltageDropVolts, 2)} V`,
          },
          {
            label: f.dropPct,
            math: `${n(r.actualVoltageDropVolts, 2)} / ${this.eVoltage()} = ${n(r.actualVoltageDropPct, 2)} % (≤ ${n(this.eMaxDrop())} %)`,
          },
        ];
      }
      case 'span': {
        const r = this.span();
        const p = this.spanParams();
        const g = this.t().span.formulas;
        const c = CONDUCTORS[p.conductor];
        const hot = r.states.find((s) => s.state === 'hot');
        const theta = n(p.deviationDegrees, 0);
        const pole =
          p.poleRole === 'terminal'
            ? `F = T + F_w × L / 2 = ${n(r.poleLoadDaN, 0)} daN`
            : p.poleRole === 'angle'
              ? `F = 2 T sin(${theta}° / 2) + F_w × L × cos(${theta}° / 2) = ${n(r.poleLoadDaN, 0)} daN`
              : `F = F_w × L = ${n(r.windNPerM, 2)} × ${n(p.spanMeters)} = ${n(r.poleLoadDaN, 0)} daN`;
        return [
          {
            label: g.weight,
            math: `w = m × g = ${n(c.massKgPerM, 2)} × 9.81 = ${n(r.weightNPerM, 2)} N/m`,
          },
          {
            label: g.wind,
            math: `F_w = 0.75 × q × d (d = ${c.diameterMm} mm) = ${n(r.windNPerM, 2)} N/m`,
          },
          {
            label: g.sag,
            math: `f = w × L² / (8 H₀), H₀ = ${n(p.everydayTensionPct)} % × ${c.breakingLoadDaN} daN → f = ${n(r.sagEverydayMeters, 2)} m`,
          },
          {
            label: g.change,
            math: `H² (H − H₀ + EA w₀² L² / 24 H₀² + EA α Δt) = EA w² L² / 24 → 50 °C: ${n(hot?.tensionDaN ?? 0, 0)} daN, f = ${n(r.sagHotMeters, 2)} m`,
          },
          {
            label: g.wire,
            math: `T_max = ${n(r.maxTensionDaN, 0)} daN ≤ ${c.breakingLoadDaN} / 3 = ${n(r.allowedTensionDaN, 0)} daN → ${n(r.conductorUtilization * 100, 0)} %`,
          },
          {
            label: g.pole,
            math: `${pole}; F × ${n(p.attachmentHeightMeters)} m ≤ ${n(p.poleNominalLoadDaN, 0)} daN × (${n(p.poleHeightMeters)} − 0.25) m → ${n(r.poleUtilization * 100, 0)} %`,
          },
          {
            label: g.clearance,
            math: `${n(p.attachmentHeightMeters)} − ${n(r.sagHotMeters, 2)} = ${n(r.clearanceMeters, 2)} m (≥ ${n(p.requiredClearanceMeters)} m)`,
          },
        ];
      }
      case 'energy': {
        const r = this.energy();
        const p = this.energyParams();
        const g = this.t().energy.formulas;
        return [
          {
            label: g.hours,
            math: `t = ${n(p.hoursPerNight)} h × 365 = ${n(r.hoursPerYear, 0)} h`,
          },
          {
            label: g.old,
            math: `E₀ = ${p.luminaires} × ${p.oldWatts} W × ${n(r.hoursPerYear, 0)} h = ${n(r.oldKwhPerYear, 0)} kWh`,
          },
          {
            label: g.led,
            math: `E = ${p.luminaires} × ${p.ledWatts} W × ${n(r.hoursPerYear, 0)} h × (1 − ${n(p.dimmingSavingPct, 0)} %) = ${n(r.ledKwhPerYear, 0)} kWh`,
          },
          {
            label: g.saved,
            math: `(E₀ − E) × ${n(p.tariffPerKwh, 2)} = ${this.i18n.money(r.savedCostPerYear)} · × ${n(p.co2KgPerKwh, 2)} kg = ${n(r.co2SavedKgPerYear, 0)} kg CO₂`,
          },
          {
            label: g.payback,
            math: `${p.luminaires} × ${this.i18n.money(p.retrofitCostPerLuminaire)} / ${this.i18n.money(r.savedCostPerYear)} = ${r.paybackYears === null ? '—' : n(r.paybackYears, 1)}`,
          },
        ];
      }
    }
  });

  private readonly query = toSignal(this.route.queryParamMap);
  private loadedEditId: string | null = null;

  constructor() {
    effect(() => {
      const params = this.query();
      const tab = params?.get('tab') ?? null;
      const editId = params?.get('edit') ?? null;
      const saved = this.store.calculations().find((c) => c.id === editId);
      untracked(() => {
        if (isTab(tab)) this.tab.set(tab);
        if (saved && saved.id !== this.loadedEditId) {
          this.loadedEditId = saved.id;
          this.load(saved);
        }
      });
    });
  }

  protected selectTab(tab: CalculatorTab): void {
    this.tab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private load(saved: SavedCalculation): void {
    this.editing.set(saved);
    this.tab.set(saved.kind as CalculatorTab);
    switch (saved.kind) {
      case 'spacing': {
        const i = saved.inputs;
        this.sHeight.set(i.mountingHeightMeters);
        this.sSpacing.set(i.spacingMeters);
        this.sRoadWidth.set(i.roadWidthMeters);
        this.sRoadClass.set(i.roadClass);
        this.sLumens.set(i.luminaireLumens);
        this.sMaintenance.set(i.maintenanceFactor);
        this.sCable.set(!!i.overheadCable);
        if (i.overheadCable) {
          this.sConductor.set(i.overheadCable.conductor);
          this.sPoleKind.set(i.overheadCable.poleKind);
          this.sNominal.set(i.overheadCable.poleNominalLoadDaN);
          this.sWindZone.set(i.overheadCable.windZone);
        }
        break;
      }
      case 'foundation': {
        const i = saved.inputs;
        this.fHeight.set(i.poleHeightMeters);
        this.fWindZone.set(i.windZone);
        this.fSoil.set(i.soilType);
        this.fSolar.set(i.hasSolarPanel);
        this.fPanelArea.set(i.solarPanelAreaM2 ?? 1.2);
        this.fMaterial.set(i.poleMaterial);
        this.fDepth.set(i.excavationDepthMeters ?? 1.45);
        break;
      }
      case 'solar': {
        const i = saved.inputs;
        this.pLed.set(i.ledWattage);
        this.pSunHours.set(i.peakSunHours);
        this.pAutonomy.set(i.autonomyDays);
        this.pVoltage.set(i.systemVoltage);
        this.pChemistry.set(i.batteryChemistry);
        this.pProfile.set({ ...i.dimmingProfile });
        break;
      }
      case 'electrical': {
        const i = saved.inputs;
        this.eVoltage.set(i.circuitVoltage);
        this.eLength.set(i.cableLengthMeters);
        this.eCount.set(i.totalLuminairesCount);
        this.eWattage.set(i.wattagePerLuminaire);
        this.eMaterial.set(i.conductorMaterial);
        this.eMaxDrop.set(i.maxAllowableVoltageDropPct);
        break;
      }
      case 'span': {
        const i = saved.inputs;
        this.lSpan.set(i.spanMeters);
        this.lConductor.set(i.conductor);
        this.lEveryday.set(i.everydayTensionPct);
        this.lWindZone.set(i.windZone);
        this.lRole.set(i.poleRole);
        this.lDeviation.set(i.deviationDegrees);
        this.lPoleHeight.set(i.poleHeightMeters);
        this.lAttachment.set(i.attachmentHeightMeters);
        this.lNominal.set(i.poleNominalLoadDaN);
        this.lClearance.set(i.requiredClearanceMeters);
        this.lPoleKind.set(i.poleKind ?? 'concrete');
        break;
      }
      case 'energy': {
        const i = saved.inputs;
        this.gLuminaires.set(i.luminaires);
        this.gLed.set(i.ledWatts);
        this.gOld.set(i.oldWatts);
        this.gHours.set(i.hoursPerNight);
        this.gDimming.set(i.dimmingSavingPct);
        this.gTariff.set(i.tariffPerKwh);
        this.gCo2.set(i.co2KgPerKwh);
        this.gRetrofit.set(i.retrofitCostPerLuminaire);
        break;
      }
    }
  }

  protected readonly stages = [1, 2, 3] as const;

  protected stage(part: 'hours' | 'pct', stage: 1 | 2 | 3): number {
    return this.pProfile()[`${part}Stage${stage}`];
  }

  protected setStage(
    part: 'hours' | 'pct',
    stage: 1 | 2 | 3,
    value: number,
  ): void {
    this.pProfile.set({ ...this.pProfile(), [`${part}Stage${stage}`]: value });
  }

  protected roadGroup(roadClass: RoadLightingClass): string {
    return this.t().roadClassGroups[roadClass[0] as 'M' | 'C' | 'P'];
  }

  protected async save(request: SaveRequest): Promise<void> {
    const editing = this.editing();
    const id = request.replace && editing ? editing.id : undefined;
    const base = { id, label: request.label };
    let savedId: string;
    switch (this.tab()) {
      case 'spacing':
        savedId = await this.store.saveCalculation({
          ...base,
          kind: 'spacing',
          inputs: this.spacingParams(),
        });
        break;
      case 'foundation':
        savedId = await this.store.saveCalculation({
          ...base,
          kind: 'foundation',
          inputs: this.foundationParams(),
        });
        break;
      case 'solar':
        savedId = await this.store.saveCalculation({
          ...base,
          kind: 'solar',
          inputs: this.solarParams(),
        });
        break;
      case 'electrical':
        savedId = await this.store.saveCalculation({
          ...base,
          kind: 'electrical',
          inputs: this.electricalParams(),
        });
        break;
      case 'span':
        savedId = await this.store.saveCalculation({
          ...base,
          kind: 'span',
          inputs: this.spanParams(),
        });
        break;
      case 'energy':
        savedId = await this.store.saveCalculation({
          ...base,
          kind: 'energy',
          inputs: this.energyParams(),
        });
        break;
    }
    // Keep editing what was just saved (the copy, after "save a copy").
    this.loadedEditId = savedId;
    this.editing.set(
      this.store.calculations().find((c) => c.id === savedId) ?? null,
    );
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.tab(), edit: savedId },
      replaceUrl: true,
    });
  }

  protected stopEditing(): void {
    this.editing.set(null);
    this.loadedEditId = null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.tab() },
      replaceUrl: true,
    });
  }

  protected optionValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
