import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './support/test';

/** `YYYY-MM-DD`, `days` from today in the browser's (and this machine's) zone. */
function day(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

/** Open-Meteo, stubbed: a frosty, windy first night at the campsite. */
async function stubForecast(page: Page): Promise<void> {
  const days = Array.from({ length: 16 }, (_, i) => i);
  await page.route('**/api.open-meteo.com/v1/forecast**', (route) =>
    route.fulfill({
      json: {
        daily: {
          time: days.map(day),
          weather_code: days.map((i) => (i === 3 ? 61 : 1)),
          temperature_2m_max: days.map(() => 14),
          temperature_2m_min: days.map((i) => (i === 3 ? -2 : 6)),
          precipitation_sum: days.map((i) => (i === 3 ? 12 : 0)),
          precipitation_probability_max: days.map((i) => (i === 3 ? 90 : 5)),
          wind_speed_10m_max: days.map(() => 20),
          wind_gusts_10m_max: days.map((i) => (i === 3 ? 65 : 25)),
          cloud_cover_mean: days.map(() => 10),
        },
      },
    }),
  );
}

async function loadSample(page: Page): Promise<void> {
  await page.goto('/apps/basecamp/trips');
  await page.getByRole('button', { name: 'Load a sample trip' }).click();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Aïn Draham forest weekend' }),
  ).toBeVisible();
}

