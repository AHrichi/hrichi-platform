import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  // The assistant profile imports @ah/shared/assistant (tsconfig paths).
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'product-serracalc-domain',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
