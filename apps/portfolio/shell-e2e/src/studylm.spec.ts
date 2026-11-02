import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { workspaceRoot } from '@nx/devkit';
import type { Page } from '@playwright/test';
import { development, expect, test } from './support/test';

// The shell's service worker would fetch for the page, out of page.route's
// sight, so requests could reach a real n8n. Block it for these tests.
test.use({ serviceWorkers: 'block' });

/**
 * n8n is down for every test here: each request to it is answered with an
 * error before it leaves the browser, so no real n8n is ever called.
 */
async function n8nDown(page: Page): Promise<string[]> {
  const calls: string[] = [];
  const answer = async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
    calls.push(route.request().postData() ?? '');
    await route.fulfill({ status: 503, body: 'n8n is down' });
  };
  await page.route('http://127.0.0.1:5678/**', answer);
  if (development.n8nUrl) await page.route(`${development.n8nUrl}/**`, answer);
  return calls;
}

let n8nCalls: string[] = [];

test.beforeEach(async ({ page }) => {
  n8nCalls = await n8nDown(page);
});

test.afterEach(() => {
  // Every StudyLM page pings n8n as it starts; the stub must have answered.
  expect(n8nCalls.length).toBeGreaterThan(0);
});

test('each screen has its own address and title', async ({ page }) => {
  await page.goto('/apps/studylm');
  await expect(page).toHaveURL(/\/apps\/studylm\/roadmap$/);
  await expect(page).toHaveTitle('Roadmap · StudyLM');
  // The pill never claims a connection it hasn't made.
  await expect(
    page.getByRole('button', { name: /n8n AI Engine status: Offline/ }),
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: 'Lessons' }).click();
  await expect(page).toHaveURL(/\/apps\/studylm\/learn$/);
  await expect(page).toHaveTitle('Lessons · StudyLM');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(7);
});

test('an AI failure says so, instead of serving made-up content', async ({
  page,
}) => {
  await page.goto('/apps/studylm/roadmap');
  await page.getByRole('button', { name: 'Generate Roadmap' }).first().click();
  await expect(page.getByText('The AI couldn’t make a roadmap')).toBeVisible();
  await expect(page.getByText('No Curriculum Roadmap Yet')).toBeVisible();
});

test('plays binary search by keyboard and remembers the answers', async ({
  page,
}) => {
  await page.goto('/apps/studylm/learn/binary-search');
  await expect(page).toHaveTitle(
    'Binary search: halving your way to the answer · StudyLM',
  );

  // Predict first.
  const predict = page.locator('sl-predict');
  await predict.getByRole('radio', { name: '3', exact: true }).check();
  await predict.getByRole('button', { name: 'Lock in my prediction' }).click();
  await expect(predict.getByRole('status')).toContainText('Right');

  // Then step through the search with the arrow keys.
  const visual = page.getByRole('group', { name: 'Searching for 9, stepped' });
  await visual.focus();
  await page.keyboard.press('ArrowRight');
  await expect(visual).toContainText('Step 1 of');
  await page.keyboard.press('End');
  await expect(visual).toContainText('found it');

  const axe = await new AxeBuilder({ page })
    .include('ah-studylm-lesson-screen')
    .analyze();
  expect(axe.violations).toEqual([]);

  // A reload opens the lesson as it was left.
  await page.reload();
  await expect(page.locator('sl-predict').getByRole('status')).toContainText(
    'Right',
  );
  await expect(
    page.getByRole('group', { name: 'Searching for 9, stepped' }),
  ).toContainText('found it');
});

test('a prediction’s reveal opens the visual at the step that answers it', async ({
  page,
}) => {
  await page.goto('/apps/studylm/learn/http-request');
  const predict = page.locator('sl-predict');
  await predict.getByRole('radio', { name: 'Only the CDN' }).check();
  await predict.getByRole('button', { name: 'Lock in my prediction' }).click();
  await expect(predict.getByRole('status')).toContainText('Not quite');
  await predict.getByRole('button', { name: 'See it in the visual' }).click();
  await expect(
    page.locator('#block-cache-flow sl-step-controls'),
  ).toContainText(/Step \d+ of/);
});

test('StudyLM keeps the portfolio’s data in its demo database', async ({
  page,
}) => {
  await page.goto('/apps/studylm/learn');
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await indexedDB.databases()).map((db) => db.name),
      ),
    )
    .toContain('ah-demo-studylm');
});

