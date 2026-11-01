import type {
  DayForecast,
  GearItem,
  PackingCategory,
  PackingItem,
  TripType,
} from './models';
import { COLD_NIGHT_C, WINDY_GUST_KMH } from './weather';

/** What a list item's quantity depends on. */
interface Party {
  people: number;
  nights: number;
  type: TripType;
}

interface Template {
  key: string;
  category: PackingCategory;
  quantity: (party: Party) => number;
  /** The trip types it belongs to; every type when absent. */
  types?: readonly TripType[];
}

const one = () => 1;
const each = ({ people }: Party) => people;
/** Two people to a tent. */
const tents = ({ people }: Party) => Math.ceil(people / 2);
/** Litres: 3 a day each, 5 in the desert, for the nights plus the last day. */
const litres = ({ people, nights, type }: Party) =>
  people * (nights + 1) * (type === 'desert' ? 5 : 3);

/** The lists, by category. Names live in the copy, under `items.<key>`. */
export const PACKING_TEMPLATES: readonly Template[] = [
  { key: 'tent', category: 'shelter', quantity: tents },
  { key: 'groundsheet', category: 'shelter', quantity: tents },
  { key: 'pegs', category: 'shelter', quantity: tents },
  { key: 'mallet', category: 'shelter', quantity: one },
  {
    key: 'sandPegs',
    category: 'shelter',
    quantity: tents,
    types: ['beach', 'desert'],
  },
  { key: 'sleepingBag', category: 'sleep', quantity: each },
  { key: 'sleepingPad', category: 'sleep', quantity: each },
  { key: 'pillow', category: 'sleep', quantity: each },
  { key: 'stove', category: 'kitchen', quantity: one },
  {
    key: 'fuel',
    category: 'kitchen',
    quantity: ({ nights }) => Math.ceil(nights / 2),
  },
  { key: 'lighter', category: 'kitchen', quantity: () => 2 },
  { key: 'pot', category: 'kitchen', quantity: one },
  { key: 'mugs', category: 'kitchen', quantity: each },
  { key: 'cutlery', category: 'kitchen', quantity: each },
  {
    key: 'food',
    category: 'kitchen',
    quantity: ({ people, nights }) => people * (nights + 1),
  },
  { key: 'trashBags', category: 'kitchen', quantity: () => 3 },
  { key: 'water', category: 'water', quantity: litres },
  { key: 'bottles', category: 'water', quantity: each },
  {
    key: 'filter',
    category: 'water',
    quantity: one,
    types: ['tent', 'mountain'],
  },
  { key: 'warmLayer', category: 'clothing', quantity: each },
  {
    key: 'socks',
    category: 'clothing',
    quantity: ({ people, nights }) => people * (nights + 1),
  },
  {
    key: 'sunHat',
    category: 'clothing',
    quantity: each,
    types: ['beach', 'desert', 'tent'],
  },
  { key: 'swimwear', category: 'clothing', quantity: each, types: ['beach'] },
  { key: 'scarf', category: 'clothing', quantity: each, types: ['desert'] },
  {
    key: 'boots',
    category: 'clothing',
    quantity: each,
    types: ['mountain', 'winter'],
  },
  {
    key: 'rainJacket',
    category: 'clothing',
    quantity: each,
    types: ['mountain', 'winter'],
  },
  { key: 'thermals', category: 'clothing', quantity: each, types: ['winter'] },
  {
    key: 'gloves',
    category: 'clothing',
    quantity: each,
    types: ['winter', 'mountain'],
  },
  {
    key: 'beanie',
    category: 'clothing',
    quantity: each,
    types: ['winter', 'mountain', 'desert'],
  },
  { key: 'headlamp', category: 'light', quantity: each },
  { key: 'lantern', category: 'light', quantity: one },
  { key: 'batteries', category: 'light', quantity: () => 2 },
  { key: 'powerBank', category: 'light', quantity: one },
  { key: 'firstAidKit', category: 'firstAid', quantity: one },
  { key: 'sunscreen', category: 'firstAid', quantity: one },
  {
    key: 'repellent',
    category: 'firstAid',
    quantity: one,
    types: ['tent', 'beach', 'mountain'],
  },
  { key: 'medicines', category: 'firstAid', quantity: one },
  { key: 'starChart', category: 'stargazing', quantity: one },
  { key: 'redLight', category: 'stargazing', quantity: one },
  { key: 'binoculars', category: 'stargazing', quantity: one },
  { key: 'campChair', category: 'stargazing', quantity: each },
  { key: 'blanket', category: 'stargazing', quantity: tents },
];

