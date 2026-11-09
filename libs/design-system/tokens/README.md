# design-system-tokens

The single source of every colour, size, motion value and layer in the platform (ADR-0008). W3C DTCG JSON in `tokens/`, built by `build.mjs` (Style Dictionary 5) into:

- `src/generated/tokens.css`: CSS custom properties. Apps load it first; it also declares the cascade-layer order `reset, tokens, base, layout, components, utilities, overrides`.
- `src/generated/tokens.ts`: the same values as typed constants, for code that can't read CSS (Three.js scenes).

```bash
pnpm nx run design-system-tokens:build-tokens
```

CI rebuilds the tokens and fails if the committed output differs.

## Tiers

| Tier | File | Example | Who uses it |
| --- | --- | --- | --- |
| Primitive | `tokens/primitives.json` | `--color-crimson-600`, `--space-4`, `--z-modal` | Semantic tokens; non-colour primitives (space, radius, z, motion…) directly |
| Semantic | `tokens/semantic.{light,dark}.json` | `--color-text-muted`, `--color-border-control`, `--shadow-overlay` | Components and apps |

Components use **semantic** colour tokens only, so dark mode and themes come for free. Reach for a colour primitive only where no semantic token fits (e.g. print styles).

## Categories

- **Colour:** `bg.*`, `text.*`, `border.{default,strong,control}`, `accent.*`, `success|warning|info|danger.{default,subtle}`, `focus.ring`, `overlay.scrim`, `stage.*` (3D panels), `data.1–7` (charts).
- **Type:** `font.family.{sans,mono}`, fluid `font.size.100–700`, `font.weight.*`, `font.line-height.*`, `font.letter-spacing.*`.
- **Space and shape:** `space.0–10`, `radius.{sm,md,lg,pill}`, `border.width.{hairline,strong}`, `layout.*`, `control.height.{sm,md,lg}` (md = 44px touch target).
- **Depth:** `shadow.{raised,overlay,modal}`, `z.{base,raised,sticky,dropdown,overlay,modal,toast,tooltip}`.
- **Motion:** `motion.duration.{fast,base,slow}`, `motion.easing.{standard,enter,exit}`.
- **Focus and state:** `focus.ring.{width,offset}`, `opacity.disabled`.
- **Breakpoints:** `breakpoint.{sm,md,lg,xl}`, for container queries and TS. Media queries can't read custom properties, so they repeat the value literally.

## Themes

Light is the default. Dark applies with `prefers-color-scheme: dark` unless the page sets `data-theme="light"`, and always with `data-theme="dark"`. Both set `color-scheme`, so native controls and scrollbars follow.

## Contrast gate

The build fails if a pair the UI uses drops below WCAG 2.2 AA in either theme:

- 4.5:1 for text: body, muted and accent text on every surface; status text on its own tint; text on filled accent, inverse and success surfaces.
- 3:1 for graphics and control boundaries: chart colours on the stage, `border.control` and `focus.ring` on every surface.

The gate **fails closed**: a colour it can't parse, a translucent colour, or a missing token stops the build instead of passing silently. Add a pair to `contrastPairs` or `graphicPairs` in `build.mjs` when the UI starts using a new combination.

## Rules (enforced by `stylelint.config.mjs`)

- No raw colours: no hex, `rgb()` or named colours in colour properties; use a `var(--color-…)`.
- No unknown tokens: `ah/known-tokens` checks every token-like `var(--…)` against `tokens.css`.
- Logical properties for the inline axis (`margin-inline-start`, `inset-inline-end` …), so RTL needs no rewrite.
- No `transition: all`.
