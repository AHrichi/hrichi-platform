import { computed, InjectionToken, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  DemoFarmRemote,
  type FarmAccess,
  type FarmHygiene,
  type FarmPerformance,
  type FarmRemote,
  type FarmSetup,
  type FarmWeek,
  type InviteResult,
  RemoteError,
  type RemoteErrorKind,
  type SignInError,
  type SignUpResult,
  SupabaseFarmRemote,
} from '@ah/products/greenhouse/data-access';
import {
  type Absence,
  addDays,
  type Greenhouse,
  type HygieneItem,
  type IsoDate,
  lastWeeks,
  newId,
  type PlanEntry,
  type Role,
  STANDARD_HYGIENE_ITEMS,
  startOfWeek,
  type Team,
  targetFor,
  todayOnFarm,
  upsertById,
  type WeeklyTarget,
  type Worker,
  withoutId,
} from '@ah/products/greenhouse/domain';
import { DashboardAuth } from '../auth/dashboard-auth';

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

/** The server behind the demo build; tests swap in one with no delay. */
export const DEMO_FARM_REMOTE = new InjectionToken<() => FarmRemote>(
  'DEMO_FARM_REMOTE',
  { providedIn: 'root', factory: () => () => new DemoFarmRemote() },
);

interface FarmState {
  phase: DashboardPhase;
  /** Why the last call failed, for the banner; null when all is well. */
  problem: RemoteErrorKind | null;
  farms: FarmAccess[];
  access: FarmAccess | null;
  setup: FarmSetup;
  weekStart: IsoDate;
  week: FarmWeek | null;
  /** Writes on their way to the server. */
  pending: number;
  /** Whole weeks the performance screen looks back over. */
  performanceWeeks: number;
  /** Those weeks' totals; null until the screen asks for them. */
  performance: FarmPerformance | null;
  /** The day the hygiene screen shows. */
  hygieneDate: IsoDate;
  /** That day's checks and the checklist; null until asked for. */
  hygiene: FarmHygiene | null;
}

/** The performance screen opens on two months. */
export const DEFAULT_PERFORMANCE_WEEKS = 8;

const EMPTY_SETUP: FarmSetup = {
  greenhouses: [],
  teams: [],
  workers: [],
  pay: [],
  members: [],
  invitations: [],
};

const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

/** What a write returned, or that it failed (the banner says why). */
type Outcome<T> = { ok: true; value: T } | { ok: false };

/**
 * The farm the dashboard shows: its setup, the week on screen, and every
 * change the manager makes. A change shows at once and goes to the server
 * behind it; if the server refuses, the banner says why and the farm
 * reloads as the server has it. The demo build talks to the sample farm in
 * memory; a build with a Supabase project signs in to it.
 */
