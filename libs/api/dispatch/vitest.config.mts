import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/api/dispatch',
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
    name: 'api-dispatch',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    passWithNoTests: true,
    reporters: ['default'],
  },
}));
