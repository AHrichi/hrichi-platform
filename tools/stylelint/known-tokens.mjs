import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

/**
 * `ah/known-tokens`: every `var(--color-…)`, `var(--space-…)` and other
 * design-token reference must name a token that exists in the generated
 * `tokens.css`. A typo or an invented token (`--radius-full`,
 * `--font-size-xs`, `--shadow-overlay`) silently falls back to the browser
 * default, so it is a real bug, not a style nit.
 *
 * Custom properties declared in the same file are fine: components may define
 * local variables, as long as they don't use a token prefix.
 */
const ruleName = 'ah/known-tokens';
const messages = stylelint.utils.ruleMessages(ruleName, {
  unknown: (name) =>
    `Unknown design token "--${name}". Use one from libs/design-system/tokens (tokens.css) or add it there.`,
});

const TOKEN_PREFIXES = [
  'color',
  'space',
  'font',
  'radius',
  'shadow',
  'motion',
  'layout',
  'z',
  'breakpoint',
  'border',
  'focus',
  'opacity',
  'letter-spacing',
  'control',
  'duration',
  'line-height',
];

const tokensCss = fileURLToPath(
  new URL(
    '../../libs/design-system/tokens/src/generated/tokens.css',
    import.meta.url,
  ),
);

let known;
function knownTokens() {
  if (!known) {
    known = new Set(
      [...readFileSync(tokensCss, 'utf8').matchAll(/--([a-z0-9-]+)\s*:/g)].map(
        (m) => m[1],
      ),
    );
  }
  return known;
}

const VAR_RE = /var\(\s*--([a-z0-9-]+)/g;

const rule = (enabled) => (root, result) => {
  if (!enabled) return;
  const tokens = knownTokens();
  const local = new Set();
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--')) local.add(decl.prop.slice(2));
  });

  root.walkDecls((decl) => {
    for (const [, name] of decl.value.matchAll(VAR_RE)) {
      if (tokens.has(name) || local.has(name)) continue;
      const prefix = TOKEN_PREFIXES.find(
        (p) => name === p || name.startsWith(`${p}-`),
      );
      if (!prefix) continue;
      stylelint.utils.report({
        ruleName,
        result,
        node: decl,
        word: `--${name}`,
        message: messages.unknown(name),
      });
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
