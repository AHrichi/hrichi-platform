import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './support/test';
import { appIsPublic } from './support/site';

// The System Design course (ADR-0025). Standalone checks run now; embedded
// checks switch on with its visibility flag (go-live phase P12).
const STANDALONE = 'http://localhost:4312/';

test.use({ serviceWorkers: 'block' });

test.describe('System Design, standalone', () => {
  test('opens on its paper-look shell, steps by keyboard updating URL and HUD, resumes on reload, and shows recap takeaways', async ({
    page,
  }) => {
    await page.goto(STANDALONE);
    const shell = page.locator('sd-shell');
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute('data-look', 'paper');
    await expect(shell).toHaveAttribute('lang', 'en');
    await expect(shell).toHaveAttribute('dir', 'ltr');

    // Redirects / -> /learn/request-journey/1 (golden lesson)
    await expect(page).toHaveURL(/\/learn\/request-journey\/1$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'One Request, End to End' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'One tap, a whole chain of machines',
      }),
    ).toBeVisible();

    const lessonAxe = await new AxeBuilder({ page })
      .include('sd-shell')
      .analyze();
    expect(lessonAxe.violations).toEqual([]);

    // Stepping by keyboard updates URL and HUD
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/\/learn\/request-journey\/2$/);
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'DNS translates the name to an IP',
      }),
    ).toBeVisible();
    await expect(page.locator('sd-hud')).toContainText('40 ms');

    // Wait for the debounced IndexedDB progress save, then verify reload resumes
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const dbs = await indexedDB.databases();
          const dbName = dbs.find((d) =>
            d.name?.includes('system_design'),
          )?.name;
          if (!dbName) return -1;
          return new Promise<number>((resolve) => {
            const req = indexedDB.open(dbName);
            req.onsuccess = () => {
              const db = req.result;
              const tx = db.transaction('progress', 'readonly');
              const getReq = tx.objectStore('progress').get('request-journey');
              getReq.onsuccess = () => {
                const step = getReq.result?.lastStep ?? -1;
                db.close();
                resolve(step);
              };
              getReq.onerror = () => {
                db.close();
                resolve(-1);
              };
            };
            req.onerror = () => resolve(-1);
          });
        }),
      )
      .toBe(1);
    await page.goto(STANDALONE);
    await expect(page).toHaveURL(/\/learn\/request-journey\/2$/);
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'DNS translates the name to an IP',
      }),
    ).toBeVisible();

    // Jump to the recap step via End key and verify takeaways
    await page.keyboard.press('End');
    await expect(page).toHaveURL(/\/learn\/request-journey\/11$/);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Where the time went' }),
    ).toBeVisible();
    await expect(page.locator('sd-step-panel')).toContainText('Key takeaways');
    await expect(page.locator('sd-step-panel')).toContainText(
      'A cold request pays for DNS and TCP+TLS handshakes',
    );
  });

  test('search finds "DNS" and opens the matching lesson', async ({ page }) => {
    await page.goto(`${STANDALONE}learn/napkin-math/1`);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Back-of-the-Envelope Math',
      }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: /Search lessons & concepts/i })
      .click();
    const searchInput = page.getByRole('combobox', {
      name: 'Search lessons and concepts',
    });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('DNS');

    const hit = page.getByRole('option', { name: /One Request, End to End/ });
    await expect(hit).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      'aria-activedescendant',
      (await hit.getAttribute('id')) ?? '',
    );
    const searchAxe = await new AxeBuilder({ page })
      .include('sd-search-dialog')
      .analyze();
    expect(searchAxe.violations).toEqual([]);

    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/learn\/request-journey\/1$/);
  });

  test('passes axe on Practice and Guide screens', async ({ page }) => {
    await page.goto(`${STANDALONE}practice`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Practice' }),
    ).toBeVisible();
    const practiceAxe = await new AxeBuilder({ page })
      .include('sd-shell')
      .analyze();
    expect(practiceAxe.violations).toEqual([]);

    await page.goto(`${STANDALONE}guide`);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'How the System Design course works',
      }),
    ).toBeVisible();
    const guideAxe = await new AxeBuilder({ page })
      .include('sd-shell')
      .analyze();
    expect(guideAxe.violations).toEqual([]);
  });

  test('phone viewport: fixed bottom transport bar steps forward and back', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${STANDALONE}learn/request-journey/1`);

    const bottomBar = page.locator('.phone-bottom-bar');
    await expect(bottomBar).toBeVisible();

    const nextBtn = bottomBar.getByRole('button', { name: /Next/i });
    const backBtn = bottomBar.getByRole('button', { name: /Back/i });
    await expect(backBtn).toBeDisabled();

    await nextBtn.click();
    await expect(page).toHaveURL(/\/learn\/request-journey\/2$/);
    await expect(bottomBar).toContainText('2 / 11');
    await expect(backBtn).toBeEnabled();

    await backBtn.click();
    await expect(page).toHaveURL(/\/learn\/request-journey\/1$/);
    await expect(bottomBar).toContainText('1 / 11');
  });
});

test.describe('System Design, Design Lab', () => {
  test('solves first-users with a load balancer and a second server; goals tick, the design autosaves and axe is clean', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}lab`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Design Lab' }),
    ).toBeVisible();
    const homeAxe = await new AxeBuilder({ page })
      .include('sd-shell')
      .analyze();
    expect(homeAxe.violations).toEqual([]);

    await page.getByRole('link', { name: 'First users' }).click();
    await expect(page).toHaveURL(/\/lab\/first-users$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'First users' }),
    ).toBeVisible();

    const verdict = page.getByTestId('lab-verdict');
    const p95Goal = page.locator('[data-goal-id="maxP95"]');
    await expect(verdict).toHaveText('Not solved yet.');
    await expect(p95Goal).toHaveAttribute('data-met', 'false');
    await expect(page.locator('sd-hud')).toContainText('282 ms');

    const palette = page.getByRole('region', { name: 'Add a component' });
    await palette.getByRole('button', { name: /^Add Load balancer/ }).click();
    await palette.getByRole('button', { name: /^Add Web server/ }).click();

    await expect(p95Goal).toHaveAttribute('data-met', 'true');
    await expect(page.locator('[data-goal-id="maxCost"]')).toHaveAttribute(
      'data-met',
      'true',
    );
    await expect(verdict).toHaveText('Solved: every goal is met.');
    await expect(page.locator('sd-hud')).toContainText('118 ms');

    // Scene nodes work from the keyboard.
    await page.locator('.node-slot[data-slot-id="server-1"]').focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Inspector: Web server 1' }),
    ).toBeVisible();

    const labAxe = await new AxeBuilder({ page }).include('sd-shell').analyze();
    expect(labAxe.violations).toEqual([]);

    // The design autosaves to the designs table.
    await expect
      .poll(async () =>
        page.evaluate(async () => {
          const dbs = await indexedDB.databases();
          const name = dbs.find((d) => d.name?.includes('system_design'))?.name;
          if (!name) return -1;
          return new Promise<number>((resolve) => {
            const req = indexedDB.open(name);
            req.onsuccess = () => {
              const db = req.result;
              const get = db
                .transaction('designs', 'readonly')
                .objectStore('designs')
                .get('first-users');
              get.onsuccess = () => {
                db.close();
                resolve(get.result?.design?.nodes?.length ?? 0);
              };
              get.onerror = () => {
                db.close();
                resolve(-1);
              };
            };
            req.onerror = () => resolve(-1);
          });
        }),
      )
      .toBe(5);

    await page.reload();
    await expect(verdict).toHaveText('Solved: every goal is met.');
    await page.getByRole('link', { name: 'All challenges' }).click();
    await expect(
      page.locator('[data-challenge-id="first-users"] .status'),
    ).toHaveText('Solved');
  });
});

test.describe('System Design, inside the portfolio', () => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!appIsPublic('system-design'), 'Hidden until go-live (P12).');

  test('opens from the catalog under /apps/system-design', async ({ page }) => {
    await page.goto('/apps');
    await page
      .getByRole('link', { name: /System Design|Scale Lab/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/apps\/system-design\/learn\//);
    await expect(page.locator('sd-shell')).toBeVisible();
  });
});
