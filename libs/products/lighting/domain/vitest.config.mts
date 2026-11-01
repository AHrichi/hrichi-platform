import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'product-lighting-domain',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
