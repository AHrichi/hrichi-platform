import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import { readSyncState, syncStateKey } from '@ah/platform/sync';
import {
  applyPulled,
  changedParts,
  type GreenhouseProject,
  projectParts,
  SAMPLE_PROJECTS,
  SERRA_SYNC,
  type SerraChange,
  type SiteRecord,
  sitePart,
} from '@ah/products/serracalc/domain';
import { recordId, type StoredRecord, type SyncRecord } from '@ah/shared/sync';

const STORE = 'projects';
/** Sites' shared plants and tariffs, by site name (since version 2). */
const SITES = 'sites';
/** Changes waiting to go to the cloud, while sync is on (since version 3). */
const OUTBOX = 'outbox';
const VERSION = 3;

interface Queued {
  /** `kind`, a NUL, then `key`: one waiting version per record. */
  readonly id: string;
  readonly record: SyncRecord;
}
const SUNLIGHT_KEY = 'serracalc.sunlight';

/**
 * `blocked`: an older SerraCalc open in another tab holds the database, so
 * this one can't upgrade it yet. `replaced`: a newer one in another tab
 * needed it, so this tab let go and can no longer save. `stalled`: the
 * browser hasn't answered at all yet (see `STALL_MS`).
 */
export type SerraDbState = 'ok' | 'blocked' | 'replaced' | 'stalled';

/**
 * How long an open may go without any answer before the shell says so. A
 * browser can leave it waiting with no event at all: no success, no error and
 * no `blocked`, behind another request that never finishes.
 */
export const STALL_MS = 5000;

/**
 * Projects live in IndexedDB, so SerraCalc works offline in the field. The
 * portfolio's demo uses its own database (ADR-0002), so trying it never
 * touches the data of someone who uses SerraCalc for real.
 */
