import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'product-basecamp-domain',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
