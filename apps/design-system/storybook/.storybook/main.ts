import { join } from 'node:path';
import type { StorybookConfig } from '@storybook/angular-vite';
import { mergeConfig } from 'vite';

/**
 * The public design system (ADR-0015): @ah/ui, the tokens and the 3D scene
 * host, built with Storybook's Vite-based Angular framework, zoneless.
 */
const config: StorybookConfig = {
  stories: [
    '../../../../libs/design-system/ui/src/**/*.stories.ts',
    '../../../../libs/learning/ui/src/**/*.stories.ts',
    '../../../../libs/three/angular/src/**/*.stories.ts',
    '../../../../libs/products/studylm/learn/src/**/*.stories.ts',
    '../../../../libs/products/system-design/ui/src/**/*.stories.ts',
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular-vite',
    options: { tsconfig: join(import.meta.dirname, '../tsconfig.json') },
  },
  core: { disableTelemetry: true },
  // The framework doesn't read tsconfig paths; Vite 8 can.
  // Keep small font subsets as files so they obey the deployed `font-src 'self'` CSP.
  viteFinal: (vite) =>
    mergeConfig(vite, {
      resolve: { tsconfigPaths: true },
      build: { assetsInlineLimit: 0 },
    }),
};

export default config;
