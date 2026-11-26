import 'fake-indexeddb/auto';
import '@angular/compiler';
import { Injector, PLATFORM_ID } from '@angular/core';
import { IDBFactory } from 'fake-indexeddb';
import { SAMPLE_PROJECTS } from '@ah/products/serracalc/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SerraDbService } from './serra-db.service';

const NAME = 'serracalc_db_v1';

function service(): SerraDbService {
  return Injector.create({
    providers: [SerraDbService, { provide: PLATFORM_ID, useValue: 'browser' }],
  }).get(SerraDbService);
}

/** Another tab's connection, as an older or newer SerraCalc opens it. */
function openTab(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('projects')) {
        request.result.createObjectStore('projects', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

describe('SerraDbService, with SerraCalc open in another tab', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('says an older tab holds the database, then opens once it lets go', async () => {
    // Version 1 never closes for an upgrade: builds before this didn't.
    const old = await openTab(1);
    const db = service();
    let projects: unknown[] | null = null;
    void db.getAllProjects().then((p) => (projects = p));

    await vi.waitFor(() => expect(db.state()).toBe('blocked'));
    expect(projects).toBeNull();

    old.close();
    await vi.waitFor(() => expect(projects).toEqual([]));
    expect(db.state()).toBe('ok');
  });

  it('lets a newer tab upgrade, then asks for a reload and stops saving', async () => {
    const db = service();
    await db.saveProject(structuredClone(SAMPLE_PROJECTS[0]));
    expect(db.state()).toBe('ok');

    // The newer tab isn't blocked: this one closes its connection.
    const newer = await openTab(3);
    expect(newer.version).toBe(3);
    expect(db.state()).toBe('replaced');
    await expect(
      db.saveProject(structuredClone(SAMPLE_PROJECTS[1])),
    ).rejects.toThrow();
    newer.close();
  });
});
