export type DateOrderMode = 'auto' | 'DMY' | 'MDY';
export type ResolvedDateOrder = 'DMY' | 'MDY' | 'YMD';

export type MediaCategory =
  | 'audio'
  | 'image'
  | 'video'
  | 'sticker'
  | 'document'
  | 'gif'
  | 'contact'
  | 'generic_media';

export interface ZipMediaEntry {
  fileName: string;
  fullPath: string;
  category: MediaCategory;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  uncompressedBytes: number;
  compressedBytes: number;
  durationSeconds?: number;
  base64Data?: string;
  previewUrl?: string;
  transcript?: string;
}

export interface DateDetectionSummary {
  resolvedOrder: ResolvedDateOrder;
  modeUsed: DateOrderMode;
  confidence: 'high' | 'medium' | 'ambiguous';
  reason: string;
  definitiveDmyCount: number;
  definitiveMdyCount: number;
  ambiguousDateCount: number;
  headerStyle: 'ios-bracket' | 'android-dash' | 'mixed';
}

export interface ArchiveExtractionResult {
  fileName: string;
  sourceType: 'txt' | 'zip' | 'demo';
  transcriptFileName: string;
  rawText: string;
  cleanedCharCount: number;
  strippedInvisibleChars: number;
  skippedMediaFiles: string[];
  skippedMediaCount: number;
  totalZipEntries: number;
  mediaEntries?: ZipMediaEntry[];
  extractedAudioFiles?: ZipMediaEntry[];
  totalMediaBytes?: number;
}

export interface ParsedChatMessage {
  id: string;
  index: number;
  timestampMs: number;
  isoDate: string; // YYYY-MM-DD
  hour: number; // 0..23
  dayOfWeek: number; // 0 (Mon) .. 6 (Sun)
  sender: string;
  text: string;
  isMedia: boolean;
  mediaCategory?: MediaCategory | null;
  attachedFileName?: string | null;
  mediaBytes?: number;
  audioDurationSeconds?: number;
  audioTranscript?: string;
  audioTranslation?: string;
  audioLanguage?: string;
  audioTone?: string;
  isDeleted: boolean;
  wordCount: number;
  charCount: number;
  emojis: string[];
  hasLink: boolean;
  isQuestion: boolean;
  isMultiline: boolean;
}

export interface SystemNotice {
  timestampMs: number | null;
  text: string;
  lineNumber: number;
}

export interface ParseTranscriptResult {
  messages: ParsedChatMessage[];
  systemNotices: SystemNotice[];
  participants: string[];
  dateDetection: DateDetectionSummary;
  strippedInvisibleChars: number;
  rawLineCount: number;
  multilineContinuationCount: number;
}

export interface WordFrequencyItem {
  word: string;
  count: number;
  sharePct: number;
  byParticipant: Record<string, number>;
}

export interface EmojiFrequencyItem {
  emoji: string;
  count: number;
  sharePct: number;
  byParticipant: Record<string, number>;
}

export type ReplyBucketKey =
  'under_1m' | '1m_to_5m' | '5m_to_15m' | '15m_to_60m' | '1h_to_6h' | 'over_6h';

export interface ReplyTimeBucket {
  key: ReplyBucketKey;
  label: string;
  count: number;
  percentage: number;
}

export interface ParticipantAnalytics {
  name: string;
  initials: string;
  accentColor: string;
  messageCount: number;
  messageSharePct: number;
  wordCount: number;
  writtenWordCount: number;
  wordSharePct: number;
  charCount: number;
  avgWordsPerMessage: number;
  avgCharsPerMessage: number;
  mediaCount: number;
  audioCount: number;
  imageCount: number;
  videoCount: number;
  stickerCount: number;
  documentCount: number;
  totalAudioDurationSeconds: number;
  transcribedAudioCount: number;
  transcribedAudioWords: number;
  audioWordSharePct: number;
  speakingRateWpm: number;
  deletedCount: number;
  linkCount: number;
  questionCount: number;
  multilineCount: number;
  emojiCount: number;
  // Vocabulary & Linguistic Depth
  uniqueWordCount: number;
  vocabularyRichnessPct: number;
  exclusiveWords: Array<{ word: string; count: number }>;
  messageLengthBreakdown: {
    shortCount: number;
    mediumCount: number;
    longCount: number;
    paragraphCount: number;
  };
  // Sentiment, Humor, Affection & Politeness
  laughterCount: number;
  affectionCount: number;
  apologyCount: number;
  gratitudeCount: number;
  exclamationCount: number;
  capsLockCount: number;
  sentimentPositivePct: number;
  sentimentNeutralPct: number;
  sentimentNegativePct: number;
  // Circadian Chronotype
  chronotypeLabel: string;
  morningPct: number;
  afternoonPct: number;
  eveningPct: number;
  nightOwlPct: number;
  // Reply, Initiation & Closing Dynamics
  initiationCount: number;
  initiationSharePct: number;
  closingCount: number;
  closingSharePct: number;
  unansweredOver6hCount: number;
  replyCount: number;
  meanReplySeconds: number;
  medianReplySeconds: number;
  fastestReplySeconds: number;
  slowestReplySeconds: number;
  repliesUnder1MinPct: number;
  repliesUnder5MinPct: number;
  doubleTextCount: number;
  doubleTextIndexPct: number; // % of own messages sent after 5m+ gap without reply
  avgBurstLength: number; // avg consecutive messages per turn
  longestBurstCount: number;
  longestMessageChars: number;
  replyBuckets: ReplyTimeBucket[];
  topWords: Array<{ word: string; count: number }>;
  topEmojis: Array<{ emoji: string; count: number }>;
}

