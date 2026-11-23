// Builds the design tokens (W3C DTCG JSON in ./tokens) into:
//   src/generated/tokens.css  CSS custom properties; semantic tokens reference primitives
//   src/generated/tokens.ts   typed values for code that can't read CSS (e.g. Three.js)
//
// Light is the default; dark applies with prefers-color-scheme unless the page
// sets data-theme="light", and always with data-theme="dark".
//
// Looks (tokens/look.<name>.{light,dark}.json) are opt-in restylings scoped to
// [data-look='<name>']. They override existing tokens and may add look-only
// color-scene-* tokens; see the README's "Looks" section.
//
// Usage: node libs/design-system/tokens/build.mjs
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import StyleDictionary from 'style-dictionary';

const root = import.meta.dirname;
const out = join(root, 'src/generated');

/** The tier of a token, from the file that defined it last. */
function tierOf(filePath) {
  const file = filePath.split(/[\\/]/).pop();
  if (file.startsWith('look.')) return 'look';
  if (file.startsWith('semantic.')) return 'semantic';
  return 'primitive';
}

/** Loads token files (relative to ./tokens) in order; on a collision the last file wins. */
async function loadTokens(files) {
  const sd = new StyleDictionary({
    source: files.map((file) => join(root, 'tokens', file)),
    platforms: { web: { transforms: ['name/kebab'] } },
    log: { verbosity: 'silent', warnings: 'disabled' },
  });
  const { allTokens } = await sd.getPlatformTokens('web');
  return allTokens.map((token) => ({
    name: token.name,
    value: token.$value ?? token.value,
    original: token.original.$value ?? token.original.value,
    tier: tierOf(token.filePath),
  }));
}

/** `{color.neutral.900}` → `color-neutral-900`; null for a literal value. */
function referenceOf(original) {
  const reference = /^\{([^}]+)\}$/.exec(String(original));
  return reference ? reference[1].replaceAll('.', '-') : null;
}

/**
 * `{color.neutral.900}` becomes `var(--color-neutral-900)`; a DTCG cubicBezier
 * array becomes `cubic-bezier(…)`; anything else is the resolved value.
 */
function cssValue({ original, value }) {
  const reference = referenceOf(original);
  if (reference) return `var(--${reference})`;
  if (Array.isArray(value)) return `cubic-bezier(${value.join(', ')})`;
  return value;
}

const declarations = (tokens, indent) =>
  tokens.map((t) => `${indent}--${t.name}: ${cssValue(t)};`).join('\n');

const asRecord = (tokens) =>
  Object.fromEntries(tokens.map((t) => [t.name, t.value]));

function fail(message) {
  console.error(message);
  process.exit(1);
}

const light = await loadTokens(['primitives.json', 'semantic.light.json']);
const dark = await loadTokens(['primitives.json', 'semantic.dark.json']);
const primitives = light.filter((t) => t.tier === 'primitive');
const lightSemantic = light.filter((t) => t.tier === 'semantic');
const darkSemantic = dark.filter((t) => t.tier === 'semantic');
const primitiveNames = new Set(primitives.map((t) => t.name));
const baseNames = new Set(light.map((t) => t.name));

// A look restyles a subtree by redeclaring tokens on [data-look]. var() resolves
// where the property is declared, so a semantic token that references another
// semantic token would keep the base value under a look. Semantics reference
// primitives only.
for (const [theme, tokens] of [
  ['light', lightSemantic],
  ['dark', darkSemantic],
]) {
  for (const token of tokens) {
    const reference = referenceOf(token.original);
    if (reference && !primitiveNames.has(reference)) {
      fail(
        `semantic.${theme}.json: ${token.name} references ${reference}, which is not a primitive. Semantic tokens must reference primitives only.`,
      );
    }
  }
}

// Looks: every tokens/look.<name>.{light,dark}.json pair.
const lookNames = [
  ...new Set(
    readdirSync(join(root, 'tokens'))
      .map((file) => /^look\.([a-z0-9-]+)\.(light|dark)\.json$/.exec(file))
      .filter(Boolean)
      .map((match) => match[1]),
  ),
].sort();

const looks = [];
for (const look of lookNames) {
  const modes = {};
  for (const mode of ['light', 'dark']) {
    const file = `look.${look}.${mode}.json`;
    const tokens = (
      await loadTokens(['primitives.json', `semantic.${mode}.json`, file])
    ).filter((t) => t.tier === 'look');
    for (const token of tokens) {
      if (
        !baseNames.has(token.name) &&
        !token.name.startsWith('color-scene-')
      ) {
        fail(
          `${file}: ${token.name} is not an existing token. A look may only override tokens or add color-scene-* tokens.`,
        );
      }
      const reference = referenceOf(token.original);
      if (reference && !primitiveNames.has(reference)) {
        fail(
          `${file}: ${token.name} references ${reference}, which is not a primitive. Look tokens must reference primitives only.`,
        );
      }
    }
    modes[mode] = tokens;
  }
  const lightKeys = new Set(modes.light.map((t) => t.name));
  const darkKeys = new Set(modes.dark.map((t) => t.name));
  const onlyLight = [...lightKeys].filter((name) => !darkKeys.has(name));
  const onlyDark = [...darkKeys].filter((name) => !lightKeys.has(name));
  if (onlyLight.length || onlyDark.length) {
    fail(
      `Look "${look}": light and dark must define the same tokens.\n  only in light: ${onlyLight.join(', ') || '—'}\n  only in dark: ${onlyDark.join(', ') || '—'}`,
    );
  }
  looks.push({ name: look, light: modes.light, dark: modes.dark });
}

