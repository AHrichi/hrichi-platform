import type {
  CoolingYearParams,
  EnergyHubParams,
  HeatReuseParams,
} from '../calculations/energy';
import type { LogEntry } from '../calculations/operations';
import type { Reading } from '../calculations/readings';
import type { EconomicsParams } from '../calculations/site';
import type { SolarPvParams } from '../calculations/solar';

/**
 * SerraCalc's language-neutral model. Calculations return numbers and note
 * codes; the feature writes the sentences in the reader's language.
 */

/** A finding a calculation reports, turned into a sentence by the feature. */
export interface CalcNote {
  code: string;
  severity: 'ok' | 'info' | 'warn' | 'error';
  values?: Record<string, number | string>;
}

// ---------------------------------------------------------------------------
// The greenhouse
// ---------------------------------------------------------------------------

/**
 * - `gable`: multi-span, one pitched roof per span (multi-chapel plastic or glass)
 * - `venlo`: multi-span glass, several small roofs per span (3.2 m each)
 * - `tunnel`: arched roof per span (single or multi-span tunnels)
 */
export type GreenhouseShape = 'gable' | 'venlo' | 'tunnel';

export type CoverMaterial =
  | 'glass_single'
  | 'glass_double'
  | 'pe_single'
  | 'pe_double'
  | 'pc_twin'
  | 'pc_triple'
  | 'acrylic_double';

export type ScreenType = 'none' | 'clear' | 'shade_energy' | 'aluminised';

export interface GreenhouseSpec {
  shape: GreenhouseShape;
  spans: number;
  spanWidthM: number;
  lengthM: number;
  gutterHeightM: number;
  ridgeHeightM: number;
  cover: CoverMaterial;
  screen: ScreenType;
  perimeterInsulated: boolean;
}

export interface GeometryResult {
  widthM: number;
  floorAreaM2: number;
  roofAreaM2: number;
  sideWallAreaM2: number;
  gableAreaM2: number;
  /** Everything that loses heat: roof, side walls and both gable ends. */
  coverAreaM2: number;
  volumeM3: number;
  perimeterM: number;
  /** Volume over floor area: the air buffer per square metre. */
  meanHeightM: number;
  /** Cover over floor area, 1.2 to 1.6 for most houses. */
  coverRatio: number;
  roofSectionsPerSpan: number;
  notes: CalcNote[];
}

// ---------------------------------------------------------------------------
// Climate and crops
// ---------------------------------------------------------------------------

export interface MonthClimate {
  /** Mean daily minimum, °C. */
  tMinC: number;
  /** Mean daily maximum, °C. */
  tMaxC: number;
  /** Global radiation on a horizontal surface, MJ/m² per day. */
  radiationMj: number;
  /** Rainfall, mm in the month. */
  rainMm: number;
}

export interface ClimatePreset {
  id: string;
  /** Place name, shown as is (not translated). */
  name: string;
  /** ISO country code. */
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  /** Outside temperature to size heating for (about the 99.6 % night). */
  designWinterC: number;
  /** Outside temperature and humidity to size cooling for (hot afternoon). */
  designSummerC: number;
  designSummerRhPct: number;
  /** Peak global radiation at noon in summer, W/m². */
  peakRadiationWm2: number;
  months: readonly MonthClimate[];
}

export type CropId =
  | 'tomato'
  | 'cucumber'
  | 'pepper'
  | 'melon'
  | 'strawberry'
  | 'lettuce'
  | 'rose';

export interface CropProfile {
  id: CropId;
  nightSetC: number;
  daySetC: number;
  /** Cooling starts above this. */
  ventilateAboveC: number;
  /** Daily light integral the crop wants, mol/m² per day. */
  targetDli: number;
  /** Above this the crop gets shaded, mol/m² per day. */
  maxDli: number;
  /** Plants (or stems) per m² of floor. */
  plantsPerM2: number;
  /** Share of the radiation inside used to transpire, full canopy. */
  transpirationCoef: number;
}

export type FuelType =
  'natural_gas' | 'lpg' | 'fuel_oil' | 'heat_pump' | 'geothermal' | 'biomass';

