import { test, expect } from '@playwright/test';

test('home page is prerendered', async ({ request }) => {
  const html = await (await request.get('/')).text();

  expect(html).toContain('ng-server-context="ssg"');
  expect(html).toContain('<h1>Ahmed Hrichi</h1>');
});

test('loads the hello remote through Native Federation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Hello lab' }).click();

  const counter = page.getByRole('button', { name: 'Clicked 0 times' });
  await expect(counter).toBeVisible();
  await counter.click();
  await expect(
    page.getByRole('button', { name: 'Clicked 1 times' }),
  ).toBeVisible();
});

test('boots without the federation manifest', async ({ page }) => {
  await page.route('**/federation.manifest.json', (route) =>
    route.fulfill({ status: 404, body: 'Not found' }),
  );
  await page.goto('/');
  await page.getByRole('link', { name: 'Hello lab' }).click();

  await expect(
    page.getByRole('heading', { name: "This section didn't load" }),
  ).toBeVisible();
});

test('shows a fallback when a remote is unreachable', async ({ page }) => {
  await page.route('http://localhost:4301/**', (route) => route.abort());
  await page.goto('/labs/hello');

  await expect(
    page.getByRole('heading', { name: "This section didn't load" }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
});
