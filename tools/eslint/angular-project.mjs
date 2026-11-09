import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

/** Template accessibility rules that project configs used to switch off. */
const A11Y_TEMPLATE_RULES = [
  '@angular-eslint/template/click-events-have-key-events',
  '@angular-eslint/template/interactive-supports-focus',
  '@angular-eslint/template/label-has-associated-control',
  '@angular-eslint/template/no-autofocus',
  '@angular-eslint/template/prefer-control-flow',
];

/**
 * ESLint flat config for an Angular project: the workspace base (module
 * boundaries), angular-eslint for TypeScript, and template rules including
 * accessibility for `.html` and inline templates.
 *
 * Usage in a project's `eslint.config.mjs`:
 *
 *   import { angularProject } from '../../../tools/eslint/angular-project.mjs';
 *   export default angularProject({ prefix: 'lp' });
 *
 * @param {object} [options]
 * @param {string | string[]} [options.prefix] Selector prefix(es) to enforce.
 *   Omit to leave selector naming unchecked.
 * @param {boolean} [options.legacy] Hidden apps that aren't public yet: the
 *   accessibility template rules report as warnings instead of errors, so the
 *   debt stays visible without blocking CI. Remove it before the app's
 *   visibility flag is switched on (docs/architecture.md §6.2).
 */
export function angularProject({ prefix, legacy = false } = {}) {
  const a11ySeverity = legacy ? 'warn' : 'error';
  const a11yRules = Object.fromEntries(
    A11Y_TEMPLATE_RULES.map((rule) => [rule, a11ySeverity]),
  );

  const selectorRules = prefix
    ? {
        '@angular-eslint/component-selector': [
          'error',
          { type: 'element', prefix, style: 'kebab-case' },
        ],
        '@angular-eslint/directive-selector': [
          'error',
          { type: 'attribute', prefix, style: 'camelCase' },
        ],
      }
    : {
        '@angular-eslint/component-selector': 'off',
        '@angular-eslint/directive-selector': 'off',
      };

  return [
    ...nx.configs['flat/angular'],
    ...nx.configs['flat/angular-template'],
    ...baseConfig,
    {
      files: ['**/*.ts'],
      rules: selectorRules,
    },
    {
      files: ['**/*.html'],
      rules: {
        ...a11yRules,
        '@angular-eslint/template/alt-text': 'error',
        '@angular-eslint/template/elements-content': 'error',
        '@angular-eslint/template/role-has-required-aria': 'error',
        '@angular-eslint/template/valid-aria': 'error',
        '@angular-eslint/template/button-has-type': a11ySeverity,
      },
    },
  ];
}
