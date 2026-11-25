import type {
  Currency,
  FigureId,
  SavedCalculation,
} from '@ah/products/serracalc/domain';
import { summarizeSaved } from '@ah/products/serracalc/domain';
import type { SerraCopy } from '../../i18n/copy.en';
import type { SerraI18n } from '../../i18n/serra-i18n';

/**
 * Each figure takes the label its calculator shows, so the report reads
 * the same words as the screens.
 */
const LABELS: Record<FigureId, (t: SerraCopy) => string> = {
  designKw: (t) => t.heating.designKw,
  heatWm2: (t) => t.heating.perM2,
  annualHeat: (t) => t.heating.annual,
  heatPerM2Year: (t) => t.heating.perM2Year,
  fuelCost: (t) => t.heating.cost,
  heatCo2: (t) => t.heating.co2,
  waterFlow: (t) => t.heating.flow,
  pipeLength: (t) => t.heating.pipeLength,
  loops: (t) => t.heating.loops,
  pumpPower: (t) => t.heating.pump,
  airFlow: (t) => t.cooling.flow,
  airChanges: (t) => t.cooling.ach,
  ventArea: (t) => t.cooling.vents,
  fans: (t) => t.cooling.fans,
  padOutlet: (t) => t.cooling.padOutlet,
  padArea: (t) => t.cooling.padArea,
  padWater: (t) => t.cooling.waterDay,
  peakWater: (t) => t.water.peak,
  waterYear: (t) => t.water.year,
  drippers: (t) => t.water.emitters,
  sections: (t) => t.water.sections,
  rainCoverage: (t) => t.water.coverage,
  rainHarvest: (t) => t.water.harvest,
  suggestedBasin: (t) => t.water.suggested,
  lamps: (t) => t.air.fixtures,
  lampEnergy: (t) => t.air.energy,
  lampCost: (t) => t.air.cost,
  maxShade: (t) => t.air.shade,
  co2Supply: (t) => t.air.supply,
  co2Year: (t) => t.air.year,
  co2Cost: (t) => t.air.cost,
  co2Used: (t) => t.air.used,
  vpd: (t) => t.air.vpd,
  dewPoint: (t) => t.air.dew,
  outsideAir: (t) => t.air.air,
  dryingHeat: (t) => t.air.heat,
  headroom: (t) => t.vpd.headroom,
  fogInside: (t) => t.cooling.fogInside,
  fogRh: (t) => t.cooling.fogRh,
  fogWater: (t) => t.cooling.waterDay,
  nozzles: (t) => t.cooling.nozzles,
  firstHarvest: (t) => t.calendar.firstHarvest,
  harvestWeeks: (t) => t.calendar.harvestWeeks,
  heatingWeeks: (t) => t.calendar.heatingWeeks,
  fogWeeks: (t) => t.calendar.fogWeeks,
  roFeed: (t) => t.supply.feed,
  roBrine: (t) => t.supply.brine,
  roEnergy: (t) => t.supply.energy,
  roCoverage: (t) => t.supply.coverage,
  drainEc: (t) => t.supply.drainEc,
  waterSaved: (t) => t.supply.waterSaved,
  flushDay: (t) => t.supply.flushIn,
  yieldLoss: (t) => t.supply.yieldLoss,
  chpShare: (t) => t.energy.chpShare,
  boilerHeat: (t) => t.energy.fromBoiler,
  gasDay: (t) => t.energy.gas,
  powerDay: (t) => t.energy.power,
  reuseHeat: (t) => t.energy.inWater,
  reuseCover: (t) => t.energy.covers,
  coolKwhM2: (t) => t.energy.coolYear,
  coolMwh: (t) => t.energy.coolSite,
  coolCost: (t) => t.energy.coolCost,
  coolBenchmark: (t) => t.energy.coolOfBenchmark,
  revenue: (t) => t.site.revenue,
  costPerKg: (t) => t.site.costPerKg,
  margin: (t) => t.site.margin,
  payback: (t) => t.site.payback,
};

export interface ReportFigure {
  readonly label: string;
  readonly value: string;
}

export interface ReportResult {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly savedAt: string;
  readonly figures: readonly ReportFigure[];
  readonly notes: readonly string[];
}

/** A saved result worked out again and written in the reader's words. */
export function reportResult(
  saved: SavedCalculation,
  currency: Currency,
  i18n: SerraI18n,
): ReportResult {
  const t = i18n.t();
  const summary = summarizeSaved(saved);
  return {
    id: saved.id,
    label: saved.label,
    kind: t.kinds[saved.kind],
    savedAt: i18n.date(saved.savedAt),
    figures: summary.figures.map((figure) => ({
      label: LABELS[figure.id](t),
      value:
        figure.value === null
          ? t.common.none
          : figure.unit === 'money'
            ? i18n.money(figure.value, currency)
            : `${i18n.num(figure.value, figure.digits)}${figure.unit ? ` ${figure.unit}` : ''}`,
    })),
    notes: summary.notes.map((note) => i18n.note(note)),
  };
}
