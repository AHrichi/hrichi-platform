import { loadSampleProjects } from './support/luxpath';
import { expect, test } from './support/test';

// A 1×1 PNG, enough for the browser to decode and shrink as a camera photo.
const PHOTO = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('LuxPath energy, photos and report', () => {
  test('compares LEDs with the old lamps and shows the payback', async ({
    page,
  }) => {
    await page.goto('/apps/lighting/calculations?tab=energy');
    const results = page.locator('section[aria-labelledby="lp-calc-results"]');
    // 20 × 170 W old lamps against 60 W LEDs dimmed 30 % for 11.5 h a night.
    await expect(results).toContainText('LEDs use 75 % less energy');
    await expect(
      results.locator('ah-metric-card', { hasText: 'Saved per year' }),
    ).toBeVisible();
    await expect(page.locator('lp-energy-diagram')).toContainText('75');

    await page.getByRole('spinbutton', { name: /Old lamp power/ }).fill('60');
    await page
      .getByRole('spinbutton', { name: /Saved by night dimming/ })
      .fill('0');
    await expect(results).toContainText('the LEDs save nothing');
  });

  test('adds a photo to a pole and prints it in the report', async ({
    page,
  }) => {
    await loadSampleProjects(page);
    const title = await page.locator('#lp-project-name').innerText();

    await page.getByRole('button', { name: '+ Add pole' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Pole code/).fill('PH-1');
    await dialog.locator('lp-pole-photos input[type=file]').setInputFiles({
      name: 'pole.png',
      mimeType: 'image/png',
      buffer: PHOTO,
    });
    await expect(dialog.locator('lp-pole-photos figure img')).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Add pole' }).click();
    await expect(
      page.locator('li', { hasText: 'PH-1' }).locator('.photo-count'),
    ).toContainText('1');

    await page.getByRole('link', { name: /Project report/ }).click();
    await expect(page).toHaveURL(/\/apps\/lighting\/report$/);
    const report = page.getByRole('article', { name: 'Project report' });
    await expect(
      report.getByRole('heading', { level: 2, name: title }),
    ).toBeVisible();
    await expect(report.getByRole('row', { name: /PH-1/ })).toBeVisible();
    await expect(report.locator('.photo-grid img')).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: /Print or save as PDF/ }),
    ).toBeVisible();
  });
});
