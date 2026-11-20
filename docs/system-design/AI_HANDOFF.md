# AI handoff: System Design course (hrichi-platform)

This is a briefing for an AI agent that picks up the System Design course. Read it first, then:

- [technical-design.md](technical-design.md) for the design, contracts and phases;
- [lesson-authoring.md](lesson-authoring.md) if you write content;
- [ADR-0025](../adr/0025-system-design-course.md) for the decisions;
- `docs/architecture.md` for the platform.

Last updated 2026-11-20 (P3).

## 1. What this is

An interactive course on system design and software architecture. It has:

- 44 lessons in 9 modules. Each lesson is a sequence of steps over an animated isometric diagram, with metric chips and a side panel.
- Practice quizzes.
- One cheatsheet per module.
- A Design Lab traffic simulator with challenges.
- A hand-off of lesson cards to the Learning Engine (ADR-0024).

It is English first, static and local-first (IndexedDB), with a paper look. It has one owner.

## 2. What is live

| Phase                        | State                                                                                                                                                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 docs and ADR              | Done (this file, ADR-0025, technical design, authoring guide)                                                                                                                                                                                                                                         |
| P1A shared step helpers      | PR 1 committed on its own branch (session "P1A PR1"); PR 2 (switch StudyLM) waits for PR 1 to deploy                                                                                                                                                                                                  |
| P1B paper look tokens        | Committed on its own branch (session "P1B"); story baselines come from CI                                                                                                                                                                                                                             |
| P2 skeleton and registration | Done: placeholder shell builds, lints and tests; the flag is off                                                                                                                                                                                                                                      |
| P3 domain core               | Done: contracts, engines (scene replay, iso math, inline text, marking, progress, search, practice), `validateLesson`, the 44-lesson curriculum with valid stand-ins; 142 tests, 99% line coverage. `engine/fold.ts` is a local copy of `upTo`: switch it to `@ah/shared/steps` once P1A is on `main` |
| P4 to P12                    | Not started                                                                                                                                                                                                                                                                                           |

Nothing is deployed yet. Two P2 items wait for other phases: the app's `styles` line for `@fontsource-variable/jetbrains-mono` (add it once P1B has installed the package) and the Storybook stories glob for `libs/products/system-design/ui` (add it in P4 with the first stories). The app will deploy standalone to `https://product-system-design.ahmed-hrichi.workers.dev` once its `deploy` target lands on `main`. It stays hidden in the portfolio until P12.

## 3. Code map (target; see the technical design §1)

| Area                                                                                             | Location                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| App                                                                                              | `apps/products/system-design/web` (`product-system-design`, port 4312)                                                    |
| Domain: model, engines, validators, content (lessons, cheatsheets, lab catalogue and challenges) | `libs/products/system-design/domain`                                                                                      |
| Dexie database                                                                                   | `libs/products/system-design/data-access`                                                                                 |
| Presentational components (iso scene, step panel, timeline, check widgets)                       | `libs/products/system-design/ui`                                                                                          |
| Routes, shell, screens, store, copy                                                              | `libs/products/system-design/feature`                                                                                     |
| Platform additions                                                                               | `libs/shared/steps` (`upTo`); `@ah/ui` (`StepTimeline`, `injectReducedMotion`); paper look in `libs/design-system/tokens` |

## 4. Hard rules

The full list is §0 of the technical design. The ones that break CI most often:

- **Dependencies:**
  - Products never import other products.
  - Data-access never imports `@ah/platform/*`.
  - ui never imports `@ah/learning/client`.
  - Domain stays free of Angular.
- **Styles:** in `.scss` files only, using tokens and logical properties. SVG colours come from classes, never `fill=` attributes.
- **Lessons:** lesson files are never exported from the domain barrel; they load through `meta.load()`.
- **Originality:** never copy text, scenarios, colours or code from the course that inspired the UX.
- **`@ah/ui` deploy order:** `@ah/ui` is a federation singleton. Ship additions to it before any remote that depends on them.

## 5. Commands

```bash
pnpm nx run-many -t lint test build -p product-system-design product-system-design-domain product-system-design-data-access product-system-design-ui product-system-design-feature
pnpm exec stylelint "libs/products/system-design/**/*.scss" "apps/products/system-design/**/*.scss"
pnpm nx run design-system-tokens:build-tokens
node tools/scripts/export-graph.mjs
pnpm nx e2e shell-e2e -- system-design
pnpm nx run product-system-design:serve-static   # preview on :4312
```

`--testFile=…` doesn't work with this Vitest setup; pass the file filter after `--`.

## 6. Next steps

1. Run P1A PR 1 and P1B (separate sessions), then P2 (app skeleton and registration, hidden).
2. Then P3 (domain core) → P4 (ui kit) → P5 (shell and lesson player) → P6 (Foundations content and e2e).
3. Then, in parallel: P7 (Learning Engine), P8 (Practice), P9 (Cheatsheets), P10 (Design Lab) and P11 (content waves, one agent per module).
4. P12: go live.

Every phase ends by updating section 2 of this file.
