import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  type ProjectItem,
  SAMPLE_PROJECTS,
} from '@ah/products/lighting/domain';

const STORE = 'projects';

/**
 * Projects live in IndexedDB, so LuxPath works offline on site. The portfolio's
 * demo uses its own database (ADR-0002), so trying it never touches the data of
 * someone who uses LuxPath for real.
 */
@Injectable({ providedIn: 'root' })
export class LightingDbService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly name =
    inject(APP_MODE, { optional: true }) === 'embedded-demo'
      ? 'ah-demo-lighting'
      : 'luxpath_lighting_db_v1';
  private database: Promise<IDBDatabase> | null = null;
  /** True when this visit created the database: only then seed the samples. */
  private created = false;

  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => {
        this.created = true;
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.database;
  }

  private async request<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<ProjectItem[]> {
    if (!this.isBrowser) {
      return SAMPLE_PROJECTS;
    }
    let projects = (await this.request('readonly', (s) =>
      s.getAll(),
    )) as ProjectItem[];
    if (projects.length === 0 && this.created) {
      projects = await this.seedDefaults();
    }
    // Oldest first, the same on every load.
    return [...projects].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** The project last opened on this device, so a reload reopens it. */
  get lastProjectId(): string | null {
    try {
      return this.isBrowser ? localStorage.getItem(this.activeKey) : null;
    } catch {
      return null;
    }
  }

  set lastProjectId(id: string | null) {
    try {
      if (this.isBrowser && id) localStorage.setItem(this.activeKey, id);
    } catch {
      // Blocked storage: the first project opens next time instead.
    }
  }

  private get activeKey(): string {
    return `${this.name}.active-project`;
  }

  async saveProject(project: ProjectItem): Promise<void> {
    if (this.isBrowser) {
      await this.request('readwrite', (s) => s.put(project));
    }
  }

  async deleteProject(id: string): Promise<void> {
    if (this.isBrowser) {
      await this.request('readwrite', (s) => s.delete(id));
    }
  }

  async seedDefaults(): Promise<ProjectItem[]> {
    if (!this.isBrowser) {
      return SAMPLE_PROJECTS;
    }
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      for (const project of SAMPLE_PROJECTS) {
        tx.objectStore(STORE).put(project);
      }
      tx.oncomplete = () => resolve(SAMPLE_PROJECTS);
      tx.onerror = () => reject(tx.error);
    });
  }
}
