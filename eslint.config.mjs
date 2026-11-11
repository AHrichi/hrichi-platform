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
            // Products may also use the Learning Engine, but only through its
            // client lib (`scope:learning-client`), never its store, database
            // or screens (ADR-0024).
            {
              sourceTag: 'scope:portfolio',
              onlyDependOnLibsWithTags: [
                'scope:portfolio',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:product-alarm-engine',
                'scope:product-autosphere',
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
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-dispatch',
              onlyDependOnLibsWithTags: [
                'scope:product-dispatch',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-studylm',
              onlyDependOnLibsWithTags: [
                'scope:product-studylm',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-basecamp',
              onlyDependOnLibsWithTags: [
                'scope:product-basecamp',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                // The campsite night plan reuses the Sky lab's astronomy
                // (`@ah/labs/sky/domain`). Named here on purpose, instead of
                // tagging that domain `scope:shared` for every app.
                'scope:lab-sky',
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-lighting',
              onlyDependOnLibsWithTags: [
                'scope:product-lighting',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-alarm-engine',
              onlyDependOnLibsWithTags: [
                'scope:product-alarm-engine',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-whatsapp',
              onlyDependOnLibsWithTags: [
                'scope:product-whatsapp',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:learning-client',
              ],
            },
            {
              sourceTag: 'scope:product-autosphere',
              onlyDependOnLibsWithTags: [
                'scope:product-autosphere',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
                'scope:learning-client',
              ],
            },
            // The Learning Engine (ADR-0024): its own scope, like a product.
            {
              sourceTag: 'scope:learning',
              onlyDependOnLibsWithTags: [
                'scope:learning',
                'scope:shared',
                'scope:platform',
                'scope:design-system',
              ],
            },
            // Its client lib may reach the engine's contracts; products reach
            // nothing else of the engine.
            {
              sourceTag: 'scope:learning-client',
              onlyDependOnLibsWithTags: [
                'scope:learning-client',
                'scope:learning',
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
              onlyDependOnLibsWithTags: [
                'scope:api',
                'scope:shared',
                // The PulseOps backend (`api-dispatch`) shares its models and
                // rules with the PulseOps frontend through its domain lib.
                'scope:product-dispatch',
                // The Learning Engine's scheduler, contracts and AI kit run the
                // same code in Nest and the browser (runtime:agnostic, ADR-0024).
                'scope:learning',
              ],
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
                'type:client',
              ],
            },
            {
              sourceTag: 'type:platform',
              onlyDependOnLibsWithTags: [
                'type:platform',
                'type:ui',
                'type:data-access',
                'type:content',
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
                'type:client',
              ],
            },
            // A client lib is a small facade over another scope's API: it may
            // use contracts, utilities, platform services and presentational
            // components, never that scope's store or screens.
            {
              sourceTag: 'type:client',
              onlyDependOnLibsWithTags: [
                'type:client',
                'type:contracts',
                'type:util',
                'type:platform',
                'type:ui',
                'type:tokens',
              ],
            },
            {
              sourceTag: 'type:ui',
              // Presentational components may render domain models (pure TS).
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:domain',
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
              // Framework-free means no Angular, from the workspace or npm.
              bannedExternalImports: ['@angular/*', '@ngrx/*'],
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
