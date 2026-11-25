import { climateById } from '../data/climates.data';
import type { CalcNote } from '../models/serra.models';
import { dayLengthHours, midMonthDay, round } from '../utils/physics';

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** Cells run this much warmer than the daytime air in the sun, K. */
export const PV_CELL_RISE_K = 20;

/**
 * What solar atlases give for a good fixed array in southern Tunisia and
 * the Sahara's edge, kWh per kWp a year: a range check for the model.
 */
export const PV_DESERT_YIELD = { low: 1500, high: 1900 } as const;

export interface SolarPvParams {
  climateId: string;
  /** The array, kW peak. */
  peakKw: number;
  /** A fixed tilt facing the equator catches more than flat, percent. */
  tiltGainPct: number;
  /** Inverter, cables and mismatch, percent. */
  systemLossPct: number;
  /** Dust on the modules between cleanings, percent. */
  soilingPct: number;
  /** Power lost per K of cell above 25 °C, percent (datasheet, ~0.3–0.45). */
  tempLossPctK: number;
  /** What the site draws while the sun is up (fans, pumps, RO), kW. */
  dayLoadKw: number;
  /** What it draws at night, kW. */
  nightLoadKw: number;
  /** Rows cover this share of the land (the rest is spacing), percent. */
  groundCoverPct: number;
  /** Module power per m² of module, W. */
  moduleWm2: number;
  /** Installed cost per kWp. */
  capexPerKwp: number;
  /** Operation, cleaning and insurance a year, percent of the cost. */
  omPctYear: number;
  /** Price of a kWh bought from the grid. */
  buyPrice: number;
  /** Price paid for a kWh sent to the grid (0 if none). */
  exportPrice: number;
  /** CO₂ of a kWh from the grid, kg. */
  gridCo2KgKwh: number;
  lifeYears: number;
}

export interface SolarMonth {
  month: number;
  /** Hours of daylight a day. */
  dayHours: number;
  pvKwh: number;
  demandKwh: number;
  /** Solar power used on site as it is made. */
  selfKwh: number;
  /** Output lost to heat, percent. */
  heatLossPct: number;
}

export interface SolarPvResult {
  months: SolarMonth[];
  yieldMwh: number;
  /** kWh a year per kWp. */
  specificKwhKwp: number;
  demandMwh: number;
  selfMwh: number;
  exportMwh: number;
  importMwh: number;
  /** Share of the solar power used on site, percent. */
  selfUsePct: number;
  /** Share of the site's electricity the sun covers, percent. */
  solarFractionPct: number;
  moduleM2: number;
  landHa: number;
  capex: number;
  /** Bills avoided and exports paid, less upkeep, a year. */
  netSavingsYear: number;
  /** Years to pay back (null: it never does). */
  paybackYears: number | null;
  /** Cost of a solar kWh over the array's life (undiscounted). */
  costPerKwh: number;
  /** Grid CO₂ avoided a year, t. */
  co2T: number;
  notes: CalcNote[];
}

/**
 * Solar power for the site, month by month from the climate. A kWp yields
 * H × (1 + tilt gain) × (1 − losses) × (1 − dust) × (1 − γ (T_cell − 25))
 * kWh a day, with H the horizontal radiation in kWh/m² and the cells
 * PV_CELL_RISE_K above the daytime air ((3 T_max + T_min) / 4). The sun only
 * meets the daytime load: used on site = min(solar, day load × daylight
 * hours), the rest is exported; the night load is always bought.
 */
