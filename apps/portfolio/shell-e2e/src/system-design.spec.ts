import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test';
import { appIsPublic } from './support/site';

// The System Design course (ADR-0025). Standalone checks run now; embedded
// checks switch on with its visibility flag (go-live phase P12).
const STANDALONE = 'http://localhost:4312/';

test.use({ serviceWorkers: 'block' });

test.describe('System Design, standalone', () => {
  test('opens on its paper-look shell, in English, left to right', async ({
    page,
  }) => {
    await page.goto(STANDALONE);
    const shell = page.locator('sd-shell');
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute('data-look', 'paper');
    await expect(shell).toHaveAttribute('lang', 'en');
    await expect(shell).toHaveAttribute('dir', 'ltr');
    await expect(
      page.getByRole('heading', { level: 1, name: 'System Design' }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('sd-shell')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('System Design, inside the portfolio', () => {
  test.skip(!appIsPublic('system-design'), 'Hidden until go-live (P12).');

  test('mounts under /apps/system-design', async ({ page }) => {
    await page.goto('/apps/system-design');
    await expect(page.locator('sd-shell')).toBeVisible();
  });
});
