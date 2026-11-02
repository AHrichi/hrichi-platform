import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'product-studylm-tracer',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
