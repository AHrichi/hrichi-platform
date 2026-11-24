import { climateById, MONTH_DAYS } from '../data/climates.data';
import type {
  CalcNote,
  LightParams,
  LightResult,
  MonthLight,
} from '../models/serra.models';
import { round } from '../utils/physics';

/** Share of global radiation's energy that is photosynthetic light (PAR). */
export const PAR_FRACTION = 0.47;
/** Photons in a megajoule of sunlight's PAR, mol. */
export const MOL_PER_MJ_PAR = 4.57;

/** Daily light integral from global radiation, mol/m² per day. */
export function dliFromRadiation(
  radiationMj: number,
  transmission = 1,
): number {
  return radiationMj * PAR_FRACTION * MOL_PER_MJ_PAR * transmission;
}

/**
 * Light month by month: the sun's daily light integral inside, what lamps
 * must add to reach the target, and the shade that keeps the crop under its
 * ceiling. The darkest month sizes the lamps: PPFD = gap × 10⁶ / (hours ×
 * 3600), W/m² = PPFD / efficacy. Other months run the same lamps for fewer
 * hours.
 */
export function supplementalLight(p: LightParams): LightResult {
  const climate = climateById(p.climateId);
  const tau = Math.min(1, Math.max(0, p.transmissionPct / 100));
  const hours = Math.min(24, Math.max(1, p.lampHours));
  const efficacy = Math.max(0.5, p.efficacyUmolJ);

  const natural = climate.months.map((m) =>
    dliFromRadiation(m.radiationMj, tau),
  );
  const gaps = natural.map((d) => Math.max(0, p.targetDli - d));
  const designGap = Math.max(...gaps);
  const designMonth = gaps.indexOf(designGap);
  const designPpfd = (designGap * 1e6) / (hours * 3600);
  const neededW = (designPpfd / efficacy) * p.floorAreaM2;
  const fixtures =
    designPpfd > 0 ? Math.ceil(neededW / Math.max(10, p.fixtureW)) : 0;
  const installedW = fixtures * Math.max(10, p.fixtureW);
  const installedPpfd =
    p.floorAreaM2 > 0 ? (installedW * efficacy) / p.floorAreaM2 : 0;

  const months: MonthLight[] = natural.map((dli, i) => {
    const runHours =
      installedPpfd > 0
        ? Math.min(hours, (gaps[i] * 1e6) / (installedPpfd * 3600))
        : 0;
    const kwh = (installedW * runHours * MONTH_DAYS[i]) / 1000;
    const shade = dli > p.maxDli ? (1 - p.maxDli / dli) * 100 : 0;
    return {
      month: i,
      naturalDli: round(dli, 1),
      gapDli: round(gaps[i], 1),
      lampHours: round(runHours, 1),
      kwh: round(kwh),
      shadePct: round(shade),
    };
  });

  const annualKwh = months.reduce((s, m) => s + m.kwh, 0);
  const litMonths = months.filter((m) => m.lampHours > 0).length;
  const shaded = months.filter((m) => m.shadePct > 0);
  const maxShade = Math.max(0, ...months.map((m) => m.shadePct));

  const notes: CalcNote[] = [];
  if (designPpfd === 0) {
    notes.push({ code: 'light.none', severity: 'ok' });
  } else {
    notes.push({
      code: 'light.months',
      severity: 'info',
      values: { months: litMonths, month: designMonth },
    });
    if (designPpfd > 300) {
      notes.push({
        code: 'light.highPpfd',
        severity: 'warn',
        values: { ppfd: round(designPpfd) },
      });
    }
  }
  if (shaded.length > 0) {
    const peak = shaded.reduce((a, b) => (b.shadePct > a.shadePct ? b : a));
    notes.push({
      code: 'light.shade',
      severity: 'info',
      values: { months: shaded.length, pct: round(maxShade), peak: peak.month },
    });
  }
  if (p.targetDli > p.maxDli) {
    notes.push({ code: 'light.targetOverCeiling', severity: 'error' });
  }

  return {
    months,
    designMonth,
    designPpfd: round(designPpfd),
    fixtures,
    installedPpfd: round(installedPpfd),
    wPerM2: round(p.floorAreaM2 > 0 ? installedW / p.floorAreaM2 : 0, 1),
    installedKw: round(installedW / 1000, 1),
    annualKwh: round(annualKwh),
    cost: round(annualKwh * Math.max(0, p.electricityPrice)),
    co2Kg: round(annualKwh * Math.max(0, p.co2KgPerKwh)),
    litMonths,
    shadeMonths: shaded.length,
    maxShadePct: maxShade,
    notes,
  };
}
