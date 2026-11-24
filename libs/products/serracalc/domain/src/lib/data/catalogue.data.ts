import type {
  CoverMaterial,
  CropId,
  CropProfile,
  Currency,
  FuelProfile,
  FuelType,
  GreenhouseSpec,
  PipeProfile,
  PipeType,
  ScreenType,
} from '../models/serra.models';

export interface CoverProfile {
  id: CoverMaterial;
  /** Overall heat loss coefficient, W/m²·K (ASAE EP406 design values). */
  uValue: number;
  /** Light reaching the crop through cover and structure, percent. */
  transmissionPct: number;
  /** Air changes an hour on a still, cold night. */
  airChangesPerHour: number;
}

export const COVERS: Record<CoverMaterial, CoverProfile> = {
  glass_single: {
    id: 'glass_single',
    uValue: 6.2,
    transmissionPct: 72,
    airChangesPerHour: 1.25,
  },
  glass_double: {
    id: 'glass_double',
    uValue: 3.7,
    transmissionPct: 65,
    airChangesPerHour: 1,
  },
  pe_single: {
    id: 'pe_single',
    uValue: 6.2,
    transmissionPct: 70,
    airChangesPerHour: 1.5,
  },
  pe_double: {
    id: 'pe_double',
    uValue: 4,
    transmissionPct: 62,
    airChangesPerHour: 0.75,
  },
  pc_twin: {
    id: 'pc_twin',
    uValue: 3.6,
    transmissionPct: 64,
    airChangesPerHour: 1,
  },
  pc_triple: {
    id: 'pc_triple',
    uValue: 3,
    transmissionPct: 58,
    airChangesPerHour: 1,
  },
  acrylic_double: {
    id: 'acrylic_double',
    uValue: 3.2,
    transmissionPct: 68,
    airChangesPerHour: 1,
  },
};

export const COVER_IDS = Object.keys(COVERS) as CoverMaterial[];

/** How much a closed screen cuts the losses, percent of the night's heat. */
export const SCREEN_SAVINGS: Record<ScreenType, number> = {
  none: 0,
  clear: 25,
  shade_energy: 35,
  aluminised: 45,
};

export const SCREEN_IDS = Object.keys(SCREEN_SAVINGS) as ScreenType[];

/** Perimeter loss through the footing, W per metre of perimeter per K. */
export const PERIMETER_LOSS = { insulated: 0.7, bare: 1.4 } as const;

export const FUELS: Record<FuelType, FuelProfile> = {
  natural_gas: {
    id: 'natural_gas',
    unit: 'm3',
    kwhPerUnit: 9.77,
    co2KgPerUnit: 1.96,
    efficiencyPct: 90,
  },
  lpg: {
    id: 'lpg',
    unit: 'kg',
    kwhPerUnit: 12.8,
    co2KgPerUnit: 2.98,
    efficiencyPct: 90,
  },
  fuel_oil: {
    id: 'fuel_oil',
    unit: 'L',
    kwhPerUnit: 10,
    co2KgPerUnit: 2.68,
    efficiencyPct: 85,
  },
  heat_pump: {
    id: 'heat_pump',
    unit: 'kWh',
    kwhPerUnit: 1,
    // Tunisia's grid is mostly gas-fired (as in LuxPath's energy tab).
    co2KgPerUnit: 0.47,
    efficiencyPct: 300,
  },
  geothermal: {
    id: 'geothermal',
    unit: 'kWh',
    kwhPerUnit: 1,
    co2KgPerUnit: 0,
    efficiencyPct: 100,
  },
  biomass: {
    id: 'biomass',
    unit: 'kg',
    // Pellets or dried olive pomace (grignons).
    kwhPerUnit: 4.8,
    co2KgPerUnit: 0,
    efficiencyPct: 85,
  },
};

export const FUEL_IDS = Object.keys(FUELS) as FuelType[];

/** Example tariffs to start from; every screen asks for the real one. */
const FUEL_PRICES: Record<Currency, Record<FuelType, number>> = {
  TND: {
    natural_gas: 0.6,
    lpg: 1.8,
    fuel_oil: 2.05,
    heat_pump: 0.3,
    geothermal: 0,
    biomass: 0.35,
  },
  EUR: {
    natural_gas: 0.8,
    lpg: 1.2,
    fuel_oil: 1.2,
    heat_pump: 0.2,
    geothermal: 0,
    biomass: 0.3,
  },
  USD: {
    natural_gas: 0.85,
    lpg: 1.3,
    fuel_oil: 1.3,
    heat_pump: 0.22,
    geothermal: 0,
    biomass: 0.32,
  },
};

