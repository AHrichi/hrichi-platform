import { defineConfig } from 'vitest/config';

// The feature's pure modules have specs; the screens are checked in a browser.
export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-greenhouse-feature-dashboard',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
