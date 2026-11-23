import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/products/greenhouse/domain',
  test: {
    name: 'product-greenhouse-domain',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/products/greenhouse/domain',
      provider: 'v8' as const,
    },
  },
});
