import {
  addDays,
  calculateSpacedRepetitionDates,
  getWeekdayName,
  isDateOnOrBefore,
} from './dates';
import type {
  AlarmSlot,
  AlgorithmInsight,
  Chapter,
  DayType,
  DueReviewItem,
  MissedGoalReason,
  NightlyDecisionResult,
  NightlySystemState,
  PairedCodingInfo,
  QuestionnaireInput,
} from './models';

/**
 * Returns all currently due reviews as of a given date (e.g. tonight),
 * based on the provided chapters list and completed review keys.
 */
export function getDueReviewsAsOfDate(
  chapters: readonly Chapter[],
  asOfDate: string,
): DueReviewItem[] {
  const dueItems: DueReviewItem[] = [];

  for (const ch of chapters) {
    if (!ch.originalStudyDate) continue;

    if (!ch.d3Completed && isDateOnOrBefore(ch.d3Date, asOfDate)) {
      dueItems.push({
        chapterNumber: ch.chapterNumber,
        chapterTitle: ch.title,
        topicName: ch.topicName,
        type: 'D-3',
        dueDate: ch.d3Date,
        isOverdue: ch.d3Date.localeCompare(asOfDate) < 0,
      });
    }

    if (!ch.d7Completed && isDateOnOrBefore(ch.d7Date, asOfDate)) {
      dueItems.push({
        chapterNumber: ch.chapterNumber,
        chapterTitle: ch.title,
        topicName: ch.topicName,
        type: 'D-7',
        dueDate: ch.d7Date,
        isOverdue: ch.d7Date.localeCompare(asOfDate) < 0,
      });
    }

    if (!ch.d14Completed && isDateOnOrBefore(ch.d14Date, asOfDate)) {
      dueItems.push({
        chapterNumber: ch.chapterNumber,
        chapterTitle: ch.title,
        topicName: ch.topicName,
        type: 'D-14',
        dueDate: ch.d14Date,
        isOverdue: ch.d14Date.localeCompare(asOfDate) < 0,
      });
    }
  }

  // Sort by chapter number, then review type
  return dueItems.sort((a, b) => {
    if (a.chapterNumber !== b.chapterNumber) {
      return a.chapterNumber - b.chapterNumber;
    }
    const order = { 'D-3': 1, 'D-7': 2, 'D-14': 3 };
    return order[a.type] - order[b.type];
  });
}

/**
 * Applies tonight's questionnaire check-offs to generate the updated chapters array.
 */
export function applyQuestionnaireToChapters(
  currentChapters: readonly Chapter[],
  input: QuestionnaireInput,
): { updatedChapters: Chapter[]; lastConsolidationAtChapter: number } {
  const chaptersMap = new Map<number, Chapter>(
    currentChapters.map((ch) => [ch.chapterNumber, { ...ch }]),
  );

  // 1. Mark checked off reviews
  for (const reviewKey of input.completedReviewsTonight) {
    // Expected key format: "Ch<num>_<type>" e.g. "Ch4_D3"
    const match = reviewKey.match(/^Ch(\d+)_(D3|D7|D14)$/);
    if (match) {
      const chNum = parseInt(match[1], 10);
      const revType = match[2];
      const ch = chaptersMap.get(chNum);
      if (ch) {
        if (revType === 'D3') ch.d3Completed = true;
        if (revType === 'D7') ch.d7Completed = true;
        if (revType === 'D14') ch.d14Completed = true;
      }
    }
  }

  let lastConsolidationAtChapter = 0;

  // 2. Handle today's chapter completion
  if (input.completionStatus === 'YES') {
    const chNum = input.targetChapterNumber;
    const isWeak =
      input.quizQuestionsMissed >= 3 || input.quizScorePercent < 75;
    const codingCarryover = input.codingProgress === 'CARRYOVER';

    const existing = chaptersMap.get(chNum);
    const originalDate = existing?.originalStudyDate || input.tonightDate;
    const { d3Date, d7Date, d14Date } =
      calculateSpacedRepetitionDates(originalDate);

    const title =
      input.targetChapterTitle?.trim() || existing?.title || `Chapter ${chNum}`;
    const topicId = input.topicId || existing?.topicId || 'general';
    const topicName = input.topicName || existing?.topicName || 'General';

    chaptersMap.set(chNum, {
      chapterNumber: chNum,
      title,
      topicId,
      topicName,
      originalStudyDate: originalDate,
      d3Date,
      d7Date,
      d14Date,
      d3Completed: existing?.d3Completed ?? false,
      d7Completed: existing?.d7Completed ?? false,
      d14Completed: existing?.d14Completed ?? false,
      quizQuestionsMissed: input.quizQuestionsMissed,
      quizScorePercent: input.quizScorePercent,
      isWeak,
      codingCarryover,
      errorNotes: input.errorNotes.trim(),
    });
  } else if (
    input.completionStatus === 'NO' ||
    input.completionStatus === 'MISSED_GOALS'
  ) {
    const chNum = input.targetChapterNumber;
    const existing = chaptersMap.get(chNum);
    if (existing) {
      chaptersMap.set(chNum, {
        ...existing,
        title: input.targetChapterTitle?.trim() || existing.title,
        topicId: input.topicId || existing.topicId,
        topicName: input.topicName || existing.topicName,
        errorNotes: input.errorNotes.trim() || existing.errorNotes,
        codingCarryover: input.codingProgress === 'CARRYOVER',
      });
    }
  } else if (input.completionStatus === 'CONSOLIDATION_COMPLETED_TODAY') {
    // Mark consolidation completed: clear resolved weak flags and record milestone
    const allChapters = Array.from(chaptersMap.values());
    const highestCh = allChapters.reduce(
      (max, c) => Math.max(max, c.chapterNumber),
      0,
    );
    lastConsolidationAtChapter = highestCh;

    for (const [num, ch] of chaptersMap.entries()) {
      chaptersMap.set(num, {
        ...ch,
        isWeak: false, // Resolved in consolidation
        codingCarryover: false,
      });
    }
  }

  const updatedChapters = Array.from(chaptersMap.values()).sort(
    (a, b) => a.chapterNumber - b.chapterNumber,
  );

  return { updatedChapters, lastConsolidationAtChapter };
}

