import { DOCUMENT } from '@angular/common';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import {
  type CheckRow,
  DemoFieldRemote,
  FieldDatabase,
  type FieldRemote,
  FieldRepository,
  HygieneSync,
  type LogRow,
  type LogStatus,
  RemoteError,
  type Roster,
  type SignInError,
  type SignUpResult,
  photoPath,
  SupabaseFieldRemote,
  type SyncResult,
  WorkLogSync,
} from '@ah/products/greenhouse/data-access';
import {
  checklist,
  createWorkLog,
  type Greenhouse,
  type HygieneAnswer,
  type HygieneCheck,
  newId,
  type IsoDate,
  sampleFarm,
  todayOnFarm,
  withAnswer,
  type Worker,
  type WorkLog,
  type WorkLogDraft,
} from '@ah/products/greenhouse/domain';
import { FieldAuth } from '../auth/field-auth';
import { FIELD_DB } from '../field-config';
import { NETWORK_STATUS } from '../network/network-status';
import {
  combineResults,
  nextRun,
  PERIODIC_SYNC_MS,
  SAVE_DEBOUNCE_MS,
  stateAfter,
  type SyncState,
} from './sync-schedule';

/** A roster older than this is refreshed in the background when online. */
const ROSTER_MAX_AGE_MS = 12 * 60 * 60 * 1000;

interface FieldState {
  /** `signed-out`: the app has a server and nobody is signed in. */
  status: 'loading' | 'ready' | 'no-roster' | 'failed' | 'signed-out';
  /** The signed-in supervisor's email; null in the demo. */
  account: string | null;
  /**
   * Signing in again after a session ran out: the same account, so waiting
   * entries go out under the name of whoever logged them.
   */
  reauth: boolean;
  /** The account isn't a member of any farm yet. */
  noFarm: boolean;
  roster: Roster | null;
  date: IsoDate;
  /** Today's entries, every greenhouse. */
  logs: LogRow[];
  /** Work logs and hygiene checks together, by where they stand. */
  counts: Record<LogStatus, number>;
  /** Today's hygiene checks started on this phone. */
  checks: CheckRow[];
  lastSyncAt: string | null;
  sync: SyncState;
  online: boolean;
  /** The portfolio demo: sample farm, pretend server. */
  demo: boolean;
  /** Demo only: the pretend server is out of reach. */
  noSignal: boolean;
}

/**
 * The field app's state: the cached farm, today's entries and how sending
 * is going. Entries are saved on the phone first, always; sending happens
 * on its own when there is signal (after a save, when the network comes
 * back, when the app is reopened, and every 30 s while anything waits),
 * backing off after failures.
 */
