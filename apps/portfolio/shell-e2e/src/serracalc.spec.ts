import AxeBuilder from '@axe-core/playwright';
import type { Browser, Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { SERRA_SYNC } from '@ah/products/serracalc/domain';
import { InMemorySyncRepository, SyncService } from '@ah/shared/sync-server';
import { expect, test } from './support/test';
import { appIsPublic, chooseLanguage } from './support/site';

// SerraCalc, greenhouse heat, water and climate (ADR-0027). Local-first:
// projects live in IndexedDB; only the assistant and opt-in sync call a
// server.
const STANDALONE = 'http://localhost:4314/';

// The standalone build registers a service worker (offline use); a cached
// app must not carry from one test to the next.
test.use({ serviceWorkers: 'block' });

/** Every screen of the app, in the order of its navigation. */
const SCREENS = [
  'projects',
  'site',
  'site?tab=plants',
  'site?tab=economics',
  'heating',
  'cooling',
  'water',
  'supply',
  'supply?tab=fertigation',
  'air',
  'air?tab=vpd',
  'cooling?tab=fog',
  'calendar',
  'energy',
  'energy?tab=reuse',
  'energy?tab=cooling',
  'energy?tab=solar',
  'greenhouse',
  'operations',
  'data',
  'climate',
  'science',
  'report',
  'guide',
] as const;

test.use({ serviceWorkers: 'block' });

async function loadSamples(page: Page): Promise<void> {
  await page.goto(`${STANDALONE}projects`);
  await page.getByRole('button', { name: 'Load sample projects' }).click();
  // The samples are saved once the project card shows.
  await expect(
    page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
  ).toBeVisible();
}

/** Saves the peak heating load of the active project. */
async function savePeak(page: Page): Promise<void> {
  await page.goto(`${STANDALONE}heating?tab=peak`);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Editing', { exact: true })).toBeVisible();
}

/** Standalone: open the globe menu and pick a language by its own name. */
/**
 * Waits for running transitions and animations to end (a tour card fades
 * in), so axe reads colours as they settle, not half-faded.
 */
async function settled(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
}

/** Where an element sits in the window, scrolled into view first. */
async function boxOf(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Not on the page');
  return box;
}

async function pickLanguage(page: Page, nativeName: string): Promise<void> {
  await page.locator('sc-lang-menu .trigger').click();
  await page.getByRole('menuitemradio', { name: nativeName }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}

test.describe('SerraCalc, standalone', () => {
  test.beforeEach(async ({ page }) => {
    // English, so the assertions read the same whatever the default.
    await page.addInitScript(() =>
      localStorage.setItem('preferred_language', 'en'),
    );
  });

  test('loads the samples and sizes a geothermal house’s heating', async ({
    page,
  }) => {
    await page.goto(STANDALONE);
    await pickLanguage(page, 'English');
    await expect(page.locator('sc-serra-shell')).toHaveAttribute(
      'data-look',
      'desert',
    );
    await page.getByRole('button', { name: 'Load sample projects' }).click();
    await expect(
      page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();

    await page.goto(`${STANDALONE}heating?tab=peak`);
    await expect(
      page.getByText('Heating plant', { exact: true }),
    ).toBeVisible();
    // The Kebili sample: 9,600 m² of double film, a 0 °C design night.
    await expect(page.locator('ah-metric-card').first()).toContainText('825.2');
  });

  test('a drawing handle moves its number with the arrow keys', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}greenhouse`);
    await pickLanguage(page, 'English');
    const ridge = page.getByRole('slider', { name: 'Ridge height' });
    await expect(ridge).toHaveAttribute('aria-valuenow', '6.3');
    await ridge.focus();
    await page.keyboard.press('ArrowUp');
    await expect(ridge).toHaveAttribute('aria-valuenow', '6.4');
    await expect(
      page.getByRole('spinbutton', { name: /Ridge height/ }),
    ).toHaveValue('6.4');
  });

  for (const [width, height] of [
    [375, 812],
    [800, 900],
    [1280, 900],
  ] as const) {
    test(`a new user's tour points at something on every step, ${width} px wide`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.setViewportSize({ width, height });
      await page.goto(`${STANDALONE}projects`);
      await page.getByRole('button', { name: 'Take the tour' }).click();

      for (let step = 1; step <= 10; step++) {
        const card = page.getByRole('dialog', {
          name: new RegExp(`Step ${step} of 10$`),
        });
        await expect(card).toBeVisible();
        await expect(card).toBeFocused();
        // The welcome has no target; every other step has a ring round one.
        await expect(page.locator('ah-tour-host .ring')).toHaveCount(
          Math.min(step - 1, 1),
        );
        const box = await boxOf(card);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
        await card.getByRole('button', { name: /^(Next|Finish)$/ }).click();
      }

      await expect(page.getByRole('dialog')).toHaveCount(0);
      // Focus goes to the wand that replays it, and the invitation is gone.
      await expect(page.locator('[data-tour~="tool-tour"]')).toBeFocused();
      await expect(page.getByText('New here?')).toBeHidden();
      await page.reload();
      await expect(
        page.getByRole('heading', { name: 'Projects', level: 2 }),
      ).toBeVisible();
      await expect(page.getByText('New here?')).toBeHidden();
    });
  }

  test('the tour closes with Escape, and Not now keeps it away', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}projects`);
    await page.locator('[data-tour~="tool-tour"]').click();
    const card = page.getByRole('dialog', { name: /Step 1 of 10$/ });
    await expect(card).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
    await expect(page.locator('[data-tour~="tool-tour"]')).toBeFocused();
    // Skipped counts as seen: no invitation after a reload.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Projects', level: 2 }),
    ).toBeVisible();
    await expect(page.getByText('New here?')).toBeHidden();
  });

  test('declining the invitation keeps it away', async ({ page }) => {
    await page.goto(`${STANDALONE}projects`);
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByText('New here?')).toBeHidden();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Projects', level: 2 }),
    ).toBeVisible();
    await expect(page.getByText('New here?')).toBeHidden();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`a tour step passes axe, ${theme}, and reads right to left in Arabic`, async ({
      page,
    }) => {
      await page.addInitScript(
        (chosen) => localStorage.setItem('ah.theme', chosen),
        theme,
      );
      await page.goto(`${STANDALONE}projects`);
      await page.locator('[data-tour~="tool-tour"]').click();
      await page
        .getByRole('dialog', { name: /Step 1 of 10$/ })
        .getByRole('button', { name: 'Next' })
        .click();
      await expect(
        page.getByRole('dialog', { name: /Step 2 of 10$/ }),
      ).toBeFocused();
      await settled(page);
      const english = await new AxeBuilder({ page }).analyze();
      expect(english.violations).toEqual([]);
      await page.keyboard.press('Escape');

      await pickLanguage(page, 'العربية');
      await page.locator('[data-tour~="tool-tour"]').click();
      const card = page.getByRole('dialog', { name: /الخطوة 1 من 10$/ });
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('dir', 'rtl');
      await expect(card).toBeFocused();
      await settled(page);
      const arabic = await new AxeBuilder({ page }).analyze();
      expect(arabic.violations).toEqual([]);
    });
  }

  test('sets numbers with a stepper, a thermometer, a tape and a dial', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}heating?tab=peak`);
    const field = (label: string) =>
      page.locator('sc-number-field').filter({
        has: page.locator('label', { hasText: new RegExp(`^${label}$`) }),
      });
    const typed = (label: string) =>
      page.getByRole('spinbutton', { name: label, exact: true });

    // A wide range: + goes to the next round number.
    const floor = typed('Floor area');
    const area = Number(await floor.inputValue());
    await field('Floor area').getByRole('button', { name: 'Increase' }).click();
    await expect(floor).not.toHaveValue(String(area));
    const next = Number(await floor.inputValue());
    expect(next).toBeGreaterThan(area);
    expect(next % 100).toBe(0);

    // A tap near the warm end of the tube: 90 % of 0..30 °C.
    const tube = field('Inside, at night').locator('.tube');
    const box = await boxOf(tube);
    const hidden = 8; // the part of the tube under the bulb
    await page.mouse.click(
      box.x + hidden + (box.width - hidden) * 0.9,
      box.y + box.height / 2,
    );
    await expect(typed('Inside, at night')).toHaveValue('27');

    // Pulling the tape left brings bigger numbers under the needle.
    const uValue = typed('U-value of the cover');
    const before = Number(await uValue.inputValue());
    const tape = await boxOf(field('U-value of the cover').locator('.window'));
    const middle = tape.y + tape.height / 2;
    await page.mouse.move(tape.x + tape.width * 0.75, middle);
    await page.mouse.down();
    await page.mouse.move(tape.x + tape.width * 0.25, middle, { steps: 12 });
    await page.mouse.up();
    await expect
      .poll(async () => Number(await uValue.inputValue()))
      .toBeGreaterThan(before);

    // The far end of the half moon: the top of the range.
    const dial = await boxOf(field('Screen saving').locator('svg'));
    await page.mouse.click(
      dial.x + dial.width * (108 / 120),
      dial.y + dial.height * (61 / 70),
    );
    await expect(typed('Screen saving')).toHaveValue('70');

    // The aids stay out of the tab order and the accessibility tree.
    const results = await new AxeBuilder({ page })
      .include('sc-number-field')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('saves a result and opens it again from Projects', async ({ page }) => {
    await loadSamples(page);
    await page.goto(`${STANDALONE}air?tab=light`);
    await expect(page.locator('sc-context-bar')).toContainText(
      'Geothermal tomato house',
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Editing', { exact: true })).toBeVisible();

    await page.goto(`${STANDALONE}projects`);
    await page.getByRole('link', { name: 'Open & edit' }).first().click();
    await expect(page).toHaveURL(/\/air\?tab=light&edit=/);
    await expect(page.getByText('Editing', { exact: true })).toBeVisible();
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const [width, height] of [
      [375, 812],
      [1280, 900],
    ] as const) {
      test(`every screen passes axe, ${theme}, ${width} px wide`, async ({
        page,
      }) => {
        // Twenty-odd screens, each scanned whole: more than the default 30 s.
        test.setTimeout(180_000);
        await page.addInitScript(
          (chosen) => localStorage.setItem('ah.theme', chosen),
          theme,
        );
        await page.setViewportSize({ width, height });
        await loadSamples(page);
        await savePeak(page);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        for (const path of SCREENS) {
          await page.goto(`${STANDALONE}${path}`);
          await expect(page.locator('sc-serra-shell h2').first()).toBeVisible();
          // Open every "Show the numbers", so axe checks the tables too.
          await page
            .locator('details')
            .evaluateAll((all) =>
              all.forEach((d) => ((d as HTMLDetailsElement).open = true)),
            );
          const results = await new AxeBuilder({ page }).analyze();
          // Soft, so one screen's failure doesn't hide the next ones.
          expect
            .soft(results.violations, `${path}, ${theme}, ${width}`)
            .toEqual([]);
        }
      });
    }
  }

  test('speaks Italian and German, with their own number formats', async ({
    page,
  }) => {
    await loadSamples(page);
    await page.goto(`${STANDALONE}heating?tab=peak`);
    await pickLanguage(page, 'Italiano');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Riscaldamento' }),
    ).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('ah-metric-card').first()).toContainText('825,2');
    await expect(page).toHaveTitle('Riscaldamento · SerraCalc');

    await pickLanguage(page, 'Deutsch');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heizung' }),
    ).toBeVisible();
    await expect(page.getByText('Heizanlage', { exact: true })).toBeVisible();
    // Through the app (a fresh load would take English again).
    await page.getByRole('link', { name: 'Gewächshaus' }).first().click();
    // German groups thousands with a point: 9.600 m² for the Kebili house.
    await expect(page.locator('sc-serra-shell')).toContainText('9.600');
  });

  test('switches light and dark, and remembers it', async ({ page }) => {
    await page.addInitScript(() => {
      // Light on the first visit only, so the reload keeps the choice.
      if (!sessionStorage.getItem('sc-seeded')) {
        localStorage.setItem('ah.theme', 'light');
        sessionStorage.setItem('sc-seeded', '1');
      }
    });
    await page.goto(`${STANDALONE}heating`);
    const html = page.locator('html');
    const dark = page.getByRole('button', { name: 'Dark' });
    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(dark).toHaveAttribute('aria-pressed', 'false');
    const text = () =>
      page.locator('.serra').evaluate((el) => getComputedStyle(el).color);
    const lightText = await text();

    await dark.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(text).not.toBe(lightText);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('backs up the projects and restores them as copies', async ({
    page,
  }) => {
    await loadSamples(page);
    await savePeak(page);
    await page.goto(`${STANDALONE}projects`);
    const picker = page.getByRole('combobox', { name: 'Project' });
    await expect(picker.locator('option')).toHaveCount(3);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save a backup file' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(
      /^serracalc-backup-\d{4}-\d{2}-\d{2}\.json$/,
    );
    const backup = JSON.parse(readFileSync(await file.path(), 'utf8'));
    expect(backup).toMatchObject({ app: 'serracalc', version: 1 });
    expect(backup.projects).toHaveLength(3);
    // Inputs travel with their project; results are worked out again.
    const saved = backup.projects
      .flatMap((p: { calculations: unknown[] }) => p.calculations)
      .at(0);
    expect(saved).toMatchObject({ kind: 'heatPeak' });
    expect(saved).toHaveProperty('inputs.outsideDesignC');

    await page.locator('sc-backup-panel input[type=file]').setInputFiles({
      name: 'serracalc-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(page.locator('sc-backup-panel .status')).toContainText(
      '3 projects restored',
    );
    await expect(picker.locator('option')).toHaveCount(6);
  });

  test('refuses a file that is not a SerraCalc backup', async ({ page }) => {
    await page.goto(`${STANDALONE}projects`);
    await page.locator('sc-backup-panel input[type=file]').setInputFiles({
      name: 'luxpath-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"app":"luxpath","version":1,"projects":[]}'),
    });
    await expect(page.locator('sc-backup-panel .status')).toContainText(
      'isn’t a SerraCalc backup',
    );
  });

  test('records a shared plant and checks it against the peak day', async ({
    page,
  }) => {
    await loadSamples(page);
    await page.goto(`${STANDALONE}site?tab=plants`);
    await page.getByRole('button', { name: 'Add the plant' }).click();
    const plant = page.getByRole('group', { name: 'Seawater RO' });
    await expect(plant).toBeVisible();
    await expect(page.getByText('RO water', { exact: true })).toBeVisible();
    // Kept on the device: the sites store survives a reload.
    await page.reload();
    await expect(plant).toBeVisible();
  });

  test('says when SerraCalc in another tab holds the projects', async ({
    page,
    context,
  }) => {
    // The other tab: a page of the same origin holding the database at
    // version 1, never closed for an upgrade, as builds before this did.
    const other = await context.newPage();
    await other.goto(`${STANDALONE}manifest.webmanifest`);
    await other.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const request = indexedDB.open('serracalc_db_v1', 1);
          request.onupgradeneeded = () =>
            request.result.createObjectStore('projects', { keyPath: 'id' });
          request.onsuccess = () => {
            (window as unknown as { held: IDBDatabase }).held = request.result;
            resolve();
          };
        }),
    );

    await page.goto(`${STANDALONE}projects`);
    const blocked = page.getByText(
      'SerraCalc is open in another tab on an older version',
    );
    await expect(blocked).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include('.update-region')
      .analyze();
    expect(results.violations).toEqual([]);

    // Once it lets go, the upgrade finishes and the projects open here.
    await other.evaluate(() =>
      (window as unknown as { held: IDBDatabase }).held.close(),
    );
    await expect(blocked).toBeHidden();
    await page.getByRole('button', { name: 'Load sample projects' }).click();
    await expect(
      page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();

    // A newer version (past this build's 3) opens in the other tab: this
    // one lets it upgrade and asks for a reload.
    const version = await other.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const request = indexedDB.open('serracalc_db_v1', 4);
          request.onsuccess = () => {
            request.result.close();
            resolve(request.result.version);
          };
        }),
    );
    expect(version).toBe(4);
    await expect(
      page.getByText('A newer SerraCalc opened in another tab'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible();
  });

  test('says when the browser never answers for the projects', async ({
    page,
    context,
  }) => {
    // The other tab holds version 1 and asks to delete the database. The
    // delete waits for it, and this page's open waits behind the delete
    // with no event at all: no success, no error, no `blocked`.
    const other = await context.newPage();
    await other.goto(`${STANDALONE}manifest.webmanifest`);
    await other.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const request = indexedDB.open('serracalc_db_v1', 1);
          request.onupgradeneeded = () =>
            request.result.createObjectStore('projects', { keyPath: 'id' });
          request.onsuccess = () => {
            (window as unknown as { held: IDBDatabase }).held = request.result;
            indexedDB.deleteDatabase('serracalc_db_v1').onblocked = () =>
              resolve();
          };
        }),
    );

    await page.goto(`${STANDALONE}projects`);
    const stalled = page.getByText('Your projects haven’t opened yet');
    // The app waits a few seconds before it says so.
    await expect(stalled).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('SerraCalc is open in another tab on an older version'),
    ).toBeHidden();
    const results = await new AxeBuilder({ page })
      .include('.update-region')
      .analyze();
    expect(results.violations).toEqual([]);

    // Once the other tab lets go, the delete and then the open go through.
    await other.evaluate(() =>
      (window as unknown as { held: IDBDatabase }).held.close(),
    );
    await expect(stalled).toBeHidden();
    await page.getByRole('button', { name: 'Load sample projects' }).click();
    await expect(
      page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
  });

  test('prints a report of the project without the app around it', async ({
    page,
  }) => {
    await loadSamples(page);
    await savePeak(page);
    await page.goto(`${STANDALONE}report`);
    const report = page.locator('article.report');
    await expect(
      report.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
    await expect(report.locator('.result')).toHaveCount(1);
    await expect(report.locator('.result')).toContainText('825.2 kW');
    await expect(report).toContainText('A planning aid');

    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.bar')).toBeHidden();
    await expect(page.locator('nav.bottom')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Print or save as PDF' }),
    ).toBeHidden();
    await expect(report).toBeVisible();
  });

  test('reads right to left in Arabic, drawings kept left to right', async ({
    page,
  }) => {
    await page.goto(`${STANDALONE}water`);
    await pickLanguage(page, 'العربية');
    await expect(page.locator('.serra')).toHaveAttribute('dir', 'rtl');
    await expect(
      page.getByRole('heading', { level: 2, name: 'المياه' }),
    ).toBeVisible();
    const direction = await page
      .locator('figure svg')
      .first()
      .evaluate((el) => getComputedStyle(el).direction);
    expect(direction).toBe('ltr');
  });
});