/**
 * Runs the Nightly Alarm Decision Algorithm to produce tomorrow's schedule and exact alarm titles.
 */
export function computeNightlyDecision(
  chapters: readonly Chapter[],
  systemState: NightlySystemState,
  questionnaire: QuestionnaireInput,
): NightlyDecisionResult {
  const tonightDate = questionnaire.tonightDate;
  const tomorrowDate = addDays(tonightDate, 1);
  const tomorrowWeekday = getWeekdayName(tomorrowDate);

  // Apply questionnaire changes tentatively to evaluate tomorrow's state
  const { updatedChapters, lastConsolidationAtChapter: consolidationUpdate } =
    applyQuestionnaireToChapters(chapters, questionnaire);

  const effectiveLastConsolidation =
    questionnaire.completionStatus === 'CONSOLIDATION_COMPLETED_TODAY'
      ? consolidationUpdate
      : systemState.lastConsolidationAtChapter;

  // Determine target chapter for tomorrow
  let targetChapter: number;
  let isRepeat = false;

  const isAdaptiveReset =
    questionnaire.completionStatus === 'MISSED_GOALS' ||
    (questionnaire.completionStatus === 'NO' &&
      (questionnaire.missedReason === 'OVERWHELMED' ||
        questionnaire.missedReason === 'EMERGENCY'));

  const missedReason = questionnaire.missedReason || 'OFF_TRACK';

  const highestCompletedChapter = updatedChapters.reduce(
    (max, c) => (c.originalStudyDate ? Math.max(max, c.chapterNumber) : max),
    0,
  );

  if (
    questionnaire.completionStatus === 'NO' ||
    questionnaire.completionStatus === 'MISSED_GOALS'
  ) {
    targetChapter = questionnaire.targetChapterNumber;
    isRepeat = true;
  } else if (questionnaire.completionStatus === 'YES') {
    targetChapter = questionnaire.targetChapterNumber + 1;
    isRepeat = false;
  } else {
    // CONSOLIDATION_COMPLETED_TODAY
    targetChapter = highestCompletedChapter + 1;
    isRepeat = false;
  }

  const existingTargetChapter = updatedChapters.find(
    (c) => c.chapterNumber === targetChapter,
  );
  const targetChapterTitle =
    (isRepeat ? questionnaire.targetChapterTitle : undefined) ||
    existingTargetChapter?.title ||
    `Chapter ${targetChapter}`;

  const topicName =
    questionnaire.topicName ||
    existingTargetChapter?.topicName ||
    'General';

  // Check weak chapters
  const weakChapters = updatedChapters.filter((ch) => ch.isWeak);
  const weakChapterNumbers = weakChapters.map((ch) => ch.chapterNumber);

  // Completed chapters since last consolidation
  const completedSinceConsolidation = Math.max(
    0,
    highestCompletedChapter - effectiveLastConsolidation,
  );

  // Consolidation trigger rules
  const milestoneReached = completedSinceConsolidation >= 6;
  const weakThresholdReached = weakChapters.length >= 3;
  const autoConsolidationTriggered =
    questionnaire.completionStatus !== 'CONSOLIDATION_COMPLETED_TODAY' &&
    (milestoneReached || weakThresholdReached);

  // Tomorrow's day type auto-detection
  let detectedDayType: DayType;
  if (autoConsolidationTriggered) {
    detectedDayType = 'Consolidation';
  } else if (isAdaptiveReset && missedReason === 'EMERGENCY') {
    detectedDayType = 'Recovery';
  } else if (tomorrowWeekday === 'Monday' || tomorrowWeekday === 'Thursday') {
    detectedDayType = 'Fasting';
  } else if (tomorrowWeekday === 'Friday') {
    detectedDayType = 'Recovery';
  } else {
    detectedDayType = 'Standard';
  }

  const effectiveDayType =
    questionnaire.dayTypeSelection === 'Auto-Detect'
      ? detectedDayType
      : questionnaire.dayTypeSelection;

  const isConsolidation = effectiveDayType === 'Consolidation';

  // Calculate consolidation milestone range (Ch. A–B)
  const milestoneEnd = Math.max(6, highestCompletedChapter || 6);
  const milestoneStart = Math.max(1, milestoneEnd - 5);

  // Due reviews on or before tomorrow in updatedChapters
  const dueReviewsTomorrowItems = getDueReviewsAsOfDate(
    updatedChapters,
    tomorrowDate,
  );

  const dueD3 = dueReviewsTomorrowItems
    .filter((r) => r.type === 'D-3')
    .map((r) => r.chapterNumber);
  const dueD7 = dueReviewsTomorrowItems
    .filter((r) => r.type === 'D-7')
    .map((r) => r.chapterNumber);
  const dueD14 = dueReviewsTomorrowItems
    .filter((r) => r.type === 'D-14')
    .map((r) => r.chapterNumber);

  // Rolled over reviews: was due on or before tonight, but still not completed
  const rolledOverReviews = dueReviewsTomorrowItems.filter((r) =>
    isDateOnOrBefore(r.dueDate, tonightDate),
  );

  // Find paired chapter for coding
  let pairedCoding: PairedCodingInfo | undefined;
  if (!isConsolidation) {
    const carryoverCh = updatedChapters
      .filter((c) => c.codingCarryover)
      .sort((a, b) => b.chapterNumber - a.chapterNumber)[0];

    const weakCh = updatedChapters
      .filter((c) => c.isWeak && c.chapterNumber !== targetChapter)
      .sort((a, b) => b.chapterNumber - a.chapterNumber)[0];

    if (carryoverCh) {
      pairedCoding = {
        chapterNumber: carryoverCh.chapterNumber,
        reason: 'carryover',
        label: `Ch. ${carryoverCh.chapterNumber} (Carryover)`,
      };
    } else if (weakCh) {
      pairedCoding = {
        chapterNumber: weakCh.chapterNumber,
        reason: 'weak',
        label: `Ch. ${weakCh.chapterNumber} (Weak)`,
      };
    } else {
      const prevNum = Math.max(1, targetChapter - 1);
      pairedCoding = {
        chapterNumber: prevNum,
        reason: 'previous',
        label: `Ch. ${prevNum}`,
      };
    }
  }

  // Build Insights
  const insights: AlgorithmInsight[] = [];

  if (isConsolidation) {
    const reasons: string[] = [];
    if (milestoneReached) {
      reasons.push(
        `6-chapter milestone reached (${completedSinceConsolidation} chapters completed since last consolidation: Ch. ${milestoneStart}–${milestoneEnd}).`,
      );
    }
    if (weakThresholdReached) {
      reasons.push(
        `Accumulated ${weakChapters.length} weak chapters (Ch. ${weakChapterNumbers.join(', ')}).`,
      );
    }
    if (questionnaire.dayTypeSelection === 'Consolidation' && !autoConsolidationTriggered) {
      reasons.push('Manual Consolidation override selected.');
    }

    insights.push({
      type: 'consolidation',
      title: 'Consolidation Day Triggered',
      message:
        reasons.join(' ') +
        ' No new chapter tomorrow. Schedule shifts to 6-chapter mixed recall, practical challenge, and error analysis.',
      variant: 'warning',
    });
  } else {
    insights.push({
      type: 'day-type',
      title: `${effectiveDayType} Day Scheduled`,
      message:
        questionnaire.dayTypeSelection !== 'Auto-Detect'
          ? `Manually overridden to ${effectiveDayType} (Auto-detected was ${detectedDayType}).`
          : `Tomorrow is ${tomorrowWeekday}, mapping to ${effectiveDayType} workflow.`,
      variant: 'info',
    });
  }

  // Energy & constraint insights
  if (tomorrowWeekday === 'Monday' || tomorrowWeekday === 'Thursday') {
    insights.push({
      type: 'energy',
      title: 'Fasting Day Protocol',
      message:
        'Fasting schedule active: IDE closes firmly at 15:15 for passive review. Energy conservation prioritized.',
      variant: 'accent' as unknown as 'info',
    });
  } else if (tomorrowWeekday === 'Friday') {
    insights.push({
      type: 'energy',
      title: 'Recovery Day Protocol',
      message:
        'Friday recovery workflow: Work session ends at 15:15; afternoon and evening are 100% OFF.',
      variant: 'success',
    });
  }

  // Rollover insight
  if (rolledOverReviews.length > 0) {
    const formattedRollovers = rolledOverReviews
      .map((r) => `Ch. ${r.chapterNumber} (${r.type})`)
      .join(', ');
    insights.push({
      type: 'rollover',
      title: 'Review Rollover Applied',
      message: `Unchecked reviews from tonight rolled forward into tomorrow's 06:00 alarm without altering original study dates: ${formattedRollovers}.`,
      variant: 'warning',
    });
  }

  // Coding pairing insight
  if (pairedCoding) {
    insights.push({
      type: 'pairing',
      title: 'Coding Pairing Rationale',
      message:
        pairedCoding.reason === 'carryover'
          ? `Paired Ch. ${pairedCoding.chapterNumber} for coding because coding exercises were flagged as unfinished carryover.`
          : pairedCoding.reason === 'weak'
            ? `Paired Ch. ${pairedCoding.chapterNumber} for coding to actively reinforce flagged weak subtopics.`
            : `Paired previous Ch. ${pairedCoding.chapterNumber} with tomorrow's target for progressive interleaving.`,
      variant: 'info',
    });
  }

  // Adaptive Missed Goal Protocol insight
  if (isAdaptiveReset && !isConsolidation) {
    if (missedReason === 'EMERGENCY') {
      insights.unshift({
        type: 'adaptive-reset',
        title: '🌿 Zero-Guilt Emergency Recovery',
        message:
          'Emergency / low capacity logged today. Tomorrow is de-escalated to a gentle recovery protocol. New chapter intake is paused so you can recharge without backlogged guilt.',
        variant: 'success',
      });
    } else if (missedReason === 'OVERWHELMED') {
      insights.unshift({
        type: 'adaptive-reset',
        title: '🛡️ Cognitive Anti-Avalanche Protocol',
        message: `Cognitive overload or exhaustion detected. Tomorrow shifts to low-friction consolidation of Chapter ${targetChapter} to protect mental energy and maintain steady momentum.`,
        variant: 'warning',
      });
    } else {
      insights.unshift({
        type: 'adaptive-reset',
        title: '🎯 Focused Catch-Up Protocol',
        message: `Today was off-track. The engine adapts tomorrow to master Chapter ${targetChapter} without piling on backlog pressure or guilt.`,
        variant: 'info',
      });
    }
  }

  // Format alarm strings
  const alarms = generateAlarmSlots({
    effectiveDayType,
    tomorrowWeekday,
    isConsolidation,
    isRepeat,
    isAdaptiveReset,
    missedReason,
    targetChapter,
    targetChapterTitle,
    topicName,
    dueD3,
    dueD7,
    dueD14,
    milestoneStart,
    milestoneEnd,
    weakChapterNumbers,
    pairedCoding,
    errorNotes: questionnaire.errorNotes.trim(),
  });

  let consolidationReason: string | undefined;
  if (isConsolidation) {
    if (milestoneReached && weakThresholdReached) {
      consolidationReason = 'Milestone (6 completed) & Weak Threshold (3+ weak)';
    } else if (milestoneReached) {
      consolidationReason = 'Milestone (6 completed chapters)';
    } else if (weakThresholdReached) {
      consolidationReason = `Weak Threshold (${weakChapters.length} weak chapters)`;
    } else {
      consolidationReason = 'Manual Override';
    }
  }

  return {
    tonightDate,
    tomorrowDate,
    tomorrowWeekday,
    detectedDayType,
    effectiveDayType,
    isConsolidation,
    consolidationReason,
    targetChapter,
    targetChapterTitle,
    topicName,
    isRepeat,
    isAdaptiveReset,
    alarms,
    insights,
    pairedCoding,
    dueReviewsTomorrow: {
      d3: dueD3,
      d7: dueD7,
      d14: dueD14,
    },
    rolledOverReviews,
  };
}

