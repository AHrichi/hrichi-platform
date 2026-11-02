import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'platform-storage',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
