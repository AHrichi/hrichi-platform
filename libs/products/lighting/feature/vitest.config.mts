import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-lighting-feature',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
