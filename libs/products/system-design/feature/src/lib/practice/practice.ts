import type { HostCaptureItem } from '@ah/learning/client';
import type {
  AttemptRow,
  AttemptRun,
} from '@ah/products/system-design/data-access';
import type {
  Check,
  CheckResponse,
  Lesson,
  LessonMeta,
} from '@ah/products/system-design/domain';

/** One question in a practice run, with what its screens need to show. */
export interface PracticeQuestion {
  lessonId: string;
  lessonTitle: string;
  check: Check;
  /** 1-based step for "See it in the lesson"; null when the check names none. */
  stepNumber: number | null;
}

/** One answered question in a run. */
export interface PracticeResult {
  question: PracticeQuestion;
  response: CheckResponse;
  correct: boolean;
  /** The right answer, as `markCheck` words it. */
  expected: string;
}

export interface LessonScore {
  correct: number;
  total: number;
}

/** A lesson's checks as practice questions, in authored order. */
export function lessonQuestions(
  meta: Pick<LessonMeta, 'id' | 'title'>,
  lesson: Pick<Lesson, 'steps' | 'checks'>,
): PracticeQuestion[] {
  return lesson.checks.map((check) => {
    const index = check.step
      ? lesson.steps.findIndex((s) => s.id === check.step)
      : -1;
    return {
      lessonId: meta.id,
      lessonTitle: meta.title,
      check,
      stepNumber: index >= 0 ? index + 1 : null,
    };
  });
}

/** A new run id; unique enough for one device's history. */
export function newRunId(now = Date.now(), rnd = Math.random()): string {
  return `${now.toString(36)}-${Math.floor(rnd * 0xffffff).toString(36)}`;
}

/**
 * Each lesson's best lesson-practice run: the most answers right out of the
 * run's size. Answers outside a lesson run (mixed practice, older rows) don't
 * count, since their question set differs.
 */
export function bestLessonScores(
  attempts: readonly AttemptRow[],
): Readonly<Record<string, LessonScore>> {
  const runs = new Map<
    string,
    { lessonId: string; run: AttemptRun; correct: number }
  >();
  for (const a of attempts) {
    if (a.run?.kind !== 'lesson') continue;
    const key = `${a.lessonId}|${a.run.id}`;
    const entry = runs.get(key) ?? {
      lessonId: a.lessonId,
      run: a.run,
      correct: 0,
    };
    if (a.correct) entry.correct += 1;
    runs.set(key, entry);
  }
  const best: Record<string, LessonScore> = {};
  for (const { lessonId, run, correct } of runs.values()) {
    const total = Math.max(run.size, correct, 1);
    const prev = best[lessonId];
    if (
      !prev ||
      correct / total > prev.correct / prev.total ||
      (correct / total === prev.correct / prev.total && total > prev.total)
    ) {
      best[lessonId] = { correct, total };
    }
  }
  return best;
}

/** The page address, when it is one the Learning Engine can link back to. */
export function pageLink(): string | null {
  const href = globalThis.location?.href ?? '';
  return /^https?:\/\//.test(href) ? href.slice(0, 2048) : null;
}

/**
 * Missed questions as Learning Engine captures (technical-design §7): the
 * prompt and its explanation, keyed by `lessonId:checkId`. At most 10.
 */
export function missedReviewItems(
  missed: readonly PracticeResult[],
  deepLink: string | null = pageLink(),
): HostCaptureItem[] {
  const link = deepLink && /^https?:\/\//.test(deepLink) ? deepLink : null;
  return missed.slice(0, 10).map(({ question }) => ({
    text: `${question.check.prompt}\n${question.check.explain}`,
    source: {
      app: 'system-design',
      objectType: 'check',
      objectId: `${question.lessonId}:${question.check.id}`,
      deepLink: link,
      excerpt: question.lessonTitle,
    },
  }));
}
