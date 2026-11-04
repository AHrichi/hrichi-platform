import type { DayForecast, GearItem, PackingItem, Person } from './models';
import {
  assignCategory,
  distributeSharedGear,
  GEAR_KEYS,
  isPersonal,
  ownedFor,
  packingFor,
  progress,
  resizePacking,
  splitItem,
  weatherAdditions,
} from './packing';

let n = 0;
const id = () => `id-${++n}`;
const qty = (items: PackingItem[], key: string) =>
  items.find((i) => i.key === key)?.quantity;
const find = (items: PackingItem[], key: string) => {
  const item = items.find((i) => i.key === key);
  if (!item) throw new Error(`no ${key}`);
  return item;
};

const day = (over: Partial<DayForecast>): DayForecast => ({
  date: '2026-11-05',
  code: 1,
  maxC: 20,
  minC: 10,
  rainMm: 0,
  rainChance: 0,
  windKmh: 10,
  gustKmh: 20,
  cloudPct: 10,
  ...over,
});

describe('Packing lists', () => {
  it('scales with the people and the nights', () => {
    const small = packingFor({ people: 1, nights: 1, type: 'tent' }, id);
    const big = packingFor({ people: 5, nights: 3, type: 'tent' }, id);
    expect(qty(small, 'tent')).toBe(1);
    expect(qty(big, 'tent')).toBe(3);
    expect(qty(big, 'sleepingBag')).toBe(5);
    expect(qty(small, 'water')).toBe(6);
    expect(qty(big, 'water')).toBe(60);
    expect(qty(big, 'food')).toBe(20);
  });

  it('gives each person their own sleeping gear while keeping cooking shared', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const list = packingFor(
      { people: 2, nights: 2, type: 'tent' },
      id,
      people,
    );

    // Sleeping gear: each one has their own
    const sleepingBags = list.filter((i) => i.key === 'sleepingBag');
    expect(sleepingBags).toHaveLength(2);
    expect(sleepingBags.map((i) => i.personId)).toEqual(['p1', 'p2']);
    expect(sleepingBags.every((i) => i.quantity === 1 && i.scope === 'personal')).toBe(true);

    const sleepingPads = list.filter((i) => i.key === 'sleepingPad');
    expect(sleepingPads).toHaveLength(2);
    expect(sleepingPads.map((i) => i.personId)).toEqual(['p1', 'p2']);

    const pillows = list.filter((i) => i.key === 'pillow');
    expect(pillows).toHaveLength(2);
    expect(pillows.map((i) => i.personId)).toEqual(['p1', 'p2']);

    // Cooking gear: shared (single item, unassigned so one person can handle it)
    const stove = list.filter((i) => i.key === 'stove');
    expect(stove).toHaveLength(1);
    expect(stove[0].scope).toBe('shared');
    expect(stove[0].personId).toBeNull();

    const pot = list.filter((i) => i.key === 'pot');
    expect(pot).toHaveLength(1);
    expect(pot[0].scope).toBe('shared');

    // Socks: personal, quantity is nights + 1 per person
    const socks = list.filter((i) => i.key === 'socks');
    expect(socks).toHaveLength(2);
    expect(socks.every((s) => s.quantity === 3 && s.scope === 'personal')).toBe(true);
  });

  it('follows the trip type', () => {
    const beach = packingFor({ people: 2, nights: 2, type: 'beach' }, id);
    const winter = packingFor({ people: 2, nights: 2, type: 'winter' }, id);
    const desert = packingFor({ people: 2, nights: 2, type: 'desert' }, id);
    expect(beach.some((i) => i.key === 'swimwear')).toBe(true);
    expect(winter.some((i) => i.key === 'swimwear')).toBe(false);
    expect(winter.some((i) => i.key === 'thermals')).toBe(true);
    expect(qty(desert, 'water')).toBe(30);
    expect(beach.every((i) => i.source === 'list' && !i.packed)).toBe(true);
  });

  it('adds what the forecast calls for, once', () => {
    const party = { people: 2, nights: 2, type: 'beach' as const };
    const list = packingFor(party, id);
    const frosty = [day({ minC: -1 }), day({ rainChance: 80, gustKmh: 60 })];
    const added = weatherAdditions(list, frosty, party, id);
    expect(added.map((i) => i.key).sort()).toEqual([
      'beanie',
      'guyLines',
      'hotWaterBottle',
      'rainJacket',
      'tarp',
      'thermals',
    ]);
    expect(added.every((i) => i.source === 'weather')).toBe(true);
    expect(weatherAdditions([...list, ...added], frosty, party, id)).toEqual(
      [],
    );
    expect(weatherAdditions(list, [day({})], party, id)).toEqual([]);
    expect(weatherAdditions(list, [], party, id)).toEqual([]);
  });

  it('adds weather items per person when people are present', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const party = { people: 2, nights: 2, type: 'mountain' as const };
    const list = packingFor(party, id, people);
    const frosty = [day({ minC: -1 })];
    const added = weatherAdditions(list, frosty, party, id, people);

    // hotWaterBottle and thermals are personal -> 1 per person
    const bottles = added.filter((i) => i.key === 'hotWaterBottle');
    expect(bottles).toHaveLength(2);
    expect(bottles.map((b) => b.personId)).toEqual(['p1', 'p2']);
  });

  it('resizes list items but leaves packed and custom ones', () => {
    const list = packingFor({ people: 2, nights: 1, type: 'tent' }, id);
    const packedWater = list.map((i) =>
      i.key === 'water' ? { ...i, packed: true } : i,
    );
    const custom: PackingItem = {
      id: 'c',
      label: 'Kite',
      category: 'shelter',
      quantity: 1,
      packed: false,
      personId: null,
      source: 'custom',
    };
    const resized = resizePacking([...packedWater, custom], {
      people: 4,
      nights: 1,
      type: 'tent',
    });
    expect(qty(resized, 'sleepingBag')).toBe(4);
    expect(qty(resized, 'water')).toBe(qty(list, 'water'));
    expect(resized.at(-1)).toEqual(custom);
  });

  it('resizes and adjusts personal items when campers are added or removed', () => {
    const initialPeople: Person[] = [{ id: 'p1', name: 'Sami' }];
    const list = packingFor({ people: 1, nights: 2, type: 'tent' }, id, initialPeople);

    expect(list.filter((i) => i.key === 'sleepingBag')).toHaveLength(1);

    // Add Lina
    const updatedPeople: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const expanded = resizePacking(
      list,
      { people: 2, nights: 2, type: 'tent' },
      updatedPeople,
      id,
    );

    const sleepingBags = expanded.filter((i) => i.key === 'sleepingBag');
    expect(sleepingBags).toHaveLength(2);
    expect(sleepingBags.map((i) => i.personId)).toEqual(['p1', 'p2']);

    // Remove Sami
    const soloLina: Person[] = [{ id: 'p2', name: 'Lina' }];
    const reduced = resizePacking(
      expanded,
      { people: 1, nights: 2, type: 'tent' },
      soloLina,
      id,
    );
    const soloBags = reduced.filter((i) => i.key === 'sleepingBag');
    expect(soloBags).toHaveLength(1);
    expect(soloBags[0].personId).toBe('p2');
  });

  it('splits an item between more than one person', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const list = packingFor({ people: 4, nights: 2, type: 'tent' }, id);
    const tentItem = find(list, 'tent');
    expect(tentItem.quantity).toBe(2);

    // Split 2 tents: 1 for Sami, 1 for Lina
    const splitResult = splitItem(
      list,
      tentItem.id,
      [
        { personId: people[0].id, quantity: 1 },
        { personId: people[1].id, quantity: 1 },
      ],
      id,
    );

    const tents = splitResult.filter((i) => i.key === 'tent');
    expect(tents).toHaveLength(2);
    expect(tents[0].personId).toBe(people[0].id);
    expect(tents[0].quantity).toBe(1);
    expect(tents[1].personId).toBe(people[1].id);
    expect(tents[1].quantity).toBe(1);
  });

  it('assigns all shared items in a category to one person', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const list = packingFor({ people: 2, nights: 2, type: 'tent' }, id, people);

    // Cooking handled by Sami
    const assigned = assignCategory(list, 'kitchen', 'p1');
    const kitchenItems = assigned.filter((i) => i.category === 'kitchen');
    expect(kitchenItems.every((i) => i.personId === 'p1')).toBe(true);

    // Sleeping gear is untouched (personal to each)
    const sleepingBags = assigned.filter((i) => i.key === 'sleepingBag');
    expect(sleepingBags.find((s) => s.personId === 'p2')).toBeDefined();
  });

  it('distributes unassigned shared gear evenly among party members', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const list = packingFor({ people: 2, nights: 2, type: 'tent' }, id, people);
    const distributed = distributeSharedGear(list, people);

    const sharedItems = distributed.filter((i) => !isPersonal(i));
    expect(sharedItems.length).toBeGreaterThan(0);
    expect(sharedItems.every((i) => i.personId === 'p1' || i.personId === 'p2')).toBe(true);

    // Both Sami and Lina get shared items assigned
    const samiShared = sharedItems.filter((i) => i.personId === 'p1');
    const linaShared = sharedItems.filter((i) => i.personId === 'p2');
    expect(samiShared.length).toBeGreaterThan(0);
    expect(linaShared.length).toBeGreaterThan(0);
  });

  it('counts progress for everyone and per person', () => {
    const list = packingFor({ people: 2, nights: 1, type: 'tent' }, id).map(
      (item, i) => ({ ...item, personId: i < 4 ? 'a' : null, packed: i < 2 }),
    );
    expect(progress(list)).toEqual({ packed: 2, total: list.length });
    expect(progress(list, 'a')).toEqual({ packed: 2, total: 4 });
  });

  it('knows what you own', () => {
    const gear: GearItem[] = [
      {
        id: 'g',
        name: 'Old blue tent',
        key: 'tent',
        category: 'shelter',
        condition: 'worn',
        notes: '',
      },
    ];
    const list = packingFor({ people: 2, nights: 1, type: 'tent' }, id);
    expect(ownedFor(find(list, 'tent'), gear)?.name).toBe('Old blue tent');
    expect(ownedFor(find(list, 'stove'), gear)).toBeUndefined();
    expect(new Set(GEAR_KEYS.map((g) => g.key)).size).toBe(GEAR_KEYS.length);
  });

  it('guarantees logically that one person cannot be assigned two sleeping bags', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    // Malformed/old packing list where Sami has TWO sleeping bags and Lina has NONE:
    const faultyList: PackingItem[] = [
      {
        id: 'item-1',
        key: 'sleepingBag',
        category: 'sleep',
        quantity: 1,
        packed: false,
        personId: 'p1',
        source: 'list',
        scope: 'personal',
      },
      {
        id: 'item-2',
        key: 'sleepingBag',
        category: 'sleep',
        quantity: 1,
        packed: true,
        personId: 'p1',
        source: 'list',
        scope: 'personal',
      },
    ];

    const party = { people: 2, nights: 1, type: 'tent' as const };
    const fixed = resizePacking(faultyList, party, people, id);

    const sleepingBags = fixed.filter((i) => i.key === 'sleepingBag');
    // Must be exactly 2 sleeping bags: 1 for Sami, 1 for Lina
    expect(sleepingBags).toHaveLength(2);

    const samiBags = sleepingBags.filter((i) => i.personId === 'p1');
    const linaBags = sleepingBags.filter((i) => i.personId === 'p2');
    expect(samiBags).toHaveLength(1);
    expect(linaBags).toHaveLength(1);
    expect(samiBags[0].quantity).toBe(1);
    expect(linaBags[0].quantity).toBe(1);
  });

  it('prevents splitting personal items like sleeping bags', () => {
    const people: Person[] = [
      { id: 'p1', name: 'Sami' },
      { id: 'p2', name: 'Lina' },
    ];
    const list = packingFor({ people: 2, nights: 1, type: 'tent' }, id, people);
    const sleepingBag = find(list, 'sleepingBag');

    const result = splitItem(
      list,
      sleepingBag.id,
      [
        { personId: 'p1', quantity: 1 },
        { personId: 'p2', quantity: 1 },
      ],
      id,
    );
    // Splitting personal items is rejected: original list unchanged
    expect(result).toEqual(list);
  });
});
