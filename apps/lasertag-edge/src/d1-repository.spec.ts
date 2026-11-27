import {
  FIRST_GEAR,
  FIRST_MAP,
  FIRST_VENUE,
  MemoryRepository,
} from '@ah/products/lasertag/server';
import { runRepositoryContract } from '@ah/products/lasertag/server/testing';
import { sqliteD1 } from '../tests/sqlite-d1';
import { D1LasertagRepository } from './d1-repository';

runRepositoryContract('D1', () => new D1LasertagRepository(sqliteD1()), {
  describe,
  it,
  expect,
});

describe('the first-venue migration', () => {
  it('inserts exactly the rows the server lib seeds', async () => {
    const d1 = new D1LasertagRepository(sqliteD1());
    const memory = new MemoryRepository();
    expect(await d1.venueBySlug(FIRST_VENUE.slug)).toEqual(
      await memory.venueBySlug(FIRST_VENUE.slug),
    );
    expect(await d1.mapsOf(FIRST_VENUE.id)).toEqual([FIRST_MAP]);
    expect(await d1.gearOf(FIRST_VENUE.id)).toEqual(
      await memory.gearOf(FIRST_VENUE.id),
    );
    expect(FIRST_GEAR).toHaveLength(24);
  });
});