export interface StreakSpan {
  startDate: string;
  endDate: string;
  days: number;
  totalMessages: number;
}

export interface PeakDayRecord {
  date: string;
  messageCount: number;
  wordCount: number;
}

export interface TimelinePoint {
  period: string; // YYYY-MM-DD or YYYY-MM
  label: string;
  totalMessages: number;
  totalWords: number;
  byParticipant: Record<string, number>;
}

export interface StreaksAndTimelineAnalytics {
  firstMessageDate: string;
  lastMessageDate: string;
  totalCalendarDays: number;
  activeDays: number;
  silentDays: number;
  activeDaysPct: number;
  longestStreak: StreakSpan;
  currentStreak: StreakSpan;
  longestSilentGapDays: number;
  peakDays: PeakDayRecord[];
  dailyTimeline: TimelinePoint[];
  monthlyTimeline: TimelinePoint[];
  avgMessagesPerCalendarDay: number;
  avgMessagesPerActiveDay: number;
}

export interface HeatmapAnalytics {
  /** 7 rows (0=Mon .. 6=Sun) x 24 cols (00..23) */
  matrix: number[][];
  maxCellValue: number;
  byDayOfWeek: Array<{
    dayIndex: number;
    dayName: string;
    shortName: string;
    count: number;
    pct: number;
  }>;
  byHourOfDay: Array<{
    hour: number;
    label: string;
    count: number;
    pct: number;
  }>;
  peakDayName: string;
  peakHourLabel: string;
  lateNightPct: number; // 23:00 - 04:59
}

export interface VoiceNoteItem {
  id: string;
  messageId: string;
  fileName: string;
  sender: string;
  isoDate: string;
  timestampLabel: string;
  sizeBytes: number;
  durationSeconds: number;
  mimeType: string;
  previewUrl?: string;
  base64Data?: string;
  transcript?: string;
  translation?: string;
  detectedLanguage?: string;
  tone?: string;
  transcriptWordCount: number;
}

export interface MediaGalleryItem {
  id: string;
  fileName: string;
  category: MediaCategory;
  sender: string;
  isoDate: string;
  timestampLabel: string;
  sizeBytes: number;
  mimeType: string;
  previewUrl?: string;
  durationSeconds?: number;
}

export interface MediaAnalyticsSummary {
  totalMediaMessages: number;
  totalArchiveMediaFiles: number;
  totalArchiveMediaBytes: number;
  byCategory: Record<MediaCategory, number>;
  bytesByCategory: Record<MediaCategory, number>;
  totalAudioDurationSeconds: number;
  avgAudioDurationSeconds: number;
  transcribedVoiceNoteCount: number;
  translatedVoiceNoteCount: number;
  transcribedWordsAdded: number;
  voiceNotes: VoiceNoteItem[];
  mediaGallery: MediaGalleryItem[];
}

export type AnalyticsBasisMode = 'text_and_audio' | 'text_only';

export interface AnalyticsBasisSummary {
  mode: AnalyticsBasisMode;
  hasVoiceNotesInChat: boolean;
  totalVoiceNotes: number;
  transcribedVoiceNotes: number;
  translatedVoiceNotes: number;
  writtenWordsCount: number;
  spokenAudioWordsCount: number;
  translatedAudioWordsCount: number;
  effectiveTotalWords: number;
  audioShareOfTotalWordsPct: number;
  detectedAudioLanguages: string[];
  badgeLabel: string;
  description: string;
}

export interface PhraseFrequencyItem {
  phrase: string;
  count: number;
  byParticipant: Record<string, number>;
}

export interface SharedDomainItem {
  domain: string;
  count: number;
  byParticipant: Record<string, number>;
}