export const FarmStore = signalStore(
  { providedIn: 'root' },
  withState<FarmState>({
    phase: 'starting',
    problem: null,
    farms: [],
    access: null,
    setup: EMPTY_SETUP,
    weekStart: startOfWeek(todayOnFarm()),
    week: null,
    pending: 0,
    performanceWeeks: DEFAULT_PERFORMANCE_WEEKS,
    performance: null,
    hygieneDate: todayOnFarm(),
    hygiene: null,
  }),
  withProps(() => {
    const auth = inject(DashboardAuth);
    return {
      _auth: auth,
      _demoRemote: inject(DEMO_FARM_REMOTE),
      /** Whether this build signs in to a server (false: the demo farm). */
      online: auth.enabled,
      account: auth.account.asReadonly(),
    };
  }),
  withComputed(({ access, pending, week, weekStart }) => {
    const role = computed<Role | null>(() => access()?.role ?? null);
    return {
      role,
      canEdit: computed(() => role() === 'manager'),
      canSeePay: computed(() => role() === 'manager' || role() === 'hr'),
      saving: computed(() => pending() > 0),
      /** The week's data, once it matches the week on screen. */
      currentWeek: computed(() => {
        const w = week();
        return w?.weekStart === weekStart() ? w : null;
      }),
    };
  }),
  withMethods((store) => {
    let remote: FarmRemote | null = null;
    let weekRequest = 0;
    let performanceRequest = 0;
    let hygieneRequest = 0;
    let started: Promise<void> | null = null;

    const fail = (error: unknown): void =>
      patchState(store, {
        problem: error instanceof RemoteError ? error.kind : 'server',
      });

    const farmId = (): string | null => store.access()?.farmId ?? null;

    async function loadWeek(): Promise<void> {
      const id = farmId();
      if (!remote || !id) return;
      const request = ++weekRequest;
      const week = await remote.loadWeek(id, store.weekStart());
      // A later request (the manager clicked on) wins.
      if (request === weekRequest) patchState(store, { week });
    }

    async function refreshSetup(): Promise<void> {
      const id = farmId();
      if (!remote || !id) return;
      try {
        patchState(store, { setup: await remote.loadSetup(id) });
      } catch (error) {
        fail(error);
      }
    }

    async function loadPerformance(): Promise<void> {
      const id = farmId();
      if (!remote || !id) return;
      const request = ++performanceRequest;
      const weeks = lastWeeks(todayOnFarm(), store.performanceWeeks());
      const from = weeks[0] ?? startOfWeek(todayOnFarm());
      const performance = await remote.loadPerformance(
        id,
        from,
        addDays(from, 7 * weeks.length),
      );
      if (request === performanceRequest) patchState(store, { performance });
    }

    async function loadHygiene(): Promise<void> {
      const id = farmId();
      if (!remote || !id) return;
      const request = ++hygieneRequest;
      const hygiene = await remote.loadHygiene(id, store.hygieneDate());
      if (request === hygieneRequest) patchState(store, { hygiene });
    }

    const patchHygiene = (change: (h: FarmHygiene) => FarmHygiene): void => {
      const hygiene = store.hygiene();
      if (hygiene) patchState(store, { hygiene: change(hygiene) });
    };

    /** Reloads what is on screen in place, without the loading screen. */
    async function refresh(): Promise<void> {
      await Promise.all([
        refreshSetup(),
        loadWeek().catch(fail),
        store.performance() ? loadPerformance().catch(fail) : undefined,
        store.hygiene() ? loadHygiene().catch(fail) : undefined,
      ]);
    }

    /** Sends a change; on failure, says why and reloads what the server has. */
    async function send<T>(
      call: (r: FarmRemote, farm: string) => Promise<T>,
    ): Promise<Outcome<T>> {
      const id = farmId();
      if (!remote || !id) return { ok: false };
      patchState(store, { pending: store.pending() + 1 });
      try {
        return { ok: true, value: await call(remote, id) };
      } catch (error) {
        fail(error);
        void refresh();
        return { ok: false };
      } finally {
        patchState(store, { pending: store.pending() - 1 });
      }
    }

    const write = async (
      call: (r: FarmRemote, farm: string) => Promise<unknown>,
    ): Promise<boolean> => (await send(call)).ok;

    const patchSetup = (change: (s: FarmSetup) => FarmSetup): void =>
      patchState(store, { setup: change(store.setup()) });

    const patchWeek = (change: (w: FarmWeek) => FarmWeek): void => {
      const week = store.week();
      if (week && week.weekStart === store.weekStart()) {
        patchState(store, { week: change(week) });
      }
    };

    async function openFarm(access: FarmAccess): Promise<void> {
      if (!remote) return;
      patchState(store, {
        access,
        phase: 'loading',
        performance: null,
        hygiene: null,
      });
      try {
        const [setup] = await Promise.all([
          remote.loadSetup(access.farmId),
          loadWeek(),
        ]);
        patchState(store, { setup, phase: 'ready' });
      } catch (error) {
        fail(error);
        patchState(store, { phase: 'failed' });
      }
    }

    /** Loads the person's farms and opens one. */
    async function openFarms(preferred?: string): Promise<void> {
      if (!remote) return;
      patchState(store, { phase: 'loading', problem: null });
      try {
        const farms = await remote.farms();
        patchState(store, { farms });
        const access =
          farms.find((f) => f.farmId === preferred) ??
          farms.find((f) => f.farmId === farmId()) ??
          farms[0];
        if (access) await openFarm(access);
        else patchState(store, { phase: 'no-farm' });
      } catch (error) {
        fail(error);
        patchState(store, { phase: 'failed' });
      }
    }

    async function connect(): Promise<void> {
      remote = new SupabaseFarmRemote(await store._auth.getClient());
      await openFarms();
    }

    async function boot(): Promise<void> {
      try {
        if (!store.online) {
          remote = store._demoRemote();
          await openFarms();
          return;
        }
        if (await store._auth.restore()) await connect();
        else patchState(store, { phase: 'signed-out' });
      } catch (error) {
        fail(error);
        patchState(store, { phase: 'failed' });
      }
    }

    return {
      /** Reads the stored session (or opens the demo farm). Safe to call twice. */
      start(): Promise<void> {
        started ??= boot();
        return started;
      },

      async signIn(
        email: string,
        password: string,
      ): Promise<SignInError | null> {
        const error = await store._auth.signIn(email, password);
        if (!error) await connect();
        return error;
      },

      async signUp(email: string, password: string): Promise<SignUpResult> {
        const result = await store._auth.signUp(email, password);
        if (!result) await connect();
        return result;
      },

      async signOut(): Promise<void> {
        await store._auth.signOut();
        remote = null;
        patchState(store, {
          phase: 'signed-out',
          problem: null,
          farms: [],
          access: null,
          setup: EMPTY_SETUP,
          week: null,
          performance: null,
          hygiene: null,
        });
      },

      async createFarm(
        farmName: string,
        managerName: string,
      ): Promise<boolean> {
        if (!remote) return false;
        try {
          await openFarms(await remote.createFarm(farmName, managerName));
          return true;
        } catch (error) {
          fail(error);
          return false;
        }
      },

      openFarm,

      async showWeek(date: IsoDate): Promise<void> {
        patchState(store, { weekStart: startOfWeek(date) });
        try {
          await loadWeek();
        } catch (error) {
          fail(error);
        }
      },

      /** Reloads the farm as the server has it. */
      async reload(): Promise<void> {
        const access = store.access();
        if (access) await openFarm(access);
        else await openFarms();
      },

      dismissProblem(): void {
        patchState(store, { problem: null });
      },

      // Setup ---------------------------------------------------------------

      saveGreenhouse(greenhouse: Greenhouse): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          greenhouses: upsertById(s.greenhouses, greenhouse).sort(byName),
        }));
        return write((r, farm) => r.saveGreenhouse(farm, greenhouse));
      },

      saveTeam(team: Team): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          teams: upsertById(s.teams, team).sort(byName),
        }));
        return write((r, farm) => r.saveTeam(farm, team));
      },

      deleteTeam(teamId: string): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          teams: withoutId(s.teams, teamId),
          workers: s.workers.map((w) =>
            w.teamId === teamId ? { ...w, teamId: null } : w,
          ),
        }));
        return write((r, farm) => r.deleteTeam(farm, teamId));
      },

      saveWorker(worker: Worker, hourlyRate: number | null): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          workers: upsertById(s.workers, worker),
          pay:
            hourlyRate === null
              ? s.pay
              : [
                  ...s.pay.filter((p) => p.workerId !== worker.id),
                  { workerId: worker.id, hourlyRate },
                ],
        }));
        return write((r, farm) => r.saveWorker(farm, worker, hourlyRate));
      },

      // The week ------------------------------------------------------------

      /** Replaces a greenhouse's row of the week on screen. */
      savePlanRow(
        greenhouseId: string,
        entries: PlanEntry[],
      ): Promise<boolean> {
        const weekStart = store.weekStart();
        patchWeek((w) => ({
          ...w,
          plan: [
            ...w.plan.filter((p) => p.greenhouseId !== greenhouseId),
            ...entries,
          ],
        }));
        return write((r, farm) =>
          r.savePlanRow(farm, weekStart, greenhouseId, entries),
        );
      },

      /** Replaces the week's plan with last week's, day for day. */
      async copyLastWeek(): Promise<boolean> {
        const weekStart = store.weekStart();
        const last = await send((r, farm) =>
          r.loadWeek(farm, addDays(weekStart, -7)),
        );
        if (!last.ok) return false;
        const plan = last.value.plan.map((p) => ({ ...p, weekStart }));
        const greenhouses = new Set([
          ...plan.map((p) => p.greenhouseId),
          ...(store.currentWeek()?.plan ?? []).map((p) => p.greenhouseId),
        ]);
        patchWeek((w) => ({ ...w, plan }));
        return write((r, farm) =>
          Promise.all(
            [...greenhouses].map((id) =>
              r.savePlanRow(
                farm,
                weekStart,
                id,
                plan.filter((p) => p.greenhouseId === id),
              ),
            ),
          ),
        );
      },

      saveAbsence(absence: Absence): Promise<boolean> {
        patchWeek((w) => ({ ...w, absences: upsertById(w.absences, absence) }));
        return write((r, farm) => r.saveAbsence(farm, absence));
      },

      deleteAbsence(absenceId: string): Promise<boolean> {
        patchWeek((w) => ({
          ...w,
          absences: withoutId(w.absences, absenceId),
        }));
        return write((r, farm) => r.deleteAbsence(farm, absenceId));
      },

      // Performance -----------------------------------------------------------

      /** Loads the last `weeks` whole weeks (the same weeks again: a reload). */
      async showPerformance(
        weeks: number = store.performanceWeeks(),
      ): Promise<void> {
        patchState(store, { performanceWeeks: weeks });
        try {
          await loadPerformance();
        } catch (error) {
          fail(error);
        }
      },

      /** Sets the targets from `target.weekStart` until the next one. */
      saveTarget(target: WeeklyTarget): Promise<boolean> {
        const performance = store.performance();
        if (performance) {
          patchState(store, {
            performance: {
              ...performance,
              targets: [
                ...performance.targets.filter(
                  (t) => t.weekStart !== target.weekStart,
                ),
                target,
              ].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
            },
          });
        }
        patchWeek((w) => ({
          ...w,
          target: targetFor(
            [...(w.target ? [w.target] : []), target],
            w.weekStart,
          ),
        }));
        return write((r, farm) => r.saveTarget(farm, target));
      },

      // Hygiene ---------------------------------------------------------------

      /** Loads a day's checks (and the checklist). */
      async showHygiene(date: IsoDate = store.hygieneDate()): Promise<void> {
        patchState(store, { hygieneDate: date });
        try {
          await loadHygiene();
        } catch (error) {
          fail(error);
        }
      },

      saveHygieneItem(item: HygieneItem): Promise<boolean> {
        patchHygiene((h) => ({
          ...h,
          items: upsertById(h.items, item).sort(
            (a, b) => a.sortOrder - b.sortOrder,
          ),
        }));
        return write((r, farm) => r.saveHygieneItem(farm, item));
      },

      /** Starts an empty farm's checklist from the standard items. */
      async addStandardChecklist(): Promise<boolean> {
        const items = STANDARD_HYGIENE_ITEMS.map(
          (standard, i): HygieneItem => ({
            id: newId(),
            label: { ...standard.label },
            photoRequired: standard.photoRequired,
            sortOrder: i + 1,
            active: true,
          }),
        );
        patchHygiene((h) => ({ ...h, items: [...h.items, ...items] }));
        return write((r, farm) =>
          Promise.all(items.map((item) => r.saveHygieneItem(farm, item))),
        );
      },

      /** Links to the photos, by path; empty if they can't be had. */
      async photoUrls(paths: readonly string[]): Promise<Map<string, string>> {
        if (!remote || paths.length === 0) return new Map();
        try {
          return await remote.photoUrls(paths);
        } catch (error) {
          fail(error);
          return new Map();
        }
      },

      // People --------------------------------------------------------------

      async invite(
        email: string,
        role: Role,
        fullName: string,
      ): Promise<InviteResult | null> {
        const outcome = await send((r, farm) =>
          r.invite(farm, email, role, fullName),
        );
        if (!outcome.ok) return null;
        // The server decides whether it was a member or an invitation.
        await refreshSetup();
        return outcome.value;
      },

      cancelInvitation(email: string): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          invitations: s.invitations.filter((i) => i.email !== email),
        }));
        return write((r, farm) => r.cancelInvitation(farm, email));
      },

      renameMember(userId: string, fullName: string): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          members: s.members
            .map((m) => (m.userId === userId ? { ...m, fullName } : m))
            .sort((a, b) => a.fullName.localeCompare(b.fullName)),
        }));
        return write((r, farm) => r.renameMember(farm, userId, fullName));
      },

      removeMember(userId: string): Promise<boolean> {
        patchSetup((s) => ({
          ...s,
          members: s.members.filter((m) => m.userId !== userId),
          teams: s.teams.map((t) =>
            t.supervisorId === userId ? { ...t, supervisorId: null } : t,
          ),
        }));
        return write((r, farm) => r.removeMember(farm, userId));
      },
    };
  }),
);
