import { describe, expect, it } from 'vitest';
import {
  analyzeWhatsAppChat,
  buildAiWebhookPayload,
  buildDailyMoodSeries,
  detectCheckInWindows,
  detectCrisisLanguage,
  ingestPlainTextTranscript,
  parseWhatsAppTranscript,
  predictCycle,
  cyclePhaseForDate,
  RELATIONSHIP_ANALYSIS_SYSTEM_PROMPT,
} from '../index';

/** Builds an iOS-style export: one entry per message as [day, time, sender, text]. */
function chat(lines: Array<[string, string, string, string]>): string {
  return lines
    .map(([d, t, who, text]) => {
      const [y, m, day] = d.split('-');
      return `[${day}/${m}/${y}, ${t}] ${who}: ${text}`;
    })
    .join('\n');
}

function isoDay(base: string, offset: number): string {
  const ms = Date.parse(`${base}T00:00:00Z`) + offset * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** A warm baseline of `days` days, then the given extra days. */
function baselineThen(
  days: number,
  extra: Array<[string, string, string, string]>,
): string {
  const lines: Array<[string, string, string, string]> = [];
  for (let i = 0; i < days; i++) {
    const d = isoDay('2026-03-01', i);
    lines.push([d, '19:00:00', 'Sam', 'Hey how was your day at work today?']);
    lines.push([
      d,
      '19:01:00',
      'Lea',
      'It was great, really happy with the meeting today',
    ]);
    lines.push([d, '19:02:00', 'Sam', 'Awesome, so glad to hear that']);
    lines.push([
      d,
      '19:03:00',
      'Lea',
      'Thanks! Super excited for the weekend with you',
    ]);
    lines.push([
      d,
      '19:04:00',
      'Lea',
      'Love you, see you tonight for dinner then',
    ]);
    lines.push([d, '19:05:00', 'Sam', 'Perfect, love you too']);
  }
  return chat([...lines, ...extra]);
}

function messages(raw: string) {
  return parseWhatsAppTranscript(raw, 'DMY').messages;
}

describe('wellbeing: check-in windows', () => {
  it('flags two rough days with lower tone and shorter, slower replies', () => {
    const rough = (offset: number): Array<[string, string, string, string]> => {
      const d = isoDay('2026-03-01', offset);
      return [
        [d, '19:00:00', 'Sam', 'Hey how are you doing today?'],
        [d, '19:40:00', 'Lea', 'tired'],
        [d, '19:41:00', 'Sam', 'Oh no, want to talk?'],
        [d, '20:30:00', 'Lea', 'sad 😔'],
        [d, '21:20:00', 'Lea', 'stressed'],
      ];
    };
    const raw = baselineThen(10, [...rough(10), ...rough(11)]);
    const windows = detectCheckInWindows(buildDailyMoodSeries(messages(raw)));

    expect(windows).toHaveLength(1);
    expect(windows[0]).toMatchObject({
      sender: 'Lea',
      startDate: '2026-03-11',
      endDate: '2026-03-12',
      flaggedDays: 2,
    });
    expect(windows[0].reasons).toContain('lower_tone');
    expect(windows[0].reasons).toContain('shorter_messages');
  });

  it('does not flag a single rough day', () => {
    const d = isoDay('2026-03-01', 10);
    const raw = baselineThen(10, [
      [d, '19:00:00', 'Sam', 'Hey?'],
      [d, '19:40:00', 'Lea', 'tired'],
      [d, '20:30:00', 'Lea', 'sad'],
      [d, '21:20:00', 'Lea', 'stressed'],
    ]);
    expect(detectCheckInWindows(buildDailyMoodSeries(messages(raw)))).toEqual(
      [],
    );
  });

  it('does not flag quiet days that keep a normal tone', () => {
    const quiet = (offset: number): Array<[string, string, string, string]> => {
      const d = isoDay('2026-03-01', offset);
      return [
        [d, '19:00:00', 'Lea', 'ok'],
        [d, '23:00:00', 'Lea', 'busy'],
        [d, '23:30:00', 'Lea', 'later'],
      ];
    };
    const raw = baselineThen(10, [...quiet(10), ...quiet(11)]);
    expect(detectCheckInWindows(buildDailyMoodSeries(messages(raw)))).toEqual(
      [],
    );
  });

  it('needs a baseline before judging anyone', () => {
    const raw = chat([
      ['2026-03-01', '10:00:00', 'Lea', 'tired'],
      ['2026-03-01', '11:00:00', 'Lea', 'sad'],
      ['2026-03-01', '12:00:00', 'Lea', 'stressed'],
      ['2026-03-02', '10:00:00', 'Lea', 'tired'],
      ['2026-03-02', '11:00:00', 'Lea', 'sad'],
      ['2026-03-02', '12:00:00', 'Lea', 'stressed'],
    ]);
    expect(detectCheckInWindows(buildDailyMoodSeries(messages(raw)))).toEqual(
      [],
    );
  });
});

describe('wellbeing: crisis language', () => {
  it.each([
    ['I just want to die'],
    ['sometimes I think about killing myself'],
    ["j'ai envie de mourir"],
    ['quiero morir'],
    ['nheb nmout'],
    ['ما نحبش نعيش'],
  ])('detects "%s" and returns only dates and senders', (text) => {
    const raw = chat([
      ['2026-03-01', '10:00:00', 'Sam', 'hey'],
      ['2026-03-02', '10:00:00', 'Lea', text],
    ]);
    const signal = detectCrisisLanguage(messages(raw));
    expect(signal).toEqual({
      detected: true,
      dates: ['2026-03-02'],
      senders: ['Lea'],
    });
  });

  it('ignores everyday phrases', () => {
    const raw = chat([
      ['2026-03-01', '10:00:00', 'Sam', 'this deadline is killing me lol'],
      ['2026-03-01', '10:01:00', 'Lea', 'nmout alik ❤️'],
      ['2026-03-01', '10:02:00', 'Lea', 'I could die laughing'],
    ]);
    expect(detectCrisisLanguage(messages(raw)).detected).toBe(false);
  });
});

describe('cycle predictions (user-entered dates only)', () => {
  it('returns no estimate without entries', () => {
    const p = predictCycle([], '2026-05-01');
    expect(p).toMatchObject({ confidence: 'none', nextStart: null });
  });

  it('uses the 28/5 default from a single entry', () => {
    const p = predictCycle([{ start: '2026-04-20' }], '2026-04-25');
    expect(p).toMatchObject({
      averageCycleDays: 28,
      averagePeriodDays: 5,
      confidence: 'low',
      nextStart: '2026-05-18',
      nextEnd: '2026-05-22',
      premenstrualStart: '2026-05-13',
    });
  });

  it('averages regular cycles and raises confidence', () => {
    const p = predictCycle(
      [
        { start: '2026-01-01', end: '2026-01-04' },
        { start: '2026-01-31', end: '2026-02-03' },
        { start: '2026-03-02', end: '2026-03-05' },
        { start: '2026-04-01', end: '2026-04-04' },
      ],
      '2026-04-10',
    );
    expect(p).toMatchObject({
      averageCycleDays: 30,
      averagePeriodDays: 4,
      basedOnCycles: 3,
      confidence: 'high',
      nextStart: '2026-05-01',
    });
  });

  it('keeps confidence low for irregular cycles and skips missed-entry gaps', () => {
    const p = predictCycle(
      [
        { start: '2026-01-01' },
        { start: '2026-01-22' },
        { start: '2026-02-28' },
        { start: '2026-06-01' }, // ~93-day gap: a missed entry, ignored
      ],
      '2026-06-05',
    );
    expect(p.basedOnCycles).toBe(2);
    expect(p.confidence).toBe('low');
  });

  it('rolls the estimate forward past today', () => {
    const p = predictCycle([{ start: '2026-01-01' }], '2026-03-15');
    expect((p.nextStart ?? '') >= '2026-03-11').toBe(true);
  });

  it('tags phases from entries first, then the prediction', () => {
    const periods = [{ start: '2026-04-01', end: '2026-04-04' }];
    const prediction = predictCycle(periods, '2026-04-10');
    expect(cyclePhaseForDate('2026-04-02', periods, prediction)).toBe('period');
    expect(cyclePhaseForDate('2026-03-29', periods, prediction)).toBe(
      'premenstrual',
    );
    expect(cyclePhaseForDate('2026-04-29', periods, prediction)).toBe(
      'predicted_period',
    );
    expect(cyclePhaseForDate('2026-04-15', periods, prediction)).toBe('other');
  });
});

describe('AI payload and prompt boundaries', () => {
  it('sends check-in dates and reasons, never message text or cycle data', () => {
    const raw = baselineThen(6, []);
    const extraction = ingestPlainTextTranscript(raw, 'chat.txt', 'txt');
    const report = analyzeWhatsAppChat(extraction, { dateOrderMode: 'DMY' });
    const payload = buildAiWebhookPayload(report, messages(raw), 20);

    expect(payload.wellbeingSignals).toEqual([]);
    const json = JSON.stringify(payload);
    expect(json).not.toMatch(/cycle|period|menstru|premenstrual/i);
  });

  it('forbids health and menstrual speculation in the system prompt', () => {
    expect(RELATIONSHIP_ANALYSIS_SYSTEM_PROMPT).toMatch(
      /Never speculate about[^.]*menstrual cycle or period/,
    );
  });
});
