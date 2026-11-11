import { type JsonSchema, strictJsonSchema } from '@ah/shared/ai-schema';
import { GOLDEN_LESSONS } from '../../golden';
import { CATALOG } from '../catalog/cards';
import {
  type Block,
  BLOCK_KINDS,
  BLOCK_SCHEMAS,
  type BlockKind,
} from '../spec/blocks';
import {
  LessonOutlineSchema,
  type Lesson,
  SelfExplainFeedbackSchema,
} from '../spec/lesson';
import { LIMITS, SPEC_VERSION } from '../spec/primitives';
import { GENERATE_TASKS } from '../prompts/request';
import {
  blockSystemPrompt,
  feedbackSystemPrompt,
  kindPrompt,
  outlineSystemPrompt,
  repairSystemPrompt,
  TASK_INSTRUCTIONS,
} from '../prompts/system';

/**
 * Everything the n8n workflow needs to generate lesson parts: the system
 * prompt and schema per task, and per block kind its schema, its card and
 * a real example from the golden lessons. A Vitest file snapshot writes it
 * to `generated/lesson-kit.json`; the workflow script embeds that file.
 */
export interface LessonKit {
  specVersion: number;
  limits: typeof LIMITS;
  tasks: readonly string[];
  outline: { system: string; instruction: string; schema: JsonSchema };
  block: {
    system: string;
    instruction: string;
    kinds: Record<
      BlockKind,
      { card: string; schema: JsonSchema; example: unknown }
    >;
  };
  repair: { system: string; instruction: string };
  feedback: { system: string; instruction: string; schema: JsonSchema };
}

/** The first block of each kind in the golden lessons. */
export function goldenExamples(): Map<BlockKind, Block> {
  const examples = new Map<BlockKind, Block>();
  for (const lesson of Object.values(GOLDEN_LESSONS) as Lesson[]) {
    for (const section of lesson.sections) {
      for (const block of section.blocks) {
        if (!examples.has(block.kind)) examples.set(block.kind, block);
      }
    }
  }
  return examples;
}

export function buildLessonKit(): LessonKit {
  const examples = goldenExamples();
  const kinds = Object.fromEntries(
    BLOCK_KINDS.map((kind) => {
      const example = examples.get(kind);
      if (!example) throw new Error(`No golden example for "${kind}"`);
      return [
        kind,
        {
          card: kindPrompt(kind),
          schema: strictJsonSchema(BLOCK_SCHEMAS[kind]),
          example,
        },
      ];
    }),
  ) as LessonKit['block']['kinds'];
  return {
    specVersion: SPEC_VERSION,
    limits: LIMITS,
    tasks: GENERATE_TASKS,
    outline: {
      system: outlineSystemPrompt(),
      instruction: TASK_INSTRUCTIONS['lesson-outline'],
      schema: strictJsonSchema(LessonOutlineSchema),
    },
    block: {
      system: blockSystemPrompt(),
      instruction: TASK_INSTRUCTIONS['lesson-block'],
      kinds,
    },
    repair: {
      system: repairSystemPrompt(),
      instruction: TASK_INSTRUCTIONS['block-repair'],
    },
    feedback: {
      system: feedbackSystemPrompt(),
      instruction: TASK_INSTRUCTIONS['self-explain-feedback'],
      schema: strictJsonSchema(SelfExplainFeedbackSchema),
    },
  };
}

/** The catalog as Markdown, for the design doc. */
export function catalogMarkdown(): string {
  return BLOCK_KINDS.map((kind) => {
    const card = CATALOG[kind];
    return `### \`${kind}\`: ${card.label}\n\n${card.purpose}\n\n- **Use it for:** ${card.useWhen.join('; ')}.\n- **Avoid it for:** ${card.avoidWhen.join('; ')}.\n${card.rules.map((rule) => `- ${rule}`).join('\n')}`;
  }).join('\n\n');
}
