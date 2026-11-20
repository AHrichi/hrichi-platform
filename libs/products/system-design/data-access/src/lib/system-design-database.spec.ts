import 'fake-indexeddb/auto';
import { SystemDesignDatabase } from './system-design-database';
import { SystemDesignLocalStore } from './system-design-local-store';

describe('SystemDesignDatabase & SystemDesignLocalStore', () => {
  it('opens under the given name and stores meta, progress, attempts and designs', async () => {
    const name = `sd-test-${Math.random()}`;
    const db = new SystemDesignDatabase(name);
    const store = new SystemDesignLocalStore(db);

    await store.setMeta('lastLesson', 'request-journey');
    expect(db.name).toBe(name);
    expect(await store.getMeta<string>('lastLesson')).toBe('request-journey');

    // Progress
    await store.putProgress({
      lessonId: 'request-journey',
      furthestStep: 3,
      lastStep: 2,
      completedAt: null,
      updatedAt: '2026-11-20T10:00:00.000Z',
    });
    const prog = await store.getProgress('request-journey');
    expect(prog?.furthestStep).toBe(3);
    expect(prog?.lastStep).toBe(2);
    expect(await store.allProgress()).toHaveLength(1);

    // Attempts with compound index [lessonId+checkId]
    await store.addAttempt({
      lessonId: 'request-journey',
      checkId: 'q1',
      correct: false,
      answer: 1,
      at: '2026-11-20T10:01:00.000Z',
    });
    await store.addAttempt({
      lessonId: 'request-journey',
      checkId: 'q1',
      correct: true,
      answer: 0,
      at: '2026-11-20T10:02:00.000Z',
    });
    await store.addAttempt({
      lessonId: 'request-journey',
      checkId: 'q2',
      correct: true,
      answer: 200,
      at: '2026-11-20T10:03:00.000Z',
    });

    const forQ1 = await store.attemptsForCheck('request-journey', 'q1');
    expect(forQ1).toHaveLength(2);
    expect(forQ1.map((a) => a.correct)).toEqual([false, true]);
    expect(await store.attemptsForLesson('request-journey')).toHaveLength(3);
    expect(await store.allAttempts()).toHaveLength(3);

    // Designs
    await store.putDesign({
      id: 'first-users',
      design: { nodes: [], links: [] },
      updatedAt: '2026-11-20T10:04:00.000Z',
    });
    expect((await store.getDesign('first-users'))?.id).toBe('first-users');
    expect(await store.allDesigns()).toHaveLength(1);

    db.close();
  });
});