export interface FuelProfile {
  id: FuelType;
  /** Unit of the fuel bought: m³ of gas, kg, litres, kWh of electricity. */
  unit: 'm3' | 'kg' | 'L' | 'kWh';
  /** Useful energy in one unit (kWh), before the burner's efficiency. */
  kwhPerUnit: number;
  /** kg of CO₂ per unit bought. */
  co2KgPerUnit: number;
  /** Typical efficiency (or COP for a heat pump), percent. */
  efficiencyPct: number;
}

// ---------------------------------------------------------------------------
// Calculators: inputs and results
// ---------------------------------------------------------------------------

/** The building's losses, shared by the peak load and the year. */
export interface EnvelopeParams {
  floorAreaM2: number;
  coverAreaM2: number;
  volumeM3: number;
  perimeterM: number;
  cover: CoverMaterial;
  /** U-value of the cover, W/m²·K (prefilled from the cover). */
  uValue: number;
  airChangesPerHour: number;
  perimeterInsulated: boolean;
  screen: ScreenType;
  /** How much a closed screen cuts the night losses, percent. */
  screenSavingPct: number;
}

export interface HeatLossParams extends EnvelopeParams {
  insideC: number;
  outsideDesignC: number;
  /** Count the screen as closed on the design night. */
  screenClosed: boolean;
  /** Extra for wind, clear-sky radiation and pipe losses, percent. */
  marginPct: number;
}

export interface HeatLossResult {
  deltaT: number;
  uEffective: number;
  /** W/K: transmission + air leakage + perimeter. */
  lossCoefficientWPerK: number;
  transmissionW: number;
  infiltrationW: number;
  perimeterW: number;
  totalW: number;
  wPerM2: number;
  /** The heating plant to install, with the margin. */
  designKw: number;
  notes: CalcNote[];
}

export interface AnnualHeatingParams extends EnvelopeParams {
  climateId: string;
  nightSetC: number;
  daySetC: number;
  /** Share of outside radiation that reaches the crop, percent. */
  transmissionPct: number;
  /** Share of the sunlight inside that warms the air, percent. */
  solarGainPct: number;
  fuel: FuelType;
  /** Boiler efficiency, or the heat pump's COP × 100. */
  efficiencyPct: number;
  /** Price of one fuel unit, in the project's currency. */
  fuelPrice: number;
}

export interface MonthHeating {
  month: number;
  nightHours: number;
  nightMeanC: number;
  dayMeanC: number;
  nightKwh: number;
  dayKwh: number;
  totalKwh: number;
}

export interface AnnualHeatingResult {
  months: MonthHeating[];
  annualKwh: number;
  kwhPerM2: number;
  /** Fuel bought, in the fuel's unit. */
  fuelUnits: number;
  fuelUnit: FuelProfile['unit'];
  cost: number;
  costPerM2: number;
  co2Kg: number;
  peakMonth: number;
  /** Months that need heat at all. */
  heatingMonths: number;
  notes: CalcNote[];
}

export type PipeType = 'steel_51' | 'steel_33' | 'pe_40' | 'pe_32' | 'pe_25';

export interface PipeProfile {
  id: PipeType;
  outerDiameterMm: number;
  innerDiameterMm: number;
  emissivity: number;
}

export interface HotWaterParams {
  heatDemandKw: number;
  supplyC: number;
  returnC: number;
  airC: number;
  pipe: PipeType;
  floorAreaM2: number;
  /** One loop: out and back along the house, m. */
  loopLengthM: number;
  pumpHeadM: number;
  pumpEfficiencyPct: number;
  /** Heat over the year, for the water volume (0 to skip). */
  annualHeatKwh: number;
}

export interface HotWaterResult {
  deltaWaterK: number;
  flowM3h: number;
  flowLs: number;
  meanWaterC: number;
  /** Surface minus air, K. */
  pipeDeltaK: number;
  convectionWm2K: number;
  radiationWm2K: number;
  pipeOutputWPerM: number;
  pipeLengthM: number;
  metresPerM2: number;
  loops: number;
  /** Water speed in one loop, m/s. */
  loopVelocityMs: number;
  pumpKw: number;
  annualWaterM3: number;
  notes: CalcNote[];
}

