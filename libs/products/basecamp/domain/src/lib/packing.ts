import type {
  DayForecast,
  GearItem,
  GearScope,
  PackingCategory,
  PackingItem,
  Person,
  TripType,
} from './models';
import { COLD_NIGHT_C, WINDY_GUST_KMH } from './weather';

/** What a list item's quantity depends on. */
export interface Party {
  people: number;
  nights: number;
  type: TripType;
}

export interface Template {
  key: string;
  category: PackingCategory;
  quantity: (party: Party) => number;
  /** The trip types it belongs to; every type when absent. */
  types?: readonly TripType[];
  /**
   * 'personal': each camper has their own (e.g. sleeping gear, clothes).
   * 'shared': communal gear split or assigned among the group (e.g. cooking, shelter).
   */
  scope?: GearScope;
  /** Quantity per person when personal (defaults to 1). */
  quantityPerPerson?: (party: Party) => number;
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
  { key: 'tent', category: 'shelter', quantity: tents, scope: 'shared' },
  { key: 'groundsheet', category: 'shelter', quantity: tents, scope: 'shared' },
  { key: 'pegs', category: 'shelter', quantity: tents, scope: 'shared' },
  { key: 'mallet', category: 'shelter', quantity: one, scope: 'shared' },
  {
    key: 'sandPegs',
    category: 'shelter',
    quantity: tents,
    types: ['beach', 'desert'],
    scope: 'shared',
  },
  { key: 'sleepingBag', category: 'sleep', quantity: each, scope: 'personal' },
  { key: 'sleepingPad', category: 'sleep', quantity: each, scope: 'personal' },
  { key: 'pillow', category: 'sleep', quantity: each, scope: 'personal' },
  { key: 'stove', category: 'kitchen', quantity: one, scope: 'shared' },
  {
    key: 'fuel',
    category: 'kitchen',
    quantity: ({ nights }) => Math.ceil(nights / 2),
    scope: 'shared',
  },
  { key: 'lighter', category: 'kitchen', quantity: () => 2, scope: 'shared' },
  { key: 'pot', category: 'kitchen', quantity: one, scope: 'shared' },
  { key: 'mugs', category: 'kitchen', quantity: each, scope: 'shared' },
  { key: 'cutlery', category: 'kitchen', quantity: each, scope: 'shared' },
  {
    key: 'food',
    category: 'kitchen',
    quantity: ({ people, nights }) => people * (nights + 1),
    scope: 'shared',
  },
  { key: 'trashBags', category: 'kitchen', quantity: () => 3, scope: 'shared' },
  { key: 'water', category: 'water', quantity: litres, scope: 'shared' },
  { key: 'bottles', category: 'water', quantity: each, scope: 'personal' },
  {
    key: 'filter',
    category: 'water',
    quantity: one,
    types: ['tent', 'mountain'],
    scope: 'shared',
  },
  { key: 'warmLayer', category: 'clothing', quantity: each, scope: 'personal' },
  {
    key: 'socks',
    category: 'clothing',
    quantity: ({ people, nights }) => people * (nights + 1),
    quantityPerPerson: ({ nights }) => nights + 1,
    scope: 'personal',
  },
  {
    key: 'sunHat',
    category: 'clothing',
    quantity: each,
    types: ['beach', 'desert', 'tent'],
    scope: 'personal',
  },
  {
    key: 'swimwear',
    category: 'clothing',
    quantity: each,
    types: ['beach'],
    scope: 'personal',
  },
  {
    key: 'scarf',
    category: 'clothing',
    quantity: each,
    types: ['desert'],
    scope: 'personal',
  },
  {
    key: 'boots',
    category: 'clothing',
    quantity: each,
    types: ['mountain', 'winter'],
    scope: 'personal',
  },
  {
    key: 'rainJacket',
    category: 'clothing',
    quantity: each,
    types: ['mountain', 'winter'],
    scope: 'personal',
  },
  {
    key: 'thermals',
    category: 'clothing',
    quantity: each,
    types: ['winter'],
    scope: 'personal',
  },
  {
    key: 'gloves',
    category: 'clothing',
    quantity: each,
    types: ['winter', 'mountain'],
    scope: 'personal',
  },
  {
    key: 'beanie',
    category: 'clothing',
    quantity: each,
    types: ['winter', 'mountain', 'desert'],
    scope: 'personal',
  },
  { key: 'headlamp', category: 'light', quantity: each, scope: 'personal' },
  { key: 'lantern', category: 'light', quantity: one, scope: 'shared' },
  { key: 'batteries', category: 'light', quantity: () => 2, scope: 'shared' },
  { key: 'powerBank', category: 'light', quantity: one, scope: 'shared' },
  { key: 'firstAidKit', category: 'firstAid', quantity: one, scope: 'shared' },
  { key: 'sunscreen', category: 'firstAid', quantity: one, scope: 'shared' },
  {
    key: 'repellent',
    category: 'firstAid',
    quantity: one,
    types: ['tent', 'beach', 'mountain'],
    scope: 'shared',
  },
  { key: 'medicines', category: 'firstAid', quantity: one, scope: 'shared' },
  { key: 'starChart', category: 'stargazing', quantity: one, scope: 'shared' },
  { key: 'redLight', category: 'stargazing', quantity: one, scope: 'shared' },
  { key: 'binoculars', category: 'stargazing', quantity: one, scope: 'shared' },
  { key: 'campChair', category: 'stargazing', quantity: each, scope: 'personal' },
  { key: 'blanket', category: 'stargazing', quantity: tents, scope: 'shared' },
];

