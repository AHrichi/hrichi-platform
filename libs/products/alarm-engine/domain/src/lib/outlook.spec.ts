import { describe, expect, it } from 'vitest';
import { calculateSpacedRepetitionDates } from './dates';
import type { Chapter } from './models';
import { computeSevenDayOutlook, getStandardDayTypeFromWeekday } from './outlook';

describe('computeSevenDayOutlook', () => {
  it('identifies weekday day types correctly', () => {
    expect(getStandardDayTypeFromWeekday('Monday')).toBe('Fasting');
    expect(getStandardDayTypeFromWeekday('Thursday')).toBe('Fasting');
    expect(getStandardDayTypeFromWeekday('Friday')).toBe('Recovery');
    expect(getStandardDayTypeFromWeekday('Tuesday')).toBe('Standard');
    expect(getStandardDayTypeFromWeekday('Sunday')).toBe('Standard');
  });

  it('projects 7 upcoming days and populates due reviews', () => {
    const today = '2026-11-04'; // Wednesday
    const chapters: Chapter[] = [
      {
        chapterNumber: 1,
        title: 'TCP Primitives',
        originalStudyDate: '2026-11-01', // D-3 is 2026-11-04 (today)
        ...calculateSpacedRepetitionDates('2026-11-01'),
        d3Completed: false,
        d7Completed: false,
        d14Completed: false,
        quizScorePercent: 90,
        quizQuestionsMissed: 1,
        isWeak: false,
        codingCarryover: false,
        errorNotes: '',
      },
    ];

    const outlook = computeSevenDayOutlook(chapters, today);
    expect(outlook.length).toBe(7);
    expect(outlook[0].isToday).toBe(true);
    expect(outlook[0].date).toBe('2026-11-04');
    expect(outlook[0].reviews.some((r) => r.chapterNumber === 1 && r.type === 'D-3')).toBe(true);
  });

  it('detects high review load when 3 or more reviews collide on the same day', () => {
    const today = '2026-11-04';
    const targetCollisionDate = '2026-11-07'; // 3 days after today

    const chapters: Chapter[] = [
      // Ch 1: D-3 falls on Nov 7 (studied Nov 4)
      {
        chapterNumber: 1,
        title: 'Ch 1',
        originalStudyDate: '2026-11-04',
        ...calculateSpacedRepetitionDates('2026-11-04'),
        d3Completed: false,
        d7Completed: false,
        d14Completed: false,
        quizScorePercent: 90,
        quizQuestionsMissed: 0,
        isWeak: false,
        codingCarryover: false,
        errorNotes: '',
      },
      // Ch 2: D-7 falls on Nov 7 (studied Oct 31)
      {
        chapterNumber: 2,
        title: 'Ch 2',
        originalStudyDate: '2026-10-31',
        ...calculateSpacedRepetitionDates('2026-10-31'),
        d3Completed: true,
        d7Completed: false,
        d14Completed: false,
        quizScorePercent: 85,
        quizQuestionsMissed: 1,
        isWeak: false,
        codingCarryover: false,
        errorNotes: '',
      },
      // Ch 3: D-14 falls on Nov 7 (studied Oct 24)
      {
        chapterNumber: 3,
        title: 'Ch 3',
        originalStudyDate: '2026-10-24',
        ...calculateSpacedRepetitionDates('2026-10-24'),
        d3Completed: true,
        d7Completed: true,
        d14Completed: false,
        quizScorePercent: 80,
        quizQuestionsMissed: 2,
        isWeak: false,
        codingCarryover: false,
        errorNotes: '',
      },
    ];

    const outlook = computeSevenDayOutlook(chapters, today);
    const collisionDay = outlook.find((d) => d.date === targetCollisionDate);
    expect(collisionDay).toBeDefined();
    expect(collisionDay?.reviews.length).toBe(3);
    expect(collisionDay?.hasHighLoad).toBe(true);
  });
});
