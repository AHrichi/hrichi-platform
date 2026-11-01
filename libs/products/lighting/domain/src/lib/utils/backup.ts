import type { ProjectItem } from '../models/lighting.models';

/** A LuxPath backup file: every project, with its poles, plan and results. */
export interface LuxPathBackup {
  app: 'luxpath';
  version: 1;
  exportedAt: string;
  projects: ProjectItem[];
}

export type BackupError = 'notJson' | 'notLuxPath' | 'newerVersion' | 'empty';

export type BackupRead =
  { projects: ProjectItem[]; skipped: number } | { error: BackupError };

export function createBackup(
  projects: readonly ProjectItem[],
  now = new Date(),
): string {
  const backup: LuxPathBackup = {
    app: 'luxpath',
    version: 1,
    exportedAt: now.toISOString(),
    projects: [...projects],
  };
  return JSON.stringify(backup, null, 2);
}

/** The file name a backup gets, dated so several can sit side by side. */
export function backupFileName(now = new Date()): string {
  return `luxpath-backup-${now.toISOString().slice(0, 10)}.json`;
}

function isProject(value: unknown): value is ProjectItem {
  const p = value as Partial<ProjectItem> | null;
  return (
    typeof p === 'object' &&
    p !== null &&
    typeof p.id === 'string' &&
    p.id.length > 0 &&
    typeof p.title === 'string' &&
    Array.isArray(p.poles) &&
    Array.isArray(p.milestones) &&
    typeof p.gpsCenter?.lat === 'number' &&
    typeof p.gpsCenter?.lng === 'number'
  );
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
  const backup = data as Partial<LuxPathBackup> | null;
  if (backup?.app !== 'luxpath' || !Array.isArray(backup.projects)) {
    return { error: 'notLuxPath' };
  }
  if (typeof backup.version !== 'number' || backup.version > 1) {
    return { error: 'newerVersion' };
  }
  const projects = backup.projects.filter(isProject);
  if (projects.length === 0) {
    return { error: 'empty' };
  }
  return { projects, skipped: backup.projects.length - projects.length };
}

/**
 * A project imported next to one with the same id gets a new id, and its
 * poles and milestones follow it, so a restore never overwrites anything.
 */
export function withNewId(project: ProjectItem, id: string): ProjectItem {
  return {
    ...project,
    id,
    poles: project.poles.map((pole) => ({ ...pole, projectId: id })),
    milestones: project.milestones.map((m) => ({ ...m, projectId: id })),
  };
}
