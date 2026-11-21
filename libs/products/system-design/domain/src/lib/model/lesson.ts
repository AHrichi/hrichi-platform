import type { Check } from './checks';
import type { HudMetric, SceneOp, SceneSpec } from './scene';

export type StepKind = 'problem' | 'technique' | 'case' | 'watch-out' | 'recap';

export interface Callout {
  kind: 'key-idea' | 'good-to-know' | 'watch-out' | 'coming-up';
  text: string;
}

export interface Change {
  type: 'added' | 'changed' | 'removed';
  text: string;
}

export interface ReviewCard {
  front: string;
  back: string;
}

export interface LessonStep {
  /** kebab-case, unique in the lesson. */
  id: string;
  /** ≤ 14 chars: the timeline label and "Next: <label>". */
  label: string;
  kind: StepKind;
  /** ≤ 48 chars. */
  title: string;
  /** 1–3 paragraphs, ≤ 80 words in all, with inline marks. */
  body: readonly string[];
  /** ≤ 2. */
  callouts?: readonly Callout[];
  /** The "What changed" list, ≤ 4. */
  changes?: readonly Change[];
  /** ≤ 12. */
  ops: readonly SceneOp[];
  /** Indices into `lesson.learn` this step ticks. */
  learns?: readonly number[];
  /** Recap only, 3–5. */
  takeaways?: readonly string[];
}

export interface Lesson {
  /** Must equal its meta's id. */
  id: string;
  /** 3–6 "You'll learn" items, ≤ 60 chars each. */
  learn: readonly string[];
  /** The scene before step 1. */
  scene: SceneSpec;
  /** 0–5 chips. */
  hud: readonly HudMetric[];
  /** 6–12; the first is a `problem`, the last (and only the last) a `recap`. */
  steps: readonly LessonStep[];
  /** 3–8 practice questions. */
  checks: readonly Check[];
  /** 3–6 cards for the Learning Engine. */
  cards: readonly ReviewCard[];
}
