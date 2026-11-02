import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import Dexie from 'dexie';
import { Injector, runInInjectionContext } from '@angular/core';
import { APP_MODE, type AppMode } from '@ah/platform/app-mode';
import type { StudySubject } from '@ah/products/studylm/domain';
import {
  StudyLmDatabase,
  StudyLmStorageService,
} from './studylm-storage.service';

const SUBJECT: StudySubject = {
  id: 'subj_graphs',
  title: 'Graphs',
  sources: [],
  overview: null,
  flashcards: [],
  quizQuestions: [],
  createdAt: '2026-10-01T08:00:00.000Z',
};

function storage(mode: AppMode): StudyLmStorageService {
  const injector = Injector.create({
    providers: [{ provide: APP_MODE, useValue: mode }],
  });
  return runInInjectionContext(injector, () => new StudyLmStorageService());
}

async function names(): Promise<string[]> {
  return (await indexedDB.databases()).map((db) => db.name ?? '').sort();
}

beforeEach(() => {
  // Every test starts on an origin with no databases.
  const factory = new IDBFactory();
  Object.assign(globalThis, { indexedDB: factory });
  Object.assign(Dexie.dependencies, { indexedDB: factory });
});

describe('StudyLmStorageService', () => {
  it('keeps subjects in StudyLM’s own database when standalone', async () => {
    await storage('standalone').saveSubject(SUBJECT);
    expect(await names()).toEqual(['StudyLmDatabase']);
  });

  it('gives the portfolio’s demo a database of its own', async () => {
    const service = storage('embedded-demo');
    await service.saveSubject(SUBJECT);
    expect(await names()).toEqual(['ah-demo-studylm']);
    expect(await service.getSubject(SUBJECT.id)).toEqual(SUBJECT);
  });

  it('keeps the subjects a browser saved in the portfolio before', async () => {
    const before = new StudyLmDatabase();
    await before.subjects.put(SUBJECT);
    before.close();

    expect(await storage('embedded-demo').getAllSubjects()).toEqual([SUBJECT]);
    expect(await names()).toEqual(['StudyLmDatabase']);
  });
});
