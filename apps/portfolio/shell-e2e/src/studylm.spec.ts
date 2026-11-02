import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { development, expect, test } from './support/test';

// The shell's service worker would fetch for the page, out of page.route's
// sight, so requests could reach a real n8n. Block it for these tests.
test.use({ serviceWorkers: 'block' });

/**
 * n8n is down for every test here: each request to it is answered with an
 * error before it leaves the browser, so no real n8n is ever called.
 */
async function n8nDown(page: Page): Promise<string[]> {
  const calls: string[] = [];
  const answer = async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
    calls.push(route.request().postData() ?? '');
    await route.fulfill({ status: 503, body: 'n8n is down' });
  };
  await page.route('http://127.0.0.1:5678/**', answer);
  if (development.n8nUrl) await page.route(`${development.n8nUrl}/**`, answer);
  return calls;
}

let n8nCalls: string[] = [];

test.beforeEach(async ({ page }) => {
  n8nCalls = await n8nDown(page);
});

test.afterEach(() => {
  // Every StudyLM page pings n8n as it starts; the stub must have answered.
  expect(n8nCalls.length).toBeGreaterThan(0);
});

test('each screen has its own address and title', async ({ page }) => {
  await page.goto('/apps/studylm');
  await expect(page).toHaveURL(/\/apps\/studylm\/roadmap$/);
  await expect(page).toHaveTitle('Roadmap · StudyLM');
  // The pill never claims a connection it hasn't made.
  await expect(
    page.getByRole('button', { name: /n8n AI Engine status: Offline/ }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Lessons' }).click();
  await expect(page).toHaveURL(/\/apps\/studylm\/learn$/);
  await expect(page).toHaveTitle('Lessons · StudyLM');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(7);
});

test('an AI failure says so, instead of serving made-up content', async ({
  page,
}) => {
  await page.goto('/apps/studylm/roadmap');
  await page.getByRole('button', { name: 'Generate Roadmap' }).first().click();
  await expect(page.getByText('The AI couldn’t make a roadmap')).toBeVisible();
  await expect(page.getByText('No Curriculum Roadmap Yet')).toBeVisible();
});

test('plays binary search by keyboard and remembers the answers', async ({
  page,
}) => {
  await page.goto('/apps/studylm/learn/binary-search');
  await expect(page).toHaveTitle(
    'Binary search: halving your way to the answer · StudyLM',
  );

  // Predict first.
  const predict = page.locator('sl-predict');
  await predict.getByRole('radio', { name: '3', exact: true }).check();
  await predict.getByRole('button', { name: 'Lock in my prediction' }).click();
  await expect(predict.getByRole('status')).toContainText('Right');

  // Then step through the search with the arrow keys.
  const visual = page.getByRole('group', { name: 'Searching for 9, stepped' });
  await visual.focus();
  await page.keyboard.press('ArrowRight');
  await expect(visual).toContainText('Step 1 of');
  await page.keyboard.press('End');
  await expect(visual).toContainText('found it');

  const axe = await new AxeBuilder({ page })
    .include('ah-studylm-lesson-screen')
    .analyze();
  expect(axe.violations).toEqual([]);

  // A reload opens the lesson as it was left.
  await page.reload();
  await expect(page.locator('sl-predict').getByRole('status')).toContainText(
    'Right',
  );
  await expect(
    page.getByRole('group', { name: 'Searching for 9, stepped' }),
  ).toContainText('found it');
});

test('a prediction’s reveal opens the visual at the step that answers it', async ({
  page,
}) => {
  await page.goto('/apps/studylm/learn/http-request');
  const predict = page.locator('sl-predict');
  await predict.getByRole('radio', { name: 'Only the CDN' }).check();
  await predict.getByRole('button', { name: 'Lock in my prediction' }).click();
  await expect(predict.getByRole('status')).toContainText('Not quite');
  await predict.getByRole('button', { name: 'See it in the visual' }).click();
  await expect(
    page.locator('#block-cache-flow sl-step-controls'),
  ).toContainText(/Step \d+ of/);
});

test('StudyLM keeps the portfolio’s data in its demo database', async ({
  page,
}) => {
  await page.goto('/apps/studylm/learn');
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await indexedDB.databases()).map((db) => db.name),
      ),
    )
    .toContain('ah-demo-studylm');
});