export interface DeepBehavioralAnalytics {
  symmetryScore: number; // 0..100
  momentumScore: number; // 0..100
  expressivenessScore: number; // 0..100
  consistencyScore: number; // 0..100
  overallChemistryScore: number; // 0..100
  totalSessions: number;
  avgSessionDurationMinutes: number;
  avgMessagesPerSession: number;
  longestSession: {
    date: string;
    durationMinutes: number;
    messageCount: number;
    wordCount: number;
  };
  overallSentiment: {
    positivePct: number;
    neutralPct: number;
    negativePct: number;
    totalLaughterCount: number;
    totalAffectionCount: number;
    totalApologyCount: number;
    totalGratitudeCount: number;
  };
  topBigrams: PhraseFrequencyItem[];
  topTrigrams: PhraseFrequencyItem[];
  topDomains: SharedDomainItem[];
  weekdayMessages: number;
  weekendMessages: number;
  weekendSharePct: number;
  firstHalfMessages: number;
  secondHalfMessages: number;
  momentumDeltaPct: number;
  momentumLabel: string;
}

export interface WrappedSummaryData {
  chatTitle: string;
  dateRangeLabel: string;
  totalMessages: number;
  totalWords: number;
  activeDays: number;
  longestStreakDays: number;
  topInitiator: { name: string; pct: number };
  fastestResponder: { name: string; medianSeconds: number };
  topChatter: { name: string; pct: number };
  doubleTextChampion: { name: string; indexPct: number };
  signatureEmojis: string[];
  signatureWords: string[];
  peakTimePersona: string;
  vibeBadge: string;
}

export interface ChatAnalysisReport {
  chatTitle: string;
  sourceInfo: {
    fileName: string;
    sourceType: 'txt' | 'zip' | 'demo';
    transcriptFileName: string;
    skippedMediaCount: number;
    skippedMediaFiles: string[];
    strippedInvisibleChars: number;
    totalMediaBytes?: number;
  };
  analyticsBasis: AnalyticsBasisSummary;
  dateDetection: DateDetectionSummary;
  sessionGapMinutes: number;
  totalMessages: number;
  totalWords: number;
  writtenWordsCount: number;
  spokenAudioWordsCount: number;
  totalChars: number;
  totalMedia: number;
  totalDeleted: number;
  totalLinks: number;
  totalEmojis: number;
  systemNoticeCount: number;
  participants: ParticipantAnalytics[];
  mediaAnalytics: MediaAnalyticsSummary;
  deepAnalytics: DeepBehavioralAnalytics;
  overallReplyBuckets: ReplyTimeBucket[];
  topWords: WordFrequencyItem[];
  topEmojis: EmojiFrequencyItem[];
  streaksAndTimeline: StreaksAndTimelineAnalytics;
  heatmap: HeatmapAnalytics;
  wrapped: WrappedSummaryData;
}

export interface N8nWebhookSettings {
  webhookUrl: string;
  authHeaderName: string;
  authHeaderValue: string;
  sampleSize: number;
  includeQuantitativeSummary: boolean;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastLatencyMs: number | null;
}

export interface AiSampledWindow {
  phase:
    | 'opening'
    | 'high_density'
    | 'late_night'
    | 'vulnerability_or_conflict'
    | 'recent';
  label: string;
  startDate: string;
  messages: Array<{
    timestamp: string;
    sender: string;
    text: string;
  }>;
}

export interface AiWebhookPayload {
  action: 'analyze_whatsapp_chat';
  generatedAt: string;
  chatTitle: string;
  quantitativeMetrics: {
    totalMessages: number;
    totalWords: number;
    activeDays: number;
    longestStreakDays: number;
    lateNightPct: number;
    mediaBreakdown?: {
      totalMediaMessages: number;
      audioVoiceNotes: number;
      totalAudioDurationSeconds: number;
      transcribedAudioCount: number;
      images: number;
      videos: number;
      stickers: number;
      documents: number;
    };
    participants: Array<{
      name: string;
      messageSharePct: number;
      avgWordsPerMessage: number;
      initiationSharePct: number;
      medianReplySeconds: number;
      doubleTextIndexPct: number;
      questionCount: number;
      audioCount?: number;
      imageCount?: number;
      videoCount?: number;
      topEmojis: string[];
      topWords: string[];
    }>;
  };
  sampledWindows: AiSampledWindow[];
}

export interface ParticipantBehavioralProfile {
  name: string;
  attachmentStyle: string;
  communicationArchetype: string;
  dominantTraits: string[];
  emotionalCadence: string;
}

export interface BehavioralFlag {
  type: 'green' | 'amber' | 'red';
  title: string;
  evidence: string;
  impact: string;
}

export interface AiRelationshipAnalysis {
  provider: string;
  analyzedAt: string;
  isFallbackSimulation: boolean;
  executiveSummary: string;
  relationshipDynamicTitle: string;
  reciprocityScore: number; // 0..100
  emotionalSafetyScore: number; // 0..100
  engagementVelocityScore: number; // 0..100
  mutualInterestBreakdown: {
    balanceLabel: string;
    initiationAnalysis: string;
    responseLatencyAnalysis: string;
    investmentDepthAnalysis: string;
  };
  participantProfiles: ParticipantBehavioralProfile[];
  flags: BehavioralFlag[];
  conflictAndRepairStyle: string;
  recommendations: string[];
}
