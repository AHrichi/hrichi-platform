import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir:
    '../../../../node_modules/.vite/libs/products/greenhouse/data-access',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-greenhouse-data-access',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      reportsDirectory:
        '../../../../coverage/libs/products/greenhouse/data-access',
      provider: 'v8' as const,
    },
  },
});
