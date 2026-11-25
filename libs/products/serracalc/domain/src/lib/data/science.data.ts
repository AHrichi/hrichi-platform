import type { SourceId } from './targets.data';

/**
 * The science behind the calculators, language-neutral: each phenomenon's
 * formula (symbols read the same in every language), what it links to, and
 * for every input field how to get its value: measure it (and with what),
 * read it off a datasheet, set it, assume it, or let SerraCalc work it out.
 * The feature writes the explanations.
 */

export type PhenomenonId =
  | 'geometry'
  | 'heatLoss'
  | 'airLeakage'
  | 'hotWater'
  | 'solarGain'
  | 'ventilation'
  | 'evaporativeCooling'
  | 'fogging'
  | 'vpd'
  | 'dewPoint'
  | 'nightHumidity'
  | 'transpiration'
  | 'rainHarvest'
  | 'desalination'
  | 'fertigation'
  | 'light'
  | 'co2'
  | 'cropCalendar';

export type ScienceGroup = 'house' | 'heat' | 'air' | 'water' | 'crop';

export type InstrumentId =
  | 'tape'
  | 'thermometer'
  | 'hygrometer'
  | 'weatherStation'
  | 'pyranometer'
  | 'parSensor'
  | 'anemometer'
  | 'co2Sensor'
  | 'tracerGas'
  | 'flowMeter'
  | 'catchCups'
  | 'drainTray'
  | 'pressureGauge'
  | 'infrared'
  | 'meters'
  | 'ecMeter'
  | 'labAnalysis'
  | 'climateComputer';

/** How a value is obtained. */
export type MethodKind =
  'measure' | 'datasheet' | 'derived' | 'setpoint' | 'assume' | 'bill';

/** A place in the app: a screen and, where it has tabs, the tab. */
export interface ToolLink {
  screen: string;
  tab?: string;
}

export interface Phenomenon {
  id: PhenomenonId;
  group: ScienceGroup;
  /** The governing equations, in symbols. */
  formula: string;
  /** Field keys the phenomenon reads. */
  inputs: readonly string[];
  related: readonly PhenomenonId[];
  tools: readonly ToolLink[];
  sources: readonly SourceId[];
}

export interface InputMethod {
  kind: MethodKind;
  instrument?: InstrumentId;
  /** The phenomenon to read about; generic fields take the screen's. */
  topic?: PhenomenonId;
}

export const SCIENCE_GROUPS: readonly ScienceGroup[] = [
  'house',
  'heat',
  'air',
  'water',
  'crop',
];

