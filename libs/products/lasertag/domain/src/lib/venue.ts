import { isId } from './crypto';
import type { CountryCode } from './age';

export type Lang = 'ar' | 'fr' | 'en';
export const LANGS: readonly Lang[] = ['ar', 'fr', 'en'];
export type Currency = 'TND' | 'EUR' | 'USD';

/** A place where people play. Every row that belongs to a place names it. */
export interface Venue {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly country: CountryCode;
  readonly timezone: string;
  readonly currency: Currency;
}

export interface MapSize {
  readonly widthM: number;
  readonly lengthM: number;
}

/** A play area. Its size is optional until someone measures it. */
export interface ArenaMap {
  readonly id: string;
  readonly venueId: string;
  readonly name: string;
  readonly indoor: boolean;
  readonly size: MapSize | null;
}

/**
 * Until the warehouse is measured: 30 × 20 m, 600 m², inside the
 * 300–600 m² most indoor arenas use. The simulator (P2) plays on it.
 */
export const PLACEHOLDER_MAP_SIZE: MapSize = { widthM: 30, lengthM: 20 };

export function mapSize(
  map: ArenaMap,
): MapSize & { readonly measured: boolean } {
  return map.size
    ? { ...map.size, measured: true }
    : { ...PLACEHOLDER_MAP_SIZE, measured: false };
}

export type GearKind = 'vest' | 'blaster';
export type GearStatus = 'ready' | 'charging' | 'repair';

/**
 * A vest or a blaster. Its QR sticker carries only its id: the venue knows
 * who wears it, the gear never does. A vest names the blaster paired with it.
 */
export interface Gear {
  readonly id: string;
  readonly venueId: string;
  readonly kind: GearKind;
  /** Printed on the gear, for typing when a scan fails: `V-07`, `B-07`. */
  readonly label: string;
  readonly pairedWith: string | null;
  readonly status: GearStatus;
}

export const GEAR_QR_VERSION = 'BG1';

export function gearQr(gearId: string): string {
  return `${GEAR_QR_VERSION}.${gearId}`;
}

/** `v7`, `V 07`, `v-007` → `V-07`; null if it isn't a gear label. */
export function normalizeGearLabel(typed: string): string | null {
  const match = /^([VB])\s*-?\s*(\d{1,3})$/i.exec(typed.trim());
  if (!match) return null;
  const number = Number(match[2]);
  if (number < 1 || number > 999) return null;
  return `${match[1].toUpperCase()}-${String(number).padStart(2, '0')}`;
}

export type GearScan =
  | { readonly by: 'id'; readonly gearId: string }
  | { readonly by: 'label'; readonly label: string };

/** What a scan or a typed label points at, or null. */
export function parseGearScan(text: string): GearScan | null {
  const trimmed = text.trim();
  const prefix = `${GEAR_QR_VERSION}.`;
  if (trimmed.startsWith(prefix)) {
    const gearId = trimmed.slice(prefix.length);
    return isId(gearId) ? { by: 'id', gearId } : null;
  }
  const label = normalizeGearLabel(trimmed);
  return label ? { by: 'label', label } : null;
}
