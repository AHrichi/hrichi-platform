import type { ReviewSession } from '../records';
import { sampleConcept, sampleEvent } from '../testing/fixtures';
import { memoryOf } from './memory';
import { milestonesOf, themesOf } from './milestones';
import { computeStreak, countedDays, REPAIR_EVERY_DAYS } from './streak';

const set = (...days: string[]) => new Set(days);
const run = (from: number, to: number, month = '10') =>
  Array.from(
    { length: to - from + 1 },
    (_, i) => `2026-${month}-${String(from + i).padStart(2, '0')}`,
  );

describe('the repair window', () => {
  it('two sets the day after a miss bring the streak back', () => {
    const days = [...run(1, 5), ...run(7, 8)];
    const repaired = computeStreak(
      set(...days),
      set(),
      '2026-10-08',
      set('2026-10-07'),
    );
    expect(repaired.repaired).toEqual(['2026-10-06']);
    expect(repaired.current).toBe(7);

    const broken = computeStreak(set(...days), set(), '2026-10-08');
    expect(broken.current).toBe(2);
  });

  it('offers a repair today when yesterday ended the streak', () => {
    const streak = computeStreak(set(...run(1, 5)), set(), '2026-10-07');
    expect(streak.repairOffer).toEqual({
      missed: '2026-10-06',
      streakBefore: 5,
    });
    expect(streak.current).toBe(0);
    // Doing the two sets today makes it a repair.
    const after = computeStreak(
      set(...run(1, 5), '2026-10-07'),
      set(),
      '2026-10-07',
      set('2026-10-07'),
    );
    expect(after.current).toBe(6);
    expect(after.repairOffer).toBeNull();
  });

  it('works once every 30 days', () => {
    // Short runs, so no freeze is earned: only the 30-day rule decides.
    const days = [...run(1, 3), ...run(5, 6), ...run(8, 9)];
    const streak = computeStreak(
      set(...days),
      set(),
      '2026-10-09',
      set('2026-10-05', '2026-10-08'),
    );
    expect(streak.repaired).toEqual(['2026-10-04']);
    expect(streak.current).toBe(2);
    expect(REPAIR_EVERY_DAYS).toBe(30);
  });

  it('counts a day with two finished sets as doubled', () => {
    const session = (
      kind: ReviewSession['kind'],
      id: string,
    ): ReviewSession => ({
      id,
      updatedAt: '2026-10-07T09:00:00.000Z',
      deletedAt: null,
      localDate: '2026-10-07',
      kind,
      planned: [
        {
          conceptId: sampleConcept().id,
          promptId: sampleConcept().prompts[0].id,
        },
      ],
      lighter: false,
      startedAt: '2026-10-07T08:00:00.000Z',
      completedAt: '2026-10-07T08:05:00.000Z',
    });
    const { doubled } = countedDays(
      [],
      [
        session('daily', '0b6f0c30-0000-4000-8000-000000000301'),
        session('bonus', '0b6f0c30-0000-4000-8000-000000000302'),
      ],
    );
    expect([...doubled]).toEqual(['2026-10-07']);
  });
});

describe('milestones and themes', () => {
  it('earn from progress and unlock garden themes', () => {
    const concept = sampleConcept();
    const events = Array.from({ length: 100 }, (_, i) =>
      sampleEvent({
        id: `0b6f0c30-0000-4000-8000-${String(400 + i).padStart(12, '0')}`,
        at: new Date(Date.UTC(2026, 0, 1 + i * 3)).toISOString(),
      }),
    );
    const progress = {
      events,
      sessions: [],
      memory: memoryOf([concept], events),
      longestStreak: 8,
      level: 3,
    };
    const earned = milestonesOf(progress)
      .filter((m) => m.earned)
      .map((m) => m.id);
    expect(earned).toEqual(
      expect.arrayContaining(['week', 'hundred', 'first-bloom']),
    );
    expect(earned).not.toContain('month');
    const themes = themesOf(progress)
      .filter((t) => t.unlocked)
      .map((t) => t.theme);
    expect(themes).toEqual(
      expect.arrayContaining(['meadow', 'autumn', 'night']),
    );
  });
});