/** The solar heat a house must lose in summer, shared by both coolers. */
export interface SolarLoadParams {
  floorAreaM2: number;
  coverAreaM2: number;
  volumeM3: number;
  uValue: number;
  /** Outside global radiation at the hour you design for, W/m². */
  radiationWm2: number;
  transmissionPct: number;
  shadingPct: number;
  /** Share of the sunlight inside that the crop turns into transpiration. */
  evapotranspirationPct: number;
}

export interface VentilationParams extends SolarLoadParams {
  outsideC: number;
  /** Inside may be this much warmer than outside, K. */
  maxRiseK: number;
  windMs: number;
  /** Height of the vent opening, m. */
  ventOpeningM: number;
  /** Air one fan moves at its working pressure, m³/h. */
  fanCapacityM3h: number;
}

export interface VentilationResult {
  solarLoadW: number;
  conductionW: number;
  netLoadW: number;
  flowM3s: number;
  flowM3h: number;
  airChangesPerHour: number;
  flowPerM2: number;
  /** Total vent opening needed with natural ventilation, m². */
  ventAreaM2: number;
  ventPct: number;
  fans: number;
  notes: CalcNote[];
}

export interface PadFanParams extends SolarLoadParams {
  outsideC: number;
  outsideRhPct: number;
  padEfficiencyPct: number;
  /** Warming allowed between the pads and the fans, K. */
  riseK: number;
  /** Air speed through the pad face, m/s (1.25 for 100 mm, 1.75 for 150 mm). */
  padFaceVelocityMs: number;
  padHeightM: number;
  /** Pad wall to fans, m. */
  padToFanM: number;
  fanCapacityM3h: number;
  /** Hours a day the pads run in the hot season. */
  hoursPerDay: number;
}

export interface PadFanResult {
  wetBulbC: number;
  padOutletC: number;
  exhaustC: number;
  meanInsideC: number;
  netLoadW: number;
  flowM3h: number;
  fans: number;
  padAreaM2: number;
  padLengthM: number;
  evaporationLh: number;
  /** Evaporation plus about 10 % bleed-off, per day. */
  waterM3PerDay: number;
  notes: CalcNote[];
}

export interface CropWaterParams {
  climateId: string;
  floorAreaM2: number;
  /** Share of the floor under crop, percent. */
  cropAreaPct: number;
  transmissionPct: number;
  shadingPct: number;
  /** Share of the radiation inside the crop transpires, percent. */
  transpirationPct: number;
  /** Canopy cover: 30 % for young plants, 100 % for a full crop. */
  canopyPct: number;
  /** Drain (soilless) or losses (soil), percent of what is applied. */
  drainPct: number;
  plantsPerM2: number;
  emittersPerPlant: number;
  emitterLh: number;
  /** One irrigation shot per emitter, mL. */
  shotMl: number;
  /** What the pump can supply, m³/h. */
  pumpM3h: number;
}

export interface MonthWater {
  month: number;
  radiationInMj: number;
  /** Net crop use, L per m² of crop per day (= mm/day). */
  netLm2: number;
  /** Applied, with the drain, L per m² of crop per day. */
  grossLm2: number;
  houseM3Day: number;
  houseM3Month: number;
}

export interface CropWaterResult {
  months: MonthWater[];
  peakMonth: number;
  peakGrossLm2: number;
  peakM3Day: number;
  annualM3: number;
  annualM3PerM2: number;
  emitters: number;
  litresPerEmitterPeak: number;
  shotsPerDayPeak: number;
  shotMinutes: number;
  /** Flow if every emitter ran at once, m³/h. */
  systemFlowM3h: number;
  /** Irrigation sections so each fits the pump. */
  sections: number;
  notes: CalcNote[];
}

export interface RainwaterParams extends CropWaterParams {
  /** Roof that drains to the basin, m² (plan area). */
  catchmentM2: number;
  /** Share of the rain that reaches the basin, percent. */
  runoffPct: number;
  /** Basin size to try, m³. */
  basinM3: number;
}

export interface MonthRain {
  month: number;
  harvestM3: number;
  demandM3: number;
  usedM3: number;
  storedEndM3: number;
  overflowM3: number;
}

