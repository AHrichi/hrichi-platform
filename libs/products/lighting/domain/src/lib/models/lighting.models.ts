export type LightingLanguage = 'fr' | 'ar' | 'en';

export type PoleType =
  | 'grid_ac'
  | 'solar_pv'
  | 'solar_autonomous'
  | 'solar_hybrid'
  | 'conventional_ac';

export type PoleMaterial =
  'steel_galvanized' | 'galvanized_steel' | 'aluminum' | 'fiberglass' | 'wood';

export type ProjectStage =
  | 'survey'
  | 'excavation'
  | 'foundations'
  | 'erection'
  | 'cabling_mounting'
  | 'commissioning'
  | 'audited';

export type PoleStatus =
  'planned' | 'excavated' | 'poured' | 'erected' | 'active';

export type RoadLightingClass =
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'C0'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'C4'
  | 'C5'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'P5'
  | 'P6';

export type SoilType =
  'rock' | 'compact_gravel' | 'firm_clay' | 'soft_clay_silt' | 'loose_sand';

export type WindZone = 1 | 2 | 3 | 4;

export type ConcreteClass = 'C20_25' | 'C25_30' | 'C30_37' | 'C35_45';

export type ConcreteExposure =
  'XC1_dry' | 'XC2_wet' | 'XC2' | 'XC4_cycling' | 'XS1_marine' | 'XF1_frost';

export type SlumpClass = 'S1' | 'S2' | 'S3' | 'S4';

export interface GpsCoordinate {
  lat: number;
  lng: number;
  altitudeMeters?: number;
}

export interface PoleItem {
  id: string;
  code: string; // e.g. M-01, M-02
  projectId: string;
  type: PoleType;
  status: PoleStatus;
  gps: GpsCoordinate;
  heightMeters: number; // e.g. 8m
  armLengthMeters: number; // e.g. 1.5m
  tiltAngleDegrees: number; // arm elevation e.g. 5° or 10°
  material: PoleMaterial;
  luminaireModel: string;
  luminaireWattage: number; // W
  luminaireLumens: number; // lm
  colorTemperatureK: number; // 3000K, 4000K
  opticalDistribution?: string;
  // If solar:
  solarPanelWatts?: number; // Wp
  solarBatteryWh?: number; // Wh
  solarBatteryType?: 'LiFePO4' | 'Gel_AGM';
  // Foundation:
  foundationWidthMeters: number; // e.g. 0.8m
  foundationDepthMeters: number; // e.g. 1.2m
  soilType: SoilType;
  concretePouredDate?: string;
  erectedDate?: string;
  inspectedDate?: string;
  measuredVerticalTilt?: number; // degrees deviation from 90° plumb
  notes?: string;
}

export interface MilestoneItem {
  id: string;
  projectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  category:
    | 'foundation_curing'
    | 'erection'
    | 'cabling'
    | 'commissioning'
    | 'inspection'
    | 'battery_audit'
    | 'excavation';
  completed: boolean;
  notes?: string;
  reminderSent?: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  clientOrMunicipality: string;
  locationName: string;
  gpsCenter: GpsCoordinate;
  stage: ProjectStage;
  startDate: string;
  commissioningDeadline: string;
  roadWidthMeters: number;
  roadClass: RoadLightingClass;
  lightingType: 'mixed' | 'solar_only' | 'grid_only';
  windZone: WindZone;
  defaultSoil: SoilType;
  engineerName: string;
  engineerEmail?: string;
  notes?: string;
  poles: PoleItem[];
  milestones: MilestoneItem[];
  /** Calculations saved from the calculators, reopened and edited later. */
  calculations?: SavedCalculation[];
  /** Pole heights measured with the camera rangefinder. */
  measurements?: HeightMeasurement[];
  createdAt: string;
  updatedAt: string;
}

/**
 * A finding a calculation reports. The domain stays language-neutral: the
 * feature turns each code and its values into a sentence in the reader's
 * language.
 */
