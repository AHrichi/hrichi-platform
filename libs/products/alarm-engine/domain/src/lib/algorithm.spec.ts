import { describe, expect, it } from 'vitest';
import {
  applyQuestionnaireToChapters,
  computeNightlyDecision,
  getDueReviewsAsOfDate,
} from './algorithm';
import type { Chapter, NightlySystemState, QuestionnaireInput } from './models';

describe('Nightly Alarm Decision Engine Algorithm', () => {
  const sampleChapters: Chapter[] = [
    {
      chapterNumber: 1,
      title: 'Distributed Storage',
      originalStudyDate: '2026-10-20',
      d3Date: '2026-10-23',
      d7Date: '2026-10-27',
      d14Date: '2026-11-03',
      d3Completed: true,
      d7Completed: true,
      d14Completed: false, // due tomorrow Nov 3
      quizScorePercent: 90,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: '',
    },
    {
      chapterNumber: 2,
      title: 'Pointers & Memory',
      originalStudyDate: '2026-10-26',
      d3Date: '2026-10-29',
      d7Date: '2026-11-02', // due today Nov 2
      d14Date: '2026-11-09',
      d3Completed: true,
      d7Completed: false, // will check rollover rule
      d14Completed: false,
      quizScorePercent: 65, // weak!
      quizQuestionsMissed: 4,
      isWeak: true,
      codingCarryover: false,
      errorNotes: 'Pointer arithmetic overflow',
    },
    {
      chapterNumber: 3,
      title: 'Async Locking & Mutexes',
      originalStudyDate: '2026-10-30',
      d3Date: '2026-11-02', // due today Nov 2
      d7Date: '2026-11-06',
      d14Date: '2026-11-13',
      d3Completed: false,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 85,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: true, // unfinished coding carryover
      errorNotes: 'Async mutex deadlock',
    },
  ];

  const defaultSystemState: NightlySystemState = {
    lastConsolidationAtChapter: 0,
    checklistState: new Array(9).fill(false),
  };

  it('detects due reviews accurately as of tonight', () => {
    // 2026-11-02: Ch 2 D-7 is due (d7Date=2026-11-02), Ch 3 D-3 is due (d3Date=2026-11-02)
    const dueTonight = getDueReviewsAsOfDate(sampleChapters, '2026-11-02');
    expect(dueTonight.map((r) => `${r.chapterNumber}_${r.type}`)).toEqual([
      '2_D-7',
      '3_D-3',
    ]);
  });

  it('auto-flags WEAK if missed >= 3 or score < 75', () => {
    const inputWeakScore: QuestionnaireInput = {
      tonightDate: '2026-11-02',
      targetChapterNumber: 4,
      completionStatus: 'YES',
      quizQuestionsMissed: 1,
      quizScorePercent: 70, // < 75
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: 'Memory leak in slice',
      dayTypeSelection: 'Auto-Detect',
    };
    const { updatedChapters } = applyQuestionnaireToChapters(
      sampleChapters,
      inputWeakScore,
    );
    const ch4 = updatedChapters.find((c) => c.chapterNumber === 4);
    expect(ch4?.isWeak).toBe(true);

    const inputWeakMissed: QuestionnaireInput = {
      ...inputWeakScore,
      quizScorePercent: 80,
      quizQuestionsMissed: 3, // >= 3
    };
    const res2 = applyQuestionnaireToChapters(sampleChapters, inputWeakMissed);
    expect(res2.updatedChapters.find((c) => c.chapterNumber === 4)?.isWeak).toBe(
      true,
    );

    const inputStrong: QuestionnaireInput = {
      ...inputWeakScore,
      quizScorePercent: 88,
      quizQuestionsMissed: 1,
    };
    const res3 = applyQuestionnaireToChapters(sampleChapters, inputStrong);
    expect(res3.updatedChapters.find((c) => c.chapterNumber === 4)?.isWeak).toBe(
      false,
    );
  });

  it('implements Rollover Rule: unchecked reviews roll into tomorrow 06:00 alarm without changing originalStudyDate', () => {
    // Tonight is 2026-11-02 (Monday), tomorrow is 2026-11-03 (Tuesday -> Standard Day).
    // User does NOT check off Ch 2 D-7 or Ch 3 D-3.
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-02',
      targetChapterNumber: 4,
      completionStatus: 'YES',
      quizQuestionsMissed: 1,
      quizScorePercent: 85,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [], // left unchecked!
      errorNotes: 'Syntax quirk',
      dayTypeSelection: 'Auto-Detect',
    };

    const decision = computeNightlyDecision(
      sampleChapters,
      defaultSystemState,
      input,
    );

    // Tomorrow is Tuesday (Standard)
    expect(decision.tomorrowWeekday).toBe('Tuesday');
    expect(decision.effectiveDayType).toBe('Standard');

    // Ch 2 D-7 and Ch 3 D-3 should be in rolledOverReviews
    expect(decision.rolledOverReviews.length).toBe(2);
    expect(
      decision.rolledOverReviews.map((r) => `${r.chapterNumber}_${r.type}`),
    ).toContain('2_D-7');
    expect(
      decision.rolledOverReviews.map((r) => `${r.chapterNumber}_${r.type}`),
    ).toContain('3_D-3');

    // The 06:00 alarm must feature D-3 (Ch 3), D-7 (Ch 2), and D-14 (Ch 1 is due Nov 3)
    const alarm6 = decision.alarms.find((a) => a.time === '06:00');
    expect(alarm6?.title).toContain('D-3: 3');
    expect(alarm6?.title).toContain('D-7: 2');
    expect(alarm6?.title).toContain('D-14: 1');
    expect(alarm6?.title).toContain('NEW: Ch. 5');
  });

  it('keeps tomorrow target as REPEAT: Ch. X when completionStatus is NO', () => {
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-02',
      targetChapterNumber: 4,
      completionStatus: 'NO',
      quizQuestionsMissed: 2,
      quizScorePercent: 75,
      codingProgress: 'CARRYOVER',
      completedReviewsTonight: [],
      errorNotes: 'Compiler error in generics',
      dayTypeSelection: 'Auto-Detect',
    };

    const decision = computeNightlyDecision(
      sampleChapters,
      defaultSystemState,
      input,
    );

    expect(decision.isRepeat).toBe(true);
    expect(decision.targetChapter).toBe(4);
    const alarm6 = decision.alarms.find((a) => a.time === '06:00');
    expect(alarm6?.title).toContain('REPEAT: Ch. 4');
    const alarm8 = decision.alarms.find((a) => a.time === '08:15');
    expect(alarm8?.title).toContain('REPEAT Ch. 4');
  });

  it('triggers Consolidation Day when 6 completed chapters milestone is reached', () => {
    // 5 completed chapters already
    const fiveChapters: Chapter[] = [1, 2, 3, 4, 5].map((num) => ({
      chapterNumber: num,
      originalStudyDate: `2026-10-${15 + num}`,
      d3Date: `2026-10-${18 + num}`,
      d7Date: `2026-10-${22 + num}`,
      d14Date: `2026-10-${29 + num}`,
      d3Completed: true,
      d7Completed: true,
      d14Completed: true,
      quizScorePercent: 85,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: '',
    }));

    // Tonight we finish Chapter 6! (total 6 completed since lastConsolidationAtChapter = 0)
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-02',
      targetChapterNumber: 6,
      completionStatus: 'YES',
      quizQuestionsMissed: 0,
      quizScorePercent: 100,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: '',
      dayTypeSelection: 'Auto-Detect',
    };

    const decision = computeNightlyDecision(
      fiveChapters,
      defaultSystemState,
      input,
    );

    expect(decision.isConsolidation).toBe(true);
    expect(decision.effectiveDayType).toBe('Consolidation');
    expect(decision.consolidationReason).toContain('Milestone');

    // 08:15 Mixed Quiz covers Ch. 1–6
    const quizAlarm = decision.alarms.find((a) => a.time === '08:15');
    expect(quizAlarm?.title).toContain('Mixed Quiz: Ch. 1–6');

    // 10:00 Coding Challenge covers Ch. 1–6
    const codeAlarm = decision.alarms.find((a) => a.time === '10:00');
    expect(codeAlarm?.title).toContain('Practical Coding Challenge: Ch. 1–6');
  });

  it('triggers Consolidation Day when 3 or more weak chapters accumulate', () => {
    // 2 weak chapters exist already (Ch 1, Ch 2)
    const chaptersWith2Weak: Chapter[] = [
      {
        ...sampleChapters[0],
        chapterNumber: 1,
        isWeak: true,
      },
      {
        ...sampleChapters[1],
        chapterNumber: 2,
        isWeak: true,
      },
    ];

    // Tonight Ch 3 is finished with weak score -> total 3 weak!
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-02',
      targetChapterNumber: 3,
      completionStatus: 'YES',
      quizQuestionsMissed: 4, // weak!
      quizScorePercent: 60,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: 'Thread safety hazard',
      dayTypeSelection: 'Auto-Detect',
    };

    const decision = computeNightlyDecision(
      chaptersWith2Weak,
      defaultSystemState,
      input,
    );

    expect(decision.isConsolidation).toBe(true);
    expect(decision.consolidationReason).toContain('Weak Threshold');
    const recallAlarm = decision.alarms.find((a) => a.time === '06:00');
    expect(recallAlarm?.title).toContain('Weak Flashcards (Ch. 1, 2, 3)');
  });

  it('preserves Fasting day energy constraints when Consolidation lands on a Fasting weekday', () => {
    // Tonight is 2026-11-01 (Sunday), tomorrow is 2026-11-02 (Monday -> Fasting)
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-01',
      targetChapterNumber: 4,
      completionStatus: 'YES',
      quizQuestionsMissed: 1,
      quizScorePercent: 90,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: 'Goroutine leak',
      dayTypeSelection: 'Consolidation', // manual or auto
    };

    const decision = computeNightlyDecision(
      sampleChapters,
      defaultSystemState,
      input,
    );

    expect(decision.tomorrowWeekday).toBe('Monday');
    expect(decision.effectiveDayType).toBe('Consolidation');

    // Time slots must follow Fasting: 06:00, 09:30, 15:15 (CLOSE IDE), 16:15, 19:30
    const times = decision.alarms.map((a) => a.time);
    expect(times).toEqual(['06:00', '09:30', '15:15', '16:15', '19:30']);

    const ideClose = decision.alarms.find((a) => a.time === '15:15');
    expect(ideClose?.title).toContain('CLOSE IDE');
  });

  it('preserves Recovery Friday constraints when Consolidation lands on Friday', () => {
    // Tonight is 2026-11-05 (Thursday), tomorrow is 2026-11-06 (Friday -> Recovery)
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-05',
      targetChapterNumber: 4,
      completionStatus: 'YES',
      quizQuestionsMissed: 1,
      quizScorePercent: 90,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: '',
      dayTypeSelection: 'Consolidation',
    };

    const decision = computeNightlyDecision(
      sampleChapters,
      defaultSystemState,
      input,
    );

    expect(decision.tomorrowWeekday).toBe('Friday');
    const times = decision.alarms.map((a) => a.time);
    expect(times).toEqual(['06:00', '08:15', '10:00', '15:15']);

    const offAlarm = decision.alarms.find((a) => a.time === '15:15');
    expect(offAlarm?.title).toContain('OFF — Recovery');
  });

  it('CONSOLIDATION COMPLETED TODAY resets weak flags and advances consolidation milestone', () => {
    const input: QuestionnaireInput = {
      tonightDate: '2026-11-02',
      targetChapterNumber: 6,
      completionStatus: 'CONSOLIDATION_COMPLETED_TODAY',
      quizQuestionsMissed: 0,
      quizScorePercent: 95,
      codingProgress: 'CLEAN',
      completedReviewsTonight: [],
      errorNotes: '',
      dayTypeSelection: 'Auto-Detect',
    };

    const { updatedChapters, lastConsolidationAtChapter } =
      applyQuestionnaireToChapters(sampleChapters, input);

    expect(lastConsolidationAtChapter).toBe(3); // highest chapter in sample
    expect(updatedChapters.every((c) => !c.isWeak)).toBe(true);
  });

  describe('Adaptive Missed Goals Philosophy', () => {
    it('de-escalates tomorrow into gentle recovery when EMERGENCY is logged', () => {
      const input: QuestionnaireInput = {
        tonightDate: '2026-11-03', // Tuesday -> tomorrow Wednesday
        targetChapterNumber: 4,
        targetChapterTitle: 'Async Concurrency',
        topicName: 'System Architecture',
        completionStatus: 'MISSED_GOALS',
        missedReason: 'EMERGENCY',
        quizQuestionsMissed: 0,
        quizScorePercent: 0,
        codingProgress: 'CLEAN',
        completedReviewsTonight: [],
        errorNotes: 'Severe migraine / emergency',
        dayTypeSelection: 'Auto-Detect',
      };

      const decision = computeNightlyDecision(
        sampleChapters,
        defaultSystemState,
        input,
      );

      expect(decision.targetChapter).toBe(4);
      expect(decision.isRepeat).toBe(true);
      expect(decision.isAdaptiveReset).toBe(true);
      expect(decision.detectedDayType).toBe('Recovery');

      const alarm6 = decision.alarms.find((a) => a.time === '06:00');
      expect(alarm6?.title).toContain('GENTLE CATCH-UP: Ch. 4 - Async Concurrency');

      const alarm15 = decision.alarms.find((a) => a.time === '15:15');
      expect(alarm15?.title).toContain('OFF — Full Recovery');

      const adaptiveInsight = decision.insights.find((i) => i.type === 'adaptive-reset');
      expect(adaptiveInsight).toBeDefined();
      expect(adaptiveInsight?.title).toContain('Zero-Guilt Emergency Recovery');
    });

    it('activates cognitive anti-avalanche protocol when OVERWHELMED is logged', () => {
      const input: QuestionnaireInput = {
        tonightDate: '2026-11-03',
        targetChapterNumber: 4,
        targetChapterTitle: 'Async Concurrency',
        completionStatus: 'MISSED_GOALS',
        missedReason: 'OVERWHELMED',
        quizQuestionsMissed: 0,
        quizScorePercent: 0,
        codingProgress: 'CLEAN',
        completedReviewsTonight: [],
        errorNotes: 'Mental fatigue',
        dayTypeSelection: 'Auto-Detect',
      };

      const decision = computeNightlyDecision(
        sampleChapters,
        defaultSystemState,
        input,
      );

      expect(decision.targetChapter).toBe(4);
      expect(decision.isRepeat).toBe(true);
      expect(decision.isAdaptiveReset).toBe(true);

      const alarm6 = decision.alarms.find((a) => a.time === '06:00');
      expect(alarm6?.title).toContain('DE-ESCALATE: Ch. 4 - Async Concurrency');

      const alarm8 = decision.alarms.find((a) => a.time === '08:15');
      expect(alarm8?.title).toContain('Light Review: Ch. 4 Core Concepts');

      const adaptiveInsight = decision.insights.find((i) => i.type === 'adaptive-reset');
      expect(adaptiveInsight?.title).toContain('Cognitive Anti-Avalanche Protocol');
    });

    it('generates focused catch-up schedule without guilt when OFF_TRACK is logged', () => {
      const input: QuestionnaireInput = {
        tonightDate: '2026-11-03',
        targetChapterNumber: 4,
        targetChapterTitle: 'Async Concurrency',
        completionStatus: 'MISSED_GOALS',
        missedReason: 'OFF_TRACK',
        quizQuestionsMissed: 0,
        quizScorePercent: 0,
        codingProgress: 'CLEAN',
        completedReviewsTonight: [],
        errorNotes: 'Got distracted with meetings',
        dayTypeSelection: 'Auto-Detect',
      };

      const decision = computeNightlyDecision(
        sampleChapters,
        defaultSystemState,
        input,
      );

      expect(decision.targetChapter).toBe(4);
      expect(decision.isRepeat).toBe(true);

      const alarm6 = decision.alarms.find((a) => a.time === '06:00');
      expect(alarm6?.title).toContain('CATCH-UP: Ch. 4 - Async Concurrency');

      const adaptiveInsight = decision.insights.find((i) => i.type === 'adaptive-reset');
      expect(adaptiveInsight?.title).toContain('Focused Catch-Up Protocol');
    });
  });
});
