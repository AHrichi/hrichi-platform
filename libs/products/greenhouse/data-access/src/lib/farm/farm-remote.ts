import type {
  Absence,
  Greenhouse,
  Invitation,
  IsoDate,
  Member,
  PlanEntry,
  Role,
  Team,
  Worker,
  WorkerPay,
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
}

/** Days of history a week brings with it: four weeks of picking rates. */
export const HISTORY_DAYS = 28;

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

  /** Writes these cells of the plan; other cells stay as they are. */
  savePlan(farmId: string, entries: readonly PlanEntry[]): Promise<void>;
  saveAbsence(farmId: string, absence: Absence): Promise<void>;
  deleteAbsence(farmId: string, absenceId: string): Promise<void>;

  invite(
    farmId: string,
    email: string,
    role: Role,
    fullName: string,
  ): Promise<InviteResult>;
  cancelInvitation(farmId: string, email: string): Promise<void>;
  removeMember(farmId: string, userId: string): Promise<void>;
}
