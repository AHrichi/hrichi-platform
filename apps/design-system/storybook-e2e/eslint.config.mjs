import playwright from 'eslint-plugin-playwright';
import baseConfig from '../../../eslint.config.mjs';

export default [
  playwright.configs['flat/recommended'],
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    // Screenshots are compared only where VISUAL_REGRESSION is set.
    rules: {
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
];