/** The built-in binary-search lesson, which the stubbed AI "writes" again. */
const GOLDEN = JSON.parse(
  readFileSync(
    join(
      workspaceRoot,
      'libs/products/studylm/lessons/src/golden/binary-search.lesson.json',
    ),
    'utf8',
  ),
) as {
  title: string;
  minutes: number;
  objectives: string[];
  cards: unknown[];
  sections: {
    id: string;
    title: string;
    intent: string;
    blocks: { id: string; kind: string }[];
  }[];
};

/**
 * n8n as a working workflow, answered in the test: a one-section roadmap,
 * then each lesson stage from the golden lesson. The first try at the
 * prediction breaks the format's checks, so the repair path runs.
 */
async function n8nWorking(page: Page, calls: string[]): Promise<void> {
  const blocks = new Map(
    GOLDEN.sections.flatMap((s) => s.blocks.map((b) => [b.id, b])),
  );
  const reply = (data: unknown) => ({
    success: true,
    code: 'OK',
    provider: 'stub',
    specVersion: 1,
    data,
    message: null,
  });
  const answer = async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
    const body = route.request().postData() ?? '{}';
    calls.push(body);
    const request = JSON.parse(body) as {
      action: string;
      task?: string;
      input?: { blockId?: string; block?: { id: string } };
    };
    let json: unknown = { ok: true, success: true, providers: ['stub'] };
    if (request.action === 'generate_roadmap') {
      json = {
        success: true,
        canonicalSubject: 'Algorithms',
        domain: 'data-structures-algos',
        branches: [
          {
            id: 'b1',
            title: 'Searching',
            sections: [
              {
                id: 'sec-1-1',
                code: '1.1',
                title: 'Binary search',
                summary: 'Finding a value in a sorted array by halving it.',
                difficultyTier: 'beginner',
                subtopics: ['lo, hi and mid'],
              },
            ],
          },
        ],
      };
    } else if (request.task === 'lesson-outline') {
      json = reply({
        title: GOLDEN.title,
        minutes: GOLDEN.minutes,
        objectives: GOLDEN.objectives,
        cards: GOLDEN.cards,
        sections: GOLDEN.sections.map((s) => ({
          id: s.id,
          title: s.title,
          intent: s.intent,
          blocks: s.blocks.map((b) => ({
            id: b.id,
            kind: b.kind,
            brief: `The ${b.kind} block.`,
          })),
        })),
      });
    } else if (request.task === 'lesson-block') {
      const id = request.input?.blockId ?? '';
      const block = blocks.get(id);
      json = reply(id === 'predict-steps' ? { ...block, answer: 9 } : block);
    } else if (request.task === 'block-repair') {
      json = reply(blocks.get(request.input?.block?.id ?? ''));
    }
    await route.fulfill({ json });
  };
  await page.route('http://127.0.0.1:5678/**', answer);
  if (development.n8nUrl) await page.route(`${development.n8nUrl}/**`, answer);
}

test('writes a lesson for a roadmap section, repairing a broken block', async ({
  page,
}) => {
  await n8nWorking(page, n8nCalls);
  await page.goto('/apps/studylm/roadmap');
  await page.getByRole('button', { name: 'Generate Roadmap' }).first().click();
  await page.getByText('Binary search', { exact: true }).first().click();
  await page.getByRole('button', { name: 'Write a Lesson' }).click();

  await expect(page).toHaveURL(/\/apps\/studylm\/learn\/gen-[0-9a-f]{8}$/);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    GOLDEN.title,
    {
      timeout: 20_000,
    },
  );
  // The broken prediction was repaired, not skipped.
  await expect(page.locator('sl-predict')).toBeVisible();
  await expect(page.getByText(/left out/)).toHaveCount(0);
  const tasks = n8nCalls.map((c) => (JSON.parse(c) as { task?: string }).task);
  expect(tasks).toContain('block-repair');

  // It's saved: the roadmap offers to open it, and Lessons lists it.
  await page.getByRole('link', { name: 'Lessons', exact: true }).click();
  await expect(
    page.getByRole('heading', { level: 3, name: 'Algorithms' }),
  ).toBeVisible();
});

test('every built-in lesson plays every visual to its end', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const lesson of [
    'binary-search',
    'http-request',
    'event-loop',
    'recursion',
    'bfs',
    'lookups',
    'git-branching',
  ]) {
    await page.goto(`/apps/studylm/learn/${lesson}`);
    const visuals = page.locator('sl-stepped-visual');
    await expect(visuals.first()).toBeVisible();
    for (let i = 0; i < (await visuals.count()); i++) {
      await visuals.nth(i).focus();
      await page.keyboard.press('End');
    }
    await expect(
      page.locator('sl-chart-view, sl-stepped-visual').first(),
    ).toBeVisible();
  }
  expect(errors).toEqual([]);
});
