import { computed, Injectable, inject, signal } from '@angular/core';
import {
  DemoFarmRemote,
  type FarmAccess,
  type FarmRemote,
  type FarmSetup,
  type FarmWeek,
  GreenhouseAuth,
  type InviteResult,
  RemoteError,
  type SignInError,
  type SignUpResult,
  SupabaseFarmRemote,
} from '@ah/products/greenhouse/data-access';
import {
  type Absence,
  addDays,
  type Greenhouse,
  type IsoDate,
  type PlanEntry,
  type Role,
  startOfWeek,
  type Team,
  todayOnFarm,
  type Worker,
} from '@ah/products/greenhouse/domain';

/** The manager's (or HR's) Supabase session, apart from the field app's. */
@Injectable({ providedIn: 'root' })
export class DashboardAuth extends GreenhouseAuth {
  protected readonly storageKey = 'greenhouse-dashboard-auth';
}

/**
 * Where the dashboard is:
 * - `starting`: reading the stored session;
 * - `signed-out`: the sign-in screen;
 * - `no-farm`: signed in, on no farm yet (make one, or wait for an invite);
 * - `loading` / `ready`: the farm is loading or loaded;
 * - `failed`: the farm couldn't load (see `problem`).
 */
export type DashboardPhase =
  'starting' | 'signed-out' | 'no-farm' | 'loading' | 'ready' | 'failed';

/** What went wrong with the last call, for the banner. */
export type DashboardProblem = 'offline' | 'auth' | 'rejected' | 'server';

const EMPTY_SETUP: FarmSetup = {
  greenhouses: [],
  teams: [],
  workers: [],
  pay: [],
  members: [],
  invitations: [],
};

/**
 * The farm the dashboard shows: its setup, the week on screen, and every
 * change the manager makes. Changes show at once and go to the server
 * behind them; if the server refuses one, the banner says so and the farm
 * reloads as the server has it.
 */
@Injectable({ providedIn: 'root' })
export class FarmStore {
  private readonly auth = inject(DashboardAuth);
  private remote: FarmRemote | null = null;
  private weekRequest = 0;

  /** Whether this build signs in to a server (false: the demo farm). */
  readonly online = this.auth.enabled;
  readonly account = this.auth.account;

  readonly phase = signal<DashboardPhase>('starting');
  readonly problem = signal<DashboardProblem | null>(null);
  readonly farms = signal<FarmAccess[]>([]);
  readonly access = signal<FarmAccess | null>(null);
  readonly setup = signal<FarmSetup>(EMPTY_SETUP);
  readonly weekStart = signal<IsoDate>(startOfWeek(todayOnFarm()));
  readonly week = signal<FarmWeek | null>(null);
  /** Writes on their way to the server. */
  readonly pending = signal(0);

  readonly role = computed<Role | null>(() => this.access()?.role ?? null);
  readonly canEdit = computed(() => this.role() === 'manager');
  readonly canSeePay = computed(
    () => this.role() === 'manager' || this.role() === 'hr',
  );
  readonly saving = computed(() => this.pending() > 0);
  /** The week's data, once it matches the week on screen. */
  readonly currentWeek = computed(() => {
    const week = this.week();
    return week?.weekStart === this.weekStart() ? week : null;
  });

  private started: Promise<void> | null = null;

  /** Reads the stored session (or opens the demo farm). Safe to call twice. */
  start(): Promise<void> {
    this.started ??= this.boot();
    return this.started;
  }

  private async boot(): Promise<void> {
    if (!this.online) {
      this.remote = new DemoFarmRemote();
      await this.openFarms();
      return;
    }
    const account = await this.auth.restore();
    if (!account) {
      this.phase.set('signed-out');
      return;
    }
    this.remote = new SupabaseFarmRemote(await this.auth.getClient());
    await this.openFarms();
  }

  async signIn(email: string, password: string): Promise<SignInError | null> {
    const error = await this.auth.signIn(email, password);
    if (error) return error;
    this.remote = new SupabaseFarmRemote(await this.auth.getClient());
    await this.openFarms();
    return null;
  }

  async signUp(email: string, password: string): Promise<SignUpResult> {
    const result = await this.auth.signUp(email, password);
    if (result) return result;
    this.remote = new SupabaseFarmRemote(await this.auth.getClient());
    await this.openFarms();
    return null;
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.remote = null;
    this.farms.set([]);
    this.access.set(null);
    this.setup.set(EMPTY_SETUP);
    this.week.set(null);
    this.problem.set(null);
    this.phase.set('signed-out');
  }

