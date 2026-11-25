import type { CalcNote, SavedCalculation } from '../models/serra.models';
import { co2Enrichment } from './co2';
import { padAndFan, ventilation } from './cooling';
import { annualHeating, heatLoss } from './heating';
import { hotWaterHeating } from './hot-water';
import { nightHumidity } from './humidity';
import { supplementalLight } from './light';
import { cropWater, rainwater } from './water';

/** The figures a report shows for each kind of saved result. */
export type FigureId =
  | 'designKw'
  | 'heatWm2'
  | 'annualHeat'
  | 'heatPerM2Year'
  | 'fuelCost'
  | 'heatCo2'
  | 'waterFlow'
  | 'pipeLength'
  | 'loops'
  | 'pumpPower'
  | 'airFlow'
  | 'airChanges'
  | 'ventArea'
  | 'fans'
  | 'padOutlet'
  | 'padArea'
  | 'padWater'
  | 'peakWater'
  | 'waterYear'
  | 'drippers'
  | 'sections'
  | 'rainCoverage'
  | 'rainHarvest'
  | 'suggestedBasin'
  | 'lamps'
  | 'lampEnergy'
  | 'lampCost'
  | 'maxShade'
  | 'co2Supply'
  | 'co2Year'
  | 'co2Cost'
  | 'co2Used'
  | 'vpd'
  | 'dewPoint'
  | 'outsideAir'
  | 'dryingHeat';

/**
 * One number of a result, language-neutral: the feature labels it and
 * formats it. `unit: 'money'` is in the project's currency; `value: null`
 * means "not possible" (outside air wetter than inside, say).
 */
export interface Figure {
  id: FigureId;
  value: number | null;
  unit: string;
  digits: number;
}

export interface SavedSummary {
  figures: Figure[];
  notes: CalcNote[];
}

function fig(id: FigureId, value: number | null, unit: string, digits = 0) {
  return { id, value, unit, digits };
}

/**
 * Runs a saved result again from its inputs (results are never stored, so
 * the current rules apply) and picks the figures a report needs.
 */
export function summarizeSaved(saved: SavedCalculation): SavedSummary {
  switch (saved.kind) {
    case 'heatPeak': {
      const r = heatLoss(saved.inputs);
      return {
        figures: [
          fig('designKw', r.designKw, 'kW', 1),
          fig('heatWm2', r.wPerM2, 'W/m²'),
        ],
        notes: r.notes,
      };
    }
    case 'heatYear': {
      const r = annualHeating(saved.inputs);
      return {
        figures: [
          fig('annualHeat', r.annualKwh / 1000, 'MWh'),
          fig('heatPerM2Year', r.kwhPerM2, 'kWh/m²'),
          fig('fuelCost', r.cost, 'money'),
          fig('heatCo2', r.co2Kg / 1000, 't', 1),
        ],
        notes: r.notes,
      };
    }
    case 'hotWater': {
      const r = hotWaterHeating(saved.inputs);
      return {
        figures: [
          fig('waterFlow', r.flowM3h, 'm³/h', 1),
          fig('pipeLength', r.pipeLengthM, 'm'),
          fig('loops', r.loops, ''),
          fig('pumpPower', r.pumpKw, 'kW', 1),
        ],
        notes: r.notes,
      };
    }
    case 'ventilation': {
      const r = ventilation(saved.inputs);
      return {
        figures: [
          fig('airFlow', r.flowM3h, 'm³/h'),
          fig('airChanges', r.airChangesPerHour, '/h'),
          fig('ventArea', r.ventAreaM2, 'm²'),
          fig('fans', r.fans, ''),
        ],
        notes: r.notes,
      };
    }
    case 'padFan': {
      const r = padAndFan(saved.inputs);
      return {
        figures: [
          fig('padOutlet', r.padOutletC, '°C', 1),
          fig('fans', r.fans, ''),
          fig('padArea', r.padAreaM2, 'm²', 1),
          fig('padWater', r.waterM3PerDay, 'm³/d', 1),
        ],
        notes: r.notes,
      };
    }
    case 'cropWater': {
      const r = cropWater(saved.inputs);
      return {
        figures: [
          fig('peakWater', r.peakGrossLm2, 'L/m²·d', 1),
          fig('waterYear', r.annualM3, 'm³'),
          fig('drippers', r.emitters, ''),
          fig('sections', r.sections, ''),
        ],
        notes: r.notes,
      };
    }
    case 'rainwater': {
      const r = rainwater(saved.inputs);
      return {
        figures: [
          fig('rainCoverage', r.coveragePct, '%'),
          fig('rainHarvest', r.annualHarvestM3, 'm³'),
          fig('suggestedBasin', r.suggestedBasinM3, 'm³'),
        ],
        notes: r.notes,
      };
    }
    case 'light': {
      const r = supplementalLight(saved.inputs);
      return {
        figures: [
          fig('lamps', r.fixtures, ''),
          fig('lampEnergy', r.annualKwh / 1000, 'MWh'),
          fig('lampCost', r.cost, 'money'),
          fig('maxShade', r.maxShadePct, '%'),
        ],
        notes: r.notes,
      };
    }
    case 'co2': {
      const r = co2Enrichment(saved.inputs);
      return {
        figures: [
          fig('co2Supply', r.supplyKgH, 'kg/h', 1),
          fig('co2Year', r.annualT, 't', 1),
          fig('co2Cost', r.annualCost, 'money'),
          fig('co2Used', r.usedPct, '%'),
        ],
        notes: r.notes,
      };
    }
    case 'humidity': {
      const r = nightHumidity(saved.inputs);
      return {
        figures: [
          fig('vpd', r.vpdKpa, 'kPa', 2),
          fig('dewPoint', r.dewPointC, '°C', 1),
          fig('outsideAir', r.airM3h, 'm³/h'),
          fig('dryingHeat', r.heatKw, 'kW', 1),
        ],
        notes: r.notes,
      };
    }
  }
}
