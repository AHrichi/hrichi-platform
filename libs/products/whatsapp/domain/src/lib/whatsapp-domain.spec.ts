import { describe, expect, it } from 'vitest';
import {
  analyzeWhatsAppChat,
  buildAiWebhookPayload,
  buildInMemoryZipArchive,
  buildMediaEntriesFromFiles,
  cleanInvisibleFormatting,
  extractTranscriptFromZip,
  ingestPlainTextTranscript,
  isZipBuffer,
  normalizeAiWebhookResponse,
  parseWhatsAppTranscript,
} from '../index';

describe('WhatsApp Domain Engine (@ah/products/whatsapp/domain)', () => {
  describe('Invisible Formatting Cleanup & In-Memory ZIP Extraction', () => {
    it('strips UTF-8 BOM, LRM/RLM directional marks, and normalizes narrow no-break spaces', () => {
      const dirty =
        '\uFEFF\u200E[14/02/2026, 09:15:00\u202FPM] \u202AMaya\u202C: Hello\u00A0World!\r\n';
      const { cleanedText, strippedCount } = cleanInvisibleFormatting(dirty);

      expect(cleanedText).toBe(
        '[14/02/2026, 09:15:00 PM] Maya: Hello World!\n',
      );
      expect(strippedCount).toBeGreaterThanOrEqual(4);
    });

    it('extracts _chat.txt from a ZIP archive in memory while skipping bundled media files', async () => {
      const chatText =
        '[15/03/2026, 10:00:00] Alice: Hey Bob!\n[15/03/2026, 10:01:30] Bob: Hey Alice 🚀';
      const fakeJpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const fakeMp4 = new Uint8Array([0x00, 0x00, 0x00, 0x18, 0x66, 0x74]);

      const zipBuffer = buildInMemoryZipArchive([
        { name: 'IMG-20260315-WA0001.jpg', content: fakeJpg },
        { name: '_chat.txt', content: chatText },
        { name: 'VID-20260315-WA0002.mp4', content: fakeMp4 },
      ]);

      const result = await extractTranscriptFromZip(
        zipBuffer,
        'whatsapp-export.zip',
      );

      expect(result.sourceType).toBe('zip');
      expect(result.transcriptFileName).toBe('_chat.txt');
      expect(result.skippedMediaCount).toBe(2);
      expect(result.skippedMediaFiles).toEqual([
        'IMG-20260315-WA0001.jpg',
        'VID-20260315-WA0002.mp4',
      ]);
      expect(result.rawText).toContain('Alice: Hey Bob!');
    });
  });

  describe('Multi-Format Parser & Date Order Detection', () => {
    it('auto-detects DD/MM (DMY) for iOS bracket exports and stitches multi-line messages', () => {
      const raw = [
        '[14/02/2026, 09:00:00] Messages and calls are end-to-end encrypted.',
        '[14/02/2026, 09:10:00] Maya Lin: Line one of my thought',
        'Line two continues here',
        'Line three wraps it up!',
        '[14/02/2026, 09:12:00] Liam Vance: <Media omitted>',
        '[14/02/2026, 09:13:00] Maya Lin: This message was deleted',
      ].join('\n');

      const parsed = parseWhatsAppTranscript(raw, 'auto');

      expect(parsed.dateDetection.resolvedOrder).toBe('DMY');
      expect(parsed.dateDetection.confidence).toBe('high');
      expect(parsed.systemNotices.length).toBe(1);
      expect(parsed.messages.length).toBe(3);
      expect(parsed.multilineContinuationCount).toBe(2);

      const first = parsed.messages[0];
      expect(first.isMultiline).toBe(true);
      expect(first.isoDate).toBe('2026-02-14');
      expect(first.text).toContain('Line two continues here');

      expect(parsed.messages[1].isMedia).toBe(true);
      expect(parsed.messages[2].isDeleted).toBe(true);
    });

    it('auto-detects MM/DD (MDY) for Android dash exports with 12h AM/PM timestamps', () => {
      const raw = [
        '3/18/26, 9:05 AM - Elena: Good morning!',
        '3/18/26, 9:07 PM - Noah: Good evening from Tokyo 🏮',
      ].join('\n');

      const parsed = parseWhatsAppTranscript(raw, 'auto');

      expect(parsed.dateDetection.resolvedOrder).toBe('MDY');
      expect(parsed.dateDetection.headerStyle).toBe('android-dash');
      expect(parsed.messages[0].isoDate).toBe('2026-03-18');
      expect(parsed.messages[0].hour).toBe(9);
      expect(parsed.messages[1].hour).toBe(21);
    });

    it('allows instant manual toggle between DD/MM and MM/DD on ambiguous dates', () => {
      const ambiguousRaw = [
        '[04/05/2026, 12:00:00] Alice: Is this May 4th or April 5th?',
        '[04/05/2026, 12:02:00] Bob: Let us toggle the date format!',
      ].join('\n');

      const asDmy = parseWhatsAppTranscript(ambiguousRaw, 'DMY');
      const asMdy = parseWhatsAppTranscript(ambiguousRaw, 'MDY');

      expect(asDmy.messages[0].isoDate).toBe('2026-05-04');
      expect(asMdy.messages[0].isoDate).toBe('2026-04-05');
    });
  });

  describe('Analytics Engine & AI Sampler', () => {
    const sampleTranscript = [
      '[10/02/2026, 09:14:22] Maya Lin: Morning Liam! ☀️ Did you see the beta waitlist numbers?',
      '[10/02/2026, 09:15:08] Liam Vance: Just opened PostHog right now ☕🔥 We crossed 1,400 signups!',
      '[11/02/2026, 10:05:14] Liam Vance: Morning! How did the design review go?',
      '[11/02/2026, 10:06:40] Maya Lin: They loved the zero-server privacy architecture! 💡',
      '[12/02/2026, 23:15:00] Maya Lin: Late night deploy complete 🚀✨',
      '[12/02/2026, 23:16:30] Liam Vance: Awesome work!! 🔥❤️',
    ].join('\n');

    it('computes participant volumes, reply dynamics, streaks, heatmap, and Wrapped summary', () => {
      const extraction = ingestPlainTextTranscript(
        sampleTranscript,
        '_chat.txt',
        'txt',
      );
      const report = analyzeWhatsAppChat(extraction, {
        dateOrderMode: 'auto',
        sessionGapMinutes: 180,
        customStopwords: ['just'],
      });

      expect(report.totalMessages).toBe(6);
      expect(report.participants.length).toBe(2);
      expect(report.streaksAndTimeline.longestStreak.days).toBe(3);
      expect(report.heatmap.matrix.length).toBe(7);
      expect(report.heatmap.matrix[0].length).toBe(24);
      expect(report.topEmojis.length).toBeGreaterThan(0);
      expect(report.topWords.some((w) => w.word === 'just')).toBe(false);
      expect(report.wrapped.longestStreakDays).toBe(3);
    });

    it('builds stratified n8n AI webhook payloads and normalizes webhook responses', () => {
      const extraction = ingestPlainTextTranscript(
        sampleTranscript,
        '_chat.txt',
        'txt',
      );
      const parsed = parseWhatsAppTranscript(extraction.rawText, 'auto');
      const report = analyzeWhatsAppChat(extraction);
      const payload = buildAiWebhookPayload(report, parsed.messages, 25);

      expect(payload.action).toBe('analyze_whatsapp_chat');
      expect(payload.sampledWindows.length).toBeGreaterThanOrEqual(3);
      expect(payload.quantitativeMetrics.participants.length).toBe(2);

      const normalized = normalizeAiWebhookResponse(
        {
          provider: 'Groq LPU (openai/gpt-oss-120b)',
          reciprocityScore: 94,
          relationshipDynamicTitle: 'Secure Co-Founder Bond',
        },
        report,
        payload,
      );

      expect(normalized.provider).toBe('Groq LPU (openai/gpt-oss-120b)');
      expect(normalized.reciprocityScore).toBe(94);
      expect(normalized.relationshipDynamicTitle).toBe(
        'Secure Co-Founder Bond',
      );
      expect(normalized.participantProfiles.length).toBe(2);
    });

    it('extracts multimedia breakdown, computes Ogg/Opus voice note duration, and folds transcribed audio into word analytics', async () => {
      // Construct a synthetic Ogg Opus packet with 'OggS' header and granule position = 48000 * 15 (15 seconds)
      const oggBytes = new Uint8Array(64);
      oggBytes[0] = 0x4f; // 'O'
      oggBytes[1] = 0x67; // 'g'
      oggBytes[2] = 0x67; // 'g'
      oggBytes[3] = 0x53; // 'S'
      const granuleSamples = 48000 * 15; // 720,000 samples = 15.0s at 48kHz
      oggBytes[6] = granuleSamples & 0xff;
      oggBytes[7] = (granuleSamples >> 8) & 0xff;
      oggBytes[8] = (granuleSamples >> 16) & 0xff;
      oggBytes[9] = (granuleSamples >> 24) & 0xff;

      const fakeJpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const fakeMp4 = new Uint8Array(2048);

      const chatText = [
        '[15/03/2026, 10:00:00] Maya Lin: Hey Liam! Listen to this voice update:',
        '[15/03/2026, 10:01:00] Maya Lin: <attached: PTT-20260315-WA0001.opus>',
        '[15/03/2026, 10:02:15] Liam Vance: IMG-20260315-WA0002.jpg (file attached)',
        '[15/03/2026, 10:03:00] Liam Vance: VID-20260315-WA0003.mp4 (file attached)',
      ].join('\n');

      const zipBuffer = buildInMemoryZipArchive([
        { name: '_chat.txt', content: chatText },
        { name: 'PTT-20260315-WA0001.opus', content: oggBytes },
        { name: 'IMG-20260315-WA0002.jpg', content: fakeJpg },
        { name: 'VID-20260315-WA0003.mp4', content: fakeMp4 },
      ]);

      const extraction = await extractTranscriptFromZip(
        zipBuffer,
        'multimedia-chat.zip',
      );
      expect(extraction.mediaEntries?.length).toBe(3);
      expect(extraction.extractedAudioFiles?.length).toBe(1);
      expect(extraction.extractedAudioFiles?.[0].durationSeconds).toBe(15);

      const reportWithoutTranscript = analyzeWhatsAppChat(extraction);
      expect(reportWithoutTranscript.mediaAnalytics.byCategory.audio).toBe(1);
      expect(reportWithoutTranscript.mediaAnalytics.byCategory.image).toBe(1);
      expect(reportWithoutTranscript.mediaAnalytics.byCategory.video).toBe(1);
      expect(
        reportWithoutTranscript.mediaAnalytics.totalAudioDurationSeconds,
      ).toBe(15);

      const reportWithTranscript = analyzeWhatsAppChat(extraction, {
        audioTranscripts: {
          'PTT-20260315-WA0001.opus':
            'We finalized the architecture roadmap and deployed the Cloudflare edge worker successfully!',
        },
      });

      expect(
        reportWithTranscript.mediaAnalytics.transcribedVoiceNoteCount,
      ).toBe(1);
      expect(reportWithTranscript.mediaAnalytics.transcribedWordsAdded).toBe(
        12,
      );
      expect(reportWithTranscript.totalWords).toBe(
        reportWithoutTranscript.totalWords + 12,
      );
      expect(
        reportWithTranscript.topWords.some(
          (w) => w.word === 'architecture' || w.word === 'cloudflare',
        ),
      ).toBe(true);
    });

    it('parses French & international Google Drive WhatsApp exports ("à" separator, fichier joint, and multi-file Drive folders)', () => {
      const frenchDriveChat = [
        '14/03/2026 à 21:15 - Ahmed: Salut Sara ! Tu as écouté le vocal ?',
        '14/03/2026 à 21:16 - Ahmed: PTT-20260314-WA0001.opus (fichier joint)',
        '[14/03/2026 21:17:04] Sara: <pièce jointe : IMG-20260314-WA0002.jpg>',
        '14/03/2026 à 21:18 - Sara: <Médias omis>',
      ].join('\n');

      const parsed = parseWhatsAppTranscript(frenchDriveChat, 'auto');
      expect(parsed.messages.length).toBe(4);
      expect(parsed.messages[1].isMedia).toBe(true);
      expect(parsed.messages[1].mediaCategory).toBe('audio');
      expect(parsed.messages[1].attachedFileName).toBe(
        'PTT-20260314-WA0001.opus',
      );
      expect(parsed.messages[2].mediaCategory).toBe('image');
      expect(parsed.messages[3].isMedia).toBe(true);

      const oggBuffer = new Uint8Array(64).buffer;
      const builtMedia = buildMediaEntriesFromFiles([
        { name: 'PTT-20260314-WA0001.opus', buffer: oggBuffer },
      ]);
      expect(builtMedia.extractedAudioFiles.length).toBe(1);

      const zipBuf = buildInMemoryZipArchive([
        { name: '_chat.txt', content: frenchDriveChat },
      ]);
      expect(isZipBuffer(zipBuf)).toBe(true);
    });
  });
});
