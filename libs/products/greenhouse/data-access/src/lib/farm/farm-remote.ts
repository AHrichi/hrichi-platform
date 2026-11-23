import type {
  Absence,
  Greenhouse,
  HygieneCheck,
  HygieneItem,
  Invitation,
  IsoDate,
  Member,
  PlanEntry,
  Role,
  Team,
  TeamWeekTotals,
  WeeklyTarget,
  Worker,
  WorkerPay,
  WorkerTotals,
  WorkLog,
} from '@ah/products/greenhouse/domain';

/** A farm the signed-in person belongs to, and as what. */
export interface FarmAccess {
  farmId: string;
  farmName: string;
  role: Role;
}

/** The farm's setup: what changes rarely. */
export interface FarmSetup {
  greenhouses: Greenhouse[];
  teams: Team[];
  workers: Worker[];
  /** Empty for anyone but managers and HR (row-level security). */
  pay: WorkerPay[];
  members: Member[];
  /** Empty for anyone but managers. */
  invitations: Invitation[];
}

/** One week's plan, the absences that touch it, and its history. */
export interface FarmWeek {
  weekStart: IsoDate;
  plan: PlanEntry[];
  absences: Absence[];
  /**
   * Work done from `HISTORY_DAYS` before the week to its end, one entry
   * per day, team and greenhouse (totals, not single workers' logs).
   */
  history: WorkLog[];
  /** The target in force that week (the latest set on or before it). */
  target: WeeklyTarget | null;
}

/** Days of history a week brings with it: four weeks of picking rates. */
export const HISTORY_DAYS = 28;

/** How the farm picked over a period, and the targets it had. */
export interface FarmPerformance {
  /** First day (a Monday), included. */
  from: IsoDate;
  /** The Monday after the last week, excluded. */
  to: IsoDate;
  teamWeeks: TeamWeekTotals[];
  workers: WorkerTotals[];
  /** Every target set up to `to`'s week (this week's, too), oldest first. */
  targets: WeeklyTarget[];
}

/** A day's hygiene checks and the checklist they answer. */
export interface FarmHygiene {
  date: IsoDate;
  /** The whole checklist, inactive items included, in order. */
  items: HygieneItem[];
  /** The checks started that day, one per greenhouse at most. */
  checks: HygieneCheck[];
}

/** How long a photo link the dashboard gets stays valid. */
export const PHOTO_URL_SECONDS = 60 * 60;

export type InviteResult = 'added' | 'updated' | 'invited';

/**
 * The server as the manager's dashboard sees it. Every write is an upsert
 * keyed by an id made on the client, so sending one twice is harmless.
 * Throws a `RemoteError`.
 */
export interface FarmRemote {
  /** The farms the signed-in person belongs to. */
  farms(): Promise<FarmAccess[]>;
  /** Makes a farm with the signed-in person as its manager. */
  createFarm(farmName: string, managerName: string): Promise<string>;

  loadSetup(farmId: string): Promise<FarmSetup>;
  loadWeek(farmId: string, weekStart: IsoDate): Promise<FarmWeek>;

  saveGreenhouse(farmId: string, greenhouse: Greenhouse): Promise<void>;
  saveTeam(farmId: string, team: Team): Promise<void>;
  deleteTeam(farmId: string, teamId: string): Promise<void>;
  /** `hourlyRate` null leaves the worker's pay as it is. */
  saveWorker(
    farmId: string,
    worker: Worker,
    hourlyRate: number | null,
  ): Promise<void>;

  /**
   * Replaces one greenhouse's row of a week's plan with `entries` (all of
   * them for that week and greenhouse), at once.
   */
  savePlanRow(
    farmId: string,
    weekStart: IsoDate,
    greenhouseId: string,
    entries: readonly PlanEntry[],
  ): Promise<void>;
  saveAbsence(farmId: string, absence: Absence): Promise<void>;
  deleteAbsence(farmId: string, absenceId: string): Promise<void>;

  /** Weekly team totals and worker totals for `[from, to)`, and targets. */
  loadPerformance(
    farmId: string,
    from: IsoDate,
    to: IsoDate,
  ): Promise<FarmPerformance>;
  /** Sets the target from `target.weekStart` until the next one. */
  saveTarget(farmId: string, target: WeeklyTarget): Promise<void>;

  loadHygiene(farmId: string, date: IsoDate): Promise<FarmHygiene>;
  saveHygieneItem(farmId: string, item: HygieneItem): Promise<void>;
  /**
   * Links to view photos in the private bucket, valid for an hour, by
   * path. A photo that can't be found has no link.
   */
  photoUrls(paths: readonly string[]): Promise<Map<string, string>>;

  invite(
    farmId: string,
    email: string,
    role: Role,
    fullName: string,
  ): Promise<InviteResult>;
  cancelInvitation(farmId: string, email: string): Promise<void>;
  removeMember(farmId: string, userId: string): Promise<void>;
}
