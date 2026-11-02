import * as v from 'valibot';
import { BLOCK_KINDS } from '../spec/blocks';
import { SECTION_INTENTS } from '../spec/lesson';
import {
  Id,
  int,
  LIMITS,
  list,
  SPEC_VERSION,
  text,
  TierSchema,
} from '../spec/primitives';
import { fromValibot, type ValidationResult } from '../validate/issues';

/**
 * What the app sends to the n8n webhook. The workflow takes only a task,
 * the spec version and this input; prompts and schemas are compiled into
 * the workflow, so the open webhook can't be used as a free model proxy.
 */
export const GENERATE_ACTION = 'generate_lesson_part';
export const GENERATE_TASKS = [
  'lesson-outline',
  'lesson-block',
  'block-repair',
  'self-explain-feedback',
] as const;
export type GenerateTask = (typeof GENERATE_TASKS)[number];

export const TASK_INPUT_SCHEMAS = {
  'lesson-outline': v.strictObject({
    subject: text(120, 'The subject.'),
    sectionTitle: text(120, "The roadmap section's title."),
    sectionSummary: text(600, "The roadmap section's summary."),
    subtopics: v.pipe(v.array(text(80, 'A subtopic.')), v.maxLength(8)),
    tier: TierSchema,
    minutes: int(LIMITS.minutesMin, LIMITS.minutesMax, 'The time to aim for.'),
  }),
  'lesson-block': v.strictObject({
    lessonTitle: text(120, 'The lesson title.'),
    sectionTitle: text(120, 'The section title.'),
    intent: v.picklist(SECTION_INTENTS),
    tier: TierSchema,
    kind: v.picklist(BLOCK_KINDS),
    blockId: Id,
    brief: text(240, 'The brief from the outline.'),
    checks: v.pipe(
      v.array(Id),
      v.maxLength(LIMITS.blocksPerSection),
      v.description('Ids of check blocks in the same section, for pauseFor.'),
    ),
    context: v.pipe(
      v.array(text(240, "Another block's brief.")),
      v.maxLength(8),
      v.description('Briefs of the blocks around this one, for continuity.'),
    ),
  }),
  'block-repair': v.strictObject({
    kind: v.picklist(BLOCK_KINDS),
    block: v.pipe(
      v.record(v.string(), v.unknown()),
      v.check(
        (block) => JSON.stringify(block).length <= 12000,
        'The block is too large to repair.',
      ),
    ),
    issues: list(
      v.strictObject({
        path: text(200, 'A JSON pointer.'),
        message: text(300, 'The problem.'),
      }),
      1,
      20,
      'The issues to fix.',
    ),
  }),
  'self-explain-feedback': v.strictObject({
    prompt: text(LIMITS.questionChars, 'The question asked.'),
    rubric: list(
      text(LIMITS.optionChars, 'A rubric point.'),
      2,
      LIMITS.rubric,
      'The rubric.',
    ),
    modelAnswer: text(600, 'The model answer.'),
    answer: text(1200, "The learner's answer."),
  }),
} as const;

export type TaskInput<T extends GenerateTask> = v.InferOutput<
  (typeof TASK_INPUT_SCHEMAS)[T]
>;

export interface GenerateRequest<T extends GenerateTask = GenerateTask> {
  action: typeof GENERATE_ACTION;
  task: T;
  specVersion: number;
  input: TaskInput<T>;
}

/** The workflow's reply; `data` still has to pass the matching validator. */
export interface GenerateResponse {
  success: boolean;
  code:
    | 'OK'
    | 'SPEC_MISMATCH'
    | 'BAD_INPUT'
    | 'AI_FAILOVER_EXHAUSTED'
    | 'INVALID_RESPONSE';
  provider: string;
  specVersion: number;
  data: unknown;
  message: string | null;
}

/** A checked request body for the webhook. */
export function buildGenerateRequest<T extends GenerateTask>(
  task: T,
  input: TaskInput<T>,
): ValidationResult<GenerateRequest<T>> {
  const parsed = v.safeParse(TASK_INPUT_SCHEMAS[task], input);
  if (!parsed.success) {
    return { ok: false, issues: fromValibot(parsed.issues, '/input') };
  }
  return {
    ok: true,
    warnings: [],
    value: {
      action: GENERATE_ACTION,
      task,
      specVersion: SPEC_VERSION,
      input: parsed.output as TaskInput<T>,
    },
  };
}
