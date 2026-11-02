import { defineConfig } from 'vitest/config';

// The player's timing and the checks' marking; the components need e2e.
export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-studylm-learn',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
