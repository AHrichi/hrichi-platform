import { CONTRAST_RELATIONS } from '../ai/links';
import { localDateOf } from '../local-date';
import type {
  Concept,
  ConceptLink,
  PlannedItem,
  RecallPrompt,
  ReviewEvent,
  ReviewSession,
  TeachBack,
} from '../records';
import { type MemoryState, retrievability } from './memory';

/**
 * The Daily Set (design §5.2): a short, finite list built the same way on
 * every device, so the promise of "7 cards" holds.
 *
 * - Due concepts first, the least likely to be recalled first.
 * - At most `newPerDay` new concepts, and only ones kept before today.
 * - Free slots go to concepts almost due (within 3 days), never more.
 * - An easy card opens the set; no two cards in a row share a topic when
 *   the pool allows it (interleaving).
 * - After a rough patch (over 40 % missed in the last 3 sets, or a set left
 *   unfinished), the set shrinks by 2 and takes no new concepts.
 * - Overdue concepts simply stay due: no count of what's owed is shown.
 */

export const DEFAULT_CAP = 7;
export const DEFAULT_NEW_PER_DAY = 2;
const PULL_AHEAD_DAYS = 3;
const MAX_FREE_RECALL = 2;
const MIN_CAP = 3;
/** A concept is taught back at most this often. */
export const TEACH_EVERY_DAYS = 7;
/** From Leaf up: a concept the learner has started to own (design §5.2). */
const TEACH_MIN_STABILITY = 3;

export interface ComposeInput {
  concepts: readonly Concept[];
  memory: ReadonlyMap<string, MemoryState>;
  /** Earlier sets, for the adaptive load. */
  sessions: readonly ReviewSession[];
  events: readonly ReviewEvent[];
  localDate: string;
  now: Date;
  timeZone: string;
  cap?: number;
  newPerDay?: number;
  /** Concepts already in today's sets (for a bonus round). */
  exclude?: ReadonlySet<string>;
  /** Earlier teach-backs, so a concept isn't explained again too soon. */
  teachBacks?: readonly TeachBack[];
  /** Links between concepts, for the contrast card. */
  links?: readonly ConceptLink[];
}

export interface ComposedSet {
  planned: PlannedItem[];
  /** The adaptive load made it smaller. */
  lighter: boolean;
}

function addDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Over 40 % missed across the last 3 finished sets, or one left unfinished. */
export function needsLighterSet(
  sessions: readonly ReviewSession[],
  events: readonly ReviewEvent[],
  localDate: string,
): boolean {
  const past = sessions
    .filter(
      (s) => s.kind === 'daily' && s.localDate < localDate && s.planned.length,
    )
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
    .slice(-3);
  if (!past.length) return false;
  if (past.some((session) => !session.completedAt)) return true;
  const ids = new Set(past.map((session) => session.id));
  const graded = events.filter((event) => ids.has(event.sessionId));
  if (!graded.length) return false;
  const missed = graded.filter((event) => event.rating === 'again').length;
  return missed / graded.length > 0.4;
}

/**
 * The prompt to ask: the least-asked live one that isn't the one asked
 * last time; free recall only while the set has room for it.
 */
export function choosePrompt(
  concept: Concept,
  state: MemoryState | undefined,
  freeRecallLeft: boolean,
): RecallPrompt | null {
  const live = concept.prompts.filter((prompt) => !prompt.retired);
  if (!live.length) return null;
  const uses = (prompt: RecallPrompt) => state?.promptUses[prompt.id] ?? 0;
  const ranked = [...live].sort(
    (a, b) =>
      Number(a.id === state?.lastPromptId) -
        Number(b.id === state?.lastPromptId) ||
      uses(a) - uses(b) ||
      // A concept's first card is a free recall: generating helps most.
      Number(b.type === 'free_recall' && !state?.reps) -
        Number(a.type === 'free_recall' && !state?.reps) ||
      (a.id < b.id ? -1 : 1),
  );
  return (
    ranked.find((prompt) => freeRecallLeft || prompt.type !== 'free_recall') ??
    ranked[0]
  );
}

