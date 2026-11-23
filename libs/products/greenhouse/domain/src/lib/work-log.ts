import { type IsoDate, isIsoDate } from './dates';
import type { Worker, WorkLog } from './models';
import { MAX_SHIFT_HOURS } from './planning';

/**
 * Above this many kg per hour an entry is probably a typo (250 typed as
 * 2500). The supervisor is asked to check it; it isn't refused.
 */
export const HIGH_KG_PER_HOUR = 150;

/** A work-log entry as the supervisor fills it in; empty fields are null. */
export interface WorkLogDraft {
  date: IsoDate;
  workerId: string | null;
  greenhouseId: string | null;
  /** Crates picked, rejected ones included. */
  crates: number | null;
  /** Accepted kg when weighed; null to work it out from the crates. */
  kg: number | null;
  rejectedCrates: number | null;
  hours: number | null;
}

export type WorkLogField =
  | 'date'
  | 'worker'
  | 'greenhouse'
  | 'crates'
  | 'kg'
  | 'rejectedCrates'
  | 'hours';

export type WorkLogError =
  | 'required'
  | 'invalid'
  | 'negative'
  | 'not-whole'
  | 'more-than-crates'
  | 'too-long';

export type WorkLogWarning = 'high-rate';

export interface WorkLogCheck {
  valid: boolean;
  errors: Partial<Record<WorkLogField, WorkLogError>>;
  warnings: WorkLogWarning[];
  /** The accepted kg the entry will save, once it's valid. */
  kg: number | null;
}

/**
 * Accepted kg: the weighed kg when there is one, otherwise the accepted
 * crates times what a crate of this crop weighs. Rounded to 10 g.
 */
export function acceptedKg(
  draft: Pick<WorkLogDraft, 'kg' | 'crates' | 'rejectedCrates'>,
  kgPerCrate: number,
): number | null {
  if (draft.kg !== null) return round2(draft.kg);
  if (draft.crates === null) return null;
  return round2((draft.crates - (draft.rejectedCrates ?? 0)) * kgPerCrate);
}

/** Field-by-field errors, plus warnings that need a second look. */
export function checkWorkLog(
  draft: WorkLogDraft,
  kgPerCrate: number,
): WorkLogCheck {
  const errors: WorkLogCheck['errors'] = {};
  if (!isIsoDate(draft.date)) errors.date = 'invalid';
  if (!draft.workerId) errors.worker = 'required';
  if (!draft.greenhouseId) errors.greenhouse = 'required';

  const crates = countError(draft.crates);
  if (crates) errors.crates = crates;
  const rejected = countError(draft.rejectedCrates);
  if (rejected) {
    errors.rejectedCrates = rejected;
  } else if ((draft.rejectedCrates ?? 0) > (draft.crates ?? 0)) {
    errors.rejectedCrates = 'more-than-crates';
  }

  if (draft.kg === null && draft.crates === null) {
    // One of the two is needed; the crates field is the one shown first.
    errors.crates ??= 'required';
  } else if (draft.kg !== null) {
    if (!Number.isFinite(draft.kg)) errors.kg = 'invalid';
    else if (draft.kg < 0) errors.kg = 'negative';
  }

  if (draft.hours === null) errors.hours = 'required';
  else if (!Number.isFinite(draft.hours)) errors.hours = 'invalid';
  else if (draft.hours <= 0) errors.hours = 'required';
  else if (draft.hours > MAX_SHIFT_HOURS) errors.hours = 'too-long';

  const valid = Object.keys(errors).length === 0;
  const kg = valid ? acceptedKg(draft, kgPerCrate) : null;
  const warnings: WorkLogWarning[] =
    kg !== null && draft.hours && kg / draft.hours > HIGH_KG_PER_HOUR
      ? ['high-rate']
      : [];
  return { valid, errors, warnings, kg };
}

/** A saved entry from a valid draft. Throws on an invalid one. */
export function createWorkLog(
  draft: WorkLogDraft,
  context: {
    id: string;
    teamId: string | null;
    kgPerCrate: number;
    recordedAt: string;
  },
): WorkLog {
  const check = checkWorkLog(draft, context.kgPerCrate);
  if (!check.valid || check.kg === null) {
    throw new RangeError(`Invalid work log: ${JSON.stringify(check.errors)}`);
  }
  return {
    id: context.id,
    date: draft.date,
    workerId: draft.workerId as string,
    teamId: context.teamId,
    greenhouseId: draft.greenhouseId as string,
    kg: check.kg,
    crates: draft.crates ?? 0,
    rejectedCrates: draft.rejectedCrates ?? 0,
    hours: draft.hours as number,
    recordedAt: context.recordedAt,
    syncedAt: null,
  };
}

/**
 * A badge code from whatever the QR code or keyboard gave: a bare code
 * (`gh-0042`), a `badge:` prefix or a link ending in the code. Upper case,
 * no spaces. Empty when there is nothing usable.
 */
export function normalizeBadge(raw: string): string {
  let code = raw.trim();
  const lastSlash = code.lastIndexOf('/');
  if (lastSlash >= 0) code = code.slice(lastSlash + 1);
  code = code.replace(/^badge:/i, '');
  return code.replace(/\s+/g, '').toUpperCase();
}

/** The active worker whose badge this is, or null. */
export function findWorkerByBadge(
  workers: readonly Worker[],
  raw: string,
): Worker | null {
  const code = normalizeBadge(raw);
  if (!code) return null;
  return (
    workers.find((w) => w.active && normalizeBadge(w.badgeCode) === code) ??
    null
  );
}

function countError(value: number | null): WorkLogError | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return 'invalid';
  if (value < 0) return 'negative';
  if (!Number.isInteger(value)) return 'not-whole';
  return null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
