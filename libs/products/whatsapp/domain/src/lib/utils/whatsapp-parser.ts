import {
  DateDetectionSummary,
  DateOrderMode,
  MediaCategory,
  ParsedChatMessage,
  ParseTranscriptResult,
  ResolvedDateOrder,
  SystemNotice,
} from '../models/whatsapp.models';
import {
  classifyMediaFileName,
  cleanInvisibleFormatting,
} from './zip-extractor';

interface RawHeaderMatch {
  lineNumber: number;
  headerStyle: 'ios-bracket' | 'android-dash';
  datePart1: number;
  datePart2: number;
  datePart3: number;
  rawPart1Str: string;
  hour: number;
  minute: number;
  second: number;
  meridiem: 'AM' | 'PM' | null;
  remainder: string;
}

/**
 * Matches iOS bracketed format:
 * e.g. [14/03/2026, 21:15:04] Maya Lin: Hey!
 * e.g. [3/14/26, 9:15:04 PM] Maya Lin: Hey!
 */
const IOS_HEADER_REGEX =
  /^\[(\d{1,4})[/. -](\d{1,2})[/. -](\d{1,4})(?:,|\s+à|\s+at|\s+um|\s+a\s+las)?\s+(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?(?:\s*([AaPp]\.?\s*[Mm]\.?|ص|م))?\]\s*(.*)$/;

/**
 * Matches Android dash format:
 * e.g. 14/03/2026, 21:15 - Maya Lin: Hey!
 * e.g. 14/03/2026 à 21:15 - Maya Lin: Hey!
 * e.g. 3/14/26, 9:15 PM - Maya Lin: Hey!
 * e.g. 2026-03-14, 21:15 - Maya Lin: Hey!
 */
const ANDROID_HEADER_REGEX =
  /^(\d{1,4})[/. -](\d{1,2})[/. -](\d{1,4})(?:,|\s+à|\s+at|\s+um|\s+a\s+las)?\s+(\d{1,2})[:.h](\d{2})(?:[:.](\d{2}))?(?:\s*([AaPp]\.?\s*[Mm]\.?|ص|م))?\s+[-–—]\s+(.*)$/;

const MEDIA_PATTERNS: readonly RegExp[] = [
  /<media omitted>/i,
  /\b(?:image|video|audio|voice|sticker|gif|document|contact card)\s+omitted\b/i,
  /\b(?:image|vidéo|video|audio|vocal|sticker|gif|document|fiche contact)\s+(?:omis|omise|retiré)\b/i,
  /<(?:attached|pièce jointe|piece jointe|adjunto|مرفق)\s*:\s*[^>]+>/i,
  /\((?:file attached|fichier joint|archivo adjunto|datei angehängt|الملف مرفق)\)/i,
  /<médias? omis>/i,
  /<multimedia omitido>/i,
  /<medien ausgeschlossen>/i,
  /<تم استبعاد الوسائط>/i,
];

const IOS_ATTACHED_REGEX =
  /<(?:attached|pièce jointe|piece jointe|adjunto|مرفق)\s*:\s*([^>]+)>/i;
const ANDROID_ATTACHED_REGEX =
  /([^\n(]+?\.[a-zA-Z0-9]{2,5})\s*\((?:file attached|fichier joint|archivo adjunto|datei angehängt|الملف مرفق)\)/i;

const DELETED_PATTERNS: readonly RegExp[] = [
  /^this message was deleted\.?$/i,
  /^you deleted this message\.?$/i,
  /^ce message a été supprimé\.?$/i,
  /^vous avez supprimé ce message\.?$/i,
  /^este mensaje fue eliminado\.?$/i,
];

const SYSTEM_MESSAGE_PATTERNS: readonly RegExp[] = [
  /messages and calls are end-to-end encrypted/i,
  /your security code with .+ changed/i,
  /changed the subject from/i,
  /changed this group's icon/i,
  /changed the group description/i,
  /created group "/i,
  /added you/i,
  /left$/i,
  /joined using this group's invite link/i,
  /pinned a message/i,
  /disappearing messages were turned/i,
  /waiting for this message\. this may take a while/i,
];

const EMOJI_REGEX =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
const URL_REGEX = /https?:\/\/[^\s<>"]+|www\.[^\s<>"]+/i;

function normalizeMeridiem(raw: string | undefined): 'AM' | 'PM' | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[.\s]/g, '').toUpperCase();
  if (cleaned === 'PM' || cleaned === 'م') return 'PM';
  if (cleaned === 'AM' || cleaned === 'ص') return 'AM';
  return null;
}