export interface RainwaterResult {
  months: MonthRain[];
  annualRainMm: number;
  annualHarvestM3: number;
  annualDemandM3: number;
  annualUsedM3: number;
  /** Share of the year's irrigation the rain covers with this basin. */
  coveragePct: number;
  /** Most the rain could cover with an unlimited basin. */
  maxCoveragePct: number;
  /**
   * Smallest basin that reaches 95 % of the maximum coverage, and holds at
   * least one storm.
   */
  suggestedBasinM3: number;
  /** Run-off of one heavy day of rain (STORM_MM), m³. */
  stormBufferM3: number;
  notes: CalcNote[];
}

export interface LightParams {
  climateId: string;
  floorAreaM2: number;
  transmissionPct: number;
  /** Daily light integral to reach, mol/m² per day. */
  targetDli: number;
  /** Shade above this, mol/m² per day. */
  maxDli: number;
  /** Most hours a day the lamps may run. */
  lampHours: number;
  /** Fixture efficacy, µmol of PAR per joule. */
  efficacyUmolJ: number;
  fixtureW: number;
  /** Electricity, per kWh in the project's currency. */
  electricityPrice: number;
  co2KgPerKwh: number;
}

export interface MonthLight {
  month: number;
  /** Sunlight reaching the crop, mol/m² per day. */
  naturalDli: number;
  /** What the lamps must add, mol/m² per day. */
  gapDli: number;
  /** Hours a day the lamps run. */
  lampHours: number;
  kwh: number;
  /** Shade to keep the crop under its ceiling, percent. */
  shadePct: number;
}

export interface LightResult {
  months: MonthLight[];
  /** The darkest month, which sizes the lamps. */
  designMonth: number;
  /** PPFD the lamps must give, µmol/m²·s. */
  designPpfd: number;
  fixtures: number;
  /** PPFD the installed fixtures give, µmol/m²·s. */
  installedPpfd: number;
  wPerM2: number;
  installedKw: number;
  annualKwh: number;
  cost: number;
  co2Kg: number;
  litMonths: number;
  shadeMonths: number;
  maxShadePct: number;
  notes: CalcNote[];
}

export type Co2Source = 'burner' | 'liquid';

export interface Co2Params {
  floorAreaM2: number;
  volumeM3: number;
  targetPpm: number;
  outsidePpm: number;
  /** Air exchange while enriching (vents mostly shut), per hour. */
  airChangesPerHour: number;
  /** What the crop takes up in good light, g/m² per hour. */
  uptakeGm2h: number;
  hoursPerDay: number;
  daysPerYear: number;
  source: Co2Source;
  /** Liquid CO₂, per kg. */
  co2Price: number;
  /** Natural gas for a burner, per m³. */
  gasPrice: number;
  burnerEfficiencyPct: number;
}

export interface Co2Result {
  /** CO₂ lost with the air that leaves, kg/h. */
  ventLossKgH: number;
  uptakeKgH: number;
  supplyKgH: number;
  /** The same per hectare, kg/h·ha. */
  supplyKgHaH: number;
  dailyKg: number;
  annualT: number;
  /** Gas a burner needs for that CO₂, m³/h. */
  gasM3h: number;
  /** Heat that comes with a burner's CO₂, kW. */
  burnerHeatKw: number;
  annualCost: number;
  /** Share of the supply the crop takes up; the rest leaks out. */
  usedPct: number;
  notes: CalcNote[];
}

export interface HumidityParams {
  insideC: number;
  /** Highest relative humidity to allow inside. */
  insideRhPct: number;
  outsideC: number;
  outsideRhPct: number;
  /** Night transpiration and evaporation, g/m² per hour. */
  transpirationGm2h: number;
  floorAreaM2: number;
  volumeM3: number;
  /** U-value of the cover, for its inside surface temperature. */
  uValue: number;
  nightHours: number;
}

