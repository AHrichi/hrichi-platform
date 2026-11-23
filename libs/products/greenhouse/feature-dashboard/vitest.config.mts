/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

// Pure modules and the store have specs; the screens are checked in a browser.
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir:
    '../../../../node_modules/.vite/libs/products/greenhouse/feature-dashboard',
  resolve: { tsconfigPaths: true },
  plugins: [angular({ tsconfig: `${import.meta.dirname}/tsconfig.spec.json` })],
  test: {
    name: 'product-greenhouse-feature-dashboard',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
}));
