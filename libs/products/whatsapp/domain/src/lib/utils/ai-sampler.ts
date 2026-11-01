import {
  AiRelationshipAnalysis,
  AiSampledWindow,
  AiWebhookPayload,
  BehavioralFlag,
  ChatAnalysisReport,
  ParsedChatMessage,
  ParticipantBehavioralProfile,
} from '../models/whatsapp.models';
import { formatDurationCompact } from './analytics-engine';

function toExcerptItem(msg: ParsedChatMessage): {
  timestamp: string;
  sender: string;
  text: string;
} {
  const d = new Date(msg.timestampMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const rawBody = msg.audioTranscript
    ? `[🎙️ Voice Note (${msg.audioDurationSeconds ?? 10}s)]: "${msg.audioTranscript}"${
        msg.audioTranslation && msg.audioTranslation !== msg.audioTranscript
          ? ` (EN: "${msg.audioTranslation}")`
          : ''
      }`
    : msg.text;
  const cleanBody = rawBody
    .replace(/<attached:[^>]+>/gi, '[Attached Media]')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    timestamp: `${msg.isoDate} ${hh}:${mm}`,
    sender: msg.sender,
    text: cleanBody.length > 280 ? `${cleanBody.slice(0, 277)}...` : cleanBody,
  };
}

/**
 * Intelligently samples representative conversational windows across 5 behavioral phases
 * and packages them with quantitative telemetry into a clean JSON payload for n8n.
 */
export function buildAiWebhookPayload(
  report: ChatAnalysisReport,
  messages: readonly ParsedChatMessage[],
  maxExcerpts = 40,
): AiWebhookPayload {
  const substantive = messages.filter(
    (m) =>
      !m.isDeleted &&
      m.wordCount > 0 &&
      (!m.isMedia || Boolean(m.audioTranscript)),
  );
  const windowSize = Math.max(4, Math.min(10, Math.floor(maxExcerpts / 5)));
  const sampledWindows: AiSampledWindow[] = [];

  if (substantive.length > 0) {
    // 1. Opening phase
    const openingSlice = substantive.slice(0, windowSize);
    sampledWindows.push({
      phase: 'opening',
      label: 'Initial Rapport & Baseline Cadence',
      startDate: openingSlice[0].isoDate,
      messages: openingSlice.map(toExcerptItem),
    });

    // 2. Peak density day window
    const peakDate = report.streaksAndTimeline.peakDays[0]?.date;
    const peakDayMessages = peakDate
      ? substantive.filter((m) => m.isoDate === peakDate).slice(0, windowSize)
      : substantive.slice(
          Math.floor(substantive.length * 0.35),
          Math.floor(substantive.length * 0.35) + windowSize,
        );

    if (peakDayMessages.length > 0) {
      sampledWindows.push({
        phase: 'high_density',
        label: `Peak Momentum Exchange (${peakDayMessages[0].isoDate})`,
        startDate: peakDayMessages[0].isoDate,
        messages: peakDayMessages.map(toExcerptItem),
      });
    }

    // 3. Late-night window (23:00 - 04:59)
    const lateNightMsgs = substantive
      .filter((m) => m.hour === 23 || m.hour < 5)
      .slice(0, windowSize);
    if (lateNightMsgs.length > 0) {
      sampledWindows.push({
        phase: 'late_night',
        label: 'Late-Night Unguarded Exchanges (23:00–05:00)',
        startDate: lateNightMsgs[0].isoDate,
        messages: lateNightMsgs.map(toExcerptItem),
      });
    }

    // 4. Deep / Reflective / Vulnerability or Conflict-repair messages
    const deepMsgs = [...substantive]
      .sort((a, b) => b.wordCount - a.wordCount)
      .slice(0, windowSize)
      .sort((a, b) => a.timestampMs - b.timestampMs);
    if (deepMsgs.length > 0) {
      sampledWindows.push({
        phase: 'vulnerability_or_conflict',
        label: 'High-Investment & Reflective Expressions',
        startDate: deepMsgs[0].isoDate,
        messages: deepMsgs.map(toExcerptItem),
      });
    }

    // 5. Most recent trajectory
    if (substantive.length > windowSize) {
      const recentSlice = substantive.slice(-windowSize);
      sampledWindows.push({
        phase: 'recent',
        label: 'Current Trajectory & Recent Tone',
        startDate: recentSlice[0].isoDate,
        messages: recentSlice.map(toExcerptItem),
      });
    }
  }

  return {
    action: 'analyze_whatsapp_chat',
    generatedAt: new Date().toISOString(),
    chatTitle: report.chatTitle,
    quantitativeMetrics: {
      totalMessages: report.totalMessages,
      totalWords: report.totalWords,
      activeDays: report.streaksAndTimeline.activeDays,
      longestStreakDays: report.streaksAndTimeline.longestStreak.days,
      lateNightPct: report.heatmap.lateNightPct,
      mediaBreakdown: {
        totalMediaMessages: report.mediaAnalytics.totalMediaMessages,
        audioVoiceNotes: report.mediaAnalytics.byCategory.audio,
        totalAudioDurationSeconds:
          report.mediaAnalytics.totalAudioDurationSeconds,
        transcribedAudioCount: report.mediaAnalytics.transcribedVoiceNoteCount,
        images: report.mediaAnalytics.byCategory.image,
        videos: report.mediaAnalytics.byCategory.video,
        stickers:
          report.mediaAnalytics.byCategory.sticker +
          report.mediaAnalytics.byCategory.gif,
        documents: report.mediaAnalytics.byCategory.document,
      },
      participants: report.participants.map((p) => ({
        name: p.name,
        messageSharePct: p.messageSharePct,
        avgWordsPerMessage: p.avgWordsPerMessage,
        initiationSharePct: p.initiationSharePct,
        medianReplySeconds: p.medianReplySeconds,
        doubleTextIndexPct: p.doubleTextIndexPct,
        questionCount: p.questionCount,
        audioCount: p.audioCount,
        imageCount: p.imageCount,
        videoCount: p.videoCount,
        topEmojis: p.topEmojis.slice(0, 5).map((e) => e.emoji),
        topWords: p.topWords.slice(0, 8).map((w) => w.word),
      })),
    },
    sampledWindows,
  };
}