export const FieldStore = signalStore(
  { providedIn: 'root' },
  withState<FieldState>({
    status: 'loading',
    account: null,
    reauth: false,
    noFarm: false,
    roster: null,
    date: todayOnFarm(),
    logs: [],
    counts: { pending: 0, synced: 0, rejected: 0 },
    checks: [],
    lastSyncAt: null,
    sync: 'idle',
    online: true,
    demo: false,
    noSignal: false,
  }),
  withComputed(({ roster, logs, checks }) => ({
    /** The farm's hygiene checklist: active items, in order. */
    hygieneItems: computed(() => checklist(roster()?.hygieneItems ?? [])),
    checksByGreenhouse: computed(
      () => new Map(checks().map((c) => [c.greenhouseId, c])),
    ),
    greenhouses: computed(
      () => roster()?.greenhouses.filter((g) => g.active) ?? [],
    ),
    workers: computed(() =>
      (roster()?.workers.filter((w) => w.active) ?? []).sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      ),
    ),
    teamNames: computed(
      () => new Map((roster()?.teams ?? []).map((t) => [t.id, t.name])),
    ),
    workerNames: computed(
      () => new Map((roster()?.workers ?? []).map((w) => [w.id, w.fullName])),
    ),
    logsByGreenhouse: computed(() => {
      const map = new Map<string, LogRow[]>();
      for (const row of logs()) {
        map.set(row.greenhouseId, [...(map.get(row.greenhouseId) ?? []), row]);
      }
      for (const rows of map.values()) {
        rows.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
      }
      return map;
    }),
  })),
  withMethods((store) => {
    const mode = inject(APP_MODE);
    const auth = inject(FieldAuth);
    const doc = inject(DOCUMENT);
    const network = inject(NETWORK_STATUS);

    let repo: FieldRepository | null = null;
    let remote: FieldRemote | null = null;
    let demoRemote: DemoFieldRemote | null = null;
    let engine: WorkLogSync | null = null;
    let hygiene: HygieneSync | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let periodic: ReturnType<typeof setInterval> | null = null;
    let failures = 0;
    const cleanups: (() => void)[] = [];

    async function createRemote(): Promise<FieldRemote | null> {
      if (mode === 'embedded-demo') {
        demoRemote = new DemoFieldRemote(sampleFarm(todayOnFarm()));
        return demoRemote;
      }
      if (!auth.enabled) return null;
      // The same client signs in and sends, so requests carry the session.
      return new SupabaseFieldRemote(await auth.getClient());
    }

    async function refresh(): Promise<void> {
      if (!repo) return;
      const date = todayOnFarm();
      const [logs, logCounts, checks, checkCounts, lastSyncAt] =
        await Promise.all([
          repo.logsOn(date),
          repo.countByStatus(),
          repo.checksOn(date),
          repo.countChecks(),
          repo.lastSyncAt(),
        ]);
      const counts = {
        pending: logCounts.pending + checkCounts.pending,
        synced: logCounts.synced + checkCounts.synced,
        rejected: logCounts.rejected + checkCounts.rejected,
      };
      patchState(store, { date, logs, counts, checks, lastSyncAt });
    }

    async function downloadRoster(): Promise<Roster | null> {
      if (!repo || !remote) return null;
      try {
        const roster = await remote.fetchRoster();
        await repo.saveRoster(roster);
        patchState(store, { roster, status: 'ready', noFarm: false });
        return roster;
      } catch (error) {
        // Signed in, but no manager has added this account to a farm yet.
        if (error instanceof RemoteError && error.kind === 'rejected') {
          patchState(store, { noFarm: true });
        }
        throw error;
      }
    }

    /** After a refused sync: is the session gone for good? */
    async function checkSession(): Promise<void> {
      if (!auth.enabled) return;
      const account = await auth.restore();
      if (!account) {
        patchState(store, { status: 'signed-out', reauth: true });
      }
    }

    /** The last word from the network status, kept in the store. */
    function isOnline(): boolean {
      return store.online();
    }

    function requestSync(delayMs: number): void {
      if (!engine) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        void runSync();
      }, delayMs);
    }

    async function runSync(): Promise<void> {
      if (!engine || store.status() === 'signed-out') return;
      if (!isOnline()) {
        // The `online` event starts the next run.
        patchState(store, { sync: 'offline' });
        return;
      }
      if (store.counts().pending === 0) {
        patchState(store, { sync: 'idle' });
        return;
      }
      patchState(store, { sync: 'syncing' });
      const result = await flushAll(engine);
      await refresh();
      const next = nextRun(result, failures);
      failures = next.failures;
      patchState(store, { sync: stateAfter(result) });
      if (result.stoppedBy === 'auth') await checkSession();
      if (next.delayMs !== null) requestSync(next.delayMs);
    }

    /** Work logs first, then hygiene checks unless the logs hit a wall. */
    async function flushAll(logs: WorkLogSync): Promise<SyncResult> {
      const first = await logs.flush();
      if (first.stoppedBy || !hygiene) return first;
      return combineResults(first, await hygiene.flush());
    }

    /** Saves a check on the phone; it goes out with the next sync. */
    async function keepCheck(check: HygieneCheck): Promise<CheckRow> {
      if (!repo) throw new Error('Not ready');
      const row = await repo.saveCheck(farmOf(), check);
      await refresh();
      requestSync(SAVE_DEBOUNCE_MS);
      return row;
    }

    function listen(): void {
      cleanups.push(
        network.watch((online) => {
          if (online === store.online()) return;
          if (online) {
            patchState(store, { online: true });
            failures = 0;
            requestSync(0);
          } else {
            patchState(store, { online: false, sync: 'offline' });
          }
        }),
      );
      const visible = () => {
        if (doc.visibilityState !== 'visible') return;
        void refresh().then(() => requestSync(0));
      };
      doc.addEventListener('visibilitychange', visible);
      cleanups.push(() => doc.removeEventListener('visibilitychange', visible));
      periodic = setInterval(() => {
        if (
          store.counts().pending > 0 &&
          !timer &&
          store.sync() !== 'syncing' &&
          store.sync() !== 'auth'
        ) {
          requestSync(0);
        }
      }, PERIODIC_SYNC_MS);
    }

    /** After a sign-in: download the farm and send anything waiting. */
    async function openAccount(email: string): Promise<void> {
      patchState(store, {
        account: auth.account()?.email ?? email.trim(),
        reauth: false,
        status: 'loading',
      });
      let roster = store.roster();
      try {
        roster = (await downloadRoster()) ?? roster;
      } catch {
        // Keep the cached farm, if any; the home screen explains the rest.
      }
      patchState(store, {
        roster,
        status: roster ? 'ready' : 'no-roster',
      });
      await refresh();
      failures = 0;
      requestSync(0);
    }

    function farmOf(): string {
      const farmId = store.roster()?.farmId;
      if (!farmId) throw new Error('No farm on this phone yet');
      return farmId;
    }

    return {
      async init(): Promise<void> {
        if (repo) return;
        try {
          const name = await databaseName(
            mode,
            FIELD_DB.app,
            FIELD_DB.standalone,
          );
          const db = new FieldDatabase(name);
          repo = new FieldRepository(db);
          remote = await createRemote();
          engine = remote ? new WorkLogSync(db, remote) : null;
          hygiene = remote ? new HygieneSync(db, remote) : null;
          patchState(store, {
            demo: mode === 'embedded-demo',
            online: await network.online(),
            sync: remote ? 'idle' : 'no-server',
          });
          listen();

          let roster = await repo.roster();
          if (auth.enabled) {
            // The stored session, offline or not; no network needed.
            const account = await auth.restore();
            patchState(store, { account: account?.email ?? null });
            if (!account) {
              patchState(store, { roster, status: 'signed-out' });
              await refresh();
              return;
            }
          }
          if (!roster) {
            roster = await downloadRoster().catch(() => null);
          } else if (
            remote &&
            isOnline() &&
            (Date.now() - Date.parse(roster.fetchedAt) > ROSTER_MAX_AGE_MS ||
              // Cached before the phone kept the hygiene checklist.
              roster.hygieneItems.length === 0)
          ) {
            void downloadRoster().catch(() => undefined);
          }
          patchState(store, {
            roster,
            status: roster ? 'ready' : 'no-roster',
          });
          await refresh();
          requestSync(0);
        } catch (error) {
          console.error('Greenhouse field app failed to start', error);
          patchState(store, { status: 'failed' });
        }
      },

      /** Signs in, downloads the farm and sends anything waiting. */
      async signIn(
        email: string,
        password: string,
      ): Promise<SignInError | 'other-account' | null> {
        const reauthAs = store.reauth() ? store.account() : null;
        if (reauthAs && email.trim().toLowerCase() !== reauthAs.toLowerCase()) {
          return 'other-account';
        }
        const error = await auth.signIn(email, password);
        if (error) return error;
        await openAccount(email);
        return null;
      },

      /**
       * Creates an account. With email confirmation on (the hosted
       * project), it returns `confirm-email`: the supervisor follows the
       * link, then signs in. A manager's invitation to that email makes
       * them a member as the account is created.
       */
      async signUp(email: string, password: string): Promise<SignUpResult> {
        const result = await auth.signUp(email, password);
        if (result === null) await openAccount(email);
        return result;
      },

      /** The session ran out: sign in again as the same account. */
      requireSignIn(): void {
        patchState(store, { status: 'signed-out', reauth: true });
      },

      /**
       * Signs out and forgets the farm on this phone. Refused while entries
       * wait: they belong to this account and must go out first.
       */
      async signOut(): Promise<'done' | 'pending'> {
        if (!repo) return 'done';
        if (!(await repo.clearAccount())) return 'pending';
        await auth.signOut();
        patchState(store, {
          account: null,
          reauth: false,
          noFarm: false,
          roster: null,
          status: 'signed-out',
          sync: 'idle',
        });
        await refresh();
        return 'done';
      },

      async retryRoster(): Promise<void> {
        patchState(store, { status: 'loading' });
        const roster = await downloadRoster().catch(() => null);
        patchState(store, { status: roster ? 'ready' : 'no-roster' });
      },

      findWorker(badge: string): Promise<Worker | null> {
        return repo ? repo.workerByBadge(badge) : Promise.resolve(null);
      },

      async save(
        draft: WorkLogDraft,
        worker: Worker,
        greenhouse: Greenhouse,
      ): Promise<LogRow> {
        if (!repo) throw new Error('Not ready');
        const log = createWorkLog(draft, {
          id: newId(),
          teamId: worker.teamId,
          kgPerCrate: greenhouse.kgPerCrate,
          recordedAt: new Date().toISOString(),
        });
        const row = await repo.addLog(farmOf(), log);
        await refresh();
        requestSync(SAVE_DEBOUNCE_MS);
        return row;
      },

      async update(
        id: string,
        changes: Pick<WorkLog, 'kg' | 'crates' | 'rejectedCrates' | 'hours'>,
      ): Promise<void> {
        if (!repo) return;
        await repo.updateLog(id, changes);
        await refresh();
        requestSync(SAVE_DEBOUNCE_MS);
      },

      async remove(id: string): Promise<boolean> {
        if (!repo) return false;
        const removed = await repo.deleteLog(id);
        await refresh();
        return removed;
      },

      // Hygiene checks ------------------------------------------------------

      /**
       * Today's check of a greenhouse as saved on the phone, or a new one
       * with `idIfNew` (the screen keeps it until the first save).
       */
      checkOf(greenhouseId: string, idIfNew: string): HygieneCheck {
        return (
          store.checksByGreenhouse().get(greenhouseId) ?? {
            id: idIfNew,
            date: store.date(),
            greenhouseId,
            supervisorId: auth.account()?.id ?? 'demo-supervisor',
            answers: [],
            signedAt: null,
          }
        );
      },

      /** Records an answer (fine or not, and the note). */
      async answer(check: HygieneCheck, answer: HygieneAnswer): Promise<void> {
        await keepCheck({
          ...check,
          answers: withAnswer(check.answers, answer),
        });
      },

      /** Keeps a photo on the phone and adds it to the item's answer. */
      async addPhoto(
        check: HygieneCheck,
        answer: HygieneAnswer,
        photo: Blob,
      ): Promise<void> {
        if (!repo) return;
        const path = photoPath(farmOf(), check.id);
        await repo.addPhoto({
          path,
          checkId: check.id,
          itemId: answer.itemId,
          blob: photo,
        });
        await keepCheck({
          ...check,
          answers: withAnswer(check.answers, {
            ...answer,
            photoPaths: [...answer.photoPaths, path],
          }),
        });
      },

      async removePhoto(
        check: HygieneCheck,
        answer: HygieneAnswer,
        path: string,
      ): Promise<void> {
        await keepCheck({
          ...check,
          answers: withAnswer(check.answers, {
            ...answer,
            photoPaths: answer.photoPaths.filter((p) => p !== path),
          }),
        });
        await repo?.deletePhoto(path);
      },

      /** The photo's image while the phone has it (until it is sent). */
      photo(path: string): Promise<Blob | null> {
        return repo ? repo.photo(path) : Promise.resolve(null);
      },

      /** Signs the check off; after this nothing in it changes. */
      async sign(check: HygieneCheck): Promise<void> {
        await keepCheck({ ...check, signedAt: new Date().toISOString() });
      },

      syncNow(): void {
        failures = 0;
        requestSync(0);
      },

      /** Demo only: cut the pretend server off, or bring it back. */
      setNoSignal(noSignal: boolean): void {
        if (!demoRemote) return;
        demoRemote.online = !noSignal;
        patchState(store, { noSignal });
        if (noSignal) {
          patchState(store, { sync: 'offline' });
        } else {
          failures = 0;
          requestSync(0);
        }
      },

      dispose(): void {
        if (timer) clearTimeout(timer);
        if (periodic) clearInterval(periodic);
        for (const cleanup of cleanups.splice(0)) cleanup();
      },
    };
  }),
  withHooks({
    onInit(store) {
      void store.init();
    },
    onDestroy(store) {
      store.dispose();
    },
  }),
);
