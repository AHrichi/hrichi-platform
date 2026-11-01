import { expect, test } from './support/test';

test.describe('New version prompt', () => {
  // Requests a service worker makes skip page.route, so the mocked
  // build-info.json would 404; the worker's own path has a unit test.
  test.use({ serviceWorkers: 'block' });

  test('offers a reload when a loaded app has a newer build live', async ({
    page,
  }) => {
    // The static e2e servers write no build-info.json; answer for LuxPath.
    let sha = 'first-build';
    await page.route('**/build-info.json', (route) =>
      route.fulfill({ json: { app: 'product-lighting', sha } }),
    );

    // The shell notes the build it loaded before anything changes.
    const loadedBuild = page.waitForResponse('**/build-info.json');
    await page.goto('/apps/lighting/calculations');
    await loadedBuild;
    await expect(
      page.getByRole('heading', { level: 2, name: 'Calculators' }),
    ).toBeVisible();
    const banner = page.locator('.update-banner');
    await expect(banner).toHaveCount(0);

    // A deploy lands; coming back to the tab looks for it.
    sha = 'second-build';
    await page.evaluate(() =>
      document.dispatchEvent(new Event('visibilitychange')),
    );
    await expect(banner).toContainText('A new version of this site');
    await expect(
      banner.getByRole('button', { name: 'Hard reload' }),
    ).toHaveAccessibleDescription(/offline copy/);

    await banner.getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner).toHaveCount(0);

    await page.evaluate(() =>
      document.dispatchEvent(new Event('visibilitychange')),
    );
    // Dismissed stays dismissed until something new turns up.
    await expect(banner).toHaveCount(0);
  });

  test('reloads the page from the banner', async ({ page }) => {
    let sha = 'first-build';
    await page.route('**/build-info.json', (route) =>
      route.fulfill({ json: { app: 'product-lighting', sha } }),
    );
    // The shell notes the build it loaded before anything changes.
    const loadedBuild = page.waitForResponse('**/build-info.json');
    await page.goto('/apps/lighting/calculations');
    await loadedBuild;
    await expect(
      page.getByRole('heading', { level: 2, name: 'Calculators' }),
    ).toBeVisible();

    sha = 'second-build';
    await page.evaluate(() =>
      document.dispatchEvent(new Event('visibilitychange')),
    );
    const banner = page.locator('.update-banner');
    await expect(banner).toBeVisible();

    const reloaded = page.waitForEvent('load');
    await banner.getByRole('button', { name: 'Reload', exact: true }).click();
    await reloaded;
    await expect(
      page.getByRole('heading', { level: 2, name: 'Calculators' }),
    ).toBeVisible();
  });
});
