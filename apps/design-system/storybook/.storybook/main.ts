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
    '../../../../libs/three/angular/src/**/*.stories.ts',
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular-vite',
    options: { tsconfig: join(import.meta.dirname, '../tsconfig.json') },
  },
  core: { disableTelemetry: true },
  // The framework doesn't read tsconfig paths; Vite 8 can.
  viteFinal: (vite) => mergeConfig(vite, { resolve: { tsconfigPaths: true } }),
};

export default config;
