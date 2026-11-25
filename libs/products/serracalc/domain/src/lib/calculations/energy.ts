import { climateById } from '../data/climates.data';
import type { CalcNote } from '../models/serra.models';
import { round, WATER_KWH_PER_M3_K } from '../utils/physics';
import { WEEKS_PER_YEAR, wrapWeek } from '../utils/weeks';

/** Heat in a m³ of natural gas (lower heating value), kWh. */
export const GAS_KWH_PER_M3 = 9.77;
/** CO₂ from burning a m³ of natural gas, kg. */
export const CO2_KG_PER_M3_GAS = 1.96;

export interface EnergyHubParams {
  floorAreaM2: number;
  /** The house's heat loss per K: cover, leaks and footing, W/K. */
  lossCoefficientWK: number;
  /** Night saving of a closed screen, percent. */
  screenSavingPct: number;
  nightSetC: number;
  daySetC: number;
  /** The design winter day outside: night low and afternoon high, °C. */
  outsideMinC: number;
  outsideMaxC: number;
  /** Winter noon sun on the horizontal, W/m². */
  radiationWm2: number;
  transmissionPct: number;
  /** Share of the sun inside that warms the air, percent. */
  solarGainPct: number;
  chpElectricKw: number;
  chpThermalKw: number;
  /** CHP electrical efficiency, percent. */
  chpElectricPct: number;
  /** CHP runs from this hour to the next, 0–24. */
  chpStartHour: number;
  chpEndHour: number;
  /** Hot-water buffer, m³, and its usable temperature span, K. */
  bufferM3: number;
  bufferDeltaK: number;
  boilerEfficiencyPct: number;
  /** What the crop takes up while the CHP runs, kg of CO₂ an hour. */
  co2NeedKgH: number;
  /** Gas, per m³; electricity sold, per kWh. */
  gasPrice: number;
  powerPrice: number;
}

export interface EnergyHour {
  hour: number;
  outsideC: number;
  demandKw: number;
  chpKw: number;
  fromBufferKw: number;
  toBufferKw: number;
  boilerKw: number;
  dumpKw: number;
  /** Heat in the buffer at the end of the hour, kWh. */
  bufferKwh: number;
}

export interface EnergyHubResult {
  hours: EnergyHour[];
  bufferCapacityKwh: number;
  demandKwh: number;
  chpHeatKwh: number;
  /** CHP heat that reached the house, directly or through the buffer. */
  chpUsedKwh: number;
  boilerKwh: number;
  dumpedKwh: number;
  powerKwh: number;
  gasM3: number;
  co2Kg: number;
  co2NeedKg: number;
  /** Share of the day's heat the CHP covers, percent. */
  chpSharePct: number;
  gasCost: number;
  powerIncome: number;
  netCost: number;
  peakDemandKw: number;
  notes: CalcNote[];
}

function inRun(hour: number, start: number, end: number): boolean {
  return start <= end
    ? hour >= start && hour < end
    : hour >= start || hour < end;
}

/**
 * A design winter day, hour by hour. Outside follows a cosine from the
 * night low (3 am) to the afternoon high (3 pm); the house needs
 * H·(T_set − T_out) − sun, less the screen's saving at night. The CHP
 * runs its hours at full output (that is when its CO₂ feeds the crop with
 * the vents shut); its heat goes to the house, the surplus to the buffer
 * (1.163 kWh per m³·K) and what the buffer can't take is dumped; the
 * buffer covers the night, the boiler the rest. Two days are run so the
 * buffer starts the reported day as it ends it.
 */
