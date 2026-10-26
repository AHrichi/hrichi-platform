# ADR-0008: Design tokens, cascade layers and a small component library

- **Status:** Accepted
- **Date:** 2026-10-26
- **Milestone:** M1

## Context

The shell, every remote and later the Electron and Capacitor shells must look like one product, in light and dark mode, with accessible contrast. Hand-written CSS variables drift and nobody checks the contrast.

## Decision

- **Tokens** (`libs/design-system/tokens`): W3C DTCG JSON in three tiers.
  - **Primitives:** crimson and neutral scales, type, space, radius, motion.
  - **Light and dark semantic themes:** `color.bg.*`, `color.text.*`, `color.accent.*`, …
  - `build.mjs` (Style Dictionary 5) generates `tokens.css` and `tokens.ts`. Semantic CSS variables reference primitives (`var(--color-neutral-900)`). Dark mode follows `prefers-color-scheme` unless the page sets `data-theme`.
- **Contrast gate:** the build computes WCAG ratios for every text/background pair the UI uses, in both themes, and fails below 4.5:1.
- **Cascade layers:** `reset, tokens, base, layout, components, utilities`, declared at the top of `tokens.css`, which apps load first. Global styles (`@ah/ui` styles) use logical properties only, so RTL needs no rewrite.
- **Components** (`@ah/ui`): `ahButton` (one directive for `<a>` and `<button>`), `ActionLink`, `LinkCard`, `SectionHeading`, `SegmentedControl` (WAI-ARIA radio group) and `Tag`. Components exist only when a page needs them.
- **Font:** Inter Variable, self-hosted through `@fontsource-variable`. Media files keep stable names (`outputHashing: "bundles"`), so `index.html` can preload the Latin subset.

## What M1 found

1. Sass rejects a `@layer` order statement before `@use`. Moving the statement into the generated `tokens.css` fixed it and keeps one source for the order.
2. Lighthouse runs in dark mode on this machine. There the accent on cards (`bg.raised`) was 4.49:1, which the gate missed because it didn't check raised surfaces. The raised pairs are now gated, and crimson-400 changed from `#e2627a` to `#e66f85` (5.0:1). The light theme is unchanged.
3. A bare `ahButton` attribute binds `''` and overrode the `'primary'` default; a unit test caught it. The input now maps `''` back to `'primary'`.
4. Prettier formatted Angular templates with its HTML parser, which flattens `@if`/`@for` blocks. `.prettierrc` now uses the `angular` parser for `*.html`.

## Consequences

- Changing a colour means editing JSON and rebuilding. CI rebuilds the tokens and fails if the committed output differs or contrast drops.
- `tokens.ts` gives future Three.js scenes the same colours as CSS.
- Unhashed font files are not `immutable`; Cloudflare revalidates them with ETags.