const banner =
  '/* Generated by libs/design-system/tokens/build.mjs. Do not edit. */';

// Light applies on the element; dark gets (0,3,0) specificity under either
// trigger, so it beats light. Declaring on the element beats values inherited
// from :root.
const lookBlocks = looks
  .map(({ name, light: lookLight, dark: lookDark }) => {
    const self = `[data-look='${name}']`;
    return `
  ${self} {
${declarations(lookLight, '    ')}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light'])${self},
    :root:not([data-theme='light']) ${self} {
${declarations(lookDark, '      ')}
    }
  }

  :root[data-theme='dark']${self},
  :root[data-theme='dark'] ${self} {
${declarations(lookDark, '    ')}
  }
`;
  })
  .join('');

// Apps load tokens.css first, so this statement fixes the layer order for
// the whole design system (see libs/design-system/ui/src/styles).
const css = `${banner}
@layer reset, tokens, base, layout, components, utilities, overrides;

@layer tokens {
  :root {
    color-scheme: light dark;
${declarations(primitives, '    ')}
${declarations(lightSemantic, '    ')}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
${declarations(darkSemantic, '      ')}
    }
  }

  :root[data-theme='dark'] {
    color-scheme: dark;
${declarations(darkSemantic, '    ')}
  }

  :root[data-theme='light'] {
    color-scheme: light;
  }
${lookBlocks}}
`;

const json = (value) => JSON.stringify(value, null, 2);
const looksRecord = Object.fromEntries(
  looks.map(({ name, light: l, dark: d }) => [
    name,
    { light: asRecord(l), dark: asRecord(d) },
  ]),
);
const ts = `${banner.replace('/*', '//').replace(' */', '')}
export const primitives = ${json(asRecord(primitives))} as const;

export const lightTheme = ${json(asRecord(lightSemantic))} as const;

export const darkTheme = ${json(asRecord(darkSemantic))} as const;

export type SemanticToken = keyof typeof lightTheme;

/** Opt-in looks, applied with data-look="<name>"; each overrides tokens in both themes. */
export const looks = ${json(looksRecord)} as const;

export type LookName = keyof typeof looks;

export type LookToken = {
  [Look in LookName]: keyof (typeof looks)[Look]['light'];
}[LookName];
`;

// WCAG 2.2 AA: every text/background pair the UI uses needs 4.5:1 in both themes.
const contrastPairs = [
  ['color-text-default', 'color-bg-canvas'],
  ['color-text-default', 'color-bg-surface'],
  ['color-text-default', 'color-bg-raised'],
  ['color-text-muted', 'color-bg-canvas'],
  ['color-text-muted', 'color-bg-surface'],
  ['color-text-muted', 'color-bg-raised'],
  ['color-accent-default', 'color-bg-canvas'],
  ['color-accent-default', 'color-bg-surface'],
  ['color-accent-default', 'color-bg-raised'],
  ['color-accent-on', 'color-accent-default'],
  ['color-success-default', 'color-bg-canvas'],
  ['color-success-default', 'color-bg-surface'],
  ['color-warning-default', 'color-bg-canvas'],
  ['color-warning-default', 'color-bg-surface'],
  ['color-info-default', 'color-bg-canvas'],
  ['color-info-default', 'color-bg-surface'],
  ['color-danger-default', 'color-bg-canvas'],
  ['color-danger-default', 'color-bg-surface'],
  ['color-stage-text', 'color-stage-bg'],
  ['color-stage-muted', 'color-stage-bg'],
  // Status text on its own tint (badges, alerts).
  ['color-success-default', 'color-success-subtle'],
  ['color-warning-default', 'color-warning-subtle'],
  ['color-info-default', 'color-info-subtle'],
  ['color-danger-default', 'color-danger-subtle'],
  ['color-accent-default', 'color-accent-subtle'],
  // Filled surfaces with text on them.
  ['color-accent-on', 'color-accent-hover'],
  ['color-accent-on-solid', 'color-accent-solid'],
  ['color-accent-on-solid', 'color-accent-solid-hover'],
  ['color-text-inverse', 'color-bg-inverse'],
  ['color-bg-canvas', 'color-success-default'],
  ['color-bg-canvas', 'color-warning-default'],
  ['color-bg-canvas', 'color-info-default'],
  ['color-bg-canvas', 'color-danger-default'],
];