// The assistant (ADR-0031): its Worker answered from a script, so these run
// without a model or a network. The page reads the Worker's address from
// site-config.json, which the e2e servers leave out, so it comes from here.
const ASSISTANT = 'http://localhost:8788';

type Reply = Record<string, unknown>;
interface ChatBody {
  context: {
    mode: string;
    projects: { id: string; title: string }[];
  };
  omitTools: string[];
  messages: { role: string; content: string | null }[];
}

const say = (content: string): Reply => ({
  v: 1,
  ok: true,
  provider: 'script',
  message: { content, toolCalls: [] },
});
const call = (name: string, args: Record<string, unknown>): Reply => ({
  v: 1,
  ok: true,
  provider: 'script',
  message: {
    content: null,
    toolCalls: [{ id: `call_${name}`, name, arguments: args }],
  },
});

/**
 * Answers the assistant's requests in turn; a reply can be worked out from
 * the request (to name a project the page made). Returns what was sent.
 * Call it before the first visit: the page reads its config once.
 */
async function scriptAssistant(
  page: Page,
  replies: (Reply | ((body: ChatBody) => Reply))[],
): Promise<ChatBody[]> {
  const sent: ChatBody[] = [];
  await page.route('**/site-config.json', (route) =>
    route.fulfill({ json: { assistantUrl: ASSISTANT } }),
  );
  await page.route(`${ASSISTANT}/v1/chat`, async (route) => {
    const headers = {
      'access-control-allow-origin': route.request().headers()['origin'] ?? '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const body = route.request().postDataJSON() as ChatBody;
    sent.push(body);
    const next = replies.shift() ?? say('That is all.');
    await route.fulfill({
      headers,
      json: typeof next === 'function' ? next(body) : next,
    });
  });
  return sent;
}

const askButton = (page: Page) => page.locator('[data-tour~="tool-assistant"]');

/** Opens the assistant and sends a message. */
async function ask(page: Page, text: string, title = 'Assistant') {
  await askButton(page).click();
  const panel = page.getByRole('dialog', { name: title });
  await expect(panel).toBeVisible();
  const box = panel.getByRole('textbox');
  await expect(box).toBeFocused();
  await box.fill(text);
  await box.press('Enter');
  return panel;
}

test.describe('SerraCalc, the assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem('preferred_language', 'en'),
    );
  });

  test('creates a project only once the reader applies it', async ({
    page,
  }) => {
    const sent = await scriptAssistant(page, [
      call('create_project', {
        title: 'East block',
        crop: 'cucumber',
        climateId: 'monastir',
      }),
      say(
        '**East block** is ready:\n\n1. Climate: *Monastir*\n2. Crop: cucumber',
      ),
    ]);
    await page.goto(`${STANDALONE}projects`);
    await expect(page.getByText('No project yet')).toBeVisible();
    const panel = await ask(page, 'Make me a cucumber house in Monastir');

    const card = panel.locator('ah-action-card');
    await expect(card).toContainText('Create the project “East block”');
    await expect(card).toContainText('Crop: Cucumber');
    // Nothing changes until Apply.
    await expect(page.getByText('No project yet')).toBeVisible();

    await card.getByRole('button', { name: 'Apply' }).click();
    // The model's answer is formatted, its marks gone.
    const answer = panel.locator('ah-chat-message ah-rich-text').last();
    await expect(answer.locator('strong')).toHaveText('East block');
    await expect(answer.locator('ol li')).toHaveCount(2);
    await expect(answer.locator('em')).toHaveText('Monastir');
    await expect(answer).not.toContainText('**');
    await expect(card).toContainText('Done');
    await expect(panel.getByRole('textbox')).toBeFocused();
    await expect(
      page.getByRole('heading', { name: 'East block' }),
    ).toBeVisible();
    // The model was told what happened, and got the app's state each time.
    expect(sent[0].context.projects).toEqual([]);
    expect(sent[1].messages.at(-1)?.content).toContain('"title":"East block"');
    expect(sent[1].context.projects.map((p) => p.title)).toEqual([
      'East block',
    ]);
  });

  test('a cancelled deletion changes nothing, and the model hears so', async ({
    page,
  }) => {
    const sent = await scriptAssistant(page, [
      (body) =>
        call('delete_project', { projectId: body.context.projects[0].id }),
      say('I left it alone.'),
    ]);
    await loadSamples(page);
    const panel = await ask(page, 'Delete the first project');
    const card = panel.locator('ah-action-card');
    await expect(card).toContainText('every result saved in it');
    await expect(card).toContainText('This can’t be undone.');
    await card.getByRole('button', { name: 'Cancel' }).click();
    await expect(card).toContainText('Cancelled');
    await expect(panel.getByText('I left it alone.')).toBeVisible();
    expect(sent[1].messages.at(-1)?.content).toBe(
      '{"status":"cancelled_by_user"}',
    );

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(askButton(page)).toBeFocused();
    await expect(
      page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
  });

  test('saves a result and opens it in its calculator', async ({ page }) => {
    await scriptAssistant(page, [
      call('save_calculation', {
        kind: 'heatPeak',
        label: 'Cold night',
        inputs: [{ key: 'insideC', value: '20' }],
      }),
      say('Saved and opened.'),
    ]);
    await loadSamples(page);
    const panel = await ask(page, 'Save a peak load at 20 °C inside');
    const card = panel.locator('ah-action-card');
    await expect(card).toContainText('Save “Cold night” (Peak heating load)');
    await card.getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/\/heating\?tab=peak&edit=calc_/);
    await expect(panel.getByText('Saved and opened.')).toBeVisible();
    await expect(page.getByText('Editing', { exact: true })).toBeVisible();
  });

  test('says when the assistant is busy, and when it is unreachable', async ({
    page,
  }) => {
    await scriptAssistant(page, [
      { v: 1, ok: false, code: 'BUSY', message: 'busy', retryAfterSec: 20 },
    ]);
    await page.goto(`${STANDALONE}projects`);
    const panel = await ask(page, 'Hello');
    await expect(
      panel.getByText('The assistant is busy. Try again in 20 seconds.'),
    ).toBeVisible();

    await page.unroute(`${ASSISTANT}/v1/chat`);
    await page.route(`${ASSISTANT}/v1/chat`, (route) => route.abort());
    const box = panel.getByRole('textbox');
    await box.fill('Hello again');
    await box.press('Enter');
    await expect(
      panel.getByText('The assistant isn’t available right now.'),
    ).toBeVisible();
  });

  for (const [width, height, theme] of [
    [1280, 900, 'light'],
    [375, 812, 'dark'],
  ] as const) {
    test(`the panel passes axe, ${width} px wide, ${theme}, and in Arabic`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(
        (chosen) => localStorage.setItem('ah.theme', chosen),
        theme,
      );
      await scriptAssistant(page, [
        (body) =>
          call('update_project', {
            projectId: body.context.projects[0].id,
            title: 'Renamed house',
          }),
      ]);
      await loadSamples(page);
      const panel = await ask(page, 'Rename my project');
      await expect(panel.locator('ah-action-card')).toBeVisible();
      // A phone gets the whole screen, a wide window a side sheet.
      const sheet = await panel.boundingBox();
      expect(sheet?.width).toBe(width < 768 ? width : 416);
      await settled(page);
      const english = await new AxeBuilder({ page }).analyze();
      expect(english.violations).toEqual([]);
      await panel.getByRole('button', { name: 'Cancel' }).click();
      await page.keyboard.press('Escape');

      // The panel follows the app's language, the conversation kept.
      await pickLanguage(page, 'العربية');
      await askButton(page).click();
      const arabic = page.getByRole('dialog', { name: 'المساعد' });
      await expect(arabic).toBeVisible();
      await expect(arabic.locator('ah-action-card')).toContainText('أُلغي');
      await settled(page);
      const rtl = await new AxeBuilder({ page }).analyze();
      expect(rtl.violations).toEqual([]);
    });
  }
});

