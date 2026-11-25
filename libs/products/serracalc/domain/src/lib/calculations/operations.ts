import type { CalcNote } from '../models/serra.models';
import { round } from '../utils/physics';

/** What a log entry records. */
export type LogKind =
  'scouting' | 'release' | 'spray' | 'maintenance' | 'hygiene' | 'harvest';

/** WHO hazard class of a pesticide (Ia and Ib are not allowed). */
export type WhoClass = 'Ia' | 'Ib' | 'II' | 'III' | 'U';

export interface LogEntry {
  id: string;
  /** Day of the entry, yyyy-mm-dd. */
  date: string;
  kind: LogKind;
  /** Pest, beneficial, product, task or checklist: free text. */
  subject: string;
  note?: string;
  /** How much: insects released, L or kg sprayed, kg picked. */
  amount?: number;
  unit?: string;
  /** Sprays: the product's WHO class. */
  whoClass?: WhoClass;
  /** Maintenance: which task (MAINTENANCE_TASKS id). */
  task?: string;
  /** Hygiene: the checklist items ticked. */
  checked?: string[];
}

export const LOG_KINDS: readonly LogKind[] = [
  'scouting',
  'release',
  'spray',
  'maintenance',
  'hygiene',
  'harvest',
];

export const WHO_CLASSES: readonly WhoClass[] = ['Ia', 'Ib', 'II', 'III', 'U'];

/** Sprays of these classes are refused (the spec: no WHO Ia or Ib). */
export const BANNED_WHO: readonly WhoClass[] = ['Ia', 'Ib'];

/** The hygiene checklist for a compartment, by id. */
export const HYGIENE_ITEMS = [
  'footbath',
  'handwash',
  'clothing',
  'tools',
  'visitors',
  'waste',
  'doors',
] as const;
export type HygieneItem = (typeof HYGIENE_ITEMS)[number];

export interface MaintenanceTask {
  id: string;
  /** Days between two services. */
  everyDays: number;
}

/** Routine service of the plant, every so many days (typical). */
export const MAINTENANCE_TASKS: readonly MaintenanceTask[] = [
  { id: 'filters', everyDays: 7 },
  { id: 'nozzles', everyDays: 14 },
  { id: 'pads', everyDays: 14 },
  { id: 'sensors', everyDays: 30 },
  { id: 'pumps', everyDays: 30 },
  { id: 'fans', everyDays: 30 },
  { id: 'drainDisinfection', everyDays: 7 },
  { id: 'roMembranes', everyDays: 90 },
  { id: 'chp', everyDays: 30 },
];

export interface MaintenanceStatus {
  id: string;
  everyDays: number;
  /** Last service, yyyy-mm-dd, or null if none is logged. */
  last: string | null;
  /** Next due, yyyy-mm-dd. */
  due: string;
  /** Days until due; negative when overdue. */
  inDays: number;
  state: 'ok' | 'soon' | 'overdue';
}

const DAY_MS = 86_400_000;

function dayNumber(iso: string): number {
  return Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY_MS);
}

function isoOfDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** Each task's last service from the log, and when it is due next. */
export function maintenanceStatus(
  logs: readonly LogEntry[],
  today: string,
  tasks: readonly MaintenanceTask[] = MAINTENANCE_TASKS,
): MaintenanceStatus[] {
  const now = dayNumber(today);
  return tasks.map((task) => {
    const done = logs
      .filter((l) => l.kind === 'maintenance' && l.task === task.id)
      .map((l) => l.date)
      .sort();
    const last = done.at(-1) ?? null;
    const dueDay = last === null ? now : dayNumber(last) + task.everyDays;
    const inDays = dueDay - now;
    return {
      id: task.id,
      everyDays: task.everyDays,
      last,
      due: isoOfDay(dueDay),
      inDays,
      state: inDays < 0 ? 'overdue' : inDays <= 2 ? 'soon' : 'ok',
    };
  });
}

/** Problems with an entry before it is saved: a banned spray. */
export function checkLogEntry(
  entry: Pick<LogEntry, 'kind' | 'whoClass'>,
): CalcNote[] {
  if (
    entry.kind === 'spray' &&
    entry.whoClass &&
    BANNED_WHO.includes(entry.whoClass)
  ) {
    return [
      {
        code: 'ops.bannedSpray',
        severity: 'error',
        values: { cls: entry.whoClass },
      },
    ];
  }
  return [];
}

export type HeatRisk =
  'none' | 'caution' | 'extremeCaution' | 'danger' | 'extremeDanger';

export interface HeatStressResult {
  /** Heat index (apparent temperature), °C. */
  heatIndexC: number;
  risk: HeatRisk;
  /** Minutes of rest each hour of work, and water a person an hour, L. */
  restMinPerHour: number;
  waterLPerHour: number;
  notes: CalcNote[];
}

/**
 * The heat index (apparent temperature) by the US National Weather Service
 * regression (Rothfusz), with its low-humidity and low-temperature
 * adjustments, and the work-rest plan that goes with each band.
 */
export function heatStress(airC: number, rhPct: number): HeatStressResult {
  const t = (airC * 9) / 5 + 32;
  const rh = Math.min(100, Math.max(0, rhPct));
  let hi = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if ((hi + t) / 2 >= 80) {
    hi =
      -42.379 +
      2.04901523 * t +
      10.14333127 * rh -
      0.22475541 * t * rh -
      0.00683783 * t * t -
      0.05481717 * rh * rh +
      0.00122874 * t * t * rh +
      0.00085282 * t * rh * rh -
      0.00000199 * t * t * rh * rh;
    if (rh < 13 && t >= 80 && t <= 112) {
      hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
    } else if (rh > 85 && t >= 80 && t <= 87) {
      hi += ((rh - 85) / 10) * ((87 - t) / 5);
    }
  }
  const hiC = ((hi - 32) * 5) / 9;
  const risk: HeatRisk =
    hiC >= 54
      ? 'extremeDanger'
      : hiC >= 41
        ? 'danger'
        : hiC >= 32
          ? 'extremeCaution'
          : hiC >= 27
            ? 'caution'
            : 'none';
  const plan: Record<HeatRisk, [number, number]> = {
    none: [0, 0.25],
    caution: [10, 0.5],
    extremeCaution: [20, 0.75],
    danger: [40, 1],
    extremeDanger: [60, 1],
  };
  const [rest, water] = plan[risk];
  return {
    heatIndexC: round(hiC, 1),
    risk,
    restMinPerHour: rest,
    waterLPerHour: water,
    notes: [
      {
        code: `heat.${risk}`,
        severity:
          risk === 'none'
            ? 'ok'
            : risk === 'caution'
              ? 'info'
              : risk === 'extremeCaution'
                ? 'warn'
                : 'error',
        values: { hi: round(hiC, 1), rest, water },
      },
    ],
  };
}
