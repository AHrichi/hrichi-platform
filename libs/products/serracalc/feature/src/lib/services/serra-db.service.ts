import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import {
  type GreenhouseProject,
  SAMPLE_PROJECTS,
  type SiteRecord,
} from '@ah/products/serracalc/domain';

const STORE = 'projects';
/** Sites' shared plants and tariffs, by site name (since version 2). */
const SITES = 'sites';
const VERSION = 2;
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
    if (this.isBrowser) {
      await this.request('readwrite', (s) => s.put(site), SITES);
    }
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
    if (this.isBrowser) {
      await this.request('readwrite', (s) => s.put(project));
    }
  }

  async deleteProject(id: string): Promise<void> {
    if (this.isBrowser) {
      await this.request('readwrite', (s) => s.delete(id));
    }
  }

  /** Puts the samples back as they were; the user's projects stay. */
  async seedSamples(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      for (const project of SAMPLE_PROJECTS) {
        tx.objectStore(STORE).put(structuredClone(project));
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
