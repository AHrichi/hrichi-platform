import type { Page } from '@playwright/test';
import { expect } from './test';

/** LuxPath starts empty: load the sample projects for tests that save. */
export async function loadSampleProjects(page: Page): Promise<void> {
  await page.goto('/apps/lighting/projects');
  await page.getByRole('button', { name: 'Load the sample projects' }).click();
  await expect(page.locator('#lp-project-name')).toBeVisible();
}
