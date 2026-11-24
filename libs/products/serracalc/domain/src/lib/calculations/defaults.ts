import {
  COVERS,
  CROPS,
  DEFAULT_GREENHOUSE,
  defaultFuelPrice,
  FUELS,
  SCREEN_SAVINGS,
} from '../data/catalogue.data';
import { climateById, DEFAULT_CLIMATE_ID } from '../data/climates.data';
import type {
  AnnualHeatingParams,
  CropId,
  CropWaterParams,
  Currency,
  EnvelopeParams,
  GreenhouseSpec,
  HeatLossParams,
  HotWaterParams,
  PadFanParams,
  RainwaterParams,
  SolarLoadParams,
  VentilationParams,
} from '../models/serra.models';
import { greenhouseGeometry } from './geometry';

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
