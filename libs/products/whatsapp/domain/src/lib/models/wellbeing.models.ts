/** One participant's day, scored with the shared sentiment lexicon. */
export interface DailyMoodPoint {
  date: string; // YYYY-MM-DD
  messageCount: number;
  positiveMessages: number;
  negativeMessages: number;
  /** (positive - negative) / messageCount, from -1 to 1. */
  netTone: number;
  averageWords: number;
  /** Median seconds this person took to answer the other side that day, or null. */
  medianReplySeconds: number | null;
}

export interface ParticipantMoodSeries {
  sender: string;
  points: DailyMoodPoint[];
}

export type CheckInReason =
  'lower_tone' | 'slower_replies' | 'shorter_messages' | 'fewer_messages';

/** A stretch where someone's messages read rougher than their own usual. Not a diagnosis. */
export interface CheckInWindow {
  sender: string;
  startDate: string;
  endDate: string;
  flaggedDays: number;
  reasons: CheckInReason[];
}

/** Only whether and when crisis language appeared; never the message text. */
export interface CrisisLanguageSignal {
  detected: boolean;
  dates: string[];
  senders: string[];
}

export interface WellbeingSummary {
  series: ParticipantMoodSeries[];
  checkInWindows: CheckInWindow[];
  crisisSignal: CrisisLanguageSignal;
}

export interface CyclePeriodEntry {
  start: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD, inclusive
}

/**
 * Dates entered by the partner (or with her agreement). Never inferred from
 * chat content, stored on-device only and never sent to any AI provider.
 */
export interface CycleProfile {
  conversationId: string;
  partnerName: string;
  consentConfirmedAt: string; // ISO timestamp
  periods: CyclePeriodEntry[];
  updatedAt: string;
}

export type CycleConfidence = 'none' | 'low' | 'medium' | 'high';

export interface CyclePrediction {
  averageCycleDays: number;
  averagePeriodDays: number;
  basedOnCycles: number;
  variabilityDays: number;
  confidence: CycleConfidence;
  nextStart: string | null;
  nextEnd: string | null;
  premenstrualStart: string | null;
}

export type CyclePhase =
  'period' | 'premenstrual' | 'predicted_period' | 'other';