export function solarPv(p: SolarPvParams): SolarPvResult {
  const climate = climateById(p.climateId);
  const peak = Math.max(0, p.peakKw);
  const derate =
    (1 + Math.max(0, p.tiltGainPct) / 100) *
    (1 - clampPct(p.systemLossPct) / 100) *
    (1 - clampPct(p.soilingPct) / 100);
  const gamma = Math.max(0, p.tempLossPctK) / 100;
  const dayLoad = Math.max(0, p.dayLoadKw);
  const nightLoad = Math.max(0, p.nightLoadKw);

  const months: SolarMonth[] = climate.months.map((m, month) => {
    const days = MONTH_DAYS[month];
    const sunKwhM2 = m.radiationMj / 3.6;
    const dayAir = (3 * m.tMaxC + m.tMinC) / 4;
    const heatLoss = Math.max(0, gamma * (dayAir + PV_CELL_RISE_K - 25));
    const pvKwh = peak * sunKwhM2 * days * derate * (1 - heatLoss);
    const dayHours = dayLengthHours(climate.latitude, midMonthDay(month));
    const dayKwh = dayLoad * dayHours * days;
    const nightKwh = nightLoad * (24 - dayHours) * days;
    return {
      month,
      dayHours: round(dayHours, 1),
      pvKwh: round(pvKwh),
      demandKwh: round(dayKwh + nightKwh),
      selfKwh: round(Math.min(pvKwh, dayKwh)),
      heatLossPct: round(heatLoss * 100, 1),
    };
  });

  const sum = (pick: (m: SolarMonth) => number) =>
    months.reduce((s, m) => s + pick(m), 0);
  const pv = sum((m) => m.pvKwh);
  const demand = sum((m) => m.demandKwh);
  const self = sum((m) => m.selfKwh);
  const exported = pv - self;
  const imported = demand - self;

  const moduleM2 = p.moduleWm2 > 0 ? (peak * 1000) / p.moduleWm2 : 0;
  const cover = clampPct(p.groundCoverPct) / 100;
  const landM2 = cover > 0 ? moduleM2 / cover : 0;
  const capex = peak * Math.max(0, p.capexPerKwp);
  const upkeep = (capex * Math.max(0, p.omPctYear)) / 100;
  const net =
    self * Math.max(0, p.buyPrice) +
    exported * Math.max(0, p.exportPrice) -
    upkeep;
  const life = Math.max(1, p.lifeYears);
  const payback = net > 0 && capex > 0 ? capex / net : null;
  const specific = peak > 0 ? pv / peak : 0;
  const selfUse = pv > 0 ? (self / pv) * 100 : 0;

  const notes: CalcNote[] = [];
  if (peak > 0) {
    const inRange =
      specific >= PV_DESERT_YIELD.low && specific <= PV_DESERT_YIELD.high;
    notes.push({
      code: inRange ? 'solar.range' : 'solar.outside',
      severity: inRange ? 'ok' : 'info',
      values: {
        kwh: round(specific),
        low: PV_DESERT_YIELD.low,
        high: PV_DESERT_YIELD.high,
      },
    });
    const hottest = months.reduce((a, b) =>
      b.heatLossPct > a.heatLossPct ? b : a,
    );
    if (hottest.heatLossPct >= 8) {
      notes.push({
        code: 'solar.heat',
        severity: 'info',
        values: { month: hottest.month, pct: hottest.heatLossPct },
      });
    }
    if (pv > 0 && selfUse < 70) {
      notes.push({
        code: 'solar.export',
        severity: p.exportPrice < p.buyPrice / 2 ? 'warn' : 'info',
        values: {
          pct: round(selfUse),
          mwh: round(exported / 1000, 1),
        },
      });
    }
    if (payback !== null) {
      notes.push({
        code: payback > life ? 'solar.noPayback' : 'solar.payback',
        severity: payback > life ? 'warn' : 'ok',
        values: { years: round(payback, 1), life },
      });
    } else if (capex > 0) {
      notes.push({ code: 'solar.never', severity: 'warn' });
    }
  }
  if (p.soilingPct > 8) {
    notes.push({
      code: 'solar.dust',
      severity: 'warn',
      values: { pct: round(p.soilingPct) },
    });
  }

  return {
    months,
    yieldMwh: round(pv / 1000, 1),
    specificKwhKwp: round(specific),
    demandMwh: round(demand / 1000, 1),
    selfMwh: round(self / 1000, 1),
    exportMwh: round(exported / 1000, 1),
    importMwh: round(imported / 1000, 1),
    selfUsePct: round(selfUse),
    solarFractionPct: round(demand > 0 ? (self / demand) * 100 : 0),
    moduleM2: round(moduleM2),
    landHa: round(landM2 / 10_000, 2),
    capex: round(capex),
    netSavingsYear: round(net),
    paybackYears: payback === null ? null : round(payback, 1),
    costPerKwh: pv > 0 ? round((capex + upkeep * life) / (pv * life), 3) : 0,
    co2T: round(((self + exported) * Math.max(0, p.gridCo2KgKwh)) / 1000, 1),
    notes,
  };
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}
