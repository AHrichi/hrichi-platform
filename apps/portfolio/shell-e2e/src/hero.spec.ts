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

  // Pages of this site open in place; only other sites open a new tab.
  const link = page.getByRole('figure').getByRole('link', { name: 'Sky lab' });
  await expect(link).not.toHaveAttribute('target', '_blank');
  await link.click();
  await expect(page).toHaveURL(/\/labs\/sky$/);
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
  await page.goto('/?theme=dark');
  const toggle = page.locator('.theme-toggle');
  await expect(toggle).toBeVisible();

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'light');

  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('opens other sites from the footer in a new tab, safely', async ({
  page,
}) => {
  await page.goto('/');
  const external = page.locator('.site-footer a[href^="http"]');
  const count = await external.count();
  expect(count).toBeGreaterThanOrEqual(4);

  for (let i = 0; i < count; i++) {
    await expect(external.nth(i)).toHaveAttribute('target', '_blank');
    await expect(external.nth(i)).toHaveAttribute('rel', /noopener/);
  }
  await expect(
    page.locator('.site-footer a[href="/apps"]'),
  ).not.toHaveAttribute('target', '_blank');
});