export function composeDailySet(input: ComposeInput): ComposedSet {
  const lighter = needsLighterSet(
    input.sessions,
    input.events,
    input.localDate,
  );
  const cap = Math.max(MIN_CAP, (input.cap ?? DEFAULT_CAP) - (lighter ? 2 : 0));
  const newLimit = lighter
    ? 0
    : Math.min(
        input.newPerDay ?? DEFAULT_NEW_PER_DAY,
        Math.max(1, Math.round(cap * 0.15)),
      );
  const exclude = input.exclude ?? new Set<string>();
  const live = input.concepts.filter(
    (concept) =>
      concept.status === 'active' &&
      !concept.deletedAt &&
      !exclude.has(concept.id) &&
      concept.prompts.some((prompt) => !prompt.retired),
  );
  const r = (concept: Concept) => {
    const state = input.memory.get(concept.id);
    return state ? retrievability(state, input.now) : 0;
  };
  const dueOn = (concept: Concept) => {
    const due = input.memory.get(concept.id)?.dueAt;
    return due ? localDateOf(new Date(due), input.timeZone) : null;
  };
  const byId = (a: Concept, b: Concept) => (a.id < b.id ? -1 : 1);

  const reviewed = live.filter((concept) => input.memory.get(concept.id)?.reps);
  const due = reviewed
    .filter((concept) => (dueOn(concept) ?? '9999') <= input.localDate)
    .sort((a, b) => r(a) - r(b) || byId(a, b));
  const fresh = live
    .filter(
      (concept) =>
        !input.memory.get(concept.id)?.reps &&
        !!concept.confirmedAt &&
        localDateOf(new Date(concept.confirmedAt), input.timeZone) <
          input.localDate,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || byId(a, b));
  const soon = reviewed
    .filter((concept) => {
      const day = dueOn(concept);
      return (
        !!day &&
        day > input.localDate &&
        day <= addDays(input.localDate, PULL_AHEAD_DAYS)
      );
    })
    .sort((a, b) => r(a) - r(b) || byId(a, b));

  const newOnes = fresh.slice(0, newLimit);
  const reviews = due.slice(0, cap - newOnes.length);
  const extra = soon.slice(
    0,
    Math.max(0, cap - newOnes.length - reviews.length),
  );
  const picked = [...reviews, ...extra, ...newOnes];

  // An easy card first, then interleave topics as the pool allows.
  const ordered: Concept[] = [];
  const pool = [...picked];
  const easiest = pool
    .filter((concept) => input.memory.get(concept.id)?.reps)
    .sort((a, b) => r(b) - r(a) || byId(a, b))[0];
  if (easiest) ordered.push(pool.splice(pool.indexOf(easiest), 1)[0]);
  while (pool.length) {
    const lastTopic = ordered.at(-1)?.topicId ?? null;
    const index = pool.findIndex(
      (concept) => lastTopic === null || concept.topicId !== lastTopic,
    );
    ordered.push(pool.splice(index === -1 ? 0 : index, 1)[0]);
  }

  let freeRecall = 0;
  const planned: PlannedItem[] = [];
  for (const concept of ordered) {
    const prompt = choosePrompt(
      concept,
      input.memory.get(concept.id),
      freeRecall < MAX_FREE_RECALL,
    );
    if (!prompt) continue;
    if (prompt.type === 'free_recall') freeRecall += 1;
    planned.push({ conceptId: concept.id, promptId: prompt.id });
  }
  const teach = pickTeachBack(planned, input);
  if (teach !== -1) planned[teach] = { ...planned[teach], teach: true };
  const contrast = pickContrast(planned, { ...input, concepts: live });
  if (contrast) {
    planned[contrast.index] = {
      ...planned[contrast.index],
      contrastWith: contrast.with,
    };
  }
  return { planned, lighter };
}

/**
 * At most one contrast card per set (design §5.2): a planned concept with
 * a confirmed "similar" or "contrasts" link to another concept that has
 * been reviewed. A partner that is in the set too is preferred, since both
 * are fresh in mind. Never the opener or the teach-back card.
 */
export function pickContrast(
  planned: readonly PlannedItem[],
  input: Pick<ComposeInput, 'memory' | 'links' | 'concepts'>,
): { index: number; with: string } | null {
  const live = new Set(
    input.concepts
      .filter((concept) => concept.status === 'active' && !concept.deletedAt)
      .map((concept) => concept.id),
  );
  const links = (input.links ?? []).filter(
    (link) =>
      link.confirmed &&
      !link.deletedAt &&
      CONTRAST_RELATIONS.includes(link.relation),
  );
  if (!links.length) return null;
  const inSet = new Set(planned.map((item) => item.conceptId));
  let best: { index: number; with: string } | null = null;
  let bestScore = 0;
  for (const [index, item] of planned.entries()) {
    if (item.teach || (index === 0 && planned.length > 1)) continue;
    for (const link of links) {
      if (link.from !== item.conceptId && link.to !== item.conceptId) continue;
      const other = link.from === item.conceptId ? link.to : link.from;
      if (!live.has(other) || !input.memory.get(other)?.reps) continue;
      const score = inSet.has(other) ? 2 : 1;
      if (score > bestScore) {
        best = { index, with: other };
        bestScore = score;
      }
    }
  }
  return best;
}

/**
 * At most one teach-back per set (design §5.2): the most mature concept at
 * Leaf or above that wasn't taught back in the last week, never the
 * opening card (which is there for momentum). -1 when none qualifies.
 */
export function pickTeachBack(
  planned: readonly PlannedItem[],
  input: Pick<ComposeInput, 'memory' | 'teachBacks' | 'localDate'>,
): number {
  const since = addDays(input.localDate, -TEACH_EVERY_DAYS);
  const recent = new Set(
    (input.teachBacks ?? [])
      .filter((teachBack) => teachBack.localDate > since)
      .map((teachBack) => teachBack.conceptId),
  );
  let best = -1;
  let bestStability = 0;
  planned.forEach((item, index) => {
    if (index === 0 && planned.length > 1) return;
    const state = input.memory.get(item.conceptId);
    if (!state?.reps || state.stability < TEACH_MIN_STABILITY) return;
    if (recent.has(item.conceptId)) return;
    if (state.stability > bestStability) {
      best = index;
      bestStability = state.stability;
    }
  });
  return best;
}
