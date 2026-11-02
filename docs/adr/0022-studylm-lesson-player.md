# ADR-0022: StudyLM lesson player

- **Status:** Accepted
- **Date:** 2026-11-02
- **Milestone:** M2

## Context

ADR-0021 defined the lesson format, the checks and seven built-in lessons, but StudyLM had no screen that plays a lesson. It also had the problems listed in [the design](../studylm/learning-lab.md):

- canned "AI" content on every network failure;
- replies written into the wrong subject;
- one route with tabs held in store state;
- `strictTemplates` off.

## Decision

- **Repairs first.**
  - A failed AI call is an error with a retry, never canned content. Parsers drop incomplete cards and questions instead of filling them in.
  - Replies go to the subject that asked for them. A failure keeps a section's cards and records the error.
  - Requests time out and retry once on a network error.
  - `strict` and `strictTemplates` are on.
- **Routed screens.** Like Basecamp, each screen has its own URL and lazy chunk: `roadmap`, `learn`, `learn/:lessonId`, `flashcards`, `quiz`, `sources` and `stats`.
- **Engines in the lessons lib**, pure and tested with Vitest:
  - array simulators for every algorithm in the format;
  - reducers that give any stepped visual's state at any step;
  - a deterministic layered layout;
  - a Markdown subset parsed to a token tree, never HTML.
- **A presentational lib, `product-studylm-learn`** (`type:ui`):
  - the step timeline: wall-clock autoplay, holds at `pauseFor` steps until their check is answered, keyboard controls, and a reactive reduced-motion signal;
  - the views for array, stack/queue, flow (SVG, packets animated with the Web Animations API), sequence and code walkthroughs;
  - all eight check kinds;
  - the lesson view.

  Other kinds show a "coming next" card that still lists their steps. `type:ui` libs may now read `domain` types (architecture §4.3): presentational components render domain models, and still never import `data-access`.

- **Progress on the device.** Dexie version 2 adds a `lessonProgress` table: the step each visual was left on, each check's answer, and when the lesson was finished.

## Consequences

- **Lessons:** the seven built-in lessons play offline. Generating lessons for the learner's own roadmap sections waits for the live-generation phase.
- **e2e:** StudyLM is served in `shell-e2e`. Its spec answers every n8n request itself, so no real n8n is called.
- **Storybook:** stories for the player wait for screenshot baselines, which need Docker (`tools/scripts/visual-baselines.mjs`).
- **Not drawn yet:** kinds without a renderer (trees, graphs, grids, recursion trees, hash tables, event loop, git graph, state machine, pipeline, concept map, chart, code trace) follow with the engines phase.
- **Validation:** `validate/semantic.ts` still replays blocks with its own checks; the new reducers are tested against the same golden lessons.
