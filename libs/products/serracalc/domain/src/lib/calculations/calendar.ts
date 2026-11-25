import { climateById } from '../data/climates.data';
import type {
  CalcNote,
  CalendarParams,
  CalendarResult,
  CalendarStage,
  CalendarWeek,
} from '../models/serra.models';
import { round } from '../utils/physics';
import {
  monthOfWeek,
  valueAtWeek,
  WEEKS_PER_YEAR,
  wrapWeek,
} from '../utils/weeks';
import { MOL_PER_MJ_PAR, PAR_FRACTION } from './light';

/**
 * A crop year, week by week from planting: its stages, and the systems the
 * climate calls for each week. Weekly outside values are read between the
 * month normals.
 *
 * - heating: the coldest hour (mean daily minimum) under the night set point;
 * - CO₂: afternoons under the vent temperature, so the house stays shut and
 *   the gas isn't lost through open vents;
 * - shade: daily light inside above the crop's ceiling;
 * - fog: afternoons hotter than vents alone can handle.
 */
export function cropCalendar(p: CalendarParams): CalendarResult {
  const climate = climateById(p.climateId);
  const tMin = climate.months.map((m) => m.tMinC);
  const tMax = climate.months.map((m) => m.tMaxC);
  const sun = climate.months.map((m) => m.radiationMj);
  const tau = Math.min(1, Math.max(0, p.transmissionPct / 100));

  const nursery = clampInt(p.nurseryWeeks, 0, 20);
  const vegetative = clampInt(p.vegetativeWeeks, 1, 20);
  const flowering = clampInt(p.floweringWeeks, 1, 20);
  const cropWeeks = clampInt(
    p.cropWeeks,
    vegetative + flowering + 1,
    WEEKS_PER_YEAR,
  );
  const plant = wrapWeek(p.plantingWeek);
  const harvestFrom = vegetative + flowering;

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < WEEKS_PER_YEAR; i++) {
    const week = wrapWeek(plant + i);
    const stage: CalendarWeek['stage'] =
      i < vegetative
        ? 'vegetative'
        : i < harvestFrom
          ? 'flowering'
          : i < cropWeeks
            ? 'harvest'
            : 'cleanOut';
    // The next crop's seedlings: the last `nursery` weeks before planting.
    const isNursery = i >= WEEKS_PER_YEAR - nursery;
    const min = valueAtWeek(tMin, week);
    const max = valueAtWeek(tMax, week);
    const dli = valueAtWeek(sun, week) * PAR_FRACTION * MOL_PER_MJ_PAR * tau;
    const inHouse = stage !== 'cleanOut';
    weeks.push({
      week,
      month: monthOfWeek(week),
      stage,
      nursery: isNursery,
      tMinC: round(min, 1),
      tMaxC: round(max, 1),
      dli: round(dli, 1),
      heating: inHouse && min < p.nightSetC,
      co2: inHouse && max <= p.ventilateAboveC,
      shade: inHouse && dli > p.maxDli,
      fog: inHouse && max >= p.coolAboveC,
    });
  }

  const span = (
    stage: CalendarStage['stage'],
    from: number,
    length: number,
  ): CalendarStage => ({
    stage,
    startWeek: wrapWeek(plant + from),
    endWeek: wrapWeek(plant + from + length - 1),
    weeks: length,
  });
  const stages: CalendarStage[] = [];
  if (nursery > 0) stages.push(span('nursery', -nursery, nursery));
  stages.push(span('vegetative', 0, vegetative));
  stages.push(span('flowering', vegetative, flowering));
  stages.push(span('harvest', harvestFrom, cropWeeks - harvestFrom));
  if (cropWeeks < WEEKS_PER_YEAR) {
    stages.push(span('cleanOut', cropWeeks, WEEKS_PER_YEAR - cropWeeks));
  }

  const count = (key: 'heating' | 'co2' | 'shade' | 'fog') =>
    weeks.filter((w) => w[key]).length;
  const firstHeat = weeks.find((w) => w.heating);
  const heatingWeeks = count('heating');
  const co2Weeks = count('co2');
  const shadeWeeks = count('shade');
  const fogWeeks = count('fog');
  const endWeek = wrapWeek(plant + cropWeeks - 1);
  const firstHarvestWeek = wrapWeek(plant + harvestFrom);
  const cleanWeeks = WEEKS_PER_YEAR - cropWeeks;

  const notes: CalcNote[] = [
    {
      code: 'calendar.season',
      severity: 'info',
      values: { plant, end: endWeek, weeks: cropWeeks },
    },
    {
      code: 'calendar.harvest',
      severity: 'ok',
      values: { first: firstHarvestWeek, weeks: cropWeeks - harvestFrom },
    },
  ];
  if (firstHeat) {
    notes.push({
      code: 'calendar.heating',
      severity: 'info',
      values: { from: firstHeat.week, weeks: heatingWeeks },
    });
  }
  if (co2Weeks > 0) {
    notes.push({
      code: 'calendar.co2',
      severity: 'info',
      values: { weeks: co2Weeks },
    });
  }
  if (fogWeeks > 0) {
    notes.push({
      code: 'calendar.fog',
      severity: fogWeeks > 12 ? 'warn' : 'info',
      values: { weeks: fogWeeks },
    });
  }
  if (shadeWeeks > 0) {
    notes.push({
      code: 'calendar.shade',
      severity: 'info',
      values: { weeks: shadeWeeks },
    });
  }
  if (cleanWeeks < 3) {
    notes.push({
      code: 'calendar.shortCleanOut',
      severity: 'warn',
      values: { weeks: cleanWeeks },
    });
  }

  return {
    stages,
    weeks,
    firstHarvestWeek,
    endWeek,
    harvestWeeks: cropWeeks - harvestFrom,
    heatingWeeks,
    co2Weeks,
    shadeWeeks,
    fogWeeks,
    heatingFromWeek: firstHeat?.week ?? 0,
    notes,
  };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