@Injectable({ providedIn: 'root' })
export class SerraDbService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mode = inject(APP_MODE, { optional: true }) ?? 'standalone';
  private name: string | null = null;
  private database: Promise<IDBDatabase> | null = null;

  /** Whether the database is in reach; the shell explains when it isn't. */
  readonly state = signal<SerraDbState>('ok');

  /** Counts changes put in the outbox, so sync pushes them soon. */
  readonly outboxChanged = signal(0);

  private open(): Promise<IDBDatabase> {
    if (this.database) {
      return this.database;
    }
    const stall = setTimeout(() => this.state.set('stalled'), STALL_MS);
    const answered = () => clearTimeout(stall);
    this.database = databaseName(
      this.mode,
      'serracalc',
      'serracalc_db_v1',
    ).then(
      (name) =>
        new Promise((resolve, reject) => {
          this.name = name;
          const request = indexedDB.open(name, VERSION);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE)) {
              db.createObjectStore(STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SITES)) {
              db.createObjectStore(SITES, { keyPath: 'name' });
            }
            if (!db.objectStoreNames.contains(OUTBOX)) {
              db.createObjectStore(OUTBOX, { keyPath: 'id' });
            }
          };
          // Another tab still has the old version open. The upgrade waits
          // for it to close (or reload), and succeeds then.
          request.onblocked = () => {
            answered();
            this.state.set('blocked');
          };
          request.onsuccess = () => {
            const db = request.result;
            // A newer SerraCalc wants to upgrade: let go, so it isn't
            // blocked in turn, and ask for a reload here.
            db.onversionchange = () => {
              db.close();
              this.state.set('replaced');
            };
            this.state.set('ok');
            resolve(db);
          };
          request.onerror = () => reject(request.error);
        }),
    );
    // Success clears a `stalled` notice too: the open was only slow.
    this.database.then(answered, answered);
    return this.database;
  }

  private async request<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
    storeName = STORE,
  ): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = run(
        db.transaction(storeName, mode).objectStore(storeName),
      );
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<GreenhouseProject[]> {
    if (!this.isBrowser) {
      return [];
    }
    const projects = (await this.request('readonly', (s) =>
      s.getAll(),
    )) as GreenhouseProject[];
    return [...projects].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getAllSites(): Promise<SiteRecord[]> {
    if (!this.isBrowser) {
      return [];
    }
    return (await this.request(
      'readonly',
      (s) => s.getAll(),
      SITES,
    )) as SiteRecord[];
  }

  async saveSite(site: SiteRecord): Promise<void> {
    if (!this.isBrowser) return;
    await this.change([SITES], (tx, queue) => {
      tx.objectStore(SITES).put(site);
      queue([sitePart(site)]);
    });
  }

  /** The project last opened on this device, so a reload reopens it. */
  get lastProjectId(): string | null {
    try {
      return this.activeKey ? localStorage.getItem(this.activeKey) : null;
    } catch {
      return null;
    }
  }

  set lastProjectId(id: string | null) {
    try {
      if (this.activeKey && id) localStorage.setItem(this.activeKey, id);
    } catch {
      // Blocked storage: the first project opens next time instead.
    }
  }

  /** Sunlight mode is a choice about this screen, so it stays on the device. */
  get sunlight(): boolean {
    try {
      return this.isBrowser && localStorage.getItem(SUNLIGHT_KEY) === '1';
    } catch {
      return false;
    }
  }

  set sunlight(on: boolean) {
    try {
      if (on) localStorage.setItem(SUNLIGHT_KEY, '1');
      else localStorage.removeItem(SUNLIGHT_KEY);
    } catch {
      // Blocked storage: the mode lasts until the page closes.
    }
  }

  private get activeKey(): string | null {
    return this.name && `${this.name}.active-project`;
  }

  async saveProject(project: GreenhouseProject): Promise<void> {
    if (!this.isBrowser) return;
    await this.change([STORE], (tx, queue) => {
      const store = tx.objectStore(STORE);
      const before = store.get(project.id);
      before.onsuccess = () => {
        store.put(project);
        queue(changedParts(before.result ?? null, project));
      };
    });
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.isBrowser) return;
    await this.change([STORE], (tx, queue) => {
      const store = tx.objectStore(STORE);
      const before = store.get(id);
      before.onsuccess = () => {
        store.delete(id);
        queue(changedParts(before.result ?? null, null));
      };
    });
  }

  /** Puts the samples back as they were; the user's projects stay. */
  async seedSamples(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    await this.change([STORE], (tx, queue) => {
      const store = tx.objectStore(STORE);
      for (const project of SAMPLE_PROJECTS) {
        const before = store.get(project.id);
        before.onsuccess = () => {
          store.put(structuredClone(project));
          queue(changedParts(before.result ?? null, project));
        };
      }
    });
  }

  // Cloud sync (ADR-0032). While it is on, every change above also puts its
  // records in the outbox, in the same transaction, so none is ever lost
  // between the two; `@ah/platform/sync` pushes them.

  /** The device that writes the outbox: set while sync is on here. */
  private syncDevice(): string | null {
    return this.mode === 'standalone'
      ? (readSyncState(syncStateKey(SERRA_SYNC.app))?.deviceId ?? null)
      : null;
  }

  /**
   * Runs a change in one transaction with the outbox, if sync is on; `queue`
   * puts the records it changed there, as this device's, now.
   */
  private async change(
    stores: string[],
    run: (
      tx: IDBTransaction,
      queue: (changes: readonly SerraChange[]) => void,
    ) => void,
  ): Promise<void> {
    const device = this.syncDevice();
    const db = await this.open();
    let queued = 0;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        device ? [...stores, OUTBOX] : stores,
        'readwrite',
      );
      const at = new Date().toISOString();
      run(tx, (changes) => {
        if (!device) return;
        for (const change of changes) {
          tx.objectStore(OUTBOX).put(queuedFor(change, device, at));
          queued++;
        }
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    if (queued > 0) this.outboxChanged.update((n) => n + 1);
  }

  /** Changes not pushed yet, oldest first. */
  async syncOutbox(): Promise<SyncRecord[]> {
    if (!this.isBrowser) return [];
    const queued = (await this.request(
      'readonly',
      (s) => s.getAll(),
      OUTBOX,
    )) as Queued[];
    return queued
      .map((q) => q.record)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  }

  /** Takes pushed records off the outbox, unless edited again since. */
  async syncAcknowledge(
    records: readonly { kind: string; key: string; updatedAt: string }[],
  ): Promise<void> {
    if (!this.isBrowser || records.length === 0) return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(OUTBOX, 'readwrite');
      const outbox = tx.objectStore(OUTBOX);
      for (const record of records) {
        const id = recordId(record);
        const held = outbox.get(id);
        held.onsuccess = () => {
          const queued = held.result as Queued | undefined;
          if (
            queued &&
            Date.parse(queued.record.updatedAt) === Date.parse(record.updatedAt)
          ) {
            outbox.delete(id);
          }
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Saves what other devices changed, checked as a backup is. */
  async syncApply(records: readonly StoredRecord[]): Promise<void> {
    if (!this.isBrowser || records.length === 0) return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE, SITES], 'readwrite');
      const projectStore = tx.objectStore(STORE);
      const siteStore = tx.objectStore(SITES);
      const allProjects = projectStore.getAll();
      const allSites = siteStore.getAll();
      allSites.onsuccess = () => {
        const local = {
          projects: new Map(
            (allProjects.result as GreenhouseProject[]).map((p) => [p.id, p]),
          ),
          sites: new Map(
            (allSites.result as SiteRecord[]).map((s) => [s.name, s]),
          ),
        };
        const applied = applyPulled(local, records);
        for (const id of applied.projects) {
          projectStore.put(local.projects.get(id));
        }
        for (const id of applied.deletedProjects) projectStore.delete(id);
        for (const name of applied.sites) siteStore.put(local.sites.get(name));
        for (const name of applied.deletedSites) siteStore.delete(name);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Puts every project and site in the outbox as `deviceId`'s, each with
   * the time it last changed, so the later edit wins on the server: when
   * this device joins a space.
   */
  async syncQueueAll(deviceId: string): Promise<void> {
    if (!this.isBrowser) return;
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE, SITES, OUTBOX], 'readwrite');
      const outbox = tx.objectStore(OUTBOX);
      const projects = tx.objectStore(STORE).getAll();
      projects.onsuccess = () => {
        for (const project of projects.result as GreenhouseProject[]) {
          for (const part of projectParts(project)) {
            outbox.put(queuedFor(part, deviceId, project.updatedAt));
          }
        }
      };
      const sites = tx.objectStore(SITES).getAll();
      sites.onsuccess = () => {
        for (const site of sites.result as SiteRecord[]) {
          outbox.put(queuedFor(sitePart(site), deviceId, site.updatedAt));
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Sync is off here: nothing waits to go. */
  async syncClearOutbox(): Promise<void> {
    if (this.isBrowser) {
      await this.request('readwrite', (s) => s.clear(), OUTBOX);
    }
  }
}

/** A change as the outbox holds it, written by `device` at `at`. */
function queuedFor(change: SerraChange, device: string, at: string): Queued {
  const updatedAt = Number.isNaN(Date.parse(at))
    ? new Date().toISOString()
    : new Date(at).toISOString();
  return {
    id: recordId(change),
    record: {
      kind: change.kind,
      key: change.key,
      updatedAt,
      by: device,
      ...(change.deleted
        ? { deleted: true }
        : { data: structuredClone(change.data) }),
    },
  };
}