  async createFarm(farmName: string, managerName: string): Promise<boolean> {
    const remote = this.remote;
    if (!remote) return false;
    try {
      const farmId = await remote.createFarm(farmName, managerName);
      await this.openFarms(farmId);
      return true;
    } catch (error) {
      this.fail(error);
      return false;
    }
  }

  /** Loads the person's farms and opens one. */
  async openFarms(preferred?: string): Promise<void> {
    const remote = this.remote;
    if (!remote) return;
    this.phase.set('loading');
    this.problem.set(null);
    try {
      const farms = await remote.farms();
      this.farms.set(farms);
      const access =
        farms.find((f) => f.farmId === preferred) ??
        farms.find((f) => f.farmId === this.access()?.farmId) ??
        farms[0];
      if (!access) {
        this.phase.set('no-farm');
        return;
      }
      await this.openFarm(access);
    } catch (error) {
      this.fail(error);
      this.phase.set('failed');
    }
  }

  async openFarm(access: FarmAccess): Promise<void> {
    const remote = this.remote;
    if (!remote) return;
    this.access.set(access);
    this.phase.set('loading');
    try {
      const [setup] = await Promise.all([
        remote.loadSetup(access.farmId),
        this.loadWeek(),
      ]);
      this.setup.set(setup);
      this.phase.set('ready');
    } catch (error) {
      this.fail(error);
      this.phase.set('failed');
    }
  }

  async showWeek(weekStart: IsoDate): Promise<void> {
    this.weekStart.set(startOfWeek(weekStart));
    try {
      await this.loadWeek();
    } catch (error) {
      this.fail(error);
    }
  }

  /** Reloads the farm as the server has it. */
  async reload(): Promise<void> {
    const access = this.access();
    if (access) await this.openFarm(access);
    else await this.openFarms();
  }

  // Setup -----------------------------------------------------------------

  saveGreenhouse(greenhouse: Greenhouse): Promise<boolean> {
    this.setup.update((s) => ({
      ...s,
      greenhouses: upsert(s.greenhouses, greenhouse).sort(byName),
    }));
    return this.write((r, farm) => r.saveGreenhouse(farm, greenhouse));
  }

  saveTeam(team: Team): Promise<boolean> {
    this.setup.update((s) => ({
      ...s,
      teams: upsert(s.teams, team).sort(byName),
    }));
    return this.write((r, farm) => r.saveTeam(farm, team));
  }

  deleteTeam(teamId: string): Promise<boolean> {
    this.setup.update((s) => ({
      ...s,
      teams: s.teams.filter((t) => t.id !== teamId),
      workers: s.workers.map((w) =>
        w.teamId === teamId ? { ...w, teamId: null } : w,
      ),
    }));
    return this.write((r, farm) => r.deleteTeam(farm, teamId));
  }

  saveWorker(worker: Worker, hourlyRate: number | null): Promise<boolean> {
    this.setup.update((s) => ({
      ...s,
      workers: upsert(s.workers, worker),
      pay:
        hourlyRate === null
          ? s.pay
          : [
              ...s.pay.filter((p) => p.workerId !== worker.id),
              { workerId: worker.id, hourlyRate },
            ],
    }));
    return this.write((r, farm) => r.saveWorker(farm, worker, hourlyRate));
  }

  // The week ------------------------------------------------------------

  /** Replaces a greenhouse's row of the week on screen. */
  savePlanRow(greenhouseId: string, entries: PlanEntry[]): Promise<boolean> {
    const weekStart = this.weekStart();
    this.patchWeek((w) => ({
      ...w,
      plan: [
        ...w.plan.filter((p) => p.greenhouseId !== greenhouseId),
        ...entries,
      ],
    }));
    return this.write((r, farm) =>
      r.savePlanRow(farm, weekStart, greenhouseId, entries),
    );
  }

