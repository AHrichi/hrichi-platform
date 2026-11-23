# design-system-tokens

The single source of every colour, size, motion value and layer in the platform (ADR-0008). W3C DTCG JSON in `tokens/`, built by `build.mjs` (Style Dictionary 5) into:

- `src/generated/tokens.css`: CSS custom properties. Apps load it first; it also declares the cascade-layer order `reset, tokens, base, layout, components, utilities, overrides`.
- `src/generated/tokens.ts`: the same values as typed constants, for code that can't read CSS (Three.js scenes).

```bash
pnpm nx run design-system-tokens:build-tokens
```

CI rebuilds the tokens and fails if the committed output differs.

## Tiers

| Tier      | File                                   | Example                                                            | Who uses it                                                                 |
| --------- | -------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Primitive | `tokens/primitives.json`               | `--color-crimson-600`, `--space-4`, `--z-modal`                    | Semantic tokens; non-colour primitives (space, radius, z, motion…) directly |
| Semantic  | `tokens/semantic.{light,dark}.json`    | `--color-text-muted`, `--color-border-control`, `--shadow-overlay` | Components and apps                                                         |
| Look      | `tokens/look.<name>.{light,dark}.json` | `--color-scene-blue-top` under `[data-look='paper']`               | Overrides for an opt-in look (see Looks)                                    |

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

## Looks

A look is an opt-in restyling of a subtree, applied with `data-look="<name>"` on any element (or on `<html>` for a whole page). Pages without the attribute are untouched, so existing apps and Storybook baselines don't change.

| Look         | Files                                      | Used by                                                                                                                  |
| ------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `paper`      | `tokens/look.paper.{light,dark}.json`      | The System Design course: warm paper, JetBrains Mono, sage accent                                                        |
| `greenhouse` | `tokens/look.greenhouse.{light,dark}.json` | The Greenhouse Labor Planner: green accent, blue focus ring ([design system](../../../docs/greenhouse/design-system.md)) |

A look file may:

- override existing tokens (here `color.bg.*`, `color.text.*`, `color.border.*`, `color.accent.*`, the status colours, `color.focus.ring` and `font.family.mono`);
- add look-only `color.scene.*` tokens (isometric diagrams): `scene.<hue>.{top,left,right,ink}` for `neutral, amber, blue, violet, green, rose, teal, red`, `scene.{grid,grid-strong,edge,label-bg}`, `scene.packet.{request,response,handshake,write,event,error}` and `scene.zone.<hue>`. Only components rendered under the look may use them.

The build emits only the look's tokens, after the base blocks:

```css
[data-look='paper'] {
  /* paper light */
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light'])[data-look='paper'],
  :root:not([data-theme='light']) [data-look='paper'] {
    /* paper dark */
  }
}
:root[data-theme='dark'][data-look='paper'],
:root[data-theme='dark'] [data-look='paper'] {
  /* paper dark */
}
```

Dark has (0,3,0) specificity under either trigger, so it beats light (0,1,0). Values declared on the element beat values inherited from `:root`, but `_base.scss` resolves `background`, `color` and `font-family` on `html`, so the element that sets `data-look` must set them again:

```scss
:host {
  background: var(--color-bg-canvas);
  color: var(--color-text-default);
  font-family: var(--font-family-mono);
}
```

`tokens.ts` exports the resolved values as `looks.<name>.{light,dark}` and the `LookName` / `LookToken` types.

**Adding a look:** add `tokens/look.<name>.light.json` and `look.<name>.dark.json`, then rebuild. The build stops if:

- the light and dark files don't define exactly the same tokens;
- a look token is neither an existing token nor `color-scene-*`;
- a look token references anything but a primitive;
- a base semantic token references another semantic token (a scoped override couldn't reach it, because `var()` resolves where it is declared).

Each look is gated in both modes (below). Fonts a look names (JetBrains Mono for `paper`) are loaded by the app's `styles` and by the Storybook preview.

## Contrast gate

The build fails if a pair the UI uses drops below WCAG 2.2 AA in any theme (light, dark, and each look in light and dark; a look theme is its base theme with the look's overrides on top):

- 4.5:1 for text: body, muted and accent text on every surface; status text on its own tint; text on filled accent, inverse and success surfaces.
- 3:1 for graphics and control boundaries: chart colours on the stage, `border.control` and `focus.ring` on every surface.
- Looks that draw scenes (those defining `color-scene-*`): `scene.<hue>.ink` on `scene.<hue>.top` at 4.5:1; `scene.<hue>.ink` on `bg.canvas`, and every `scene.packet.*` and `scene.edge` on `bg.surface`, at 3:1. Grid lines are decoration and aren't gated.

The gate **fails closed**: a colour it can't parse, a translucent colour, or a missing token stops the build instead of passing silently. Add a pair to `contrastPairs` or `graphicPairs` in `build.mjs` when the UI starts using a new combination.

## Rules (enforced by `stylelint.config.mjs`)

- No raw colours: no hex, `rgb()` or named colours in colour properties; use a `var(--color-…)`.
- No unknown tokens: `ah/known-tokens` checks every token-like `var(--…)` against `tokens.css`.
- Logical properties for the inline axis (`margin-inline-start`, `inset-inline-end` …), so RTL needs no rewrite.
- No `transition: all`.