export interface CalcNote {
  code: string;
  severity: 'ok' | 'info' | 'warn' | 'error';
  values?: Record<string, number | string>;
}

export type CompassDirection =
  'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface SpacingCalculationParams {
  mountingHeightMeters: number;
  roadWidthMeters: number;
  spacingMeters: number;
  roadClass: RoadLightingClass;
  luminaireLumens: number;
  maintenanceFactor: number; // e.g. 0.8
  utilizationFactor?: number; // auto-derived if omitted
  /** Set when the poles also carry an overhead cable. */
  overheadCable?: OverheadCable;
}

export interface SpacingCalculationResult {
  spacingRatio: number; // S / H
  ratioEvaluation: 'optimal' | 'acceptable' | 'excessive' | 'too_close';
  estimatedAverageLux: number; // E_avg (lux)
  estimatedUniformity: number; // U_0 estimate (0.0 - 1.0)
  requiredAverageLux: number; // from EN 13201
  requiredUniformity: number; // from EN 13201
  isCompliant: boolean;
  meetsLux: boolean;
  meetsUniformity: boolean;
  utilizationFactor: number;
  recommendedSpacingMinMeters: number;
  recommendedSpacingMaxMeters: number;
  notes: CalcNote[];
}

export interface FoundationCalculationParams {
  poleHeightMeters: number;
  windZone: WindZone;
  soilType: SoilType;
  hasSolarPanel: boolean;
  solarPanelAreaM2?: number; // e.g. 1.2 m²
  poleMaterial: PoleMaterial;
  poleDiameterTopMm?: number;
  poleDiameterBaseMm?: number;
  excavationDepthMeters?: number; // proposed depth to validate
}

export interface FoundationCalculationResult {
  minRecommendedDepthMeters: number;
  recommendedBlockWidthMeters: number;
  recommendedBlockLengthMeters: number;
  recommendedVolumeM3: number;
  minConcreteMassKg: number;
  soilBearingCapacityKPa: number;
  windPressureDanM2: number;
  overturningMomentDanM: number;
  windSpeedKmH: number;
  actualDepthMeters: number;
  safetyFactor: number;
  /** Four class 8.8 anchor bolts. */
  anchorBolts: {
    size: 'M16' | 'M20' | 'M24' | 'M27';
    lengthMm: number;
    pitchMm: number;
  };
  isDepthValid: boolean;
  depthComplianceVerdict: 'safe' | 'marginal' | 'unsafe';
  notes: CalcNote[];
}

export interface SolarSizingParams {
  ledWattage: number; // W
  dailyOperatingHours: number; // full equivalent or calculated
  dimmingProfile: {
    hoursStage1: number;
    pctStage1: number;
    hoursStage2: number;
    pctStage2: number;
    hoursStage3: number;
    pctStage3: number;
  };
  autonomyDays: number; // e.g. 2 - 4 days
  peakSunHours: number; // PSH kWh/m²/day (typically 3.5 - 5.5 in Mediterranean/MENA)
  batteryChemistry: 'LiFePO4' | 'Gel_AGM';
  systemVoltage: 12 | 24;
}

export interface SolarSizingResult {
  dailyEnergyConsumptionWh: number;
  effectiveFullPowerHours: number;
  minSolarPanelPeakWatts: number; // Wp
  commercialPanelSizeWatts: number; // rounded up to standard size (e.g. 150W, 200W, 300W)
  minBatteryCapacityWh: number;
  minBatteryCapacityAh: number;
  commercialBatteryCapacityAh: number;
  maxDischargeDepthPct: number; // 85% for LiFePO4, 50% for Gel
  mpptControllerAmpRating: number; // A
  winterSolsticeCoveragePct: number;
  co2SavedKgPerYear: number;
  notes: CalcNote[];
}

