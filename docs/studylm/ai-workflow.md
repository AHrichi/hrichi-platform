# StudyLM lesson generation: the n8n contract

StudyLM calls this action when a learner presses **Write a Lesson** on a roadmap section, and for feedback on self-explanations (ADR-0023). If the workflow in n8n predates the action, StudyLM asks you to re-import it.

StudyLM's AI runs in the n8n workflow defined by `tools/scripts/update-studylm-workflow.mjs`, which writes `tools/scripts/studylm_workflow.json`. The `study-synthesizer` webhook keeps its existing actions (`ping`, `generate_roadmap`, `generate_section_flashcards`, `generate_section_quiz`, `elaborate_concept`, `synthesize_sources`). Lessons use one more: `generate_lesson_part`.

## Request

```json
{
  "action": "generate_lesson_part",
  "task": "lesson-outline | lesson-block | block-repair | self-explain-feedback",
  "specVersion": 1,
  "input": { "...": "the task's input" }
}
```

The app builds it with `buildGenerateRequest(task, input)` from `@ah/products/studylm/lessons`, which checks the input against `TASK_INPUT_SCHEMAS`:

| Task                    | Input                                                                                                            | Reply (`data`)         | Check it with               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------- |
| `lesson-outline`        | subject, section title and summary, subtopics, tier, minutes                                                     | `LessonOutline`        | `validateOutline`           |
| `lesson-block`          | lesson and section titles, intent, tier, kind, block id, brief, ids of the section's checks, neighbouring briefs | one block of that kind | `validateBlock(data, kind)` |
| `block-repair`          | kind, the block, the issues (`path`, `message`)                                                                  | the corrected block    | `validateBlock(data, kind)` |
| `self-explain-feedback` | prompt, rubric, model answer, the learner's answer                                                               | `SelfExplainFeedback`  | `validateFeedback`          |

The request carries no prompts and no schemas. The workflow embeds the generated kit (`libs/products/studylm/lessons/src/generated/lesson-kit.json`): a system prompt per task, and per block kind its card, its strict JSON Schema and a real example from the golden lessons. So the open webhook can't be used as a free model proxy, and the app and the workflow can't drift apart.

The workflow puts the input in the user message as data, fenced in `<data>` tags; a `</data>` inside the input is escaped. Inputs over 16,000 characters are refused.

## Reply

```json
{
  "success": true,
  "code": "OK",
  "provider": "Groq LPU (openai/gpt-oss-120b)",
  "specVersion": 1,
  "data": { "...": "the model's JSON" },
  "message": null
}
```

| `code`                  | Meaning                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OK`                    | `data` fits the task's schema. The app still runs the matching validator for the semantic checks.                 |
| `SPEC_MISMATCH`         | The app and the workflow serve different spec versions: re-import the workflow.                                   |
| `BAD_INPUT`             | An unknown task or kind, or input that is missing or too large.                                                   |
| `AI_FAILOVER_EXHAUSTED` | All five models failed, or replied with JSON that doesn't fit the schema. The app waits 20 s and tries once more. |

## Models and failover

Groq's free tier gives each model its own budget of 8K tokens a minute, and a lesson outline alone asks for about 5K. So every request climbs a ladder of five models until one answers with JSON that fits:

| Attempt | Model                                                       | How it gets the schema                                        |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 1–2     | Groq `openai/gpt-oss-120b`, `openai/gpt-oss-20b`            | Strict structured output (`json_schema`), except for outlines |
| 3       | Groq `qwen/qwen3.8-27b`                                     | In the prompt, with `json_object` mode                        |
| 4       | Google `gemini-flash-latest` (the Google Gemini credential) | In the prompt, with a JSON response type                      |
| 5       | Google `gemini-3.5-flash-lite`                              | In the prompt, with a JSON response type                      |

- **Order.** Groq attempts go 120b, 20b, Qwen. Blocks are written two at a time, one per lane, and lane 1 starts on 20b, so two blocks in flight draw on two budgets. Gemini, on Google's quota, comes last: Flash, then Flash-Lite for when Flash is in high demand. Each Gemini call is retried once after 3 s.
- **Budget.** gpt-oss runs with `reasoning_effort: "low"`, and every call caps its tokens (outline 4,500, block and repair 3,000, feedback 1,500, older actions 6,000), so a call fits the per-minute budget.
- **Checks.** After each attempt, **Check Attempt n** parses the reply and tests it against the task's schema. It first drops keys the schema doesn't have and nulls missing fields that may be null. When Groq refuses a reply for not fitting the schema, the check salvages what it generated from the error. Qwen loops under strict mode, and gpt-oss drops fields from whole outlines under it, so those get the schema in the prompt.
- **Exhausted.** If all five fail, the reply is `AI_FAILOVER_EXHAUSTED`. The app never receives canned content dressed up as AI output.

The older actions (roadmaps, flashcards, quizzes, hints) climb the same ladder without a schema: any reply that parses as JSON is used.

## Changing the format

1. Change the schemas in `libs/products/studylm/lessons`, and bump `SPEC_VERSION` if a generated lesson or the workflow could notice.
2. Rewrite the generated files: `pnpm nx test product-studylm-lessons -u`.
3. Regenerate the workflow: `node tools/scripts/update-studylm-workflow.mjs`.
4. Re-import `tools/scripts/studylm_workflow.json` into n8n, replacing the existing workflow. It keeps the same id and the Groq and Google Gemini credential references.

`workflow.spec.ts` fails if the committed workflow embeds an older kit than the code generates. It also runs the workflow's Code nodes along its connections against a fake model. It covers:

- a good reply, and lane 1 starting on another model;
- failover after an unparsable reply, a reply that breaks the schema, or an HTTP error;
- salvaging a reply Groq refused for one stray key;
- the whole ladder down to Gemini, then Flash-Lite, and every model failing;
- outlines going to gpt-oss with the schema in the prompt;
- version and input refusals;
- `ping` and `generate_roadmap` unchanged.

Testing in a real n8n instance needs a separate throwaway container (for example on port 5679), never the n8n instance you run day to day.
