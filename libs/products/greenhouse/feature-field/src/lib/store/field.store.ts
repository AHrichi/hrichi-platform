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
  DemoFieldRemote,
  FieldDatabase,
  type FieldRemote,
  FieldRepository,
  type LogRow,
  type LogStatus,
  type Roster,
  SupabaseFieldRemote,
  WorkLogSync,
} from '@ah/products/greenhouse/data-access';
import {
  createWorkLog,
  type Greenhouse,
  type IsoDate,
  sampleFarm,
  todayOnFarm,
  type Worker,
  type WorkLog,
  type WorkLogDraft,
} from '@ah/products/greenhouse/domain';
import { FIELD_DB, GREENHOUSE_SUPABASE } from '../field-config';
import {
  nextRun,
  PERIODIC_SYNC_MS,
  SAVE_DEBOUNCE_MS,
  stateAfter,
  type SyncState,
} from './sync-schedule';

/** A roster older than this is refreshed in the background when online. */
const ROSTER_MAX_AGE_MS = 12 * 60 * 60 * 1000;

interface FieldState {
  status: 'loading' | 'ready' | 'no-roster' | 'failed';
  roster: Roster | null;
  date: IsoDate;
  /** Today's entries, every greenhouse. */
  logs: LogRow[];
  counts: Record<LogStatus, number>;
  lastSyncAt: string | null;
  sync: SyncState;
  online: boolean;
  /** The portfolio demo: sample farm, pretend server. */
  demo: boolean;
  /** Demo only: the pretend server is out of reach. */
  noSignal: boolean;
}

/** A random v4 UUID, made on the phone so a re-sent entry is recognised. */
function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
    roster: null,
    date: todayOnFarm(),
    logs: [],
    counts: { pending: 0, synced: 0, rejected: 0 },
    lastSyncAt: null,
    sync: 'idle',
    online: true,
    demo: false,
    noSignal: false,
  }),
  withComputed(({ roster, logs }) => ({
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
    const supabase = inject(GREENHOUSE_SUPABASE);
    const doc = inject(DOCUMENT);
    const win = doc.defaultView;

    let repo: FieldRepository | null = null;
    let remote: FieldRemote | null = null;
    let demoRemote: DemoFieldRemote | null = null;
    let engine: WorkLogSync | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let periodic: ReturnType<typeof setInterval> | null = null;
    let failures = 0;
    const cleanups: (() => void)[] = [];

    async function createRemote(): Promise<FieldRemote | null> {
      if (mode === 'embedded-demo') {
        demoRemote = new DemoFieldRemote(sampleFarm(todayOnFarm()));
        return demoRemote;
      }
      if (!supabase) return null;
      // Loaded only when there is a server to talk to.
      const { createClient } = await import('@supabase/supabase-js');
      return new SupabaseFieldRemote(
        createClient(supabase.url, supabase.anonKey),
      );
    }

    async function refresh(): Promise<void> {
      if (!repo) return;
      const date = todayOnFarm();
      const [logs, counts, lastSyncAt] = await Promise.all([
        repo.logsOn(date),
        repo.countByStatus(),
        repo.lastSyncAt(),
      ]);
      patchState(store, { date, logs, counts, lastSyncAt });
    }

    async function downloadRoster(): Promise<Roster | null> {
      if (!repo || !remote) return null;
      const roster = await remote.fetchRoster();
      await repo.saveRoster(roster);
      patchState(store, { roster, status: 'ready' });
      return roster;
    }

    function isOnline(): boolean {
      return win?.navigator.onLine !== false;
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
      if (!engine) return;
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
      const result = await engine.flush();
      await refresh();
      const next = nextRun(result, failures);
      failures = next.failures;
      patchState(store, { sync: stateAfter(result) });
      if (next.delayMs !== null) requestSync(next.delayMs);
    }

    function listen(): void {
      if (!win) return;
      const on = <K extends keyof WindowEventMap>(
        target: Window,
        type: K,
        handler: () => void,
      ) => {
        target.addEventListener(type, handler);
        cleanups.push(() => target.removeEventListener(type, handler));
      };
      on(win, 'online', () => {
        patchState(store, { online: true });
        failures = 0;
        requestSync(0);
      });
      on(win, 'offline', () => {
        patchState(store, { online: false, sync: 'offline' });
      });
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
          patchState(store, {
            demo: mode === 'embedded-demo',
            online: isOnline(),
            sync: remote ? 'idle' : 'no-server',
          });
          listen();

          let roster = await repo.roster();
          if (!roster) {
            roster = await downloadRoster().catch(() => null);
          } else if (
            remote &&
            isOnline() &&
            Date.now() - Date.parse(roster.fetchedAt) > ROSTER_MAX_AGE_MS
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
