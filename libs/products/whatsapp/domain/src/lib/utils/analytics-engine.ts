import {
  AnalyticsBasisMode,
  AnalyticsBasisSummary,
  ArchiveExtractionResult,
  ChatAnalysisReport,
  DateOrderMode,
  DeepBehavioralAnalytics,
  EmojiFrequencyItem,
  HeatmapAnalytics,
  MediaAnalyticsSummary,
  MediaCategory,
  MediaGalleryItem,
  ParticipantAnalytics,
  PeakDayRecord,
  PhraseFrequencyItem,
  ReplyBucketKey,
  ReplyTimeBucket,
  SharedDomainItem,
  StreaksAndTimelineAnalytics,
  StreakSpan,
  TimelinePoint,
  VoiceNoteItem,
  WordFrequencyItem,
  WrappedSummaryData,
  ZipMediaEntry,
} from '../models/whatsapp.models';
import { buildStopwordSet, tokenizeChatWords } from './stopwords.data';
import {
  classifyMediaText,
  countWordsInText,
  enrichMessageMetrics,
  parseWhatsAppTranscript,
} from './whatsapp-parser';

const PARTICIPANT_ACCENT_COLORS = [
  '#25D366', // WhatsApp Emerald
  '#38BDF8', // Sky Cyan
  '#A78BFA', // Violet
  '#F59E0B', // Amber
  '#F472B6', // Pink
  '#34D399', // Mint
];

const DAY_NAMES: ReadonlyArray<{ full: string; short: string }> = [
  { full: 'Monday', short: 'Mon' },
  { full: 'Tuesday', short: 'Tue' },
  { full: 'Wednesday', short: 'Wed' },
  { full: 'Thursday', short: 'Thu' },
  { full: 'Friday', short: 'Fri' },
  { full: 'Saturday', short: 'Sat' },
  { full: 'Sunday', short: 'Sun' },
];

const REPLY_BUCKET_DEFS: ReadonlyArray<{
  key: ReplyBucketKey;
  label: string;
  maxSeconds: number;
}> = [
  { key: 'under_1m', label: '< 1 min', maxSeconds: 60 },
  { key: '1m_to_5m', label: '1–5 min', maxSeconds: 300 },
  { key: '5m_to_15m', label: '5–15 min', maxSeconds: 900 },
  { key: '15m_to_60m', label: '15–60 min', maxSeconds: 3600 },
  { key: '1h_to_6h', label: '1–6 hrs', maxSeconds: 21600 },
  { key: 'over_6h', label: '> 6 hrs', maxSeconds: Number.POSITIVE_INFINITY },
];

// Multilingual lexicons (English, French, Arabic / Tunisian Derja, Spanish)
const LAUGHTER_REGEX =
  /\b(h+a+h+a+|h+e+h+e+|l+o+l+|l+m+a+o+|rofl|m+d+r+|p+t+d+r+|j+a+j+a+|h{3,})\b|[😂🤣😹💀😆]|ه{3,}/giu;