  /** Replaces the week's plan with last week's, day for day. */
  async copyLastWeek(): Promise<boolean> {
    const remote = this.remote;
    const farmId = this.access()?.farmId;
    if (!remote || !farmId) return false;
    const weekStart = this.weekStart();
    let last: FarmWeek;
    try {
      last = await remote.loadWeek(farmId, addDays(weekStart, -7));
    } catch (error) {
      this.fail(error);
      return false;
    }
    const plan = last.plan.map((p) => ({ ...p, weekStart }));
    const greenhouses = new Set([
      ...plan.map((p) => p.greenhouseId),
      ...(this.currentWeek()?.plan ?? []).map((p) => p.greenhouseId),
    ]);
    this.patchWeek((w) => ({ ...w, plan }));
    return this.write((r, farm) =>
      Promise.all(
        [...greenhouses].map((id) =>
          r.savePlanRow(
            farm,
            weekStart,
            id,
            plan.filter((p) => p.greenhouseId === id),
          ),
        ),
      ).then(() => undefined),
    );
  }

  saveAbsence(absence: Absence): Promise<boolean> {
    this.patchWeek((w) => ({ ...w, absences: upsert(w.absences, absence) }));
    return this.write((r, farm) => r.saveAbsence(farm, absence));
  }

  deleteAbsence(absenceId: string): Promise<boolean> {
    this.patchWeek((w) => ({
      ...w,
      absences: w.absences.filter((a) => a.id !== absenceId),
    }));
    return this.write((r, farm) => r.deleteAbsence(farm, absenceId));
  }

  // People --------------------------------------------------------------

  async invite(
    email: string,
    role: Role,
    fullName: string,
  ): Promise<InviteResult | null> {
    let result: InviteResult | null = null;
    const ok = await this.write(async (r, farm) => {
      result = await r.invite(farm, email, role, fullName);
    });
    if (!ok) return null;
    // The server decides whether it was a member or an invitation.
    await this.refreshSetup();
    return result;
  }

  cancelInvitation(email: string): Promise<boolean> {
    this.setup.update((s) => ({
      ...s,
      invitations: s.invitations.filter((i) => i.email !== email),
    }));
    return this.write((r, farm) => r.cancelInvitation(farm, email));
  }

  removeMember(userId: string): Promise<boolean> {
    this.setup.update((s) => ({
      ...s,
      members: s.members.filter((m) => m.userId !== userId),
      teams: s.teams.map((t) =>
        t.supervisorId === userId ? { ...t, supervisorId: null } : t,
      ),
    }));
    return this.write((r, farm) => r.removeMember(farm, userId));
  }

  dismissProblem(): void {
    this.problem.set(null);
  }

  // ---------------------------------------------------------------------

  private async loadWeek(): Promise<void> {
    const remote = this.remote;
    const farmId = this.access()?.farmId;
    if (!remote || !farmId) return;
    const request = ++this.weekRequest;
    const week = await remote.loadWeek(farmId, this.weekStart());
    // A later request (the manager clicked on) wins.
    if (request === this.weekRequest) this.week.set(week);
  }

  /** Reloads the setup and the week in place, without the loading screen. */
  private async refresh(): Promise<void> {
    await Promise.all([
      this.refreshSetup(),
      this.loadWeek().catch((error: unknown) => this.fail(error)),
    ]);
  }

  private async refreshSetup(): Promise<void> {
    const remote = this.remote;
    const farmId = this.access()?.farmId;
    if (!remote || !farmId) return;
    try {
      this.setup.set(await remote.loadSetup(farmId));
    } catch (error) {
      this.fail(error);
    }
  }

  private patchWeek(change: (week: FarmWeek) => FarmWeek): void {
    this.week.update((w) =>
      w && w.weekStart === this.weekStart() ? change(w) : w,
    );
  }

  /** Sends a change; on failure, says why and reloads what the server has. */
  private async write(
    send: (remote: FarmRemote, farmId: string) => Promise<void>,
  ): Promise<boolean> {
    const remote = this.remote;
    const farmId = this.access()?.farmId;
    if (!remote || !farmId) return false;
    this.pending.update((n) => n + 1);
    try {
      await send(remote, farmId);
      return true;
    } catch (error) {
      this.fail(error);
      void this.refresh();
      return false;
    } finally {
      this.pending.update((n) => n - 1);
    }
  }

  private fail(error: unknown): void {
    this.problem.set(error instanceof RemoteError ? error.kind : 'server');
  }
}

function upsert<T extends { id: string }>(list: readonly T[], item: T): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

/** A new row's id, made here so re-sending a save is harmless. */
export function newId(): string {
  return crypto.randomUUID();
}
