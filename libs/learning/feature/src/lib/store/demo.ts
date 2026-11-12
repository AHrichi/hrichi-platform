import { LearningDatabase, LearningLocalStore } from '@ah/learning/data-access';
import { GOLDEN_CONCEPTS, type GoldenConcept } from '@ah/learning/domain';

/**
 * The portfolio's copy of the Learning Engine (design §9): its own database
 * (`ah-demo-learning`), empty at first, never synced, paired or sent to the
 * AI. Until 2026-11-12 it was filled with a month of sample reviews; that
 * fill wrote this flag, so a browser that still has it starts over.
 */
export const SAMPLE_MONTH_FLAG = 'demo-seeded';

/**
 * Opens the portfolio copy's database, empty for anyone who still has the
 * old sample month.
 */
export async function openDemo(name: string): Promise<LearningLocalStore> {
  const db = new LearningDatabase(name);
  const local = new LearningLocalStore(db);
  if (!(await local.getMeta<boolean>(SAMPLE_MONTH_FLAG))) return local;
  await db.delete();
  return new LearningLocalStore(new LearningDatabase(name));
}

/**
 * What a capture in the portfolio copy turns into, in turn: a ready-made
 * concept instead of the AI's, and the capture says so.
 */
export function demoDraftSource(index: number): GoldenConcept {
  return GOLDEN_CONCEPTS[index % GOLDEN_CONCEPTS.length];
}
