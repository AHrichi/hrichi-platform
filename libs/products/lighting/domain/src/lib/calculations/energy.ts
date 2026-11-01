import type {
  CalcNote,
  EnergyParams,
  EnergyResult,
} from '../models/lighting.models';

const DAYS = 365;

/**
 * A year of street lighting, LEDs against the lamps they replace: energy,
 * cost at the tariff, CO₂ from the grid's emission factor, and how many
 * years the retrofit takes to pay for itself out of the savings.
 */
export function calculateEnergy(params: EnergyParams): EnergyResult {
  const n = Math.max(0, params.luminaires);
  const hoursPerYear = Math.max(0, params.hoursPerNight) * DAYS;
  const dimming = Math.min(0.9, Math.max(0, params.dimmingSavingPct / 100));

  // Old lamps burn at full power all night; LEDs dim in the quiet hours.
  const oldKwh = (n * params.oldWatts * hoursPerYear) / 1000;
  const ledKwh = (n * params.ledWatts * hoursPerYear * (1 - dimming)) / 1000;
  const savedKwh = oldKwh - ledKwh;
  const savedCost = savedKwh * params.tariffPerKwh;
  const investment = n * params.retrofitCostPerLuminaire;
  const paybackYears = savedCost > 0 ? investment / savedCost : null;

  const round = (v: number, d = 0) => Math.round(v * 10 ** d) / 10 ** d;
  const notes: CalcNote[] = [];
  if (savedKwh <= 0) {
    notes.push({ code: 'energy.noSaving', severity: 'error' });
  } else {
    notes.push({
      code: 'energy.saving',
      severity: 'ok',
      values: { pct: round((savedKwh / oldKwh) * 100) },
    });
    if (paybackYears !== null && paybackYears <= 5) {
      notes.push({
        code: 'energy.quickPayback',
        severity: 'ok',
        values: { years: round(paybackYears, 1) },
      });
    } else if (paybackYears !== null && paybackYears > 10) {
      notes.push({
        code: 'energy.slowPayback',
        severity: 'warn',
        values: { years: round(paybackYears, 1) },
      });
    }
  }
  if (dimming === 0) {
    notes.push({ code: 'energy.tryDimming', severity: 'info' });
  }

  return {
    hoursPerYear: round(hoursPerYear),
    oldKwhPerYear: round(oldKwh),
    ledKwhPerYear: round(ledKwh),
    savedKwhPerYear: round(savedKwh),
    oldCostPerYear: round(oldKwh * params.tariffPerKwh),
    ledCostPerYear: round(ledKwh * params.tariffPerKwh),
    savedCostPerYear: round(savedCost),
    co2SavedKgPerYear: round(savedKwh * params.co2KgPerKwh),
    investment: round(investment),
    paybackYears: paybackYears === null ? null : round(paybackYears, 1),
    savingPct: oldKwh > 0 ? round((savedKwh / oldKwh) * 100) : 0,
    notes,
  };
}
