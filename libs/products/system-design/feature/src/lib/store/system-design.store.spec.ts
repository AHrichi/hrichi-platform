import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { CURRICULUM } from '@ah/products/system-design/domain';
import { handleSystemDesignKey } from '../keyboard/keyboard';
import { SystemDesignRuntime } from './system-design-runtime';
import { SystemDesignStore } from './system-design.store';

function createRuntimeHarness() {
  const db = new SystemDesignDatabase(`sd-store-${Math.random()}`);
  const local = new SystemDesignLocalStore(db);
  const runtime = {
    open: vi.fn().mockResolvedValue(local),
  };
  return { db, local, runtime };
}

describe('SystemDesignStore & keyboard', () => {
  it('loads saved progress from Dexie, records visits and completes a lesson on recap', async () => {
    const h = createRuntimeHarness();
    const firstId = CURRICULUM[0].lessons[0].id;
    await h.local.putProgress({
      lessonId: firstId,
      furthestStep: 2,
      lastStep: 1,
      completedAt: null,
      updatedAt: '2026-11-20T08:00:00.000Z',
    });

    TestBed.configureTestingModule({
      providers: [{ provide: SystemDesignRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(SystemDesignStore);
    await store.load();

    expect(store.ready()).toBe(true);
    expect(store.progressById()[firstId]?.lastStep).toBe(1);
    expect(store.lessonStatuses()[firstId]).toBe('started');
    expect(store.recommendedLesson()?.id).toBe(firstId);

    // Open lesson without explicit step -> resumes at lastStep (1)
    const lesson = await store.openLesson(firstId);
    expect(lesson?.id).toBe(firstId);
    expect(store.activeStepIndex()).toBe(1);

    // Visit final recap step (index 5 of 6)
    await store.visit(
      firstId,
      (lesson?.steps.length ?? 6) - 1,
      lesson?.steps.length ?? 6,
      '2026-11-20T09:00:00.000Z',
    );
    expect(store.lessonStatuses()[firstId]).toBe('complete');
    expect(store.courseProgress().done).toBe(1);
    expect(store.courseProgress().total).toBe(44);

    const persisted = await h.local.getProgress(firstId);
    expect(persisted?.completedAt).toBe('2026-11-20T09:00:00.000Z');
    h.db.close();
  });

  it('persists practice attempts to Dexie and updates store state', async () => {
    const h = createRuntimeHarness();
    TestBed.configureTestingModule({
      providers: [{ provide: SystemDesignRuntime, useValue: h.runtime }],
    });
    const store = TestBed.inject(SystemDesignStore);
    await store.load();

    await store.recordAttempt(
      'request-journey',
      'ready',
      1,
      true,
      '2026-11-20T10:00:00.000Z',
    );
    expect(store.attempts()).toHaveLength(1);
    expect(await h.local.allAttempts()).toHaveLength(1);

    const run = { id: 'run-1', kind: 'lesson', size: 4 } as const;
    await store.recordAttempt(
      'request-journey',
      'choice-rtt-bottleneck',
      0,
      true,
      '2026-11-20T10:01:00.000Z',
      run,
    );
    expect(store.attempts()[1].run).toEqual(run);
    const [, saved] = await h.local.allAttempts();
    expect(saved.run).toEqual(run);
    h.db.close();
  });

  it('dispatches keyboard shortcuts and ignores them inside editable inputs or open overlays', () => {
    const calls: string[] = [];
    let overlay = false;
    const handlers = {
      overlayOpen: () => overlay,
      openSearch: () => calls.push('search'),
      closeOverlays: () => {
        if (!overlay) return false;
        overlay = false;
        calls.push('close');
        return true;
      },
      nextStep: () => calls.push('next'),
      prevStep: () => calls.push('prev'),
      firstStep: () => calls.push('first'),
      lastStep: () => calls.push('last'),
      replay: () => calls.push('replay'),
      togglePlay: () => calls.push('toggle'),
    };

    const div = document.createElement('div');
    const fire = (
      key: string,
      init: KeyboardEventInit = {},
      target: HTMLElement = div,
    ) => {
      const ev = new KeyboardEvent('keydown', {
        key,
        cancelable: true,
        ...init,
      });
      Object.defineProperty(ev, 'target', { value: target });
      return handleSystemDesignKey(ev, handlers);
    };

    expect(fire('ArrowRight')).toBe(true);
    expect(fire('ArrowLeft')).toBe(true);
    expect(fire('Home')).toBe(true);
    expect(fire('End')).toBe(true);
    expect(fire('r')).toBe(true);
    expect(fire(' ')).toBe(true);
    expect(calls).toEqual([
      'next',
      'prev',
      'first',
      'last',
      'replay',
      'toggle',
    ]);

    // Ignored inside an input field
    const input = document.createElement('input');
    expect(fire('ArrowRight', {}, input)).toBe(false);

    // Ctrl+K works even when focused in an input
    expect(fire('k', { ctrlKey: true }, input)).toBe(true);
    expect(calls[calls.length - 1]).toBe('search');

    // Stepping ignored while overlay is open, Esc closes overlay
    overlay = true;
    expect(fire('ArrowRight')).toBe(false);
    expect(fire('Escape')).toBe(true);
    expect(overlay).toBe(false);
  });
});
