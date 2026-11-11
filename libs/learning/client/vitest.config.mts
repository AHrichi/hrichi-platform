import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/learning/client',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'learning-client',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // The client is Angular glue; its contract is tested in learning-contracts.
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/learning/client',
      provider: 'v8' as const,
    },
  },
}));
