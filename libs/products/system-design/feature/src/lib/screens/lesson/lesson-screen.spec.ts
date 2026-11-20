import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { SystemDesignRuntime } from '../../store/system-design-runtime';
import { SystemDesignStore } from '../../store/system-design.store';
import { SYSTEM_DESIGN_ROUTES } from '../../system-design.routes';

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

    // Wait for async lesson load & route redirect to settle (polled, so a
    // busy test worker doesn't make it flaky)
    for (let i = 0; i < 100 && !store.activeLesson(); i++) {
      await new Promise((r) => setTimeout(r, 10));
      await harness.fixture.whenStable();
    }

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
    await new Promise((r) => setTimeout(r, 20));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/learn/request-journey/2');
    expect(store.activeStepIndex()).toBe(1);

    // Advance step via ArrowRight keyboard shortcut
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );
    await new Promise((r) => setTimeout(r, 20));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/learn/request-journey/3');
    expect(store.activeStepIndex()).toBe(2);

    db.close();
  });
});