/** Items a forecast calls for, with their reason. */
const WEATHER_TEMPLATES: readonly (Template & {
  when: (days: readonly DayForecast[]) => boolean;
})[] = [
  {
    key: 'rainJacket',
    category: 'clothing',
    quantity: each,
    when: (days) => days.some((d) => d.rainChance >= 50 || d.rainMm >= 5),
  },
  {
    key: 'tarp',
    category: 'shelter',
    quantity: one,
    when: (days) => days.some((d) => d.rainChance >= 50 || d.rainMm >= 5),
  },
  {
    key: 'guyLines',
    category: 'shelter',
    quantity: tents,
    when: (days) => days.some((d) => d.gustKmh >= WINDY_GUST_KMH),
  },
  {
    key: 'beanie',
    category: 'clothing',
    quantity: each,
    when: (days) => days.some((d) => d.minC < COLD_NIGHT_C),
  },
  {
    key: 'thermals',
    category: 'clothing',
    quantity: each,
    when: (days) => days.some((d) => d.minC <= 0),
  },
  {
    key: 'hotWaterBottle',
    category: 'sleep',
    quantity: each,
    when: (days) => days.some((d) => d.minC <= 0),
  },
  {
    key: 'shade',
    category: 'shelter',
    quantity: one,
    when: (days) => days.some((d) => d.maxC >= 32),
  },
];

type NewId = () => string;

function item(
  t: Template,
  party: Party,
  source: PackingItem['source'],
  id: NewId,
): PackingItem {
  return {
    id: id(),
    key: t.key,
    category: t.category,
    quantity: Math.max(1, t.quantity(party)),
    packed: false,
    personId: null,
    source,
  };
}

/** The list for a new trip: its type's items, sized to the party. */
export function packingFor(party: Party, id: NewId): PackingItem[] {
  return PACKING_TEMPLATES.filter(
    (t) => !t.types || t.types.includes(party.type),
  ).map((t) => item(t, party, 'list', id));
}

/**
 * Items the forecast calls for that the list lacks. Nothing already there
 * is changed, so ticks and choices stay.
 */
export function weatherAdditions(
  packing: readonly PackingItem[],
  days: readonly DayForecast[],
  party: Party,
  id: NewId,
): PackingItem[] {
  if (!days.length) return [];
  const have = new Set(packing.map((p) => p.key).filter(Boolean));
  return WEATHER_TEMPLATES.filter((t) => !have.has(t.key) && t.when(days)).map(
    (t) => item(t, party, 'weather', id),
  );
}

/**
 * Resizes the lists' items when the party or the length changes; items the
 * user added, and quantities of items already packed, stay as they are.
 */
export function resizePacking(
  packing: readonly PackingItem[],
  party: Party,
): PackingItem[] {
  const all = [...PACKING_TEMPLATES, ...WEATHER_TEMPLATES];
  return packing.map((p) => {
    const t =
      p.source === 'custom' || p.packed
        ? null
        : all.find((x) => x.key === p.key);
    return t ? { ...p, quantity: Math.max(1, t.quantity(party)) } : p;
  });
}

export interface PackingProgress {
  packed: number;
  total: number;
}

/** Packed over total, for everyone or for one person. */
export function progress(
  packing: readonly PackingItem[],
  personId?: string,
): PackingProgress {
  const items =
    personId === undefined
      ? packing
      : packing.filter((p) => p.personId === personId);
  return {
    packed: items.filter((p) => p.packed).length,
    total: items.length,
  };
}

/** The gear the user owns for a list item, if any. */
export function ownedFor(
  item: PackingItem,
  gear: readonly GearItem[],
): GearItem | undefined {
  return item.key ? gear.find((g) => g.key === item.key) : undefined;
}

/** Every list key, for the gear form's "what is it" choice. */
export const GEAR_KEYS: readonly { key: string; category: PackingCategory }[] =
  [
    ...new Map(
      [...PACKING_TEMPLATES, ...WEATHER_TEMPLATES].map((t) => [
        t.key,
        { key: t.key, category: t.category },
      ]),
    ).values(),
  ];
