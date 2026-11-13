import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import Dexie from 'dexie';
import '@angular/compiler';
import {
  Injector,
  PLATFORM_ID,
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
} from '@angular/core';
import { APP_MODE, type AppMode } from '@ah/platform/app-mode';
import type {
  StudyLmPulledRecord,
  StudyLmSyncRequest,
  StudyLmSyncResponse,
  StudySubject,
} from '@ah/products/studylm/domain';
import { SiteConfigService } from '@ah/shared/site-config';
import { StudyLmStorageService } from './studylm-storage.service';
import {
  STUDYLM_SYNC_API_FACTORY,
  StudyLmSyncService,
} from './studylm-sync.service';
import type { StudyLmSyncApi } from './studylm-sync-api';

const SUBJECT: StudySubject = {
  id: 'subj-1',
  title: 'Compilers',
  sources: [],
  overview: null,
  flashcards: [],
  quizQuestions: [],
  createdAt: '2026-11-10T08:00:00.000Z',
};

function setup(
  options: {
    mode?: AppMode;
    apiUrl?: string | null;
    api?: Partial<StudyLmSyncApi>;
  } = {},
) {
  const apiUrl =
    options.apiUrl === undefined ? 'https://api.example' : options.apiUrl;
  const fakeApi: Partial<StudyLmSyncApi> = {
    startPairing: async () => ({
      pairingId: '11111111-1111-4111-8111-111111111111',
      expiresAt: '2026-11-13T12:10:00.000Z',
    }),
    confirmPairing: async () => ({
      deviceId: '22222222-2222-4222-8222-222222222222',
      deviceName: 'Laptop',
      token: 'v1.22222222-2222-4222-8222-222222222222.2000000000.sig',
      expiresAt: '2027-05-01T00:00:00.000Z',
    }),
    devices: async () => [
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Laptop',
        pairedAt: '2026-11-13T12:00:00.000Z',
        lastSeenAt: '2026-11-13T12:00:00.000Z',
        current: true,
      },
    ],
    revokeDevice: async () => undefined,
    sync: async (_req: StudyLmSyncRequest): Promise<StudyLmSyncResponse> => ({
      cursor: 1,
      pull: [],
      more: false,
      rejected: [],
    }),
    ...options.api,
  };

  const noop = () => undefined;
  const injector = Injector.create({
    providers: [
      { provide: APP_MODE, useValue: options.mode ?? 'standalone' },
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: ɵChangeDetectionScheduler, useValue: { notify: noop } },
      { provide: ɵEffectScheduler, useValue: { add: noop } },
      {
        provide: SiteConfigService,
        useValue: { load: async () => ({ apiUrl }) },
      },
      {
        provide: STUDYLM_SYNC_API_FACTORY,
        useValue: () => fakeApi as StudyLmSyncApi,
      },
      StudyLmStorageService,
      StudyLmSyncService,
    ],
  });

  return {
    storage: injector.get(StudyLmStorageService),
    sync: injector.get(StudyLmSyncService),
  };
}

beforeEach(() => {
  const factory = new IDBFactory();
  Object.assign(globalThis, { indexedDB: factory });
  Object.assign(Dexie.dependencies, { indexedDB: factory });
});

describe('StudyLmSyncService', () => {
  it('stays disabled in embedded-demo mode', async () => {
    const { sync } = setup({ mode: 'embedded-demo' });
    await sync.init();
    expect(sync.available()).toBe(false);
    expect(sync.unavailable()).toBe('demo');
    expect(sync.status()).toBe('unavailable');
  });

  it('pairs via Telegram code, uploads local subjects, and pulls remote lessons', async () => {
    const pushed: StudyLmSyncRequest[] = [];
    const pulledRecord: StudyLmPulledRecord = {
      kind: 'lesson',
      id: 'gen-subj-1-sec-1',
      seq: 2,
      by: 'device-b',
      updatedAt: '2026-11-13T12:01:00.000Z',
      data: {
        id: 'gen-subj-1-sec-1',
        subjectId: 'subj-1',
        sectionId: 'sec-1',
        draft: { tier: 'intermediate', provider: 'groq', blocks: {} },
        lesson: { id: 'gen-subj-1-sec-1', title: 'Lexing', sections: [] },
        generatedAt: '2026-11-13T12:01:00.000Z',
        updatedAt: '2026-11-13T12:01:00.000Z',
        deletedAt: null,
      },
    };

    const { storage, sync } = setup({
      api: {
        sync: async (req) => {
          pushed.push(req);
          return {
            cursor: 2,
            pull: [pulledRecord],
            more: false,
            rejected: [],
          };
        },
      },
    });

    await storage.saveSubject(SUBJECT, { now: '2026-11-13T12:00:00.000Z' });
    await sync.startPairing('Laptop');
    expect(sync.pairing().pairingId).toBeTruthy();

    const ok = await sync.confirmPairing('123456');
    expect(ok).toBe(true);
    expect(sync.paired()).toBe(true);
    expect(sync.status()).toBe('synced');
    expect(pushed[0]?.push.subjects).toHaveLength(1);
    expect(sync.lessonsPulledRevision()).toBe(1);
    expect(await storage.getGeneratedLesson('gen-subj-1-sec-1')).toMatchObject({
      subjectId: 'subj-1',
      lesson: { title: 'Lexing' },
    });
  });

  it('syncs immediately on boot when a paired session is already stored', async () => {
    const syncCalls: StudyLmSyncRequest[] = [];
    const restarted = setup({
      api: {
        sync: async (req) => {
          syncCalls.push(req);
          return { cursor: 0, pull: [], more: false, rejected: [] };
        },
      },
    });
    // Seed session directly before init (mirrors reopened IndexedDB on reload)
    await restarted.storage.setSyncSession({
      deviceId: '22222222-2222-4222-8222-222222222222',
      deviceName: 'Laptop',
      token: 'v1.22222222-2222-4222-8222-222222222222.2000000000.sig',
      expiresAt: '2027-05-01T00:00:00.000Z',
    });

    await restarted.sync.init();
    expect(restarted.sync.status()).toBe('synced');
    expect(syncCalls).toHaveLength(1);
  });
});
