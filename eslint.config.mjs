import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          // Architecture rules: docs/architecture.md §4.3
          depConstraints: [
            // Zoneless everywhere (ADR-0004).
            {
              sourceTag: '*',
              bannedExternalImports: ['zone.js', 'zone.js/*'],
            },
            // Scopes: labs and products stay isolated from each other.
            {
              sourceTag: 'scope:portfolio',
              onlyDependOnLibsWithTags: [
                'scope:portfolio',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:lab-hello',
              onlyDependOnLibsWithTags: [
                'scope:lab-hello',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:platform',
              onlyDependOnLibsWithTags: [
                'scope:platform',
                'scope:shared',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:design-system',
              onlyDependOnLibsWithTags: ['scope:design-system'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // Layers: dependencies only point down.
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:domain',
                'type:util',
                'type:platform',
                'type:contracts',
                'type:tokens',
                'type:content',
              ],
            },
            {
              sourceTag: 'type:platform',
              onlyDependOnLibsWithTags: [
                'type:platform',
                'type:ui',
                'type:util',
                'type:contracts',
                'type:tokens',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:content',
                'type:ui',
                'type:data-access',
                'type:domain',
                'type:util',
                'type:contracts',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:tokens'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:content',
                'type:domain',
                'type:util',
                'type:contracts',
              ],
            },
            {
              sourceTag: 'type:content',
              onlyDependOnLibsWithTags: ['type:content'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:content'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // Runtimes never mix; agnostic code is safe everywhere.
            {
              sourceTag: 'runtime:browser',
              onlyDependOnLibsWithTags: ['runtime:browser', 'runtime:agnostic'],
            },
            {
              sourceTag: 'runtime:node',
              onlyDependOnLibsWithTags: ['runtime:node', 'runtime:agnostic'],
            },
            {
              sourceTag: 'runtime:agnostic',
              onlyDependOnLibsWithTags: ['runtime:agnostic'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
