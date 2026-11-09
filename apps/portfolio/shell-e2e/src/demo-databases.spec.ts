import type { Page } from '@playwright/test';
import { loadSampleProjects } from './support/luxpath';
import { expect, test } from './support/test';

/** This origin's IndexedDB databases. */
function databases(page: Page): Promise<string[]> {
  return page.evaluate(async () =>
    (await indexedDB.databases()).map((db) => db.name ?? '').sort(),
  );
}

/** A LuxPath project as the portfolio's demo saved it before November 2026. */
const OLD_PROJECT = {
  id: 'proj_saved_before',
  title: 'Avenue de la Liberté',
  clientOrMunicipality: 'Municipality of Sfax',
  locationName: 'Sfax',
  gpsCenter: { lat: 34.74, lng: 10.76 },
  stage: 'survey',
  startDate: '2026-09-01',
  commissioningDeadline: '2026-12-31',
  roadWidthMeters: 12,
  roadClass: 'M3',
  lightingType: 'mixed',
  windZone: 2,
  defaultSoil: 'firm_clay',
  engineerName: 'Field engineer',
  poles: [],
  milestones: [],
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-01T08:00:00.000Z',
};

test.describe('the portfolio’s demo databases', () => {
  // Basecamp's demo database is checked in basecamp.spec.ts, which runs
  // while Basecamp is public.
  test('a new visitor gets LuxPath’s demo database', async ({ page }) => {
    await loadSampleProjects(page);

    const names = await databases(page);
    expect(names).toContain('ah-demo-lighting');
    // Not the name the app uses for real data.
    expect(names).not.toContain('luxpath_lighting_db_v1');
  });

  test('a browser that used the demo before keeps its projects', async ({
    page,
  }) => {
    // Until November 2026 the demo saved into LuxPath's standalone database.
    await page.goto('/');
    await page.evaluate(
      (project) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open('luxpath_lighting_db_v1', 2);
          request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore('projects', { keyPath: 'id' }).put(project);
            db.createObjectStore('materials', { keyPath: 'id' });
          };
          request.onsuccess = () => {
            request.result.close();
            resolve();
          };
          request.onerror = () => reject(request.error);
        }),
      OLD_PROJECT,
    );

    await page.goto('/apps/lighting/projects');
    await expect(page.locator('#lp-project-name')).toHaveText(
      'Avenue de la Liberté',
    );
    const names = await databases(page);
    expect(names).toContain('luxpath_lighting_db_v1');
    expect(names).not.toContain('ah-demo-lighting');
  });
});
