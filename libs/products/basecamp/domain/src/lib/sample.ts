import type { Trip } from './models';
import { isPersonal, packingFor } from './packing';
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
  // Generated with people: each person has their own sleeping gear and personal items!
  const raw = packingFor(
    { people: 3, nights: 2, type: 'mountain' },
    id,
    people,
  );
  // Shared gear is split and assigned:
  // - Kitchen/cooking handled by Sami
  // - Shelter handled by Lina
  // - Water, light, and first aid handled by Yassine
  const packing = raw.map((item, i) => {
    if (isPersonal(item)) {
      return { ...item, packed: i % 4 === 0 };
    }
    let personId = item.personId;
    if (item.category === 'kitchen') {
      personId = people[0].id;
    } else if (item.category === 'shelter') {
      personId = people[1].id;
    } else if (
      item.category === 'water' ||
      item.category === 'light' ||
      item.category === 'firstAid'
    ) {
      personId = people[2].id;
    } else {
      personId = people[i % 3].id;
    }
    return { ...item, personId, packed: i % 4 === 0 };
  });
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
