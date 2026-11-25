import {
  COVERS,
  CROP_YIELD_T_HA,
  CROPS,
  ECONOMICS_PRICES,
  LABOUR_DAYS_HA,
  DEFAULT_GREENHOUSE,
  defaultCo2Price,
  defaultFuelPrice,
  FUELS,
  SCREEN_SAVINGS,
} from '../data/catalogue.data';
import { climateById, DEFAULT_CLIMATE_ID } from '../data/climates.data';
import { dayLengthHours, midMonthDay } from '../utils/physics';
import type {
  AnnualHeatingParams,
  CalendarParams,
  FertigationParams,
  FogParams,
  RoParams,
  VpdParams,
  Co2Params,
  CropId,
  CropWaterParams,
  Currency,
  EnvelopeParams,
  GreenhouseSpec,
  HeatLossParams,
  HotWaterParams,
  HumidityParams,
  LightParams,
  PadFanParams,
  RainwaterParams,
  SolarLoadParams,
  VentilationParams,
} from '../models/serra.models';
import { greenhouseGeometry } from './geometry';
import type { EnergyHubParams, HeatReuseParams } from './energy';
import { energyHub, GAS_KWH_PER_M3 } from './energy';
import type { CoolingAdviceParams } from './fog';
import { annualHeating, heatLoss } from './heating';
import type { EconomicsParams } from './site';
import { seawaterRo } from './water-chain';
import { cropWater } from './water';

/**
 * Where a calculator starts: the active project's house, climate and crop,
 * or a default house in Monastir growing tomatoes. Every calculator keeps
 * its own copy of these numbers, so a saved result never changes when the
 * project's house does.
 */
export interface CalcContext {
  greenhouse: GreenhouseSpec;
  climateId: string;
  crop: CropId;
  currency: Currency;
}

export const DEFAULT_CONTEXT: CalcContext = {
  greenhouse: DEFAULT_GREENHOUSE,
  climateId: DEFAULT_CLIMATE_ID,
  crop: 'tomato',
  currency: 'TND',
};

export function envelopeFrom(ctx: CalcContext): EnvelopeParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  const cover = COVERS[ctx.greenhouse.cover];
  return {
    floorAreaM2: g.floorAreaM2,
    coverAreaM2: g.coverAreaM2,
    volumeM3: g.volumeM3,
    perimeterM: g.perimeterM,
    cover: ctx.greenhouse.cover,
    uValue: cover.uValue,
    airChangesPerHour: cover.airChangesPerHour,
    perimeterInsulated: ctx.greenhouse.perimeterInsulated,
    screen: ctx.greenhouse.screen,
    screenSavingPct: SCREEN_SAVINGS[ctx.greenhouse.screen],
  };
}

export function defaultHeatLoss(ctx: CalcContext): HeatLossParams {
  return {
    ...envelopeFrom(ctx),
    insideC: CROPS[ctx.crop].nightSetC,
    outsideDesignC: climateById(ctx.climateId).designWinterC,
    screenClosed: ctx.greenhouse.screen !== 'none',
    marginPct: 10,
  };
}

export function defaultAnnualHeating(ctx: CalcContext): AnnualHeatingParams {
  const crop = CROPS[ctx.crop];
  return {
    ...envelopeFrom(ctx),
    climateId: ctx.climateId,
    nightSetC: crop.nightSetC,
    daySetC: crop.daySetC,
    transmissionPct: COVERS[ctx.greenhouse.cover].transmissionPct,
    solarGainPct: 50,
    fuel: 'natural_gas',
    efficiencyPct: FUELS.natural_gas.efficiencyPct,
    fuelPrice: defaultFuelPrice('natural_gas', ctx.currency),
  };
}

export function defaultHotWater(ctx: CalcContext): HotWaterParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  return {
    heatDemandKw: 0,
    // Geothermal wells in southern Tunisia give water at 60–75 °C.
    supplyC: 65,
    returnC: 45,
    airC: CROPS[ctx.crop].nightSetC,
    pipe: 'pe_40',
    floorAreaM2: g.floorAreaM2,
    loopLengthM: Math.round(ctx.greenhouse.lengthM * 2),
    pumpHeadM: 15,
    pumpEfficiencyPct: 60,
    annualHeatKwh: 0,
  };
}

