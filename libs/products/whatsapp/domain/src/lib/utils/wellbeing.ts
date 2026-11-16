import type { ParsedChatMessage } from '../models/whatsapp.models';
import type {
  CheckInReason,
  CheckInWindow,
  CrisisLanguageSignal,
  DailyMoodPoint,
  ParticipantMoodSeries,
  WellbeingSummary,
} from '../models/wellbeing.models';
import { scoreMessageSentiment } from './sentiment-lexicon';

/** Tuning for check-in detection. Conservative on purpose: a nudge should be rare. */
export const CHECK_IN_RULES = {
  /** Days a person needs to have written on before their own baseline counts. */
  minBaselineDays: 5,
  baselineWindowDays: 30,
  /** A day needs this many messages from the person to be judged at all. */
  minMessagesPerDay: 3,
  /** How far below their baseline tone a day must sit. */
  toneDropThreshold: 0.25,
  slowerRepliesFactor: 2,
  shorterMessagesFactor: 0.6,
  fewerMessagesFactor: 0.5,
  /** Flagged days needed to form a window. */
  minFlaggedDays: 2,
  /** Quiet calendar days allowed between flagged days in one window. */
  maxGapDays: 1,
  /** Replies slower than this are a new conversation, not a reply. */
  maxReplyGapSeconds: 12 * 3600,
} as const;

const DAY_MS = 86_400_000;

function messageText(msg: ParsedChatMessage): string {
  return [msg.text, msg.audioTranslation ?? msg.audioTranscript ?? '']
    .filter(Boolean)
    .join(' ');
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: readonly number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isoDayToMs(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function msToIsoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((isoDayToMs(toIso) - isoDayToMs(fromIso)) / DAY_MS);
}

/** Per-sender, per-day tone, length, volume and reply latency. Messages must be time-sorted. */
export function buildDailyMoodSeries(
  messages: readonly ParsedChatMessage[],
): ParticipantMoodSeries[] {
  interface DayAcc {
    count: number;
    pos: number;
    neg: number;
    words: number;
    replies: number[];
  }
  const bySender = new Map<string, Map<string, DayAcc>>();
  let previous: ParsedChatMessage | null = null;

  for (const msg of messages) {
    let days = bySender.get(msg.sender);
    if (!days) {
      days = new Map();
      bySender.set(msg.sender, days);
    }
    let acc = days.get(msg.isoDate);
    if (!acc) {
      acc = { count: 0, pos: 0, neg: 0, words: 0, replies: [] };
      days.set(msg.isoDate, acc);
    }

    acc.count++;
    acc.words += msg.wordCount;
    if (!msg.isDeleted) {
      const { polarity } = scoreMessageSentiment(messageText(msg));
      if (polarity > 0) acc.pos++;
      if (polarity < 0) acc.neg++;
    }
    if (previous && previous.sender !== msg.sender) {
      const gap = (msg.timestampMs - previous.timestampMs) / 1000;
      if (gap >= 0 && gap <= CHECK_IN_RULES.maxReplyGapSeconds) {
        acc.replies.push(gap);
      }
    }
    previous = msg;
  }

  return Array.from(bySender.entries()).map(([sender, days]) => ({
    sender,
    points: Array.from(days.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, acc]): DailyMoodPoint => ({
        date,
        messageCount: acc.count,
        positiveMessages: acc.pos,
        negativeMessages: acc.neg,
        netTone: round2((acc.pos - acc.neg) / acc.count),
        averageWords: round2(acc.words / acc.count),
        medianReplySeconds: median(acc.replies),
      })),
  }));
}

/**
 * Flags runs of days where a person's tone sits clearly below their own recent
 * baseline AND a second behaviour shifts too (slower, shorter or fewer replies).
 * Tone alone, or a quiet day alone, never flags anything.
 */
