# StudyLM Learning Lab: design

StudyLM today drills software-engineering topics with AI flashcards and quizzes. The Learning Lab makes it a bootcamp for levelling up fast:

- lessons that **explain** a topic with interactive visuals: code you step through, data flowing through a system, algorithms iterating, roadmaps;
- **study plans** built on what learning research supports;
- **focus tools**: timers, focus time, streaks.

This document is the design. [ADR-0021](../adr/0021-studylm-learning-lab.md) records the decision, and [ai-workflow.md](ai-workflow.md) is the contract with the n8n workflow. The first phase built the contracts: the typed lesson format, its validators, the prompt kit, the workflow action and seven example lessons, in `libs/products/studylm/lessons`. The screens come next.

## What the research says, and what it becomes

| Finding                                                                                                                                                                                                                                                                                                                                                                                                                          | Becomes                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Of ten common techniques, only **practice testing** and **distributed practice** rate "high utility". Interleaving, elaborative interrogation and self-explanation rate "moderate". Rereading and highlighting rate "low" ([Dunlosky et al., 2013](https://journals.sagepub.com/doi/10.1177/1529100612453266)).                                                                                                                  | Every lesson asks questions; reviews are spaced; practice is interleaved. There is no "read it again" mode.                                                          |
| Spacing and retrieval have the strongest evidence of six well-supported strategies (spacing, retrieval, elaboration, interleaving, concrete examples, dual coding) ([The Learning Scientists](https://www.learningscientists.org/)).                                                                                                                                                                                             | Each visual comes with a concrete example and a check.                                                                                                               |
| FSRS schedules reviews with fewer repetitions than SM-2 for the same retention. The learner sets only a desired retention, 0.70–0.97 ([Anki FAQ](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)).                                                                                                                                                                                                                    | Reviews move to [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT, FSRS-6). Today StudyLM has no scheduling: `masteryCount` only counts from 0 to 5. |
| The best gap between reviews grows with how long the knowledge must last ([Cepeda et al., 2008](https://www.evullab.org/pdf/CepedaVulRohrerWixtedPashler-PS-2008.pdf)).                                                                                                                                                                                                                                                          | The planner spaces reviews against the learner's deadline.                                                                                                           |
| Questions asked _before_ learning help: g≈0.54, and g≈0.65 when learners generate an answer ([pretesting meta-analyses, 2024](https://link.springer.com/10.1007/s10648-023-09805-6)).                                                                                                                                                                                                                                            | A `predict` check comes before a visual shows the answer.                                                                                                            |
| Self-explanation prompts help (g≈0.55); generic prompts work better than specific prompts or multiple choice ([Bisra et al., 2018](https://www.Gwern.net/doc/psychology/spaced-repetition/2018-bisra.pdf)).                                                                                                                                                                                                                      | Free-text `self-explain` checks, with optional AI feedback against a rubric.                                                                                         |
| Animation rarely beats static graphics: it is often too fast, and people think of processes as discrete steps. **Interactivity and steps help** ([Tversky et al., 2002](https://hci.stanford.edu/courses/cs448b/papers/Tversky_AnimationFacilitate_IJHCS02.pdf)).                                                                                                                                                                | Every visual is a **sequence of discrete steps** the learner controls. Autoplay is optional.                                                                         |
| Learner-paced segments and signalling what matters improve learning (Mayer's segmenting and signalling principles).                                                                                                                                                                                                                                                                                                              | One shared step player with play, pause, step and scrub, plus focus highlights and narration per step.                                                               |
| Faded Parsons problems teach code patterns better than tracing or writing exercises and transfer to writing code ([Weinman et al., 2021](https://acelab.berkeley.edu/wp-content/papercite-data/pdf/parsons-chi2021.pdf)). Predicting helps novices more than producing ([Pan & Carpenter, 2023](https://www.bohrium.com/paper-details/prediction-versus-production-for-teaching-computer-programming/977533557628993669-11581)). | `parsons` and `predict-output` practice.                                                                                                                             |
| Scheduled breaks came with less fatigue and more motivation than self-chosen ones ([Biwer et al., 2023](https://pubmed.ncbi.nlm.nih.gov/36859717/)); later studies are mixed.                                                                                                                                                                                                                                                    | Pomodoro by default, Flowtime as an option, and the evidence stated honestly.                                                                                        |
| Gains from deliberate practice are said to flatten past about four hours a day (Ericsson et al., 1993, as usually summarised; the figure is contested).                                                                                                                                                                                                                                                                          | A soft daily cap on deep work, presented as guidance.                                                                                                                |
| Metalearning, directness, drill, retrieval and feedback ([Young, _Ultralearning_](https://www.shortform.com/blog/ultralearning-principles/)).                                                                                                                                                                                                                                                                                    | Topics are tagged concept, fact or procedure, and each gets practice that fits.                                                                                      |

## The experience

1. **Plan:**
   - The roadmap becomes a graph of topics with prerequisites, which light up as they are mastered.
   - A deterministic bootcamp planner turns it into days, and a **Today** view lists the learn, drill and review blocks plus focus sessions.
   - Each topic follows the same pattern: a pre-quiz, the lesson, a drill the same day, spaced reviews, then sessions that mix it with earlier topics.
   - The plan adds a weekly cumulative mock exam, keeps a 15–20 % buffer, and re-plans when the learner falls behind.
2. **Learn:**
   - One lesson per roadmap section, in short segments: narration, a stepped visual and a check.
   - The player has play and pause, step back and forward, a scrub bar and speed control, all with keyboard controls too.
   - With reduced motion, steps change instantly.
3. **Practice:**
   - Existing quizzes and cards, plus faded Parsons, predict the output, trace the variable, cloze code, order the steps and categorize.
   - Interleaved mixes and mock exams.
4. **Review:** an FSRS due queue. Lessons seed their own cards.
5. **Focus:**
   - Modes: 25/5, 50/10, 90/20, Flowtime and custom. Time is kept with timestamps, so reloads and background tabs don't lose it (the Sky lab's wall-clock anchor).
   - A session intent linked to the plan; a "parking lot" for distractions; a free-recall brain dump at the end.
   - Wake Lock keeps the screen on. A floating timer uses Document Picture-in-Picture (Chrome/Edge), with an in-page mini timer elsewhere.
   - A Web Audio chime, plus a notification if the learner allows it.
   - A heatmap of focus time, streaks with a weekly freeze, and XP that weights effortful work over reading.

## How the AI's data stays correct

1. **One contract, three outputs.** Lesson schemas are written once in [valibot](https://valibot.dev) (MIT, tree-shakable, no `eval`, so it is CSP-safe). They produce:
   - TypeScript types;
   - runtime validation;
   - **JSON Schema**, written to `src/generated/` by Vitest file snapshots, so CI fails when they drift.
2. **A catalog of blocks.** The model may only emit catalog kinds, the approach of [A2UI](https://docs.copilotkit.ai/adk/generative-ui/a2ui) and [json-render](https://infoq.com/news/2026/03/vercel-json-render).
   - The schemas use the strictest structured-output subset that OpenAI/Groq strict mode, [Claude](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) and [Gemini](https://blog.google/technology/developers/gemini-api-structured-outputs/) all accept.
   - Every key is required, with `null` for absent values. Objects close with `additionalProperties: false`.
   - There is **no recursion** (trees are flat node lists with `parentId`), objects nest at most 5 deep, and kinds are enums.
   - Size limits move into each field's description. A test checks every exported schema against these rules.
3. **Staged generation, one small schema per call.** Claude rejects grammars that compile too large, and small calls fail less often.
   1. `lesson-outline`: sections, block kinds with a self-contained brief each, and card seeds.
   2. `lesson-block`: one block, against **that kind's own schema**.
   3. `block-repair`: the block plus field-addressed issues, at most one round trip.
   4. `self-explain-feedback`: a verdict, strengths, gaps and a hint.
4. **Semantic checks after the schema checks.**
   - Ids are unique and every reference resolves.
   - Limits come from one `LIMITS` table.
   - Each block's steps are replayed in order. A pop needs a non-empty stack. A task runs only after the microtasks are drained. A transition must leave the current state. A git merge needs an existing branch. Return order follows the call stack.
   - Algorithm preconditions hold (binary search needs sorted input). Buckets and BST order are recomputed and compared.
   - Each issue comes back as `{ path, code, message }`, with a JSON pointer and a message saying what to change, which feeds the repair call. For example: `"cat" hashes to bucket 2 with char-sum-mod over 5 buckets, not 3.`
5. **"The AI describes, an engine computes," wherever possible.**
   - Algorithm blocks accept `simulate: { algorithm, input }`, and deterministic simulators produce the steps.
   - JavaScript in `code-trace`, `event-loop` and `predict-output` is **executed**: acorn instrumentation plus [Sval](https://github.com/Siubaak/sval) (MIT, interprets modern JavaScript without `eval`) in a Web Worker, producing a Python-Tutor-style trace.
   - AI-written traces for other languages are validated for shape and labelled as such.
6. **Prompts compiled into the workflow.** The open webhook accepts only `{ task, specVersion, input }`.
   - The generated kit (prompts, schemas, catalog cards and a real example per kind) is embedded in the workflow by `tools/scripts/update-studylm-workflow.mjs`, so the webhook can't be used as a free model proxy.
   - A different `specVersion` gets `SPEC_MISMATCH`.
   - User text is fenced as data, and can't close the fence.
7. **Golden lessons.** Seven hand-written lessons use all 28 kinds:
   - binary search
   - HTTP request flow
   - the event loop
   - recursion
   - BFS
   - hash tables and BSTs
   - git branching

   They pass every check with zero warnings. They are the validators' ground truth and the prompts' examples, and they will become the offline demo content, Storybook stories and e2e fixtures.

### The format

```ts
Lesson  { specVersion: 1; id; sectionId; title; tier; minutes; objectives[]; sections: Section[]; cards: CardSeed[] }
Section { id; title; intent: 'hook' | 'explain' | 'example' | 'practice' | 'recap'; blocks: Block[] }
Step    { id; title; narration; focus: Id[]; ops: <kind>Op[]; pauseFor: Id | null }
```

- **Visual blocks:** they have an initial state and `steps`; each step's `ops` change that state and the player replays them.
- **Simulated blocks:** these carry a non-null `simulate` and empty `steps`.
- **Ops:** each kind has one flat op shape with nullable fields, for example `ArrayOp { op; i; j; value; name }`. That is easy for a model and small as a schema.
- **Reference:** the full schema is in [`lesson.schema.json`](../../libs/products/studylm/lessons/src/generated/lesson.schema.json).

## The catalog (v1: 28 kinds)

| Family                         | Kinds                                                                                                | Who makes the frames                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Text                           | `prose` (safe Markdown subset), `callout`, `compare`                                                 | AI                                                                                          |
| Code                           | `code-walkthrough`, `code-trace`                                                                     | JavaScript is executed; other languages are AI-written and labelled                         |
| Data structures and algorithms | `array`, `stack-queue`, `hash-table`, `tree`, `graph`, `grid`, `recursion-tree`                      | Simulators from `simulate`, or AI ops checked one by one                                    |
| Systems                        | `flow`, `sequence`, `state-machine`, `pipeline`, `event-loop`, `git-graph`                           | AI declares the parts and steps; the app lays them out; `event-loop` is simulated from code |
| Concepts                       | `concept-map`, `chart`                                                                               | AI; growth curves are computed                                                              |
| Checks                         | `predict`, `quiz`, `self-explain`, `order-steps`, `categorize`, `parsons`, `predict-output`, `cloze` | AI writes them; answers are checked against ids                                             |

Each kind's purpose, when to use and avoid it, and its rules are in the generated [catalog](../../libs/products/studylm/lessons/src/generated/catalog.md). Planned for v2: `code-diff`, `linked-list`, `bits`, `layers` (OSI), `timeline-lanes` (threads and races), `sql-table`, `hierarchy`, `hotspot`, `match`.

## Findings that shape the screens

- **Nothing to reuse for playback or layout.** There is no step player, graph layout, Markdown, Shiki or Mermaid pipeline yet.
  - `ah-flow-chart` lays nodes out in a line, in list order, and has no outputs.
  - `ah-code-block` uses a hand-written tokenizer with no active-line highlight.
  - The closest step controls are the NgRx lab's time-travel panel, and its flow diagram runs on `setTimeout` chains that can't be paused.
- **Private building blocks.** LuxPath's `lpSvgDrag` handles and the NgRx lab pieces are private to their scopes. Reuse means moving them to `@ah/ui` (shared through the shell, so the shell redeploys) or to a non-shared lib like `@ah/platform/maps`.
- **Contrast.** `--color-data-1..7` only pass contrast on the dark `--color-stage-*` panels, so visuals render on stage panels or use semantic tokens.
- **Reduced motion.** The global CSS switch doesn't cover rAF loops, Web Animations or timers, so the player needs its own reactive `prefers-reduced-motion` signal.
- **Workers.** The policy is `worker-src 'self' blob:`, so the JavaScript tracer starts from a blob trampoline (as in ADR-0014).
- **Highlighting and maths.** Shiki works only with its JavaScript regex engine, since WebAssembly is blocked. KaTeX fonts from a remote are blocked, so maths uses MathML output. Mermaid would need a lazy import and the federation `skip` list.
- **Storybook** only collects stories from `@ah/ui` and `three/angular`, so a product visuals lib needs the pattern widened.

## StudyLM problems to fix first

All fixed in the Learn phase (ADR-0022).

**Data:**

- Generated content is written into whichever subject is open when the reply arrives.
- A failed parse deletes a section's cards but marks the section "ready".
- Regenerating a roadmap resets approvals.

**Honesty:**

- Network failures silently serve canned "AI" content: one JavaScript-flavoured roadmap whatever the subject, and every quiz answer is option A.
- The screens claim Leitner spaced repetition that doesn't exist.
- The n8n pill says "Online" before the first ping finishes.

**Robustness:**

- `strictTemplates` is off. There's no request timeout or retry.
- Settings, the active subject and the active tab are lost on reload.
- JSON import isn't validated.
- Flashcard shortcuts fire behind open modals.

**Structure:**

- One route with tabs held in store state, so a single 85 KB chunk and no URL per screen.
- Four unit tests and no e2e.

## Roadmap

1. **Contracts** (done): the lesson format, validators, prompt kit, workflow action and golden lessons.
2. **Learn** (done, ADR-0022):
   - The repairs above.
   - Routed lazy screens, like Basecamp's.
   - The step player, layered layout and renderers: prose, callout, compare, code walkthrough, array with simulators, stack and queue, flow, sequence, and all eight check kinds.
   - Built-in lessons that work offline in place of the canned fallbacks.
   - e2e tests. Storybook stories wait for screenshot baselines, which need Docker.
3. **Focus and Today:** timer modes, picture-in-picture, wake lock, chime and notifications, and stats. Streaks and XP now come from the [Learning Engine](../learning-engine/technical-design.md) (ADR-0024).
4. **Practice and review:** Parsons, predict-output and interleaving. Spaced review (FSRS) and cards from lessons moved to the [Learning Engine](../learning-engine/technical-design.md): a lesson's "Add to my daily reviews" and each flashcard's "Learn this" send them there (ADR-0024).
5. **Plan:** the bootcamp planner.
6. **Engines** (done, ADR-0023): the JavaScript tracer (Sval on the main thread, with a step budget), event-loop simulation, and the tree, graph, grid and recursion simulators. Every block kind renders.
7. **Live generation** (done, ADR-0023): `generate_lesson_part` from the app, with the repair loop and self-explanation feedback.