/** Items a forecast calls for, with their reason. */
export const WEATHER_TEMPLATES: readonly (Template & {
  when: (days: readonly DayForecast[]) => boolean;
})[] = [
  {
    key: 'rainJacket',
    category: 'clothing',
    quantity: each,
    scope: 'personal',
    when: (days) => days.some((d) => d.rainChance >= 50 || d.rainMm >= 5),
  },
  {
    key: 'tarp',
    category: 'shelter',
    quantity: one,
    scope: 'shared',
    when: (days) => days.some((d) => d.rainChance >= 50 || d.rainMm >= 5),
  },
  {
    key: 'guyLines',
    category: 'shelter',
    quantity: tents,
    scope: 'shared',
    when: (days) => days.some((d) => d.gustKmh >= WINDY_GUST_KMH),
  },
  {
    key: 'beanie',
    category: 'clothing',
    quantity: each,
    scope: 'personal',
    when: (days) => days.some((d) => d.minC < COLD_NIGHT_C),
  },
  {
    key: 'thermals',
    category: 'clothing',
    quantity: each,
    scope: 'personal',
    when: (days) => days.some((d) => d.minC <= 0),
  },
  {
    key: 'hotWaterBottle',
    category: 'sleep',
    quantity: each,
    scope: 'personal',
    when: (days) => days.some((d) => d.minC <= 0),
  },
  {
    key: 'shade',
    category: 'shelter',
    quantity: one,
    scope: 'shared',
    when: (days) => days.some((d) => d.maxC >= 32),
  },
];

export type NewId = () => string;

/**
 * Checks whether an item represents personal gear (each person brings their own)
 * or shared gear (split or assigned among the group).
 */
export function isPersonal(
  item: Pick<PackingItem, 'key' | 'category' | 'scope'>,
): boolean {
  if (item.scope) return item.scope === 'personal';
  if (item.category === 'sleep') return true;
  const all = [...PACKING_TEMPLATES, ...WEATHER_TEMPLATES];
  const t = all.find((x) => x.key === item.key);
  if (t?.scope) return t.scope === 'personal';
  return item.category === 'clothing';
}

