import type { Page } from '@playwright/test';
import { isAppEnabled, type PortfolioAppKey } from '@ah/shared/content';

export type SiteLanguage = 'en' | 'fr' | 'de' | 'it' | 'ar';

/**
 * Switches the site language through the header's language picker (a native
 * select, labelled in the current language), as a visitor would.
 */
export async function chooseLanguage(
  page: Page,
  language: SiteLanguage,
): Promise<void> {
  await page.locator('#shell-lang-select').selectOption(language);
}

/**
 * Whether an app is switched on in PORTFOLIO_APPS_CONFIG. A hidden app's
 * routes redirect to /apps, so its end-to-end tests are skipped until it
 * goes public again.
 */
export function appIsPublic(key: PortfolioAppKey): boolean {
  return isAppEnabled(key);
}
