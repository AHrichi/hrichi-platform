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
              sourceTag: 'scope:lab-sky',
              onlyDependOnLibsWithTags: [
                'scope:lab-sky',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:lab-rxjs',
              onlyDependOnLibsWithTags: [
                'scope:lab-rxjs',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:lab-ngrx',
              onlyDependOnLibsWithTags: [
                'scope:lab-ngrx',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:product-strategy',
              onlyDependOnLibsWithTags: [
                'scope:product-strategy',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            {
              sourceTag: 'scope:product-dispatch',
              onlyDependOnLibsWithTags: [
                'scope:product-dispatch',
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
            // The API shares only contracts with the browser apps (ADR-0010).
            {
              sourceTag: 'scope:api',
              onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'],
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
                'type:engine',
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
                'type:platform',
                'type:content',
                'type:engine',
                'type:ui',
                'type:data-access',
                'type:domain',
                'type:util',
                'type:contracts',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:engine',
                'type:util',
                'type:tokens',
              ],
            },
            // Three.js engine and scenes stay framework-agnostic (ADR-0011).
            {
              sourceTag: 'type:engine',
              onlyDependOnLibsWithTags: [
                'type:engine',
                'type:util',
                'type:tokens',
              ],
              bannedExternalImports: ['@angular/*'],
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
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:contracts'],
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
