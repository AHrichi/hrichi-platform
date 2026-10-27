# ADR-0015: Public Storybook, checked by axe and screenshots

- **Status:** Accepted
- **Date:** 2026-10-27
- **Milestone:** M2

## Context

The design system (`@ah/ui` and the tokens, ADR-0008) and the 3D scene host (ADR-0011) are part of what the portfolio shows, so they need a public, browsable home. It must stay zoneless (ADR-0004), cost nothing to host, and catch accessibility and visual regressions before they reach the apps. The architecture doc flagged a risk: Storybook's Angular support might not handle Angular 22 without zone.js, with an in-house docs remote as the fallback.

## Decision

- **Storybook 10.6 with `@storybook/angular-vite`:** Vite 8 and the Analog Angular plugin, which Vitest already uses here. It renders zoneless and zone.js is an optional peer, so `pnpm check:zoneless` still passes and no fallback was needed. Vite's `resolve.tsconfigPaths` resolves the `@ah/*` aliases.
- **Its own app, `design-system`** (`apps/design-system/storybook`):
  - It holds the config, the `storybook`, `build-storybook`, `serve-static` and `deploy` targets, and `wrangler.jsonc`.
  - Stories live next to their components: `libs/design-system/ui/src/**/*.stories.ts` and `libs/three/angular/src/**/*.stories.ts`.
  - Storybook finds stories by glob, which Nx can't see. The app's `implicitDependencies` on `design-system-ui` and `three-angular` make `nx affected` rebuild, retest and redeploy it when a story or component changes.
- **Stories (17):**
  - every `@ah/ui` component (Button, ActionLink, LinkCard, SectionHeading, SegmentedControl, Tag), with controls
  - a Foundations page: every semantic colour with its contrast against the surface it is drawn on, the fluid type scale and the spacing scale
  - a playground for `<ah-scene>` hosting the constellation
  - A toolbar switches between the light and dark themes through `data-theme`, as the apps do.
- **Quality gate, `design-system-e2e`** (Playwright):
  - It reads the built `index.json`, so a new story is tested without touching the suite.
  - Every story is checked in both themes: axe on the story root, and no page errors.
  - **Visual regression:** each story's screenshot, in both themes, is compared with a committed baseline. Fonts and rasterising differ between operating systems, so screenshots are compared only in one place: the Linux Playwright Docker image (`mcr.microsoft.com/playwright:v1.64.1-noble`), with `VISUAL_REGRESSION=1`. Stories tagged `animated` (the 3D scene) are left out of this comparison, though axe still checks them.
    - CI runs this suite in a job inside that image.
    - `pnpm nx run design-system-e2e:update-baselines` makes the baselines in the same image through Docker, on any machine (`tools/scripts/visual-baselines.mjs`); `--check` compares without updating, as CI does. Linux `node_modules` live in a Docker volume, so the checkout's own are never touched.
- **Hosting:** a `design` Worker at [design.ahmed-hrichi.workers.dev](https://design.ahmed-hrichi.workers.dev), deployed by CI like every other app (ADR-0007). It is linked from the footer, the home page and the README.

## What M2 found

1. **The suite caught a real bug on its first run.** Storybook's Angular renderer names a custom element after the story id, and element names can't start with a digit, so the `3D/SceneHost` story (`3d-scenehost--constellation`) failed to render. It is now `Scenes/SceneHost`.
2. **Storybook needs a looser CSP than the apps, on its own origin only.** `prepare-hosting.mjs` gains two options, used only by this deploy:
   - `--frame-self`: the manager shows each story in a same-origin `<iframe>`, so `frame-src` and `frame-ancestors` allow `'self'` instead of `'none'`.
   - `--allow-eval`: Storybook's Angular renderer compiles each story's template in the browser with Angular's JIT compiler, which needs `'unsafe-eval'`.

   The Storybook origin has no forms, cookies or user data, and the portfolio's own CSP is unchanged.

3. **Nx builds the Storybook before Playwright reads it.** Nx infers the e2e target's dependencies from the Playwright `webServer` command (`nx run design-system:serve-static`). That target depends on `build-storybook`, so the spec can read `index.json` when it collects tests.
4. **Visual baselines need a stable environment.** A Windows screenshot never matches Linux, and even two Linux setups can differ in fonts. One image both makes and checks the baselines, and its tag must follow `@playwright/test`. The baselines have no OS suffix (`snapshotPathTemplate`) because only that image writes them.
5. **The Linux image has WebGL; Windows headless Chrome here does not.** The constellation story showed its fallback on Windows but animated in the container, so Playwright never got two identical screenshots in a row. A moving scene can't have a pixel baseline, so stories tagged `animated` are left out of the visual comparison.
6. **Verified:**
   - 17 stories; axe passes for all 34 story-theme pairs, on Windows and in the Linux image.
   - The 32 baselines were made in the image, then a second, compare-only run passed against them.
   - The static build serves under its production CSP with no console errors.

## Consequences

- A component change that breaks contrast, focus, naming or layout fails CI in the Storybook job before it deploys.
- After an intended visual change, run `pnpm nx run design-system-e2e:update-baselines` (Docker) and commit the new screenshots.
- Upgrading Playwright means changing the CI container tag and regenerating the baselines.
