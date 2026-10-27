import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('opens the hood from ?inspect=1 and shows the loaded remote', async ({
  page,
}) => {
  await page.goto('/labs/hello?inspect=1');
  await expect(
    page.getByRole('heading', { name: 'Hello from a federated remote' }),
  ).toBeVisible();

  const inspector = page.getByRole('region', { name: 'Under the hood' });
  await expect(inspector).toBeVisible();
  const row = inspector.getByRole('row', { name: /lab-hello/ });
  await expect(row).toContainText('loaded');
  await expect(row).toContainText(/\d+ ms/);

  await inspector.getByRole('tab', { name: 'Shared deps' }).click();
  await expect(
    inspector.getByRole('row', { name: /@angular\/core/ }),
  ).toBeVisible();
  await inspector.getByRole('tab', { name: 'Shared deps' }).press('ArrowRight');
  await expect(inspector.getByRole('tab', { name: 'State' })).toBeFocused();
  await expect(inspector.getByText('"audience"')).toBeVisible();

  const axe = await new AxeBuilder({ page }).include('ah-inspector').analyze();
  expect(axe.violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(inspector).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open the hood' }),
  ).toBeFocused();
});

test('reports a remote that is down as failed', async ({ page }) => {
  await page.route('http://localhost:4301/**', (route) => route.abort());
  await page.goto('/labs/hello');
  await expect(
    page.getByRole('heading', { name: "This section didn't load" }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Open the hood' }).click();

  const row = page
    .getByRole('region', { name: 'Under the hood' })
    .getByRole('row', { name: /lab-hello/ });
  await expect(row).toContainText('failed');
});
