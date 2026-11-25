import { COVER_IDS, CROP_IDS, SCREEN_IDS } from '../data/catalogue.data';
import type {
  CalcKind,
  Currency,
  GreenhouseProject,
  GreenhouseShape,
  GreenhouseSpec,
  SavedCalculation,
} from '../models/serra.models';

/** A SerraCalc backup file: every project with its house and saved inputs. */
export interface SerraBackup {
  app: 'serracalc';
  version: 1;
  exportedAt: string;
  projects: GreenhouseProject[];
}

export type BackupError = 'notJson' | 'notSerraCalc' | 'newerVersion' | 'empty';

export type BackupRead =
  { projects: GreenhouseProject[]; skipped: number } | { error: BackupError };

/** Every kind of saved result; a Record so a new kind can't be forgotten. */
const KIND_SET: Record<CalcKind, true> = {
  heatPeak: true,
  heatYear: true,
  hotWater: true,
  ventilation: true,
  padFan: true,
  cropWater: true,
  rainwater: true,
  light: true,
  co2: true,
  humidity: true,
  vpd: true,
  fog: true,
  calendar: true,
};
const KINDS = Object.keys(KIND_SET) as readonly CalcKind[];
const SHAPES: readonly GreenhouseShape[] = ['gable', 'venlo', 'tunnel'];
const CURRENCIES: readonly Currency[] = ['TND', 'EUR', 'USD'];
const SIZES = [
  'spans',
  'spanWidthM',
  'lengthM',
  'gutterHeightM',
  'ridgeHeightM',
] as const;

export function createBackup(
  projects: readonly GreenhouseProject[],
  now = new Date(),
): string {
  const backup: SerraBackup = {
    app: 'serracalc',
    version: 1,
    exportedAt: now.toISOString(),
    projects: [...projects],
  };
  return JSON.stringify(backup, null, 2);
}

/** The file name a backup gets, dated so several can sit side by side. */
export function backupFileName(now = new Date()): string {
  return `serracalc-backup-${now.toISOString().slice(0, 10)}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(list: readonly T[], value: unknown): boolean {
  return list.includes(value as T);
}

function isHouse(value: unknown): value is GreenhouseSpec {
  return (
    isRecord(value) &&
    oneOf(SHAPES, value['shape']) &&
    oneOf(COVER_IDS, value['cover']) &&
    oneOf(SCREEN_IDS, value['screen']) &&
    typeof value['perimeterInsulated'] === 'boolean' &&
    SIZES.every(
      (key) =>
        typeof value[key] === 'number' &&
        Number.isFinite(value[key]) &&
        (value[key] as number) > 0,
    )
  );
}

function isCalculation(value: unknown): value is SavedCalculation {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['label'] === 'string' &&
    typeof value['savedAt'] === 'string' &&
    oneOf(KINDS, value['kind']) &&
    isRecord(value['inputs'])
  );
}

/**
 * The project as SerraCalc stores it, or null when a field it needs is
 * missing. Results that are damaged or of an unknown kind are dropped.
 */
function toProject(value: unknown): GreenhouseProject | null {
  if (
    !isRecord(value) ||
    typeof value['id'] !== 'string' ||
    value['id'].length === 0 ||
    typeof value['title'] !== 'string' ||
    typeof value['climateId'] !== 'string' ||
    !oneOf(CROP_IDS, value['crop']) ||
    !oneOf(CURRENCIES, value['currency']) ||
    !isHouse(value['greenhouse']) ||
    !Array.isArray(value['calculations'])
  ) {
    return null;
  }
  const project = value as unknown as GreenhouseProject;
  return {
    ...project,
    site: typeof value['site'] === 'string' ? value['site'] : '',
    calculations: (value['calculations'] as unknown[]).filter(isCalculation),
  };
}

/**
 * Reads a backup file's text. Projects that don't have the expected shape
 * are left out and counted, so one damaged entry never blocks the rest.
 */
export function readBackup(text: string): BackupRead {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'notJson' };
  }
  if (
    !isRecord(data) ||
    data['app'] !== 'serracalc' ||
    !Array.isArray(data['projects'])
  ) {
    return { error: 'notSerraCalc' };
  }
  if (typeof data['version'] !== 'number' || data['version'] > 1) {
    return { error: 'newerVersion' };
  }
  const all = data['projects'] as unknown[];
  const projects = all
    .map(toProject)
    .filter((p): p is GreenhouseProject => p !== null);
  if (projects.length === 0) {
    return { error: 'empty' };
  }
  return { projects, skipped: all.length - projects.length };
}

/** A restored project whose id is taken gets a new one: nothing is overwritten. */
export function withNewId(
  project: GreenhouseProject,
  id: string,
): GreenhouseProject {
  return { ...project, id };
}
