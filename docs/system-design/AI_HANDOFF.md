# AI handoff: System Design course (hrichi-platform)

A briefing for whichever AI agent or IDE (Claude Code, Antigravity, …) picks up the System Design course. It assumes no memory of earlier sessions. Read it top to bottom before touching code.

Last updated 2026-11-21, after P11 (all 44 lessons ready) on `feat/system-design-p11-content`, pushed. Next: **P12** go-live (section 6). Shared agent rules: [AGENTS.md](../../AGENTS.md).

## 0. Resume in five minutes

1. **Get the branch.** `git fetch origin && git switch feat/system-design-p11-content` (pushed). It contains everything: P0–P10 (`feat/system-design-p6-takeover`), the post-P10 polish (`feat/system-design-post-p10`), the shared agent rules (`chore/system-design-agent-handoff`) and P11. Branch from it for each new phase (`feat/system-design-p12-…`).
   - The main checkout (`C:\Users\Administrator\Projects\Personal\hrichi-platform`) may still sit on `feat/system-design-post-p10` with the **old, uncommitted** P11 drafts Antigravity wrote there; they are all committed (and finished) on `feat/system-design-p11-content` as `9f70f1e`. Discard them there (`git restore --staged . && git restore . && git clean -fd libs/products/system-design/domain/src/lib/content/lessons`) before switching, after the owner agrees.

2. **Install:** Windows 11, Node 24, pnpm 10.34.9 (`packageManager` in `package.json`). Run `pnpm install --frozen-lockfile`.
3. **Check that it's green:**

   ```bash
   pnpm nx run-many -t lint test build -p product-system-design product-system-design-domain product-system-design-data-access product-system-design-ui product-system-design-feature shared-steps design-system-ui design-system-tokens shell --output-style=static
   ```

4. **Read, in this order:**
   1. this file;
   2. [technical-design.md](technical-design.md): §0 hard rules, §3 contracts, §4 engines, §5 screens, §6 visual system, §11 phases;
   3. [ADR-0025](../adr/0025-system-design-course.md);
   4. [lesson-authoring.md](lesson-authoring.md), only for content work.

   `docs/architecture.md` covers the platform as a whole.

5. Do the next phase (section 6), then update section 2 of this file in the same PR.

## 1. What this is

An interactive course on system design and software architecture, as a new app in this Nx monorepo:

- **44 lessons in 9 modules.** Each lesson is 6–12 steps over an animated isometric SVG diagram, with metric chips (HUD), a step panel, a timeline and a "You'll learn" checklist.
- **Practice:** quizzes per lesson, plus a mixed set.
- **Cheatsheets:** one printable sheet per module.
- **Design Lab:** a traffic simulator with challenges.
- **Learning Engine hand-off:** "Add to my daily reviews" (ADR-0024).

It is English first, static and local-first (IndexedDB through Dexie), with no backend. It uses a warm **paper look** in JetBrains Mono, with light and dark variants.

The UX was inspired by a public interactive course. **Never copy its text, scenarios, step sequences, colours or code.** All content here is original.

**Stack:** Angular 22 (zoneless, standalone, OnPush, signals), Nx 24, Native Federation remotes, NgRx SignalStore, Vitest 4, Playwright, Storybook 10, Cloudflare Workers static hosting.

## 2. Status

