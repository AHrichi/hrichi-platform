# ADR-0023: StudyLM writes lessons, plays every visual, and runs lesson code

- **Status:** Accepted
- **Date:** 2026-11-02
- **Milestone:** M2

## Context

After ADR-0022, StudyLM played seven built-in lessons, and only 13 of the format's 28 block kinds had a renderer. Learners wanted lessons for their own roadmap sections, written by the AI as roadmaps are. The contracts for that already existed (ADR-0021):

- the `generate_lesson_part` workflow action;
- the validators;
- the `Simulator` and `Trace` shapes.

## Decision

- **Lessons on demand.** Each roadmap section offers "Write a Lesson". `LessonGenerator` writes in stages:
  1. an outline, checked with `validateOutline`;
  2. one block per call against that kind's schema, two at a time, each checked with `validateBlock`;
  3. at most one `block-repair` per failing block.

  A block that still fails is left out and the lesson says so, with a retry; nothing is filled in. Links the lesson check rejects are cleared rather than failing the lesson: a `pauseFor` with no check, or a `reveal` with no visual. Lessons are saved on the device (Dexie version 3) under an id derived from the subject and section.

- **The AI describes, engines compute.** Steps come from simulators whenever a block has `simulate`:
  - array, tree, graph and grid algorithms;
  - recursion, including memo hits.

  Reducers give every stepped kind's state at any step. The validator applies array, stack and queue ops through the same functions, and hashes keys with the same `bucketOf`.

- **A JavaScript tracer** (`product-studylm-tracer`, `type:engine`):
  - acorn instruments the code;
  - Sval interprets it, with no `eval`;
  - timers, microtasks and Promise run on a virtual loop, so a run is deterministic and records the event loop.

  It runs code traces, event loops and output predictions in execute mode. When the AI's written output differs from the real one, the executed output wins and the lesson says so.

- **On the main thread, not a worker.** A hook at the top of every loop body and function spends a 2,000-step budget, and calls deeper than 200 stop. Even `while (true) {}` ends, so no worker is needed, and nor is a CSP change for a cross-origin worker.
- **Feedback on self-explanations** goes through a `SELF_EXPLAIN_FEEDBACK` token, which the lesson library defines and StudyLM provides. The presentational library never calls the AI itself.

## Consequences

- All 28 kinds render; the "coming next" card is gone.
- **Sval's limits:**
  - Sval resumes `await` on the real Promise, outside the virtual loop, so code with `await` is reported as unsupported rather than traced wrongly.
  - Sval also mishandles `return` inside `try`/`finally` in a loop, so returns pop the call stack through a hook instead.
- **Size:** the lesson chunk grows to about 70 KB transferred, with the interpreter. It loads only with the lesson screen.
- **Tests:**
  - e2e writes a whole lesson against a stubbed workflow, repairing a block, and plays every built-in visual to its end.
  - The workflow's paths that don't call a model (ping, `SPEC_MISMATCH`, `BAD_INPUT`, and `AI_FAILOVER_EXHAUSTED` without a key) were checked in a throwaway n8n container.
- **Before first use,** the n8n workflow must have been re-imported since ADR-0021, or StudyLM says so.
