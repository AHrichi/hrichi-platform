import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// page.route can't see requests a service worker handles.
test.use({ serviceWorkers: 'block' });

const api = 'https://orbit.test';

/** Points the lab at a fake Orbit API, or at none. */
async function siteConfig(page: Page, orbitApiUrl: string | null) {
  await page.route('**/site-config.json', (route) =>
    route.fulfill({
      json: { apiUrl: null, turnstileSiteKey: null, orbitApiUrl },
    }),
  );
}

const iss = {
  OBJECT_NAME: 'ISS (ZARYA)',
  OBJECT_ID: '1998-067A',
  EPOCH: '2026-10-26T14:18:26.812224',
  MEAN_MOTION: 15.49065369,
  ECCENTRICITY: 0.00069323,
  INCLINATION: 51.6336,
  RA_OF_ASC_NODE: 9.8132,
  ARG_OF_PERICENTER: 312.5452,
  MEAN_ANOMALY: 47.4951,
  EPHEMERIS_TYPE: 0,
  CLASSIFICATION_TYPE: 'U',
  NORAD_CAT_ID: 25544,
  ELEMENT_SET_NO: 999,
  REV_AT_EPOCH: 59212,
  BSTAR: 0.00011932835,
  MEAN_MOTION_DOT: 0.00006146,
  MEAN_MOTION_DDOT: 0,
};

test('prerenders the intro, so the first paint never waits for the remote', async ({
  request,
}) => {
  const html = await (await request.get('/labs/orbit')).text();
  expect(html).toContain('Every active satellite, right now');
});

test('works from the bundled snapshot when no API is configured', async ({
  page,
}) => {
  await siteConfig(page, null);
  await page.goto('/labs/orbit');

  await expect(
    page.getByRole('heading', { name: 'Every active satellite, right now' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('brightest satellites');
  await expect(
    page.getByRole('heading', { name: 'ISS (ZARYA)' }),
  ).toBeVisible();
  await expect(page.getByText(/isn't configured here/).last()).toBeVisible();

  // The globe is the content, so it renders whenever WebGL2 exists.
  await expect(page.locator('ah-orbit-lab-page ah-scene')).toHaveAttribute(
    'data-state',
    'ready',
  );

  const axe = await new AxeBuilder({ page })
    .include('ah-orbit-lab-page')
    .analyze();
  expect(axe.violations).toEqual([]);
});

test('switches to the live catalog and shows passes from the API', async ({
  page,
}) => {
  await siteConfig(page, api);
  await page.route(`${api}/satellites?ngsw-bypass=true`, (route) =>
    route.fulfill({
      json: {
        group: 'all',
        source: 'celestrak',
        fetchedAt: '2026-10-27T10:02:34Z',
        count: 1,
        satellites: [iss],
      },
    }),
  );
  await page.route(`${api}/satellites/25544/passes**`, (route) =>
    route.fulfill({
      json: {
        noradId: 25544,
        name: 'ISS (ZARYA)',
        passes: [
          {
            rise: {
              time: '2030-01-01T18:00:00Z',
              azimuthDeg: 200,
              elevationDeg: 10,
            },
            culmination: {
              time: '2030-01-01T18:03:00Z',
              azimuthDeg: 130,
              elevationDeg: 61,
            },
            set: {
              time: '2030-01-01T18:06:00Z',
              azimuthDeg: 60,
              elevationDeg: 10,
            },
            durationSeconds: 360,
            visible: true,
          },
        ],
      },
    }),
  );

  await page.goto('/labs/orbit');

  await expect(page.getByRole('status')).toContainText(
    'Live: 1 active satellite,',
  );
  await expect(page.getByText('up to 61° · 6 min')).toBeVisible();
  await expect(page.getByText('Visible to the eye')).toBeVisible();
});

test('finds a satellite by name and keeps working without WebGL', async ({
  page,
}) => {
  await siteConfig(page, null);
  await page.goto('/labs/orbit?3d=off');

  await expect(page.getByText('The globe needs WebGL')).toBeVisible();
  await page.getByLabel('Find a satellite').fill('tianhe');
  await page.getByRole('button', { name: /CSS \(TIANHE\)/ }).click();

  await expect(
    page.getByRole('heading', { name: 'CSS (TIANHE)' }),
  ).toBeVisible();
  await expect(page.getByLabel('Find a satellite')).toHaveValue('');
});