| Phase                             | State                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Commit(s) on the branch    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| P0 docs and ADR                   | Done                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `d420be1`                  |
| P1A shared step helpers, PR 1     | Done and merged: `@ah/shared/steps` (`upTo`); `StepTimeline` (with a `stepMs` option), `Clock`, `STEP_MS`, `SPEEDS`, `injectReducedMotion` in `@ah/ui`                                                                                                                                                                                                                                                                                                                                                  | `4efebed`, merge `b075ea7` |
| P1A PR 2 (switch StudyLM to them) | **Not done.** Do it only after the shell has deployed PR 1: `@ah/ui` is a federation singleton                                                                                                                                                                                                                                                                                                                                                                                                          | n/a                        |
| P1B paper look tokens and font    | Done and merged: `[data-look='paper']` light and dark, `color.scene.*` tokens, contrast gate over 4 themes, JetBrains Mono in the shell and the app                                                                                                                                                                                                                                                                                                                                                     | `0367ac9`, merge `0a0cb24` |
| P2 app skeleton and registration  | Done: the `product-system-design` remote (port 4312) and its 4 libs, registered everywhere; visibility flag **off**                                                                                                                                                                                                                                                                                                                                                                                     | `e081d06`, `57bf4ed`       |
| P3 domain core                    | Done: contracts, engines, `validateLesson`, the 44-lesson curriculum (all stand-ins, `ready: false`); 142 tests, 99% line coverage                                                                                                                                                                                                                                                                                                                                                                      | `3a43a63`, `edf68af`       |
| P4 UI kit and isometric renderer  | Done (on `feat/system-design-p4-ui-kit`): `sd-icon` (28 icons), 7 isometric glyphs (`cube`, `cylinder`, `device`, `stack`, `globe`, `person`, `disk`), `sd-iso-scene`, `sd-inline-text`, `sd-hud`, `sd-legend`, `sd-step-panel`, `sd-timeline`, `sd-learn-list`, `sd-progress-card`, check widgets (`sd-check-choice`, `sd-check-numeric`, `sd-check-order`), 25 tests in 14 spec files, and 14 paper-look Storybook stories                                                                            | `6e72713`..`dcc42fa`       |
| P5 feature shell & lesson player  | Done (on `feat/system-design-p5-shell-player`): Dexie v1 tables (`progress`, `attempts`, `designs`, `meta`) and `SystemDesignLocalStore`; `SystemDesignRuntime`, `SystemDesignStore`, `SdNav`, `keyboard`; responsive 3-breakpoint `sd-shell` with module folders, lesson statuses, theme toggle & search trigger; `LessonScreen` with `StepTimeline`, URL step sync, expanded stage & phone transport bar; `sd-search-dialog`; `GuideScreen`; 19 tests across 6 feature specs + 3 data-access tests    | `ae28d57`..`d3f5095`       |
| P6 Foundations content plus e2e   | Done (on `feat/system-design-p6-takeover`): the 4 Foundations lessons in full (`request-journey` golden, `latency-throughput`, `napkin-math`, `availability`, all `ready: true`), the Foundations cheatsheet and registry (`CHEATSHEETS`, `CHEAT_TERMS`), the standalone e2e spec, search rebuilt as a real ARIA combobox, card titles as `<div>` (only the shell top bar is a `<header>`), search close button "Esc: close search", and `request-journey` `url-note` repositioned clear of zone label. | `5afcfba`..`e64dd9d`       |
| P7 Learning Engine hand-off       | Done (merged `741b5aa`): `lessonReviewItems()` / `pageLink()`, `<ah-learn-this>` projected into lesson recap (`sdRecapActions`) and rendered on missed practice summaries, `'system-design': 'System Design'` in `InboxScreen` (`APP_NAMES` + unit spec), and hand-off e2e to `:4311/inbox`.                                                                                                                                                                                                            | `2d4e343`, `1fda1ec`       |
| P8 Practice                       | Done (merged `6554f03`): `PracticeHome` (best scores, mixed-practice unlock gate), `LessonPractice`, `MixedPractice`, shared `sd-practice-run` (`sd-check-*`, `markCheck()`, explanations, "See it in the lesson", `<ah-learn-this>`), persistent `attempts` (`AttemptRun`), specs and e2e.                                                                                                                                                                                                             | `289bdd4`, `1ca0111`       |
| P9 Cheatsheets                    | Done (merged `28d071f`): all 8 remaining module cheatsheets (`scaling`..`case-studies`), `tools/scripts/system-design-cheat-terms.mjs` generating `terms.ts`, `sd-cheat-section` UI component + story, `CheatsheetIndex` and printable A4 `CheatsheetScreen` + print CSS, specs and e2e.                                                                                                                                                                                                                | `6130303`..`8605538`       |
| P10 Design Lab                    | Done (merged `36e0004`): `lab/` simulator (`simulate`, `checkChallenge`, auto-wiring edits, tier-column scene, catalog, 6 challenges with starter/solution specs), `LabStore` autosave to `designs`, `LabHome` and keyboard-accessible `LabScreen`, specs and `first-users` e2e.                                                                                                                                                                                                                        | `510ab4b`..`c1db9c3`       |
| P11 Content waves (Modules 02–09) | Done (on `feat/system-design-p11-content`): 40 lessons in modules 02–09 (drafted by Antigravity, finished and checked here), plus `design-chat` written new; all 44 `ready: true` with lazy loaders. `validateLesson` now also requires a `case` and a `watch-out` step. Two security lessons trimmed to the length limits; the sharding hot-key example reworded.                                                                                                                                      | `9f70f1e`..HEAD            |
| P12 Go live                       | Not started                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | n/a                        |

