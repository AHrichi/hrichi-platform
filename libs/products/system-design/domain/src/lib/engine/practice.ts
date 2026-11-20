import type { Check } from '../model/checks';

export interface PracticeItem {
  lessonId: string;
  check: Check;
}

/** One saved answer (one Dexie row in P5). */
export interface Attempt {
  lessonId: string;
  checkId: string;
  correct: boolean;
  /** ISO time. */
  at: string;
}

/** A small seeded PRNG (mulberry32), so practice order is testable. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const keyOf = (lessonId: string, checkId: string) => `${lessonId}:${checkId}`;

/**
 * Picks up to `n` questions: those last answered wrong first, then never
 * seen, then the longest since seen. Ties are shuffled with `seed`.
 */
export function pickPractice(
  items: readonly PracticeItem[],
  attempts: readonly Attempt[],
  n = 10,
  seed = 1,
): PracticeItem[] {
  const last = new Map<string, Attempt>();
  for (const a of attempts) {
    const k = keyOf(a.lessonId, a.checkId);
    const prev = last.get(k);
    if (!prev || prev.at <= a.at) last.set(k, a);
  }
  const rnd = random(seed);
  return items
    .map((item) => {
      const a = last.get(keyOf(item.lessonId, item.check.id));
      const tier = !a ? 1 : a.correct ? 2 : 0;
      return { item, tier, at: a?.at ?? '', tie: rnd() };
    })
    .sort(
      (x, y) => x.tier - y.tier || x.at.localeCompare(y.at) || x.tie - y.tie,
    )
    .slice(0, Math.max(0, n))
    .map((x) => x.item);
}
