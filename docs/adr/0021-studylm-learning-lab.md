# ADR-0021: StudyLM Learning Lab: lessons the AI fills and the app checks

- **Status:** Accepted
- **Date:** 2026-11-02
- **Milestone:** M2

## Context

StudyLM drills software-engineering topics with AI flashcards and quizzes. Its "deep dive" shows a summary, one code snippet and a small graph that `ah-flow-chart` draws as a line. The aim is a bootcamp:

- lessons that explain with interactive visuals: code stepping, data flowing through systems, algorithms iterating;
- research-based study plans;
- focus tools.

The visuals are only as good as their data, and that data comes from a model. A wrong trace, an impossible event-loop order or a broken binary search tree teaches the wrong thing. The model's output has to be constrained, checked and, where possible, computed instead.

Research sets the shape of a lesson (sources in [the design](../studylm/learning-lab.md)):

- retrieval and spacing beat rereading;
- predicting first and explaining in your own words help;
- animation helps only when learners control discrete steps.

## Decision

- **A typed lesson format in a new lib, `product-studylm-lessons`** (`scope:product-studylm, scope:shared, type:domain, runtime:agnostic`).
  - Lessons are sections of blocks from a catalog of 28 kinds in six families: text, code, data structures and algorithms, systems, concepts and checks.
  - Every visual is a sequence of discrete steps whose ops change its state.
- **valibot as the single source.** It gives the types, runtime validation (no `eval`, so it is CSP-safe) and, through `@valibot/to-json-schema` and a post-processing step, JSON Schema in the strict structured-output subset:
  - every key required, `null` for absent values, closed objects;
  - no recursion, objects nested at most 5 deep;
  - `oneOf` rewritten as `anyOf`, size limits moved into descriptions.

  A spec checks every exported schema against these rules. valibot sits on the federation `skip` list, so it is bundled and tree-shaken inside the remote.

- **Semantic checks after the schema checks.** Each block's steps are replayed in order:
  - stack and queue legality;
  - event-loop ordering;
  - state-machine transitions;
  - git history;
  - call-stack order;
  - recomputed hash buckets and BST order;
  - algorithm preconditions.

  Each issue is a JSON pointer plus a message that says what to change, which feeds a `block-repair` call.

- **Engines over claims.** Algorithm blocks can carry `simulate: { algorithm, input }`, and deterministic simulators produce the steps. JavaScript is executed by a tracer (acorn plus Sval in a worker) rather than traced by the model. This phase defines those contracts; the engines follow.
- **Staged generation.** An outline first, then one block per call against that kind's own small schema, then at most one repair. Small schemas suit providers that refuse large grammars, and failures stay local.
- **One new n8n action with the prompts compiled in.**
  - `generate_lesson_part` accepts only `{ task, specVersion, input }`.
  - `update-studylm-workflow.mjs` embeds the generated kit: prompts, strict schemas, catalog cards and a golden example per kind.
  - Strict JSON-schema mode on Groq `gpt-oss-120b`. The workflow fails over to the second model on an HTTP error or an output that doesn't fit, and otherwise answers `AI_FAILOVER_EXHAUSTED`, never canned content.
- **Golden lessons as ground truth.** Seven hand-written lessons use all 28 kinds and pass every check with no warnings. They are also the prompts' examples, and later the offline demo content.
- **Vitest file snapshots for generated files.** The snapshots write `src/generated/` (`lesson-kit.json`, `lesson.schema.json`, `catalog.md`), and CI fails on drift, like the graph and OpenAPI checks. `workflow.spec.ts` fails when the committed workflow embeds an older kit.

## Consequences

- **Tests:** the lessons lib has 116 tests covering the golden lessons, broken fixtures (each asserting the issue's path and code), strictness, the kit, and the workflow run against a fake model.
- **No screens yet.** The step player, renderers, focus tools, FSRS and planner come in the phases listed in the design.
- **StudyLM problems** are listed in the design and fixed before new screens build on it: wrong-subject writes, deleted cards on parse failures, silent canned fallbacks, claimed Leitner scheduling, `strictTemplates` off and no tests.
- **Re-importing.** Changing the format means rewriting the snapshots, regenerating the workflow and re-importing it into n8n. A `specVersion` mismatch makes the workflow refuse with `SPEC_MISMATCH` rather than misbehave.
- **The older actions** now also fail over when the primary reply can't be parsed. Their requests and replies are otherwise unchanged.
- The unused `study-brief` component (calling a method that doesn't exist) and the unused sample-deck data are removed.