export function detectCheckInWindows(
  series: readonly ParticipantMoodSeries[],
): CheckInWindow[] {
  const rules = CHECK_IN_RULES;
  const windows: CheckInWindow[] = [];

  for (const { sender, points } of series) {
    const flagged: { date: string; reasons: CheckInReason[] }[] = [];

    points.forEach((point, i) => {
      if (point.messageCount < rules.minMessagesPerDay) return;
      const dayMs = isoDayToMs(point.date);
      const baseline = points
        .slice(0, i)
        .filter(
          (p) =>
            dayMs - isoDayToMs(p.date) <= rules.baselineWindowDays * DAY_MS,
        );
      if (baseline.length < rules.minBaselineDays) return;

      const baseTone = mean(baseline.map((p) => p.netTone));
      if (point.netTone >= 0) return;
      if (point.netTone > baseTone - rules.toneDropThreshold) return;

      const secondary: CheckInReason[] = [];
      const baseReplies = baseline
        .map((p) => p.medianReplySeconds)
        .filter((v): v is number => v !== null);
      const baseReply = median(baseReplies);
      if (
        baseReply !== null &&
        baseReply > 0 &&
        point.medianReplySeconds !== null &&
        point.medianReplySeconds >= baseReply * rules.slowerRepliesFactor
      ) {
        secondary.push('slower_replies');
      }
      const baseWords = mean(baseline.map((p) => p.averageWords));
      if (
        baseWords > 0 &&
        point.averageWords <= baseWords * rules.shorterMessagesFactor
      ) {
        secondary.push('shorter_messages');
      }
      const baseCount = mean(baseline.map((p) => p.messageCount));
      if (point.messageCount <= baseCount * rules.fewerMessagesFactor) {
        secondary.push('fewer_messages');
      }
      if (secondary.length === 0) return;

      flagged.push({ date: point.date, reasons: ['lower_tone', ...secondary] });
    });

    let run: typeof flagged = [];
    const flush = () => {
      if (run.length >= rules.minFlaggedDays) {
        windows.push({
          sender,
          startDate: run[0].date,
          endDate: run[run.length - 1].date,
          flaggedDays: run.length,
          reasons: Array.from(new Set(run.flatMap((d) => d.reasons))),
        });
      }
      run = [];
    };
    for (const day of flagged) {
      const last = run[run.length - 1];
      if (last && daysBetween(last.date, day.date) > rules.maxGapDays + 1) {
        flush();
      }
      run.push(day);
    }
    flush();
  }

  return windows.sort((a, b) => b.endDate.localeCompare(a.endDate));
}

/**
 * Deliberately narrow phrase list for explicit self-harm language. A match only
 * shows support resources in the UI; the text itself is never stored or shown.
 */
const CRISIS_LANGUAGE_REGEX = new RegExp(
  [
    // English
    String.raw`\b(want|wanna|going)\s+to\s+die\b`,
    String.raw`\bwanna\s+die\b`,
    String.raw`\bkill(ing)?\s+myself\b`,
    String.raw`\bend\s+(my\s+life|it\s+all)\b`,
    String.raw`\bsuicidal\b`,
    String.raw`\b(don'?t|do\s+not)\s+want\s+to\s+(live|be\s+alive)\b`,
    String.raw`\bno\s+reason\s+to\s+live\b`,
    String.raw`\bhurt(ing)?\s+myself\b`,
    // French
    String.raw`\benvie\s+de\s+mourir\b`,
    String.raw`\bme\s+suicider\b`,
    String.raw`\bme\s+tuer\b`,
    String.raw`\ben\s+finir\s+avec\s+la\s+vie\b`,
    String.raw`\bplus\s+envie\s+de\s+vivre\b`,
    // Spanish
    String.raw`\bquiero\s+morir(me)?\b`,
    String.raw`\bsuicidarme\b`,
    String.raw`\bmatarme\b`,
    String.raw`\bno\s+quiero\s+vivir\b`,
    // Tunisian Derja (Latin script)
    String.raw`\bn(h|7)e?b\s+nmout\b`,
    String.raw`\bnaktel\s+rou(h|7)i\b`,
    // Arabic script
    'نحب نموت',
    'ما نحبش نعيش',
    'نقتل روحي',
    'أريد أن أموت',
    'اريد ان اموت',
    'بدي موت',
    'انتحر',
  ].join('|'),
  'iu',
);

export function detectCrisisLanguage(
  messages: readonly ParsedChatMessage[],
): CrisisLanguageSignal {
  const dates = new Set<string>();
  const senders = new Set<string>();
  for (const msg of messages) {
    if (msg.isDeleted) continue;
    if (CRISIS_LANGUAGE_REGEX.test(messageText(msg))) {
      dates.add(msg.isoDate);
      senders.add(msg.sender);
    }
  }
  return {
    detected: dates.size > 0,
    dates: Array.from(dates).sort(),
    senders: Array.from(senders),
  };
}

export function buildWellbeingSummary(
  messages: readonly ParsedChatMessage[],
): WellbeingSummary {
  const series = buildDailyMoodSeries(messages);
  return {
    series,
    checkInWindows: detectCheckInWindows(series),
    crisisSignal: detectCrisisLanguage(messages),
  };
}
