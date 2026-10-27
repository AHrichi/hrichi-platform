# ADR-0011: Three.js engine, Angular adapter and the constellation hero

- **Status:** Accepted
- **Date:** 2026-10-27
- **Milestone:** M2

## Context

M2's signature hero shows this repository's real Nx project graph in 3D. Three.js is about 190 kB gzipped, WebGL drains batteries, and some visitors ask for less motion, so the hero must never cost the page its Lighthouse budgets (LCP ≤ 2 s, CLS ≤ 0.05) or leave a blank box. Labs will reuse the same rendering code, so it can't be tied to one page or to Angular.

## Decision

- **`@ah/three/engine`** (`type:engine`; ESLint bans `@angular/*` in engine libs):
  - `createStage()` binds a renderer, scene and camera to a canvas.
    - It resizes with a `ResizeObserver`.
    - Its `FrameLoop` draws only while the canvas is on screen and the tab is visible, and only when a render was requested or the scene animates.
    - If the median of the first 90 frames is slower than 30 fps, it drops the pixel ratio to 1.
    - `dispose()` frees geometries, materials, textures (uniforms included) and the WebGL context.
  - `@ah/three/engine/quality` never imports three. `detectQuality()` returns one of three tiers:
    - **`off`:** reduced motion, Save-Data, a viewport under 768 px, fewer than 4 cores or 4 GB of memory, no WebGL2, or software rendering.
    - **`low`:** integrated and mobile GPUs.
    - **`high`:** everything else.

    `?3d=on|low|off` overrides the heuristics, but never a missing WebGL2.
- **`@ah/three/angular`:** `<ah-scene>` shows its projected content (the fallback) and decides the tier after hydration.
  - When 3D is allowed, it waits for `requestIdleCallback`, imports the scene module, and the scene compiles its shaders with `compileAsync`.
  - It crossfades to the canvas only after the first frame.
  - Any failure leaves the fallback in place.
  - The scene contract (`SceneModule.createScene`) is framework-free, so Storybook or another framework can host the same scenes.
- **The graph:** `tools/scripts/export-graph.mjs` reads `createProjectGraphAsync()`.
  - It adds the federated remotes from `tools/federation/remotes.json`, which Nx can't see, and runs a seeded force layout.
  - It writes `libs/three/constellation/src/generated/graph.json`. CI regenerates the file and fails on any diff, so the hero always matches the repository.
- **One camera, two renderings:** `@ah/three/constellation` holds the data, the camera and `project()`.
  - The home page prerenders an **inline SVG** from them. It is the poster (no image request, so the h1 stays the LCP element), the reduced-motion view and the no-JS view.
  - A unit test checks `project()` against three's `PerspectiveCamera`, so the WebGL scene opens on the same picture.
  - The caption repeats every app as a link, so the canvas stays `aria-hidden`.
- **The scene** (`@ah/three/scenes/constellation`, lazy):
  - Nodes are instanced billboards with a per-pixel glow shader; edges carry a pulse from each project to its dependency, and federated edges are dashed.
  - Hover shows the project's tags and neighbours, and clicking an app opens it.
  - There is no bloom pass: the glow shader looks the same without extra render targets.
- **Stage colours:** new `color.stage.*` and `color.data.1–7` tokens. The panel is dark in both themes because additive glow needs a dark background. The contrast gate now also checks graphics at 3:1 (WCAG 1.4.11).
- **Sharing:** `three` is a dependency, so Native Federation shares it as a singleton that the shell and labs load on demand.

## What M2 found

1. **Native Federation shares only packages that code imports.** Adding `three` to `package.json` changed nothing until the scene imported it. The shared bundle is the whole package: 743 kB raw, 189 kB gzipped. Only capable desktops download it, after the page is idle, and the Orbit lab will reuse the cached file. The scene's own chunk is 4.5 kB gzipped, and the shell's initial JS is unchanged at 45 kB.
2. **Nx forbids importing a library both statically and lazily** (`@nx/enforce-module-boundaries`). The data and camera (static, for the SVG) and the WebGL scene (lazy) are therefore two libraries.
3. **jsdom has neither `matchMedia` nor WebGL2,** and creating a canvas context logs "not implemented". The probe checks for `WebGL2RenderingContext` first and tolerates a missing `matchMedia`.
4. **Headless Chromium has no GPU.** Playwright and Lighthouse pass `--enable-unsafe-swiftshader`. The probe still classifies SwiftShader as `off`, which is right for real visitors, so the tests force WebGL with `?3d=on`.
5. **The first layout was a ball of one cluster.** Scope anchors on the unit sphere pulled projects to the rim, and loosely linked projects (the API, the e2e suite) flew out and squeezed everything else when scaled. The fix: anchors moved inward, plus a soft wall at radius 1. The layout uses only arithmetic and `Math` functions with a fixed seed, so every machine writes the same file.
6. **A cached service worker hid new builds on `localhost:4200`.** It served the previous prerendered page, with the old layout. The e2e tests block service workers, as the contact tests already did.
7. **Vertical centring caused a 0.24 layout shift.** The first desktop Lighthouse run had a cold cache, so the web font swapped in and changed the text column's height, and the vertically centred figure moved. Lighthouse kept the best run by default and passed anyway. The hero now aligns to the top, and the CLS assertion is pessimistic in both Lighthouse configs, so a shift in any run fails.
8. **Verified:**
   - e2e: with reduced motion the SVG renders, there is no canvas and three is never requested. With `?3d=on` the scene becomes ready, three loads only after `DOMContentLoaded`, and caption links navigate. After three round trips through the router, exactly one WebGL context is alive. axe reports no violations in the hero.
   - Lighthouse desktop on `/?3d=on`, with WebGL forced on SwiftShader: performance 100 in all three runs, LCP 0.33–0.36 s, TBT 0–3 ms, CLS 0.

## Consequences

- Every new project or dependency changes `graph.json`. Run `node tools/scripts/export-graph.mjs` before committing, or CI fails.
- Phones and reduced-motion visitors never pay for WebGL; desktops get it after the page is idle.
- New scenes plug into `<ah-scene>` with a `SceneModule` and stay testable outside Angular.
