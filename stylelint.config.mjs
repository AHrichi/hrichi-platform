/**
 * Stylelint enforces the design-system rules in docs/architecture.md §6.2:
 * colours come from tokens, layout uses logical properties (RTL for free),
 * no `transition: all`, and every token reference exists.
 *
 * Ratchet: projects listed in STRICT fail the build. Everything else reports
 * warnings until it is cleaned up; move a path into STRICT when it is clean.
 * Hidden apps must be strict before their visibility flag is switched on.
 */

/** Paths whose violations fail CI. */
const STRICT = [
  'libs/design-system/**/*.scss',
  'apps/portfolio/**/*.scss',
  'libs/portfolio/**/*.scss',
  'libs/platform/**/*.scss',
  'libs/labs/sky/**/*.scss',
  'apps/labs/**/*.scss',
  'libs/learning/**/*.scss',
  'apps/products/learning/**/*.scss',
];

const COLOR_PROPS = [
  '/color$/',
  'fill',
  'stroke',
  'outline-color',
  'caret-color',
  'accent-color',
];

const rules = {
  'color-no-hex': true,
  'color-named': 'never',
  'scale-unlimited/declaration-strict-value': [
    COLOR_PROPS,
    {
      ignoreValues: [
        'transparent',
        'currentcolor',
        'currentColor',
        'inherit',
        'initial',
        'unset',
        'none',
        'Canvas',
        'CanvasText',
        'ButtonText',
        'ButtonFace',
        'Highlight',
        'HighlightText',
        'GrayText',
        'LinkText',
        // Mixing tokens is fine; a raw colour inside would still trip
        // `color-no-hex`.
        '/^color-mix\\(/',
      ],
      ignoreFunctions: false,
      ignoreVariables: true,
    },
  ],
  'csstools/use-logical': [
    'always',
    {
      // Only the inline (left/right) axis flips in RTL. Top/bottom and
      // width/height are kept readable; the block axis never mirrors here.
      except: [
        /(^|-)(top|bottom)(-|$)/,
        /(^|-)(min-|max-)?(width|height)$/,
        /^transform/,
        /^scroll-/,
      ],
    },
  ],
  'declaration-property-value-disallowed-list': {
    transition: ['/\\ball\\b/'],
    'transition-property': ['all'],
  },
  'ah/known-tokens': true,
};

const asWarnings = Object.fromEntries(
  Object.entries(rules).map(([name, value]) => [
    name,
    value === true
      ? [true, { severity: 'warning' }]
      : Array.isArray(value)
        ? [value[0], { ...(value[1] ?? {}), severity: 'warning' }]
        : typeof value === 'string'
          ? [value, { severity: 'warning' }]
          : [value, { severity: 'warning' }],
  ]),
);

export default {
  customSyntax: 'postcss-scss',
  plugins: [
    'stylelint-declaration-strict-value',
    'stylelint-use-logical',
    './tools/stylelint/known-tokens.mjs',
  ],
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    // Generated output of the token build.
    'libs/design-system/tokens/src/generated/**',
  ],
  rules: asWarnings,
  overrides: [
    {
      files: STRICT,
      rules,
    },
  ],
};
