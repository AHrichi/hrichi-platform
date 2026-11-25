import { COVER_IDS, CROP_IDS, SCREEN_IDS } from '../data/catalogue.data';
import type {
  CalcKind,
  Currency,
  GreenhouseProject,
  GreenhouseShape,
  GreenhouseSpec,
  PlantType,
  SavedCalculation,
  SitePlant,
  SiteRecord,
  SiteTariffs,
} from '../models/serra.models';

/**
 * A SerraCalc backup file: every project with its house and saved inputs,
 * and the sites' shared plants and tariffs (absent in older files).
 */
export interface SerraBackup {
  app: 'serracalc';
  version: 1;
  exportedAt: string;
  projects: GreenhouseProject[];
  sites?: SiteRecord[];
}

export type BackupError = 'notJson' | 'notSerraCalc' | 'newerVersion' | 'empty';

export type BackupRead =
  | { projects: GreenhouseProject[]; sites: SiteRecord[]; skipped: number }
  | { error: BackupError };

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
  ro: true,
  fertigation: true,
  energy: true,
  heatReuse: true,
  coolingYear: true,
  solarPv: true,
  economics: true,
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
  sites: readonly SiteRecord[] = [],
): string {
  const backup: SerraBackup = {
    app: 'serracalc',
    version: 1,
    exportedAt: now.toISOString(),
    projects: [...projects],
    sites: [...sites],
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
    areaHa:
      typeof value['areaHa'] === 'number' &&
      Number.isFinite(value['areaHa']) &&
      value['areaHa'] > 0
        ? value['areaHa']
        : undefined,
    logs: Array.isArray(value['logs']) ? (project.logs ?? []) : undefined,
    readings: Array.isArray(value['readings'])
      ? (project.readings ?? [])
      : undefined,
    calculations: (value['calculations'] as unknown[]).filter(isCalculation),
  };
}

const PLANT_TYPES: readonly PlantType[] = [
  'ro',
  'chp',
  'boiler',
  'chiller',
  'tank',
  'pump',
];
const TARIFFS: readonly (keyof SiteTariffs)[] = [
  'gasPerM3',
  'electricityPerKwh',
  'exportPerKwh',
  'waterPerM3',
];

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPlant(value: unknown): value is SitePlant {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    oneOf(PLANT_TYPES, value['type']) &&
    isAmount(value['capacity']) &&
    isAmount(value['efficiency']) &&
    isAmount(value['hoursDay'])
  );
}

/** A site's plants and tariffs, or null when it can't be read. */
function toSite(value: unknown): SiteRecord | null {
  if (
    !isRecord(value) ||
    typeof value['name'] !== 'string' ||
    !Array.isArray(value['plants']) ||
    !isRecord(value['tariffs'])
  ) {
    return null;
  }
  const tariffs = value['tariffs'];
  if (!TARIFFS.every((key) => isAmount(tariffs[key]))) return null;
  return {
    name: value['name'],
    plants: (value['plants'] as unknown[]).filter(isPlant),
    tariffs: tariffs as unknown as SiteTariffs,
    updatedAt:
      typeof value['updatedAt'] === 'string'
        ? value['updatedAt']
        : new Date(0).toISOString(),
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
  const sites = Array.isArray(data['sites'])
    ? (data['sites'] as unknown[])
        .map(toSite)
        .filter((s): s is SiteRecord => s !== null)
    : [];
  return { projects, sites, skipped: all.length - projects.length };
}

/** A restored project whose id is taken gets a new one: nothing is overwritten. */
export function withNewId(
  project: GreenhouseProject,
  id: string,
): GreenhouseProject {
  return { ...project, id };
}
