import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/leads',
  // SWC emits the decorator metadata Nest's dependency injection and
  // ValidationPipe rely on; esbuild does not.
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      tsconfigFile: `${import.meta.dirname}/tsconfig.spec.json`,
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'api-leads',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/api/leads',
      provider: 'v8' as const,
    },
  },
}));
