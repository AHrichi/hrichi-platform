import * as v from 'valibot';
import {
  type Block,
  BLOCK_SCHEMAS,
  type BlockKind,
  BlockSchema,
  CHECK_KINDS,
  STEPPED_KINDS,
} from '../spec/blocks';
import {
  type Lesson,
  type LessonOutline,
  LessonOutlineSchema,
  LessonSchema,
  type SelfExplainFeedback,
  SelfExplainFeedbackSchema,
} from '../spec/lesson';
import {
  fromValibot,
  IssueList,
  pointer,
  type ValidationResult,
} from './issues';
import { checkBlock, stepIdsOf } from './semantic';

function parse<T>(
  schema: v.GenericSchema<unknown, T>,
  data: unknown,
  semantic: (value: T, out: IssueList) => void,
): ValidationResult<T> {
  const parsed = v.safeParse(schema, data);
  if (!parsed.success) return { ok: false, issues: fromValibot(parsed.issues) };
  const out = new IssueList();
  semantic(parsed.output, out);
  return out.errors.length
    ? { ok: false, issues: out.all }
    : { ok: true, value: parsed.output, warnings: out.warnings };
}

/**
 * One block, as the `lesson-block` and `block-repair` calls return it.
 * With `kind`, the block is checked against that kind's schema alone,
 * which gives the clearest messages.
 */
export function validateBlock(
  data: unknown,
  kind?: BlockKind,
): ValidationResult<Block> {
  if (kind) {
    const actual = (data as { kind?: unknown } | null)?.kind;
    if (actual !== kind) {
      return {
        ok: false,
        issues: [
          {
            path: '/kind',
            code: 'unknown-kind',
            message: `This block must be a "${kind}" block; got ${JSON.stringify(actual)}.`,
            severity: 'error',
          },
        ],
      };
    }
  }
  const schema = (kind ? BLOCK_SCHEMAS[kind] : BlockSchema) as v.GenericSchema<
    unknown,
    Block
  >;
  return parse(schema, data, (block, out) => checkBlock(block, '', out));
}

/** The whole lesson: every block, then the references between blocks. */
export function validateLesson(data: unknown): ValidationResult<Lesson> {
  return parse(LessonSchema, data, (lesson, out) => {
    const blocks = new Map<string, Block>();
    const seen = new Set<string>();
    const unique = (id: string, path: string) => {
      if (seen.has(id)) {
        out.error(
          path,
          'duplicate-id',
          `The id "${id}" is used twice in this lesson.`,
        );
      }
      seen.add(id);
    };
    lesson.sections.forEach((section, s) => {
      unique(section.id, pointer('', 'sections', s, 'id'));
      section.blocks.forEach((block, b) => {
        const at = pointer('', 'sections', s, 'blocks', b);
        unique(block.id, pointer(at, 'id'));
        blocks.set(block.id, block);
        checkBlock(block, at, out);
      });
    });
    lesson.sections.forEach((section, s) => {
      const checks = new Set(
        section.blocks
          .filter((block) => CHECK_KINDS.includes(block.kind))
          .map((block) => block.id),
      );
      section.blocks.forEach((block, b) => {
        const at = pointer('', 'sections', s, 'blocks', b);
        if ('steps' in block) {
          (block.steps as readonly { pauseFor: string | null }[]).forEach(
            (step, i) => {
              if (step.pauseFor !== null && !checks.has(step.pauseFor)) {
                out.error(
                  pointer(at, 'steps', i, 'pauseFor'),
                  'unknown-ref',
                  `"${step.pauseFor}" isn't a check block in this section.`,
                );
              }
            },
          );
        }
        if (block.kind === 'predict' && block.reveal) {
          const target = blocks.get(block.reveal.block);
          const path = pointer(at, 'reveal');
          if (!target || !STEPPED_KINDS.includes(target.kind)) {
            out.error(
              pointer(path, 'block'),
              'unknown-ref',
              `"${block.reveal.block}" isn't a visual in this lesson.`,
            );
          } else if (
            block.reveal.step !== null &&
            !stepIdsOf(target).has(block.reveal.step)
          ) {
            out.error(
              pointer(path, 'step'),
              'unknown-ref',
              `"${target.id}" has no step "${block.reveal.step}"; use null when its steps are simulated.`,
            );
          }
        }
      });
      if (
        (section.intent === 'practice' || section.intent === 'recap') &&
        checks.size === 0
      ) {
        out.warn(
          pointer('', 'sections', s),
          'pedagogy',
          `A ${section.intent} section should ask the learner something: add a check.`,
        );
      }
    });
    pedagogy(lesson.sections, lesson.cards.length, out);
  });
}

function pedagogy(
  sections: readonly { blocks: readonly { kind: BlockKind }[] }[],
  cards: number,
  out: IssueList,
): void {
  const kinds = sections.flatMap((section) =>
    section.blocks.map((block) => block.kind),
  );
  if (!kinds.some((kind) => CHECK_KINDS.includes(kind))) {
    out.warn(
      '/sections',
      'pedagogy',
      'No checks: retrieval is what makes a lesson stick. Add at least one.',
    );
  }
  let run = 0;
  kinds.forEach((kind) => {
    run = CHECK_KINDS.includes(kind) ? 0 : run + 1;
    if (run === 4) {
      out.warn(
        '/sections',
        'pedagogy',
        'Four blocks in a row without a check: break them up with a question.',
      );
    }
  });
  if (cards === 0) {
    out.warn(
      '/cards',
      'pedagogy',
      'No cards: add the facts worth reviewing in the coming weeks.',
    );
  }
}

/** The outline from the `lesson-outline` call. */
export function validateOutline(
  data: unknown,
): ValidationResult<LessonOutline> {
  return parse(LessonOutlineSchema, data, (outline, out) => {
    const seen = new Set<string>();
    outline.sections.forEach((section, s) => {
      const ids = [
        [section.id, pointer('', 'sections', s, 'id')],
        ...section.blocks.map((block, b) => [
          block.id,
          pointer('', 'sections', s, 'blocks', b, 'id'),
        ]),
      ];
      ids.forEach(([id, path]) => {
        if (seen.has(id))
          out.error(
            path,
            'duplicate-id',
            `The id "${id}" is used twice in this outline.`,
          );
        seen.add(id);
      });
    });
    pedagogy(outline.sections, outline.cards.length, out);
  });
}

export function validateFeedback(
  data: unknown,
): ValidationResult<SelfExplainFeedback> {
  return parse(SelfExplainFeedbackSchema, data, () => undefined);
}
