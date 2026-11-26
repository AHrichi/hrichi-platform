import type { SyncAppSpec } from '@ah/shared/sync';
import type { LogEntry } from '../calculations/operations';
import type { Reading } from '../calculations/readings';
import type { GreenhouseProject, SiteRecord } from '../models/serra.models';
import { isCalculation, toProject, toSite } from '../utils/backup';

/**
 * What SerraCalc syncs (ADR-0032). A project travels as several records —
 * the project itself, each saved result, each log entry, its readings — so
 * two devices editing different results of one project both keep theirs.
 */
export const SERRA_SYNC = {
  app: 'serracalc',
  kinds: {
    project: { maxBytes: 32_768 },
    /** `projectId:resultId` */
    calculation: { maxBytes: 65_536 },
    /** `projectId:logId` */
    log: { maxBytes: 16_384 },
    /** By project id: all its imported readings. */
    readings: { maxBytes: 131_072 },
    /** By site name: its plants and tariffs. */
    site: { maxBytes: 65_536 },
  },
} as const satisfies SyncAppSpec;

export type SerraSyncKind = keyof typeof SERRA_SYNC.kinds;

/** A change to sync: a record's new data, or its deletion. */
export interface SerraChange {
  readonly kind: SerraSyncKind;
  readonly key: string;
  readonly data?: object;
  readonly deleted?: true;
}

/** A record as it arrives from another device. */
export interface SerraPulled {
  readonly kind: string;
  readonly key: string;
  readonly updatedAt: string;
  readonly deleted?: boolean;
  readonly data?: unknown;
}

const partKey = (projectId: string, id: string) => `${projectId}:${id}`;

/** A copy of `value` without `keys`. */
function without<T extends object, K extends keyof T>(
  value: T,
  ...keys: K[]
): Omit<T, K> {
  const copy = { ...value };
  for (const key of keys) delete copy[key];
  return copy;
}

/**
 * A project as its records, the project first. Its `updatedAt` stays out
 * of the data (the record carries its own time), so saving a result
 * doesn't rewrite the project's record and undo a title changed elsewhere.
 */
export function projectParts(project: GreenhouseProject): SerraChange[] {
  const { calculations, logs, readings } = project;
  const meta = without(
    project,
    'calculations',
    'logs',
    'readings',
    'updatedAt',
  );
  return [
    { kind: 'project', key: project.id, data: meta },
    ...calculations.map((saved): SerraChange => ({
      kind: 'calculation',
      key: partKey(project.id, saved.id),
      data: saved,
    })),
    ...(logs ?? []).map((entry): SerraChange => ({
      kind: 'log',
      key: partKey(project.id, entry.id),
      data: entry,
    })),
    ...(readings?.length
      ? [{ kind: 'readings', key: project.id, data: { readings } } as const]
      : []),
  ];
}

/** A site's record, without its `updatedAt` for the same reason. */
export function sitePart(site: SiteRecord): SerraChange {
  return { kind: 'site', key: site.name, data: without(site, 'updatedAt') };
}

/**
 * What changed between two versions of a project (null: none yet, or
 * deleted): the records whose data differs, and deletions for the ones
 * that went.
 */
export function changedParts(
  before: GreenhouseProject | null,
  after: GreenhouseProject | null,
): SerraChange[] {
  const old = new Map(
    (before ? projectParts(before) : []).map((part) => [
      `${part.kind}\u0000${part.key}`,
      part,
    ]),
  );
  const changes: SerraChange[] = [];
  for (const part of after ? projectParts(after) : []) {
    const id = `${part.kind}\u0000${part.key}`;
    const was = old.get(id);
    old.delete(id);
    if (!was || JSON.stringify(was.data) !== JSON.stringify(part.data)) {
      changes.push(part);
    }
  }
  for (const gone of old.values()) {
    changes.push({ kind: gone.kind, key: gone.key, deleted: true });
  }
  return changes;
}

/** Projects and sites by id and name, as the app keeps them. */
export interface SerraLocal {
  readonly projects: Map<string, GreenhouseProject>;
  readonly sites: Map<string, SiteRecord>;
}

/** What applying pulled records changed, for the app to save. */
export interface SerraApplied {
  readonly projects: Set<string>;
  readonly deletedProjects: Set<string>;
  readonly sites: Set<string>;
  readonly deletedSites: Set<string>;
  /** Records it couldn't use: damaged, or for a project it doesn't have. */
  readonly skipped: number;
}

