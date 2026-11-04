export interface Topic {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Chapter {
  /** 1-based chapter number */
  chapterNumber: number;
  /** Title or subject of the chapter, e.g. "B-Trees & LSM-Trees" */
  title: string;
  /** Optional topic ID this chapter belongs to */
  topicId?: string;
  /** Optional topic display name */
  topicName?: string;
  /** YYYY-MM-DD - immutable once completed */
  originalStudyDate: string;
  /** originalStudyDate + 3 days - Flashcards */
  d3Date: string;
  /** originalStudyDate + 7 days - Quiz */
  d7Date: string;
  /** originalStudyDate + 14 days - Oral Recall */
  d14Date: string;
  d3Completed: boolean;
  d7Completed: boolean;
  d14Completed: boolean;
  quizScorePercent: number;
  quizQuestionsMissed: number;
  /** Auto-flagged true if quizQuestionsMissed >= 3 OR quizScorePercent < 75 */
  isWeak: boolean;
  /** True if coding exercises for this chapter weren't finished cleanly */
  codingCarryover: boolean;
  /** Specific weak subtopics / bugs from that day */
  errorNotes: string;
}

export interface CollapsedSectionsState {
  banner?: boolean;
  checklist?: boolean;
  questionnaire?: boolean;
  schedule?: boolean;
  notifications?: boolean;
  outlook?: boolean;
  topicSummary?: boolean;
  guidePrinciples?: boolean;
  guideTimeline?: boolean;
  guideRoutine?: boolean;
  referenceAlarms?: boolean;
}

export interface DayReviewForecast {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  isToday: boolean;
  isTomorrow: boolean;
  dayType: DayType;
  reviews: DueReviewItem[];
  hasHighLoad: boolean;
  isMilestoneDay: boolean;
}

export interface ParsedChapterOutlineItem {
  chapterNumber: number;
  title: string;
}

export interface RecallPracticePrompt {
  chapterNumber: number;
  chapterTitle: string;
  topicName?: string;
  topicDescription?: string;
  reviewType: 'D-3' | 'D-7' | 'D-14';
  previousQuizScore?: number;
  isWeak?: boolean;
  errorNotes?: string;
  retrievalPrompt: string;
}

export interface DocParseResult {
  success: boolean;
  topicName?: string;
  topicDescription?: string;
  totalChapters: number;
  outlineText: string;
  chapters?: Chapter[];
  error?: string;
}

export const DEFAULT_N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/parse-chapter-doc';

export interface NightlySystemState {
  /** Tracks when the last Consolidation Day occurred (by chapter milestone, e.g. 0, 6, 12) */
  lastConsolidationAtChapter: number;
  /** 9 boolean steps for the nightly ritual */
  checklistState: boolean[];
  /** Active filtered topic ID (or 'all' for all topics) */
  selectedTopicId?: string;
  /** Custom user topics */
  topics?: Topic[];
  /** Whether browser push/alarm notifications are enabled */
  notificationsEnabled?: boolean;
  /** Collapsible UI sections state */
  collapsedSections?: CollapsedSectionsState;
  /** Configured n8n webhook URL for document parsing */
  n8nWebhookUrl?: string;
}

export type TodayCompletionStatus =
  | 'YES'
  | 'NO'
  | 'MISSED_GOALS'
  | 'CONSOLIDATION_COMPLETED_TODAY';

export type MissedGoalReason =
  | 'OFF_TRACK'
  | 'OVERWHELMED'
  | 'EMERGENCY';

export type DayType =
  | 'Standard'
  | 'Fasting'
  | 'Recovery'
  | 'Consolidation';

export type DayTypeSelection = 'Auto-Detect' | DayType;

export interface DueReviewItem {
  chapterNumber: number;
  chapterTitle?: string;
  topicName?: string;
  type: 'D-3' | 'D-7' | 'D-14';
  dueDate: string;
  isOverdue: boolean;
}

export interface QuestionnaireInput {
  tonightDate: string; // YYYY-MM-DD
  targetChapterNumber: number;
  targetChapterTitle: string;
  topicId?: string;
  topicName?: string;
  completionStatus: TodayCompletionStatus;
  missedReason?: MissedGoalReason;
  quizQuestionsMissed: number;
  quizScorePercent: number;
  codingProgress: 'CLEAN' | 'CARRYOVER';
  /** List of due review keys marked as completed tonight: e.g. "Ch4_D3" */
  completedReviewsTonight: string[];
  errorNotes: string;
  dayTypeSelection: DayTypeSelection;
}

export interface AlarmSlot {
  time: string; // "06:00", "08:15", etc.
  title: string;
  badgeVariant: 'accent' | 'warning' | 'success' | 'danger' | 'info' | 'neutral';
  badgeLabel: string;
  description: string;
}

export interface AlgorithmInsight {
  type: 'consolidation' | 'day-type' | 'carryover' | 'rollover' | 'pairing' | 'energy' | 'adaptive-reset';
  title: string;
  message: string;
  variant: 'info' | 'success' | 'warning' | 'danger';
}

export interface PairedCodingInfo {
  chapterNumber: number;
  chapterTitle?: string;
  reason: 'carryover' | 'weak' | 'previous';
  label: string;
}

export interface NightlyDecisionResult {
  tonightDate: string;
  tomorrowDate: string;
  tomorrowWeekday: string;
  detectedDayType: DayType;
  effectiveDayType: DayType;
  isConsolidation: boolean;
  consolidationReason?: string;
  targetChapter: number;
  targetChapterTitle?: string;
  topicName?: string;
  isRepeat: boolean;
  isAdaptiveReset?: boolean;
  adaptiveMessage?: string;
  alarms: AlarmSlot[];
  insights: AlgorithmInsight[];
  pairedCoding?: PairedCodingInfo;
  dueReviewsTomorrow: {
    d3: number[];
    d7: number[];
    d14: number[];
  };
  rolledOverReviews: DueReviewItem[];
}

export interface NightlyAppState {
  chapters: Chapter[];
  systemState: NightlySystemState;
  questionnaire: QuestionnaireInput;
  lastDecision?: NightlyDecisionResult;
}

export const NIGHTLY_CHECKLIST_STEPS = [
  "1. Record today's completed chapter and original study date",
  "2. Record today's quiz score and weak chapters",
  '3. Check chapters due for D-3 flashcards',
  '4. Check chapters due for D-7 quizzes',
  '5. Check chapters due for D-14 oral recall',
  "6. Determine tomorrow's day type",
  '7. Check whether tomorrow is a consolidation day',
  '8. Generate and update alarm titles',
  '9. Verify all alarm times in phone Clock app',
] as const;

export interface PermanentAlarmReference {
  time: string;
  name: string;
  daysActive: string;
  purpose: string;
  energyConstraint?: string;
}

export const PERMANENT_PHONE_ALARMS: readonly PermanentAlarmReference[] = [
  {
    time: '06:00',
    name: 'Morning Recall & Daily Launch',
    daysActive: 'Every Day (Mon - Sun)',
    purpose: 'Spaced repetition recall (D-3, D-7, D-14) + launch new/repeat chapter foundation.',
  },
  {
    time: '08:15',
    name: 'Blind Recall & Quiz',
    daysActive: 'Standard & Recovery Days (Tue, Wed, Fri, Sat, Sun)',
    purpose: 'Closed-book active recall and diagnostic quiz for the active chapter.',
  },
  {
    time: '09:30',
    name: 'Guided Coding (Fasting)',
    daysActive: 'Fasting Days (Mon, Thu)',
    purpose: 'Paced, guided coding session paired with prior weak/carryover chapter during fasting state.',
  },
  {
    time: '10:00',
    name: 'Interleaved Coding Challenge',
    daysActive: 'Standard & Recovery Days (Tue, Wed, Fri, Sat, Sun)',
    purpose: 'Deep implementation block pairing previous/weak/carryover concepts with new chapter code.',
  },
  {
    time: '15:15',
    name: 'Afternoon Transition / Testing / Off',
    daysActive: 'Every Day (Mon - Sun)',
    purpose: 'Energy checkpoint: Testing/Refactoring on Standard days, CLOSE IDE passive review on Fasting days, 100% OFF on Recovery Friday.',
    energyConstraint: 'Fasting: Close IDE! Recovery: Day finishes here.',
  },
  {
    time: '16:15',
    name: 'YouTube Queue Check (Fasting)',
    daysActive: 'Fasting Days (Mon, Thu)',
    purpose: 'Curated technical video reviews and educational queue processing.',
  },
  {
    time: '17:00',
    name: 'Teaching Lock: YouTube Short',
    daysActive: 'Standard Days (Tue, Wed, Sat, Sun)',
    purpose: 'Feynman Technique: record or script a 60-second explanation of today’s concept to lock in mastery.',
  },
  {
    time: '19:30',
    name: 'Job Applications & Upwork Bids',
    daysActive: 'Standard & Fasting Days (Mon, Tue, Wed, Thu, Sat, Sun)',
    purpose: 'Career outbound pipeline: customized proposals, applications, client follow-ups.',
  },
];