export function defaultFuelPrice(fuel: FuelType, currency: Currency): number {
  return FUEL_PRICES[currency][fuel];
}

/** Example price of liquid CO₂ per kg; every screen asks for the real one. */
const CO2_PRICES: Record<Currency, number> = { TND: 0.5, EUR: 0.15, USD: 0.16 };

export function defaultCo2Price(currency: Currency): number {
  return CO2_PRICES[currency];
}

export const PIPES: Record<PipeType, PipeProfile> = {
  // Painted steel pipe rail; bare galvanised radiates less (ε ≈ 0.3).
  steel_51: {
    id: 'steel_51',
    outerDiameterMm: 51,
    innerDiameterMm: 47,
    emissivity: 0.85,
  },
  steel_33: {
    id: 'steel_33',
    outerDiameterMm: 33.7,
    innerDiameterMm: 28.5,
    emissivity: 0.85,
  },
  pe_40: {
    id: 'pe_40',
    outerDiameterMm: 40,
    innerDiameterMm: 32.6,
    emissivity: 0.9,
  },
  pe_32: {
    id: 'pe_32',
    outerDiameterMm: 32,
    innerDiameterMm: 26,
    emissivity: 0.9,
  },
  pe_25: {
    id: 'pe_25',
    outerDiameterMm: 25,
    innerDiameterMm: 20.4,
    emissivity: 0.9,
  },
};

export const PIPE_IDS = Object.keys(PIPES) as PipeType[];

export const CROPS: Record<CropId, CropProfile> = {
  tomato: {
    id: 'tomato',
    nightSetC: 16,
    daySetC: 20,
    ventilateAboveC: 24,
    targetDli: 25,
    maxDli: 30,
    plantsPerM2: 2.5,
    transpirationCoef: 0.65,
  },
  cucumber: {
    id: 'cucumber',
    nightSetC: 18,
    daySetC: 21,
    ventilateAboveC: 26,
    targetDli: 20,
    maxDli: 30,
    plantsPerM2: 1.6,
    transpirationCoef: 0.7,
  },
  pepper: {
    id: 'pepper',
    nightSetC: 18,
    daySetC: 22,
    ventilateAboveC: 26,
    targetDli: 20,
    maxDli: 28,
    plantsPerM2: 3.3,
    transpirationCoef: 0.6,
  },
  melon: {
    id: 'melon',
    nightSetC: 16,
    daySetC: 22,
    ventilateAboveC: 28,
    targetDli: 22,
    maxDli: 30,
    plantsPerM2: 1.2,
    transpirationCoef: 0.6,
  },
  strawberry: {
    id: 'strawberry',
    nightSetC: 8,
    daySetC: 18,
    ventilateAboveC: 24,
    targetDli: 17,
    maxDli: 25,
    plantsPerM2: 8,
    transpirationCoef: 0.55,
  },
  lettuce: {
    id: 'lettuce',
    nightSetC: 10,
    daySetC: 18,
    ventilateAboveC: 22,
    targetDli: 15,
    maxDli: 17,
    plantsPerM2: 16,
    transpirationCoef: 0.55,
  },
  rose: {
    id: 'rose',
    nightSetC: 16,
    daySetC: 20,
    ventilateAboveC: 26,
    targetDli: 20,
    maxDli: 30,
    plantsPerM2: 7,
    transpirationCoef: 0.6,
  },
};

export const CROP_IDS = Object.keys(CROPS) as CropId[];

/** A new project's house: eight 9.6 m spans of double film, 60 m long. */
export const DEFAULT_GREENHOUSE: GreenhouseSpec = {
  shape: 'gable',
  spans: 8,
  spanWidthM: 9.6,
  lengthM: 60,
  gutterHeightM: 4.5,
  ridgeHeightM: 6.3,
  cover: 'pe_double',
  screen: 'clear',
  perimeterInsulated: false,
};
