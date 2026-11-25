import { PIPES } from '../data/catalogue.data';
import type {
  CalcNote,
  HotWaterParams,
  HotWaterResult,
} from '../models/serra.models';
import { round, STEFAN_BOLTZMANN, WATER_KWH_PER_M3_K } from '../utils/physics';

/**
 * Heat given off by one metre of bare horizontal pipe: free convection
 * (h = 1.32 (ΔT/D)^0.25, the simplified laminar correlation for a cylinder
 * in air) plus radiation to surroundings at air temperature.
 */
export function pipeOutput(
  outerDiameterMm: number,
  emissivity: number,
  surfaceC: number,
  airC: number,
): { convection: number; radiation: number; wPerM: number } {
  const d = Math.max(0.005, outerDiameterMm / 1000);
  const dt = surfaceC - airC;
  if (dt <= 0) {
    return { convection: 0, radiation: 0, wPerM: 0 };
  }
  const convection = 1.32 * (dt / d) ** 0.25;
  const ts = surfaceC + 273.15;
  const ta = airC + 273.15;
  const radiation = (emissivity * STEFAN_BOLTZMANN * (ts ** 4 - ta ** 4)) / dt;
  return {
    convection,
    radiation,
    wPerM: Math.PI * d * (convection + radiation) * dt,
  };
}

/**
 * Hot-water heating: geothermal water, a boiler or a heat pump feeding
 * pipes laid in the house. Flow from Q = 1.163 × flow × ΔT; pipe length
 * from what a metre gives off at the mean water temperature (the pipe wall
 * is taken at the water's temperature).
 */
export function hotWaterHeating(p: HotWaterParams): HotWaterResult {
  const pipe = PIPES[p.pipe];
  const deltaWater = Math.max(0.5, p.supplyC - p.returnC);
  const q = Math.max(0, p.heatDemandKw);
  const flowM3h = q / (WATER_KWH_PER_M3_K * deltaWater);
  const meanWater = (p.supplyC + p.returnC) / 2;
  const out = pipeOutput(
    pipe.outerDiameterMm,
    pipe.emissivity,
    meanWater,
    p.airC,
  );
  const length = out.wPerM > 0 ? (q * 1000) / out.wPerM : 0;
  const loopLength = Math.max(10, p.loopLengthM);
  const loops = Math.max(1, Math.ceil(length / loopLength));
  const inner = pipe.innerDiameterMm / 1000;
  const loopFlowM3s = flowM3h / 3600 / loops;
  const velocity = loopFlowM3s / ((Math.PI * inner * inner) / 4);
  // Hydraulic power ρ g Q H over the pump's efficiency.
  const pumpKw =
    (1000 * 9.81 * (flowM3h / 3600) * Math.max(0, p.pumpHeadM)) /
    Math.max(0.1, p.pumpEfficiencyPct / 100) /
    1000;
  const annualWater =
    p.annualHeatKwh > 0
      ? p.annualHeatKwh / (WATER_KWH_PER_M3_K * deltaWater)
      : 0;

  const notes: CalcNote[] = [];
  if (out.wPerM === 0) {
    notes.push({ code: 'pipes.tooCold', severity: 'error' });
  } else {
    const perM2 = length / Math.max(1, p.floorAreaM2);
    if (perM2 > 2.5) {
      notes.push({
        code: 'pipes.tooMany',
        severity: 'warn',
        values: { m: round(perM2, 2) },
      });
    } else {
      notes.push({
        code: 'pipes.fits',
        severity: 'ok',
        values: { m: round(perM2, 2) },
      });
    }
  }
  if (deltaWater < 5) {
    notes.push({ code: 'pipes.smallDrop', severity: 'warn' });
  }
  if (velocity > 1.5) {
    notes.push({
      code: 'pipes.fast',
      severity: 'warn',
      values: { v: round(velocity, 2) },
    });
  } else if (velocity < 0.2 && q > 0) {
    notes.push({
      code: 'pipes.slow',
      severity: 'info',
      values: { v: round(velocity, 2) },
    });
  }
  if (p.supplyC <= 75 && p.pipe.startsWith('pe')) {
    notes.push({ code: 'pipes.peOk', severity: 'info' });
  } else if (p.supplyC > 75 && p.pipe.startsWith('pe')) {
    notes.push({ code: 'pipes.peHot', severity: 'error' });
  }

  return {
    deltaWaterK: round(deltaWater, 1),
    flowM3h: round(flowM3h, 1),
    flowLs: round(flowM3h / 3.6, 2),
    meanWaterC: round(meanWater, 1),
    pipeDeltaK: round(meanWater - p.airC, 1),
    convectionWm2K: round(out.convection, 2),
    radiationWm2K: round(out.radiation, 2),
    pipeOutputWPerM: round(out.wPerM, 1),
    pipeLengthM: round(length),
    metresPerM2: round(length / Math.max(1, p.floorAreaM2), 2),
    loops,
    loopVelocityMs: round(velocity, 2),
    pumpKw: round(pumpKw, 2),
    annualWaterM3: round(annualWater),
    notes,
  };
}