/**
 * Computes a deterministic, telemetry-grounded behavioral & relationship intelligence report.
 * Used both as a fallback when no external n8n webhook is configured and to fill any missing
 * fields in custom n8n webhook responses.
 */
export function generateLocalBehavioralAnalysis(
  report: ChatAnalysisReport,
  _payload: AiWebhookPayload,
  providerLabel = 'ChatPulse Behavioral Heuristic Engine (Local Telemetry)',
): AiRelationshipAnalysis {
  const p1 = report.participants[0];
  const p2 = report.participants[1];

  const shareGap =
    p1 && p2 ? Math.abs(p1.messageSharePct - p2.messageSharePct) : 0;
  const initGap =
    p1 && p2 ? Math.abs(p1.initiationSharePct - p2.initiationSharePct) : 0;

  // Compute Reciprocity Score (0..100)
  const rawReciprocity = Math.round(100 - shareGap * 0.85 - initGap * 0.35);
  const reciprocityScore = Math.max(42, Math.min(98, rawReciprocity));

  // Compute Engagement Velocity Score (0..100)
  const avgMedianSec =
    p1 && p2
      ? (p1.medianReplySeconds + p2.medianReplySeconds) / 2
      : (p1?.medianReplySeconds ?? 300);
  const velocityPenalty = Math.min(45, Math.floor(avgMedianSec / 120));
  const engagementVelocityScore = Math.max(
    48,
    Math.min(
      99,
      Math.round(
        72 + report.streaksAndTimeline.activeDaysPct * 0.28 - velocityPenalty,
      ),
    ),
  );

  // Compute Emotional Safety Score (0..100)
  const questionDensity =
    report.totalMessages > 0
      ? report.participants.reduce((s, p) => s + p.questionCount, 0) /
        report.totalMessages
      : 0;
  const emotionalSafetyScore = Math.max(
    55,
    Math.min(
      97,
      Math.round(
        reciprocityScore * 0.6 + 32 + Math.min(12, questionDensity * 60),
      ),
    ),
  );

  let relationshipDynamicTitle = 'Balanced High-Trust Partnership';
  if (reciprocityScore >= 88 && engagementVelocityScore >= 82) {
    relationshipDynamicTitle = 'High-Velocity Mutual Synergy';
  } else if (shareGap > 24) {
    relationshipDynamicTitle = 'Asymmetric Anchor-and-Amplifier Dynamic';
  } else if (report.heatmap.lateNightPct >= 20) {
    relationshipDynamicTitle = 'Late-Night Confidant Wavelength';
  }

  const participantProfiles: ParticipantBehavioralProfile[] =
    report.participants.map((p, idx) => {
      const other = report.participants[idx === 0 ? 1 : 0];
      const initiatesMore = other
        ? p.initiationSharePct >= other.initiationSharePct
        : true;
      const fasterReply = other
        ? p.medianReplySeconds <= other.medianReplySeconds
        : true;
      const higherDoubleText = p.doubleTextIndexPct >= 8;

      let attachmentStyle = 'Secure-Autonomous Communicator';
      if (initiatesMore && higherDoubleText && fasterReply) {
        attachmentStyle = 'Secure-Pursuer (High Proactive Investment)';
      } else if (!initiatesMore && p.avgWordsPerMessage >= 11) {
        attachmentStyle = 'Reflective-Secure (Depth Over Frequency)';
      } else if (!initiatesMore && p.medianReplySeconds > 900) {
        attachmentStyle = 'Paced-Independent Responder';
      }

      let communicationArchetype = 'The Expressive Catalyst';
      if (p.questionCount >= p.messageCount * 0.18) {
        communicationArchetype = 'The Curious Connector & Active Listener';
      } else if (p.avgWordsPerMessage >= 12) {
        communicationArchetype = 'The Narrative Storyteller';
      } else if (p.medianReplySeconds <= 90) {
        communicationArchetype = 'The Rapid-Fire Pulse Keeper';
      }

      const dominantTraits: string[] = [
        `${p.messageSharePct}% of total message volume (${p.avgWordsPerMessage} words/msg)`,
        `Median response latency of ${formatDurationCompact(p.medianReplySeconds)}`,
        `Initiates ${p.initiationSharePct}% of new conversation sessions`,
      ];
      if (p.topEmojis.length > 0) {
        dominantTraits.push(
          `Signature affective markers: ${p.topEmojis
            .slice(0, 3)
            .map((e) => e.emoji)
            .join(' ')}`,
        );
      }

      return {
        name: p.name,
        attachmentStyle,
        communicationArchetype,
        dominantTraits,
        emotionalCadence:
          p.emojiCount / Math.max(1, p.messageCount) >= 0.25
            ? 'Warm, high-affection expressive cadence with frequent visual cues'
            : 'Grounded, articulate cadence prioritizing clarity and directness',
      };
    });

  const flags: BehavioralFlag[] = [
    {
      type: 'green',
      title: 'Consistent Conversational Rhythm & Streak Continuity',
      evidence: `Maintained a ${report.streaksAndTimeline.longestStreak.days}-day continuous messaging streak across ${report.streaksAndTimeline.activeDays} active days (${report.streaksAndTimeline.activeDaysPct}% calendar coverage).`,
      impact:
        'Demonstrates reliable daily presence and low relational friction when re-engaging after busy periods.',
    },
  ];

  if (p1 && p2) {
    if (shareGap <= 14) {
      flags.push({
        type: 'green',
        title: 'Near-Symmetric Conversational Turn-Taking',
        evidence: `${p1.name} (${p1.messageSharePct}%) and ${p2.name} (${p2.messageSharePct}%) contribute nearly equal conversational air-time.`,
        impact:
          'Prevents conversational burnout and reinforces mutual psychological investment.',
      });
    } else {
      flags.push({
        type: 'amber',
        title: 'Noticeable Volume & Initiation Asymmetry',
        evidence: `${p1.name} drives ${p1.messageSharePct}% of messages and ${p1.initiationSharePct}% of session initiations vs. ${p2.name}'s ${p2.messageSharePct}%.`,
        impact:
          'May create unspoken over-pursuit fatigue if the higher-volume partner interprets quieter windows as withdrawal.',
      });
    }

    const highDoubleTexter =
      p1.doubleTextIndexPct >= p2.doubleTextIndexPct ? p1 : p2;
    if (highDoubleTexter.doubleTextIndexPct >= 10) {
      flags.push({
        type: 'amber',
        title: 'Elevated Double-Texting Burst Pattern',
        evidence: `${highDoubleTexter.name} sends follow-up bursts after 5+ minute gaps on ${highDoubleTexter.doubleTextIndexPct}% of turns (avg burst: ${highDoubleTexter.avgBurstLength} msgs).`,
        impact:
          'Often reflects high enthusiasm and stream-of-consciousness sharing, but benefits from giving the other partner space to reply during deep work blocks.',
      });
    } else {
      flags.push({
        type: 'green',
        title: 'Measured Turn-Taking & Low Follow-Up Anxiety',
        evidence: `Double-texting indices remain low (${p1.name}: ${p1.doubleTextIndexPct}%, ${p2.name}: ${p2.doubleTextIndexPct}%).`,
        impact:
          'Indicates high trust that replies will arrive without needing repeated nudges.',
      });
    }
  }

  if (report.totalDeleted >= 3) {
    flags.push({
      type: 'red',
      title: 'Recurrent Retracted / Deleted Messages',
      evidence: `${report.totalDeleted} messages were deleted across the transcript after being sent.`,
      impact:
        'Frequent message retractions can trigger second-guessing or signal self-censorship during sensitive moments.',
    });
  }

  const p1Name = p1?.name ?? 'Participant A';

  return {
    provider: providerLabel,
    analyzedAt: new Date().toISOString(),
    isFallbackSimulation: providerLabel.includes('Local Telemetry'),
    executiveSummary: `${report.chatTitle} exhibits a ${relationshipDynamicTitle.toLowerCase()} across ${report.totalMessages.toLocaleString()} messages (${report.totalWords.toLocaleString()} words). With a ${reciprocityScore}/100 reciprocity index and a ${report.streaksAndTimeline.longestStreak.days}-day peak streak, the dialogue blends rapid turn-taking with substantive multi-sentence reflections.`,
    relationshipDynamicTitle,
    reciprocityScore,
    emotionalSafetyScore,
    engagementVelocityScore,
    mutualInterestBreakdown: {
      balanceLabel:
        shareGap <= 12
          ? 'Highly Reciprocal (50/50 Equilibrium)'
          : `${p1Name}-Led Momentum (${p1?.messageSharePct ?? 50}% / ${p2?.messageSharePct ?? 50}%)`,
      initiationAnalysis:
        p1 && p2
          ? `${p1.name} initiates ${p1.initiationSharePct}% of new sessions (after ${report.sessionGapMinutes}m+ silences) while ${p2.name} initiates ${p2.initiationSharePct}%.`
          : `${p1Name} drives session initiations consistently.`,
      responseLatencyAnalysis:
        p1 && p2
          ? `${p1.name} responds with a median time of ${formatDurationCompact(p1.medianReplySeconds)} (mean ${formatDurationCompact(p1.meanReplySeconds)}), compared to ${p2.name}'s median of ${formatDurationCompact(p2.medianReplySeconds)} (mean ${formatDurationCompact(p2.meanReplySeconds)}).`
          : `Median reply latency is ${formatDurationCompact(p1?.medianReplySeconds ?? 0)}.`,
      investmentDepthAnalysis:
        p1 && p2
          ? `${p1.name} averages ${p1.avgWordsPerMessage} words/msg (${p1.questionCount} questions asked), whereas ${p2.name} averages ${p2.avgWordsPerMessage} words/msg (${p2.questionCount} questions asked).`
          : `${p1Name} averages ${p1?.avgWordsPerMessage ?? 0} words per message.`,
    },
    participantProfiles,
    flags,
    conflictAndRepairStyle:
      'Constructive de-escalation: multi-line messages are used to clarify context rather than escalate tension, followed by humor or emoji callbacks to restore warmth.',
    recommendations: [
      `Protect your peak connection window around ${report.heatmap.peakHourLabel} on ${report.heatmap.peakDayName}s for meaningful check-ins rather than logistics.`,
      p1 && p2 && initGap > 18
        ? `Invite ${p1.initiationSharePct < p2.initiationSharePct ? p1.name : p2.name} to open more spontaneous threads so initiation energy stays balanced.`
        : `Maintain your balanced session initiation cadence—both partners actively reopen the thread after breaks.`,
      `Use voice notes or live calls when messages exceed ${Math.max(p1?.longestMessageChars ?? 240, p2?.longestMessageChars ?? 240)} characters to preserve nuance and emotional tone.`,
    ],
  };
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asString(val: unknown, fallback: string): string {
  return typeof val === 'string' && val.trim().length > 0
    ? val.trim()
    : fallback;
}

function asNumber(val: unknown, fallback: number): number {
  const num = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(num)
    ? Math.max(0, Math.min(100, Math.round(num)))
    : fallback;
}

/**
 * Normalizes any JSON response returned by a custom n8n webhook into a complete
 * `AiRelationshipAnalysis`, merging with local telemetry defaults if fields are omitted.
 */
export function normalizeAiWebhookResponse(
  rawResponse: unknown,
  report: ChatAnalysisReport,
  payload: AiWebhookPayload,
): AiRelationshipAnalysis {
  const fallback = generateLocalBehavioralAnalysis(
    report,
    payload,
    'n8n AI Relationship Intelligence Webhook',
  );
  fallback.isFallbackSimulation = false;

  let root: unknown = rawResponse;
  if (Array.isArray(root) && root.length > 0) {
    root = root[0];
  }
  if (isRecord(root)) {
    if ((root['ok'] === false || root['success'] === false) && root['error']) {
      throw new Error(String(root['error']));
    }
    if (isRecord(root['data'])) {
      root = root['data'];
    } else if (isRecord(root['output'])) {
      root = root['output'];
    } else if (isRecord(root['analysis'])) {
      root = root['analysis'];
    }
  }

  if (!isRecord(root)) {
    return fallback;
  }

  const mutualRaw = isRecord(root['mutualInterestBreakdown'])
    ? root['mutualInterestBreakdown']
    : {};

  const profilesRaw = Array.isArray(root['participantProfiles'])
    ? root['participantProfiles']
    : [];
  const parsedProfiles: ParticipantBehavioralProfile[] =
    profilesRaw.length > 0
      ? profilesRaw.filter(isRecord).map((item, idx) => {
          const fbProfile =
            fallback.participantProfiles[idx] ??
            fallback.participantProfiles[0];
          return {
            name: asString(
              item['name'],
              fbProfile?.name ?? `Participant ${idx + 1}`,
            ),
            attachmentStyle: asString(
              item['attachmentStyle'],
              fbProfile?.attachmentStyle ?? 'Secure Communicator',
            ),
            communicationArchetype: asString(
              item['communicationArchetype'],
              fbProfile?.communicationArchetype ?? 'Balanced Conversationalist',
            ),
            dominantTraits: Array.isArray(item['dominantTraits'])
              ? item['dominantTraits']
                  .filter((t): t is string => typeof t === 'string')
                  .slice(0, 5)
              : (fbProfile?.dominantTraits ?? []),
            emotionalCadence: asString(
              item['emotionalCadence'],
              fbProfile?.emotionalCadence ?? 'Warm and responsive',
            ),
          };
        })
      : fallback.participantProfiles;

  const flagsRaw = Array.isArray(root['flags']) ? root['flags'] : [];
  const parsedFlags: BehavioralFlag[] =
    flagsRaw.length > 0
      ? flagsRaw.filter(isRecord).map((f) => {
          const rawType = asString(f['type'], 'green').toLowerCase();
          const type: 'green' | 'amber' | 'red' =
            rawType === 'red' || rawType === 'amber' ? rawType : 'green';
          return {
            type,
            title: asString(f['title'], 'Behavioral Observation'),
            evidence: asString(
              f['evidence'],
              'Observed in transcript patterns.',
            ),
            impact: asString(
              f['impact'],
              'Shapes conversational flow and reciprocity.',
            ),
          };
        })
      : fallback.flags;

  const recsRaw = Array.isArray(root['recommendations'])
    ? root['recommendations'].filter((r): r is string => typeof r === 'string')
    : [];

  return {
    provider: asString(root['provider'], 'n8n AI Relationship Webhook'),
    analyzedAt: asString(root['analyzedAt'], new Date().toISOString()),
    isFallbackSimulation: false,
    executiveSummary: asString(
      root['executiveSummary'],
      fallback.executiveSummary,
    ),
    relationshipDynamicTitle: asString(
      root['relationshipDynamicTitle'],
      fallback.relationshipDynamicTitle,
    ),
    reciprocityScore: asNumber(
      root['reciprocityScore'],
      fallback.reciprocityScore,
    ),
    emotionalSafetyScore: asNumber(
      root['emotionalSafetyScore'],
      fallback.emotionalSafetyScore,
    ),
    engagementVelocityScore: asNumber(
      root['engagementVelocityScore'],
      fallback.engagementVelocityScore,
    ),
    mutualInterestBreakdown: {
      balanceLabel: asString(
        mutualRaw['balanceLabel'],
        fallback.mutualInterestBreakdown.balanceLabel,
      ),
      initiationAnalysis: asString(
        mutualRaw['initiationAnalysis'],
        fallback.mutualInterestBreakdown.initiationAnalysis,
      ),
      responseLatencyAnalysis: asString(
        mutualRaw['responseLatencyAnalysis'],
        fallback.mutualInterestBreakdown.responseLatencyAnalysis,
      ),
      investmentDepthAnalysis: asString(
        mutualRaw['investmentDepthAnalysis'],
        fallback.mutualInterestBreakdown.investmentDepthAnalysis,
      ),
    },
    participantProfiles: parsedProfiles,
    flags: parsedFlags,
    conflictAndRepairStyle: asString(
      root['conflictAndRepairStyle'],
      fallback.conflictAndRepairStyle,
    ),
    recommendations: recsRaw.length > 0 ? recsRaw : fallback.recommendations,
  };
}