export function energyHub(p: EnergyHubParams): EnergyHubResult {
  const capacity =
    WATER_KWH_PER_M3_K * Math.max(0, p.bufferM3) * Math.max(0, p.bufferDeltaK);
  const mean = (p.outsideMinC + p.outsideMaxC) / 2;
  const amp = (p.outsideMaxC - p.outsideMinC) / 2;
  const tau = Math.min(1, Math.max(0, p.transmissionPct / 100));
  const gain = Math.min(1, Math.max(0, p.solarGainPct / 100));
  const screen = Math.min(0.9, Math.max(0, p.screenSavingPct / 100));
  const chpHeat = Math.max(0, p.chpThermalKw);
  const boilerEff = Math.max(0.3, p.boilerEfficiencyPct / 100);
  const chpGasM3H =
    p.chpElectricKw > 0
      ? p.chpElectricKw / Math.max(0.2, p.chpElectricPct / 100) / GAS_KWH_PER_M3
      : 0;

  let buffer = capacity / 2;
  let hours: EnergyHour[] = [];
  for (let day = 0; day < 2; day++) {
    hours = [];
    for (let hour = 0; hour < 24; hour++) {
      const outside = mean + amp * Math.cos((2 * Math.PI * (hour - 15)) / 24);
      const daylight = hour >= 7 && hour < 17;
      const set = daylight ? p.daySetC : p.nightSetC;
      const sun = daylight
        ? Math.max(0, p.radiationWm2) *
          Math.sin((Math.PI * (hour + 0.5 - 7)) / 10) *
          tau *
          gain *
          p.floorAreaM2
        : 0;
      const h = daylight
        ? p.lossCoefficientWK
        : p.lossCoefficientWK * (1 - screen);
      const demand = Math.max(0, h * (set - outside) - sun) / 1000;
      const chp = inRun(hour, p.chpStartHour, p.chpEndHour) ? chpHeat : 0;
      let toBuffer = 0;
      let fromBuffer = 0;
      let dump = 0;
      let boiler = 0;
      if (chp >= demand) {
        toBuffer = Math.min(chp - demand, capacity - buffer);
        dump = chp - demand - toBuffer;
        buffer += toBuffer;
      } else {
        fromBuffer = Math.min(demand - chp, buffer);
        buffer -= fromBuffer;
        boiler = demand - chp - fromBuffer;
      }
      hours.push({
        hour,
        outsideC: round(outside, 1),
        demandKw: round(demand),
        chpKw: round(Math.min(chp, demand)),
        fromBufferKw: round(fromBuffer),
        toBufferKw: round(toBuffer),
        boilerKw: round(boiler),
        dumpKw: round(dump),
        bufferKwh: round(buffer),
      });
    }
  }

  const total = (key: keyof EnergyHour) =>
    hours.reduce((sum, h) => sum + h[key], 0);
  const demandKwh = total('demandKw');
  const chpRunHours = hours.filter((h) =>
    inRun(h.hour, p.chpStartHour, p.chpEndHour),
  ).length;
  const chpHeatKwh = chpHeat * chpRunHours;
  const chpUsed = total('chpKw') + total('fromBufferKw');
  const boilerKwh = total('boilerKw');
  const dumpedKwh = total('dumpKw');
  const powerKwh = Math.max(0, p.chpElectricKw) * chpRunHours;
  const gasM3 =
    chpGasM3H * chpRunHours + boilerKwh / boilerEff / GAS_KWH_PER_M3;
  const co2Produced = chpGasM3H * chpRunHours * CO2_KG_PER_M3_GAS;
  const co2Need = Math.max(0, p.co2NeedKgH) * chpRunHours;
  const gasCost = gasM3 * Math.max(0, p.gasPrice);
  const powerIncome = powerKwh * Math.max(0, p.powerPrice);
  const share = demandKwh > 0 ? (chpUsed / demandKwh) * 100 : 0;

  const notes: CalcNote[] = [];
  notes.push({
    code: 'energy.share',
    severity: share >= 60 ? 'ok' : 'info',
    values: { pct: round(share), boiler: round(boilerKwh / 1000, 1) },
  });
  if (dumpedKwh > 0.05 * chpHeatKwh && chpHeatKwh > 0) {
    notes.push({
      code: 'energy.dump',
      severity: 'warn',
      values: { mwh: round(dumpedKwh / 1000, 1) },
    });
  }
  if (capacity > 0) {
    notes.push({
      code: 'energy.buffer',
      severity: 'info',
      values: { mwh: round(capacity / 1000, 1) },
    });
  }
  if (co2Need > 0) {
    notes.push({
      code: co2Produced >= co2Need ? 'energy.co2Enough' : 'energy.co2Short',
      severity: co2Produced >= co2Need ? 'ok' : 'warn',
      values: { kg: round(co2Produced), need: round(co2Need) },
    });
  }
  notes.push({ code: 'energy.ventsShut', severity: 'info' });

  return {
    hours,
    bufferCapacityKwh: round(capacity),
    demandKwh: round(demandKwh),
    chpHeatKwh: round(chpHeatKwh),
    chpUsedKwh: round(chpUsed),
    boilerKwh: round(boilerKwh),
    dumpedKwh: round(dumpedKwh),
    powerKwh: round(powerKwh),
    gasM3: round(gasM3),
    co2Kg: round(Math.min(co2Produced, co2Need > 0 ? co2Need : co2Produced)),
    co2NeedKg: round(co2Need),
    chpSharePct: round(share),
    gasCost: round(gasCost),
    powerIncome: round(powerIncome),
    netCost: round(gasCost - powerIncome),
    peakDemandKw: round(Math.max(...hours.map((h) => h.demandKw))),
    notes,
  };
}