function matchLineHeader(
  line: string,
  lineNumber: number,
): RawHeaderMatch | null {
  const iosMatch = IOS_HEADER_REGEX.exec(line);
  if (iosMatch) {
    return {
      lineNumber,
      headerStyle: 'ios-bracket',
      rawPart1Str: iosMatch[1],
      datePart1: Number.parseInt(iosMatch[1], 10),
      datePart2: Number.parseInt(iosMatch[2], 10),
      datePart3: Number.parseInt(iosMatch[3], 10),
      hour: Number.parseInt(iosMatch[4], 10),
      minute: Number.parseInt(iosMatch[5], 10),
      second: iosMatch[6] ? Number.parseInt(iosMatch[6], 10) : 0,
      meridiem: normalizeMeridiem(iosMatch[7]),
      remainder: iosMatch[8],
    };
  }

  const androidMatch = ANDROID_HEADER_REGEX.exec(line);
  if (androidMatch) {
    return {
      lineNumber,
      headerStyle: 'android-dash',
      rawPart1Str: androidMatch[1],
      datePart1: Number.parseInt(androidMatch[1], 10),
      datePart2: Number.parseInt(androidMatch[2], 10),
      datePart3: Number.parseInt(androidMatch[3], 10),
      hour: Number.parseInt(androidMatch[4], 10),
      minute: Number.parseInt(androidMatch[5], 10),
      second: androidMatch[6] ? Number.parseInt(androidMatch[6], 10) : 0,
      meridiem: normalizeMeridiem(androidMatch[7]),
      remainder: androidMatch[8],
    };
  }

  return null;
}

export function detectDateOrder(
  headers: readonly RawHeaderMatch[],
  mode: DateOrderMode,
): DateDetectionSummary {
  let definitiveDmyCount = 0;
  let definitiveMdyCount = 0;
  let ambiguousDateCount = 0;
  let ymdCount = 0;
  let iosCount = 0;
  let androidCount = 0;

  for (const h of headers) {
    if (h.headerStyle === 'ios-bracket') {
      iosCount++;
    } else {
      androidCount++;
    }

    if (h.rawPart1Str.length === 4 || h.datePart1 > 1900) {
      ymdCount++;
      continue;
    }

    if (h.datePart1 > 12 && h.datePart2 <= 12) {
      definitiveDmyCount++;
    } else if (h.datePart2 > 12 && h.datePart1 <= 12) {
      definitiveMdyCount++;
    } else if (h.datePart1 <= 12 && h.datePart2 <= 12) {
      ambiguousDateCount++;
    }
  }

  const headerStyle: DateDetectionSummary['headerStyle'] =
    iosCount > 0 && androidCount > 0
      ? 'mixed'
      : iosCount >= androidCount
        ? 'ios-bracket'
        : 'android-dash';

  if (mode === 'DMY') {
    return {
      resolvedOrder: 'DMY',
      modeUsed: 'DMY',
      confidence: 'high',
      reason: 'Manual override set to DD/MM/YYYY (Day-first)',
      definitiveDmyCount,
      definitiveMdyCount,
      ambiguousDateCount,
      headerStyle,
    };
  }

  if (mode === 'MDY') {
    return {
      resolvedOrder: 'MDY',
      modeUsed: 'MDY',
      confidence: 'high',
      reason: 'Manual override set to MM/DD/YYYY (Month-first)',
      definitiveDmyCount,
      definitiveMdyCount,
      ambiguousDateCount,
      headerStyle,
    };
  }

  // Auto mode
  if (
    ymdCount > definitiveDmyCount &&
    ymdCount > definitiveMdyCount &&
    ymdCount > 0
  ) {
    return {
      resolvedOrder: 'YMD',
      modeUsed: 'auto',
      confidence: 'high',
      reason: `Detected ISO YYYY-MM-DD format (${ymdCount} timestamps)`,
      definitiveDmyCount,
      definitiveMdyCount,
      ambiguousDateCount,
      headerStyle,
    };
  }

  if (definitiveDmyCount > 0 && definitiveMdyCount === 0) {
    return {
      resolvedOrder: 'DMY',
      modeUsed: 'auto',
      confidence: 'high',
      reason: `Auto-detected DD/MM/YYYY from ${definitiveDmyCount} unambiguous day-first date${definitiveDmyCount === 1 ? '' : 's'} (day > 12 in slot 1)`,
      definitiveDmyCount,
      definitiveMdyCount,
      ambiguousDateCount,
      headerStyle,
    };
  }

  if (definitiveMdyCount > 0 && definitiveDmyCount === 0) {
    return {
      resolvedOrder: 'MDY',
      modeUsed: 'auto',
      confidence: 'high',
      reason: `Auto-detected MM/DD/YYYY from ${definitiveMdyCount} unambiguous month-first date${definitiveMdyCount === 1 ? '' : 's'} (day > 12 in slot 2)`,
      definitiveDmyCount,
      definitiveMdyCount,
      ambiguousDateCount,
      headerStyle,
    };
  }

  if (definitiveDmyCount > 0 && definitiveMdyCount > 0) {
    const resolvedOrder: ResolvedDateOrder =
      definitiveDmyCount >= definitiveMdyCount ? 'DMY' : 'MDY';
    return {
      resolvedOrder,
      modeUsed: 'auto',
      confidence: 'medium',
      reason: `Mixed date signals (${definitiveDmyCount} DMY vs ${definitiveMdyCount} MDY); selected majority ${resolvedOrder}`,
      definitiveDmyCount,
      definitiveMdyCount,
      ambiguousDateCount,
      headerStyle,
    };
  }

  return {
    resolvedOrder: 'DMY',
    modeUsed: 'auto',
    confidence: 'ambiguous',
    reason: `All ${ambiguousDateCount} dates have day ≤ 12; defaulted to DD/MM (toggle to MM/DD if needed)`,
    definitiveDmyCount,
    definitiveMdyCount,
    ambiguousDateCount,
    headerStyle,
  };
}