// Cloud sync (ADR-0032): two browser contexts are two devices; the sync
// server is the real SyncService, in memory in this process, answering the
// pages' requests. The pages read its address from site-config.json.
const SYNC = 'http://localhost:8789';

/** One sync server, as the Worker would be, for every page of a test. */
function syncServer() {
  return new SyncService({
    repository: new InMemorySyncRepository(),
    secret: 'e2e-sync-secret-that-is-long-enough-123',
    specs: [SERRA_SYNC],
  });
}

/** Answers a page's sync requests from `service`. */
async function serveSync(page: Page, service: SyncService): Promise<void> {
  await page.route('**/site-config.json', (route) =>
    route.fulfill({ json: { syncUrl: SYNC } }),
  );
  await page.route(`${SYNC}/**`, async (route) => {
    const request = route.request();
    const headers = {
      'access-control-allow-origin': request.headers()['origin'] ?? '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const path = new URL(request.url()).pathname;
    const token =
      request.headers()['authorization']?.replace(/^Bearer /, '') ?? null;
    const body = request.postData() ? request.postDataJSON() : undefined;
    const device = /^\/v1\/devices\/(.+)$/.exec(path)?.[1];
    const outcome =
      path === '/v1/spaces'
        ? await service.createSpace(body)
        : path === '/v1/pairings'
          ? await service.startPairing(token)
          : path === '/v1/pairings/claim'
            ? await service.claim(body)
            : path === '/v1/devices'
              ? await service.devices(token)
              : device
                ? await service.revoke(token, device)
                : path === '/v1/spaces/current'
                  ? await service.deleteSpace(token)
                  : await service.sync(token, body);
    await route.fulfill({
      status: outcome.status,
      headers,
      json: outcome.body,
    });
  });
}

/** A device: its own browser context, in English, on this server. */
async function syncDevice(browser: Browser, service: SyncService) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.addInitScript(() =>
    localStorage.setItem('preferred_language', 'en'),
  );
  await serveSync(page, service);
  // Removing a device and deleting the cloud copy ask first.
  page.on('dialog', (dialog) => void dialog.accept());
  return { context, page, panel: page.locator('sc-sync-panel') };
}