const AFFECTION_REGEX =
  /\b(love|miss\s+you|adore|sweetheart|darling|babe|baby|honey|xoxo|bisou|bisous|chéri|cheri|chérie|cherie|mon\s+coeu?r|mon\s+amour|je\s+t'aime|habibi|habibti|hbibi|nhbek|nhebek|n7ebek|nmout\s+alik|3aychek|ya\s+rouhi|rou7i|te\s+amo|te\s+quiero)\b|[❤♥❣]️?|[🧡💛💚💙💜🖤🤍🤎💖💗💓💞💕🥰😘😍🫶]|حبيبي|حبيبتي|نحبك|توحشتك|روحي/giu;

const APOLOGY_REGEX =
  /\b(sorry|apologize|apologies|my\s+bad|forgive\s+me|pardon|désolé|desole|désolée|desolee|excuse[-\s]?moi|smahni|sma7ni|samahni|perdon|perdón|lo\s+siento)\b|سامحني|اسف|آسف|معذرة/giu;

const GRATITUDE_REGEX =
  /\b(thanks|thank\s+you|thx|tysm|appreciate\s+it|grateful|merci|chokran|shukran|aychek|3aychek|baraka\s+allahu|yrham\s+waldik|gracias)\b|[🙏]|شكرا|شكراً|عيشك|يعطيك\s+الصحة|بارك\s+الله/giu;

const POSITIVE_SENTIMENT_REGEX =
  /\b(good|great|awesome|amazing|happy|glad|perfect|wonderful|excited|nice|best|beautiful|super|cool|yes|yay|bravo|parfait|génial|genial|magnifique|superbe|content|heureux|heureuse|top|grave|bien|behi|bahi|mezyen|mahleh|ma7leh|farhan|hmd|hamdoullah|elhamdoulilah|mabrouk|saha|excelente|genial|bueno)\b|[😊😄😁🥳🎉✨🔥👍👏💪🙌🤩]|الحمد\s+لله|مبروك|ممتاز|رائع|باهي|مزيان/giu;

const NEGATIVE_SENTIMENT_REGEX =
  /\b(bad|sad|angry|upset|tired|exhausted|hate|annoyed|frustrated|worried|anxious|stressed|sick|hurt|awful|terrible|worst|non|triste|fâché|fache|énervé|enerve|fatigué|fatigue|malade|peur|stressé|grave\s+mal|dommage|nul|ta3ben|mridh|karez|mkarez|faddit|fadd|khayeb|malo|triste|cansado)\b|[😢😭😡🤬😠😞😔😟💔😩😫😤]|تعبان|مريض|حزين|قلقان|خايب/giu;

const URL_DOMAIN_REGEX =
  /https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;

export interface AudioInsightMeta {
  language?: string;
  tone?: string;
  source?: string;
}

export interface AnalyticsEngineOptions {
  dateOrderMode?: DateOrderMode;
  sessionGapMinutes?: number;
  customStopwords?: readonly string[];
  topWordsLimit?: number;
  topEmojisLimit?: number;
  /**
   * Optional map of fileName or messageId -> transcribed spoken text for voice notes.
   */
  audioTranscripts?: Readonly<Record<string, string>>;
  /**
   * Optional map of fileName or messageId -> translated English text for voice notes.
   */
  audioTranslations?: Readonly<Record<string, string>>;
  /**
   * Optional map of fileName or messageId -> detected language & vocal tone metadata.
   */
  audioMetadata?: Readonly<Record<string, AudioInsightMeta>>;
  /**
   * Controls whether word counts, vocabulary, phrases, and sentiment include
   * transcribed/translated audio ('text_and_audio') or strictly written text ('text_only').
   */
  analyticsBasisMode?: AnalyticsBasisMode;
}

export function formatBytesCompact(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb * 10) / 10} KB`;
  }
  const mb = kb / 1024;
  return `${Math.round(mb * 100) / 100} MB`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '??';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function computeMedian(sortedValues: readonly number[]): number {
  if (sortedValues.length === 0) {
    return 0;
  }
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) {
    return sortedValues[mid];
  }
  return Math.round((sortedValues[mid - 1] + sortedValues[mid]) / 2);
}

function buildReplyBuckets(
  replyTimesSec: readonly number[],
): ReplyTimeBucket[] {
  const counts: Record<ReplyBucketKey, number> = {
    under_1m: 0,
    '1m_to_5m': 0,
    '5m_to_15m': 0,
    '15m_to_60m': 0,
    '1h_to_6h': 0,
    over_6h: 0,
  };

  for (const sec of replyTimesSec) {
    for (const def of REPLY_BUCKET_DEFS) {
      if (sec <= def.maxSeconds) {
        counts[def.key]++;
        break;
      }
    }
  }

  const total = replyTimesSec.length;
  return REPLY_BUCKET_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    count: counts[def.key],
    percentage: total > 0 ? round1((counts[def.key] / total) * 100) : 0,
  }));
}

function diffDaysIso(isoStart: string, isoEnd: string): number {
  const [y1, m1, d1] = isoStart.split('-').map(Number);
  const [y2, m2, d2] = isoEnd.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / 86_400_000);
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function deriveChatTitle(
  fileName: string,
  participants: readonly string[],
): string {
  if (participants.length >= 2 && participants.length <= 3) {
    return participants.join(' & ');
  }
  const cleaned = fileName
    .replace(/\.(txt|zip)$/i, '')
    .replace(/^WhatsApp Chat with\s+/i, '')
    .replace(/^Discussion WhatsApp avec\s+/i, '')
    .replace(/^_chat$/i, '')
    .trim();
  if (cleaned) {
    return cleaned;
  }
  return participants.length > 0
    ? `${participants[0]} + ${participants.length - 1} others`
    : 'WhatsApp Chat';
}

export function formatDurationCompact(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s';
  }
  const rounded = Math.round(seconds);
  if (rounded < 60) {
    return `${rounded}s`;
  }
  const mins = Math.floor(rounded / 60);
  const remSec = rounded % 60;
  if (mins < 60) {
    return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
}

function normalizeLookupName(rawName: string): string {
  const fileName =
    rawName
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .split('/')
      .at(-1) ?? '';
  return fileName.trim().toLowerCase();
}

/** Reads a key the caller just put in the map. */
function entryOf<K, V>(map: Map<K, V>, key: K): V {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`Missing analytics entry for ${String(key)}`);
  }
  return value;
}

function countRegexMatches(text: string, regex: RegExp): number {
  if (!text) return 0;
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Computes the complete ChatAnalysisReport from an ArchiveExtractionResult.
 */
export function analyzeWhatsAppChat(
  extraction: ArchiveExtractionResult,
  options: AnalyticsEngineOptions = {},
): ChatAnalysisReport {
  const dateOrderMode = options.dateOrderMode ?? 'auto';
  const sessionGapMinutes = options.sessionGapMinutes ?? 180; // 3 hours default
  const topWordsLimit = options.topWordsLimit ?? 100;
  const topEmojisLimit = options.topEmojisLimit ?? 36;
  const stopwordSet = buildStopwordSet(options.customStopwords ?? []);
  const audioTranscripts = options.audioTranscripts ?? {};
  const audioTranslations = options.audioTranslations ?? {};
  const audioMetadata = options.audioMetadata ?? {};
  const basisMode: AnalyticsBasisMode =
    options.analyticsBasisMode ?? 'text_and_audio';
  const includeAudioInTextStats = basisMode === 'text_and_audio';

  const parsed = parseWhatsAppTranscript(extraction.rawText, dateOrderMode);
  const messages = [...parsed.messages].sort(
    (a, b) => a.timestampMs - b.timestampMs || a.index - b.index,
  );

  // Index ZIP media entries by normalized filename
  const zipMediaList: readonly ZipMediaEntry[] = extraction.mediaEntries ?? [];
  const zipMediaByName = new Map<string, ZipMediaEntry>();
  const matchedZipNames = new Set<string>();
  for (const entry of zipMediaList) {
    zipMediaByName.set(normalizeLookupName(entry.fileName), entry);
  }

  const unlinkedByCat = new Map<MediaCategory, ZipMediaEntry[]>();
  for (const entry of zipMediaList) {
    const arr = unlinkedByCat.get(entry.category) ?? [];
    arr.push(entry);
    unlinkedByCat.set(entry.category, arr);
  }

  for (const msg of messages) {
    if (msg.attachedFileName) {
      const key = normalizeLookupName(msg.attachedFileName);
      let matched = zipMediaByName.get(key);
      if (!matched) {
        // Fuzzy suffix match (e.g. if subfolder or prefix differs)
        for (const [entryKey, entryVal] of zipMediaByName.entries()) {
          if (entryKey.endsWith(key) || key.endsWith(entryKey)) {
            matched = entryVal;
            break;
          }
        }
      }
      if (matched) {
        matchedZipNames.add(normalizeLookupName(matched.fileName));
        msg.attachedFileName = matched.fileName;
        msg.mediaCategory = matched.category;
        msg.mediaBytes = matched.sizeBytes;
        if (matched.durationSeconds !== undefined) {
          msg.audioDurationSeconds = matched.durationSeconds;
        }
      }
    } else if (msg.isMedia && msg.mediaCategory) {
      const candidatePool =
        msg.mediaCategory === 'generic_media'
          ? zipMediaList.filter(
              (e) => !matchedZipNames.has(normalizeLookupName(e.fileName)),
            )
          : (unlinkedByCat.get(msg.mediaCategory) ?? []).filter(
              (e) => !matchedZipNames.has(normalizeLookupName(e.fileName)),
            );
      if (candidatePool.length > 0) {
        const picked = candidatePool[0];
        matchedZipNames.add(normalizeLookupName(picked.fileName));
        msg.attachedFileName = picked.fileName;
        msg.mediaCategory = picked.category;
        msg.mediaBytes = picked.sizeBytes;
        if (picked.durationSeconds !== undefined) {
          msg.audioDurationSeconds = picked.durationSeconds;
        }
      }
    }

    if (
      msg.mediaCategory === 'audio' &&
      msg.audioDurationSeconds === undefined
    ) {
      msg.audioDurationSeconds = 12;
    }

    const fileKey = msg.attachedFileName ?? '';
    const normFileKey = fileKey ? normalizeLookupName(fileKey) : '';

    const transcriptCandidate =
      (fileKey ? audioTranscripts[fileKey] : undefined) ??
      (normFileKey ? audioTranscripts[normFileKey] : undefined) ??
      audioTranscripts[msg.id];

    const translationCandidate =
      (fileKey ? audioTranslations[fileKey] : undefined) ??
      (normFileKey ? audioTranslations[normFileKey] : undefined) ??
      audioTranslations[msg.id];

    const metaCandidate =
      (fileKey ? audioMetadata[fileKey] : undefined) ??
      (normFileKey ? audioMetadata[normFileKey] : undefined) ??
      audioMetadata[msg.id];

    if (transcriptCandidate && transcriptCandidate.trim().length > 0) {
      msg.audioTranscript = transcriptCandidate.trim();
      if (translationCandidate && translationCandidate.trim().length > 0) {
        msg.audioTranslation = translationCandidate.trim();
      }
      if (metaCandidate?.language) {
        msg.audioLanguage = metaCandidate.language;
      }
      if (metaCandidate?.tone) {
        msg.audioTone = metaCandidate.tone;
      }
      if (includeAudioInTextStats) {
        enrichMessageMetrics(msg);
      }
    }
  }

  const participants = parsed.participants;
  const chatTitle = deriveChatTitle(extraction.fileName, participants);

  interface ParticipantAccumulator {
    name: string;
    messageCount: number;
    wordCount: number;
    writtenWordCount: number;
    charCount: number;
    mediaCount: number;
    audioCount: number;
    imageCount: number;
    videoCount: number;
    stickerCount: number;
    documentCount: number;
    totalAudioDurationSeconds: number;
    transcribedAudioCount: number;
    transcribedAudioWords: number;
    deletedCount: number;
    linkCount: number;
    questionCount: number;
    multilineCount: number;
    emojiCount: number;
    // Length distribution
    shortCount: number;
    mediumCount: number;
    longCount: number;
    paragraphCount: number;
    // Sentiment & social signals
    laughterCount: number;
    affectionCount: number;
    apologyCount: number;
    gratitudeCount: number;
    exclamationCount: number;
    capsLockCount: number;
    posMsgCount: number;
    negMsgCount: number;
    neuMsgCount: number;
    // Circadian buckets
    morningCount: number;
    afternoonCount: number;
    eveningCount: number;
    nightOwlCount: number;
    // Dynamics
    initiationCount: number;
    closingCount: number;
    unansweredOver6hCount: number;
    replySecondsList: number[];
    doubleTextCount: number;
    burstLengths: number[];
    longestMessageChars: number;
    wordMap: Map<string, number>;
    emojiMap: Map<string, number>;
  }

  const accMap = new Map<string, ParticipantAccumulator>();
  for (const name of participants) {
    accMap.set(name, {
      name,
      messageCount: 0,
      wordCount: 0,
      writtenWordCount: 0,
      charCount: 0,
      mediaCount: 0,
      audioCount: 0,
      imageCount: 0,
      videoCount: 0,
      stickerCount: 0,
      documentCount: 0,
      totalAudioDurationSeconds: 0,
      transcribedAudioCount: 0,
      transcribedAudioWords: 0,
      deletedCount: 0,
      linkCount: 0,
      questionCount: 0,
      multilineCount: 0,
      emojiCount: 0,
      shortCount: 0,
      mediumCount: 0,
      longCount: 0,
      paragraphCount: 0,
      laughterCount: 0,
      affectionCount: 0,
      apologyCount: 0,
      gratitudeCount: 0,
      exclamationCount: 0,
      capsLockCount: 0,
      posMsgCount: 0,
      negMsgCount: 0,
      neuMsgCount: 0,
      morningCount: 0,
      afternoonCount: 0,
      eveningCount: 0,
      nightOwlCount: 0,
      initiationCount: 0,
      closingCount: 0,
      unansweredOver6hCount: 0,
      replySecondsList: [],
      doubleTextCount: 0,
      burstLengths: [],
      longestMessageChars: 0,
      wordMap: new Map<string, number>(),
      emojiMap: new Map<string, number>(),
    });
  }

  const globalWordMap = new Map<
    string,
    { count: number; byParticipant: Record<string, number> }
  >();
  const globalBigramMap = new Map<
    string,
    { count: number; byParticipant: Record<string, number> }
  >();
  const globalTrigramMap = new Map<
    string,
    { count: number; byParticipant: Record<string, number> }
  >();
  const globalDomainMap = new Map<
    string,
    { count: number; byParticipant: Record<string, number> }
  >();
  const globalEmojiMap = new Map<
    string,
    { count: number; byParticipant: Record<string, number> }
  >();
  const detectedLanguagesSet = new Set<string>();

  // Heatmap 7x24
  const heatmapMatrix: number[][] = Array.from({ length: 7 }, () =>
    new Array(24).fill(0),
  );
  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  let lateNightCount = 0;
  let weekdayMessages = 0;
  let weekendMessages = 0;

  // Daily & Monthly timeline maps
  const dailyMap = new Map<
    string,
    {
      totalMessages: number;
      totalWords: number;
      byParticipant: Record<string, number>;
    }
  >();
  const monthlyMap = new Map<
    string,
    {
      totalMessages: number;
      totalWords: number;
      byParticipant: Record<string, number>;
    }
  >();

  let totalWords = 0;
  let totalWrittenWords = 0;
  let totalSpokenAudioWords = 0;
  let totalTranslatedAudioWords = 0;
  let totalChars = 0;
  let totalMedia = 0;
  let totalDeleted = 0;
  let totalLinks = 0;
  let totalEmojis = 0;
  let totalInitiations = 0;
  let totalClosings = 0;
  const allReplySeconds: number[] = [];

  // Session tracking
  interface SessionRecord {
    startMs: number;
    endMs: number;
    date: string;
    messageCount: number;
    wordCount: number;
  }
  const sessions: SessionRecord[] = [];
  let activeSession: SessionRecord | null = null;

  // Media Analytics accumulators
  const mediaByCategory: Record<MediaCategory, number> = {
    audio: 0,
    image: 0,
    video: 0,
    sticker: 0,
    gif: 0,
    document: 0,
    contact: 0,
    generic_media: 0,
  };
  const bytesByCategory: Record<MediaCategory, number> = {
    audio: 0,
    image: 0,
    video: 0,
    sticker: 0,
    gif: 0,
    document: 0,
    contact: 0,
    generic_media: 0,
  };
  const voiceNotes: VoiceNoteItem[] = [];
  const mediaGallery: MediaGalleryItem[] = [];

  const sessionGapMs = sessionGapMinutes * 60 * 1000;
  const doubleTextMinGapMs = 5 * 60 * 1000;
  const sixHoursMs = 6 * 3600 * 1000;

  let currentBurstSender: string | null = null;
  let currentBurstLength = 0;

  const helperIngestTokens = (
    sender: string,
    acc: ParticipantAccumulator,
    rawTextForLexical: string,
  ) => {
    const words = tokenizeChatWords(rawTextForLexical, stopwordSet);
    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      const word = words[wIdx];
      acc.wordMap.set(word, (acc.wordMap.get(word) ?? 0) + 1);
      let globalWord = globalWordMap.get(word);
      if (!globalWord) {
        globalWord = { count: 0, byParticipant: {} };
        globalWordMap.set(word, globalWord);
      }
      globalWord.count++;
      globalWord.byParticipant[sender] =
        (globalWord.byParticipant[sender] ?? 0) + 1;

      if (wIdx + 1 < words.length) {
        const bigram = `${words[wIdx]} ${words[wIdx + 1]}`;
        let bg = globalBigramMap.get(bigram);
        if (!bg) {
          bg = { count: 0, byParticipant: {} };
          globalBigramMap.set(bigram, bg);
        }
        bg.count++;
        bg.byParticipant[sender] = (bg.byParticipant[sender] ?? 0) + 1;
      }

      if (wIdx + 2 < words.length) {
        const trigram = `${words[wIdx]} ${words[wIdx + 1]} ${words[wIdx + 2]}`;
        let tg = globalTrigramMap.get(trigram);
        if (!tg) {
          tg = { count: 0, byParticipant: {} };
          globalTrigramMap.set(trigram, tg);
        }
        tg.count++;
        tg.byParticipant[sender] = (tg.byParticipant[sender] ?? 0) + 1;
      }
    }
  };

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const acc = accMap.get(msg.sender);
    if (!acc) {
      continue;
    }

    // Separate written vs spoken words for this message
    const captionForMedia = msg.isMedia
      ? classifyMediaText(msg.text).captionText
      : msg.text;
    const msgWrittenWords = msg.isDeleted
      ? 0
      : countWordsInText(captionForMedia);
    const msgAudioWords = msg.audioTranscript
      ? countWordsInText(msg.audioTranscript)
      : 0;
    const msgTranslationWords = msg.audioTranslation
      ? countWordsInText(msg.audioTranslation)
      : 0;

    totalWrittenWords += msgWrittenWords;
    acc.writtenWordCount += msgWrittenWords;

    const effectiveMsgWords = includeAudioInTextStats
      ? msgWrittenWords + msgAudioWords
      : msgWrittenWords;

    acc.messageCount++;
    acc.wordCount += effectiveMsgWords;
    acc.charCount += msg.charCount;
    totalWords += effectiveMsgWords;
    totalChars += msg.charCount;

    if (msg.charCount > acc.longestMessageChars) {
      acc.longestMessageChars = msg.charCount;
    }

    // Message length bucket
    if (effectiveMsgWords <= 3) {
      acc.shortCount++;
    } else if (effectiveMsgWords <= 15) {
      acc.mediumCount++;
    } else if (effectiveMsgWords <= 40) {
      acc.longCount++;
    } else {
      acc.paragraphCount++;
    }

    // Circadian bucket
    if (msg.hour >= 5 && msg.hour < 12) {
      acc.morningCount++;
    } else if (msg.hour >= 12 && msg.hour < 17) {
      acc.afternoonCount++;
    } else if (msg.hour >= 17 && msg.hour < 23) {
      acc.eveningCount++;
    } else {
      acc.nightOwlCount++;
    }

    // Weekday (0=Mon..4=Fri) vs Weekend (5=Sat, 6=Sun)
    if (msg.dayOfWeek >= 5) {
      weekendMessages++;
    } else {
      weekdayMessages++;
    }

    if (msg.isMedia) {
      acc.mediaCount++;
      totalMedia++;
      const cat: MediaCategory = msg.mediaCategory ?? 'generic_media';
      mediaByCategory[cat]++;
      const sizeBytes = msg.mediaBytes ?? 0;
      bytesByCategory[cat] += sizeBytes;

      if (cat === 'audio') {
        acc.audioCount++;
        const dur = msg.audioDurationSeconds ?? 12;
        acc.totalAudioDurationSeconds = round1(
          acc.totalAudioDurationSeconds + dur,
        );

        const zipEntry = msg.attachedFileName
          ? zipMediaByName.get(normalizeLookupName(msg.attachedFileName))
          : undefined;

        if (msg.audioTranscript && msgAudioWords > 0) {
          acc.transcribedAudioCount++;
          acc.transcribedAudioWords += msgAudioWords;
          totalSpokenAudioWords += msgAudioWords;
        }
        if (msg.audioTranslation && msgTranslationWords > 0) {
          totalTranslatedAudioWords += msgTranslationWords;
        }
        if (msg.audioLanguage) {
          detectedLanguagesSet.add(msg.audioLanguage);
        }

        const dt = new Date(msg.timestampMs);
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        voiceNotes.push({
          id: msg.id,
          messageId: msg.id,
          fileName:
            msg.attachedFileName ?? `voice-note-${voiceNotes.length + 1}.opus`,
          sender: msg.sender,
          isoDate: msg.isoDate,
          timestampLabel: `${msg.isoDate} ${hh}:${mm}`,
          sizeBytes: zipEntry?.sizeBytes ?? sizeBytes,
          durationSeconds: dur,
          mimeType: zipEntry?.mimeType ?? 'audio/ogg',
          previewUrl: zipEntry?.previewUrl,
          base64Data: zipEntry?.base64Data,
          transcript: msg.audioTranscript,
          translation: msg.audioTranslation,
          detectedLanguage: msg.audioLanguage,
          tone: msg.audioTone,
          transcriptWordCount: msgAudioWords,
        });
      } else if (cat === 'image') {
        acc.imageCount++;
      } else if (cat === 'video') {
        acc.videoCount++;
      } else if (cat === 'sticker' || cat === 'gif') {
        acc.stickerCount++;
      } else if (cat === 'document') {
        acc.documentCount++;
      }

      if (cat !== 'audio') {
        const zipEntry = msg.attachedFileName
          ? zipMediaByName.get(normalizeLookupName(msg.attachedFileName))
          : undefined;
        const dt = new Date(msg.timestampMs);
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        mediaGallery.push({
          id: msg.id,
          fileName: msg.attachedFileName ?? `${cat}-${mediaGallery.length + 1}`,
          category: cat,
          sender: msg.sender,
          isoDate: msg.isoDate,
          timestampLabel: `${msg.isoDate} ${hh}:${mm}`,
          sizeBytes: zipEntry?.sizeBytes ?? sizeBytes,
          mimeType: zipEntry?.mimeType ?? 'application/octet-stream',
          previewUrl: zipEntry?.previewUrl,
          durationSeconds: zipEntry?.durationSeconds,
        });
      }
    }

    if (msg.isDeleted) {
      acc.deletedCount++;
      totalDeleted++;
    }
    if (msg.hasLink) {
      acc.linkCount++;
      totalLinks++;
      // Extract domains
      URL_DOMAIN_REGEX.lastIndex = 0;
      let domainMatch: RegExpExecArray | null;
      while ((domainMatch = URL_DOMAIN_REGEX.exec(msg.text)) !== null) {
        const dom = domainMatch[1].toLowerCase();
        let dEntry = globalDomainMap.get(dom);
        if (!dEntry) {
          dEntry = { count: 0, byParticipant: {} };
          globalDomainMap.set(dom, dEntry);
        }
        dEntry.count++;
        dEntry.byParticipant[msg.sender] =
          (dEntry.byParticipant[msg.sender] ?? 0) + 1;
      }
    }
    if (msg.isQuestion) {
      acc.questionCount++;
    }
    if (msg.isMultiline) {
      acc.multilineCount++;
    }

    // Emojis
    if (msg.emojis.length > 0) {
      acc.emojiCount += msg.emojis.length;
      totalEmojis += msg.emojis.length;
      for (const emoji of msg.emojis) {
        acc.emojiMap.set(emoji, (acc.emojiMap.get(emoji) ?? 0) + 1);
        let globalEntry = globalEmojiMap.get(emoji);
        if (!globalEntry) {
          globalEntry = { count: 0, byParticipant: {} };
          globalEmojiMap.set(emoji, globalEntry);
        }
        globalEntry.count++;
        globalEntry.byParticipant[msg.sender] =
          (globalEntry.byParticipant[msg.sender] ?? 0) + 1;
      }
    }

    // Combined text for lexical + sentiment + social expressions
    if (!msg.isDeleted) {
      const combinedSourceText = msg.isMedia
        ? includeAudioInTextStats
          ? [
              captionForMedia,
              msg.audioTranscript ?? '',
              msg.audioTranslation ?? '',
            ]
              .filter(Boolean)
              .join(' ')
          : captionForMedia
        : msg.text;

      if (combinedSourceText.trim().length > 0) {
        helperIngestTokens(msg.sender, acc, combinedSourceText);

        const laughs = countRegexMatches(combinedSourceText, LAUGHTER_REGEX);
        const affections = countRegexMatches(
          combinedSourceText,
          AFFECTION_REGEX,
        );
        const apologies = countRegexMatches(combinedSourceText, APOLOGY_REGEX);
        const gratitudes = countRegexMatches(
          combinedSourceText,
          GRATITUDE_REGEX,
        );

        acc.laughterCount += laughs;
        acc.affectionCount += affections;
        acc.apologyCount += apologies;
        acc.gratitudeCount += gratitudes;

        if (combinedSourceText.includes('!')) {
          acc.exclamationCount++;
        }
        if (/\b[A-Z]{4,}\b/.test(combinedSourceText)) {
          acc.capsLockCount++;
        }

        const posHits =
          countRegexMatches(combinedSourceText, POSITIVE_SENTIMENT_REGEX) +
          affections +
          laughs +
          gratitudes;
        const negHits = countRegexMatches(
          combinedSourceText,
          NEGATIVE_SENTIMENT_REGEX,
        );

        if (posHits > negHits) {
          acc.posMsgCount++;
        } else if (negHits > posHits) {
          acc.negMsgCount++;
        } else {
          acc.neuMsgCount++;
        }
      }
    }

    // Heatmap & Late-Night (23:00 - 04:59)
    heatmapMatrix[msg.dayOfWeek][msg.hour]++;
    dayCounts[msg.dayOfWeek]++;
    hourCounts[msg.hour]++;
    if (msg.hour === 23 || msg.hour < 5) {
      lateNightCount++;
    }

    // Daily & Monthly timelines
    let dayEntry = dailyMap.get(msg.isoDate);
    if (!dayEntry) {
      dayEntry = { totalMessages: 0, totalWords: 0, byParticipant: {} };
      dailyMap.set(msg.isoDate, dayEntry);
    }
    dayEntry.totalMessages++;
    dayEntry.totalWords += effectiveMsgWords;
    dayEntry.byParticipant[msg.sender] =
      (dayEntry.byParticipant[msg.sender] ?? 0) + 1;

    const monthKey = msg.isoDate.slice(0, 7);
    let monthEntry = monthlyMap.get(monthKey);
    if (!monthEntry) {
      monthEntry = { totalMessages: 0, totalWords: 0, byParticipant: {} };
      monthlyMap.set(monthKey, monthEntry);
    }
    monthEntry.totalMessages++;
    monthEntry.totalWords += effectiveMsgWords;
    monthEntry.byParticipant[msg.sender] =
      (monthEntry.byParticipant[msg.sender] ?? 0) + 1;

    // Reply, Initiation, Closing, Session, Burst, and Double-Texting Dynamics
    if (i === 0) {
      acc.initiationCount++;
      totalInitiations++;
      currentBurstSender = msg.sender;
      currentBurstLength = 1;
      activeSession = {
        startMs: msg.timestampMs,
        endMs: msg.timestampMs,
        date: msg.isoDate,
        messageCount: 1,
        wordCount: effectiveMsgWords,
      };
    } else {
      const prev = messages[i - 1];
      const deltaMs = Math.max(0, msg.timestampMs - prev.timestampMs);

      if (deltaMs >= sessionGapMs) {
        // Previous message closed the previous session!
        const prevAcc = accMap.get(prev.sender);
        if (prevAcc) {
          prevAcc.closingCount++;
          totalClosings++;
        }
        if (activeSession) {
          sessions.push(activeSession);
        }
        activeSession = {
          startMs: msg.timestampMs,
          endMs: msg.timestampMs,
          date: msg.isoDate,
          messageCount: 1,
          wordCount: effectiveMsgWords,
        };

        acc.initiationCount++;
        totalInitiations++;
      } else if (activeSession) {
        activeSession.endMs = msg.timestampMs;
        activeSession.messageCount++;
        activeSession.wordCount += effectiveMsgWords;
      }

      if (msg.sender !== prev.sender) {
        if (currentBurstSender) {
          const prevAcc = accMap.get(currentBurstSender);
          prevAcc?.burstLengths.push(currentBurstLength);
        }
        currentBurstSender = msg.sender;
        currentBurstLength = 1;

        if (deltaMs >= sixHoursMs) {
          const prevAcc = accMap.get(prev.sender);
          if (prevAcc) {
            prevAcc.unansweredOver6hCount++;
          }
        }

        if (deltaMs <= 86_400_000) {
          const replySec = Math.round(deltaMs / 1000);
          acc.replySecondsList.push(replySec);
          allReplySeconds.push(replySec);
        }
      } else {
        currentBurstLength++;
        if (deltaMs >= doubleTextMinGapMs && deltaMs < sessionGapMs) {
          acc.doubleTextCount++;
        }
      }
    }
  }

  // Close final session and final message closer
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    const lastSenderAcc = accMap.get(lastMsg.sender);
    if (lastSenderAcc) {
      lastSenderAcc.closingCount++;
      totalClosings++;
    }
    if (activeSession) {
      sessions.push(activeSession);
    }
  }

  // Also include any remaining unlinked ZIP media files so archive totals are 100% accurate
  const defaultSender = participants[0] ?? 'Archive';
  for (const entry of zipMediaList) {
    const normEntryName = normalizeLookupName(entry.fileName);
    if (matchedZipNames.has(normEntryName)) {
      continue;
    }
    totalMedia++;
    mediaByCategory[entry.category]++;
    bytesByCategory[entry.category] += entry.sizeBytes;
    const fallbackAcc = accMap.get(defaultSender);
    if (fallbackAcc) {
      fallbackAcc.mediaCount++;
    }

    if (entry.category === 'audio') {
      const dur = entry.durationSeconds ?? 10;
      const transcriptText = (
        audioTranscripts[entry.fileName] ?? audioTranscripts[normEntryName]
      )?.trim();
      const translationText = (
        audioTranslations[entry.fileName] ?? audioTranslations[normEntryName]
      )?.trim();
      const metaObj =
        audioMetadata[entry.fileName] ?? audioMetadata[normEntryName];
      const tWords = transcriptText ? countWordsInText(transcriptText) : 0;
      const trWords = translationText ? countWordsInText(translationText) : 0;

      if (metaObj?.language) {
        detectedLanguagesSet.add(metaObj.language);
      }

      if (fallbackAcc) {
        fallbackAcc.audioCount++;
        fallbackAcc.totalAudioDurationSeconds = round1(
          fallbackAcc.totalAudioDurationSeconds + dur,
        );
        if (tWords > 0 && transcriptText) {
          fallbackAcc.transcribedAudioCount++;
          fallbackAcc.transcribedAudioWords += tWords;
          totalSpokenAudioWords += tWords;
          if (trWords > 0) {
            totalTranslatedAudioWords += trWords;
          }
          if (includeAudioInTextStats) {
            fallbackAcc.wordCount += tWords;
            totalWords += tWords;
            const combinedAudioLex = [transcriptText, translationText ?? '']
              .filter(Boolean)
              .join(' ');
            helperIngestTokens(defaultSender, fallbackAcc, combinedAudioLex);
          }
        }
      }
      voiceNotes.push({
        id: `zip-audio-${voiceNotes.length + 1}`,
        messageId: `zip-audio-${voiceNotes.length + 1}`,
        fileName: entry.fileName,
        sender: defaultSender,
        isoDate: messages[messages.length - 1]?.isoDate ?? '—',
        timestampLabel: 'ZIP Archive',
        sizeBytes: entry.sizeBytes,
        durationSeconds: dur,
        mimeType: entry.mimeType,
        previewUrl: entry.previewUrl,
        base64Data: entry.base64Data,
        transcript: transcriptText,
        translation: translationText,
        detectedLanguage: metaObj?.language,
        tone: metaObj?.tone,
        transcriptWordCount: tWords,
      });
    } else {
      if (fallbackAcc) {
        if (entry.category === 'image') fallbackAcc.imageCount++;
        else if (entry.category === 'video') fallbackAcc.videoCount++;
        else if (entry.category === 'sticker' || entry.category === 'gif')
          fallbackAcc.stickerCount++;
        else if (entry.category === 'document') fallbackAcc.documentCount++;
      }
      mediaGallery.push({
        id: `zip-media-${mediaGallery.length + 1}`,
        fileName: entry.fileName,
        category: entry.category,
        sender: defaultSender,
        isoDate: messages[messages.length - 1]?.isoDate ?? '—',
        timestampLabel: 'ZIP Archive',
        sizeBytes: entry.sizeBytes,
        mimeType: entry.mimeType,
        previewUrl: entry.previewUrl,
        durationSeconds: entry.durationSeconds,
      });
    }
  }

  // Close final burst
  if (currentBurstSender && currentBurstLength > 0) {
    const lastAcc = accMap.get(currentBurstSender);
    lastAcc?.burstLengths.push(currentBurstLength);
  }

  const totalMessages = messages.length;

  // Build ParticipantAnalytics array
  const participantAnalytics: ParticipantAnalytics[] = participants.map(
    (name, idx) => {
      const acc = entryOf(accMap, name);
      const sortedReplies = [...acc.replySecondsList].sort((a, b) => a - b);
      const replyCount = sortedReplies.length;
      const meanReplySeconds =
        replyCount > 0
          ? Math.round(
              sortedReplies.reduce((sum, v) => sum + v, 0) / replyCount,
            )
          : 0;
      const medianReplySeconds = computeMedian(sortedReplies);
      const fastestReplySeconds = replyCount > 0 ? sortedReplies[0] : 0;
      const slowestReplySeconds =
        replyCount > 0 ? sortedReplies[replyCount - 1] : 0;
      const under1MinCount = sortedReplies.filter((s) => s <= 60).length;
      const under5MinCount = sortedReplies.filter((s) => s <= 300).length;
      const repliesUnder1MinPct =
        replyCount > 0 ? round1((under1MinCount / replyCount) * 100) : 0;
      const repliesUnder5MinPct =
        replyCount > 0 ? round1((under5MinCount / replyCount) * 100) : 0;

      const avgBurstLength =
        acc.burstLengths.length > 0
          ? round1(
              acc.burstLengths.reduce((sum, v) => sum + v, 0) /
                acc.burstLengths.length,
            )
          : 0;
      const longestBurstCount =
        acc.burstLengths.length > 0 ? Math.max(...acc.burstLengths) : 0;

      const topWords = Array.from(acc.wordMap.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 15)
        .map(([word, count]) => ({ word, count }));

      // Compute signature / exclusive words (words where this participant accounts for >= 70% of usage and count >= 2)
      const exclusiveWords = Array.from(acc.wordMap.entries())
        .filter(([word, count]) => {
          if (count < 2) return false;
          const globalTotal = globalWordMap.get(word)?.count ?? count;
          return count / globalTotal >= 0.68;
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word, count]) => ({ word, count }));

      const topEmojis = Array.from(acc.emojiMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([emoji, count]) => ({ emoji, count }));

      const uniqueWordCount = acc.wordMap.size;
      const totalTokenizedForUser = Array.from(acc.wordMap.values()).reduce(
        (s, c) => s + c,
        0,
      );
      const vocabularyRichnessPct =
        totalTokenizedForUser > 0
          ? round1(
              Math.min(100, (uniqueWordCount / totalTokenizedForUser) * 100),
            )
          : 0;

      const totalCombinedWordsForUser =
        acc.writtenWordCount + acc.transcribedAudioWords;
      const audioWordSharePct =
        totalCombinedWordsForUser > 0
          ? round1(
              (acc.transcribedAudioWords / totalCombinedWordsForUser) * 100,
            )
          : 0;
      const speakingRateWpm =
        acc.totalAudioDurationSeconds > 0 && acc.transcribedAudioWords > 0
          ? Math.round(
              (acc.transcribedAudioWords / acc.totalAudioDurationSeconds) * 60,
            )
          : 0;

      const totalSentScored =
        acc.posMsgCount + acc.negMsgCount + acc.neuMsgCount;
      const sentimentPositivePct =
        totalSentScored > 0
          ? round1((acc.posMsgCount / totalSentScored) * 100)
          : 0;
      const sentimentNegativePct =
        totalSentScored > 0
          ? round1((acc.negMsgCount / totalSentScored) * 100)
          : 0;
      const sentimentNeutralPct =
        totalSentScored > 0
          ? round1(
              Math.max(0, 100 - sentimentPositivePct - sentimentNegativePct),
            )
          : 100;

      const morningPct =
        acc.messageCount > 0
          ? round1((acc.morningCount / acc.messageCount) * 100)
          : 0;
      const afternoonPct =
        acc.messageCount > 0
          ? round1((acc.afternoonCount / acc.messageCount) * 100)
          : 0;
      const eveningPct =
        acc.messageCount > 0
          ? round1((acc.eveningCount / acc.messageCount) * 100)
          : 0;
      const nightOwlPct =
        acc.messageCount > 0
          ? round1((acc.nightOwlCount / acc.messageCount) * 100)
          : 0;

      let chronotypeLabel = 'Evening Conversationalist 🌆';
      if (
        nightOwlPct >= 25 ||
        (nightOwlPct >= eveningPct && nightOwlPct >= afternoonPct)
      ) {
        chronotypeLabel = 'Night Owl 🌙';
      } else if (morningPct >= afternoonPct && morningPct >= eveningPct) {
        chronotypeLabel = 'Morning Lark 🌅';
      } else if (afternoonPct >= eveningPct) {
        chronotypeLabel = 'Daytime Connector ☀️';
      }

      return {
        name,
        initials: getInitials(name),
        accentColor:
          PARTICIPANT_ACCENT_COLORS[idx % PARTICIPANT_ACCENT_COLORS.length],
        messageCount: acc.messageCount,
        messageSharePct:
          totalMessages > 0
            ? round1((acc.messageCount / totalMessages) * 100)
            : 0,
        wordCount: acc.wordCount,
        writtenWordCount: acc.writtenWordCount,
        wordSharePct:
          totalWords > 0 ? round1((acc.wordCount / totalWords) * 100) : 0,
        charCount: acc.charCount,
        avgWordsPerMessage:
          acc.messageCount > 0 ? round1(acc.wordCount / acc.messageCount) : 0,
        avgCharsPerMessage:
          acc.messageCount > 0
            ? Math.round(acc.charCount / acc.messageCount)
            : 0,
        mediaCount: acc.mediaCount,
        audioCount: acc.audioCount,
        imageCount: acc.imageCount,
        videoCount: acc.videoCount,
        stickerCount: acc.stickerCount,
        documentCount: acc.documentCount,
        totalAudioDurationSeconds: acc.totalAudioDurationSeconds,
        transcribedAudioCount: acc.transcribedAudioCount,
        transcribedAudioWords: acc.transcribedAudioWords,
        audioWordSharePct,
        speakingRateWpm,
        deletedCount: acc.deletedCount,
        linkCount: acc.linkCount,
        questionCount: acc.questionCount,
        multilineCount: acc.multilineCount,
        emojiCount: acc.emojiCount,
        uniqueWordCount,
        vocabularyRichnessPct,
        exclusiveWords,
        messageLengthBreakdown: {
          shortCount: acc.shortCount,
          mediumCount: acc.mediumCount,
          longCount: acc.longCount,
          paragraphCount: acc.paragraphCount,
        },
        laughterCount: acc.laughterCount,
        affectionCount: acc.affectionCount,
        apologyCount: acc.apologyCount,
        gratitudeCount: acc.gratitudeCount,
        exclamationCount: acc.exclamationCount,
        capsLockCount: acc.capsLockCount,
        sentimentPositivePct,
        sentimentNeutralPct,
        sentimentNegativePct,
        chronotypeLabel,
        morningPct,
        afternoonPct,
        eveningPct,
        nightOwlPct,
        initiationCount: acc.initiationCount,
        initiationSharePct:
          totalInitiations > 0
            ? round1((acc.initiationCount / totalInitiations) * 100)
            : 0,
        closingCount: acc.closingCount,
        closingSharePct:
          totalClosings > 0
            ? round1((acc.closingCount / totalClosings) * 100)
            : 0,
        unansweredOver6hCount: acc.unansweredOver6hCount,
        replyCount,
        meanReplySeconds,
        medianReplySeconds,
        fastestReplySeconds,
        slowestReplySeconds,
        repliesUnder1MinPct,
        repliesUnder5MinPct,
        doubleTextCount: acc.doubleTextCount,
        doubleTextIndexPct:
          acc.messageCount > 0
            ? round1((acc.doubleTextCount / acc.messageCount) * 100)
            : 0,
        avgBurstLength,
        longestBurstCount,
        longestMessageChars: acc.longestMessageChars,
        replyBuckets: buildReplyBuckets(sortedReplies),
        topWords,
        topEmojis,
      };
    },
  );

  participantAnalytics.sort((a, b) => b.messageCount - a.messageCount);

  // Build MediaAnalyticsSummary
  const totalAudioDurationSeconds = round1(
    voiceNotes.reduce((sum, v) => sum + v.durationSeconds, 0),
  );
  const avgAudioDurationSeconds =
    voiceNotes.length > 0
      ? round1(totalAudioDurationSeconds / voiceNotes.length)
      : 0;
  const transcribedVoiceNoteCount = voiceNotes.filter((v) =>
    Boolean(v.transcript && v.transcriptWordCount > 0),
  ).length;
  const translatedVoiceNoteCount = voiceNotes.filter((v) =>
    Boolean(v.translation && v.translation.trim().length > 0),
  ).length;
  const transcribedWordsAdded = voiceNotes.reduce(
    (sum, v) => sum + v.transcriptWordCount,
    0,
  );
  const totalArchiveMediaBytes =
    extraction.totalMediaBytes && extraction.totalMediaBytes > 0
      ? extraction.totalMediaBytes
      : Object.values(bytesByCategory).reduce((sum, b) => sum + b, 0);

  const mediaAnalytics: MediaAnalyticsSummary = {
    totalMediaMessages: totalMedia,
    totalArchiveMediaFiles: zipMediaList.length,
    totalArchiveMediaBytes,
    byCategory: mediaByCategory,
    bytesByCategory,
    totalAudioDurationSeconds,
    avgAudioDurationSeconds,
    transcribedVoiceNoteCount,
    translatedVoiceNoteCount,
    transcribedWordsAdded,
    voiceNotes,
    mediaGallery: mediaGallery.slice(0, 500),
  };

  // Build AnalyticsBasisSummary
  const combinedPotentialWords = totalWrittenWords + totalSpokenAudioWords;
  const audioShareOfTotalWordsPct =
    combinedPotentialWords > 0
      ? round1((totalSpokenAudioWords / combinedPotentialWords) * 100)
      : 0;
  const detectedAudioLanguages = Array.from(detectedLanguagesSet);

  const isUsingAudio = includeAudioInTextStats && transcribedVoiceNoteCount > 0;

  const analyticsBasis: AnalyticsBasisSummary = {
    mode: basisMode,
    hasVoiceNotesInChat: voiceNotes.length > 0,
    totalVoiceNotes: voiceNotes.length,
    transcribedVoiceNotes: transcribedVoiceNoteCount,
    translatedVoiceNotes: translatedVoiceNoteCount,
    writtenWordsCount: totalWrittenWords,
    spokenAudioWordsCount: totalSpokenAudioWords,
    translatedAudioWordsCount: totalTranslatedAudioWords,
    effectiveTotalWords: totalWords,
    audioShareOfTotalWordsPct,
    detectedAudioLanguages,
    badgeLabel: isUsingAudio
      ? `Text + Audio Transcription & Translation (${transcribedVoiceNoteCount}/${voiceNotes.length} Voice Notes)`
      : voiceNotes.length > 0 && basisMode === 'text_only'
        ? `Written Text Only (${voiceNotes.length} Voice Notes Excluded)`
        : 'Written Text Only',
    description: isUsingAudio
      ? `All word counts, lexical leaderboards, n-gram phrases, and sentiment metrics combine ${totalWrittenWords.toLocaleString()} written words + ${totalSpokenAudioWords.toLocaleString()} spoken audio words (${audioShareOfTotalWordsPct}% from voice notes)${translatedVoiceNoteCount > 0 ? ` with ${translatedVoiceNoteCount} English translations` : ''}.`
      : voiceNotes.length > 0
        ? `Metrics currently reflect ${totalWrittenWords.toLocaleString()} written text words only (${voiceNotes.length} voice notes in chat).`
        : `Metrics computed from ${totalWrittenWords.toLocaleString()} written text words across ${totalMessages.toLocaleString()} messages.`,
  };

  // Global Top Words & Top Emojis
  const totalTokenizedWords = Array.from(globalWordMap.values()).reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const topWords: WordFrequencyItem[] = Array.from(globalWordMap.entries())
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, topWordsLimit)
    .map(([word, data]) => ({
      word,
      count: data.count,
      sharePct:
        totalTokenizedWords > 0
          ? round1((data.count / totalTokenizedWords) * 100)
          : 0,
      byParticipant: data.byParticipant,
    }));

  const topEmojis: EmojiFrequencyItem[] = Array.from(globalEmojiMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, topEmojisLimit)
    .map(([emoji, data]) => ({
      emoji,
      count: data.count,
      sharePct: totalEmojis > 0 ? round1((data.count / totalEmojis) * 100) : 0,
      byParticipant: data.byParticipant,
    }));

  const topBigrams: PhraseFrequencyItem[] = Array.from(
    globalBigramMap.entries(),
  )
    .filter(([, d]) => d.count >= 2)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 15)
    .map(([phrase, d]) => ({
      phrase,
      count: d.count,
      byParticipant: d.byParticipant,
    }));

  const topTrigrams: PhraseFrequencyItem[] = Array.from(
    globalTrigramMap.entries(),
  )
    .filter(([, d]) => d.count >= 2)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([phrase, d]) => ({
      phrase,
      count: d.count,
      byParticipant: d.byParticipant,
    }));

  const topDomains: SharedDomainItem[] = Array.from(globalDomainMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([domain, d]) => ({
      domain,
      count: d.count,
      byParticipant: d.byParticipant,
    }));

  // Streaks & Timelines
  const streaksAndTimeline = computeStreaksAndTimeline(
    dailyMap,
    monthlyMap,
    totalMessages,
  );

  // Heatmap
  let maxCellValue = 0;
  for (const row of heatmapMatrix) {
    for (const val of row) {
      if (val > maxCellValue) {
        maxCellValue = val;
      }
    }
  }

  const byDayOfWeek = DAY_NAMES.map((d, idx) => ({
    dayIndex: idx,
    dayName: d.full,
    shortName: d.short,
    count: dayCounts[idx],
    pct: totalMessages > 0 ? round1((dayCounts[idx] / totalMessages) * 100) : 0,
  }));

  const byHourOfDay = hourCounts.map((count, hour) => ({
    hour,
    label: formatHourLabel(hour),
    count,
    pct: totalMessages > 0 ? round1((count / totalMessages) * 100) : 0,
  }));

  const peakDayEntry = [...byDayOfWeek].sort((a, b) => b.count - a.count)[0];
  const peakHourEntry = [...byHourOfDay].sort((a, b) => b.count - a.count)[0];

  const heatmap: HeatmapAnalytics = {
    matrix: heatmapMatrix,
    maxCellValue,
    byDayOfWeek,
    byHourOfDay,
    peakDayName: peakDayEntry?.dayName ?? 'Monday',
    peakHourLabel: peakHourEntry?.label ?? '21:00',
    lateNightPct:
      totalMessages > 0 ? round1((lateNightCount / totalMessages) * 100) : 0,
  };

  // Compute DeepBehavioralAnalytics
  const totalSessions = sessions.length;
  const totalSessionDurationMin = sessions.reduce(
    (sum, s) => sum + Math.max(1, Math.round((s.endMs - s.startMs) / 60000)),
    0,
  );
  const avgSessionDurationMinutes =
    totalSessions > 0 ? round1(totalSessionDurationMin / totalSessions) : 0;
  const avgMessagesPerSession =
    totalSessions > 0 ? round1(totalMessages / totalSessions) : 0;

  const longestSessionObj = [...sessions].sort(
    (a, b) =>
      b.messageCount - a.messageCount ||
      b.endMs - b.startMs - (a.endMs - a.startMs),
  )[0];
  const longestSession = longestSessionObj
    ? {
        date: longestSessionObj.date,
        durationMinutes: Math.max(
          1,
          Math.round(
            (longestSessionObj.endMs - longestSessionObj.startMs) / 60000,
          ),
        ),
        messageCount: longestSessionObj.messageCount,
        wordCount: longestSessionObj.wordCount,
      }
    : { date: '—', durationMinutes: 0, messageCount: 0, wordCount: 0 };

  const totalPos = Array.from(accMap.values()).reduce(
    (s, a) => s + a.posMsgCount,
    0,
  );
  const totalNeg = Array.from(accMap.values()).reduce(
    (s, a) => s + a.negMsgCount,
    0,
  );
  const totalNeu = Array.from(accMap.values()).reduce(
    (s, a) => s + a.neuMsgCount,
    0,
  );
  const totalSentAll = totalPos + totalNeg + totalNeu;
  const overallPositivePct =
    totalSentAll > 0 ? round1((totalPos / totalSentAll) * 100) : 0;
  const overallNegativePct =
    totalSentAll > 0 ? round1((totalNeg / totalSentAll) * 100) : 0;
  const overallNeutralPct =
    totalSentAll > 0
      ? round1(Math.max(0, 100 - overallPositivePct - overallNegativePct))
      : 100;

  const totalLaughterCount = participantAnalytics.reduce(
    (s, p) => s + p.laughterCount,
    0,
  );
  const totalAffectionCount = participantAnalytics.reduce(
    (s, p) => s + p.affectionCount,
    0,
  );
  const totalApologyCount = participantAnalytics.reduce(
    (s, p) => s + p.apologyCount,
    0,
  );
  const totalGratitudeCount = participantAnalytics.reduce(
    (s, p) => s + p.gratitudeCount,
    0,
  );

  // First half vs second half momentum
  const dailyList = streaksAndTimeline.dailyTimeline;
  const halfIdx = Math.max(1, Math.floor(dailyList.length / 2));
  const firstHalfMessages = dailyList
    .slice(0, halfIdx)
    .reduce((s, d) => s + d.totalMessages, 0);
  const secondHalfMessages = dailyList
    .slice(halfIdx)
    .reduce((s, d) => s + d.totalMessages, 0);
  const momentumDeltaPct =
    firstHalfMessages > 0
      ? round1(
          ((secondHalfMessages - firstHalfMessages) / firstHalfMessages) * 100,
        )
      : 0;
  const momentumLabel =
    momentumDeltaPct >= 15
      ? 'Accelerating 📈'
      : momentumDeltaPct <= -15
        ? 'Cooling Down 📉'
        : 'Steady Rhythm ⚖️';

  // Quantitative 0..100 relationship indices
  let symmetryScore = 85;
  if (participantAnalytics.length >= 2) {
    const p1 = participantAnalytics[0];
    const p2 = participantAnalytics[1];
    const msgDiff = Math.abs(p1.messageSharePct - p2.messageSharePct);
    const wordDiff = Math.abs(p1.wordSharePct - p2.wordSharePct);
    const initDiff = Math.abs(p1.initiationSharePct - p2.initiationSharePct);
    symmetryScore = Math.round(
      Math.max(
        25,
        Math.min(99, 100 - (msgDiff * 0.45 + wordDiff * 0.35 + initDiff * 0.2)),
      ),
    );
  }

  const globalMedianReply = computeMedian(
    [...allReplySeconds].sort((a, b) => a - b),
  );
  const replySpeedScore =
    globalMedianReply <= 60
      ? 96
      : globalMedianReply <= 180
        ? 90
        : globalMedianReply <= 600
          ? 82
          : globalMedianReply <= 1800
            ? 72
            : 58;
  const momentumScore = Math.round(
    Math.min(
      99,
      replySpeedScore * 0.6 +
        Math.min(100, streaksAndTimeline.activeDaysPct * 1.15) * 0.4,
    ),
  );

  const expressivenessRaw =
    totalMessages > 0
      ? ((totalEmojis +
          totalLaughterCount * 1.5 +
          totalAffectionCount * 2 +
          voiceNotes.length * 3) /
          totalMessages) *
        100
      : 50;
  const expressivenessScore = Math.round(
    Math.max(38, Math.min(98, 45 + expressivenessRaw * 0.9)),
  );

  const consistencyScore = Math.round(
    Math.max(
      35,
      Math.min(
        99,
        streaksAndTimeline.activeDaysPct * 0.7 +
          Math.min(30, streaksAndTimeline.longestStreak.days * 2),
      ),
    ),
  );

  const overallChemistryScore = Math.round(
    symmetryScore * 0.3 +
      momentumScore * 0.3 +
      expressivenessScore * 0.2 +
      consistencyScore * 0.2,
  );

  const deepAnalytics: DeepBehavioralAnalytics = {
    symmetryScore,
    momentumScore,
    expressivenessScore,
    consistencyScore,
    overallChemistryScore,
    totalSessions,
    avgSessionDurationMinutes,
    avgMessagesPerSession,
    longestSession,
    overallSentiment: {
      positivePct: overallPositivePct,
      neutralPct: overallNeutralPct,
      negativePct: overallNegativePct,
      totalLaughterCount,
      totalAffectionCount,
      totalApologyCount,
      totalGratitudeCount,
    },
    topBigrams,
    topTrigrams,
    topDomains,
    weekdayMessages,
    weekendMessages,
    weekendSharePct:
      totalMessages > 0 ? round1((weekendMessages / totalMessages) * 100) : 0,
    firstHalfMessages,
    secondHalfMessages,
    momentumDeltaPct,
    momentumLabel,
  };

  const wrapped = buildWrappedSummary(
    chatTitle,
    totalMessages,
    totalWords,
    participantAnalytics,
    streaksAndTimeline,
    heatmap,
    topEmojis,
    topWords,
  );

  return {
    chatTitle,
    sourceInfo: {
      fileName: extraction.fileName,
      sourceType: extraction.sourceType,
      transcriptFileName: extraction.transcriptFileName,
      skippedMediaCount: extraction.skippedMediaCount,
      skippedMediaFiles: extraction.skippedMediaFiles,
      strippedInvisibleChars:
        extraction.strippedInvisibleChars + parsed.strippedInvisibleChars,
      totalMediaBytes: extraction.totalMediaBytes,
    },
    analyticsBasis,
    dateDetection: parsed.dateDetection,
    sessionGapMinutes,
    totalMessages,
    totalWords,
    writtenWordsCount: totalWrittenWords,
    spokenAudioWordsCount: totalSpokenAudioWords,
    totalChars,
    totalMedia,
    totalDeleted,
    totalLinks,
    totalEmojis,
    systemNoticeCount: parsed.systemNotices.length,
    participants: participantAnalytics,
    mediaAnalytics,
    deepAnalytics,
    overallReplyBuckets: buildReplyBuckets(allReplySeconds),
    topWords,
    topEmojis,
    streaksAndTimeline,
    heatmap,
    wrapped,
  };
}

function computeStreaksAndTimeline(
  dailyMap: Map<
    string,
    {
      totalMessages: number;
      totalWords: number;
      byParticipant: Record<string, number>;
    }
  >,
  monthlyMap: Map<
    string,
    {
      totalMessages: number;
      totalWords: number;
      byParticipant: Record<string, number>;
    }
  >,
  totalMessages: number,
): StreaksAndTimelineAnalytics {
  const sortedDates = Array.from(dailyMap.keys()).sort();
  if (sortedDates.length === 0) {
    const emptyStreak: StreakSpan = {
      startDate: '—',
      endDate: '—',
      days: 0,
      totalMessages: 0,
    };
    return {
      firstMessageDate: '—',
      lastMessageDate: '—',
      totalCalendarDays: 0,
      activeDays: 0,
      silentDays: 0,
      activeDaysPct: 0,
      longestStreak: emptyStreak,
      currentStreak: emptyStreak,
      longestSilentGapDays: 0,
      peakDays: [],
      dailyTimeline: [],
      monthlyTimeline: [],
      avgMessagesPerCalendarDay: 0,
      avgMessagesPerActiveDay: 0,
    };
  }

  const firstMessageDate = sortedDates[0];
  const lastMessageDate = sortedDates[sortedDates.length - 1];
  const totalCalendarDays = Math.max(
    1,
    diffDaysIso(firstMessageDate, lastMessageDate) + 1,
  );
  const activeDays = sortedDates.length;
  const silentDays = Math.max(0, totalCalendarDays - activeDays);
  const activeDaysPct = round1((activeDays / totalCalendarDays) * 100);

  let longestStreak: StreakSpan = {
    startDate: sortedDates[0],
    endDate: sortedDates[0],
    days: 1,
    totalMessages: entryOf(dailyMap, sortedDates[0]).totalMessages,
  };

  let curStart = sortedDates[0];
  let curEnd = sortedDates[0];
  let curDays = 1;
  let curMsgs = entryOf(dailyMap, sortedDates[0]).totalMessages;
  let longestSilentGapDays = 0;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    const dayDiff = diffDaysIso(prevDate, currDate);

    if (dayDiff === 1) {
      curEnd = currDate;
      curDays++;
      curMsgs += entryOf(dailyMap, currDate).totalMessages;
    } else {
      if (dayDiff - 1 > longestSilentGapDays) {
        longestSilentGapDays = dayDiff - 1;
      }
      if (
        curDays > longestStreak.days ||
        (curDays === longestStreak.days &&
          curMsgs > longestStreak.totalMessages)
      ) {
        longestStreak = {
          startDate: curStart,
          endDate: curEnd,
          days: curDays,
          totalMessages: curMsgs,
        };
      }
      curStart = currDate;
      curEnd = currDate;
      curDays = 1;
      curMsgs = entryOf(dailyMap, currDate).totalMessages;
    }
  }

  if (
    curDays > longestStreak.days ||
    (curDays === longestStreak.days && curMsgs > longestStreak.totalMessages)
  ) {
    longestStreak = {
      startDate: curStart,
      endDate: curEnd,
      days: curDays,
      totalMessages: curMsgs,
    };
  }

  const currentStreak: StreakSpan = {
    startDate: curStart,
    endDate: curEnd,
    days: curDays,
    totalMessages: curMsgs,
  };

  const peakDays: PeakDayRecord[] = sortedDates
    .map((date) => {
      const entry = entryOf(dailyMap, date);
      return {
        date,
        messageCount: entry.totalMessages,
        wordCount: entry.totalWords,
      };
    })
    .sort(
      (a, b) => b.messageCount - a.messageCount || b.wordCount - a.wordCount,
    )
    .slice(0, 6);

  const dailyTimeline: TimelinePoint[] = sortedDates.map((date) => {
    const entry = entryOf(dailyMap, date);
    return {
      period: date,
      label: date.slice(5), // MM-DD
      totalMessages: entry.totalMessages,
      totalWords: entry.totalWords,
      byParticipant: entry.byParticipant,
    };
  });

  const sortedMonths = Array.from(monthlyMap.keys()).sort();
  const monthlyTimeline: TimelinePoint[] = sortedMonths.map((month) => {
    const entry = entryOf(monthlyMap, month);
    return {
      period: month,
      label: month,
      totalMessages: entry.totalMessages,
      totalWords: entry.totalWords,
      byParticipant: entry.byParticipant,
    };
  });

  return {
    firstMessageDate,
    lastMessageDate,
    totalCalendarDays,
    activeDays,
    silentDays,
    activeDaysPct,
    longestStreak,
    currentStreak,
    longestSilentGapDays,
    peakDays,
    dailyTimeline,
    monthlyTimeline,
    avgMessagesPerCalendarDay: round1(totalMessages / totalCalendarDays),
    avgMessagesPerActiveDay: round1(totalMessages / activeDays),
  };
}

function buildWrappedSummary(
  chatTitle: string,
  totalMessages: number,
  totalWords: number,
  participants: readonly ParticipantAnalytics[],
  streaks: StreaksAndTimelineAnalytics,
  heatmap: HeatmapAnalytics,
  topEmojis: readonly EmojiFrequencyItem[],
  topWords: readonly WordFrequencyItem[],
): WrappedSummaryData {
  const topChatterObj = participants[0] ?? { name: '—', messageSharePct: 0 };
  const topInitiatorObj = [...participants].sort(
    (a, b) => b.initiationSharePct - a.initiationSharePct,
  )[0] ?? { name: '—', initiationSharePct: 0 };

  const respondersWithReplies = participants.filter((p) => p.replyCount > 0);
  const fastestObj = [...respondersWithReplies].sort(
    (a, b) => a.medianReplySeconds - b.medianReplySeconds,
  )[0] ?? { name: topChatterObj.name, medianReplySeconds: 0 };

  const doubleTextObj = [...participants].sort(
    (a, b) => b.doubleTextIndexPct - a.doubleTextIndexPct,
  )[0] ?? { name: '—', doubleTextIndexPct: 0 };

  const peakHour = Number.parseInt(heatmap.peakHourLabel.slice(0, 2), 10);
  let peakTimePersona = 'Evening Conversationalists';
  if (peakHour >= 22 || peakHour < 4) {
    peakTimePersona = 'Midnight Oil Owls';
  } else if (peakHour >= 5 && peakHour < 11) {
    peakTimePersona = 'Early Morning Espresso Sync';
  } else if (peakHour >= 11 && peakHour < 17) {
    peakTimePersona = 'Midday Rapid-Fire Crew';
  }

  let vibeBadge = 'High-Reciprocity Wavelength';
  if (participants.length >= 2) {
    const shareDiff = Math.abs(
      participants[0].messageSharePct - participants[1].messageSharePct,
    );
    if (shareDiff <= 10 && fastestObj.medianReplySeconds <= 180) {
      vibeBadge = 'Electric 50/50 Synergy';
    } else if (streaks.activeDaysPct >= 75) {
      vibeBadge = 'Unbreakable Daily Ritual';
    } else if (heatmap.lateNightPct >= 22) {
      vibeBadge = 'Late-Night Deep Divers';
    }
  }

  return {
    chatTitle,
    dateRangeLabel: `${streaks.firstMessageDate} → ${streaks.lastMessageDate}`,
    totalMessages,
    totalWords,
    activeDays: streaks.activeDays,
    longestStreakDays: streaks.longestStreak.days,
    topInitiator: {
      name: topInitiatorObj.name,
      pct: topInitiatorObj.initiationSharePct,
    },
    fastestResponder: {
      name: fastestObj.name,
      medianSeconds: fastestObj.medianReplySeconds,
    },
    topChatter: {
      name: topChatterObj.name,
      pct: topChatterObj.messageSharePct,
    },
    doubleTextChampion: {
      name: doubleTextObj.name,
      indexPct: doubleTextObj.doubleTextIndexPct,
    },
    signatureEmojis: topEmojis.slice(0, 5).map((e) => e.emoji),
    signatureWords: topWords.slice(0, 5).map((w) => w.word),
    peakTimePersona,
    vibeBadge,
  };
}
