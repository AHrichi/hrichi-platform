import { defineConfig } from 'vitest/config';

// Services built in an injection context; components and screens need e2e.
export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-studylm-feature',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