// WCAG 2.2 1.4.11: graphics and the boundaries of controls need 3:1 against
// what they're drawn on.
const surfaces = ['color-bg-canvas', 'color-bg-surface', 'color-bg-raised'];
const graphicPairs = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => [`color-data-${n}`, 'color-stage-bg']),
  ...surfaces.map((bg) => ['color-border-control', bg]),
  ...surfaces.map((bg) => ['color-focus-ring', bg]),
];

// Look-only pairs: the isometric scene. Grid lines are decoration, not gated.
const sceneHues = [
  'neutral',
  'amber',
  'blue',
  'violet',
  'green',
  'rose',
  'teal',
  'red',
];
const packetKinds = [
  'request',
  'response',
  'handshake',
  'write',
  'event',
  'error',
];
const sceneTextPairs = sceneHues.map((hue) => [
  `color-scene-${hue}-ink`,
  `color-scene-${hue}-top`,
]);
const sceneGraphicPairs = [
  ...sceneHues.map((hue) => [`color-scene-${hue}-ink`, 'color-bg-canvas']),
  ...packetKinds.map((kind) => [
    `color-scene-packet-${kind}`,
    'color-bg-surface',
  ]),
  ['color-scene-edge', 'color-bg-surface'],
];

/**
 * sRGB channels (0-255) of an opaque colour: `#rgb`, `#rrggbb`, or
 * `rgb()`/`rgba()` in comma or space syntax. Anything else, or anything
 * translucent, throws: the gate must never pass a colour it can't read.
 */
function parseColor(value, name) {
  const text = String(value).trim();
  let channels;
  let alpha = 1;
  const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
  const fn = /^rgba?\(\s*([^)]+)\)$/i.exec(text);
  if (hex && [3, 6, 8].includes(hex[1].length)) {
    const digits =
      hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    channels = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
    if (digits.length === 8) alpha = parseInt(digits.slice(6, 8), 16) / 255;
  } else if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
    channels = parts.slice(0, 3).map(Number);
    if (parts[3] !== undefined) {
      alpha = parts[3].endsWith('%')
        ? parseFloat(parts[3]) / 100
        : Number(parts[3]);
    }
  }
  if (!channels || channels.some((c) => !Number.isFinite(c))) {
    throw new Error(`Contrast gate can't read ${name} = "${text}".`);
  }
  if (alpha < 1) {
    throw new Error(
      `Contrast gate can't rate translucent ${name} = "${text}"; gate an opaque colour.`,
    );
  }
  return channels;
}

function luminance(value, name) {
  const [r, g, b] = parseColor(value, name).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Each look theme is the base theme with the look's overrides on top. The
// scene pairs apply to looks that draw scenes (they define color-scene-*);
// a look without them is gated on the base pairs only.
const scenePairsFor = (lookTokens) =>
  lookTokens.some((token) => token.name.startsWith('color-scene-'))
    ? [
        [sceneTextPairs, 4.5],
        [sceneGraphicPairs, 3],
      ]
    : [];
const gatedThemes = [
  ['light', asRecord(light), []],
  ['dark', asRecord(dark), []],
  ...looks.flatMap(({ name, light: lookLight, dark: lookDark }) => [
    [
      `${name} light`,
      { ...asRecord(light), ...asRecord(lookLight) },
      scenePairsFor(lookLight),
    ],
    [
      `${name} dark`,
      { ...asRecord(dark), ...asRecord(lookDark) },
      scenePairsFor(lookDark),
    ],
  ]),
];

const failures = [];
for (const [theme, values, extraPairs] of gatedThemes) {
  for (const [pairs, minimum] of [
    [contrastPairs, 4.5],
    [graphicPairs, 3],
    ...extraPairs,
  ]) {
    for (const [fg, bg] of pairs) {
      for (const name of [fg, bg]) {
        if (!(name in values)) {
          throw new Error(`Contrast gate: ${theme} has no token ${name}.`);
        }
      }
      const [l1, l2] = [
        luminance(values[fg], `${theme} ${fg}`),
        luminance(values[bg], `${theme} ${bg}`),
      ].sort((a, b) => b - a);
      const ratio = (l1 + 0.05) / (l2 + 0.05);
      if (ratio < minimum) {
        failures.push(
          `${theme}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
        );
      }
    }
  }
}
if (failures.length) {
  fail(`Contrast below WCAG AA:\n  ${failures.join('\n  ')}`);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'tokens.css'), css);
writeFileSync(join(out, 'tokens.ts'), ts);
console.log(
  `Design tokens: ${primitives.length} primitives, ${lightSemantic.length} semantic (light + dark), ${looks.length} look(s) [${looks.map((l) => `${l.name}: ${l.light.length}`).join(', ')}]; contrast gate passed for ${gatedThemes.map(([theme]) => theme).join(', ')} -> ${out}`,
);
