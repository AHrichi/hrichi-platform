import * as v from 'valibot';
import {
  Code,
  CodeLanguageSchema,
  Id,
  LIMITS,
  list,
  Ref,
  text,
} from '../primitives';

/**
 * Checks make lessons retrieval practice, not reading. Predicting before
 * seeing helps most when the learner generates the answer (pretesting
 * meta-analyses, 2024); explaining in one's own words helps
 * (self-explanation, g≈0.55, Bisra et al., 2018).
 */

const Question = text(LIMITS.questionChars, 'The question.');
const Explanation = text(
  LIMITS.textChars,
  'Why the answer is right, shown after answering.',
);
const Option = text(LIMITS.optionChars, 'An answer option.');

export const PredictBlock = v.strictObject({
  id: Id,
  kind: v.literal('predict'),
  question: Question,
  options: v.nullable(
    list(Option, 2, 5, 'Options to choose from; null for a free answer.'),
  ),
  answer: v.nullable(
    v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0),
      v.description(
        'The index of the right option, from 0; null for a free answer.',
      ),
    ),
  ),
  expected: v.nullable(
    text(
      LIMITS.optionChars,
      'The expected free answer; null when options are given.',
    ),
  ),
  reveal: v.nullable(
    v.strictObject({
      block: v.pipe(
        Ref,
        v.description('The visual in this lesson that shows the answer.'),
      ),
      step: v.nullable(
        v.pipe(
          Ref,
          v.description('The step of that visual that shows it, or null.'),
        ),
      ),
    }),
  ),
  explanation: Explanation,
});

export const QuizBlock = v.strictObject({
  id: Id,
  kind: v.literal('quiz'),
  question: Question,
  code: v.nullable(
    v.strictObject({ language: CodeLanguageSchema, code: Code }),
  ),
  options: list(Option, 2, LIMITS.options, 'The options.'),
  correct: list(
    v.pipe(v.number(), v.integer(), v.minValue(0)),
    1,
    LIMITS.options - 1,
    'The indexes of every right option, from 0.',
  ),
  explanation: Explanation,
});

export const SelfExplainBlock = v.strictObject({
  id: Id,
  kind: v.literal('self-explain'),
  prompt: text(
    LIMITS.questionChars,
    'An open question asking the learner to explain why or how, in their own words.',
  ),
  rubric: list(
    text(LIMITS.optionChars, 'A point a good answer makes.'),
    2,
    LIMITS.rubric,
    'What a good answer covers.',
  ),
  modelAnswer: text(600, 'A model answer, shown after the learner answers.'),
});

export const OrderStepsBlock = v.strictObject({
  id: Id,
  kind: v.literal('order-steps'),
  prompt: Question,
  items: list(
    v.strictObject({ id: Id, text: Option }),
    3,
    LIMITS.orderItems,
    'The items in the right order; the app shuffles them.',
  ),
  explanation: Explanation,
});

export const CategorizeBlock = v.strictObject({
  id: Id,
  kind: v.literal('categorize'),
  prompt: Question,
  categories: list(
    v.strictObject({ id: Id, label: text(32, 'The category.') }),
    2,
    LIMITS.categorizeGroups,
    'The categories.',
  ),
  items: list(
    v.strictObject({
      id: Id,
      text: text(120, 'The item to sort.'),
      category: v.pipe(Ref, v.description('The id of its category.')),
    }),
    4,
    LIMITS.categorizeItems,
    'The items, each with its category; every category is used.',
  ),
  explanation: Explanation,
});

export const ParsonsBlock = v.strictObject({
  id: Id,
  kind: v.literal('parsons'),
  prompt: Question,
  language: CodeLanguageSchema,
  lines: list(
    v.strictObject({
      id: Id,
      code: text(
        LIMITS.codeLineChars,
        'One line of the solution without its indent. Write ___ where the learner fills in a blank.',
      ),
      indent: v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(4),
        v.description('The indent level, 0 to 4.'),
      ),
    }),
    3,
    LIMITS.parsonsLines,
    "The solution's lines in the right order; the app shuffles them.",
  ),
  distractors: v.pipe(
    v.array(text(LIMITS.codeLineChars, 'A plausible wrong line.')),
    v.maxLength(LIMITS.distractors),
    v.description(`Wrong lines mixed in, at most ${LIMITS.distractors}.`),
  ),
  blanks: v.pipe(
    v.array(
      v.strictObject({
        line: v.pipe(Ref, v.description('The id of a line containing ___.')),
        answer: text(48, 'What fills the blank.'),
      }),
    ),
    v.maxLength(LIMITS.blanks),
    v.description(
      'One entry per ___, in reading order (faded Parsons problems).',
    ),
  ),
  explanation: Explanation,
});

export const PredictOutputBlock = v.strictObject({
  id: Id,
  kind: v.literal('predict-output'),
  language: CodeLanguageSchema,
  code: Code,
  mode: v.pipe(
    v.picklist(['execute', 'given']),
    v.description(
      'execute: JavaScript only; the app runs the code to confirm the output. given: the output is as you write it.',
    ),
  ),
  expected: text(
    LIMITS.textChars,
    'Exactly what the code prints, lines joined with \\n.',
  ),
  explanation: Explanation,
});

export const ClozeBlock = v.strictObject({
  id: Id,
  kind: v.literal('cloze'),
  text: text(
    600,
    'A sentence or short paragraph with blanks written as {{blank-id}}, each id declared in blanks.',
  ),
  blanks: list(
    v.strictObject({
      id: Id,
      answers: list(
        text(48, 'An accepted answer.'),
        1,
        4,
        'Accepted answers, compared without case.',
      ),
    }),
    1,
    LIMITS.blanks,
    'The blanks.',
  ),
  explanation: v.nullable(Explanation),
});