**Verified:**

- P11 on 2026-11-21: the System Design e2e: **9 passed, 1 skipped** (embedded test, until go-live); lint, test and build for the five `product-system-design*` projects (domain 240 tests incl. every lesson through `validateLesson`, feature 38, ui 29, data-access 2); format and stylelint; and an in-browser sweep of **every step of all 44 lessons** (about 380 steps) on the built app: each renders a title and a diagram with no console errors. Spot-checked desktop light, phone dark.

- the System Design e2e (`apps/portfolio/shell-e2e/src/system-design.spec.ts`): **9 passed, 1 skipped** (embedded catalog test skipped until P12 go-live), covering lesson keyboard stepping/reload/recap, Learning Engine inbox hand-off, ARIA combobox search (lessons + cheatsheet terms), cheatsheets index/sheet/print/lesson-link, axe on Lesson/Practice/Guide/Cheatsheets/Lab, practice run + score persistence, phone bottom bar, and solving `first-users` in Design Lab with autosave;
- lint, test (uncached) and build for `product-system-design`, `product-system-design-domain` (237 tests, 98.37% lines), `product-system-design-data-access` (2 tests), `product-system-design-ui` (29 tests), `product-system-design-feature` (38 tests), `shared-steps` (5 tests), `design-system-ui` (59 tests), `design-system-tokens`, `learning-feature` (23 tests), and `shell` (6 tests);
- the token gate regenerates with no diff, and `export-graph.mjs` regenerates `graph.json` cleanly;
- the `nx format:check`, stylelint (STRICT on `libs/products/system-design/**/*.scss` and `apps/products/system-design/**/*.scss`) and zoneless checks;
- `design-system:build-storybook` and Playwright axe + CSP checks (`pnpm nx e2e design-system-e2e -- --grep "System Design/UI Kit|Foundations/Paper look"`): all 15 `System Design/UI Kit` stories and `Foundations/Paper look` pass axe-core and CSP checks in both light and dark themes (32 passed, 32 visual-regression skipped locally);
- the built app at :4312 in a browser, light and dark: paper colours, JetBrains Mono loaded, no console errors.

**Not verified yet:**