function solarFrom(ctx: CalcContext): SolarLoadParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  return {
    floorAreaM2: g.floorAreaM2,
    coverAreaM2: g.coverAreaM2,
    volumeM3: g.volumeM3,
    uValue: COVERS[ctx.greenhouse.cover].uValue,
    radiationWm2: climateById(ctx.climateId).peakRadiationWm2,
    transmissionPct: COVERS[ctx.greenhouse.cover].transmissionPct,
    shadingPct: 0,
    evapotranspirationPct: 50,
  };
}

export function defaultVentilation(ctx: CalcContext): VentilationParams {
  const climate = climateById(ctx.climateId);
  return {
    ...solarFrom(ctx),
    outsideC: climate.designSummerC - 5,
    maxRiseK: 4,
    windMs: 2,
    ventOpeningM: 1,
    fanCapacityM3h: 30000,
  };
}

export function defaultPadFan(ctx: CalcContext): PadFanParams {
  const climate = climateById(ctx.climateId);
  return {
    ...solarFrom(ctx),
    shadingPct: 30,
    outsideC: climate.designSummerC,
    outsideRhPct: climate.designSummerRhPct,
    padEfficiencyPct: 80,
    riseK: 4,
    padFaceVelocityMs: 1.25,
    padHeightM: 1.8,
    padToFanM: ctx.greenhouse.lengthM,
    fanCapacityM3h: 30000,
    hoursPerDay: 8,
  };
}

export function defaultCropWater(ctx: CalcContext): CropWaterParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  const crop = CROPS[ctx.crop];
  return {
    climateId: ctx.climateId,
    floorAreaM2: g.floorAreaM2,
    cropAreaPct: 90,
    transmissionPct: COVERS[ctx.greenhouse.cover].transmissionPct,
    shadingPct: 0,
    transpirationPct: Math.round(crop.transpirationCoef * 100),
    canopyPct: 100,
    drainPct: 25,
    plantsPerM2: crop.plantsPerM2,
    emittersPerPlant: 1,
    emitterLh: 2,
    shotMl: 150,
    pumpM3h: 20,
  };
}

export function defaultRainwater(ctx: CalcContext): RainwaterParams {
  const water = defaultCropWater(ctx);
  return {
    ...water,
    catchmentM2: water.floorAreaM2,
    runoffPct: ctx.greenhouse.cover.startsWith('glass') ? 85 : 80,
    basinM3: Math.round(water.floorAreaM2 * 0.05),
  };
}

export function defaultLight(ctx: CalcContext): LightParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  const crop = CROPS[ctx.crop];
  return {
    climateId: ctx.climateId,
    floorAreaM2: g.floorAreaM2,
    transmissionPct: COVERS[ctx.greenhouse.cover].transmissionPct,
    targetDli: crop.targetDli,
    maxDli: crop.maxDli,
    lampHours: 16,
    // A 650 W LED top light at 2.8 µmol/J.
    efficacyUmolJ: 2.8,
    fixtureW: 650,
    electricityPrice: defaultFuelPrice('heat_pump', ctx.currency),
    co2KgPerKwh: FUELS.heat_pump.co2KgPerUnit,
  };
}

export function defaultCo2(ctx: CalcContext): Co2Params {
  const g = greenhouseGeometry(ctx.greenhouse);
  return {
    floorAreaM2: g.floorAreaM2,
    volumeM3: g.volumeM3,
    targetPpm: 800,
    outsidePpm: 420,
    // Vents mostly shut while enriching: the house's own leakage.
    airChangesPerHour: COVERS[ctx.greenhouse.cover].airChangesPerHour,
    uptakeGm2h: 3,
    hoursPerDay: 8,
    daysPerYear: 180,
    source: 'burner',
    co2Price: defaultCo2Price(ctx.currency),
    gasPrice: defaultFuelPrice('natural_gas', ctx.currency),
    burnerEfficiencyPct: 90,
  };
}

/** A January night: the night mean outside and the house's own cover. */
export function defaultHumidity(ctx: CalcContext): HumidityParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  const climate = climateById(ctx.climateId);
  const jan = climate.months[0];
  return {
    insideC: CROPS[ctx.crop].nightSetC,
    insideRhPct: 85,
    outsideC: Math.round((jan.tMinC + 0.3 * (jan.tMaxC - jan.tMinC)) * 2) / 2,
    outsideRhPct: 85,
    transpirationGm2h: 15,
    floorAreaM2: g.floorAreaM2,
    volumeM3: g.volumeM3,
    uValue: COVERS[ctx.greenhouse.cover].uValue,
    nightHours:
      Math.round((24 - dayLengthHours(climate.latitude, midMonthDay(0))) * 2) /
      2,
  };
}

