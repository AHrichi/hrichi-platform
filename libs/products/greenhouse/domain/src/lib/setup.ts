import { type IsoDate, isIsoDate } from './dates';
import { type Crop, isCrop, type Worker } from './models';
import { normalizeBadge } from './work-log';

/**
 * Checks for what a manager types on the setup screens. Each returns the
 * cleaned value or the list of what's wrong, by field, so the screen can
 * mark the right box. The database enforces the same rules.
 */
export type SetupResult<T, F extends string> =
  | { ok: true; value: T }
  | { ok: false; errors: Partial<Record<F, SetupProblem>> };

export type SetupProblem = 'required' | 'invalid' | 'taken' | 'order';

/** What a badge code may hold once normalized (as in the schema). */
const BADGE_PATTERN = /^[A-Z0-9_-]{1,32}$/;

/** A number from a text box, French commas included; NaN if it isn't one. */
export function parseAmount(text: string): number {
  const clean = text.trim().replace(/\s/g, '').replace(',', '.');
  return clean === '' ? Number.NaN : Number(clean);
}

function name(text: string, max: number): string | null {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length >= 1 && clean.length <= max ? clean : null;
}

/** The next badge after the farm's highest `PREFIX-0042`-style code. */
export function nextBadgeCode(
  workers: readonly Pick<Worker, 'badgeCode'>[],
  prefix = 'GH-',
): string {
  const pattern = new RegExp(`^${prefix.replace(/[-]/g, '\\-')}(\\d+)$`);
  const highest = workers.reduce((max, w) => {
    const match = pattern.exec(normalizeBadge(w.badgeCode));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

export interface GreenhouseInput {
  name: string;
  area: string;
  crop: string;
  kgPerCrate: string;
}

export function checkGreenhouse(
  input: GreenhouseInput,
  takenNames: readonly string[],
): SetupResult<
  { name: string; areaM2: number; crop: Crop; kgPerCrate: number },
  keyof GreenhouseInput
> {
  const errors: Partial<Record<keyof GreenhouseInput, SetupProblem>> = {};
  const clean = name(input.name, 60);
  if (!clean) errors.name = input.name.trim() ? 'invalid' : 'required';
  else if (sameName(takenNames, clean)) errors.name = 'taken';
  const areaM2 = parseAmount(input.area);
  if (!(areaM2 > 0)) errors.area = input.area.trim() ? 'invalid' : 'required';
  if (!isCrop(input.crop)) errors.crop = 'required';
  const kgPerCrate = parseAmount(input.kgPerCrate);
  if (!(kgPerCrate > 0)) {
    errors.kgPerCrate = input.kgPerCrate.trim() ? 'invalid' : 'required';
  }
  if (Object.keys(errors).length > 0 || !clean || !isCrop(input.crop)) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: { name: clean, areaM2, crop: input.crop, kgPerCrate },
  };
}

export function checkTeamName(
  text: string,
  takenNames: readonly string[],
): SetupResult<string, 'name'> {
  const clean = name(text, 60);
  if (!clean) {
    return {
      ok: false,
      errors: { name: text.trim() ? 'invalid' : 'required' },
    };
  }
  if (sameName(takenNames, clean)) {
    return { ok: false, errors: { name: 'taken' } };
  }
  return { ok: true, value: clean };
}

export interface WorkerInput {
  fullName: string;
  badgeCode: string;
  /** TND an hour; empty leaves pay unset. */
  hourlyRate: string;
}

export function checkWorker(
  input: WorkerInput,
  takenBadges: readonly string[],
): SetupResult<
  { fullName: string; badgeCode: string; hourlyRate: number | null },
  keyof WorkerInput
> {
  const errors: Partial<Record<keyof WorkerInput, SetupProblem>> = {};
  const fullName = name(input.fullName, 120);
  if (!fullName) {
    errors.fullName = input.fullName.trim() ? 'invalid' : 'required';
  }
  const badgeCode = normalizeBadge(input.badgeCode);
  if (!badgeCode) errors.badgeCode = 'required';
  else if (!BADGE_PATTERN.test(badgeCode)) errors.badgeCode = 'invalid';
  else if (takenBadges.some((b) => normalizeBadge(b) === badgeCode)) {
    errors.badgeCode = 'taken';
  }
  let hourlyRate: number | null = null;
  if (input.hourlyRate.trim()) {
    hourlyRate = parseAmount(input.hourlyRate);
    if (!(hourlyRate >= 0)) errors.hourlyRate = 'invalid';
  }
  if (Object.keys(errors).length > 0 || !fullName) return { ok: false, errors };
  return { ok: true, value: { fullName, badgeCode, hourlyRate } };
}

export interface AbsenceInput {
  workerId: string;
  from: string;
  to: string;
}

export function checkAbsence(
  input: AbsenceInput,
): SetupResult<
  { workerId: string; from: IsoDate; to: IsoDate },
  keyof AbsenceInput
> {
  const errors: Partial<Record<keyof AbsenceInput, SetupProblem>> = {};
  if (!input.workerId) errors.workerId = 'required';
  if (!isIsoDate(input.from)) errors.from = input.from ? 'invalid' : 'required';
  // One day off when only the first day is given.
  const to = input.to || input.from;
  if (!isIsoDate(to)) errors.to = 'invalid';
  else if (isIsoDate(input.from) && to < input.from) errors.to = 'order';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { workerId: input.workerId, from: input.from, to },
  };
}

/** A loose email check; Supabase Auth has the last word. */
export function checkEmail(text: string): string | null {
  const clean = text.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : null;
}

function sameName(taken: readonly string[], clean: string): boolean {
  const key = clean.toLocaleLowerCase();
  return taken.some((t) => t.trim().toLocaleLowerCase() === key);
}

export interface TargetInput {
  costPerKg: string;
  kgPerWeek: string;
}

/**
 * A weekly target: labour cost per kg above 0 (the schema's numeric(8, 3),
 * so under 100,000 TND) and kg per week at 0 or more.
 */
export function checkTarget(
  input: TargetInput,
): SetupResult<
  { costPerKgTarget: number; kgTarget: number },
  keyof TargetInput
> {
  const errors: Partial<Record<keyof TargetInput, SetupProblem>> = {};
  const costPerKgTarget = parseAmount(input.costPerKg);
  if (!(costPerKgTarget > 0 && costPerKgTarget < 100_000)) {
    errors.costPerKg = input.costPerKg.trim() ? 'invalid' : 'required';
  }
  const kgTarget = parseAmount(input.kgPerWeek);
  if (!(kgTarget >= 0 && kgTarget < 1e10)) {
    errors.kgPerWeek = input.kgPerWeek.trim() ? 'invalid' : 'required';
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      costPerKgTarget: Math.round(costPerKgTarget * 1000) / 1000,
      kgTarget: Math.round(kgTarget),
    },
  };
}
