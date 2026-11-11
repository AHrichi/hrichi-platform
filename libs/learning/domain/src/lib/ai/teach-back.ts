import { type Clarity, type Concept, LIMITS } from '../records';
import type { Answer, Question } from './decisions';
import { NOT_STATED, STATED } from './grading';

/**
 * Teach-back (design §3, §6.3): the learner explains a concept in their
 * own words, out loud or typed, as if to someone new to it. A decision
 * model answers one yes/no question per key point and scores clarity in
 * three coarse bands; the feedback quotes the concept's own key points,
 * so nothing is generated.
 */

/** About a minute is enough to explain one idea; recording stops here. */
export const TEACH_BACK_SECONDS = 90;
/** Shorter than this, there is nothing to judge. */
export const TEACH_BACK_MIN_CHARS = 20;
/** Confidence needed before a clarity band is shown. */
export const CLARITY_CONFIDENT = 0.5;

/** Lowest first, as the score question's levels. */
const CLARITY_LEVELS: readonly Clarity[] = ['unclear', 'partly', 'clear'];

export const CLARITY_LABELS: Record<Clarity, string> = {
  unclear: 'A bit muddled',
  partly: 'Getting there',
  clear: 'Crystal clear',
};

/**
 * What a good explanation covers: the key points of the concept's live
 * prompts, without repeats, or its one-line essence when it has none.
 */
export function teachPoints(concept: Concept): string[] {
  const seen = new Set<string>();
  const points: string[] = [];
  for (const prompt of concept.prompts) {
    if (prompt.retired) continue;
    for (const point of prompt.keyPoints) {
      const key = point.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      points.push(point.trim());
    }
  }
  if (!points.length) points.push(concept.explanation.essence);
  return points.slice(0, LIMITS.teachPoints);
}

/** Only the concept's name and what the learner said: no other context. */
export function teachBackState(title: string, transcript: string) {
  return { concept: title, learnerExplanation: transcript };
}

export function teachBackQuestions(
  title: string,
  points: readonly string[],
): Record<string, Question> {
  const questions: Record<string, Question> = {};
  points.forEach((point, i) => {
    questions[`point${i}`] = {
      type: 'noul',
      instructions: `Does the learner's explanation convey, in any words, that: ${point}?`,
    };
  });
  questions['clarity'] = {
    type: 'score',
    instructions: `How clearly does the learner explain "${title}" in plain words, as if teaching someone new to it?`,
    criteria: [
      'muddled, mostly wrong or off the point',
      'the right idea, but vague, jargon-heavy or with gaps',
      'clear and simple enough for a newcomer to follow',
    ],
  };
  return questions;
}

export interface TeachBackFeedback {
  clarity: Clarity | null;
  /** Key points the explanation stated, as written in the concept. */
  covered: string[];
  /** Key points it left out. Points the model was unsure about are in neither. */
  gaps: string[];
  /** The rating to suggest for the swipe; the swipe always decides. */
  suggested: 'again' | 'hard' | 'good' | null;
}

export function readTeachBack(
  answers: Record<string, Answer>,
  points: readonly string[],
): TeachBackFeedback {
  const covered: string[] = [];
  const gaps: string[] = [];
  points.forEach((point, i) => {
    const answer = answers[`point${i}`];
    const p = answer?.type === 'noul' ? answer.p : 0.5;
    if (p >= STATED) covered.push(point);
    else if (p < NOT_STATED) gaps.push(point);
  });
  const score = answers['clarity'];
  const clarity =
    score?.type === 'score' && score.confidence >= CLARITY_CONFIDENT
      ? (CLARITY_LEVELS[score.score] ?? null)
      : null;
  let suggested: TeachBackFeedback['suggested'] = null;
  if (covered.length === points.length && clarity !== 'unclear') {
    suggested = 'good';
  } else if (gaps.length === points.length) {
    suggested = 'again';
  } else if (covered.length) {
    suggested = 'hard';
  }
  return { clarity, covered, gaps, suggested };
}
