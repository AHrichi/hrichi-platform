import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test';

// page.route can't see requests a service worker handles.
test.use({ serviceWorkers: 'block' });

test('prerenders the intro, so the first paint never waits for the remote', async ({
  request,
}) => {
  const html = await (await request.get('/labs/sky')).text();
  expect(html).toContain('The sky above any campsite, any night');
});

test('opens on the globe, describes tonight and dives into the sky', async ({
  page,
}) => {
  await page.goto('/labs/sky');

  await expect(
    page.getByRole('heading', { name: "What's up tonight" }),
  ).toBeVisible();
  await expect(page.getByText('Truly dark')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Planets' })).toBeVisible();
  // The globe is the content, so it renders whenever WebGL2 exists.
  await expect(page.locator('ah-sky-lab-page ah-scene')).toHaveAttribute(
    'data-state',
    'ready',
  );

  await page.getByRole('button', { name: 'Look up at the sky' }).click();
  await expect(
    page.getByRole('button', { name: 'Back to Earth' }),
  ).toBeVisible();
  await page.getByRole('radio', { name: 'N', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'N', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');

  const axe = await new AxeBuilder({ page })
    .include('ah-sky-lab-page')
    .analyze();
  expect(axe.violations).toEqual([]);
});

test('moves to a chosen city and offers a link to its sky', async ({
  page,
}) => {
  await page.goto('/labs/sky');
  await page.getByLabel('Campsite or city').selectOption('Sydney');

  await expect(
    page.getByRole('heading', { name: 'Sydney, Australia' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Link to this sky' }),
  ).toHaveAttribute('href', /lat=-33\.87&lon=151\.21/);
});

test('opens a shared link straight in the sky, at its moment', async ({
  page,
}) => {
  await page.goto('/labs/sky?lat=36.81&lon=10.18&at=2026-08-12T22:00Z');

  await expect(
    page.getByRole('button', { name: 'Back to Earth' }),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Paused' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText('Perseids', { exact: true })).toBeVisible();
});

test('sends old Orbit lab links to the Sky lab', async ({ page }) => {
  await page.goto('/labs/orbit');
  await expect(page).toHaveURL(/\/labs\/sky$/);
});

test('keeps working without WebGL', async ({ page }) => {
  await page.goto('/labs/sky?3d=off');

  await expect(page.getByText('The 3D sky needs WebGL')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "What's up tonight" }),
  ).toBeVisible();
});

test('starts paused when the visitor prefers reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/labs/sky');

  await expect(page.getByRole('radio', { name: 'Paused' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});
