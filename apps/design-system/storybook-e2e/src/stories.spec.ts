import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface IndexEntry {
  type: 'story' | 'docs';
  id: string;
  title: string;
  name: string;
  tags?: string[];
}

// Nx builds the Storybook before this suite starts (the serve-static target).
const { entries } = JSON.parse(
  readFileSync(
    join(workspaceRoot, 'dist/storybook/design-system/index.json'),
    'utf8',
  ),
) as { entries: Record<string, IndexEntry> };
const stories = Object.values(entries).filter(
  (entry) => entry.type === 'story',
);
const themes = ['light', 'dark'] as const;

/** Opens a story on its own and waits until it has rendered. */
async function openStory(page: Page, id: string, theme: string) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // The server sends the deployed Storybook's CSP (ADR-0015).
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      message.text().includes('Content Security Policy')
    ) {
      errors.push(message.text());
    }
  });
  await page.goto(
    `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`,
  );
  await expect(page.locator('body')).toHaveClass(/sb-show-main/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await page.evaluate(() => document.fonts.ready);
  return errors;
}

test('the Storybook has stories', () => {
  expect(stories.length).toBeGreaterThan(10);
});

for (const theme of themes) {
  test.describe(`accessibility, ${theme} theme`, () => {
    for (const story of stories) {
      test(`${story.title}: ${story.name}`, async ({ page }) => {
        const errors = await openStory(page, story.id, theme);
        const axe = await new AxeBuilder({ page })
          .include('#storybook-root')
          .analyze();
        expect(axe.violations).toEqual([]);
        expect(errors).toEqual([]);
      });
    }
  });

  test.describe(`visual regression, ${theme} theme`, () => {
    // Fonts and rasterising differ between systems, so screenshots are only
    // compared in the image that made them (VISUAL_REGRESSION=1 there).
    test.skip(
      !process.env['VISUAL_REGRESSION'],
      'Runs in the Linux Playwright image',
    );

    // A moving scene never gives two identical screenshots.
    for (const story of stories.filter(
      (entry) => !entry.tags?.includes('animated'),
    )) {
      test(`${story.title}: ${story.name}`, async ({ page }) => {
        await openStory(page, story.id, theme);
        await expect(page.locator('#storybook-root')).toHaveScreenshot(
          `${story.id}--${theme}.png`,
        );
      });
    }
  });
}