export interface ConcreteMixParams {
  volumeM3: number;
  targetClass: ConcreteClass;
  exposure: ConcreteExposure;
  slumpTestCm?: number; // Abrams cone measurement (cm)
  measuredWaterLiters?: number;
  measuredCementKg?: number;
  waterCementRatio?: number;
  mixingMethod: 'ready_mix_truck' | 'site_batch_mixer';
  curingAgeDays?: number;
}

export interface ConcreteMixValidationResult {
  requiredCementMinKgM3: number;
  providedCementKgM3: number;
  maxWaterCementRatio: number;
  providedWaterCementRatio: number;
  slumpClassification: SlumpClass;
  isSlumpAcceptable: boolean;
  currentStrengthPctOf28Days: number; // Eurocode 2 curve
  isErectionPermitted: boolean; // >= 70% (typically 7 days)
  isFullCommissioningPermitted: boolean; // 100% (28 days)
  isCementDosageValid: boolean;
  isWaterRatioValid: boolean;
  overallCompliance: 'compliant' | 'warning' | 'non_compliant';
  batchRecipes: {
    perCubicMeter: {
      cementKg: number;
      sandKg: number;
      gravelKg: number;
      waterLiters: number;
    };
    totalJobBatch: {
      cementBags35Kg: number;
      sandTonnes: number;
      gravelTonnes: number;
      waterLiters: number;
    };
  };
  notes: CalcNote[];
}

export interface VerticalityParams {
  measuredTiltDegrees: number; // deviation from true vertical 90°
  /** The side the pole leans towards. */
  measuredDirection?: CompassDirection;
  poleHeightMeters: number;
  baseplateDiameterMm: number;
  anchorBoltPitchMm?: number;
}

export interface VerticalityCheckResult {
  tiltDegrees: number;
  maxAllowableTiltDegrees: number; // EN 40 standard = 1.0° (or 15mm/m)
  displacementAtTipMm: number; // height * sin(tilt)
  isCompliant: boolean;
  status: 'perfect' | 'acceptable' | 'rejected_deviation';
  /** Raise the levelling nuts on `raiseSide` (opposite the lean); null when plumb. */
  correction: {
    leanSide: CompassDirection;
    raiseSide: CompassDirection;
    heightMm: number;
    turns: number;
  } | null;
}

export interface ElectricalParams {
  circuitVoltage: 230 | 400; // Single phase 230V vs Three phase 400V
  cableLengthMeters: number;
  totalLuminairesCount: number;
  wattagePerLuminaire: number;
  conductorMaterial: 'copper' | 'aluminum';
  maxAllowableVoltageDropPct: number; // 3% or 5%
}

export interface ElectricalCalculationResult {
  totalPowerWatts: number;
  totalCurrentAmperes: number;
  recommendedCrossSectionMm2: number;
  actualVoltageDropPct: number;
  actualVoltageDropVolts: number;
  isVoltageDropAcceptable: boolean;
  recommendedBreakerRatingAmps: number;
  earthResistanceTargetOhms: number; // <= 10 or 30 ohms
}

/** The calculators whose inputs can be saved to a project and reopened. */
/** Aerial bundled cables (NF C 33-209): cores × mm², plus the messenger. */
export type ConductorType =
  | 'abc_2x16'
  | 'abc_4x16'
  | 'abc_4x25'
  | 'abc_3x35_54'
  | 'abc_3x70_54'
  | 'abc_3x150_70';

/** What a pole is made of; sets a typical rated load until the plate is read. */
export type PoleKind = 'steel' | 'aluminium' | 'frp' | 'concrete' | 'wood';

/** An aerial cable strung between the lighting poles themselves. */
export interface OverheadCable {
  conductor: ConductorType;
  poleKind: PoleKind;
  poleNominalLoadDaN: number;
  windZone: WindZone;
}

/** Where the pole sits in the line, which sets the load the wire puts on it. */
export type PoleRole = 'intermediate' | 'angle' | 'terminal';

export type SpanState = 'everyday' | 'wind' | 'cold' | 'hot';

