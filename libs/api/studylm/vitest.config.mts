import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/studylm',
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
    name: 'api-studylm',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/api/studylm',
      provider: 'v8' as const,
    },
  },
}));
