import {
  type ArenaMap,
  FIRST_VENUE_SLUG,
  type Gear,
  type Venue,
} from '@ah/products/lasertag/domain';

/**
 * The first venue: an indoor warehouse the owner will rent, with 12 vests
 * and 12 blasters in pairs (V-01 with B-01…). Its map has no size until it
 * is measured. The D1 migration `0002_first_venue.sql` inserts the same rows;
 * a test keeps the two equal.
 */
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const FIRST_VENUE: Venue = {
  id: id(1),
  slug: FIRST_VENUE_SLUG,
  name: 'BARQ Warehouse',
  city: 'Tunis',
  country: 'TN',
  timezone: 'Africa/Tunis',
  currency: 'TND',
};

export const FIRST_MAP: ArenaMap = {
  id: id(2),
  venueId: FIRST_VENUE.id,
  name: 'Warehouse',
  indoor: true,
  size: null,
};

export const FIRST_GEAR: readonly Gear[] = Array.from(
  { length: 12 },
  (_, i) => {
    const n = i + 1;
    const label = String(n).padStart(2, '0');
    return [
      {
        id: id(100 + n),
        venueId: FIRST_VENUE.id,
        kind: 'vest',
        label: `V-${label}`,
        pairedWith: id(200 + n),
        status: 'ready',
      },
      {
        id: id(200 + n),
        venueId: FIRST_VENUE.id,
        kind: 'blaster',
        label: `B-${label}`,
        pairedWith: id(100 + n),
        status: 'ready',
      },
    ] as const;
  },
).flat();