function normalizeYear(rawYear: number): number {
  if (rawYear < 100) {
    return rawYear >= 70 ? 1900 + rawYear : 2000 + rawYear;
  }
  return rawYear;
}

function resolveTimestamp(
  header: RawHeaderMatch,
  resolvedOrder: ResolvedDateOrder,
): { timestampMs: number; isoDate: string; hour: number; dayOfWeek: number } {
  let year: number;
  let month: number;
  let day: number;

  if (
    header.rawPart1Str.length === 4 ||
    header.datePart1 > 1900 ||
    resolvedOrder === 'YMD'
  ) {
    year = normalizeYear(header.datePart1);
    month = header.datePart2;
    day = header.datePart3;
  } else if (resolvedOrder === 'MDY') {
    month = header.datePart1;
    day = header.datePart2;
    year = normalizeYear(header.datePart3);
  } else {
    day = header.datePart1;
    month = header.datePart2;
    year = normalizeYear(header.datePart3);
  }

  // Fallback swap if manual override causes month > 12
  if (month > 12 && day <= 12) {
    const tmp = month;
    month = day;
    day = tmp;
  }

  month = Math.max(1, Math.min(12, month));
  day = Math.max(1, Math.min(31, day));

  let hour24 = header.hour;
  if (header.meridiem === 'PM' && hour24 < 12) {
    hour24 += 12;
  } else if (header.meridiem === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  hour24 = Math.max(0, Math.min(23, hour24));

  const dateObj = new Date(
    year,
    month - 1,
    day,
    hour24,
    header.minute,
    header.second,
  );
  const timestampMs = dateObj.getTime();
  const yyyy = String(dateObj.getFullYear()).padStart(4, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;

  // Convert JS getDay() (0=Sun..6=Sat) to ISO 0=Mon..6=Sun
  const jsDay = dateObj.getDay();
  const dayOfWeek = (jsDay + 6) % 7;

  return {
    timestampMs,
    isoDate,
    hour: hour24,
    dayOfWeek,
  };
}

export function extractEmojis(text: string): string[] {
  const matches = text.match(EMOJI_REGEX);
  if (!matches) {
    return [];
  }
  return matches;
}

export function countWordsInText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function classifyMediaText(text: string): {
  isMedia: boolean;
  mediaCategory?: MediaCategory;
  attachedFileName?: string;
  captionText: string;
} {
  const trimmed = text.trim();

  const iosMatch = IOS_ATTACHED_REGEX.exec(trimmed);
  if (iosMatch) {
    const rawName =
      iosMatch[1].trim().split(/[/\\]/).pop() ?? iosMatch[1].trim();
    const { category } = classifyMediaFileName(rawName);
    const captionText = trimmed.replace(IOS_ATTACHED_REGEX, '').trim();
    return {
      isMedia: true,
      mediaCategory: category,
      attachedFileName: rawName,
      captionText,
    };
  }

  const androidMatch = ANDROID_ATTACHED_REGEX.exec(trimmed);
  if (androidMatch) {
    const rawName =
      androidMatch[1].trim().split(/[/\\]/).pop() ?? androidMatch[1].trim();
    const { category } = classifyMediaFileName(rawName);
    const captionText = trimmed.replace(ANDROID_ATTACHED_REGEX, '').trim();
    return {
      isMedia: true,
      mediaCategory: category,
      attachedFileName: rawName,
      captionText,
    };
  }

  if (
    /\b(?:audio|voice(?:\s+note)?|vocal)\s+(?:omitted|omis|omitido)\b/i.test(
      trimmed,
    )
  ) {
    return {
      isMedia: true,
      mediaCategory: 'audio',
      captionText: trimmed
        .replace(
          /\b(?:audio|voice(?:\s+note)?|vocal)\s+(?:omitted|omis|omitido)\b/gi,
          '',
        )
        .trim(),
    };
  }
  if (/\b(?:image|imagen)\s+(?:omitted|omise|omitida)\b/i.test(trimmed)) {
    return {
      isMedia: true,
      mediaCategory: 'image',
      captionText: trimmed
        .replace(/\b(?:image|imagen)\s+(?:omitted|omise|omitida)\b/gi, '')
        .trim(),
    };
  }
  if (/\b(?:video|vidéo)\s+(?:omitted|omis|omise|omitido)\b/i.test(trimmed)) {
    return {
      isMedia: true,
      mediaCategory: 'video',
      captionText: trimmed
        .replace(/\b(?:video|vidéo)\s+(?:omitted|omis|omise|omitido)\b/gi, '')
        .trim(),
    };
  }
  if (/\bsticker\s+(?:omitted|omis|omitido)\b/i.test(trimmed)) {
    return {
      isMedia: true,
      mediaCategory: 'sticker',
      captionText: trimmed
        .replace(/\bsticker\s+(?:omitted|omis|omitido)\b/gi, '')
        .trim(),
    };
  }
  if (/\bgif\s+(?:omitted|omis|retiré|omitido)\b/i.test(trimmed)) {
    return {
      isMedia: true,
      mediaCategory: 'gif',
      captionText: trimmed
        .replace(/\bgif\s+(?:omitted|omis|retiré|omitido)\b/gi, '')
        .trim(),
    };
  }
  if (
    /\b(?:document|contact card|fiche contact)\s+(?:omitted|omis|omise|omitido)\b/i.test(
      trimmed,
    )
  ) {
    return {
      isMedia: true,
      mediaCategory: 'document',
      captionText: trimmed
        .replace(
          /\b(?:document|contact card|fiche contact)\s+(?:omitted|omis|omise|omitido)\b/gi,
          '',
        )
        .trim(),
    };
  }
  if (MEDIA_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      isMedia: true,
      mediaCategory: 'generic_media',
      captionText: trimmed
        .replace(/<media omitted>|<médias omis>|<multimedia omitido>/gi, '')
        .trim(),
    };
  }

  return {
    isMedia: false,
    captionText: trimmed,
  };
}

function isDeletedMessageText(text: string): boolean {
  const trimmed = text.trim();
  return DELETED_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function isSystemNotificationText(text: string): boolean {
  const trimmed = text.trim();
  return SYSTEM_MESSAGE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function enrichMessageMetrics(msg: ParsedChatMessage): void {
  const trimmed = msg.text.trim();
  const mediaInfo = classifyMediaText(trimmed);
  msg.isMedia = mediaInfo.isMedia;
  msg.mediaCategory = mediaInfo.mediaCategory;
  msg.attachedFileName = mediaInfo.attachedFileName;
  msg.isDeleted = isDeletedMessageText(trimmed);

  if (msg.isDeleted) {
    msg.wordCount = 0;
    msg.charCount = 0;
    msg.emojis = [];
    msg.hasLink = false;
    msg.isQuestion = false;
    return;
  }

  if (msg.isMedia) {
    const effectiveSpokenOrCaption = [
      mediaInfo.captionText,
      msg.audioTranscript ?? '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!effectiveSpokenOrCaption) {
      msg.wordCount = 0;
      msg.charCount = 0;
      msg.emojis = [];
      msg.hasLink = false;
      msg.isQuestion = false;
      return;
    }

    msg.wordCount = countWordsInText(effectiveSpokenOrCaption);
    msg.charCount = effectiveSpokenOrCaption.length;
    msg.emojis = extractEmojis(effectiveSpokenOrCaption);
    msg.hasLink = URL_REGEX.test(effectiveSpokenOrCaption);
    msg.isQuestion =
      effectiveSpokenOrCaption.includes('?') ||
      effectiveSpokenOrCaption.includes('؟') ||
      effectiveSpokenOrCaption.includes('¿');
    return;
  }

  msg.wordCount = countWordsInText(trimmed);
  msg.charCount = trimmed.length;
  msg.emojis = extractEmojis(trimmed);
  msg.hasLink = URL_REGEX.test(trimmed);
  msg.isQuestion =
    trimmed.includes('?') || trimmed.includes('؟') || trimmed.includes('¿');
}

/**
 * Parses a raw WhatsApp chat transcript (.txt content) into structured messages,
 * filtering system notices, merging multi-line messages, and resolving date order.
 */
export function parseWhatsAppTranscript(
  rawInput: string,
  dateOrderMode: DateOrderMode = 'auto',
): ParseTranscriptResult {
  const { cleanedText, strippedCount } = cleanInvisibleFormatting(rawInput);
  const rawLines = cleanedText.split('\n');

  // First pass: collect all header matches for date order detection
  const lineHeaders: Array<RawHeaderMatch | null> = new Array(rawLines.length);
  const validHeaders: RawHeaderMatch[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const match = matchLineHeader(rawLines[i], i + 1);
    lineHeaders[i] = match;
    if (match) {
      validHeaders.push(match);
    }
  }

  const dateDetection = detectDateOrder(validHeaders, dateOrderMode);
  const messages: ParsedChatMessage[] = [];
  const systemNotices: SystemNotice[] = [];
  const participantSet = new Set<string>();
  let multilineContinuationCount = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const header = lineHeaders[i];

    if (header) {
      const { timestampMs, isoDate, hour, dayOfWeek } = resolveTimestamp(
        header,
        dateDetection.resolvedOrder,
      );

      let colonIdx = header.remainder.indexOf(': ');
      let bodyStartOffset = 2;
      if (colonIdx === -1 && header.remainder.trimEnd().endsWith(':')) {
        colonIdx = header.remainder.lastIndexOf(':');
        bodyStartOffset = 1;
      }
      if (colonIdx === -1) {
        // System notice without "Sender: Message" separator
        systemNotices.push({
          timestampMs,
          text: header.remainder.trim(),
          lineNumber: i + 1,
        });
        continue;
      }

      const sender = header.remainder.slice(0, colonIdx).trim();
      const body = header.remainder.slice(colonIdx + bodyStartOffset);

      // Guard against system notices that contain a colon or invalid sender
      if (
        !sender ||
        sender.length > 64 ||
        isSystemNotificationText(header.remainder)
      ) {
        systemNotices.push({
          timestampMs,
          text: header.remainder.trim(),
          lineNumber: i + 1,
        });
        continue;
      }

      participantSet.add(sender);

      const msg: ParsedChatMessage = {
        id: `msg-${messages.length + 1}`,
        index: messages.length,
        timestampMs,
        isoDate,
        hour,
        dayOfWeek,
        sender,
        text: body,
        isMedia: false,
        isDeleted: false,
        wordCount: 0,
        charCount: 0,
        emojis: [],
        hasLink: false,
        isQuestion: false,
        isMultiline: false,
      };
      enrichMessageMetrics(msg);
      messages.push(msg);
    } else {
      // Continuation line or leading headerless line
      const trimmedContinuation = rawLine.trim();
      if (!trimmedContinuation) {
        continue;
      }

      if (messages.length > 0) {
        const prev = messages[messages.length - 1];
        prev.text = `${prev.text}\n${rawLine}`;
        prev.isMultiline = true;
        multilineContinuationCount++;
        enrichMessageMetrics(prev);
      } else {
        systemNotices.push({
          timestampMs: null,
          text: trimmedContinuation,
          lineNumber: i + 1,
        });
      }
    }
  }

  return {
    messages,
    systemNotices,
    participants: Array.from(participantSet),
    dateDetection,
    strippedInvisibleChars: strippedCount,
    rawLineCount: rawLines.length,
    multilineContinuationCount,
  };
}