export interface HumidityResult {
  vpdKpa: number;
  dewPointC: number;
  /** Inside surface of the cover, °C. */
  coverSurfaceC: number;
  condensation: boolean;
  /** Water in the air, g per kg of dry air. */
  insideGkg: number;
  outsideGkg: number;
  moistureKgH: number;
  /** Outside air to bring in, m³/h; null when it is wetter than inside. */
  airM3h: number | null;
  airChangesPerHour: number | null;
  /** Heat to warm that air to the inside temperature, kW. */
  heatKw: number;
  nightKwh: number;
  notes: CalcNote[];
}

// ---------------------------------------------------------------------------
// Climate control: VPD, fogging, the cooling strategy, the crop calendar
// ---------------------------------------------------------------------------

/** Where the crop is in its cycle; targets change with it. */
export type CropStage = 'nursery' | 'vegetative' | 'flowering' | 'harvest';

export type LightCondition = 'sun' | 'cloud' | 'night';

/** A low–high band; `ideal` sits inside `range` where a source gives one. */
export interface Band {
  min: number;
  max: number;
}

export interface StageTargets {
  dayC: Band;
  nightC: Band;
  rhPct: Band;
  /** Acceptable VPD, kPa. */
  vpdKpa: Band;
  /** Ideal VPD inside the acceptable band, kPa. */
  vpdIdealKpa: Band;
  /** Nutrient solution EC at the dripper, dS/m. */
  ecDsM: Band;
  co2Ppm: Band;
}

export interface VpdParams {
  crop: CropId;
  stage: CropStage;
  light: LightCondition;
  airC: number;
  rhPct: number;
  /** Outside air, to tell whether ventilating dries the house. */
  outsideC: number;
  outsideRhPct: number;
}

export type VpdStatus = 'tooWet' | 'good' | 'tooDry';

export type VpdAction =
  | 'hold'
  | 'ventilate'
  | 'heatAndVent'
  | 'heat'
  | 'humidify'
  | 'coolAndHumidify';

/** One temperature and the humidity that gives the same VPD there. */
export interface VpdPair {
  airC: number;
  rhPct: number;
}

export interface VpdResult {
  vpdKpa: number;
  dewPointC: number;
  /** Water in the air, g/m³. */
  absoluteGm3: number;
  /** What the air can still take before it saturates, g/m³. */
  headroomGm3: number;
  insideGkg: number;
  outsideGkg: number;
  status: VpdStatus;
  /** Inside the ideal band, not only the acceptable one. */
  ideal: boolean;
  action: VpdAction;
  /** The bands for this stage and light. */
  band: Band;
  idealBand: Band;
  temperatureBand: Band;
  rhBand: Band;
  /** Other temperatures with the same VPD as the middle of the ideal band. */
  pairs: VpdPair[];
  notes: CalcNote[];
}

export interface FogParams {
  outsideC: number;
  outsideRhPct: number;
  floorAreaM2: number;
  coverAreaM2: number;
  volumeM3: number;
  uValue: number;
  radiationWm2: number;
  transmissionPct: number;
  shadingPct: number;
  evapotranspirationPct: number;
  /** Roof and side vents open, percent of the floor. */
  ventPct: number;
  ventOpeningM: number;
  windMs: number;
  /** Nozzles per 100 m² of floor. */
  nozzlesPer100M2: number;
  /** One nozzle at its working pressure, L/h. */
  nozzleLh: number;
  /** Working pressure, bar (high pressure: about 40–70). */
  pressureBar: number;
  /** One burst of fog, s; the pause after it is worked out. */
  onS: number;
  /** Stop fogging above this inside humidity. */
  maxRhPct: number;
  /** Hours a day the fog runs in the hot season. */
  hoursPerDay: number;
}

export interface FogResult {
  wetBulbC: number;
  /** Inside with the vents only (no fog). */
  ventOnlyC: number;
  insideC: number;
  insideRhPct: number;
  rhRisePct: number;
  vpdKpa: number;
  /** Fog sprayed while the nozzles run, g/m² per minute. */
  fogGm2Min: number;
  /** Averaged over the on/off cycle, g/m² per minute. */
  meanGm2Min: number;
  /** The cycle that holds the humidity cap: a burst, then a pause, s. */
  onS: number;
  offS: number;
  dutyPct: number;
  /** Fog water sprayed in a day, m³. */
  waterM3Day: number;
  waterLm2Day: number;
  airFlowM3h: number;
  nozzles: number;
  /** Pad-and-fan water for the same house, for comparison, m³/day. */
  padWaterM3Day: number;
  /** Ran into the humidity cap, so the fog is cut back. */
  rhLimited: boolean;
  notes: CalcNote[];
}