/** A sunny day in the harvest stage, the outside air of a hot afternoon. */
export function defaultVpd(ctx: CalcContext): VpdParams {
  const climate = climateById(ctx.climateId);
  return {
    crop: ctx.crop,
    stage: 'harvest',
    light: 'sun',
    airC: 26,
    rhPct: 70,
    outsideC: climate.designSummerC - 5,
    outsideRhPct: climate.designSummerRhPct,
  };
}

/**
 * High-pressure fog on the design afternoon: half shade, vents trimmed to a
 * tenth of the floor, about 27 nozzles of 5.4 L/h per 100 m² (about
 * 24 g/m² a minute while on, as in Ishii's Arizona test).
 */
export function defaultFog(ctx: CalcContext): FogParams {
  const climate = climateById(ctx.climateId);
  return {
    ...solarFrom(ctx),
    shadingPct: 50,
    outsideC: climate.designSummerC,
    outsideRhPct: climate.designSummerRhPct,
    ventPct: 10,
    ventOpeningM: 1,
    windMs: 2,
    nozzlesPer100M2: 27,
    nozzleLh: 5.4,
    pressureBar: 40,
    onS: 60,
    maxRhPct: 75,
    hoursPerDay: 8,
  };
}

/** The ventilation inputs plus what the cooling advisor reads from the house. */
export function adviceParams(
  vent: VentilationParams,
  ctx: CalcContext,
): CoolingAdviceParams {
  return {
    ...vent,
    outsideRhPct: climateById(ctx.climateId).designSummerRhPct,
    houseLengthM: ctx.greenhouse.lengthM,
  };
}

/**
 * A crop year as the desert tomato sites run it: planted in week 36 after
 * seven weeks in the nursery, first flowers three weeks later, picking eight
 * weeks after that, finished after week 29.
 */
export function defaultCalendar(ctx: CalcContext): CalendarParams {
  const crop = CROPS[ctx.crop];
  return {
    climateId: ctx.climateId,
    crop: ctx.crop,
    plantingWeek: 36,
    nurseryWeeks: 7,
    vegetativeWeeks: 3,
    floweringWeeks: 8,
    cropWeeks: 46,
    nightSetC: crop.nightSetC,
    ventilateAboveC: crop.ventilateAboveC,
    maxDli: crop.maxDli,
    transmissionPct: COVERS[ctx.greenhouse.cover].transmissionPct,
    coolAboveC: 30,
  };
}

/** The house's peak-day irrigation, m³: what the water chain must deliver. */
function peakWaterM3(ctx: CalcContext): number {
  return cropWater(defaultCropWater(ctx)).peakM3Day;
}

/**
 * A seawater RO plant for the peak day: Gabès-coast seawater at 39.5 g/L,
 * 45 % recovery, 3.5 kWh/m³ (typical; confirm with the supplier), two days
 * of storage, sized to run 90 % of the time.
 */
export function defaultRo(ctx: CalcContext): RoParams {
  const demand = Math.round(peakWaterM3(ctx));
  const need = demand * 1.05;
  return {
    demandM3Day: demand,
    lossesPct: 5,
    feedSalinityGL: 39.5,
    recoveryPct: 45,
    rejectionPct: 99.6,
    secKwhM3: 3.5,
    electricityPrice: defaultFuelPrice('heat_pump', ctx.currency),
    storageDays: 2,
    capacityM3Day: Math.ceil(need / 0.9 / 10) * 10,
    availabilityPct: 90,
  };
}

/**
 * A recirculating tomato crop: 30 % drain with 40 % of it reused (desert
 * sites report reusing 30–50 % of their water), RO water, refill EC 2.7 and
 * a flush ceiling of 4.5 dS/m (Hydrotool's example), about 4 L of solution
 * in the loop per m² of floor.
 */
export function defaultFertigation(ctx: CalcContext): FertigationParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  return {
    appliedM3Day: Math.round(peakWaterM3(ctx) * 10) / 10,
    drainPct: 30,
    recyclePct: 40,
    sourceEcDsM: 0.3,
    sourceNaMmolL: 1,
    targetEcDsM: 2.7,
    uptakeEcDsM: 1.8,
    flushEcDsM: 4.5,
    naLimitMmolL: 8,
    systemM3: Math.max(1, Math.round((g.floorAreaM2 * 4) / 1000)),
    dilution: 100,
    stockTankM3: 5,
    yieldSlopePct: 7.3,
    yieldThresholdEc: 2,
  };
}

