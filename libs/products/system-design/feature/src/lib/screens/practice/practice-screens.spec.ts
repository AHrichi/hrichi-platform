import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { SystemDesignRuntime } from '../../store/system-design-runtime';
import { SystemDesignStore } from '../../store/system-design.store';
import {
  LessonPractice,
  MixedPractice,
  PracticeHome,
} from './practice-screens';

function harness() {
  const db = new SystemDesignDatabase(`sd-practice-${Math.random()}`);
  const local = new SystemDesignLocalStore(db);
  TestBed.configureTestingModule({
    providers: [
      {
        provide: SystemDesignRuntime,
        useValue: { open: vi.fn().mockResolvedValue(local) },
      },
      provideRouter([
        { path: 'practice', component: PracticeHome },
        { path: 'practice/mix', component: MixedPractice },
        { path: 'practice/:lessonId', component: LessonPractice },
        { path: 'learn/:lessonId', children: [] },
        { path: 'learn/:lessonId/:step', children: [] },
      ]),
    ],
  });
  return { db, local };
}

async function settle(router: RouterTestingHarness): Promise<void> {
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 0));
    await router.fixture.whenStable();
  }
}

/** Polls until `ready` holds: lessons load through dynamic imports. */
async function until(
  router: RouterTestingHarness,
  ready: () => boolean,
): Promise<void> {
  for (let i = 0; i < 200 && !ready(); i++) {
    await new Promise((r) => setTimeout(r, 10));
    await router.fixture.whenStable();
  }
  expect(ready()).toBe(true);
}

function button(host: HTMLElement, text: string): HTMLButtonElement {
  const found = [...host.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  );
  if (!found) throw new Error(`No button "${text}"`);
  return found;
}

describe('Practice screens', () => {
  it('home locks mixed practice until a lesson is complete and shows best scores', async () => {
    const h = harness();
    await h.local.addAttempt({
      lessonId: 'request-journey',
      checkId: 'choice-rtt-bottleneck',
      correct: true,
      answer: 0,
      at: '2026-11-20T10:00:00.000Z',
      run: { id: 'r1', kind: 'lesson', size: 4 },
    });
    const router = await RouterTestingHarness.create();
    await router.navigateByUrl('/practice');
    const host = router.routeNativeElement as HTMLElement;
    await until(router, () =>
      (
        host.querySelector('[data-lesson="request-journey"]')?.textContent ?? ''
      ).includes('Best'),
    );

    expect(host.querySelector('h1')?.textContent).toContain('Practice');
    expect(button(host, 'Start mixed practice').disabled).toBe(true);
    expect(host.textContent).toContain('Finish one lesson');
    expect(host.querySelectorAll('.module-card')).toHaveLength(9);
    const row = host.querySelector('[data-lesson="request-journey"]');
    expect(row?.textContent).toContain('Best');
    expect(row?.textContent).toContain('1 / 4');
    expect(
      row?.querySelector('a[aria-label="Practice One Request, End to End"]'),
    ).not.toBeNull();
    expect(
      row
        ?.querySelector('a[aria-label^="Review lesson"]')
        ?.getAttribute('href'),
    ).toBe('/learn/request-journey');

    const store = TestBed.inject(SystemDesignStore);
    await store.visit('request-journey', 10, 11);
    await until(router, () => !!host.querySelector('a[href="/practice/mix"]'));
    expect(host.querySelector('a[href="/practice/mix"]')).not.toBeNull();
    h.db.close();
  });

  it('runs a lesson one question at a time, saves every answer and sums up', async () => {
    const h = harness();
    const router = await RouterTestingHarness.create();
    await router.navigateByUrl('/practice/request-journey');
    const host = router.routeNativeElement as HTMLElement;
    await until(router, () => !!host.querySelector('sd-check-order'));

    expect(host.querySelector('h1')?.textContent).toContain(
      'One Request, End to End',
    );
    expect(host.querySelector('h2')?.textContent).toContain('Question 1 of 4');
    expect(host.querySelector('.back-link')?.getAttribute('href')).toBe(
      '/practice',
    );

    // 1. Order: submit the scrambled start, which is wrong.
    expect(host.querySelector('sd-check-order')).not.toBeNull();
    button(host, 'Check order').click();
    await settle(router);
    expect(host.textContent).toContain('Wrong order');
    button(host, 'Next question').click();
    await settle(router);

    // 2. Choice: the first option is right.
    expect(host.querySelector('h2')?.textContent).toContain('Question 2 of 4');
    host.querySelector<HTMLInputElement>('input[type="radio"]')?.click();
    await settle(router);
    button(host, 'Check answer').click();
    await settle(router);
    expect(host.textContent).toContain('Correct');
    button(host, 'Next question').click();
    await settle(router);

    // 3. Numeric: 260 ms.
    const input = host.querySelector<HTMLInputElement>('input[type="number"]');
    if (!input) throw new Error('no numeric input');
    input.value = '260';
    input.dispatchEvent(new Event('input'));
    await settle(router);
    button(host, 'Check answer').click();
    await settle(router);
    button(host, 'Next question').click();
    await settle(router);

    // 4. Choice: the second option is wrong.
    host.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1]?.click();
    await settle(router);
    button(host, 'Check answer').click();
    await settle(router);
    button(host, 'See results').click();
    await settle(router);

    expect(host.querySelector('.score-label')?.textContent).toContain(
      '2 of 4 correct',
    );
    expect(host.querySelectorAll('.missed-item')).toHaveLength(2);
    expect(host.querySelector('.missed-link')?.getAttribute('href')).toBe(
      '/learn/request-journey/3',
    );
    expect(host.querySelector('ah-learn-this')?.textContent).toContain(
      'Add missed to my daily reviews',
    );

    const saved = await h.local.attemptsForLesson('request-journey');
    expect(saved).toHaveLength(4);
    expect(saved.map((a) => a.correct)).toEqual([false, true, true, false]);
    expect(new Set(saved.map((a) => a.run?.id)).size).toBe(1);
    expect(saved[0].run).toMatchObject({ kind: 'lesson', size: 4 });

    button(host, 'Practice again').click();
    await until(router, () => !!host.querySelector('sd-check-order'));
    expect(host.querySelector('h2')?.textContent).toContain('Question 1 of 4');
    h.db.close();
  });

  it('says so for an unknown lesson', async () => {
    const h = harness();
    const router = await RouterTestingHarness.create();
    await router.navigateByUrl('/practice/no-such-lesson');
    await settle(router);
    const host = router.routeNativeElement as HTMLElement;
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'no lesson at this address',
    );
    h.db.close();
  });

  it('mixed practice draws only from finished lessons', async () => {
    const h = harness();
    await h.local.putProgress({
      lessonId: 'request-journey',
      furthestStep: 10,
      lastStep: 10,
      completedAt: '2026-11-20T09:00:00.000Z',
      updatedAt: '2026-11-20T09:00:00.000Z',
    });
    const router = await RouterTestingHarness.create();
    await router.navigateByUrl('/practice/mix');
    const host = router.routeNativeElement as HTMLElement;
    await until(router, () => !!host.querySelector('.question-from'));

    expect(host.querySelector('h2')?.textContent).toContain('Question 1 of 4');
    expect(host.querySelector('.question-from')?.textContent).toContain(
      'One Request, End to End',
    );
    h.db.close();
  });
});
