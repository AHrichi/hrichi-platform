import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/lasertag-edge',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'lasertag-edge',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/lasertag-edge',
      provider: 'v8' as const,
    },
  },
}));
