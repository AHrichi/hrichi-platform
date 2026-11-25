import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { expect, test } from './support/test';
import { appIsPublic, chooseLanguage } from './support/site';

// SerraCalc, greenhouse heat, water and climate (ADR-0027). Local-first:
// projects live in IndexedDB, nothing calls a server.
const STANDALONE = 'http://localhost:4314/';

// The standalone build registers a service worker (offline use); a cached
// app must not carry from one test to the next.
test.use({ serviceWorkers: 'block' });

/** Every screen of the app, in the order of its navigation. */
const SCREENS = [
  'projects',
  'site',
  'site?tab=plants',
  'site?tab=economics',
  'heating',
  'cooling',
  'water',
  'supply',
  'supply?tab=fertigation',
  'air',
  'air?tab=vpd',
  'cooling?tab=fog',
  'calendar',
  'energy',
  'energy?tab=reuse',
  'energy?tab=cooling',
  'greenhouse',
  'operations',
  'data',
  'climate',
  'science',
  'report',
  'guide',
] as const;

test.use({ serviceWorkers: 'block' });

async function loadSamples(page: Page): Promise<void> {
  await page.goto(`${STANDALONE}projects`);
  await page.getByRole('button', { name: 'Load sample projects' }).click();
  // The samples are saved once the project card shows.
  await expect(
    page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
  ).toBeVisible();
}

/** Saves the peak heating load of the active project. */
async function savePeak(page: Page): Promise<void> {
  await page.goto(`${STANDALONE}heating?tab=peak`);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Editing', { exact: true })).toBeVisible();
}

