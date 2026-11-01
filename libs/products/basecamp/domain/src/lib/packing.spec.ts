import type { DayForecast, GearItem, PackingItem } from './models';
import {
  GEAR_KEYS,
  ownedFor,
  packingFor,
  progress,
  resizePacking,
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
});
