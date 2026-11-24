import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test';
import { appIsPublic } from './support/site';

// The Greenhouse Labor Planner's dashboard (ADR-0026). The default build is
// the demo farm in memory: nothing here signs in or calls Supabase.
const STANDALONE = 'http://localhost:4313/';

test.use({ serviceWorkers: 'block' });

test.describe('Greenhouse dashboard, standalone', () => {
  test('opens the demo farm on the weekly plan, short on Friday', async ({
    page,
  }) => {
    await page.goto(STANDALONE);
    const shell = page.locator('gh-dashboard-shell');
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute('data-look', 'greenhouse');
    await expect(page).toHaveURL(/\/plan$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Weekly plan' }),
    ).toBeVisible();
    await expect(page.getByText('Demo farm', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Weekly plan by greenhouse and day' }),
    ).toBeVisible();
  });

  test('ranks teams on the performance screen and shows the day’s hygiene checks', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}performance`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Performance' }),
    ).toBeVisible();
    // The section and its scrolling table are both named "Teams".
    await expect(
      page.getByRole('region', { name: 'Teams', exact: true }).last(),
    ).toContainText('Équipe');

    await page.goto(`${STANDALONE}hygiene`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hygiene' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Details' }).first().click();
    await expect(page.getByText('Crates stacked on the ground')).toBeVisible();
  });

  test('has no accessibility violations on the plan', async ({ page }) => {
    await page.goto(STANDALONE);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Weekly plan' }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('Greenhouse dashboard, inside the portfolio', () => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!appIsPublic('greenhouse'), 'Hidden until go-live (G6).');

  test('opens from the catalog under /apps/greenhouse, styled by its own kit', async ({
    page,
  }) => {
    await page.goto('/apps');
    await page
      .getByRole('link', { name: /Labour Planner|Greenhouse/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/apps\/greenhouse\/plan$/);
    await expect(page.locator('gh-dashboard-shell')).toBeVisible();
    // The kit's classes come with the remote: the shell loads no product CSS.
    const button = page.locator('.gh-button').first();
    await expect(button).toBeVisible();
    expect(await button.evaluate((el) => getComputedStyle(el).fontWeight)).toBe(
      '700',
    );
  });
});