export interface HeatReuseParams {
  /** Well water chilled for cooling or irrigation, m³ a day. */
  waterM3Day: number;
  inC: number;
  outC: number;
  /** The house's heat need that day, kWh (0 to skip the share). */
  heatDemandKwhDay: number;
}

export interface HeatReuseResult {
  kwhPerM3: number;
  kwhDay: number;
  /** Share of the day's heat need it could cover, percent. */
  coverPct: number;
  notes: CalcNote[];
}

/** Heat in chilled water: Q = 1.163 × V × ΔT (kWh, m³, K). */
export function heatReuse(p: HeatReuseParams): HeatReuseResult {
  const dT = Math.max(0, p.inC - p.outC);
  const perM3 = WATER_KWH_PER_M3_K * dT;
  const kwh = perM3 * Math.max(0, p.waterM3Day);
  const cover =
    p.heatDemandKwhDay > 0
      ? Math.min(100, (kwh / p.heatDemandKwhDay) * 100)
      : 0;
  const notes: CalcNote[] = [
    {
      code: 'reuse.heat',
      severity: 'info',
      values: { kwh: round(perM3, 1), mwh: round(kwh / 1000, 2) },
    },
  ];
  if (p.heatDemandKwhDay > 0) {
    notes.push({
      code: 'reuse.cover',
      severity: cover >= 25 ? 'ok' : 'info',
      values: { pct: round(cover) },
    });
  }
  notes.push({ code: 'reuse.heatPump', severity: 'info' });
  return {
    kwhPerM3: round(perM3, 1),
    kwhDay: round(kwh),
    coverPct: round(cover),
    notes,
  };
}

/**
 * Cooling electricity a Mediterranean house uses in a year: about
 * 10 kWh/m² (100,000 kWh/ha), a range check for the yearly figure.
 */
export const COOLING_BENCHMARK_KWH_M2 = 10;

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export interface CoolingYearParams {
  floorAreaM2: number;
  climateId: string;
  /** Fans and pads start when it is hotter than this outside, °C. */
  coolFromC: number;
  /** Fans reach full airflow this many K above the start. */
  fullAtK: number;
  /** Full airflow, m³/h per m² of floor (fan and pad: 120–150). */
  airflowM3hM2: number;
  /** Fan power per m³/h moved through the pads, W. */
  fanWPerM3h: number;
  /** Pad or fog pumps while cooling, W per m² of floor. */
  pumpWm2: number;
  /** The house stands empty from this week, for this many weeks. */
  emptyFromWeek: number;
  emptyWeeks: number;
  electricityPrice: number;
  /** CO₂ of a kWh from the grid, kg. */
  gridCo2KgKwh: number;
}

export interface CoolingMonth {
  month: number;
  /** Hours the fans run in the month. */
  hours: number;
  kwhM2: number;
}

export interface CoolingYearResult {
  months: CoolingMonth[];
  hoursYear: number;
  /** Every fan and pump at full speed, kW. */
  peakKw: number;
  kwhM2Year: number;
  mwhYear: number;
  cost: number;
  co2T: number;
  /** The year against the ~10 kWh/m² benchmark, percent. */
  benchmarkPct: number;
  notes: CalcNote[];
}

/**
 * A year of fan-and-pad cooling, hour by hour through each month's mean day
 * (outside T = mean + amplitude × cos(2π (h − 15) / 24), as in the energy
 * hub). Above the start the fans move a share of the full airflow that
 * grows with the heat, f = min(1, (T − T_start) / ΔT_full); power is
 * Q × f × fan W per m³/h plus the pumps. Weeks with the house empty count
 * nothing.
 */