export const PHENOMENA: readonly Phenomenon[] = [
  {
    id: 'geometry',
    group: 'house',
    formula:
      'A_floor = n × w × L;  A_cover = roof + side walls + gables;  V = A_floor × h_mean',
    inputs: ['spans', 'spanWidthM', 'lengthM', 'gutterHeightM', 'ridgeHeightM'],
    related: ['heatLoss', 'airLeakage', 'ventilation'],
    tools: [{ screen: 'greenhouse' }],
    sources: ['typical'],
  },
  {
    id: 'heatLoss',
    group: 'heat',
    formula: 'Q = U × A_cover × (T_in − T_out) × (1 − screen) + F × P × ΔT',
    inputs: [
      'uValue',
      'coverAreaM2',
      'insideC',
      'outsideDesignC',
      'screenSavingPct',
      'perimeterM',
      'marginPct',
    ],
    related: ['airLeakage', 'hotWater', 'dewPoint', 'geometry'],
    tools: [
      { screen: 'heating', tab: 'peak' },
      { screen: 'heating', tab: 'year' },
    ],
    sources: ['typical'],
  },
  {
    id: 'airLeakage',
    group: 'heat',
    formula:
      'Q_leak = 0.335 × N × V × (T_in − T_out)   [W; N per hour, V in m³]',
    inputs: ['airChangesPerHour', 'volumeM3'],
    related: ['heatLoss', 'co2', 'nightHumidity'],
    tools: [
      { screen: 'heating', tab: 'peak' },
      { screen: 'air', tab: 'co2' },
    ],
    sources: ['typical'],
  },
  {
    id: 'hotWater',
    group: 'heat',
    formula:
      'flow = Q / (1.163 × ΔT_water);  q = (h_c + h_r) × π D × (T_pipe − T_air);  h_c = 1.32 (ΔT / D)^0.25',
    inputs: [
      'heatDemandKw',
      'supplyC',
      'returnC',
      'airC',
      'loopLengthM',
      'pumpHeadM',
      'pumpEfficiencyPct',
    ],
    related: ['heatLoss', 'cropCalendar'],
    tools: [{ screen: 'heating', tab: 'pipes' }],
    sources: ['typical'],
  },
  {
    id: 'solarGain',
    group: 'air',
    formula: 'Q_sun = τ × (1 − shade) × Rg × A_floor × (1 − ET)',
    inputs: [
      'radiationWm2',
      'transmissionPct',
      'shadingPct',
      'evapotranspirationPct',
    ],
    related: ['ventilation', 'transpiration', 'light'],
    tools: [
      { screen: 'cooling', tab: 'ventilation' },
      { screen: 'heating', tab: 'year' },
    ],
    sources: ['soussi2022'],
  },
  {
    id: 'ventilation',
    group: 'air',
    formula:
      'G = (Q_sun − U·A·ΔT) / (ρ·cp·ΔT);  G = Cd × A_vent/2 × √(2g × ΔT/T × h/4 + Cw × u²)',
    inputs: [
      'outsideC',
      'maxRiseK',
      'windMs',
      'ventOpeningM',
      'fanCapacityM3h',
    ],
    related: ['solarGain', 'evaporativeCooling', 'fogging', 'co2'],
    tools: [{ screen: 'cooling', tab: 'ventilation' }],
    sources: ['soussi2022'],
  },
  {
    id: 'evaporativeCooling',
    group: 'air',
    formula:
      'T_pad = T − η × (T − T_wet);  water = ρ × G × cp × (T − T_pad) / λ',
    inputs: [
      'outsideRhPct',
      'padEfficiencyPct',
      'riseK',
      'padFaceVelocityMs',
      'padHeightM',
      'padToFanM',
    ],
    related: ['fogging', 'vpd', 'ventilation'],
    tools: [{ screen: 'cooling', tab: 'padFan' }],
    sources: ['soussi2022', 'ishii'],
  },
  {
    id: 'fogging',
    group: 'air',
    formula:
      'T_in = T_out + (S − λE) / (ρ·cp·G + U·A);  x_in = x_out + (E + E_crop) / (ρ·G);  W = q × A × t / 10⁶',
    inputs: [
      'ventPct',
      'nozzlesPer100M2',
      'nozzleLh',
      'pressureBar',
      'onS',
      'maxRhPct',
    ],
    related: ['evaporativeCooling', 'ventilation', 'vpd'],
    tools: [{ screen: 'cooling', tab: 'fog' }],
    sources: ['ishii', 'soussi2022'],
  },
  {
    id: 'vpd',
    group: 'air',
    formula:
      'e_s = 0.6108 × exp(17.27 T / (T + 237.3));  VPD = e_s × (1 − RH / 100)',
    inputs: ['airC', 'rhPct'],
    related: ['dewPoint', 'transpiration', 'fogging', 'nightHumidity'],
    tools: [{ screen: 'air', tab: 'vpd' }],
    sources: ['shamshiri2018', 'soussi2022'],
  },
  {
    id: 'dewPoint',
    group: 'air',
    formula:
      'T_dew: e_s(T_dew) = e;  T_cover = T_in − (U / 8) × (T_in − T_out);  drips if T_cover < T_dew',
    inputs: ['insideC', 'insideRhPct', 'uValue'],
    related: ['vpd', 'nightHumidity', 'heatLoss'],
    tools: [{ screen: 'air', tab: 'humidity' }],
    sources: ['typical'],
  },
  {
    id: 'nightHumidity',
    group: 'air',
    formula: 'G = E / (ρ × (x_in − x_out));  Q = ρ × cp × G × (T_in − T_out)',
    inputs: ['insideRhPct', 'transpirationGm2h', 'nightHours'],
    related: ['dewPoint', 'airLeakage', 'vpd'],
    tools: [{ screen: 'air', tab: 'humidity' }],
    sources: ['typical'],
  },
  {
    id: 'transpiration',
    group: 'water',
    formula:
      'E = k × canopy × τ × (1 − shade) × Rg / λ;  applied = E / (1 − drain)',
    inputs: [
      'transpirationPct',
      'canopyPct',
      'drainPct',
      'cropAreaPct',
      'plantsPerM2',
      'emittersPerPlant',
      'emitterLh',
      'shotMl',
      'pumpM3h',
    ],
    related: ['solarGain', 'vpd', 'fertigation', 'desalination'],
    tools: [{ screen: 'water', tab: 'crop' }],
    sources: ['typical'],
  },
  {
    id: 'rainHarvest',
    group: 'water',
    formula: 'V = rain × A_roof × run-off;  S_t = min(S_max, S_t−1 + V − use)',
    inputs: ['catchmentM2', 'runoffPct', 'basinM3'],
    related: ['transpiration'],
    tools: [{ screen: 'water', tab: 'rain' }],
    sources: ['typical'],
  },
  {
    id: 'desalination',
    group: 'water',
    formula:
      'F = P / R;  B = F − P;  S_brine = (F·S_feed − P·S_product) / B ≈ S_feed / (1 − R);  E = SEC × P',
    inputs: [
      'demandM3Day',
      'lossesPct',
      'feedSalinityGL',
      'recoveryPct',
      'rejectionPct',
      'secKwhM3',
      'capacityM3Day',
      'availabilityPct',
    ],
    related: ['transpiration', 'fertigation'],
    tools: [{ screen: 'supply', tab: 'ro' }],
    sources: ['typical'],
  },
  {
    id: 'fertigation',
    group: 'water',
    formula:
      'EC_drain = (A·EC_feed − U·EC_uptake) / D;  V·dC/dt = C_in·F − C·(A/D)·L;  closed: t_flush = V (C_lim − C_0) / (C_in·F);  Y = 1 − 0.073 (EC − 2.0)',
    inputs: [
      'appliedM3Day',
      'drainPct',
      'recyclePct',
      'sourceEcDsM',
      'sourceNaMmolL',
      'targetEcDsM',
      'uptakeEcDsM',
      'flushEcDsM',
      'naLimitMmolL',
      'systemM3',
      'dilution',
      'yieldSlopePct',
    ],
    related: ['transpiration', 'desalination', 'vpd'],
    tools: [{ screen: 'supply', tab: 'fertigation' }],
    sources: ['rodriguezOrtega2019', 'hydrotool'],
  },
  {
    id: 'light',
    group: 'crop',
    formula:
      'DLI = Rg × 0.47 × 4.57 × τ;  PPFD = (DLI_target − DLI) × 10⁶ / (h × 3600);  shade = 1 − DLI_max / DLI',
    inputs: ['targetDli', 'maxDli', 'lampHours', 'efficacyUmolJ', 'fixtureW'],
    related: ['solarGain', 'co2', 'cropCalendar'],
    tools: [{ screen: 'air', tab: 'light' }],
    sources: ['typical'],
  },
  {
    id: 'co2',
    group: 'crop',
    formula:
      'supply = N × V × (C_in − C_out) × 1.83 × 10⁻⁶ + uptake × A;  gas = CO₂ / 1.96',
    inputs: ['targetPpm', 'outsidePpm', 'uptakeGm2h', 'burnerEfficiencyPct'],
    related: ['airLeakage', 'ventilation', 'light'],
    tools: [{ screen: 'air', tab: 'co2' }],
    sources: ['vtCo2', 'soussi2022'],
  },
  {
    id: 'cropCalendar',
    group: 'crop',
    formula:
      'heat if T_min < night set point;  CO₂ if T_max ≤ vent temperature;  shade if DLI > ceiling;  fog if T_max ≥ fog threshold',
    inputs: [
      'plantingWeek',
      'nurseryWeeks',
      'vegetativeWeeks',
      'floweringWeeks',
      'cropWeeks',
      'nightSetC',
      'ventilateAboveC',
      'coolAboveC',
    ],
    related: ['vpd', 'heatLoss', 'fogging', 'light'],
    tools: [{ screen: 'calendar' }],
    sources: ['soussi2022'],
  },
];

