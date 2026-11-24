import { angularProject } from '../../../../tools/eslint/angular-project.mjs';

export default [
  // The Android shell holds a copy of the build (cap sync), not source.
  { ignores: ['android/**'] },
  ...angularProject({ prefix: 'gh' }),
];
