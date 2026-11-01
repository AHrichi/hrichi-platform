import {
  backupFileName,
  createBackup,
  readBackup,
  readShared,
  shareText,
  withNewId,
} from './files';
import type { GearItem } from './models';
import { sampleTrip } from './sample';

let n = 0;
const id = () => `id-${++n}`;
const trip = sampleTrip('2026-11-01', id);
const gear: GearItem[] = [
  {
    id: 'g1',
    name: 'Stove',
    key: 'stove',
    category: 'kitchen',
    condition: 'good',
    notes: '',
  },
];

describe('Backups and share links', () => {
  it('round-trips a backup', () => {
    const now = new Date('2026-11-01T09:00:00Z');
    expect(readBackup(createBackup([trip], gear, now))).toEqual({
      trips: [trip],
      gear,
      skipped: 0,
    });
    expect(backupFileName(now)).toBe('basecamp-backup-2026-11-01.json');
  });

  it('round-trips a trip through a share link, unchanged', () => {
    expect(readShared(shareText(trip))).toEqual({ trip });
  });

  it('refuses damaged, foreign and newer files', () => {
    expect(readShared('{"app":"basecamp-trip"')).toEqual({ error: 'notJson' });
    expect(readShared('{"app":"luxpath"}')).toEqual({ error: 'notBasecamp' });
    expect(readShared('{"app":"basecamp-trip","version":2,"trip":{}}')).toEqual(
      { error: 'newerVersion' },
    );
    expect(
      readShared('{"app":"basecamp-trip","version":1,"trip":{"id":"x"}}'),
    ).toEqual({ error: 'empty' });
    expect(readBackup('{"app":"basecamp","version":1,"trips":[]}')).toEqual({
      error: 'empty',
    });
  });

  it('keeps good trips and repairs what it can', () => {
    const damaged = {
      ...trip,
      nights: 40,
      packing: [...trip.packing, { id: 'bad' }],
      people: [trip.people[0]],
    };
    const read = readBackup(
      JSON.stringify({
        app: 'basecamp',
        version: 1,
        trips: [damaged, { id: 2 }],
        gear: [],
      }),
    );
    if ('error' in read) throw new Error(read.error);
    expect(read.skipped).toBe(1);
    const [kept] = read.trips;
    expect(kept.nights).toBe(14);
    expect(kept.packing).toHaveLength(trip.packing.length);
    // Items given to someone no longer on the trip go back to anyone.
    expect(
      kept.packing.every(
        (p) => p.personId === null || p.personId === trip.people[0].id,
      ),
    ).toBe(true);
  });

  it('gives an imported copy its own id', () => {
    expect(withNewId(trip, 'new').id).toBe('new');
    expect(withNewId(trip, 'new').packing).toBe(trip.packing);
  });
});
