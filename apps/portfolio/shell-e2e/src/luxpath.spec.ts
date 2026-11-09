import { loadSampleProjects } from './support/luxpath';
import { chooseLanguage } from './support/site';
import { expect, test } from './support/test';

test.describe('LuxPath inside the portfolio', () => {
  test('follows the site language, right to left in Arabic', async ({
    page,
  }) => {
    await page.goto('/apps/lighting/calculations');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Calculators' }),
    ).toBeVisible();

    await chooseLanguage(page, 'fr');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Calculs' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    await chooseLanguage(page, 'ar');
    await expect(
      page.getByRole('heading', { level: 2, name: 'الحسابات' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page).toHaveTitle('الحسابات · LuxPath');
  });

  test('reopens a saved calculation, corrects it and updates it', async ({
    page,
  }) => {
    await loadSampleProjects(page);
    await page.goto('/apps/lighting/calculations?tab=spacing');
    await page.getByRole('spinbutton', { name: /^Spacing S/ }).fill('34');
    await page.getByRole('button', { name: 'Save to project' }).click();
    await expect(page.getByRole('status')).toContainText('Saved to');

    await page.goto('/apps/lighting/projects');
    const saved = page.locator('lp-saved-results li').first();
    await expect(saved).toContainText('S/H 4.25');

    await saved.getByRole('link', { name: /Open & edit/ }).click();
    await expect(
      page.getByRole('spinbutton', { name: /^Spacing S/ }),
    ).toHaveValue('34');
    await page.getByRole('spinbutton', { name: /^Spacing S/ }).fill('30');
    await page.getByRole('button', { name: 'Update saved result' }).click();
    await expect(page.getByRole('status')).toContainText('Saved to');

    await page.goto('/apps/lighting/projects');
    await expect(page.locator('lp-saved-results li')).toHaveCount(1);
    await expect(page.locator('lp-saved-results li').first()).toContainText(
      'S/H 3.75',
    );
  });

  test('turns corrected camera readings into a distance and a height', async ({
    page,
  }) => {
    await page.goto('/apps/lighting/camera');
    await expect(
      page.getByText('How to measure a pole with your phone'),
    ).toBeVisible();

    // 1.65 m / tan 12° = 7.8 m away; 7.8 × tan 30° + 1.65 = 6.2 m tall.
    await page.getByRole('spinbutton', { name: /^Eye height h/ }).fill('1.65');
    await page
      .getByRole('spinbutton', { name: /^Angle to the foot α/ })
      .fill('12');
    await page
      .getByRole('spinbutton', { name: /^Angle to the top β/ })
      .fill('30');
    await expect(
      page.locator('ah-metric-card', { hasText: 'Distance D' }),
    ).toContainText('7.8');
    await expect(
      page.locator('ah-metric-card', { hasText: 'Pole height H' }),
    ).toContainText('6.2');
  });
});

test('a content page follows the site language and stays left to right in French', async ({
  page,
}) => {
  await page.goto('/experience');
  await chooseLanguage(page, 'fr');

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(
    page.getByRole('navigation', { name: 'Principale' }),
  ).toBeVisible();
  // Every page is translated now, so no "English only" note shows.
  await expect(page.getByRole('note')).toHaveCount(0);
});
