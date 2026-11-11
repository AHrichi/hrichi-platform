import type {
  ExplainedConcept,
  ExplainInput,
  ExtractedConcepts,
} from './tasks';

/**
 * Semantic checks after the schema checks (design §6.2). Each issue names a
 * path and says what to change, which feeds the one repair call. Counting,
 * lengths and string matching stay here, in code: models can't count, and
 * neither can Jev.
 */
export interface AiIssue {
  path: string;
  code: string;
  message: string;
}

export const AI_LIMITS = {
  essenceWords: 20,
  simpleWords: 80,
  clozeAnswerWords: 6,
  keyPointWords: 25,
} as const;

/** Three or more underscores mark a cloze blank. */
const BLANKS = /_{3,}/g;
const HAS_BLANK = /_{3,}/;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function checkExtracted(data: ExtractedConcepts): AiIssue[] {
  const issues: AiIssue[] = [];
  const titles = new Set<string>();
  data.concepts.forEach((concept, i) => {
    const key = normalise(concept.title);
    if (titles.has(key)) {
      issues.push({
        path: `/concepts/${i}/title`,
        code: 'duplicate_concept',
        message: `"${concept.title}" appears twice; merge them or drop one.`,
      });
    }
    titles.add(key);
    if (wordCount(concept.title) > 8) {
      issues.push({
        path: `/concepts/${i}/title`,
        code: 'title_too_long',
        message: 'Name the idea in at most 6 words.',
      });
    }
  });
  return issues;
}

export function checkExplained(
  data: ExplainedConcept,
  input: Pick<ExplainInput, 'span' | 'capture'>,
): AiIssue[] {
  const issues: AiIssue[] = [];
  const add = (path: string, code: string, message: string) =>
    issues.push({ path, code, message });

  if (wordCount(data.essence) > AI_LIMITS.essenceWords) {
    add(
      '/essence',
      'essence_too_long',
      `The essence has ${wordCount(data.essence)} words; use at most ${AI_LIMITS.essenceWords}.`,
    );
  }
  if (wordCount(data.simple) > AI_LIMITS.simpleWords) {
    add(
      '/simple',
      'simple_too_long',
      `The simple explanation has ${wordCount(data.simple)} words; use at most ${AI_LIMITS.simpleWords}.`,
    );
  }

  const counts = new Map<string, number>();
  for (const prompt of data.prompts) {
    counts.set(prompt.type, (counts.get(prompt.type) ?? 0) + 1);
  }
  if (!counts.get('free_recall')) {
    add('/prompts', 'no_free_recall', 'Include one free_recall prompt.');
  }
  for (const type of ['cloze', 'quick_fire', 'spot_error'] as const) {
    if ((counts.get(type) ?? 0) > 1) {
      add('/prompts', `too_many_${type}`, `Use at most one ${type} prompt.`);
    }
  }

  const source = normalise(
    [data.essence, data.simple, input.span, input.capture].join(' '),
  );
  data.prompts.forEach((prompt, i) => {
    const path = `/prompts/${i}`;
    const answer = normalise(prompt.answer);
    const question = normalise(prompt.question);

    if (prompt.type === 'cloze') {
      const blanks = prompt.question.match(BLANKS)?.length ?? 0;
      if (blanks !== 1) {
        add(
          `${path}/question`,
          'cloze_blanks',
          'A cloze has exactly one blank, written ____.',
        );
      }
      if (wordCount(prompt.answer) > AI_LIMITS.clozeAnswerWords) {
        add(
          `${path}/answer`,
          'cloze_answer_long',
          'A cloze answer is the missing term, at most 6 words.',
        );
      }
      if (answer && !source.includes(answer)) {
        add(
          `${path}/answer`,
          'cloze_answer_unsupported',
          'The cloze answer must appear in the explanation or the capture.',
        );
      }
    } else if (HAS_BLANK.test(prompt.question)) {
      add(
        `${path}/question`,
        'stray_blank',
        'Only a cloze prompt has a blank.',
      );
    }

    if (prompt.type === 'quick_fire') {
      const options = prompt.options ?? [];
      const unique = new Set(options.map(normalise));
      if (
        options.length < 2 ||
        options.length > 4 ||
        unique.size !== options.length
      ) {
        add(
          `${path}/options`,
          'options_count',
          'quick_fire needs 2–4 different options.',
        );
      }
      if (!options.some((option) => normalise(option) === answer)) {
        add(
          `${path}/answer`,
          'answer_not_option',
          'The answer must be one of the options, word for word.',
        );
      }
    } else if (prompt.options !== null) {
      add(
        `${path}/options`,
        'options_not_allowed',
        'Only quick_fire has options; set options to null.',
      );
    }

    const needsPoints = ['free_recall', 'why', 'apply', 'spot_error'].includes(
      prompt.type,
    );
    if (needsPoints && prompt.keyPoints.length === 0) {
      add(
        `${path}/keyPoints`,
        'no_key_points',
        'List 1–4 short points a good answer states.',
      );
    }
    prompt.keyPoints.forEach((point, j) => {
      if (wordCount(point) > AI_LIMITS.keyPointWords) {
        add(
          `${path}/keyPoints/${j}`,
          'key_point_long',
          'Keep each key point short.',
        );
      }
    });

    if (
      prompt.type !== 'cloze' &&
      answer.length >= 6 &&
      question.includes(answer)
    ) {
      add(
        `${path}/question`,
        'answer_in_question',
        'The question gives its own answer away.',
      );
    }
    if (prompt.type === 'spot_error' && question === answer) {
      add(
        `${path}/answer`,
        'spot_error_same',
        'The correction must differ from the faulty statement.',
      );
    }
  });
  return issues;
}
