import { defaultHeatLoss, DEFAULT_CONTEXT } from '../calculations/defaults';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import type { GreenhouseProject } from '../models/serra.models';
import { backupFileName, createBackup, readBackup, withNewId } from './backup';

describe('Project backups', () => {
  const now = new Date('2026-11-25T09:00:00Z');
  const withResult: GreenhouseProject = {
    ...SAMPLE_PROJECTS[0],
    calculations: [
      {
        id: 'calc_1',
        label: 'Peak · Kebili',
        savedAt: '2026-11-25T08:00:00.000Z',
        kind: 'heatPeak',
        inputs: defaultHeatLoss(DEFAULT_CONTEXT),
      },
    ],
  };

  it('round-trips every project with its saved inputs', () => {
    const projects = [withResult, ...SAMPLE_PROJECTS.slice(1)];
    expect(readBackup(createBackup(projects, now))).toEqual({
      projects,
      skipped: 0,
    });
    expect(backupFileName(now)).toBe('serracalc-backup-2026-11-25.json');
  });

  it('says why a file is refused', () => {
    expect(readBackup('not json')).toEqual({ error: 'notJson' });
    expect(readBackup('[]')).toEqual({ error: 'notSerraCalc' });
    // A LuxPath backup is JSON too, but not ours.
    expect(readBackup('{"app":"luxpath","version":1,"projects":[]}')).toEqual({
      error: 'notSerraCalc',
    });
    expect(readBackup('{"app":"serracalc","version":2,"projects":[]}')).toEqual(
      { error: 'newerVersion' },
    );
    expect(
      readBackup('{"app":"serracalc","version":1,"projects":[{"id":1}]}'),
    ).toEqual({ error: 'empty' });
  });

  it('keeps the good projects and counts the damaged ones', () => {
    const noHouse = { ...SAMPLE_PROJECTS[1], greenhouse: { spans: 3 } };
    const badCrop = { ...SAMPLE_PROJECTS[2], crop: 'banana' };
    const text = JSON.stringify({
      app: 'serracalc',
      version: 1,
      projects: [SAMPLE_PROJECTS[0], noHouse, badCrop],
    });
    expect(readBackup(text)).toEqual({
      projects: [SAMPLE_PROJECTS[0]],
      skipped: 2,
    });
  });

  it('drops damaged results but keeps their project', () => {
    const text = JSON.stringify({
      app: 'serracalc',
      version: 1,
      projects: [
        {
          ...withResult,
          site: undefined,
          calculations: [
            ...withResult.calculations,
            { id: 'calc_2', label: 'Old tool', kind: 'sauna', inputs: {} },
            { id: 'calc_3', label: 'No inputs', kind: 'co2' },
          ],
        },
      ],
    });
    const read = readBackup(text);
    expect('projects' in read && read.projects[0]).toEqual({
      ...withResult,
      site: '',
    });
  });

  it('gives a restored project a new id', () => {
    const copy = withNewId(withResult, 'gh_copy');
    expect(copy.id).toBe('gh_copy');
    expect(copy.calculations).toEqual(withResult.calculations);
  });
});
