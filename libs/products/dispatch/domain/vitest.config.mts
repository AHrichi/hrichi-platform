import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/products/dispatch/domain',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'product-dispatch-domain',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/products/dispatch/domain',
      provider: 'v8' as const,
    },
  },
}));
