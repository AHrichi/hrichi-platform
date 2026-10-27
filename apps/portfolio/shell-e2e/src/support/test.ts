import { expect, test as base } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Environment {
  apiUrl: string | null;
  turnstileSiteKey: string | null;
  orbitApiUrl: string | null;
}

/**
 * The environment the static servers run with. The shell's CSP allows
 * exactly these API origins, so mocked APIs have to use them (ADR-0006).
 */
export const development = (
  JSON.parse(
    readFileSync(
      join(workspaceRoot, 'tools/hosting/environments.json'),
      'utf8',
    ),
  ) as Record<string, Environment>
)['development'] as Environment;

/**
 * Playwright's `test`, failing any test whose page breaks the
 * Content-Security-Policy. The servers send production's policy for the
 * development origins, so a CSP gap fails here instead of in production.
 */
export const test = base.extend<{ cspViolations: string[] }>({
  cspViolations: [
    async ({ page }, use) => {
      const violations: string[] = [];
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          message.text().includes('Content Security Policy')
        ) {
          violations.push(message.text());
        }
      });
      await use(violations);
      if (violations.length > 0) {
        throw new Error(
          `Content-Security-Policy violations:\n${violations.join('\n')}`,
        );
      }
    },
    { auto: true },
  ],
});

export { expect };