interface AlarmGenParams {
  effectiveDayType: DayType;
  tomorrowWeekday: string;
  isConsolidation: boolean;
  isRepeat: boolean;
  isAdaptiveReset?: boolean;
  missedReason?: MissedGoalReason;
  targetChapter: number;
  targetChapterTitle?: string;
  topicName?: string;
  dueD3: number[];
  dueD7: number[];
  dueD14: number[];
  milestoneStart: number;
  milestoneEnd: number;
  weakChapterNumbers: number[];
  pairedCoding?: PairedCodingInfo;
  errorNotes: string;
}

function generateAlarmSlots(params: AlarmGenParams): AlarmSlot[] {
  const {
    tomorrowWeekday,
    isConsolidation,
    isRepeat,
    isAdaptiveReset,
    missedReason,
    targetChapter,
    targetChapterTitle,
    topicName,
    dueD3,
    dueD7,
    dueD14,
    milestoneStart,
    milestoneEnd,
    weakChapterNumbers,
    pairedCoding,
    errorNotes,
  } = params;

  const titleSuffix =
    targetChapterTitle && targetChapterTitle !== `Chapter ${targetChapter}`
      ? ` - ${targetChapterTitle}`
      : '';
  const nextLabel = isRepeat
    ? `REPEAT: Ch. ${targetChapter}${titleSuffix}`
    : `NEW: Ch. ${targetChapter}${titleSuffix}`;
  const blindLabel = isRepeat
    ? `REPEAT Ch. ${targetChapter}${titleSuffix}`
    : `Ch. ${targetChapter}${titleSuffix}`;
  const pairedStr = pairedCoding ? pairedCoding.label : `Ch. ${Math.max(1, targetChapter - 1)}`;
  const errorSuffix = errorNotes ? ` [${errorNotes}]` : '';
  const errorParen = errorNotes ? ` / ${errorNotes}` : '';

  const d3Str = dueD3.length > 0 ? dueD3.join(', ') : 'None';
  const d7Str = dueD7.length > 0 ? dueD7.join(', ') : 'None';
  const d14Str = dueD14.length > 0 ? dueD14.join(', ') : 'None';

  const combinedD3D7 = Array.from(new Set([...dueD3, ...dueD7])).sort((a, b) => a - b);
  const combinedD3D7Str = combinedD3D7.length > 0 ? combinedD3D7.join(', ') : 'None';

  const combinedAll = Array.from(new Set([...dueD3, ...dueD7, ...dueD14])).sort((a, b) => a - b);
  const combinedAllStr = combinedAll.length > 0 ? combinedAll.join(', ') : 'None';

  const weakListStr =
    weakChapterNumbers.length > 0 ? `Ch. ${weakChapterNumbers.join(', ')}` : 'None';

  const isFastingWeekday = tomorrowWeekday === 'Monday' || tomorrowWeekday === 'Thursday';
  const isRecoveryWeekday = tomorrowWeekday === 'Friday';

  // --------------------------------------------------------------------------
  // CONSOLIDATION DAY
  // Preserving Fasting/Recovery time slots & energy constraints when overlapping
  // --------------------------------------------------------------------------
  if (isConsolidation) {
    if (isFastingWeekday) {
      // Fasting Day Consolidation
      return [
        {
          time: '06:00',
          title: `Weak Flashcards (${weakListStr}) + Mixed Quiz Ch. ${milestoneStart}–${milestoneEnd}`,
          badgeVariant: 'warning',
          badgeLabel: 'Consolidation · Fasting',
          description: 'Spaced review of flagged weak chapters followed by 6-chapter milestone quiz.',
        },
        {
          time: '09:30',
          title: `Guided Coding: Challenge Ch. ${milestoneStart}–${milestoneEnd}`,
          badgeVariant: 'warning',
          badgeLabel: 'Consolidation · Fasting',
          description: 'Multi-chapter practical coding challenge during high morning focus.',
        },
        {
          time: '15:15',
          title: `CLOSE IDE: Error Analysis (${errorNotes || 'Deep Dive'})`,
          badgeVariant: 'danger',
          badgeLabel: 'Energy Lock',
          description: 'Close code editor. Passive bug post-mortem and conceptual notes review.',
        },
        {
          time: '16:15',
          title: 'YouTube Queue Check',
          badgeVariant: 'info',
          badgeLabel: 'Fasting Queue',
          description: 'Curated technical video reviews and educational queue processing.',
        },
        {
          time: '19:30',
          title: 'Easy Job Applications',
          badgeVariant: 'neutral',
          badgeLabel: 'Evening Outbound',
          description: 'Low-friction job applications and outreach.',
        },
      ];
    }

    if (isRecoveryWeekday) {
      // Recovery Friday Consolidation
      return [
        {
          time: '06:00',
          title: `Consolidation Recall: Weak Flashcards (${weakListStr})`,
          badgeVariant: 'success',
          badgeLabel: 'Consolidation · Recovery',
          description: 'Active flashcard recall explicitly targeting weak chapters.',
        },
        {
          time: '08:15',
          title: `Mixed Quiz: Ch. ${milestoneStart}–${milestoneEnd} (6-Ch Milestone)`,
          badgeVariant: 'success',
          badgeLabel: 'Consolidation · Recovery',
          description: 'Comprehensive diagnostic quiz across the last 6 chapters.',
        },
        {
          time: '10:00',
          title: `Practical Coding Challenge: Ch. ${milestoneStart}–${milestoneEnd}`,
          badgeVariant: 'success',
          badgeLabel: 'Consolidation · Recovery',
          description: 'Integrated implementation exercise covering milestone chapters.',
        },
        {
          time: '15:15',
          title: 'OFF — Recovery',
          badgeVariant: 'neutral',
          badgeLabel: 'Recovery Rest',
          description: 'Work day ends. Full mental and physical rest until Saturday.',
        },
      ];
    }

    // Standard Day Consolidation (Tue, Wed, Sat, Sun)
    return [
      {
        time: '06:00',
        title: `Consolidation Recall: Weak Flashcards (${weakListStr}) | Mixed Review`,
        badgeVariant: 'danger',
        badgeLabel: 'Consolidation',
        description: 'Targeted flashcard review of weak chapters and cumulative recall.',
      },
      {
        time: '08:15',
        title: `Mixed Quiz: Ch. ${milestoneStart}–${milestoneEnd} (6-Ch Milestone)`,
        badgeVariant: 'danger',
        badgeLabel: 'Consolidation',
        description: 'Comprehensive mixed evaluation covering previous 6 chapters.',
      },
      {
        time: '10:00',
        title: `Practical Coding Challenge: Ch. ${milestoneStart}–${milestoneEnd}`,
        badgeVariant: 'danger',
        badgeLabel: 'Consolidation',
        description: 'Real-world coding challenge applying cross-chapter concepts.',
      },
      {
        time: '15:15',
        title: `Error Analysis${errorSuffix} / Upwork`,
        badgeVariant: 'accent',
        badgeLabel: 'Consolidation',
        description: 'Deep-dive into recorded bugs, edge cases, and client proposals.',
      },
      {
        time: '17:00',
        title: `Teaching Lock: Synthesis Short Ch. ${milestoneStart}–${milestoneEnd}`,
        badgeVariant: 'accent',
        badgeLabel: 'Synthesis Lock',
        description: 'Summarize the core breakthrough from this milestone in 60 seconds.',
      },
      {
        time: '19:30',
        title: 'Job Applications + Upwork Bids',
        badgeVariant: 'neutral',
        badgeLabel: 'Outbound',
        description: 'Outbound applications, customized pitches, and client proposals.',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // ADAPTIVE MISSED GOAL / DE-ESCALATION FLOW
  // Triggered when today's goal was missed and not overridden by consolidation
  // --------------------------------------------------------------------------
  if (isAdaptiveReset) {
    if (missedReason === 'EMERGENCY') {
      return [
        {
          time: '06:00',
          title: `GENTLE CATCH-UP: Ch. ${targetChapter}${titleSuffix} (Low-Friction Foundation)`,
          badgeVariant: 'success',
          badgeLabel: 'Adaptive Reset',
          description: 'Zero-pressure review of core concepts. Emergency recovery protocol active.',
        },
        {
          time: '08:15',
          title: `Light Recall / Flashcards: D-3 (${d3Str})`,
          badgeVariant: 'info',
          badgeLabel: 'Triage Flashcards',
          description: 'Prioritize only steepest-curve D-3 flashcards to protect memory without stress.',
        },
        {
          time: '10:00',
          title: `Micro-Drill: Ch. ${targetChapter} (1 Victory)`,
          badgeVariant: 'accent',
          badgeLabel: 'Micro Focus',
          description: 'One single small code victory or reading block to restore rhythm.',
        },
        {
          time: '15:15',
          title: 'OFF — Full Recovery & Rest',
          badgeVariant: 'neutral',
          badgeLabel: 'Rest Lock',
          description: 'Day complete. Rest, recharge, and return refreshed tomorrow without guilt.',
        },
      ];
    }

    if (missedReason === 'OVERWHELMED') {
      return [
        {
          time: '06:00',
          title: `DE-ESCALATE: Ch. ${targetChapter}${titleSuffix} | D-3 Recall (${d3Str})`,
          badgeVariant: 'warning',
          badgeLabel: 'De-escalation',
          description: 'Gentle start. New chapters paused; focus exclusively on solidifying today’s chapter.',
        },
        {
          time: '08:15',
          title: `Light Review: Ch. ${targetChapter} Core Concepts (No Quiz Pressure)`,
          badgeVariant: 'warning',
          badgeLabel: 'Stress Free',
          description: 'Review notes, diagrams, and mental models without grading pressure.',
        },
        {
          time: '10:00',
          title: `Focused Coding: Ch. ${targetChapter} Step-by-Step`,
          badgeVariant: 'accent',
          badgeLabel: 'Paced Coding',
          description: 'Slow-paced implementation block tackling the single hardest subtopic.',
        },
        {
          time: '15:15',
          title: `CLOSE IDE: Passive Review${errorParen}`,
          badgeVariant: 'danger',
          badgeLabel: 'Energy Lock',
          description: 'Close editor to prevent mental fatigue. Passive reading only.',
        },
        {
          time: '19:30',
          title: 'Relaxation / Mental Wind-Down',
          badgeVariant: 'neutral',
          badgeLabel: 'Recharge',
          description: 'Rest and disconnect to reset cognitive capacity.',
        },
      ];
    }

    // Default 'OFF_TRACK'
    return [
      {
        time: '06:00',
        title: `CATCH-UP: Ch. ${targetChapter}${titleSuffix} | D-3: ${d3Str} | D-7: ${d7Str}`,
        badgeVariant: 'accent',
        badgeLabel: 'Catch-Up Launch',
        description: 'Review critical due flashcards and re-engage with today’s target chapter.',
      },
      {
        time: '08:15',
        title: `Blind Recall Reset: Ch. ${targetChapter}${titleSuffix} + Quiz`,
        badgeVariant: 'accent',
        badgeLabel: 'Targeted Recall',
        description: 'Diagnostic quiz and closed-book retrieval practice to pinpoint gaps.',
      },
      {
        time: '10:00',
        title: `Coding Catch-Up: ${pairedStr} + Ch. ${targetChapter}`,
        badgeVariant: 'accent',
        badgeLabel: 'Focused Build',
        description: 'Finish incomplete coding exercises before moving on to new chapters.',
      },
      {
        time: '15:15',
        title: `Testing & Bug Triaging${errorSuffix} / Upwork`,
        badgeVariant: 'accent',
        badgeLabel: 'Hardening',
        description: 'Fix open bugs, test edge cases, and handle client proposals.',
      },
      {
        time: '17:00',
        title: `Teaching Lock: Quick Synthesis Ch. ${targetChapter}`,
        badgeVariant: 'accent',
        badgeLabel: 'Feynman Lock',
        description: 'Solidify understanding with a 60-second oral summary.',
      },
      {
        time: '19:30',
        title: 'Job Applications + Upwork Bids',
        badgeVariant: 'neutral',
        badgeLabel: 'Outbound',
        description: 'Consistent career pipeline outbound.',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // FASTING DAYS (Monday, Thursday)
  // --------------------------------------------------------------------------
  if (isFastingWeekday) {
    return [
      {
        time: '06:00',
        title: `D-3/D-7 Recall (${combinedD3D7Str}) + ${nextLabel} + Blind Test`,
        badgeVariant: 'warning',
        badgeLabel: 'Fasting Launch',
        description: 'Morning spaced reviews followed by active chapter introduction.',
      },
      {
        time: '09:30',
        title: `Guided Coding: ${pairedStr} + Ch. ${targetChapter}`,
        badgeVariant: 'warning',
        badgeLabel: 'Fasting Focus',
        description: 'Guided paired programming block during peak fasting alertness.',
      },
      {
        time: '15:15',
        title: `CLOSE IDE: Passive Review (Ch. ${targetChapter}${errorParen})`,
        badgeVariant: 'danger',
        badgeLabel: 'Energy Lock',
        description: 'Close code editor. Passive concept review, documentation, and error inspection.',
      },
      {
        time: '16:15',
        title: 'YouTube Queue Check',
        badgeVariant: 'info',
        badgeLabel: 'Fasting Queue',
        description: 'Curated technical video reviews and educational queue processing.',
      },
      {
        time: '19:30',
        title: 'Easy Job Applications',
        badgeVariant: 'neutral',
        badgeLabel: 'Low Friction',
        description: 'Low-cognitive load job outreach and networking messages.',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // RECOVERY DAY (Friday)
  // --------------------------------------------------------------------------
  if (isRecoveryWeekday) {
    return [
      {
        time: '06:00',
        title: `Recall (${combinedAllStr}) + ${nextLabel}`,
        badgeVariant: 'success',
        badgeLabel: 'Recovery Launch',
        description: 'Gentle spaced repetition recall followed by new chapter foundation.',
      },
      {
        time: '08:15',
        title: `Blind Recall: ${blindLabel} + Quiz`,
        badgeVariant: 'success',
        badgeLabel: 'Active Recall',
        description: 'Diagnostic recall check and quiz evaluation.',
      },
      {
        time: '10:00',
        title: `Interleaved Coding: ${pairedStr} + Ch. ${targetChapter}`,
        badgeVariant: 'success',
        badgeLabel: 'Interleaved Coding',
        description: 'Hands-on coding block interleaving prior concepts with target chapter.',
      },
      {
        time: '15:15',
        title: 'OFF — Recovery',
        badgeVariant: 'neutral',
        badgeLabel: 'Weekend Rest',
        description: 'Complete shutdown. Recharge cognitive energy for the weekend sprint.',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // STANDARD DAYS (Tuesday, Wednesday, Saturday, Sunday)
  // --------------------------------------------------------------------------
  return [
    {
      time: '06:00',
      title: `D-3: ${d3Str} | D-7: ${d7Str} | D-14: ${d14Str} | ${nextLabel}`,
      badgeVariant: 'accent',
      badgeLabel: 'Spaced Repetition',
      description: 'Systematic D-3, D-7, and D-14 spaced review check-off + daily launch.',
    },
    {
      time: '08:15',
      title: `Blind Recall: ${blindLabel} + Quiz`,
      badgeVariant: 'accent',
      badgeLabel: 'Blind Recall',
      description: 'Closed-book active recall and daily diagnostic quiz.',
    },
    {
      time: '10:00',
      title: `Coding: ${pairedStr} + Ch. ${targetChapter}`,
      badgeVariant: 'accent',
      badgeLabel: 'Deep Coding',
      description: 'Core implementation session pairing weak/carryover/previous code with new topics.',
    },
    {
      time: '15:15',
      title: `Testing / Refactoring${errorSuffix} / Upwork`,
      badgeVariant: 'accent',
      badgeLabel: 'Refactor & Bid',
      description: 'Test suite hardening, refactoring weak subtopics, and Upwork client proposals.',
    },
    {
      time: '17:00',
      title: `Teaching Lock: YouTube Short Ch. ${targetChapter}`,
      badgeVariant: 'accent',
      badgeLabel: 'Feynman Lock',
      description: 'Synthesize the concept into a concise 60-second explanation.',
    },
    {
      time: '19:30',
      title: 'Job Applications + Upwork Bids',
      badgeVariant: 'neutral',
      badgeLabel: 'Outbound',
      description: 'Career outbound pipeline: tailored proposals and applications.',
    },
  ];
}