export function coolingYear(p: CoolingYearParams): CoolingYearResult {
  const climate = climateById(p.climateId);
  const area = Math.max(0, p.floorAreaM2);
  const fullK = Math.max(0.5, p.fullAtK);
  const fanWm2 = Math.max(0, p.airflowM3hM2) * Math.max(0, p.fanWPerM3h);
  const pumpWm2 = Math.max(0, p.pumpWm2);

  // Days of each month the house has a crop to cool.
  const cropped = MONTH_DAYS.map(() => 0);
  const emptyWeeks = Math.max(
    0,
    Math.min(WEEKS_PER_YEAR, Math.round(p.emptyWeeks)),
  );
  const emptyFrom = wrapWeek(p.emptyFromWeek);
  let dayOfYear = 0;
  MONTH_DAYS.forEach((days, month) => {
    for (let d = 0; d < days; d++, dayOfYear++) {
      const week = Math.min(WEEKS_PER_YEAR, Math.floor(dayOfYear / 7) + 1);
      const sinceEmpty = (week - emptyFrom + WEEKS_PER_YEAR) % WEEKS_PER_YEAR;
      if (sinceEmpty >= emptyWeeks) cropped[month]++;
    }
  });

  const months: CoolingMonth[] = climate.months.map((m, month) => {
    const mean = (m.tMinC + m.tMaxC) / 2;
    const amp = (m.tMaxC - m.tMinC) / 2;
    let hours = 0;
    let wh = 0;
    for (let hour = 0; hour < 24; hour++) {
      const outside =
        mean + amp * Math.cos((2 * Math.PI * (hour + 0.5 - 15)) / 24);
      if (outside <= p.coolFromC) continue;
      const share = Math.min(1, (outside - p.coolFromC) / fullK);
      hours++;
      wh += fanWm2 * share + pumpWm2;
    }
    const days = cropped[month];
    return {
      month,
      hours: hours * days,
      kwhM2: round((wh * days) / 1000, 2),
    };
  });

  const kwhM2 = months.reduce((s, m) => s + m.kwhM2, 0);
  const kwh = kwhM2 * area;
  const benchmarkPct = (kwhM2 / COOLING_BENCHMARK_KWH_M2) * 100;

  const notes: CalcNote[] = [];
  notes.push({
    code:
      kwhM2 > COOLING_BENCHMARK_KWH_M2 * 1.5
        ? 'coolYear.high'
        : kwhM2 < COOLING_BENCHMARK_KWH_M2 * 0.5
          ? 'coolYear.low'
          : 'coolYear.range',
    severity: kwhM2 > COOLING_BENCHMARK_KWH_M2 * 1.5 ? 'warn' : 'ok',
    values: { kwh: round(kwhM2, 1), pct: round(benchmarkPct) },
  });
  if (p.fanWPerM3h > 0.05) {
    notes.push({
      code: 'coolYear.fans',
      severity: 'warn',
      values: { w: round(p.fanWPerM3h, 3) },
    });
  }
  if (p.airflowM3hM2 > 0 && (p.airflowM3hM2 < 120 || p.airflowM3hM2 > 150)) {
    notes.push({
      code: 'coolYear.airflow',
      severity: 'info',
      values: { q: round(p.airflowM3hM2) },
    });
  }
  const hottest = months.reduce((a, b) => (b.kwhM2 > a.kwhM2 ? b : a));
  if (hottest.kwhM2 > 0) {
    notes.push({
      code: 'coolYear.peakMonth',
      severity: 'info',
      values: {
        month: hottest.month,
        pct: round(kwhM2 > 0 ? (hottest.kwhM2 / kwhM2) * 100 : 0),
      },
    });
  }

  return {
    months,
    hoursYear: months.reduce((s, m) => s + m.hours, 0),
    peakKw: round(((fanWm2 + pumpWm2) * area) / 1000),
    kwhM2Year: round(kwhM2, 1),
    mwhYear: round(kwh / 1000, 1),
    cost: round(kwh * Math.max(0, p.electricityPrice)),
    co2T: round((kwh * Math.max(0, p.gridCo2KgKwh)) / 1000, 1),
    benchmarkPct: round(benchmarkPct),
    notes,
  };
}