- the Storybook visual regression screenshot baselines for `"Foundations/Paper look"` and `"System Design/UI Kit"` stories (skipped locally because `VISUAL_REGRESSION` runs only in CI's Linux Playwright image: `nx run design-system-e2e:update-baselines`).

**Open loose ends:**

- **Polish:** on a phone the diagram is small, so labels are hard to read without **Expand**; consider a larger stage or zoom on narrow screens. On step 2 of `request-journey` the URL note overlaps the "Mobile network" zone label.

- P1A PR 2, above.
- Five lint warnings existed before this work: one in `libs/design-system/ui/src/lib/modal/modal.stories.ts`, four in `apps/portfolio/shell/src/app/app-available.guard*.ts`. Leave them alone.

## 3. Code map

| Area                                 | Location                                                                                                                                     | What's there now                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App (remote + standalone PWA)        | `apps/products/system-design/web` (`product-system-design`, port 4312)                                                                       | Federation config, wrangler, ngsw, icons and manifest. `index.html` sets `data-look="paper"`                                                                                                                                                                                                                                             |
| Domain (pure TS, `runtime:agnostic`) | `libs/products/system-design/domain`                                                                                                         | `model/`, `engine/`, `lab/` (`model`, `simulate`, `edit`, `challenge`, `scene`), `validate/lesson.ts`, `content/` (`curriculum`, `lessons/foundations/*`, `lessons/pending`, all 9 `cheatsheets/*` + `terms.ts`, `lab/{catalog,challenges}`), `testing/fixtures.ts`                                                                      |
| Data access                          | `libs/products/system-design/data-access`                                                                                                    | `SystemDesignDatabase(name)` (v1 tables: `progress`, `attempts`, `designs`, `meta`) and `SystemDesignLocalStore`                                                                                                                                                                                                                         |
| UI (presentational, prefix `sd`)     | `libs/products/system-design/ui`                                                                                                             | `sd-coming-soon`, `sd-icon`, 7 isometric glyphs, `sd-iso-scene`, `sd-inline-text`, `sd-hud`, `sd-legend`, `sd-step-panel`, `sd-timeline`, `sd-learn-list`, `sd-progress-card`, `sd-cheat-section`, check widgets (`sd-check-choice`, `sd-check-numeric`, `sd-check-order`)                                                               |
| Feature (routes, shell, store, copy) | `libs/products/system-design/feature`                                                                                                        | `SYSTEM_DESIGN_ROUTES`, `sd-shell`, `SystemDesignStore`, `LabStore`, `SystemDesignRuntime`, `SdNav`, `keyboard`, `sd-search-dialog`, `LessonScreen`, `PracticeHome`/`LessonPractice`/`MixedPractice`, `CheatsheetIndex`/`CheatsheetScreen`, `LabHome`/`LabScreen`, `GuideScreen`, `learning/review-items`, `practice/practice`, `copy/*` |
| Shared additions                     | `libs/shared/steps`, `libs/design-system/ui/src/lib/{step-timeline,reduced-motion}.ts`, `libs/design-system/tokens/tokens/look.paper.*.json` | See section 2                                                                                                                                                                                                                                                                                                                            |

**Registration points** (all done in P2; touch them again only to go live):

| File                                                          | Entry                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `tsconfig.base.json`                                          | Path aliases `@ah/products/system-design/*` and `@ah/shared/steps` |
| `eslint.config.mjs`                                           | The `scope:product-system-design` dependency rule                  |
| `tools/federation/remotes.json`                               | The remote's origins                                               |
| `apps/portfolio/shell/public/federation.manifest.json`        | The dev manifest entry                                             |
| `apps/portfolio/shell/src/app/app.routes.ts`                  | Route `/apps/system-design`                                        |
| `libs/shared/content/src/lib/app-visibility.ts`               | Key `system-design`, **false**                                     |
| `libs/portfolio/feature-apps/src/lib/apps-page.ts`            | Cards in 5 languages and the standalone origin                     |
| Constellation `view.ts` and `constellation-figure.ts`         | Hero links                                                         |
| `libs/three/constellation/src/generated/graph.json`           | The regenerated graph                                              |
| `apps/portfolio/shell-e2e/`                                   | The e2e config and spec                                            |
| `stylelint.config.mjs`                                        | STRICT paths                                                       |
| `tools/scripts/generate-app-icons.mjs`                        | The app's icon entry                                               |
| README tables, `.claude/launch.json`                          | Rows and the static preview on 4312                                |
| `libs/learning/feature/src/lib/screens/inbox/inbox-screen.ts` | `APP_NAMES` entry                                                  |

## 4. Hard rules (the ones that break CI)

The full list is technical-design §0.

- **Dependencies** (enforced by `@nx/enforce-module-boundaries`):
  - products never import other products (never `@ah/products/studylm/*`);
  - `type:domain` imports only `type:util` (for example `@ah/shared/steps`);
  - `type:data-access` never imports `@ah/platform/*` (the feature passes in the database name);
  - `type:ui` never imports `@ah/learning/client` (`<ah-learn-this>` goes in feature templates, projected into a ui slot);
  - `runtime:agnostic` never imports `@angular/*` or `@ngrx/*`.
- **Styles:** in `.scss` files only, since stylelint ignores inline `styles:`.
  - Semantic tokens only: no hex, no `rgb()`, no named colours; every `var(--…)` must exist in `tokens.css`.
  - Logical properties only (`margin-inline`, `inset-block-start`, …); no `transition: all`.
  - SVG colours come from classes (`.face-top { fill: var(--color-scene-blue-top) }`), never `fill=` or `stroke=` attributes.
- **Scene tokens** exist only under `[data-look='paper']`. Components that use them render inside the shell (or in stories wrapped in `<div data-look="paper">`).
- **Components:** standalone, OnPush, signal `input()` and `output()`, `inject()`, `@if`/`@for`; no `@angular/animations` (use CSS or the Web Animations API); respect `prefers-reduced-motion` (`injectReducedMotion` from `@ah/ui`).
- **Rendering:** no `innerHTML`. Rich text renders as `[textContent]` spans from `parseInline()`.
- **Accessibility:** axe must pass (lint's template a11y rules are errors). The diagram is `role="img"` with a text alternative.
- **Lessons** are never exported from the domain barrel; they load through `LessonMeta.load()`, one lazy chunk each.
- **Copy:** user-visible strings live in typed `copy/*.ts` files or in lesson content. English only for now.
- **Git:** conventional commits; merge commits, not squash; `main` is protected (required checks "Lint, test, build, e2e" and "Storybook (axe, visual regression)").

## 5. Commands and gotchas

```bash
pnpm nx run-many -t lint test build -p <projects> --output-style=static   # without static, Nx hides per-task output
pnpm nx test product-system-design-domain -- --coverage.enabled --coverage.reporter=text
pnpm exec stylelint "libs/products/system-design/**/*.scss" "apps/products/system-design/**/*.scss"
pnpm exec prettier --write <paths>      # then: pnpm nx format:check
pnpm nx run design-system-tokens:build-tokens   # regenerates tokens.css/ts; commit them
node tools/scripts/export-graph.mjs     # after adding a project; commit graph.json (CI diffs it)
pnpm check:zoneless
pnpm nx run product-system-design:build && node tools/scripts/serve-static.mjs dist/apps/products/system-design/web/browser 4312
pnpm nx e2e shell-e2e -- system-design
```

- **Filtering tests:** `--testFile=…` doesn't work with this Vitest setup; put the filter after `--`.
- **Running tools:** run them from the repo root through `pnpm nx` / `pnpm exec`. Bare `vitest` or `prettier` aren't on PATH, and running inside a lib folder fails.
- **Domain specs** run in Node (`vitest.config.mts`). ui and feature specs run in jsdom with Analog (`src/test-setup.ts`). Stub `Element.prototype.animate` in jsdom specs that animate.
- **Icons:** `generate-app-icons.mjs` needs Playwright's Chromium.
- **Learning Engine hand-off:** `source.deepLink` must be an absolute `https?://` URL, or the engine drops it.

## 6. Next: P12 go-live

**Running the e2e locally:**

- Free ports 4200 and 4302–4312 first: Playwright reuses any server already on a port, even one serving another checkout's build.
- Run it as CI does: `CI=1 pnpm exec playwright test -c apps/portfolio/shell-e2e/playwright.config.mts apps/portfolio/shell-e2e/src/system-design.spec.ts --reporter=line`. Without `CI`, the shell runs its dev server, which in a worktree answers 500 ("Cannot find module '@ah/platform/federation'"); `nx e2e shell-e2e` can also hang waiting for a ready signal.
- Don't weaken ARIA to quiet axe: fix the markup.

**P12 (technical-design §11):**

1. Open a PR from `feat/system-design-p11-content` to `main` and get CI green (it also makes the Storybook visual baselines: run `nx run design-system-e2e:update-baselines` in CI's Linux image if the Storybook job asks).
2. Set `PORTFOLIO_APPS_CONFIG['system-design'] = true` in `libs/shared/content/src/lib/app-visibility.ts` (and its spec). The hub card, hero links and the embedded e2e test switch on by themselves; run the full `shell-e2e`.
3. Re-check the hub card copy in all 5 languages (`libs/portfolio/feature-apps/src/lib/apps-page.ts`).
4. Lighthouse on the standalone build (Performance ≥ 90, Accessibility 100); fix what it finds.
5. Optional polish from "Open loose ends".
6. After the shell has deployed the new `@ah/ui`: P1A PR 2 (switch StudyLM to `@ah/shared/steps` and `@ah/ui`'s `StepTimeline`).
