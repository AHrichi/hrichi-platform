# ADR-0025: System Design course: step lessons on an isometric scene

- **Status:** Accepted
- **Date:** 2026-11-20
- **Design:** [technical design](../system-design/technical-design.md) · [lesson authoring](../system-design/lesson-authoring.md) · [AI hand-off](../system-design/AI_HANDOFF.md)

## Context

The owner wants an app that teaches system design and software architecture. Each concept is taught as a short lesson of steps: each step changes an animated isometric diagram, updates a few metric chips and explains itself in a side panel. The app also has Practice quizzes, Cheatsheets and a Design Lab traffic simulator. The UX is inspired by a public interactive course; none of its text, scenarios, colours or code is reused.

Three constraints shape it:

- **Scalability of content.** Adding the 45th lesson must cost the same as the 5th, and an agent must be able to write one without touching any engine code.
- **Reuse.** StudyLM already replays "state at step n" from stepped operations and has a tested step timeline. The rules forbid a product from importing another product (architecture §4.3).
- **Look.** The owner wants a warm paper look in monospace type. Components may use only tokens (ADR-0008).

## Decision

- **A product remote of its own:** `product-system-design` at `/apps/system-design`, port 4312, scope `scope:product-system-design`.
  - **Libs:** `domain` (model, engines, validators and all content), `data-access` (Dexie), `ui` and `feature`.
  - Content lives in `domain` because a `type:domain` lib can't import another domain lib, the same reason StudyLM's `lessons` lib holds its golden lessons.
- **Content is typed TypeScript, one file per lesson, loaded lazily.**
  - The curriculum registry holds only metadata.
  - A content spec runs `validateLesson` on every lesson, so a broken reference fails CI.
- **The diagram is a pure function of the step:** `sceneAt(lesson, n)` folds scene operations with `upTo`. The UI animates only the current step's packets.
- **Shared step helpers:**
  - `upTo` moves to a new lib, `@ah/shared/steps` (`scope:shared`, `type:util`, `runtime:agnostic`);
  - `StepTimeline` and `injectReducedMotion` move to `@ah/ui`;
  - StudyLM switches to them in a second PR, after the shell has deployed the new `@ah/ui`. `@ah/ui` is a federation singleton, so the order matters.
- **A paper look in the tokens:**
  - `[data-look='paper']` overrides semantic tokens and adds look-only `color.scene.*` tokens for isometric faces.
  - Its dark variant follows the existing theme rules.
  - The contrast gate covers both paper themes.
  - The attribute sits on the app's root element, so the portfolio's header and footer keep their look when the remote is embedded.
  - JetBrains Mono is loaded by the app and by the shell, because a remote's styles never load inside the portfolio.
- **Static and local-first:** progress, practice attempts and lab designs live in IndexedDB through `databaseName()`. The app has no backend.
- **Learning Engine:** lessons and missed practice questions hand cards to the engine with `<ah-learn-this>`, from feature templates only, in the shape StudyLM uses. Being a linked host (reporting answers to FSRS) is out of scope.
- **English first,** with all copy in typed files (ADR-0018). The shell root pins `lang="en" dir="ltr"`.

## Consequences

- The shell's CSP header grows by about 110 characters. `prepare-hosting.mjs` fails above Cloudflare's 2,000, and probably only one more remote fits after this one.
- `tokens.css` gains the paper blocks. Existing Storybook baselines don't change, because the look is opt-in.
- The app starts hidden (`PORTFOLIO_APPS_CONFIG['system-design'] = false`) and is deployed standalone by CI as soon as it has a `deploy` target.
- The Design Lab's numbers are teaching approximations (queueing as M/M/1-style utilisation curves); the Guide says so.
