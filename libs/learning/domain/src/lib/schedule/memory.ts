import {
  type Card,
  createEmptyCard,
  forgetting_curve,
  fsrs,
  type Grade,
  Rating,
  State,
} from 'ts-fsrs';
import type { Concept, ReviewEvent } from '../records';
import { localDateOf } from '../local-date';

/**
 * Memory per concept, replayed from its review events through FSRS
 * (design §5.1). Nothing here is stored as truth: any device rebuilds it
 * from the events, so the result is the same in any order they arrive.
 *
 * Fuzz is off, so a replay is deterministic, and minute-level learning
 * steps are off: a Daily Set works in days.
 */
export const DEFAULT_RETENTION = 0.9;

export type MemoryPhase = 'new' | 'learning' | 'review' | 'relearning';
export type MasteryTier = 'seed' | 'sprout' | 'leaf' | 'bloom' | 'golden';

export interface MemoryState {
  conceptId: string;
  phase: MemoryPhase;
  /** Days until recall drops to the desired retention. */
  stability: number;
  difficulty: number;
  /** Null until the first review. */
  dueAt: string | null;
  lastReviewAt: string | null;
  reps: number;
  lapses: number;
  /** promptId → times asked, to rotate prompt types. */
  promptUses: Record<string, number>;
  lastPromptId: string | null;
}

const RATING: Record<ReviewEvent['rating'], Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const PHASE: Record<State, MemoryPhase> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
};

const schedulers = new Map<number, ReturnType<typeof fsrs>>();
function schedulerFor(retention: number) {
  let scheduler = schedulers.get(retention);
  if (!scheduler) {
    scheduler = fsrs({
      request_retention: retention,
      enable_fuzz: false,
      enable_short_term: false,
    });
    schedulers.set(retention, scheduler);
  }
  return scheduler;
}

function byTime(a: ReviewEvent, b: ReviewEvent): number {
  return Date.parse(a.at) - Date.parse(b.at) || (a.id < b.id ? -1 : 1);
}

/** One concept's memory from its events (in any order). */
export function replayMemory(
  conceptId: string,
  events: readonly ReviewEvent[],
  retention = DEFAULT_RETENTION,
): MemoryState {
  const scheduler = schedulerFor(retention);
  const mine = events
    .filter((event) => event.conceptId === conceptId)
    .sort(byTime);
  let card: Card | null = null;
  const promptUses: Record<string, number> = {};
  for (const event of mine) {
    const at = new Date(event.at);
    card = scheduler.next(
      card ?? createEmptyCard(at),
      at,
      RATING[event.rating],
    ).card;
    promptUses[event.promptId] = (promptUses[event.promptId] ?? 0) + 1;
  }
  return {
    conceptId,
    phase: card ? PHASE[card.state] : 'new',
    stability: card?.stability ?? 0,
    difficulty: card?.difficulty ?? 0,
    dueAt: card ? card.due.toISOString() : null,
    lastReviewAt: mine.at(-1)?.at ?? null,
    reps: card?.reps ?? 0,
    lapses: card?.lapses ?? 0,
    promptUses,
    lastPromptId: mine.at(-1)?.promptId ?? null,
  };
}

/** Every concept's memory, grouping the events once. */
export function memoryOf(
  concepts: readonly Concept[],
  events: readonly ReviewEvent[],
  retention = DEFAULT_RETENTION,
): Map<string, MemoryState> {
  const grouped = new Map<string, ReviewEvent[]>();
  for (const event of events) {
    const list = grouped.get(event.conceptId) ?? [];
    list.push(event);
    grouped.set(event.conceptId, list);
  }
  return new Map(
    concepts.map((concept) => [
      concept.id,
      replayMemory(concept.id, grouped.get(concept.id) ?? [], retention),
    ]),
  );
}

/** The chance of recalling it now, 0–1 (0 before the first review). */
export function retrievability(
  state: MemoryState,
  now: Date,
  retention = DEFAULT_RETENTION,
): number {
  if (!state.lastReviewAt || state.stability <= 0) return 0;
  const days = Math.max(
    0,
    (now.getTime() - Date.parse(state.lastReviewAt)) / 86_400_000,
  );
  // FSRS-6's curve, with the scheduler's own decay parameter.
  return forgetting_curve(
    schedulerFor(retention).parameters.w,
    days,
    state.stability,
  );
}

/** Seed (never reviewed) → Sprout (< 3 d) → Leaf (< 21 d) → Bloom (< 90 d) → Golden. */
export function tierOf(state: MemoryState): MasteryTier {
  if (!state.reps) return 'seed';
  if (state.stability < 3) return 'sprout';
  if (state.stability < 21) return 'leaf';
  if (state.stability < 90) return 'bloom';
  return 'golden';
}

/** The learner's day a reviewed concept is due on (null if never reviewed). */
export function dueDateOf(state: MemoryState, timeZone: string): string | null {
  return state.dueAt ? localDateOf(new Date(state.dueAt), timeZone) : null;
}