/**
 * A design winter day for the energy hub. The CHP is scaled from a desert
 * site's 10 MW of power for about 50 ha (20 W/m² of floor), runs through
 * the day so its CO₂ feeds the crop with the vents shut, and charges a
 * buffer of about 60 m³ a hectare for the night.
 */
export function defaultEnergyHub(ctx: CalcContext): EnergyHubParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  const climate = climateById(ctx.climateId);
  const crop = CROPS[ctx.crop];
  const coldest = climate.months.reduce((a, b) => (b.tMinC < a.tMinC ? b : a));
  const month = climate.months.indexOf(coldest);
  const dayHours = dayLengthHours(climate.latitude, midMonthDay(month));
  const peakSun =
    ((coldest.radiationMj * 1e6) / (dayHours * 3600)) * (Math.PI / 2);
  const loss = heatLoss({ ...defaultHeatLoss(ctx), screenClosed: false });
  const electric = Math.round((g.floorAreaM2 * 20) / 1000);
  return {
    floorAreaM2: g.floorAreaM2,
    lossCoefficientWK: Math.round(loss.lossCoefficientWPerK),
    screenSavingPct: SCREEN_SAVINGS[ctx.greenhouse.screen],
    nightSetC: crop.nightSetC,
    daySetC: crop.daySetC,
    outsideMinC: climate.designWinterC,
    outsideMaxC: climate.designWinterC + (coldest.tMaxC - coldest.tMinC),
    radiationWm2: Math.round(peakSun / 10) * 10,
    transmissionPct: COVERS[ctx.greenhouse.cover].transmissionPct,
    solarGainPct: 50,
    chpElectricKw: electric,
    chpThermalKw: Math.round(electric * 1.1),
    chpElectricPct: 42,
    chpStartHour: 6,
    chpEndHour: 17,
    bufferM3: Math.max(1, Math.round((g.floorAreaM2 / 10_000) * 60)),
    bufferDeltaK: 40,
    boilerEfficiencyPct: 92,
    co2NeedKgH: Math.round((g.floorAreaM2 * 3) / 1000),
    gasPrice: defaultFuelPrice('natural_gas', ctx.currency),
    powerPrice: defaultFuelPrice('heat_pump', ctx.currency),
  };
}

/**
 * Heat in the well water chilled on the peak day, from 40 °C to 15 °C,
 * against the design winter day's heat need.
 */
export function defaultHeatReuse(ctx: CalcContext): HeatReuseParams {
  return {
    waterM3Day: Math.round(cropWater(defaultCropWater(ctx)).peakM3Day),
    inC: 40,
    outC: 15,
    heatDemandKwhDay: energyHub(defaultEnergyHub(ctx)).demandKwh,
  };
}

/**
 * A year of the house as a business: the crop's yield, example prices in
 * the project's currency, heat from the year's heating at the gas price,
 * water at the RO plant's cost plus 30 % for chemicals and membranes, and
 * about 1,000 working days a hectare.
 */
export function defaultEconomics(ctx: CalcContext): EconomicsParams {
  const g = greenhouseGeometry(ctx.greenhouse);
  const prices = ECONOMICS_PRICES[ctx.currency];
  const gas = defaultFuelPrice('natural_gas', ctx.currency);
  return {
    areaHa: Math.round((g.floorAreaM2 / 10_000) * 100) / 100,
    yieldTHa: CROP_YIELD_T_HA[ctx.crop],
    pricePerKg: prices.pricePerKg,
    labourDaysHa: LABOUR_DAYS_HA,
    wagePerDay: prices.wagePerDay,
    heatMwhYear: Math.round(
      annualHeating(defaultAnnualHeating(ctx)).annualKwh / 1000,
    ),
    heatPricePerMwh: Math.round((gas / (GAS_KWH_PER_M3 * 0.9)) * 1000),
    waterM3Year: Math.round(cropWater(defaultCropWater(ctx)).annualM3),
    waterPricePerM3:
      Math.round(seawaterRo(defaultRo(ctx)).costPerM3 * 1.3 * 100) / 100,
    inputsPerM2: prices.inputsPerM2,
    otherPerM2: prices.otherPerM2,
    capexPerM2: prices.capexPerM2,
  };
}