/** The list for a new trip: its type's items, sized to the party. */
export function packingFor(
  party: Party,
  id: NewId,
  people?: readonly Person[],
): PackingItem[] {
  const templates = PACKING_TEMPLATES.filter(
    (t) => !t.types || t.types.includes(party.type),
  );
  const items: PackingItem[] = [];

  for (const t of templates) {
    const scope = t.scope ?? (t.category === 'sleep' ? 'personal' : 'shared');
    if (scope === 'personal' && people && people.length > 0) {
      const qty = t.quantityPerPerson
        ? Math.max(1, t.quantityPerPerson(party))
        : 1;
      for (const p of people) {
        items.push({
          id: id(),
          key: t.key,
          category: t.category,
          quantity: qty,
          packed: false,
          personId: p.id,
          source: 'list',
          scope: 'personal',
        });
      }
    } else {
      items.push({
        id: id(),
        key: t.key,
        category: t.category,
        quantity: Math.max(1, t.quantity(party)),
        packed: false,
        personId: null,
        source: 'list',
        scope,
      });
    }
  }

  return items;
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
  people?: readonly Person[],
): PackingItem[] {
  if (!days.length) return [];
  const have = new Set(packing.map((p) => p.key).filter(Boolean));
  const needed = WEATHER_TEMPLATES.filter(
    (t) => !have.has(t.key) && t.when(days),
  );
  const additions: PackingItem[] = [];

  for (const t of needed) {
    const scope = t.scope ?? (t.category === 'sleep' ? 'personal' : 'shared');
    if (scope === 'personal' && people && people.length > 0) {
      const qty = t.quantityPerPerson
        ? Math.max(1, t.quantityPerPerson(party))
        : 1;
      for (const p of people) {
        additions.push({
          id: id(),
          key: t.key,
          category: t.category,
          quantity: qty,
          packed: false,
          personId: p.id,
          source: 'weather',
          scope: 'personal',
        });
      }
    } else {
      additions.push({
        id: id(),
        key: t.key,
        category: t.category,
        quantity: Math.max(1, t.quantity(party)),
        packed: false,
        personId: null,
        source: 'weather',
        scope,
      });
    }
  }

  return additions;
}

/**
 * Normalizes a trip's packing list so that:
 * 1. For every personal item (sleeping gear, clothing, headlamp, etc.):
 *    - Each camper in `people` has EXACTLY ONE item.
 *    - Quantity for sleeping gear is always 1 (one person cannot have two sleeping bags).
 *    - No duplicate personal items exist for the same person.
 *    - If an item was previously packed, that status is preserved.
 * 2. For shared items (kitchen/cooking, shelter, first aid, water):
 *    - Communal items remain single/split shared items.
 *    - Assignee is kept if still in party, else reset to null.
 * 3. Custom items:
 *    - Preserved cleanly.
 */
export function normalizePacking(
  packing: readonly PackingItem[],
  party: Party,
  people?: readonly Person[],
  id: NewId = () =>
    `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
): PackingItem[] {
  const all = [...PACKING_TEMPLATES, ...WEATHER_TEMPLATES];

  if (!people || people.length === 0) {
    return packing.map((p) => {
      const isPers = isPersonal(p);
      if (isPers && p.category === 'sleep') {
        return {
          ...p,
          quantity: 1,
          personId: null,
          scope: 'personal' as const,
        };
      }
      return isPers ? { ...p, scope: 'personal' as const } : p;
    });
  }

  const personIds = new Set(people.map((p) => p.id));
  const result: PackingItem[] = [];

  // Track personal items assigned to each person: key -> personId -> PackingItem
  const personalByCamper = new Map<string, Map<string, PackingItem>>();

  for (const p of packing) {
    if (p.source === 'custom') {
      result.push({
        ...p,
        personId: p.personId && personIds.has(p.personId) ? p.personId : null,
      });
      continue;
    }

    const t = all.find((x) => x.key === p.key);
    const scope =
      p.scope ?? t?.scope ?? (p.category === 'sleep' ? 'personal' : 'shared');

    if (scope === 'personal') {
      const key = p.key ?? '';
      const assignedPerson =
        p.personId && personIds.has(p.personId) ? p.personId : null;

      if (assignedPerson) {
        let camperMap = personalByCamper.get(key);
        if (!camperMap) {
          camperMap = new Map();
          personalByCamper.set(key, camperMap);
        }
        if (!camperMap.has(assignedPerson)) {
          const targetQty =
            t?.category === 'sleep'
              ? 1
              : t?.quantityPerPerson
                ? Math.max(1, t.quantityPerPerson(party))
                : 1;
          camperMap.set(assignedPerson, {
            ...p,
            personId: assignedPerson,
            quantity: targetQty,
            scope: 'personal',
          });
        } else {
          // If a duplicate item existed for this person, merge its packed state
          const existing = camperMap.get(assignedPerson);
          if (existing && p.packed) existing.packed = true;
        }
      }
    } else {
      // Shared item
      const personId =
        p.personId && personIds.has(p.personId) ? p.personId : null;
      const quantity = p.packed
        ? p.quantity
        : t
          ? Math.max(1, t.quantity(party))
          : p.quantity;
      result.push({
        ...p,
        personId,
        quantity,
        scope: 'shared',
      });
    }
  }

  // Find all personal templates needed for this trip
  const neededPersonalTemplates = all.filter((t) => {
    const scope = t.scope ?? (t.category === 'sleep' ? 'personal' : 'shared');
    if (scope !== 'personal') return false;
    if (t.types && !t.types.includes(party.type)) return false;
    return (
      PACKING_TEMPLATES.some((pt) => pt.key === t.key) ||
      packing.some((p) => p.key === t.key)
    );
  });

  // Ensure every camper in `people` has exactly one item for each needed personal template
  for (const t of neededPersonalTemplates) {
    let camperMap = personalByCamper.get(t.key);
    if (!camperMap) {
      camperMap = new Map();
      personalByCamper.set(t.key, camperMap);
    }
    const targetQty =
      t.category === 'sleep'
        ? 1
        : t.quantityPerPerson
          ? Math.max(1, t.quantityPerPerson(party))
          : 1;

    for (const person of people) {
      if (!camperMap.has(person.id)) {
        camperMap.set(person.id, {
          id: id(),
          key: t.key,
          category: t.category,
          quantity: targetQty,
          packed: false,
          personId: person.id,
          source: 'list',
          scope: 'personal',
        });
      }
    }
  }

  // Add all personal items into result
  for (const camperMap of personalByCamper.values()) {
    for (const item of camperMap.values()) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Resizes the lists' items when the party or the length changes; items the
 * user added, and quantities of items already packed, stay as they are.
 */
export function resizePacking(
  packing: readonly PackingItem[],
  party: Party,
  people?: readonly Person[],
  id: NewId = () =>
    `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
): PackingItem[] {
  if (!people) {
    const all = [...PACKING_TEMPLATES, ...WEATHER_TEMPLATES];
    return packing.map((p) => {
      const t =
        p.source === 'custom' || p.packed
          ? null
          : all.find((x) => x.key === p.key);
      return t ? { ...p, quantity: Math.max(1, t.quantity(party)) } : p;
    });
  }

  return normalizePacking(packing, party, people, id);
}