test.describe('SerraCalc, cloud sync', () => {
  test('links a second device, which gets the projects and sends its own', async ({
    browser,
  }) => {
    const service = syncServer();
    const a = await syncDevice(browser, service);
    const b = await syncDevice(browser, service);

    await loadSamples(a.page);
    await a.panel.getByRole('button', { name: 'Turn on cloud sync' }).click();
    await expect(a.panel.getByRole('status')).toContainText('Synced');
    await a.panel.getByRole('button', { name: 'Link another device' }).click();
    const code = (await a.panel.locator('.code').textContent())?.trim() ?? '';
    expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    await expect(a.panel).toContainText('Works once, for');

    await b.page.goto(`${STANDALONE}projects`);
    await expect(b.page.getByText('No project yet')).toBeVisible();
    await b.panel.getByRole('button', { name: 'I have a code' }).click();
    await b.panel
      .getByRole('textbox', { name: 'Code from your other device' })
      .fill(code.toLowerCase());
    await b.panel.getByRole('button', { name: 'Link this device' }).click();
    await expect(
      b.page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
    await expect(b.panel.locator('.devices li')).toHaveCount(2);

    // B saves a result to the geothermal house; A gets it on its next sync.
    const saved = a.page.locator('ul.saved li');
    const before = await saved.count();
    await b.page
      .locator('select')
      .first()
      .selectOption({ label: 'Geothermal tomato house (sample)' });
    await savePeak(b.page);
    await b.page.goto(`${STANDALONE}projects`);
    await b.panel.getByRole('button', { name: 'Sync now' }).click();
    await expect(b.panel.getByRole('status')).toContainText('Synced');
    await a.panel.getByRole('button', { name: 'Sync now' }).click();
    await expect(saved).toHaveCount(before + 1);

    // A removes B: B stops syncing and keeps its projects.
    await a.panel.getByRole('button', { name: 'Remove' }).click();
    await expect(a.panel.locator('.devices li')).toHaveCount(1);
    await b.panel.getByRole('button', { name: 'Sync now' }).click();
    await expect(b.panel).toContainText(
      'This device was removed from cloud sync',
    );
    await expect(
      b.page.getByRole('heading', { name: 'Geothermal tomato house (sample)' }),
    ).toBeVisible();
    await a.context.close();
    await b.context.close();
  });

  test('a link fills the code in and waits for the reader; a wrong code says so', async ({
    browser,
  }) => {
    const service = syncServer();
    const a = await syncDevice(browser, service);
    const b = await syncDevice(browser, service);
    await a.page.goto(`${STANDALONE}projects`);
    await a.panel.getByRole('button', { name: 'Turn on cloud sync' }).click();
    await a.panel.getByRole('button', { name: 'Link another device' }).click();
    const code = (await a.panel.locator('.code').textContent())?.trim() ?? '';

    await b.page.goto(`${STANDALONE}projects#link=${code}`);
    const field = b.panel.getByRole('textbox', {
      name: 'Code from your other device',
    });
    await expect(field).toHaveValue(code);
    await expect(field).toBeFocused();
    // Not linked until the reader says so.
    await expect(
      b.panel.getByRole('button', { name: 'Link this device' }),
    ).toBeVisible();
    expect(new URL(b.page.url()).hash).toBe('');

    await field.fill('ZZZZ-ZZZZ');
    await b.panel.getByRole('button', { name: 'Link this device' }).click();
    await expect(b.panel.getByRole('alert')).toContainText(
      'That code is wrong, used or expired',
    );
    await a.context.close();
    await b.context.close();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`the sync panel passes axe, off and on, ${theme}`, async ({
      browser,
    }) => {
      const service = syncServer();
      const a = await syncDevice(browser, service);
      await a.page.addInitScript(
        (chosen) => localStorage.setItem('ah.theme', chosen),
        theme,
      );
      await a.page.goto(`${STANDALONE}projects`);
      await a.panel.scrollIntoViewIfNeeded();
      expect(
        (
          await new AxeBuilder({ page: a.page })
            .include('sc-sync-panel')
            .analyze()
        ).violations,
      ).toEqual([]);
      await a.panel.getByRole('button', { name: 'Turn on cloud sync' }).click();
      await a.panel
        .getByRole('button', { name: 'Link another device' })
        .click();
      await expect(a.panel.locator('.devices li')).toHaveCount(1);
      await settled(a.page);
      expect(
        (
          await new AxeBuilder({ page: a.page })
            .include('sc-sync-panel')
            .analyze()
        ).violations,
      ).toEqual([]);
      await a.context.close();
    });
  }
});

test.describe('SerraCalc, inside the portfolio', () => {
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(!appIsPublic('serracalc'), 'Hidden from the catalog.');

  test('opens from the catalog under /apps/serracalc', async ({ page }) => {
    await page.goto('/apps');
    await page
      .getByRole('link', { name: /SerraCalc/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/apps\/serracalc\/projects$/);
    await expect(page.locator('sc-serra-shell')).toBeVisible();
    // Under the shell's production CSP, a calculator computes and draws.
    await page.goto('/apps/serracalc/cooling');
    await expect(page.locator('sc-vent-airflow svg')).toBeVisible();
    await expect(page.locator('ah-metric-card').first()).toBeVisible();
  });

  test('follows the site’s language and theme as they change', async ({
    page,
  }) => {
    await page.goto('/apps/serracalc/heating');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heating' }),
    ).toBeVisible();
    // The site's header has the switches; SerraCalc shows none of its own.
    await expect(page.locator('sc-serra-shell sc-lang-menu')).toHaveCount(0);

    await chooseLanguage(page, 'it');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Riscaldamento' }),
    ).toBeVisible();
    await chooseLanguage(page, 'de');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Heizung' }),
    ).toBeVisible();
    await chooseLanguage(page, 'ar');
    await expect(page.locator('.serra')).toHaveAttribute('dir', 'rtl');

    const html = page.locator('html');
    const before = await html.getAttribute('data-theme');
    const text = () =>
      page
        .locator('sc-serra-shell .serra')
        .evaluate((el) => getComputedStyle(el).color);
    const textBefore = await text();
    await page.locator('.theme-toggle').click();
    await expect(html).not.toHaveAttribute('data-theme', before ?? '');
    await expect.poll(text).not.toBe(textBefore);
  });

  test('the assistant leaves the site’s settings to the site', async ({
    page,
  }) => {
    const sent = await scriptAssistant(page, [say('Hello from the demo.')]);
    await page.goto('/apps/serracalc/projects');
    const panel = await ask(page, 'Hello');
    await expect(panel.getByText('Hello from the demo.')).toBeVisible();
    expect(sent[0].context.mode).toBe('embedded-demo');
    expect(sent[0].omitTools).toEqual(['set_theme', 'set_language']);
    // Below the site's sticky header, not under it.
    const header = await page.locator('.site-header').boundingBox();
    const box = await panel.boundingBox();
    expect(box?.y ?? 0).toBeGreaterThanOrEqual(
      (header?.y ?? 0) + (header?.height ?? 0) - 1,
    );
  });

  test('cloud sync is left to the app itself', async ({ page }) => {
    await page.goto('/apps/serracalc/projects');
    await expect(page.locator('sc-sync-panel')).toContainText(
      'Cloud sync works in the SerraCalc app itself',
    );
    await expect(
      page.getByRole('button', { name: 'Turn on cloud sync' }),
    ).toHaveCount(0);
  });

  test('the old address redirects', async ({ page }) => {
    await page.goto('/apps/greenhouse-energy');
    await expect(page).toHaveURL(/\/apps\/serracalc\//);
  });
});
