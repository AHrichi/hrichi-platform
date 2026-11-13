import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { appIsPublic } from './support/site';
import { development, expect, test } from './support/test';

/** Every call to the API, refused before it leaves the browser. */
async function blockApi(page: Page): Promise<string[]> {
  const calls: string[] = [];
  if (development.apiUrl) {
    await page.route(`${development.apiUrl}/**`, (route) => {
      calls.push(route.request().url());
      return route.abort();
    });
  }
  return calls;
}

/** StudyLM pings n8n as it starts; answered before it leaves the browser. */
async function n8nDown(page: Page): Promise<void> {
  const down = { status: 503, body: 'n8n is down' };
  await page.route('http://127.0.0.1:5678/**', (route) => route.fulfill(down));
  if (development.n8nUrl) {
    await page.route(`${development.n8nUrl}/**`, (route) =>
      route.fulfill(down),
    );
  }
}

/**
 * New concepts start the day after you keep or add them. Move `confirmedAt`
 * two days back in IndexedDB so Today's Daily Set schedules the card now.
 */
async function backdateConcept(page: Page, title: string): Promise<void> {
  await page.evaluate(async (targetTitle) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('ah-demo-learning');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('concepts', 'readwrite');
      const store = tx.objectStore('concepts');
      const allReq = store.getAll();
      allReq.onsuccess = () => {
        for (const row of allReq.result) {
          if (row?.data?.title === targetTitle) {
            store.put({
              ...row,
              data: { ...row.data, confirmedAt: twoDaysAgo },
            });
          }
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, title);
}

test.describe('Learning Engine', () => {
  // A hidden app's routes redirect to /apps: nothing to test until it is
  // public again. Switching the flag back on runs the suite again.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(
    !appIsPublic('learning'),
    'The Learning Engine is hidden (PORTFOLIO_APPS_CONFIG)',
  );
  // page.route can't see requests made through the service worker.
  test.use({ serviceWorkers: 'block' });

  test('opens from the catalog empty, in its own database, never synced', async ({
    page,
  }) => {
    const api = await blockApi(page);
    await page.goto('/apps');
    await page.getByRole('link', { name: 'Launch Learning Engine' }).click();
    await expect(page).toHaveURL(/\/apps\/learning\/today$/);
    await expect(page).toHaveTitle('Today · Learning');
    // No sample data: nothing is due, and the guide is one click away.
    await expect(
      page.getByRole('heading', { name: 'Nothing due today' }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('link', { name: 'How the Learning Engine works' }),
    ).toBeVisible();

    const names = await page.evaluate(async () =>
      (await indexedDB.databases()).map((db) => db.name ?? ''),
    );
    expect(names).toContain('ah-demo-learning');
    expect(names).not.toContain('LearningDatabase');

    const axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);
    // The demo never pairs, syncs or calls the AI.
    expect(api).toEqual([]);
  });

  test('takes a StudyLM lesson’s cards after asking first', async ({
    page,
  }) => {
    await n8nDown(page);
    await page.goto('/apps/studylm/learn/bfs');
    const standaloneLink = page.getByRole('link', {
      name: /Add to my daily reviews/,
    });
    await expect(standaloneLink).toHaveAttribute(
      'href',
      /^http:\/\/localhost:4311\/inbox#capture=/,
    );
    await expect(standaloneLink).toHaveAttribute('target', '_blank');
    await expect(standaloneLink).toHaveAttribute('rel', /noopener/);

    await page.getByRole('button', { name: 'Try in demo' }).click();

    await expect(page).toHaveURL(/\/apps\/learning\/inbox$/);
    const handOff = page.getByRole('region', {
      name: 'Save 4 ideas from StudyLM?',
    });
    await expect(handOff).toBeVisible({ timeout: 15_000 });
    await handOff.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Got 4 ✓')).toBeVisible();
  });

  test('explains how to use it and how it works with StudyLM', async ({
    page,
  }) => {
    await page.goto('/apps/learning/today');
    await page.getByRole('link', { name: 'Guide', exact: true }).click();
    await expect(page).toHaveURL(/\/apps\/learning\/guide$/);
    await expect(page).toHaveTitle('Guide · Learning');
    await expect(
      page.getByRole('heading', { name: 'How the Learning Engine works' }),
    ).toBeVisible({ timeout: 15_000 });
    // In the portfolio, the page says what this copy can't do.
    await expect(page.getByText('In the portfolio,')).toBeVisible();

    // The contents scroll within the page instead of leaving it.
    await page
      .getByRole('navigation', { name: 'On this page' })
      .getByRole('link', { name: 'With StudyLM' })
      .click();
    await expect(page).toHaveURL(/\/apps\/learning\/guide$/);
    await expect(
      page.getByRole('heading', { name: 'With StudyLM', level: 2 }),
    ).toBeFocused();
    await expect(
      page.getByRole('heading', { name: 'Linked (recommended)' }),
    ).toBeInViewport();

    const axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test('completes capture, library edit, daily set, settings, garden, devices, and StudyLM today badge', async ({
    page,
  }) => {
    await blockApi(page);
    await n8nDown(page);

    // 1. Inbox capture (portfolio demo immediately creates a ready draft card)
    await page.goto('/apps/learning/inbox');
    await page
      .getByLabel('An idea to remember')
      .fill(
        'QUIC avoids head-of-line blocking by multiplexing transport streams.',
      );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: /New ideas to keep/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Opportunity cost' }),
    ).toBeVisible();

    let axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);

    await page.getByRole('button', { name: 'Simpler' }).click();
    await expect(
      page.getByText('Rewriting needs a paired device', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Keep →' }).click();
    await expect(
      page.getByRole('heading', { name: /New ideas to keep/ }),
    ).toBeHidden();

    // 2. Add a concept manually in Library
    await page.getByRole('link', { name: 'Library' }).click();
    await expect(page).toHaveURL(/\/apps\/learning\/concepts$/);
    await expect(
      page.getByRole('heading', { name: 'Opportunity cost' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Add a concept' }).click();
    await page
      .getByLabel('Concept', { exact: true })
      .fill('Consistent Hashing');
    await page
      .getByLabel('The idea in one line')
      .fill('Places keys and nodes on a hash ring to limit key movement.');
    await page
      .getByLabel('A question to recall it')
      .fill('Why prefer consistent hashing over modulo hashing?');
    await page
      .getByLabel('The answer')
      .fill('Resizing a cluster only remaps O(K/N) adjacent keys.');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Consistent Hashing' }),
    ).toBeVisible();

    await backdateConcept(page, 'Consistent Hashing');

    // 3. Complete Daily Set via keyboard shortcut + Easy rating
    await page.goto('/apps/learning/today');
    await expect(page).toHaveURL(/\/apps\/learning\/today$/);
    await expect(page.locator('lrn-progress-dots')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByText('Why prefer consistent hashing over modulo hashing?'),
    ).toBeVisible();

    const answerBox = page.getByPlaceholder('Type your answer (optional)…');
    await answerBox.fill('Only adjacent keys on the hash ring move.');
    await answerBox.press('Control+Enter');
    await expect(
      page.getByText('Resizing a cluster only remaps O(K/N) adjacent keys.'),
    ).toBeVisible();
    await page.getByRole('button', { name: /Easy/ }).click();
    await expect(page.locator('lrn-set-completion')).toBeVisible();

    axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);

    // Same-origin StudyLM shell displays the Today progress chip
    await page.goto('/apps/studylm/roadmap');
    await expect(page.locator('ah-learning-today a.chip')).toBeVisible({
      timeout: 15_000,
    });

    // 4. Library filter, inline edit, new topic creation & history
    await page.goto('/apps/learning/concepts');
    await page.locator('#library-search').fill('nomatch-xyz');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(
      page.getByRole('heading', { name: 'Consistent Hashing' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Edit Consistent Hashing' }).click();
    const editForm = page.getByRole('form', {
      name: 'Edit Consistent Hashing',
    });
    await editForm
      .getByLabel('Essence')
      .fill('Distributes keys on a circle to minimize cluster rebalancing.');
    await editForm.getByLabel('Topic', { exact: true }).selectOption('__new__');
    await editForm.getByLabel('New topic name').fill('Distributed Systems');
    await editForm.getByRole('button', { name: '+ Add question' }).click();
    await editForm
      .getByLabel('Question 2')
      .fill('What do virtual nodes improve?');
    await editForm
      .getByLabel('Answer 2')
      .fill('Load balance across uneven machines.');
    await editForm.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Previous versions (1)')).toBeVisible();
    await page
      .locator('#library-topic')
      .selectOption({ label: 'Distributed Systems' });
    await expect(
      page.getByRole('heading', { name: 'Consistent Hashing' }),
    ).toBeVisible();
    await page.locator('#library-status').selectOption('archived');
    await page.getByRole('button', { name: 'Clear filters' }).click();

    axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);

    // 5. Settings weekly streak mode persists across reloads
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/apps\/learning\/settings$/);
    const weeklyRadio = page.getByRole('radio', { name: 'Weekly target' });
    await weeklyRadio.click();
    await expect(weeklyRadio).toHaveAttribute('aria-checked', 'true');
    const weeklyInput = page.locator('#weekly-target');
    await weeklyInput.fill('4');
    await weeklyInput.dispatchEvent('change');
    await page.reload();
    await expect(
      page.getByRole('radio', { name: 'Weekly target' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#weekly-target')).toHaveValue('4');

    axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);

    // 6. Garden, Devices, and Connect routes
    await page.getByRole('link', { name: 'Garden' }).click();
    await expect(page).toHaveURL(/\/apps\/learning\/garden$/);
    await expect(page.locator('lrn-knowledge-garden')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Distributed Systems' }),
    ).toBeVisible();
    await expect(page.locator('lrn-knowledge-garden')).toContainText(
      'Consistent Hashing',
    );
    axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);

    await page.goto('/apps/learning/devices');
    await expect(page.getByText('This is the demo')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Open the real Learning Engine/ }),
    ).toHaveAttribute('href', 'http://localhost:4311');
    await expect(
      page.getByRole('link', { name: /Open the real Learning Engine/ }),
    ).toHaveAttribute('target', '_blank');
    axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);

    await page.goto('/apps/learning/connect');
    await expect(
      page.getByRole('heading', { name: 'Link an app' }),
    ).toBeVisible();
    axe = await new AxeBuilder({ page })
      .include('lrn-learning-shell')
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test('keeps a draft card from inbox and reviews it in Today', async ({
    page,
  }) => {
    await blockApi(page);
    await page.goto('/apps/learning/inbox');
    await expect(page.getByLabel('An idea to remember')).toBeVisible();

    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('ah-demo-learning');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      const now = new Date().toISOString();
      const draft = {
        id: '11111111-1111-4111-8111-111111111111',
        updatedAt: now,
        deletedAt: null,
        version: 1,
        fieldTimestamps: {
          status: now,
          topic: now,
          explanation: now,
          prompts: now,
          sources: now,
        },
        captureId: null,
        sources: [],
        topicId: '99999999-9999-4999-8999-999999999999',
        title: 'Write-Ahead Log',
        tags: ['databases'],
        explanation: {
          essence:
            'Appends mutations sequentially to disk before applying pages.',
          simple: null,
          analogy: null,
          misconception: null,
          ownWords: null,
          by: 'ai',
        },
        prompts: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            type: 'free_recall',
            question: 'Why append to a WAL before updating B-tree pages?',
            answer: 'Sequential disk writes give crash durability fast.',
            options: null,
            keyPoints: ['durability', 'sequential'],
            retired: false,
          },
        ],
        explanationHistory: [],
        status: 'draft',
        flaggedForCheck: false,
        suspendedUntil: null,
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('concepts', 'readwrite');
        tx.objectStore('concepts').put({
          id: draft.id,
          by: 'local',
          updatedAt: now,
          data: draft,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    });

    await page.reload();
    await expect(
      page.getByRole('heading', { name: /New ideas to keep/ }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('lrn-swipe-card')).toBeVisible();
    await page.getByRole('button', { name: 'Keep →' }).click();
    await expect(
      page.getByRole('heading', { name: /New ideas to keep/ }),
    ).toBeHidden();

    await page.getByRole('link', { name: 'Library' }).click();
    await expect(
      page.getByRole('heading', { name: 'Write-Ahead Log' }),
    ).toBeVisible();
    await backdateConcept(page, 'Write-Ahead Log');

    await page.goto('/apps/learning/today');
    await expect(page).toHaveURL(/\/apps\/learning\/today$/);
    await expect(
      page.getByText('Why append to a WAL before updating B-tree pages?'),
    ).toBeVisible({ timeout: 15_000 });
    await page.locator('.reveal-button').click();
    await page.getByRole('button', { name: /Got it/ }).click();
    await expect(page.locator('lrn-set-completion')).toBeVisible();
  });
});
