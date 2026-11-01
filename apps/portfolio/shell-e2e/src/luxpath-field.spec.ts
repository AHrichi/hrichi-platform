import { loadSampleProjects } from './support/luxpath';
import { expect, test } from './support/test';

test.describe('LuxPath field tools', () => {
  test('checks a span: wire, pole and clearance, and saves it', async ({
    page,
  }) => {
    await loadSampleProjects(page);
    await page.goto('/apps/lighting/calculations?tab=span');
    const results = page.locator('section[aria-labelledby="lp-calc-results"]');
    await expect(results).toContainText(
      'The wire and the pole hold at this span',
    );
    await expect(
      results.locator('ah-metric-card', { hasText: 'Longest safe span' }),
    ).toContainText('60.5');

    // An end pole takes the full pull of the wire: 250 daN is not enough.
    await page
      .getByRole('combobox', { name: 'Pole in the line' })
      .selectOption('terminal');
    await expect(results).toContainText('Not safe at this span');
    await expect(results).toContainText('rated load');

    await page.getByRole('button', { name: 'Save to project' }).click();
    await expect(page.getByRole('status')).toContainText('Saved to');
    await page.goto('/apps/lighting/projects');
    await expect(page.locator('lp-saved-results')).toContainText('L 35 m');
  });

  test('checks the spacing against the cable the poles carry', async ({
    page,
  }) => {
    await page.goto('/apps/lighting/calculations?tab=spacing');
    const results = page.locator('section[aria-labelledby="lp-calc-results"]');
    const card = results.locator('ah-metric-card', {
      hasText: 'Longest spacing for the cable',
    });
    await expect(card).toContainText('31.5');
    await expect(results).toContainText(
      'The cable and the poles hold at S = 28 m',
    );

    await page.getByRole('spinbutton', { name: /^Spacing S/ }).fill('40');
    await expect(results).toContainText(
      'At S = 40 m the cable would be overloaded',
    );

    // Fibreglass poles bring their own typical rating.
    await page.getByRole('combobox', { name: 'Pole type' }).selectOption('frp');
    await expect(
      page.getByRole('spinbutton', { name: /^Pole nominal load/ }),
    ).toHaveValue('120');
  });

  test('shows how to place the phone for a plumb check', async ({ page }) => {
    await page.goto('/apps/lighting/verticality');
    const guide = page.locator('lp-plumb-guide');
    await expect(guide.locator('ol > li')).toHaveCount(4);
    await expect(guide).toContainText('Phone upright, back flat on the pole');
    await expect(guide).toContainText('Common mistakes');
    // Saving needs a steady sensor reading; without one it stays off.
    await expect(page.getByRole('button', { name: 'Save side A' })).toHaveCount(
      0,
    );
  });

  test('says where the AR tape works when this browser has no AR', async ({
    page,
  }) => {
    await page.goto('/apps/lighting/camera');
    await expect(page.locator('lp-ar-tape')).toContainText(
      'needs Chrome on an Android phone',
    );
  });
});

test.describe('Sideways-scrolling rows on a phone', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('the header nav shows there is more to scroll', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('.site-header ul[data-scroll-hint]');
    await expect(nav).toHaveAttribute('data-overflow-end', '');
    await expect(nav.locator('.ah-scroll-cue--end')).toHaveCSS('opacity', '1');

    await nav.locator('.ah-scroll-cue--end').click();
    await expect(nav).toHaveAttribute('data-overflow-start', '');
  });
});

test('the apps page jump links stay on the page', async ({ page }) => {
  await page.goto('/apps');
  await page.locator('.apps-jump-link').nth(1).click();
  await expect(page).toHaveURL(/\/apps#engineering-labs$/);
  await expect(page.locator('#engineering-labs')).toBeInViewport();
});
