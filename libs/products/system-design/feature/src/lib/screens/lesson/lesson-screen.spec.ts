import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LearnThis, textKey } from '@ah/learning/client';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { SystemDesignRuntime } from '../../store/system-design-runtime';
import { SystemDesignStore } from '../../store/system-design.store';
import { SYSTEM_DESIGN_ROUTES } from '../../system-design.routes';

/** Polls until `ready()` holds (the store opens IndexedDB asynchronously). */
async function until(ready: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!ready() && Date.now() - start < timeoutMs)
    await new Promise((r) => setTimeout(r, 10));
}

describe('LessonScreen', () => {
  it('redirects /learn to the first lesson, renders stage/panel/timeline and advances step via Next or keyboard', async () => {
    const db = new SystemDesignDatabase(`sd-lesson-${Math.random()}`);
    const local = new SystemDesignLocalStore(db);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(SYSTEM_DESIGN_ROUTES),
        {
          provide: SystemDesignRuntime,
          useValue: { open: () => Promise.resolve(local) },
        },
      ],
    });

    const harness = await RouterTestingHarness.create('/learn');
    const router = TestBed.inject(Router);
    const store = TestBed.inject(SystemDesignStore);

    // Wait for async lesson load & route redirect to settle
    await until(
      () =>
        router.url === '/learn/request-journey/1' &&
        store.activeLessonId() === 'request-journey',
    );
    await harness.fixture.whenStable();

    expect(router.url).toBe('/learn/request-journey/1');
    expect(store.activeLessonId()).toBe('request-journey');
    expect(store.activeStepIndex()).toBe(0);

    const rootEl = harness.routeNativeElement as HTMLElement;
    expect(rootEl.querySelector('.breadcrumb')?.textContent).toContain(
      '01. Foundations / Lesson 1 of 4',
    );
    expect(rootEl.querySelector('sd-iso-scene')).not.toBeNull();
    expect(rootEl.querySelector('sd-step-panel')).not.toBeNull();
    expect(rootEl.querySelector('sd-timeline')).not.toBeNull();
    expect(rootEl.querySelector('sd-learn-list')).not.toBeNull();

    // Advance step via Next button in step panel
    const nextBtn = rootEl.querySelector(
      'sd-step-panel .next-btn',
    ) as HTMLButtonElement;
    nextBtn.click();
    await until(() => router.url === '/learn/request-journey/2');
    await harness.fixture.whenStable();

    expect(router.url).toBe('/learn/request-journey/2');
    expect(store.activeStepIndex()).toBe(1);

    // Advance step via ArrowRight keyboard shortcut
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );
    await until(() => router.url === '/learn/request-journey/3');
    await harness.fixture.whenStable();

    expect(router.url).toBe('/learn/request-journey/3');
    expect(store.activeStepIndex()).toBe(2);

    db.close();
  });

  it('offers "Add to my daily reviews" with the lesson cards on the recap step only', async () => {
    const db = new SystemDesignDatabase(`sd-lesson-${Math.random()}`);
    const local = new SystemDesignLocalStore(db);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(SYSTEM_DESIGN_ROUTES),
        {
          provide: SystemDesignRuntime,
          useValue: { open: () => Promise.resolve(local) },
        },
      ],
    });

    const harness = await RouterTestingHarness.create(
      '/learn/request-journey/11',
    );
    const store = TestBed.inject(SystemDesignStore);
    const rootEl = harness.routeNativeElement as HTMLElement;
    await until(
      () =>
        store.activeLessonId() === 'request-journey' &&
        store.activeStepIndex() === 10 &&
        rootEl.querySelector('sd-step-panel .recap-actions ah-learn-this') !==
          null,
    );
    await harness.fixture.whenStable();

    expect(store.activeStepIndex()).toBe(10);
    expect(
      rootEl.querySelector('sd-step-panel .recap-actions ah-learn-this'),
    ).not.toBeNull();
    expect(rootEl.querySelector('ah-learn-this')?.textContent).toContain(
      'Add to my daily reviews',
    );

    const learnThis = harness.fixture.debugElement
      .query(By.directive(LearnThis))
      .injector.get(LearnThis);
    const items = learnThis.items();
    const lesson = store.activeLesson();
    expect(lesson).not.toBeNull();
    expect(items).toHaveLength(lesson?.cards.length ?? -1);
    const first = lesson?.cards[0];
    expect(items[0]).toEqual({
      text: `${first?.front}
${first?.back}`,
      source: {
        app: 'system-design',
        objectType: 'lesson-card',
        objectId: `request-journey:${textKey(first?.front ?? '')}`,
        deepLink: expect.any(String),
        excerpt: 'One Request, End to End',
      },
    });

    // Back to a non-recap step: the button is gone.
    await harness.navigateByUrl('/learn/request-journey/10');
    await until(() => store.activeStepIndex() === 9);
    await harness.fixture.whenStable();
    expect(store.activeStepIndex()).toBe(9);
    expect(rootEl.querySelector('ah-learn-this')).toBeNull();

    db.close();
  });
});
