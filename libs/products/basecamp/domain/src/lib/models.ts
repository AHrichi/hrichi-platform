/** The kind of trip, which shapes the packing list. */
export const TRIP_TYPES = [
  'tent',
  'beach',
  'mountain',
  'desert',
  'winter',
] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const PACKING_CATEGORIES = [
  'shelter',
  'sleep',
  'kitchen',
  'water',
  'clothing',
  'light',
  'firstAid',
  'stargazing',
] as const;
export type PackingCategory = (typeof PACKING_CATEGORIES)[number];

export interface Person {
  id: string;
  name: string;
}

export interface Campsite {
  lat: number;
  lng: number;
  /** A place name, from the search or typed; empty until known. */
  name: string;
}

/**
 * One thing to bring. Items from the lists carry a `key` the copy names in
 * every language; items the user adds carry their own `label`.
 */
export interface PackingItem {
  id: string;
  key?: string;
  label?: string;
  category: PackingCategory;
  quantity: number;
  packed: boolean;
  /** Who brings it, or null for anyone. */
  personId: string | null;
  source: 'list' | 'weather' | 'custom';
}

export interface Trip {
  id: string;
  name: string;
  type: TripType;
  /** The first day, `YYYY-MM-DD`. */
  start: string;
  /** Nights out, 1 to 14. */
  nights: number;
  campsite: Campsite;
  people: Person[];
  packing: PackingItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type GearCondition = 'good' | 'worn' | 'repair';

/** Something the user owns. A `key` links it to the lists' items. */
export interface GearItem {
  id: string;
  name: string;
  key?: string;
  category: PackingCategory;
  condition: GearCondition;
  notes: string;
}

/** One day of forecast for the campsite. */
export interface DayForecast {
  /** `YYYY-MM-DD`, the campsite's local date. */
  date: string;
  /** WMO weather code. */
  code: number;
  maxC: number;
  minC: number;
  rainMm: number;
  /** Highest chance of rain in the day, %. */
  rainChance: number;
  windKmh: number;
  gustKmh: number;
  /** Mean cloud cover, %. */
  cloudPct: number;
}

export interface Forecast {
  lat: number;
  lng: number;
  /** When it was fetched, ISO. */
  fetchedAt: string;
  days: DayForecast[];
}