export type CoolingStrategy =
  'vents' | 'ventsAndShade' | 'shadeAndFog' | 'shadeAndPad';

export interface CoolingAdvice {
  strategy: CoolingStrategy;
  /** Vent opening needed with the inputs as they are, percent of floor. */
  ventPct: number;
  /** The same with the advisor's shade. */
  shadedVentPct: number;
  shadePct: number;
  /** Inside temperature with shade and fog, °C. */
  fogInsideC: number;
  /** Air leaving the pad, °C. */
  padOutletC: number;
  notes: CalcNote[];
}

export interface CalendarParams {
  climateId: string;
  crop: CropId;
  /** ISO week the young plants go into the house. */
  plantingWeek: number;
  /** Weeks of raising seedlings before planting. */
  nurseryWeeks: number;
  /** Planting to the first flowers. */
  vegetativeWeeks: number;
  /** First flowers to the first harvest. */
  floweringWeeks: number;
  /** Planting to the end of the crop. */
  cropWeeks: number;
  nightSetC: number;
  /** Vents open above this; days below it leave the house closed. */
  ventilateAboveC: number;
  /** Shade above this daily light, mol/m² per day. */
  maxDli: number;
  transmissionPct: number;
  /** Outside afternoons above this need evaporative cooling, °C. */
  coolAboveC: number;
}

export interface CalendarStage {
  stage: CropStage | 'cleanOut';
  /** ISO weeks, 1–52; `endWeek` is the last week of the stage. */
  startWeek: number;
  endWeek: number;
  weeks: number;
}

export interface CalendarWeek {
  week: number;
  month: number;
  /** `cleanOut` while the house is empty between crops. */
  stage: Exclude<CropStage, 'nursery'> | 'cleanOut';
  /** Seedlings for the next crop are in the nursery this week. */
  nursery: boolean;
  tMinC: number;
  tMaxC: number;
  /** Sunlight reaching the crop, mol/m² per day. */
  dli: number;
  heating: boolean;
  co2: boolean;
  shade: boolean;
  fog: boolean;
}

export interface CalendarResult {
  stages: CalendarStage[];
  /** 52 weeks from the planting week. */
  weeks: CalendarWeek[];
  firstHarvestWeek: number;
  endWeek: number;
  harvestWeeks: number;
  heatingWeeks: number;
  co2Weeks: number;
  shadeWeeks: number;
  fogWeeks: number;
  /** First week the heating comes on after planting (0: never). */
  heatingFromWeek: number;
  notes: CalcNote[];
}

// ---------------------------------------------------------------------------
// The water chain: seawater RO and fertigation with drain recycling
// ---------------------------------------------------------------------------

export interface RoParams {
  /** Irrigation the plant must supply on the peak day, m³. */
  demandM3Day: number;
  /** Losses on the way (flushing, leaks, filters), percent of demand. */
  lossesPct: number;
  /** Salinity of the seawater, g/L (39–40 on the Gabès coast). */
  feedSalinityGL: number;
  /** Product over feed, percent (seawater RO: 40–50). */
  recoveryPct: number;
  /** Salt the membranes hold back, percent. */
  rejectionPct: number;
  /** Specific energy, kWh per m³ of product (typical 3–4). */
  secKwhM3: number;
  /** Electricity, per kWh in the project's currency. */
  electricityPrice: number;
  /** Days of product to store. */
  storageDays: number;
  /** Product the installed plant makes at full output, m³/day. */
  capacityM3Day: number;
  /** Share of the time the plant runs (cleaning, maintenance), percent. */
  availabilityPct: number;
}

export interface RoResult {
  needM3Day: number;
  feedM3Day: number;
  brineM3Day: number;
  brineSalinityGL: number;
  /** Salt left in the product, mg/L. */
  productMgL: number;
  /** Its EC, dS/m (about mg/L ÷ 640). */
  productEcDsM: number;
  energyKwhDay: number;
  powerKw: number;
  costDay: number;
  costPerM3: number;
  tankM3: number;
  /** What the installed plant covers of the need, percent. */
  coveragePct: number;
  notes: CalcNote[];
}

