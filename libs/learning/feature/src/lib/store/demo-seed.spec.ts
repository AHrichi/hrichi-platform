import 'fake-indexeddb/auto';
import { LearningDatabase, LearningLocalStore } from '@ah/learning/data-access';
import {
  composeDailySet,
  computeStreak,
  countedDays,
  GOLDEN_CONCEPTS,
  localDateOf,
  memoryOf,
} from '@ah/learning/domain';
import { DEMO_DRAFTS, demoDraftSource, seedDemo } from './demo-seed';

const TZ = 'Europe/Paris';
const now = new Date('2026-11-12T09:00:00Z');

async function seeded() {
  const local = new LearningLocalStore(
    new LearningDatabase(`demo-${Math.random()}`),
    () => now,
  );
  await seedDemo(local, TZ, now);
  return local;
}

describe('the portfolio demo seed', () => {
  it('looks like a month of real use: a streak, a due set, tiers', async () => {
    const local = await seeded();
    const [concepts, events, sessions, topics] = await Promise.all([
      local.concepts(),
      local.events(),
      local.sessions(),
      local.topics(),
    ]);
    expect(concepts).toHaveLength(GOLDEN_CONCEPTS.length - DEMO_DRAFTS);
    expect(concepts.every((c) => c.status === 'active')).toBe(true);
    expect(topics.length).toBeGreaterThanOrEqual(4);
    expect(events.length).toBeGreaterThan(concepts.length * 2);

    const today = localDateOf(now, TZ);
    const { counted, full } = countedDays(events, sessions);
    expect(computeStreak(counted, full, today).current).toBeGreaterThanOrEqual(
      12,
    );

    const set = composeDailySet({
      concepts,
      memory: memoryOf(concepts, events),
      sessions,
      events,
      localDate: today,
      now,
      timeZone: TZ,
    });
    expect(set.planned.length).toBeGreaterThan(0);
  });

  it('seeds once, and keeps spare concepts for the demo’s captures', async () => {
    const local = await seeded();
    const before = (await local.concepts()).length;
    await seedDemo(local, TZ, now);
    expect((await local.concepts()).length).toBe(before);
    const spare = new Set(
      GOLDEN_CONCEPTS.slice(-DEMO_DRAFTS).map((golden) => golden.title),
    );
    expect(spare.has(demoDraftSource(0).title)).toBe(true);
    expect(spare.has(demoDraftSource(1).title)).toBe(true);
  });
});