test.describe('Basecamp', () => {
  // page.route can't see requests made through the service worker.
  test.use({ serviceWorkers: 'block' });

  test('starts empty, loads a sample trip, and passes axe', async ({
    page,
  }) => {
    await stubForecast(page);
    await page.goto('/apps/basecamp');
    await expect(page.getByText('No trips yet')).toBeVisible();
    // Inside the portfolio the site's own switch sets the language.
    await expect(page.locator('bc-basecamp-shell .langs')).toHaveCount(0);
    await loadSample(page);
    await expect(page.locator('.facts')).toContainText(
      /3 people: \W*Sami\W*, \W*Lina\W*, \W*Yassine/,
    );

    const axe = await new AxeBuilder({ page })
      .include('bc-basecamp-shell')
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test('shows the campsite forecast, warns, and packs for it', async ({
    page,
  }) => {
    await stubForecast(page);
    await loadSample(page);
    // In-app, so the one-time note about added items is still there.
    await page
      .getByRole('link', { name: /Weather/ })
      .first()
      .click();
    const frosty = page.locator('.day.has-warning');
    await expect(frosty).toHaveCount(1);
    await expect(frosty).toContainText('Frost at night');
    await expect(frosty).toContainText('Strong gusts');
    await expect(page.getByRole('status').first()).toContainText(
      'added to the packing list',
    );

    await page
      .getByRole('link', { name: /^Packing/ })
      .first()
      .click();
    const list = page.locator('bc-packing-screen');
    await expect(list).toContainText('Tarp');
    await expect(list).toContainText('Thermal underwear');
  });

  test('scores the nights and links the best one to the Sky lab', async ({
    page,
  }) => {
    await stubForecast(page);
    await loadSample(page);
    await page.goto('/apps/basecamp/nights');
    const nights = page.locator('.night');
    await expect(nights).toHaveCount(2);
    const best = page.locator('.night.best');
    await expect(best).toHaveCount(1);
    await expect(best).toContainText('Best night');
    const link = best.getByRole('link', { name: /Open this sky/ });
    await expect(link).toHaveAttribute(
      'href',
      /^\/labs\/sky\?lat=36\.78&lon=8\.69&at=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/,
    );
  });

  test('ticks items and shares them out', async ({ page }) => {
    await stubForecast(page);
    await loadSample(page);
    await page.goto('/apps/basecamp/packing');
    const bar = page.getByRole('progressbar');
    const before = Number(await bar.getAttribute('aria-valuenow'));
    await page.getByRole('checkbox', { name: /Groundsheet/ }).check();
    await expect(bar).toHaveAttribute('aria-valuenow', String(before + 1));

    // Showing one person's share: every item left is theirs.
    await page.getByRole('radio', { name: 'Lina' }).click();
    const rows = page.locator('.items li');
    await expect(rows.first().locator('option:checked')).toHaveText('Lina');
    await expect(rows.last().locator('option:checked')).toHaveText('Lina');
  });

  test('plans a new trip on the map', async ({ page }) => {
    await stubForecast(page);
    await page.goto('/apps/basecamp/trips');
    await page.getByRole('button', { name: '+ New trip' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Trip name *').fill('Lake weekend');
    await dialog.getByLabel('Kind of trip').selectOption('beach');
    await dialog.getByLabel('Nights').fill('3');
    await dialog
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('Mona');
    await dialog.getByRole('button', { name: '+ Add person' }).click();
    const coords = dialog.locator('.ah-pick__coords');
    const before = await coords.innerText();
    await dialog.locator('.ah-pick__map').click({ position: { x: 60, y: 60 } });
    await expect(coords).not.toHaveText(before);
    await dialog.getByRole('button', { name: 'New trip', exact: true }).click();

    await expect(
      page.getByRole('heading', { level: 3, name: 'Lake weekend' }),
    ).toBeVisible();
    await expect(page.getByText('3 nights')).toBeVisible();
    await page.goto('/apps/basecamp/packing');
    await expect(page.locator('bc-packing-screen')).toContainText('Swimwear');
  });

  test('shares a trip as a link that a friend opens as a copy', async ({
    page,
    browser,
  }) => {
    await stubForecast(page);
    // No share sheet in a test browser: the link shows to copy instead.
    await page.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, 'share', { value: undefined }),
    );
    await loadSample(page);
    await page.getByRole('button', { name: /Share this trip/ }).click();
    const link = await page
      .getByRole('textbox', { name: /Share this trip/ })
      .inputValue();
    expect(link).toMatch(/\/apps\/basecamp\/trips#trip=[\w-]+$/);

    // The friend: another browser, with nothing saved.
    const friend = await browser.newContext({ serviceWorkers: 'block' });
    const theirs = await friend.newPage();
    await theirs.goto(link);
    await expect(theirs.getByRole('status').first()).toContainText(
      '“Aïn Draham forest weekend” was added to your trips.',
    );
    await expect(
      theirs.getByRole('heading', {
        level: 3,
        name: 'Aïn Draham forest weekend',
      }),
    ).toBeVisible();
    // The fragment is spent, so a reload doesn't import it again.
    expect(new URL(theirs.url()).hash).toBe('');
    await friend.close();
  });

  test('saves a backup and restores it as copies', async ({ page }) => {
    await stubForecast(page);
    await loadSample(page);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /Save a backup file/ }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      /^basecamp-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const backup = JSON.parse(readFileSync(await file.path(), 'utf8'));
    expect(backup).toMatchObject({ app: 'basecamp', version: 1 });

    await page.locator('bc-share-panel input[type=file]').setInputFiles({
      name: 'basecamp-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(page.locator('bc-share-panel .status')).toContainText(
      '1 trip and 0 gear items restored',
    );
    await expect(
      page.getByRole('combobox', { name: 'Trip' }).locator('option'),
    ).toHaveCount(2);
  });

  test('follows the site language, right to left in Arabic', async ({
    page,
  }) => {
    await stubForecast(page);
    await page.goto('/apps/basecamp/trips');
    await page.getByRole('button', { name: 'العربية' }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'الرحلات' }),
    ).toBeVisible();
    await expect(page.locator('bc-basecamp-shell .basecamp')).toHaveAttribute(
      'dir',
      'rtl',
    );
    await expect(page).toHaveTitle('الرحلات · Basecamp');
  });
});

test('remotes use the shell’s app mode, not their own copy', async ({
  page,
}) => {
  // Federation shares the platform's libs as one bundle per scope: a
  // remote whose bundle differs from the shell's loads its own APP_MODE
  // and would run as if standalone (its own language switch, real data).
  await page.goto('/apps/lighting/projects');
  await expect(page.getByText('No projects yet')).toBeVisible();
  await expect(page.locator('lp-luxpath-shell .langs')).toHaveCount(0);
});
