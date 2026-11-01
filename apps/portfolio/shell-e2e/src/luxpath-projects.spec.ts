import { readFileSync } from 'node:fs';
import { loadSampleProjects } from './support/luxpath';
import { expect, test } from './support/test';

test.describe('LuxPath projects', () => {
  // page.route can't see requests made through the service worker.
  test.use({ serviceWorkers: 'block' });

  test('starts with no project, and points to the guide', async ({ page }) => {
    await page.goto('/apps/lighting/projects');
    await expect(page.getByText('No projects yet')).toBeVisible();
    await page.getByRole('link', { name: /Read how LuxPath works/ }).click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'How to use LuxPath' }),
    ).toBeVisible();
    await expect(page.locator('lp-guide-screen article')).toHaveCount(9);
    await page.getByRole('link', { name: 'Open Plumb check →' }).click();
    await expect(page).toHaveURL(/\/apps\/lighting\/verticality$/);
  });

  test('saves a backup file and restores it as copies', async ({ page }) => {
    await loadSampleProjects(page);
    const picker = page.getByRole('combobox', { name: 'Project' });
    const before = await picker.locator('option').count();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save a backup file' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      /^luxpath-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const backup = JSON.parse(readFileSync(await file.path(), 'utf8'));
    expect(backup).toMatchObject({ app: 'luxpath', version: 1 });
    expect(backup.projects).toHaveLength(before);

    await page.locator('lp-backup-panel input[type=file]').setInputFiles({
      name: 'luxpath-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(page.locator('lp-backup-panel .status')).toContainText(
      `${before} projects restored`,
    );
    await expect(picker.locator('option')).toHaveCount(before * 2);
  });

  test('refuses a file that is not a backup', async ({ page }) => {
    await page.goto('/apps/lighting/projects');
    await page.locator('lp-backup-panel input[type=file]').setInputFiles({
      name: 'notes.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello": "world"}'),
    });
    await expect(page.locator('lp-backup-panel .status')).toContainText(
      'isn’t a LuxPath backup',
    );
  });

  test('shows real photos of the materials, with credits', async ({ page }) => {
    await page.goto('/apps/lighting/materials');
    const photo = page.locator('article .photo').first();
    await expect(photo.locator('img')).toHaveJSProperty('complete', true);
    await expect(photo.locator('figcaption')).toContainText('Photo:');
    await expect(photo.locator('figcaption')).toContainText('CC BY');
  });

  test('places a new project on the map and names it from the point', async ({
    page,
  }) => {
    await page.route('**/nominatim.openstreetmap.org/reverse**', (route) =>
      route.fulfill({
        json: { address: { road: 'Avenue Habib Bourguiba', city: 'Tunis' } },
      }),
    );
    await page.goto('/apps/lighting/projects');
    await page.getByRole('button', { name: '+ New project' }).first().click();
    const picker = page.locator('ah-map-picker');
    const coords = picker.locator('.ah-pick__coords');
    const before = await coords.innerText();
    const map = picker.locator('.ah-pick__map');
    await map.scrollIntoViewIfNeeded();
    await map.click({ position: { x: 90, y: 90 } });
    await expect(coords).not.toHaveText(before);
    await expect(page.getByRole('textbox', { name: 'Location' })).toHaveValue(
      'Avenue Habib Bourguiba, Tunis',
    );
  });
});
