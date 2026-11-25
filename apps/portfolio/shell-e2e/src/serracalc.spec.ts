import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test';
import { appIsPublic } from './support/site';

// SerraCalc, greenhouse heat, water and climate (ADR-0027). Local-first:
// projects live in IndexedDB, nothing calls a server.
const STANDALONE = 'http://localhost:4314/';

test.use({ serviceWorkers: 'block' });

test.describe('SerraCalc, standalone', () => {
  test.beforeEach(async ({ page }) => {
    // English, so the assertions read the same whatever the default.
    await page.addInitScript(() =>
      localStorage.setItem('preferred_language', 'en'),
    );
  });

  test('loads the samples and sizes a geothermal house’s heating', async ({
    page,
  }) => {
    await page.goto(STANDALONE);
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page.locator('sc-serra-shell')).toHaveAttribute(
      'data-look',
      'greenhouse',
    );
    await page.getByRole('button', { name: 'Load sample projects' }).click();
    await expect(
      page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();

    await page.goto(`${STANDALONE}heating?tab=peak`);
    await expect(
      page.getByText('Heating plant', { exact: true }),
    ).toBeVisible();
    // The Kebili sample: 9,600 m² of double film, a 0 °C design night.
    await expect(page.locator('ah-metric-card').first()).toContainText('825.2');
  });

  test('a drawing handle moves its number with the arrow keys', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}greenhouse`);
    await page.getByRole('button', { name: 'EN' }).click();
    const ridge = page.getByRole('slider', { name: 'Ridge height' });
    await expect(ridge).toHaveAttribute('aria-valuenow', '6.3');
    await ridge.focus();
    await page.keyboard.press('ArrowUp');
    await expect(ridge).toHaveAttribute('aria-valuenow', '6.4');
    await expect(
      page.getByRole('spinbutton', { name: /Ridge height/ }),
    ).toHaveValue('6.4');
  });

  test('saves a result and opens it again from Projects', async ({ page }) => {
    await page.goto(STANDALONE);
    await page.getByRole('button', { name: 'EN' }).click();
    await page.getByRole('button', { name: 'Load sample projects' }).click();
    // The samples are saved once the project card shows.
    await expect(
      page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
    await page.goto(`${STANDALONE}air?tab=light`);
    await expect(page.locator('sc-context-bar')).toContainText(
      'Geothermal tomato house',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Editing', { exact: true })).toBeVisible();

    await page.goto(`${STANDALONE}projects`);
    await page.getByRole('link', { name: 'Open & edit' }).first().click();
    await expect(page).toHaveURL(/\/air\?tab=light&edit=/);
    await expect(page.getByText('Editing', { exact: true })).toBeVisible();
  });

  test('has no accessibility violations on the calculators', async ({
    page,
  }) => {
    for (const path of ['heating', 'cooling', 'water', 'air', 'greenhouse']) {
      await page.goto(`${STANDALONE}${path}`);
      await expect(page.locator('figure svg').first()).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, path).toEqual([]);
    }
  });

  test('reads right to left in Arabic, drawings kept left to right', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}water`);
    await page.getByRole('button', { name: 'ع' }).click();
    await expect(page.locator('.serra')).toHaveAttribute('dir', 'rtl');
    await expect(
      page.getByRole('heading', { level: 2, name: 'المياه' }),
    ).toBeVisible();
    const direction = await page
      .locator('figure svg')
      .first()
      .evaluate((el) => getComputedStyle(el).direction);
    expect(direction).toBe('ltr');
  });
});

test.describe('SerraCalc, inside the portfolio', () => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!appIsPublic('serracalc'), 'Hidden from the catalog.');

  test('opens from the catalog under /apps/serracalc', async ({ page }) => {
    await page.goto('/apps');
    await page
      .getByRole('link', { name: /SerraCalc/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/apps\/serracalc\/projects$/);
    await expect(page.locator('sc-serra-shell')).toBeVisible();
    // Under the shell's production CSP, a calculator computes and draws.
    await page.goto('/apps/serracalc/cooling');
    await expect(page.locator('sc-vent-airflow svg')).toBeVisible();
    await expect(page.locator('ah-metric-card').first()).toBeVisible();
  });

  test('the old address redirects', async ({ page }) => {
    await page.goto('/apps/greenhouse-energy');
    await expect(page).toHaveURL(/\/apps\/serracalc\//);
  });
});
