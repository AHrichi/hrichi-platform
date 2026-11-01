import type { Trip } from './models';
import { packingFor } from './packing';
import { addDays } from './weather';

/**
 * A weekend in the cork oak forest above Aïn Draham, three days from
 * `today`, so its weather and nights are always in the forecast's range.
 */
export function sampleTrip(
  today: string,
  id: () => string,
  name = 'Aïn Draham forest weekend',
): Trip {
  const people = [
    { id: id(), name: 'Sami' },
    { id: id(), name: 'Lina' },
    { id: id(), name: 'Yassine' },
  ];
  // Some of it is shared out and packed already.
  const packing = packingFor(
    { people: 3, nights: 2, type: 'mountain' },
    id,
  ).map((item, i) => ({
    ...item,
    personId: people[i % 3].id,
    packed: i % 4 === 0,
  }));
  const now = new Date().toISOString();
  return {
    id: id(),
    name,
    type: 'mountain',
    start: addDays(today, 3),
    nights: 2,
    campsite: { lat: 36.7766, lng: 8.6874, name: 'Aïn Draham, Jendouba' },
    people,
    packing,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}