/** What stops the span growing: the wire, the pole or the ground clearance. */
export type SpanLimit = 'conductor' | 'pole' | 'clearance';

export interface SpanCalculationParams {
  spanMeters: number;
  conductor: ConductorType;
  /** Tension when strung at 15 °C, as a % of the breaking load. */
  everydayTensionPct: number;
  windZone: WindZone;
  poleRole: PoleRole;
  /** Line deviation at an angle pole. */
  deviationDegrees: number;
  poleHeightMeters: number;
  /** Height where the wire is fixed. */
  attachmentHeightMeters: number;
  /** The pole's nominal load near its top, from its datasheet. */
  poleNominalLoadDaN: number;
  /** Lowest point of the wire above the ground, on the hottest day. */
  requiredClearanceMeters: number;
  /** What the poles are made of, kept with saved inputs. */
  poleKind?: PoleKind;
}

export interface SpanCalculationResult {
  weightNPerM: number;
  windNPerM: number;
  everydayTensionDaN: number;
  sagEverydayMeters: number;
  sagHotMeters: number;
  maxTensionDaN: number;
  maxTensionState: SpanState;
  allowedTensionDaN: number;
  conductorUtilization: number;
  poleLoadDaN: number;
  poleUtilization: number;
  clearanceMeters: number;
  meetsConductor: boolean;
  meetsPole: boolean;
  meetsClearance: boolean;
  isCompliant: boolean;
  /** Longest span passing every check; 0 when none does. */
  maxSpanMeters: number;
  limitingFactor: SpanLimit | null;
  states: { state: SpanState; tensionDaN: number; sagMeters: number }[];
  notes: CalcNote[];
}

export interface CalculationInputs {
  spacing: SpacingCalculationParams;
  foundation: FoundationCalculationParams;
  solar: SolarSizingParams;
  electrical: ElectricalParams;
  concrete: ConcreteMixParams;
  span: SpanCalculationParams;
}

export type CalculationKind = keyof CalculationInputs;

/** Inputs are stored, never results: reopening recomputes with today's rules. */
export type SavedCalculation = {
  [K in CalculationKind]: {
    id: string;
    kind: K;
    label: string;
    inputs: CalculationInputs[K];
    poleId?: string;
    savedAt: string;
  };
}[CalculationKind];

/** A pole height measured by sighting its base, then its top, with the phone. */
export interface HeightMeasurement {
  id: string;
  label: string;
  eyeHeightMeters: number;
  /** Angle below the horizon to the pole's base. */
  baseDepressionDegrees: number;
  /** Angle above the horizon to the pole's top. */
  topElevationDegrees: number;
  distanceMeters: number;
  heightMeters: number;
  poleId?: string;
  savedAt: string;
}

export type MaterialCategory =
  | 'pole'
  | 'luminaire'
  | 'solar_panel'
  | 'battery'
  | 'anchor_bolts'
  | 'cable'
  | 'overhead_cable'
  | 'electrical';

export interface MaterialItem {
  id: string;
  category: MaterialCategory;
  name: string;
  manufacturer: string;
  specsSummary: string;
  estimatedUnitCostEur: number;
  /** What the price is for: one piece (default) or one metre. */
  unit?: 'pcs' | 'm';
  /** Set on items the user added ('user') or changed from the catalogue ('edited'). */
  origin?: 'user' | 'edited';
  imageUrl?: string;
  datasheetUrl?: string;
  keyAttributes: Record<string, string | number>;
}

export interface StandardRegulationItem {
  id: string;
  code: string; // e.g. EN 13201-2, NF EN 206
  title: string;
  jurisdiction: 'EU' | 'ISO' | 'IEC' | 'International';
  category:
    | 'photometrics'
    | 'civil_works'
    | 'solar_pv'
    | 'electrical_safety'
    | 'mechanical_protection';
  summary: string;
  coreRequirements: string[];
  checklistItems: string[];
}
