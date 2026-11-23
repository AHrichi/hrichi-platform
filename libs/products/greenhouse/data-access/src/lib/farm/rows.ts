import {
  type Absence,
  type Greenhouse,
  isCrop,
  type Member,
  type PlanEntry,
  type Role,
  ROLES,
  type Team,
  type Weekday,
  type Worker,
  type WorkLog,
} from '@ah/products/greenhouse/domain';

/**
 * Postgres rows (snake_case) to the domain model (camelCase) and back.
 * PostgREST sends numeric columns as numbers or strings depending on size,
 * so every number goes through `Number`.
 */
export type Row = Record<string, unknown>;

const text = (value: unknown): string => String(value ?? '');
const maybe = (value: unknown): string | null =>
  value === null || value === undefined ? null : String(value);

export const GREENHOUSE_COLUMNS =
  'id, name, area_m2, crop, kg_per_crate, active';
export const TEAM_COLUMNS = 'id, name, supervisor_id';
export const WORKER_COLUMNS = 'id, full_name, team_id, badge_code, active';

export function greenhouseFrom(row: Row): Greenhouse {
  return {
    id: text(row['id']),
    name: text(row['name']),
    areaM2: Number(row['area_m2']),
    crop: isCrop(row['crop']) ? row['crop'] : 'other',
    kgPerCrate: Number(row['kg_per_crate']),
    active: Boolean(row['active']),
  };
}

export function greenhouseRow(farmId: string, g: Greenhouse): Row {
  return {
    id: g.id,
    farm_id: farmId,
    name: g.name,
    area_m2: g.areaM2,
    crop: g.crop,
    kg_per_crate: g.kgPerCrate,
    active: g.active,
  };
}

export function teamFrom(row: Row): Team {
  return {
    id: text(row['id']),
    name: text(row['name']),
    supervisorId: maybe(row['supervisor_id']),
  };
}

export function teamRow(farmId: string, t: Team): Row {
  return {
    id: t.id,
    farm_id: farmId,
    name: t.name,
    supervisor_id: t.supervisorId,
  };
}

export function workerFrom(row: Row): Worker {
  return {
    id: text(row['id']),
    fullName: text(row['full_name']),
    teamId: maybe(row['team_id']),
    badgeCode: text(row['badge_code']),
    active: Boolean(row['active']),
  };
}

export function workerRow(farmId: string, w: Worker): Row {
  return {
    id: w.id,
    farm_id: farmId,
    full_name: w.fullName,
    team_id: w.teamId,
    badge_code: w.badgeCode,
    active: w.active,
  };
}

export function memberFrom(row: Row): Member {
  const role = row['role'];
  return {
    userId: text(row['user_id']),
    fullName: text(row['full_name']),
    role: (ROLES as readonly unknown[]).includes(role)
      ? (role as Role)
      : 'supervisor',
  };
}

export function absenceFrom(row: Row): Absence {
  const reason = maybe(row['reason']);
  return {
    id: text(row['id']),
    workerId: text(row['worker_id']),
    from: text(row['from_date']),
    to: text(row['to_date']),
    ...(reason ? { reason } : {}),
  };
}

export function absenceRow(farmId: string, a: Absence): Row {
  return {
    id: a.id,
    farm_id: farmId,
    worker_id: a.workerId,
    from_date: a.from,
    to_date: a.to,
    reason: a.reason ?? null,
  };
}

export function planFrom(row: Row): PlanEntry {
  return {
    weekStart: text(row['week_start']),
    day: Number(row['day']) as Weekday,
    greenhouseId: text(row['greenhouse_id']),
    teamId: text(row['team_id']),
    expectedKg: Number(row['expected_kg']),
    hoursPerDay: Number(row['hours_per_day']),
  };
}

export function planRow(farmId: string, p: PlanEntry): Row {
  return {
    farm_id: farmId,
    week_start: p.weekStart,
    day: p.day,
    greenhouse_id: p.greenhouseId,
    team_id: p.teamId,
    expected_kg: p.expectedKg,
    hours_per_day: p.hoursPerDay,
  };
}

/**
 * A `work_totals()` row as a work log: a day's work for a team in a
 * greenhouse, which is all the picking rates and the dashboard need.
 */
export function totalsFrom(row: Row): WorkLog {
  const date = text(row['work_date']);
  const teamId = maybe(row['team_id']);
  const greenhouseId = text(row['greenhouse_id']);
  return {
    id: `${date}|${teamId ?? '-'}|${greenhouseId}`,
    date,
    workerId: '',
    teamId,
    greenhouseId,
    kg: Number(row['kg']),
    crates: Number(row['crates']),
    rejectedCrates: Number(row['rejected_crates']),
    hours: Number(row['hours']),
    recordedAt: `${date}T00:00:00.000Z`,
    syncedAt: `${date}T00:00:00.000Z`,
  };
}
