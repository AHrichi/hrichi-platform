import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import { backupFileName, createBackup, readBackup, withNewId } from './backup';

describe('Project backups', () => {
  const now = new Date('2026-11-01T09:00:00Z');

  it('round-trips every project', () => {
    const read = readBackup(createBackup(SAMPLE_PROJECTS, now));
    expect(read).toEqual({ projects: SAMPLE_PROJECTS, skipped: 0 });
    expect(backupFileName(now)).toBe('luxpath-backup-2026-11-01.json');
  });

  it('says why a file is refused', () => {
    expect(readBackup('not json')).toEqual({ error: 'notJson' });
    expect(readBackup('{"projects": []}')).toEqual({ error: 'notLuxPath' });
    expect(readBackup('{"app":"luxpath","version":2,"projects":[]}')).toEqual({
      error: 'newerVersion',
    });
    expect(
      readBackup('{"app":"luxpath","version":1,"projects":[{"id":1}]}'),
    ).toEqual({ error: 'empty' });
  });

  it('keeps the good projects and counts the damaged ones', () => {
    const text = JSON.stringify({
      app: 'luxpath',
      version: 1,
      projects: [SAMPLE_PROJECTS[0], { title: 'broken' }],
    });
    expect(readBackup(text)).toEqual({
      projects: [SAMPLE_PROJECTS[0]],
      skipped: 1,
    });
  });

  it('moves poles and milestones along with a new id', () => {
    const copy = withNewId(SAMPLE_PROJECTS[0], 'proj_copy');
    expect(copy.id).toBe('proj_copy');
    expect(copy.poles.every((p) => p.projectId === 'proj_copy')).toBe(true);
    expect(copy.milestones.every((m) => m.projectId === 'proj_copy')).toBe(
      true,
    );
  });
});