function splitKey(key: string): [string, string] | null {
  const at = key.indexOf(':');
  return at > 0 && at < key.length - 1
    ? [key.slice(0, at), key.slice(at + 1)]
    : null;
}

function isLog(value: unknown): value is LogEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as LogEntry).id === 'string' &&
    typeof (value as LogEntry).date === 'string' &&
    typeof (value as LogEntry).subject === 'string'
  );
}

const later = (a: string, b: string) => (Date.parse(a) > Date.parse(b) ? a : b);

/**
 * Applies records pulled from other devices to the projects and sites
 * here, checking each the way a backup is checked. The server already
 * chose the winning versions; a record this device still has to push is
 * kept out by the caller.
 */
export function applyPulled(
  local: SerraLocal,
  records: readonly SerraPulled[],
): SerraApplied {
  const applied: SerraApplied = {
    projects: new Set(),
    deletedProjects: new Set(),
    sites: new Set(),
    deletedSites: new Set(),
    skipped: 0,
  };
  let skipped = 0;
  const touch = (project: GreenhouseProject, updatedAt: string) => {
    const saved = {
      ...project,
      updatedAt: later(project.updatedAt, updatedAt),
    };
    local.projects.set(saved.id, saved);
    applied.projects.add(saved.id);
    applied.deletedProjects.delete(saved.id);
  };

  for (const record of records) {
    switch (record.kind) {
      case 'project': {
        if (record.deleted) {
          if (local.projects.delete(record.key)) {
            applied.deletedProjects.add(record.key);
            applied.projects.delete(record.key);
          }
          break;
        }
        const current = local.projects.get(record.key);
        const project = toProject({
          ...(record.data as object),
          id: record.key,
          updatedAt: record.updatedAt,
          createdAt:
            (record.data as Partial<GreenhouseProject>)?.createdAt ??
            record.updatedAt,
          calculations: current?.calculations ?? [],
          logs: current?.logs,
          readings: current?.readings,
        });
        if (project) touch(project, record.updatedAt);
        else skipped++;
        break;
      }
      case 'calculation':
      case 'log': {
        const ids = splitKey(record.key);
        const project = ids && local.projects.get(ids[0]);
        if (!ids || !project) {
          if (!record.deleted) skipped++;
          break;
        }
        const [, id] = ids;
        if (record.kind === 'calculation') {
          const rest = project.calculations.filter((c) => c.id !== id);
          if (record.deleted) {
            touch({ ...project, calculations: rest }, record.updatedAt);
          } else if (isCalculation(record.data) && record.data.id === id) {
            const index = project.calculations.findIndex((c) => c.id === id);
            const calculations =
              index >= 0
                ? project.calculations.map((c) =>
                    c.id === id ? (record.data as typeof c) : c,
                  )
                : [record.data, ...rest];
            touch({ ...project, calculations }, record.updatedAt);
          } else {
            skipped++;
          }
        } else {
          const logs = (project.logs ?? []).filter((l) => l.id !== id);
          if (record.deleted) {
            touch({ ...project, logs }, record.updatedAt);
          } else if (isLog(record.data) && record.data.id === id) {
            const index = (project.logs ?? []).findIndex((l) => l.id === id);
            touch(
              {
                ...project,
                logs:
                  index >= 0
                    ? (project.logs ?? []).map((l) =>
                        l.id === id ? (record.data as LogEntry) : l,
                      )
                    : [...logs, record.data],
              },
              record.updatedAt,
            );
          } else {
            skipped++;
          }
        }
        break;
      }
      case 'readings': {
        const project = local.projects.get(record.key);
        if (!project) {
          if (!record.deleted) skipped++;
          break;
        }
        const readings = (record.data as { readings?: unknown })?.readings;
        if (record.deleted) {
          touch({ ...project, readings: undefined }, record.updatedAt);
        } else if (Array.isArray(readings)) {
          touch(
            { ...project, readings: readings as Reading[] },
            record.updatedAt,
          );
        } else {
          skipped++;
        }
        break;
      }
      case 'site': {
        if (record.deleted) {
          if (local.sites.delete(record.key))
            applied.deletedSites.add(record.key);
          break;
        }
        const site = toSite({
          ...(record.data as object),
          name: record.key,
          updatedAt: record.updatedAt,
        });
        if (site) {
          local.sites.set(site.name, site);
          applied.sites.add(site.name);
        } else {
          skipped++;
        }
        break;
      }
      default:
        skipped++;
    }
  }
  return { ...applied, skipped };
}
