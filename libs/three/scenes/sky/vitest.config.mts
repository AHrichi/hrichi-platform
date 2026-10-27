import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../../node_modules/.vite/libs/three/scenes/sky',
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'three-scene-sky',
    watch: false,
    // The scene needs a real WebGL context; it is covered by the hero e2e tests.
    passWithNoTests: true,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../../coverage/libs/three/scenes/sky',
      provider: 'v8' as const,
    },
  },
}));
