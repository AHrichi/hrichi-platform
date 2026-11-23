import type { IsoDate, Weekday } from './dates';

/**
 * The Greenhouse Labor Planner's data model, shared by the manager's
 * dashboard, the supervisors' field app and the Supabase schema
 * (`apps/products/greenhouse/supabase/migrations`). Field names are camelCase
 * here and snake_case in Postgres; the data-access lib maps between them.
 *
 * Units: kilograms, hours, and Tunisian dinars (TND, 3 decimals: millimes).
 */

/** Crops the app knows by name; anything else is `other`. */
export const CROPS = [
  'tomato',
  'cherry-tomato',
  'pepper',
  'cucumber',
  'melon',
  'strawberry',
  'other',
] as const;
export type Crop = (typeof CROPS)[number];

export function isCrop(value: unknown): value is Crop {
  return (CROPS as readonly unknown[]).includes(value);
}

export const ROLES = ['manager', 'supervisor', 'hr'] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return (ROLES as readonly unknown[]).includes(value);
}

/** Someone who can sign in to a farm, and as what. */
export interface Member {
  userId: string;
  fullName: string;
  role: Role;
}

/** Someone a manager asked onto the farm who has no account yet. */
export interface Invitation {
  email: string;
  fullName: string;
  role: Role;
}

export interface Greenhouse {
  id: string;
  name: string;
  areaM2: number;
  crop: Crop;
  /** What a full crate of this crop weighs, so supervisors can count crates. */
  kgPerCrate: number;
  active: boolean;
}

export interface Team {
  id: string;
  name: string;
  /** The supervisor's user id; null while the team has none. */
  supervisorId: string | null;
}

export interface Worker {
  id: string;
  fullName: string;
  teamId: string | null;
  /** Printed as a QR code on the worker's badge. Unique per farm. */
  badgeCode: string;
  active: boolean;
}

/**
 * A worker's pay, kept apart from `Worker` so only managers and HR ever load
 * it: the supervisors' phones carry the roster, never the wages.
 */
export interface WorkerPay {
  workerId: string;
  /** TND per hour. */
  hourlyRate: number;
}

/** A day off, sick leave or any reason a worker isn't there (inclusive). */
export interface Absence {
  id: string;
  workerId: string;
  from: IsoDate;
  to: IsoDate;
  /** Leave, sickness, anything; optional and free text. */
  reason?: string;
}

/**
 * One cell of the weekly production plan: what one greenhouse should yield
 * on one day, and which team picks it.
 */
export interface PlanEntry {
  weekStart: IsoDate;
  day: Weekday;
  greenhouseId: string;
  teamId: string;
  expectedKg: number;
  hoursPerDay: number;
}

/**
 * One worker's output in one greenhouse on one day, as a supervisor logs it.
 * `kg` is the accepted weight; rejected crates are counted, not weighed in.
 * The id is made on the device, so syncing the same entry twice is harmless.
 */
export interface WorkLog {
  id: string;
  date: IsoDate;
  workerId: string;
  /** The worker's team when the entry was logged, kept for history. */
  teamId: string | null;
  greenhouseId: string;
  kg: number;
  crates: number;
  rejectedCrates: number;
  hours: number;
  /** When the supervisor saved it on the device (ISO instant). */
  recordedAt: string;
  /** When the server accepted it; null until then. */
  syncedAt: string | null;
}

export interface HygieneItem {
  id: string;
  /** The item's wording in each language the farm uses. */
  label: { ar: string; fr: string; en: string };
  /** Whether a photo must back the answer. */
  photoRequired: boolean;
  /** Where it comes in the checklist, lowest first. */
  sortOrder: number;
  active: boolean;
}

export interface HygieneAnswer {
  itemId: string;
  ok: boolean;
  note?: string;
  /** Paths in the `hygiene-photos` storage bucket. */
  photoPaths: string[];
}

export interface HygieneCheck {
  id: string;
  date: IsoDate;
  greenhouseId: string;
  supervisorId: string;
  answers: HygieneAnswer[];
  /** Null while the supervisor hasn't signed it off. */
  signedAt: string | null;
}

export interface WeeklyTarget {
  weekStart: IsoDate;
  /** TND per accepted kg. */
  costPerKgTarget: number;
  kgTarget: number;
}
