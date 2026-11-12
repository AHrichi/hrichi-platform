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
    await page.getByRole('button', { name: 'Add to my daily reviews' }).click();

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
});
