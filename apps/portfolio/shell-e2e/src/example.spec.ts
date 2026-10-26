import { test, expect } from '@playwright/test';

const recruiterHeadline =
  'Angular & full-stack developer with 5+ years of enterprise SaaS';

test('content pages are prerendered with their own metadata', async ({
  request,
}) => {
  for (const [path, title] of [
    ['/', 'Ahmed Hrichi · Angular & Full-Stack Developer'],
    [
      '/work/this-platform',
      'This site: a micro-frontend platform deployed for $0 · Ahmed Hrichi',
    ],
    ['/experience', 'Experience · Ahmed Hrichi'],
    ['/cv', 'CV · Ahmed Hrichi'],
  ]) {
    const html = await (await request.get(path)).text();

    expect(html, path).toContain('ng-server-context="ssg"');
    expect(html, path).toContain(
      `<title>${title.replace('&', '&amp;')}</title>`,
    );
    expect(html, path).toContain('rel="canonical"');
  }
});

test('switches copy for each audience and remembers ?for=', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(recruiterHeadline);

  await page.getByRole('radio', { name: 'Client' }).click();
  await expect(page.locator('h1')).toHaveText(
    'Angular, 3D and integration work for product teams',
  );

  await page.goto('/?for=engineer');
  await expect(page.locator('h1')).toHaveText(
    'I build Angular platforms that scale',
  );
  await page.goto('/');
  await expect(page.getByRole('radio', { name: 'Engineer' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('opens a case study from the work list', async ({ page }) => {
  await page.goto('/work');
  await page
    .getByRole('link', { name: 'A plug-and-play integration platform' })
    .click();

  await expect(page).toHaveURL(/\/work\/schema-driven-integrations$/);
  await expect(
    page.getByRole('heading', { name: 'Decisions and why' }),
  ).toBeVisible();
});

test('loads the hello remote through Native Federation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Micro-frontend demo' }).click();

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
  await page.getByRole('link', { name: 'Micro-frontend demo' }).click();

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
  await expect(page.getByRole('link', { name: 'Work' })).toBeVisible();
});
