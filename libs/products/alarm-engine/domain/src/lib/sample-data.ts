import { calculateSpacedRepetitionDates, todayYmd } from './dates';
import type {
  Chapter,
  NightlyAppState,
  QuestionnaireInput,
  Topic,
} from './models';

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'general',
    name: 'General',
    description:
      'Core engineering foundations, multidisciplinary reading, and general technical skills.',
    color: '#6366f1',
  },
  {
    id: 'system-design',
    name: 'System Design',
    description:
      'Distributed systems, high-availability architecture, caching, consensus, and database scaling.',
    color: '#06b6d4',
  },
  {
    id: 'algorithms',
    name: 'Algorithms & Structures',
    description:
      'Data structures, dynamic programming, graph algorithms, and computational complexity analysis.',
    color: '#10b981',
  },
];

/**
 * Returns an empty chapters array by default so the user starts with a clean slate.
 */
export function createStarterChapters(): Chapter[] {
  return [];
}

/**
 * Optional demo dataset in case the user explicitly wants to preview the algorithm in action.
 */
export function createDemoChapters(): Chapter[] {
  const dates = [
    '2026-10-18',
    '2026-10-21',
    '2026-10-24',
    '2026-10-28',
    '2026-11-01',
  ];

  return [
    {
      chapterNumber: 1,
      title: 'TCP/IP & Network Primitives',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[0],
      ...calculateSpacedRepetitionDates(dates[0]),
      d3Completed: true,
      d7Completed: true,
      d14Completed: true,
      quizScorePercent: 92,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: '',
    },
    {
      chapterNumber: 2,
      title: 'Memory Management & Pointers',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[1],
      ...calculateSpacedRepetitionDates(dates[1]),
      d3Completed: true,
      d7Completed: true,
      d14Completed: false,
      quizScorePercent: 68,
      quizQuestionsMissed: 4,
      isWeak: true,
      codingCarryover: false,
      errorNotes: 'Pointer arithmetic overflow',
    },
    {
      chapterNumber: 3,
      title: 'Concurrency & Lock-Free Caches',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[2],
      ...calculateSpacedRepetitionDates(dates[2]),
      d3Completed: true,
      d7Completed: true,
      d14Completed: false,
      quizScorePercent: 88,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: 'Mutex deadlocks in concurrent cache',
    },
    {
      chapterNumber: 4,
      title: 'Ring Buffers & Event Loops',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[3],
      ...calculateSpacedRepetitionDates(dates[3]),
      d3Completed: true,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 82,
      quizQuestionsMissed: 2,
      isWeak: false,
      codingCarryover: false,
      errorNotes: 'Ring buffer off-by-one',
    },
    {
      chapterNumber: 5,
      title: 'WebSocket Handshakes & Heartbeats',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[4],
      ...calculateSpacedRepetitionDates(dates[4]),
      d3Completed: false,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 85,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: true,
      errorNotes: 'WebSocket heartbeat timeout',
    },
  ];
}

/**
 * 1-Week Walkthrough dataset matching the educational guide.
 */
export function createOneWeekWalkthroughChapters(): Chapter[] {
  const dates = [
    '2026-10-26', // Mon: Ch 1
    '2026-10-27', // Tue: Ch 2 (weak, carryover)
    '2026-10-28', // Wed: Ch 3
    '2026-10-29', // Thu: Ch 4 (Ch 1 D-3 due)
    '2026-10-30', // Fri: Ch 5
    '2026-11-01', // Sun: Ch 6 (Consolidation trigger!)
  ];

  return [
    {
      chapterNumber: 1,
      title: 'TCP/IP & Socket Architecture',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[0],
      ...calculateSpacedRepetitionDates(dates[0]),
      d3Completed: true,
      d7Completed: true,
      d14Completed: false,
      quizScorePercent: 95,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: '',
    },
    {
      chapterNumber: 2,
      title: 'Memory Management & Pointer Arithmetic',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[1],
      ...calculateSpacedRepetitionDates(dates[1]),
      d3Completed: true,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 65,
      quizQuestionsMissed: 4,
      isWeak: true,
      codingCarryover: true,
      errorNotes: 'Pointer overflow in ring buffer',
    },
    {
      chapterNumber: 3,
      title: 'Concurrency & Lock-Free Caches',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[2],
      ...calculateSpacedRepetitionDates(dates[2]),
      d3Completed: true,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 88,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: 'CAS retry backoff',
    },
    {
      chapterNumber: 4,
      title: 'Event Loops & Ring Buffers',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[3],
      ...calculateSpacedRepetitionDates(dates[3]),
      d3Completed: false,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 82,
      quizQuestionsMissed: 2,
      isWeak: false,
      codingCarryover: false,
      errorNotes: '',
    },
    {
      chapterNumber: 5,
      title: 'WebSockets & Heartbeat Monitors',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[4],
      ...calculateSpacedRepetitionDates(dates[4]),
      d3Completed: false,
      d7Completed: false,
      d14Completed: false,
      quizScorePercent: 85,
      quizQuestionsMissed: 1,
      isWeak: false,
      codingCarryover: false,
      errorNotes: 'Heartbeat timeout threshold',
    },
    {
      chapterNumber: 6,
      title: 'Distributed Consensus & Raft',
      topicId: 'system-design',
      topicName: 'System Design',
      originalStudyDate: dates[5],
      ...calculateSpacedRepetitionDates(dates[5]),
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
}

export function createDefaultQuestionnaire(
  tonightDate = todayYmd(),
): QuestionnaireInput {
  return {
    tonightDate,
    targetChapterNumber: 1,
    targetChapterTitle: '',
    topicId: 'general',
    topicName: 'General',
    completionStatus: 'YES',
    missedReason: 'OFF_TRACK',
    quizQuestionsMissed: 0,
    quizScorePercent: 100,
    codingProgress: 'CLEAN',
    completedReviewsTonight: [],
    errorNotes: '',
    dayTypeSelection: 'Auto-Detect',
  };
}

export function createStarterAppState(): NightlyAppState {
  return {
    chapters: [],
    systemState: {
      lastConsolidationAtChapter: 0,
      checklistState: new Array(9).fill(false),
      selectedTopicId: 'all',
      topics: DEFAULT_TOPICS,
    },
    questionnaire: createDefaultQuestionnaire(),
  };
}