export interface FertigationParams {
  /** Water given at the drippers, m³ a day. */
  appliedM3Day: number;
  /** Drain share of what is given, percent. */
  drainPct: number;
  /** Share of the drain disinfected and reused, percent. */
  recyclePct: number;
  /** EC of the fresh water (RO product or well), dS/m. */
  sourceEcDsM: number;
  /** Sodium in the fresh water, mmol/L. */
  sourceNaMmolL: number;
  /**
   * Chloride in the fresh water, mmol/L. Results saved before chloride was
   * tracked lack it: it then follows the sodium, as in sodium chloride.
   */
  sourceClMmolL?: number;
  /**
   * Bicarbonate in the fresh water, mmol/L: RO water under 0.5, wells 2–6.
   * Missing in older saved results: none.
   */
  sourceHco3MmolL?: number;
  /** EC of the nutrient solution at the dripper, dS/m. */
  targetEcDsM: number;
  /** EC the crop takes up with its water, dS/m (tomato about 1.5–2). */
  uptakeEcDsM: number;
  /** Flush the recirculating water when its EC reaches this, dS/m. */
  flushEcDsM: number;
  /** ...or when its sodium reaches this, mmol/L. */
  naLimitMmolL: number;
  /** ...or when its chloride reaches this, mmol/L (missing: no limit). */
  clLimitMmolL?: number;
  /** Water in the loop: slabs, pipes and tanks, m³. */
  systemM3: number;
  /** Stock dilution, 1 : this (100 or 200). */
  dilution: number;
  /** Each of the A and B stock tanks, m³. */
  stockTankM3: number;
  /** Yield lost per dS/m above the threshold, percent (indicative). */
  yieldSlopePct: number;
  /** Root-zone EC where losses start, dS/m. */
  yieldThresholdEc: number;
}

export interface FertigationDay {
  day: number;
  /** Sodium in the drain (the root zone, where its limit is read), mmol/L. */
  naMmolL: number;
  /** Chloride in the drain, mmol/L. */
  clMmolL: number;
  /** EC of the solution at the dripper with that salt in it, dS/m. */
  feedEcDsM: number;
}

/** What makes the loop's water go first: sodium, chloride or its EC. */
export type FlushLimit = 'na' | 'cl' | 'ec';

/**
 * Ways to keep salt down in a recirculating loop: as set now; a closed loop
 * flushed at the EC ceiling; the same with acid in the refill, so bicarbonate
 * stops building up; a closed loop whose refill EC drops as salt builds up;
 * and a steady bleed of drain that holds the loop under its limits.
 */
export type FlushStrategy = 'current' | 'flush' | 'acid' | 'variable' | 'bleed';

export interface FlushStrategyResult {
  id: FlushStrategy;
  /** Times the loop is emptied and refilled in a year. */
  flushesYear: number;
  /** Drain let go every day, m³. */
  letGoM3Day: number;
  /** Solution let go in a year, bleed and flushes, m³. */
  letGoM3Year: number;
  /** Fresh water used in a year, m³. */
  freshM3Year: number;
  /** Stock lost with the water let go, L of each of tank A and B a year. */
  stockLostLYear: number;
  /** Mean root-zone EC over the year, dS/m. */
  meanRootEcDsM: number;
  /** Yield lost to salinity over the year, percent (indicative). */
  yieldLossPct: number;
  /** Lowest nutrient EC in the feed over the year, dS/m. */
  minNutrientEcDsM: number;
}

