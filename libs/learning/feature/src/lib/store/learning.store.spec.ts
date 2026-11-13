import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import {
  LearningApiError,
  LearningDatabase,
  LearningLocalStore,
} from '@ah/learning/data-access';
import { FIXTURE_IDS, sampleConcept, sampleTopic } from '@ah/learning/domain';
import { LearningRuntime } from './learning-runtime';
import { LearningStore } from './learning.store';

function createRuntimeHarness() {
  const db = new LearningDatabase(`lrn-store-${Math.random()}`);
  const local = new LearningLocalStore(db);
  const putNudgeState = vi.fn().mockResolvedValue(undefined);
  const revise = vi.fn();
  const transcribe = vi.fn();
  const grade = vi.fn();
  const sync = vi.fn().mockResolvedValue({ status: 'unpaired' as const });

  const runtime = {
    open: vi.fn().mockResolvedValue({
      local,
      api: { revise, transcribe, grade },
      client: { sync },
      edge: { putNudgeState },
      unavailable: null,
    }),
  };

  return { db, local, putNudgeState, revise, transcribe, grade, sync, runtime };
}

describe('LearningStore', () => {
  it('saves synced SettingsRecord and computes weekly streak summaries', async () => {
    const h = createRuntimeHarness();
    await h.local.setSession({
      deviceId: FIXTURE_IDS.deviceA,
      deviceName: 'Test device',
      token: 'tok-1234567890',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });

    TestBed.configureTestingModule({
      providers: [{ provide: LearningRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(LearningStore);
    await store.load();

    await store.saveSettings({
      streakMode: 'weekly',
      weeklyTarget: 3,
      gardenTheme: 'night',
    });

    const savedRecord = await h.local.settingsRecord();
    expect(savedRecord).toMatchObject({
      streakMode: 'weekly',
      weeklyTarget: 3,
      gardenTheme: 'night',
    });
    expect(store.streak().mode).toBe('weekly');
    expect(store.streak().weeklyTarget).toBe(3);
    expect(h.putNudgeState).toHaveBeenCalled();
    h.db.close();
  });

  it('tracks explanation history up to 3 revisions when manually updating a concept', async () => {
    const h = createRuntimeHarness();
    const initial = sampleConcept({
      version: 1,
      explanation: {
        essence: 'Original essence',
        simple: null,
        analogy: null,
        misconception: null,
        ownWords: null,
        by: 'user',
      },
    });
    await h.local.saveConcept(initial);

    TestBed.configureTestingModule({
      providers: [{ provide: LearningRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(LearningStore);
    await store.load();

    for (let i = 1; i <= 4; i++) {
      await store.updateConcept(
        initial.id,
        {
          explanation: {
            ...initial.explanation,
            essence: `Revision ${i}`,
          },
        },
        ['explanation'],
      );
    }

    const updated = store.concepts().find((c) => c.id === initial.id);
    expect(updated?.version).toBe(5);
    expect(updated?.explanation.essence).toBe('Revision 4');
    expect(updated?.explanationHistory).toHaveLength(3);
    expect(updated?.explanationHistory?.map((s) => s.essence)).toEqual([
      'Revision 3',
      'Revision 2',
      'Revision 1',
    ]);
    h.db.close();
  });

  it('adds and deduplicates topics case-insensitively and stamps topic group on save', async () => {
    const h = createRuntimeHarness();
    await h.local.saveTopic(sampleTopic({ name: 'Economics' }));

    TestBed.configureTestingModule({
      providers: [{ provide: LearningRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(LearningStore);
    await store.load();

    const reused = await store.addTopic('  economics ');
    expect(reused.id).toBe(FIXTURE_IDS.topic);

    const created = await store.addTopic('Algorithms');
    expect(created.name).toBe('Algorithms');
    expect(store.topics().map((t) => t.name)).toEqual([
      'Algorithms',
      'Economics',
    ]);
    h.db.close();
  });

  it('records optional aiVerdict on ReviewEvent and transcribes voice answers', async () => {
    const h = createRuntimeHarness();
    const concept = sampleConcept();
    await h.local.saveConcept(concept);
    await h.local.setSession({
      deviceId: FIXTURE_IDS.deviceA,
      deviceName: 'Test device',
      token: 'tok-1234567890',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    h.transcribe.mockResolvedValue({ text: '  Spoken answer  ' });

    TestBed.configureTestingModule({
      providers: [{ provide: LearningRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(LearningStore);
    await store.load();

    const session = await store.startToday();
    await store.recordAnswer({
      session,
      conceptId: concept.id,
      promptId: concept.prompts[0].id,
      rating: 'good',
      answer: 'Given up best option',
      ms: 2100,
      aiVerdict: 'nailed',
    });

    const events = await h.local.events();
    expect(events[0].aiVerdict).toBe('nailed');

    const transcript = await store.transcribe({
      bytes: new ArrayBuffer(8),
      mimeType: 'audio/webm',
    });
    expect(transcript).toEqual({ text: 'Spoken answer', problem: null });
    h.db.close();
  });

  it('passes expectedVersion to simpler() and syncs with notice on 409 conflict', async () => {
    const h = createRuntimeHarness();
    const concept = sampleConcept({ version: 3 });
    await h.local.saveConcept(concept);
    await h.local.setSession({
      deviceId: FIXTURE_IDS.deviceA,
      deviceName: 'Test device',
      token: 'tok-1234567890',
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
    h.revise.mockRejectedValue(
      new LearningApiError('bad-request', 'Conflict', 409),
    );

    TestBed.configureTestingModule({
      providers: [{ provide: LearningRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(LearningStore);
    await store.load();

    await store.simpler(concept.id);

    expect(h.revise).toHaveBeenCalledWith(
      concept.id,
      'simpler',
      'tok-1234567890',
      3,
    );
    expect(h.sync.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(store.notice()).toContain('refreshed');
    h.db.close();
  });
});
