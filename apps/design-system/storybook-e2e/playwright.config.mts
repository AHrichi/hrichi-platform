import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

/**
 * Every story in the built Storybook, in both themes: axe everywhere, and
 * screenshots in the Linux Playwright image that made the baselines
 * (ADR-0015). See the shell's config for why this is a .mts file.
 */
export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, { testDir: './src' }),
  use: {
    baseURL: 'http://localhost:6007',
    trace: 'on-first-retry',
  },
  // Only one machine image makes baselines, so they need no OS suffix.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  webServer: {
    command: 'pnpm exec nx run design-system:serve-static',
    url: 'http://localhost:6007/index.json',
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'chromium',
      // No SwiftShader: without WebGL the 3D story shows its fallback, which
      // keeps its screenshot stable.
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
