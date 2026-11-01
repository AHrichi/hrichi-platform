import { defineConfig } from 'vitest/config';

// Only the feature's pure modules have specs; the screens are covered by e2e.
export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-basecamp-feature',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
