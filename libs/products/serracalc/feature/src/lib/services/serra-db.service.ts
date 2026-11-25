import { inject, Injectable, PLATFORM_ID } from '@angular/core';
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

  private open(): Promise<IDBDatabase> {
    this.database ??= databaseName(
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
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }),
    );
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
