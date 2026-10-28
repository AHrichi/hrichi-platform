import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './support/test';

/** Collects requests for the shared three.js bundle. */
function watchThree(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/three\.[\w-]+\.js$/.test(request.url())) {
      requests.push(request.url());
    }
  });
  return requests;
}

// A cached service worker would serve the bundle without a network request.
test.use({ serviceWorkers: 'block' });

test('keeps the static graph under reduced motion and never downloads three', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const three = watchThree(page);

  await page.goto('/');
  const scene = page.locator('ah-scene');
  await expect(scene).toHaveAttribute('data-tier', 'off');

  await expect(
    page.getByRole('img', { name: /Graph of this website's \d+ Nx projects/ }),
  ).toBeVisible();
  await expect(scene.locator('canvas')).toHaveCount(0);
  // The tier is decided before anything loads; 'off' means three never will.
  expect(three).toEqual([]);

  const axe = await new AxeBuilder({ page }).include('.hero').analyze();
  expect(axe.violations).toEqual([]);
});

test('fades in the WebGL scene after load and opens apps from the caption', async ({
  page,
}) => {
  const three = watchThree(page);

  await page.goto('/?3d=on');
  const scene = page.locator('ah-scene');
  await expect(scene).toHaveAttribute('data-state', 'ready');
  await expect(scene.locator('canvas')).toBeVisible();
  expect(three).toHaveLength(1);

  // three is fetched only once the page is up, never with the initial files.
  const timing = await page.evaluate(() => {
    const [navigation] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    const bundle = performance
      .getEntriesByType('resource')
      .find((entry) => /\/three\.[\w-]+\.js$/.test(entry.name));
    return {
      domReady: navigation.domContentLoadedEventEnd,
      threeStart: bundle?.startTime ?? -1,
    };
  });
  expect(timing.threeStart).toBeGreaterThan(timing.domReady);

  const axe = await new AxeBuilder({ page }).include('.hero').analyze();
  expect(axe.violations).toEqual([]);

  const link = page
    .getByRole('figure')
    .getByRole('link', { name: 'Micro-frontend demo' });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', '/labs/hello');
  const [newPage] = await Promise.all([
    page.context().waitForEvent('page'),
    link.click(),
  ]);
  await expect(newPage).toHaveURL(/\/labs\/hello$/);
  await newPage.close();
});

test('releases its WebGL context on every route change', async ({ page }) => {
  // Keep a handle on every context the page creates.
  await page.addInitScript(() => {
    const contexts: WebGLRenderingContext[] = [];
    (window as unknown as { __contexts: typeof contexts }).__contexts =
      contexts;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof getContext>
    ) {
      const context = getContext.apply(this, args);
      if (context && args[0].startsWith('webgl')) {
        contexts.push(context as WebGLRenderingContext);
      }
      return context;
    } as typeof getContext;
  });

  await page.goto('/?3d=on');
  for (let visit = 0; visit < 3; visit++) {
    await expect(page.locator('ah-scene')).toHaveAttribute(
      'data-state',
      'ready',
    );
    await page.getByRole('link', { name: 'Work', exact: true }).click();
    await expect(page.locator('ah-scene')).toHaveCount(0);
    await page.goBack();
  }
  await expect(page.locator('ah-scene')).toHaveAttribute('data-state', 'ready');

  // Each visit opens a probe context and a scene context; all but the
  // current scene's must be lost (released), and only one canvas exists.
  const live = await page.evaluate(
    () =>
      (
        window as unknown as { __contexts: WebGLRenderingContext[] }
      ).__contexts.filter((context) => !context.isContextLost()).length,
  );
  expect(live).toBe(1);
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('toggles dark and light mode via the header button', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.theme-toggle');
  await expect(toggle).toBeVisible();

  const html = page.locator('html');
  const initialTheme = await html.getAttribute('data-theme');

  await toggle.click();
  const themeAfterFirstClick = await html.getAttribute('data-theme');
  expect(themeAfterFirstClick).toMatch(/^(dark|light)$/);
  expect(themeAfterFirstClick).not.toBe(initialTheme);

  await toggle.click();
  const themeAfterSecondClick = await html.getAttribute('data-theme');
  expect(themeAfterSecondClick).toMatch(/^(dark|light)$/);
  expect(themeAfterSecondClick).not.toBe(themeAfterFirstClick);
});

test('ensures all footer project and external links open in a new tab', async ({
  page,
}) => {
  await page.goto('/');
  const footerLinks = page.locator('.site-footer a');
  const count = await footerLinks.count();
  expect(count).toBeGreaterThan(5);

  for (let i = 0; i < count; i++) {
    const link = footerLinks.nth(i);
    const href = await link.getAttribute('href');
    if (href?.startsWith('mailto:')) continue;

    await expect(link).toHaveAttribute('target', '_blank');
    const rel = await link.getAttribute('rel');
    expect(rel).toContain('noopener');
  }
});