export const INSTRUMENTS: readonly InstrumentId[] = [
  'tape',
  'thermometer',
  'hygrometer',
  'weatherStation',
  'pyranometer',
  'parSensor',
  'anemometer',
  'co2Sensor',
  'tracerGas',
  'flowMeter',
  'catchCups',
  'drainTray',
  'pressureGauge',
  'infrared',
  'meters',
  'ecMeter',
  'labAnalysis',
  'climateComputer',
];

const m = (
  kind: MethodKind,
  instrument?: InstrumentId,
  topic?: PhenomenonId,
): InputMethod => ({ kind, instrument, topic });

/** How to get every input field's value, by field key. */
export const INPUT_METHODS: Record<string, InputMethod> = {
  // The house
  spans: m('measure', 'tape', 'geometry'),
  spanWidthM: m('measure', 'tape', 'geometry'),
  lengthM: m('measure', 'tape', 'geometry'),
  gutterHeightM: m('measure', 'tape', 'geometry'),
  ridgeHeightM: m('measure', 'tape', 'geometry'),
  floorAreaM2: m('derived', undefined, 'geometry'),
  coverAreaM2: m('derived', undefined, 'geometry'),
  volumeM3: m('derived', undefined, 'geometry'),
  perimeterM: m('derived', undefined, 'geometry'),
  // Heat
  uValue: m('datasheet', undefined, 'heatLoss'),
  airChangesPerHour: m('measure', 'tracerGas', 'airLeakage'),
  screenSavingPct: m('datasheet', undefined, 'heatLoss'),
  insideC: m('setpoint', 'thermometer'),
  outsideDesignC: m('measure', 'weatherStation', 'heatLoss'),
  marginPct: m('assume', undefined, 'heatLoss'),
  nightSetC: m('setpoint', 'climateComputer'),
  daySetC: m('setpoint', 'climateComputer', 'heatLoss'),
  solarGainPct: m('assume', undefined, 'solarGain'),
  efficiencyPct: m('datasheet', 'meters', 'heatLoss'),
  fuelPrice: m('bill', 'meters'),
  annualHeatKwh: m('derived', 'meters', 'heatLoss'),
  heatDemandKw: m('derived', undefined, 'hotWater'),
  supplyC: m('measure', 'infrared', 'hotWater'),
  returnC: m('measure', 'infrared', 'hotWater'),
  airC: m('measure', 'thermometer'),
  loopLengthM: m('measure', 'tape', 'hotWater'),
  pumpHeadM: m('measure', 'pressureGauge'),
  pumpEfficiencyPct: m('datasheet', undefined, 'hotWater'),
  // Sun and air
  radiationWm2: m('measure', 'pyranometer', 'solarGain'),
  transmissionPct: m('measure', 'parSensor', 'solarGain'),
  shadingPct: m('datasheet', 'parSensor', 'solarGain'),
  evapotranspirationPct: m('assume', undefined, 'transpiration'),
  outsideC: m('measure', 'weatherStation'),
  outsideRhPct: m('measure', 'weatherStation'),
  maxRiseK: m('setpoint', undefined, 'ventilation'),
  windMs: m('measure', 'anemometer', 'ventilation'),
  ventOpeningM: m('measure', 'tape', 'ventilation'),
  fanCapacityM3h: m('datasheet', undefined, 'ventilation'),
  padEfficiencyPct: m('datasheet', 'thermometer', 'evaporativeCooling'),
  riseK: m('setpoint', undefined, 'evaporativeCooling'),
  padFaceVelocityMs: m('datasheet', 'anemometer', 'evaporativeCooling'),
  padHeightM: m('measure', 'tape', 'evaporativeCooling'),
  padToFanM: m('measure', 'tape', 'evaporativeCooling'),
  hoursPerDay: m('measure', 'climateComputer'),
  ventPct: m('measure', 'tape', 'fogging'),
  nozzlesPer100M2: m('datasheet', undefined, 'fogging'),
  nozzleLh: m('datasheet', 'catchCups', 'fogging'),
  pressureBar: m('measure', 'pressureGauge', 'fogging'),
  onS: m('setpoint', 'climateComputer', 'fogging'),
  maxRhPct: m('setpoint', 'climateComputer', 'fogging'),
  rhPct: m('measure', 'hygrometer', 'vpd'),
  insideRhPct: m('setpoint', 'hygrometer', 'nightHumidity'),
  transpirationGm2h: m('assume', undefined, 'nightHumidity'),
  nightHours: m('derived', undefined, 'nightHumidity'),
  // Water
  cropAreaPct: m('measure', 'tape', 'transpiration'),
  transpirationPct: m('assume', undefined, 'transpiration'),
  canopyPct: m('assume', undefined, 'transpiration'),
  drainPct: m('measure', 'drainTray', 'transpiration'),
  plantsPerM2: m('measure', 'tape', 'transpiration'),
  emittersPerPlant: m('measure', 'tape', 'transpiration'),
  emitterLh: m('measure', 'catchCups', 'transpiration'),
  shotMl: m('setpoint', 'climateComputer', 'transpiration'),
  pumpM3h: m('measure', 'flowMeter', 'transpiration'),
  catchmentM2: m('derived', undefined, 'rainHarvest'),
  runoffPct: m('assume', undefined, 'rainHarvest'),
  basinM3: m('measure', 'tape', 'rainHarvest'),
  // Seawater RO
  demandM3Day: m('derived', 'flowMeter', 'desalination'),
  lossesPct: m('assume', 'flowMeter', 'desalination'),
  feedSalinityGL: m('measure', 'ecMeter', 'desalination'),
  recoveryPct: m('datasheet', 'flowMeter', 'desalination'),
  rejectionPct: m('datasheet', 'ecMeter', 'desalination'),
  secKwhM3: m('measure', 'meters', 'desalination'),
  storageDays: m('setpoint', undefined, 'desalination'),
  capacityM3Day: m('datasheet', undefined, 'desalination'),
  availabilityPct: m('assume', 'climateComputer', 'desalination'),
  // Fertigation
  appliedM3Day: m('measure', 'flowMeter', 'fertigation'),
  recyclePct: m('setpoint', 'flowMeter', 'fertigation'),
  sourceEcDsM: m('measure', 'ecMeter', 'fertigation'),
  sourceNaMmolL: m('measure', 'labAnalysis', 'fertigation'),
  targetEcDsM: m('setpoint', 'ecMeter', 'fertigation'),
  uptakeEcDsM: m('assume', 'labAnalysis', 'fertigation'),
  flushEcDsM: m('setpoint', 'ecMeter', 'fertigation'),
  naLimitMmolL: m('setpoint', 'labAnalysis', 'fertigation'),
  systemM3: m('measure', 'tape', 'fertigation'),
  dilution: m('setpoint', undefined, 'fertigation'),
  stockTankM3: m('measure', 'tape', 'fertigation'),
  yieldSlopePct: m('assume', undefined, 'fertigation'),
  yieldThresholdEc: m('assume', undefined, 'fertigation'),
  // Light and CO₂
  targetDli: m('setpoint', 'parSensor', 'light'),
  maxDli: m('setpoint', 'parSensor', 'light'),
  lampHours: m('setpoint', 'climateComputer', 'light'),
  efficacyUmolJ: m('datasheet', undefined, 'light'),
  fixtureW: m('datasheet', 'meters', 'light'),
  electricityPrice: m('bill', 'meters'),
  co2KgPerKwh: m('bill', undefined, 'light'),
  targetPpm: m('setpoint', 'co2Sensor', 'co2'),
  outsidePpm: m('measure', 'co2Sensor', 'co2'),
  uptakeGm2h: m('assume', undefined, 'co2'),
  daysPerYear: m('assume', 'climateComputer'),
  burnerEfficiencyPct: m('datasheet', undefined, 'co2'),
  gasPrice: m('bill', 'meters'),
  co2Price: m('bill', undefined, 'co2'),
  // The crop calendar
  plantingWeek: m('setpoint', undefined, 'cropCalendar'),
  nurseryWeeks: m('assume', undefined, 'cropCalendar'),
  vegetativeWeeks: m('assume', undefined, 'cropCalendar'),
  floweringWeeks: m('assume', undefined, 'cropCalendar'),
  cropWeeks: m('setpoint', undefined, 'cropCalendar'),
  ventilateAboveC: m('setpoint', 'climateComputer', 'cropCalendar'),
  coolAboveC: m('setpoint', 'weatherStation', 'cropCalendar'),
};

export function phenomenonById(id: PhenomenonId): Phenomenon {
  const found = PHENOMENA.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown phenomenon ${id}`);
  return found;
}

/** The phenomena whose calculators open on a screen and tab. */
export function phenomenaFor(screen: string, tab?: string): PhenomenonId[] {
  return PHENOMENA.filter((p) =>
    p.tools.some(
      (t) => t.screen === screen && (!tab || !t.tab || t.tab === tab),
    ),
  ).map((p) => p.id);
}
