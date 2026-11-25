import type {
  Band,
  CropId,
  CropStage,
  LightCondition,
  StageTargets,
} from '../models/serra.models';
import { CROPS } from './catalogue.data';

/**
 * Setpoints, thresholds and advice rules live here as data, not in the
 * calculators, so they can be tuned per crop and region. Each value says
 * where it comes from; `typical` values are general practice to confirm
 * with a grower or a supplier.
 */

export type SourceId =
  | 'soussi2022'
  | 'shamshiri2018'
  | 'ishii'
  | 'rodriguezOrtega2019'
  | 'hydrotool'
  | 'vtCo2'
  | 'solarAtlas'
  | 'typical';

/** Citations are names and stay as written in every language. */
export const SOURCES: Record<SourceId, string> = {
  solarAtlas:
    'Global Solar Atlas (World Bank, Solargis), photovoltaic power potential',
  soussi2022:
    'Soussi et al. (2022), climate control and cooling of greenhouses in hot arid regions',
  shamshiri2018:
    'Shamshiri et al. (2018), optimal temperature, humidity and VPD for greenhouse tomato',
  ishii:
    'Ishii et al., fog cooling against pad-and-fan in an Arizona greenhouse',
  rodriguezOrtega2019:
    'Rodríguez-Ortega et al. (2019), tomato in soilless culture with saline water',
  hydrotool: 'Hydrotool, a decision support system for closed-loop fertigation',
  vtCo2: 'Virginia Tech extension SPES-817, CO₂ enrichment',
  typical: 'Typical engineering value; confirm with your grower or supplier',
};

export const STAGES: readonly CropStage[] = [
  'nursery',
  'vegetative',
  'flowering',
  'harvest',
];

const band = (min: number, max: number): Band => ({ min, max });

/**
 * Tomato. The harvest stage carries the published bands (Soussi 2022:
 * 23–27 °C days, 13–16 °C nights, 50–80 % RH, VPD 0.45–1.25 kPa with
 * 0.8–0.9 ideal, CO₂ 700–900 ppm); the earlier stages are the usual
 * adjustments for young plants (wetter air, a softer EC).
 */
const TOMATO: Record<CropStage, StageTargets> = {
  nursery: {
    dayC: band(22, 25),
    nightC: band(17, 19),
    rhPct: band(65, 85),
    vpdKpa: band(0.4, 0.8),
    vpdIdealKpa: band(0.5, 0.7),
    ecDsM: band(2, 2.5),
    co2Ppm: band(600, 800),
  },
  vegetative: {
    dayC: band(22, 26),
    nightC: band(15, 17),
    rhPct: band(60, 80),
    vpdKpa: band(0.45, 1),
    vpdIdealKpa: band(0.7, 0.9),
    ecDsM: band(2.5, 3),
    co2Ppm: band(700, 900),
  },
  flowering: {
    dayC: band(23, 27),
    nightC: band(15, 17),
    rhPct: band(60, 75),
    vpdKpa: band(0.5, 1.1),
    vpdIdealKpa: band(0.8, 0.9),
    ecDsM: band(2.7, 3.2),
    co2Ppm: band(700, 900),
  },
  harvest: {
    dayC: band(23, 27),
    nightC: band(13, 16),
    rhPct: band(50, 80),
    vpdKpa: band(0.45, 1.25),
    vpdIdealKpa: band(0.8, 0.9),
    ecDsM: band(2.7, 3.5),
    co2Ppm: band(700, 900),
  },
};

/** Where each crop's bands come from. */
export function targetSource(crop: CropId, stage: CropStage): SourceId {
  return crop === 'tomato' && stage === 'harvest' ? 'soussi2022' : 'typical';
}

/**
 * The climate a crop wants at a stage. Crops other than tomato get bands
 * built from their set points in the catalogue.
 */
export function stageTargets(crop: CropId, stage: CropStage): StageTargets {
  if (crop === 'tomato') return TOMATO[stage];
  const profile = CROPS[crop];
  const young = stage === 'nursery';
  return {
    dayC: band(profile.daySetC, profile.ventilateAboveC + 1),
    nightC: band(profile.nightSetC - 2, profile.nightSetC + 1),
    rhPct: young ? band(65, 85) : band(60, 80),
    vpdKpa: young ? band(0.4, 0.9) : band(0.45, 1.2),
    vpdIdealKpa: young ? band(0.5, 0.7) : band(0.7, 1),
    ecDsM: young ? band(1.2, 1.8) : band(1.5, 2.5),
    co2Ppm: band(600, 900),
  };
}

/**
 * VPD bands shift with the light: with less sun the crop transpires less
 * and wants damper air, at night above about 0.3 kPa to keep botrytis off.
 */
export function vpdBandsFor(
  targets: StageTargets,
  light: LightCondition,
): { band: Band; ideal: Band } {
  switch (light) {
    case 'sun':
      return { band: targets.vpdKpa, ideal: targets.vpdIdealKpa };
    case 'cloud':
      return {
        band: band(targets.vpdKpa.min, targets.vpdKpa.max - 0.15),
        ideal: band(
          targets.vpdIdealKpa.min - 0.1,
          targets.vpdIdealKpa.max - 0.1,
        ),
      };
    case 'night':
      return { band: band(0.3, 0.9), ideal: band(0.4, 0.7) };
  }
}

/** VPD thresholds that mean trouble whatever the stage (Shamshiri 2018). */
export const VPD_LIMITS = {
  /** Below this: disease and soft growth. */
  disease: 0.3,
  /** Above this: the crop wilts. */
  wilting: 1.5,
  /** 3–5 kPa: arid air, poor growth. */
  arid: 3,
} as const;

/**
 * The cooling advisor's rules. The published rule of thumb is "above about
 * 40 °C outside and above about 30 % vent area": the defaults sit a little
 * lower so a house that needs more than a quarter of its floor in vents on
 * a 38 °C afternoon is steered to shade and evaporative cooling.
 */
export const COOLING_RULES = {
  /** Outside afternoons at least this hot need evaporative cooling, °C. */
  hotOutsideC: 38,
  /** Roof vents rarely open more than this share of the floor, percent. */
  ventLimitPct: 25,
  /** Natural vents give 15–30 % of the floor (Soussi 2022). */
  ventRangePct: band(15, 30),
  /** Shade the advisor adds; 50 % cuts air temperature about 10 %. */
  shadePct: 50,
  /** Pad-to-fan runs longer than this run hot at the far end, m. */
  padMaxLengthM: 50,
  /** Pads cool little in air wetter than this, percent. */
  padMaxOutsideRhPct: 60,
  /** Vents trimmed while fogging, percent of the floor. */
  fogVentPct: 10,
  /** Keep fogged air under this humidity (65–75 % saved about 21 % water). */
  fogMaxRhPct: 75,
  /** Fan-and-pad airflow, m³/h per m² of floor (Soussi 2022). */
  padAirflowM3hM2: band(120, 150),
  /** Floor served by 1 m² of pad (Soussi 2022). */
  padFloorPerM2: band(20, 30),
  /** Water while running, g/m² per minute (Ishii, Arizona test). */
  fogWaterGm2Min: 24,
  padWaterGm2Min: 41,
} as const;