/** Standalone: open the globe menu and pick a language by its own name. */
async function pickLanguage(page: Page, nativeName: string): Promise<void> {
  await page.locator('sc-lang-menu .trigger').click();
  await page.getByRole('menuitemradio', { name: nativeName }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}

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
    await pickLanguage(page, 'English');
    await expect(page.locator('sc-serra-shell')).toHaveAttribute(
      'data-look',
      'desert',
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
    await pickLanguage(page, 'English');
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
    await loadSamples(page);
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

  for (const theme of ['light', 'dark'] as const) {
    for (const [width, height] of [
      [375, 812],
      [1280, 900],
    ] as const) {
      test(`every screen passes axe, ${theme}, ${width} px wide`, async ({
        page,
      }) => {
        // Twenty-odd screens, each scanned whole: more than the default 30 s.
        test.setTimeout(180_000);
        await page.addInitScript(
          (chosen) => localStorage.setItem('ah.theme', chosen),
          theme,
        );
        await page.setViewportSize({ width, height });
        await loadSamples(page);
        await savePeak(page);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        for (const path of SCREENS) {
          await page.goto(`${STANDALONE}${path}`);
          await expect(page.locator('sc-serra-shell h2').first()).toBeVisible();
          // Open every "Show the numbers", so axe checks the tables too.
          await page
            .locator('details')
            .evaluateAll((all) =>
              all.forEach((d) => ((d as HTMLDetailsElement).open = true)),
            );
          const results = await new AxeBuilder({ page }).analyze();
          // Soft, so one screen's failure doesn't hide the next ones.
          expect
            .soft(results.violations, `${path}, ${theme}, ${width}`)
            .toEqual([]);
        }
      });
    }
  }

  test('speaks Italian and German, with their own number formats', async ({
    page,
  }) => {
    await loadSamples(page);
    await page.goto(`${STANDALONE}heating?tab=peak`);
    await pickLanguage(page, 'Italiano');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Riscaldamento' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('ah-metric-card').first()).toContainText('825,2');
    await expect(page).toHaveTitle('Riscaldamento · SerraCalc');

    await pickLanguage(page, 'Deutsch');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heizung' }),
    ).toBeVisible();
    await expect(page.getByText('Heizanlage', { exact: true })).toBeVisible();
    // Through the app (a fresh load would take English again).
    await page.getByRole('link', { name: 'Gewächshaus' }).first().click();
    // German groups thousands with a point: 9.600 m² for the Kebili house.
    await expect(page.locator('sc-serra-shell')).toContainText('9.600');
  });

  test('switches light and dark, and remembers it', async ({ page }) => {
    await page.addInitScript(() => {
      // Light on the first visit only, so the reload keeps the choice.
      if (!sessionStorage.getItem('sc-seeded')) {
        localStorage.setItem('ah.theme', 'light');
        sessionStorage.setItem('sc-seeded', '1');
      }
    });
    await page.goto(`${STANDALONE}heating`);
    const html = page.locator('html');
    const dark = page.getByRole('button', { name: 'Dark' });
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(dark).toHaveAttribute('aria-pressed', 'false');
    const text = () =>
      page.locator('.serra').evaluate((el) => getComputedStyle(el).color);
    const lightText = await text();

    await dark.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(text).not.toBe(lightText);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('backs up the projects and restores them as copies', async ({
    page,
  }) => {
    await loadSamples(page);
    await savePeak(page);
    await page.goto(`${STANDALONE}projects`);
    const picker = page.getByRole('combobox', { name: 'Project' });
    await expect(picker.locator('option')).toHaveCount(3);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save a backup file' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      /^serracalc-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const backup = JSON.parse(readFileSync(await file.path(), 'utf8'));
    expect(backup).toMatchObject({ app: 'serracalc', version: 1 });
    expect(backup.projects).toHaveLength(3);
    // Inputs travel with their project; results are worked out again.
    const saved = backup.projects
      .flatMap((p: { calculations: unknown[] }) => p.calculations)
      .at(0);
    expect(saved).toMatchObject({ kind: 'heatPeak' });
    expect(saved).toHaveProperty('inputs.outsideDesignC');

    await page.locator('sc-backup-panel input[type=file]').setInputFiles({
      name: 'serracalc-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(page.locator('sc-backup-panel .status')).toContainText(
      '3 projects restored',
    );
    await expect(picker.locator('option')).toHaveCount(6);
  });

  test('refuses a file that is not a SerraCalc backup', async ({ page }) => {
    await page.goto(`${STANDALONE}projects`);
    await page.locator('sc-backup-panel input[type=file]').setInputFiles({
      name: 'luxpath-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"app":"luxpath","version":1,"projects":[]}'),
    });
    await expect(page.locator('sc-backup-panel .status')).toContainText(
      'isn’t a SerraCalc backup',
    );
  });

  test('records a shared plant and checks it against the peak day', async ({
    page,
  }) => {
    await loadSamples(page);
    await page.goto(`${STANDALONE}site?tab=plants`);
    await page.getByRole('button', { name: 'Add the plant' }).click();
    const plant = page.getByRole('group', { name: 'Seawater RO' });
    await expect(plant).toBeVisible();
    await expect(page.getByText('RO water', { exact: true })).toBeVisible();
    // Kept on the device: the sites store survives a reload.
    await page.reload();
    await expect(plant).toBeVisible();
  });

  test('prints a report of the project without the app around it', async ({
    page,
  }) => {
    await loadSamples(page);
    await savePeak(page);
    await page.goto(`${STANDALONE}report`);
    const report = page.locator('article.report');
    await expect(
      report.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
    await expect(report.locator('.result')).toHaveCount(1);
    await expect(report.locator('.result')).toContainText('825.2 kW');
    await expect(report).toContainText('A planning aid');

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.bar')).toBeHidden();
    await expect(page.locator('nav.bottom')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Print or save as PDF' }),
    ).toBeHidden();
    await expect(report).toBeVisible();
  });

  test('reads right to left in Arabic, drawings kept left to right', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}water`);
    await pickLanguage(page, 'العربية');
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

  test('follows the site’s language and theme as they change', async ({
    page,
  }) => {
    await page.goto('/apps/serracalc/heating');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heating' }),
    ).toBeVisible();
    // The site's header has the switches; SerraCalc shows none of its own.
    await expect(page.locator('sc-serra-shell sc-lang-menu')).toHaveCount(0);

    await chooseLanguage(page, 'it');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Riscaldamento' }),
    ).toBeVisible();
    await chooseLanguage(page, 'de');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heizung' }),
    ).toBeVisible();
    await chooseLanguage(page, 'ar');
    await expect(page.locator('.serra')).toHaveAttribute('dir', 'rtl');

    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    const text = () =>
      page
        .locator('sc-serra-shell .serra')
        .evaluate((el) => getComputedStyle(el).color);
    const textBefore = await text();
    await page.locator('.theme-toggle').click();
    await expect(html).not.toHaveAttribute('data-theme', before ?? '');
    await expect.poll(text).not.toBe(textBefore);
  });

  test('the old address redirects', async ({ page }) => {
    await page.goto('/apps/greenhouse-energy');
    await expect(page).toHaveURL(/\/apps\/serracalc\//);
  });
});
