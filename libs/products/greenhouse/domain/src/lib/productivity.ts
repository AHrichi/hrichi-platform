import type { IsoDate } from './dates';
import type { Crop, Greenhouse, WorkLog } from './models';

/**
 * Where a picking rate came from, best first:
 * - `team-crop`: this team's own history on this crop;
 * - `farm-crop`: every team's history on this crop (the team hasn't picked
 *   it lately);
 * - `team`: this team's history on any crop;
 * - `crop-default` / `farm-default`: the manager's assumptions, when there
 *   is no usable history at all.
 */
export type RateSource =
  'team-crop' | 'farm-crop' | 'team' | 'crop-default' | 'farm-default';

export interface Rate {
  /** Accepted kg per worker-hour. */
  kgPerHour: number;
  source: RateSource;
  /** Logged hours behind the rate; 0 for an assumption. */
  hours: number;
}

export interface RateOptions {
  /** First day of history to use (inclusive). */
  from: IsoDate;
  /** The day after the last one (exclusive), usually the plan's Monday. */
  to: IsoDate;
  /** History thinner than this many logged hours isn't trusted. Default 16. */
  minHours?: number;
  /** Kg per hour to assume for a crop with no usable history. */
  cropDefaults?: Partial<Record<Crop, number>>;
  /** The last resort, for a crop with no default either. */
  farmDefault: number;
}

export interface RateTable {
  rate(teamId: string, crop: Crop): Rate;
}

/**
 * Rough harvest rates to start from before a farm has history (kg per
 * worker-hour). Every farm should replace them with its own.
 */
export const DEFAULT_KG_PER_HOUR: Readonly<Record<Crop, number>> = {
  tomato: 45,
  'cherry-tomato': 14,
  pepper: 30,
  cucumber: 50,
  melon: 60,
  strawberry: 8,
  other: 25,
};

export const DEFAULT_MIN_HOURS = 16;

interface Totals {
  kg: number;
  hours: number;
}

function add(map: Map<string, Totals>, key: string, log: WorkLog): void {
  const totals = map.get(key) ?? { kg: 0, hours: 0 };
  totals.kg += log.kg;
  totals.hours += log.hours;
  map.set(key, totals);
}

/**
 * Picking rates from past work logs. A rate is total accepted kg over total
 * hours (not an average of each entry's rate), so long shifts weigh more
 * than short ones. Logs count for the team the worker was in at the time.
 */
export function buildRateTable(
  logs: readonly WorkLog[],
  greenhouses: readonly Greenhouse[],
  options: RateOptions,
): RateTable {
  if (!(options.farmDefault > 0)) {
    throw new RangeError('The farm default rate must be above 0 kg/h');
  }
  const minHours = options.minHours ?? DEFAULT_MIN_HOURS;
  const cropOf = new Map(greenhouses.map((g) => [g.id, g.crop]));
  const byTeamCrop = new Map<string, Totals>();
  const byCrop = new Map<string, Totals>();
  const byTeam = new Map<string, Totals>();

  for (const log of logs) {
    const crop = cropOf.get(log.greenhouseId);
    if (
      log.date < options.from ||
      log.date >= options.to ||
      !(log.hours > 0) ||
      !(log.kg >= 0) ||
      !crop
    ) {
      continue;
    }
    add(byCrop, crop, log);
    if (log.teamId) {
      add(byTeamCrop, `${log.teamId}|${crop}`, log);
      add(byTeam, log.teamId, log);
    }
  }

  function fromHistory(
    totals: Totals | undefined,
    source: RateSource,
  ): Rate | null {
    if (!totals || totals.hours < minHours || !(totals.kg > 0)) return null;
    return { kgPerHour: totals.kg / totals.hours, source, hours: totals.hours };
  }

  return {
    rate(teamId, crop) {
      const cropDefault = options.cropDefaults?.[crop];
      return (
        fromHistory(byTeamCrop.get(`${teamId}|${crop}`), 'team-crop') ??
        fromHistory(byCrop.get(crop), 'farm-crop') ??
        fromHistory(byTeam.get(teamId), 'team') ??
        (cropDefault && cropDefault > 0
          ? { kgPerHour: cropDefault, source: 'crop-default', hours: 0 }
          : {
              kgPerHour: options.farmDefault,
              source: 'farm-default',
              hours: 0,
            })
      );
    },
  };
}