export interface ItemSplitPortion {
  personId: string | null;
  quantity: number;
}

/**
 * Splits an item into multiple portions, assignable to different people.
 * For example, 2 tents can be split into:
 * - 1 tent for Sami
 * - 1 tent for Lina
 */
export function splitItem(
  packing: readonly PackingItem[],
  itemId: string,
  splits: readonly ItemSplitPortion[],
  id: NewId,
): PackingItem[] {
  const target = packing.find((p) => p.id === itemId);
  if (!target) return [...packing];

  // Personal items cannot be split
  if (isPersonal(target)) return [...packing];

  const validSplits = splits.filter((s) => s.quantity > 0);
  if (!validSplits.length) return [...packing];

  const replacementItems: PackingItem[] = validSplits.map((split) => ({
    ...target,
    id: id(),
    quantity: split.quantity,
    personId: split.personId,
    packed: false,
  }));

  const index = packing.findIndex((p) => p.id === itemId);
  const next = [...packing];
  next.splice(index, 1, ...replacementItems);
  return next;
}

/**
 * Assigns all shared items in a category to a specific person.
 * For example, assigning 'kitchen' to Sami assigns all cooking gear to Sami.
 */
export function assignCategory(
  packing: readonly PackingItem[],
  category: PackingCategory,
  personId: string | null,
): PackingItem[] {
  return packing.map((item) => {
    if (item.category === category && !isPersonal(item)) {
      return { ...item, personId };
    }
    return item;
  });
}

/**
 * Distributes unassigned shared items evenly among people in the party.
 * Personal items (sleeping gear, clothing) are preserved.
 */
export function distributeSharedGear(
  packing: readonly PackingItem[],
  people: readonly Person[],
): PackingItem[] {
  if (!people.length) return [...packing];

  let personIndex = 0;
  return packing.map((item) => {
    if (!isPersonal(item) && item.personId === null) {
      const assignedPerson = people[personIndex % people.length];
      personIndex++;
      return { ...item, personId: assignedPerson.id };
    }
    return item;
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
