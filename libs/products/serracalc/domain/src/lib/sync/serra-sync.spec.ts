import { syncSpecProblems } from '@ah/shared/sync';
import { describe, expect, it } from 'vitest';
import { defaultHeatLoss, DEFAULT_CONTEXT } from '../calculations/defaults';
import { DEFAULT_GREENHOUSE } from '../data/catalogue.data';
import type { GreenhouseProject, SiteRecord } from '../models/serra.models';
import {
  applyPulled,
  changedParts,
  projectParts,
  SERRA_SYNC,
  type SerraChange,
  type SerraPulled,
  sitePart,
} from './serra-sync';

const T = '2026-11-26T10:00:00.000Z';

function project(): GreenhouseProject {
  return {
    id: 'gh_1',
    title: 'North',
    site: 'Block A',
    climateId: 'gabes',
    crop: 'tomato',
    currency: 'TND',
    greenhouse: { ...DEFAULT_GREENHOUSE },
    calculations: [
      {
        id: 'calc_1',
        kind: 'heatPeak',
        label: 'Base',
        savedAt: T,
        inputs: defaultHeatLoss(DEFAULT_CONTEXT),
      },
    ],
    logs: [
      {
        id: 'log_1',
        date: '2026-11-26',
        kind: 'scouting',
        subject: 'Whitefly',
      },
    ],
    readings: [{ at: T, insideC: 21 } as never],
    createdAt: T,
    updatedAt: T,
  } as GreenhouseProject;
}

/** Turns changes into what another device would pull. */
const pulled = (changes: SerraChange[], updatedAt = T): SerraPulled[] =>
  changes.map((change) => ({ ...change, updatedAt }));

const keys = (changes: SerraChange[]) =>
  changes.map((c) => `${c.kind} ${c.key}${c.deleted ? ' (deleted)' : ''}`);

describe('SerraCalc’s sync', () => {
  it('has a spec the server takes', () => {
    expect(syncSpecProblems(SERRA_SYNC)).toEqual([]);
  });

  it('sends a project as its parts, the project first', () => {
    expect(keys(projectParts(project()))).toEqual([
      'project gh_1',
      'calculation gh_1:calc_1',
      'log gh_1:log_1',
      'readings gh_1',
    ]);
    const meta = projectParts(project())[0].data as Record<string, unknown>;
    expect(meta).not.toHaveProperty('calculations');
    expect(meta).not.toHaveProperty('updatedAt');
  });

  it('sends only what changed', () => {
    const before = project();
    const saved = {
      ...before,
      updatedAt: '2026-11-26T11:00:00.000Z',
      calculations: [
        { ...before.calculations[0], id: 'calc_2', label: 'Night' },
        ...before.calculations,
      ],
    };
    // A new result, and the project's time: not the project's record.
    expect(keys(changedParts(before, saved))).toEqual([
      'calculation gh_1:calc_2',
    ]);

    const renamed = { ...saved, title: 'North block', readings: undefined };
    expect(keys(changedParts(saved, renamed))).toEqual([
      'project gh_1',
      'readings gh_1 (deleted)',
    ]);
    expect(keys(changedParts(null, before))).toHaveLength(4);
    expect(keys(changedParts(before, null))).toEqual([
      'project gh_1 (deleted)',
      'calculation gh_1:calc_1 (deleted)',
      'log gh_1:log_1 (deleted)',
      'readings gh_1 (deleted)',
    ]);
  });

  it('rebuilds a project on another device from its parts', () => {
    const local = { projects: new Map(), sites: new Map() };
    const result = applyPulled(local, pulled(projectParts(project())));
    expect(result.skipped).toBe(0);
    expect([...result.projects]).toEqual(['gh_1']);
    expect(local.projects.get('gh_1')).toEqual(project());
  });

  it('keeps edits to different results made on two devices', () => {
    const local = {
      projects: new Map([['gh_1', project()]]),
      sites: new Map(),
    };
    const base = project();
    // The other device renamed calc_1 and logged another visit.
    applyPulled(local, [
      {
        kind: 'calculation',
        key: 'gh_1:calc_1',
        updatedAt: '2026-11-26T12:00:00.000Z',
        data: { ...base.calculations[0], label: 'Winter' },
      },
      {
        kind: 'log',
        key: 'gh_1:log_2',
        updatedAt: '2026-11-26T12:00:00.000Z',
        data: {
          id: 'log_2',
          date: '2026-11-27',
          kind: 'scouting',
          subject: 'Thrips',
        },
      },
    ]);
    const merged = local.projects.get('gh_1');
    expect(merged?.calculations.map((c) => c.label)).toEqual(['Winter']);
    expect(merged?.logs?.map((l) => l.subject)).toEqual(['Whitefly', 'Thrips']);
    expect(merged?.updatedAt).toBe('2026-11-26T12:00:00.000Z');
    expect(merged?.title).toBe('North');
  });

  it('applies deletions, and refuses damaged or orphaned records', () => {
    const local = {
      projects: new Map([['gh_1', project()]]),
      sites: new Map(),
    };
    const result = applyPulled(local, [
      { kind: 'calculation', key: 'gh_1:calc_1', updatedAt: T, deleted: true },
      { kind: 'calculation', key: 'gh_9:calc_1', updatedAt: T, data: {} },
      {
        kind: 'calculation',
        key: 'gh_1:calc_3',
        updatedAt: T,
        data: { id: 'x' },
      },
      {
        kind: 'project',
        key: 'gh_2',
        updatedAt: T,
        data: { title: 'No house' },
      },
      { kind: 'mystery', key: 'm', updatedAt: T, data: {} },
    ]);
    expect(local.projects.get('gh_1')?.calculations).toEqual([]);
    expect(result.skipped).toBe(4);
    applyPulled(local, [
      { kind: 'project', key: 'gh_1', updatedAt: T, deleted: true },
    ]);
    expect(local.projects.size).toBe(0);
  });

  it('syncs a site’s plants and tariffs by its name', () => {
    const site: SiteRecord = {
      name: 'Oasis block 3',
      plants: [],
      tariffs: {
        gasPerM3: 0.5,
        electricityPerKwh: 0.4,
        exportPerKwh: 0.2,
        waterPerM3: 1,
      },
      updatedAt: T,
    };
    const part = sitePart(site);
    expect(part).toMatchObject({ kind: 'site', key: 'Oasis block 3' });
    expect(part.data).not.toHaveProperty('updatedAt');
    const local = { projects: new Map(), sites: new Map<string, SiteRecord>() };
    applyPulled(local, pulled([part]));
    expect(local.sites.get('Oasis block 3')).toEqual(site);
    applyPulled(local, [
      { kind: 'site', key: 'Oasis block 3', updatedAt: T, deleted: true },
    ]);
    expect(local.sites.size).toBe(0);
  });
});
