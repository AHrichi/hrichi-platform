import { defineConfig } from 'vitest/config';

// The migrations against PGlite (Postgres in WebAssembly): no Docker needed.
export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/apps/products/greenhouse/supabase',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'product-greenhouse-supabase',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['spec/**/*.spec.ts'],
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
