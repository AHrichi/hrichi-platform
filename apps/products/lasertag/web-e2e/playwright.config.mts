import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const isCI = !!process.env['CI'];

/**
 * BARQ end to end (ADR-0033): the production build under its real CSP on
 * :4315, and lasertag-edge on :8790 with a fresh local D1. Passkeys come
 * from Chromium's virtual authenticator, so no real device is needed.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  // No retries: a run's database lets the venue be claimed once, so a retry
  // of the staff test could never pass. A failure should be read, not retried.
  retries: 0,
  use: {
    baseURL: 'http://localhost:4315',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node apps/products/lasertag/web-e2e/start-edge.mjs',
      url: 'http://localhost:8790/health',
      reuseExistingServer: !isCI,
      cwd: workspaceRoot,
      timeout: 180_000,
    },
    {
      command: 'pnpm exec nx run product-lasertag:serve-static',
      url: 'http://localhost:4315/manifest.webmanifest',
      reuseExistingServer: true,
      cwd: workspaceRoot,
      timeout: 600_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