export interface FertigationResult {
  drainM3Day: number;
  reusedM3Day: number;
  dischargedM3Day: number;
  freshM3Day: number;
  drainEcDsM: number;
  rootEcDsM: number;
  yieldLossPct: number;
  waterSavedPct: number;
  fertiliserSavedPct: number;
  /** Stock from each of tank A and tank B a day, L. */
  stockLDay: number;
  stockDays: number;
  /** Days until a flush (null: salt levels off under every limit). */
  flushDay: number | null;
  /** The limit the loop reaches first, or would reach if it climbed. */
  limitBy: FlushLimit;
  /** Where sodium in the drain levels off when part of it is let go, mmol/L. */
  naEquilibriumMmolL: number | null;
  /** Where chloride in the drain levels off, mmol/L. */
  clEquilibriumMmolL: number | null;
  /** The first 120 days of the loop. */
  days: FertigationDay[];
  /** A year of the loop under each way of keeping salt down. */
  strategies: FlushStrategyResult[];
  notes: CalcNote[];
}

// ---------------------------------------------------------------------------
// Projects and saved results
// ---------------------------------------------------------------------------

export interface SavedCalcBase<K extends string, I> {
  id: string;
  label: string;
  savedAt: string;
  kind: K;
  /** Inputs only; reopening recomputes with the current rules. */
  inputs: I;
}

export type SavedCalculation =
  | SavedCalcBase<'heatPeak', HeatLossParams>
  | SavedCalcBase<'heatYear', AnnualHeatingParams>
  | SavedCalcBase<'hotWater', HotWaterParams>
  | SavedCalcBase<'ventilation', VentilationParams>
  | SavedCalcBase<'padFan', PadFanParams>
  | SavedCalcBase<'cropWater', CropWaterParams>
  | SavedCalcBase<'rainwater', RainwaterParams>
  | SavedCalcBase<'light', LightParams>
  | SavedCalcBase<'co2', Co2Params>
  | SavedCalcBase<'humidity', HumidityParams>
  | SavedCalcBase<'vpd', VpdParams>
  | SavedCalcBase<'fog', FogParams>
  | SavedCalcBase<'calendar', CalendarParams>
  | SavedCalcBase<'ro', RoParams>
  | SavedCalcBase<'fertigation', FertigationParams>
  | SavedCalcBase<'energy', EnergyHubParams>
  | SavedCalcBase<'heatReuse', HeatReuseParams>
  | SavedCalcBase<'coolingYear', CoolingYearParams>
  | SavedCalcBase<'solarPv', SolarPvParams>
  | SavedCalcBase<'economics', EconomicsParams>;

export type CalcKind = SavedCalculation['kind'];

export type Currency = 'TND' | 'EUR' | 'USD';

/** A plant the compartments of a site share. */
export type PlantType = 'ro' | 'chp' | 'boiler' | 'chiller' | 'tank' | 'pump';

export interface SitePlant {
  id: string;
  type: PlantType;
  /** What the site calls it ("RO line 2"). */
  name: string;
  /**
   * Its size: RO m³ of product a day; CHP and boiler kW of heat; chiller kW
   * of cooling; tank m³; pump m³/h.
   */
  capacity: number;
  /**
   * RO recovery, CHP electrical efficiency, boiler efficiency, tank's
   * usable share, pump efficiency, percent; a chiller's COP.
   */
  efficiency: number;
  /** Hours a day it can run. */
  hoursDay: number;
}

/** What the site pays, and is paid, for energy and water. */
export interface SiteTariffs {
  gasPerM3: number;
  electricityPerKwh: number;
  /** Electricity sold to the grid, per kWh. */
  exportPerKwh: number;
  waterPerM3: number;
}

/** What a site holds above its compartments: shared plants and tariffs. */
export interface SiteRecord {
  /** The site's name: the "Site" field its projects share. */
  name: string;
  plants: SitePlant[];
  tariffs: SiteTariffs;
  updatedAt: string;
}

export interface GreenhouseProject {
  id: string;
  title: string;
  /** Free text: farm, block or address. */
  site: string;
  climateId: string;
  crop: CropId;
  currency: Currency;
  greenhouse: GreenhouseSpec;
  /**
   * The compartment this project stands for, ha: its house repeated over
   * the area. Unset, the house's own floor.
   */
  areaHa?: number;
  /** The crop log: scouting, releases, sprays, maintenance, hygiene. */
  logs?: LogEntry[];
  /** Imported sensor readings, oldest first. */
  readings?: Reading[];
  notes?: string;
  calculations: SavedCalculation[];
  createdAt: string;
  updatedAt: string;
}
