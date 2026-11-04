import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'product-alarm-engine-domain',
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
});
