import { angularProject } from '../../../../tools/eslint/angular-project.mjs';

export default [
  ...angularProject({ prefix: 'sd' }),
  {
    files: ['src/lib/scene/glyphs/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['element', 'attribute'],
          prefix: 'sd',
          style: 'kebab-case',
        },
      ],
    },
  },
];
