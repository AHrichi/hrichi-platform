import * as v from 'valibot';
import {
  compareRevisions,
  incomingWins,
  isFromTheFuture,
  MAX_CLOCK_SKEW_MS,
  mergeConcepts,
  stampConceptGroups,
  withRevisedExplanation,
} from './merge';
import { isValidTimeZone, localDateOf } from './local-date';
import {
  ConceptSchema,
  isRatingDisagreement,
  LIMITS,
  RECORD_SCHEMAS,
  ReviewEventSchema,
  SETTINGS_RECORD_ID,
  SettingsRecordSchema,
  TopicSchema,
} from './records';
import { SyncRequestSchema, SYNC_LIMITS } from './sync';
import {
  FIXTURE_IDS,
  sampleCapture,
  sampleConcept,
  sampleEvent,
  sampleTopic,
} from './testing/fixtures';

describe('records', () => {
  it('accepts the fixtures', () => {
    expect(v.safeParse(TopicSchema, sampleTopic()).success).toBe(true);
    expect(v.safeParse(ConceptSchema, sampleConcept()).success).toBe(true);
    expect(v.safeParse(ReviewEventSchema, sampleEvent()).success).toBe(true);
  });

  it('refuses unknown keys, a concept without prompts and a bad rating', () => {
    expect(
      v.safeParse(TopicSchema, { ...sampleTopic(), extra: 1 }).success,
    ).toBe(false);
    expect(
      v.safeParse(ConceptSchema, sampleConcept({ prompts: [] })).success,
    ).toBe(false);
    expect(
      v.safeParse(ReviewEventSchema, {
        ...sampleEvent(),
        rating: 'perfect',
      }).success,
    ).toBe(false);
  });

  it('trims text and refuses a blank title', () => {
    const parsed = v.parse(
      ConceptSchema,
      sampleConcept({ title: '  Opportunity cost  ' }),
    );
    expect(parsed.title).toBe('Opportunity cost');
    expect(
      v.safeParse(ConceptSchema, sampleConcept({ title: '   ' })).success,
    ).toBe(false);
  });

  it('has a schema for every kind', () => {
    expect(Object.keys(RECORD_SCHEMAS)).toEqual([
      'topic',
      'concept',
      'capture',
      'session',
      'link',
      'settings',
      'event',
      'teachback',
    ]);
  });

  it('validates synced settings records and disagreement helper', () => {
    const parsed = v.safeParse(SettingsRecordSchema, {
      id: SETTINGS_RECORD_ID,
      updatedAt: '2026-11-11T08:00:00Z',
      deletedAt: null,
      dailyCap: 7,
      newPerDay: 2,
      streakMode: 'weekly',
      weeklyTarget: 5,
      morning: '08:00',
      evening: '20:30',
      vacationUntil: null,
      gardenTheme: 'meadow',
      weeklyRecap: false,
    });
    expect(parsed.success).toBe(true);
    expect(isRatingDisagreement('again', 'nailed')).toBe(true);
    expect(isRatingDisagreement('easy', 'missed')).toBe(true);
    expect(isRatingDisagreement('good', 'nailed')).toBe(false);
    expect(isRatingDisagreement('good', 'close')).toBe(false);
    expect(isRatingDisagreement('good', null)).toBe(false);
  });
});

describe('merge', () => {
  const at = (updatedAt: string, by: string = FIXTURE_IDS.deviceA) => ({
    updatedAt,
    by,
  });

  it('lets the later version win, comparing instants not strings', () => {
    expect(
      compareRevisions(
        at('2026-11-11T10:00:00+01:00'),
        at('2026-11-11T09:30:00.000Z'),
      ),
    ).toBe(-1);
    expect(
      incomingWins(at('2026-11-11T08:00:00Z'), at('2026-11-11T08:00:01Z')),
    ).toBe(true);
    expect(
      incomingWins(at('2026-11-11T08:00:01Z'), at('2026-11-11T08:00:00Z')),
    ).toBe(false);
  });

  it('breaks a tie the same way on every device', () => {
    const a = at('2026-11-11T08:00:00Z', FIXTURE_IDS.deviceA);
    const b = at('2026-11-11T08:00:00Z', FIXTURE_IDS.deviceB);
    expect(incomingWins(a, b)).toBe(true);
    expect(incomingWins(b, a)).toBe(false);
    expect(incomingWins(a, a)).toBe(false);
  });

  it('always accepts the first version', () => {
    expect(incomingWins(null, at('2020-01-01T00:00:00Z'))).toBe(true);
  });

  it('spots a clock running far ahead', () => {
    const now = new Date('2026-11-11T08:00:00Z');
    const later = (ms: number) => new Date(now.getTime() + ms).toISOString();
    expect(isFromTheFuture(later(MAX_CLOCK_SKEW_MS), now)).toBe(false);
    expect(isFromTheFuture(later(MAX_CLOCK_SKEW_MS + 1000), now)).toBe(true);
  });

  it('merges concept field groups independently and preserves history up to 3', () => {
    const base = sampleConcept({
      title: 'Base',
      status: 'draft',
      topicId: null,
      version: 1,
    });
    const devA = stampConceptGroups(
      { ...base, status: 'active', confirmedAt: '2026-11-11T08:02:00Z' },
      ['status'],
      at('2026-11-11T08:02:00Z', FIXTURE_IDS.deviceA),
    );
    const devB = stampConceptGroups(
      { ...base, topicId: FIXTURE_IDS.topic },
      ['topic'],
      at('2026-11-11T08:01:00Z', FIXTURE_IDS.deviceB),
    );
    const merged = mergeConcepts(
      {
        updatedAt: '2026-11-11T08:02:00Z',
        by: FIXTURE_IDS.deviceA,
        data: devA,
      },
      {
        updatedAt: '2026-11-11T08:01:00Z',
        by: FIXTURE_IDS.deviceB,
        data: devB,
      },
    );
    expect(merged.fromIncoming).toBe(true);
    expect(merged.keptCurrent).toBe(true);
    expect(merged.concept.status).toBe('active');
    expect(merged.concept.topicId).toBe(FIXTURE_IDS.topic);
    expect(merged.updatedAt).toBe('2026-11-11T08:02:00Z');

    let revised = base;
    for (let i = 1; i <= 4; i++) {
      revised = withRevisedExplanation(
        revised,
        { ...revised.explanation, essence: `Rev ${i}` },
        `2026-11-11T08:0${i}:00Z`,
        FIXTURE_IDS.deviceA,
      );
    }
    expect(revised.version).toBe(5);
    expect(revised.explanationHistory).toHaveLength(LIMITS.explanationHistory);
    expect(revised.explanationHistory?.[0].essence).toBe('Rev 3');
  });
});

describe('localDateOf', () => {
  it('counts the hours before 04:00 for the day before', () => {
    // 03:59 and 04:00 in Paris (UTC+1 in November).
    expect(localDateOf(new Date('2026-11-12T02:59:00Z'), 'Europe/Paris')).toBe(
      '2026-11-11',
    );
    expect(localDateOf(new Date('2026-11-12T03:00:00Z'), 'Europe/Paris')).toBe(
      '2026-11-12',
    );
  });

  it('keeps the boundary on the wall clock across daylight saving', () => {
    // 29 March 2026: Paris jumps from 02:00 to 03:00. 04:30 local is 02:30Z.
    expect(localDateOf(new Date('2026-03-29T02:30:00Z'), 'Europe/Paris')).toBe(
      '2026-03-29',
    );
    // 25 October 2026: back from 03:00 to 02:00. 03:30 local (second pass) is 02:30Z.
    expect(localDateOf(new Date('2026-10-25T02:30:00Z'), 'Europe/Paris')).toBe(
      '2026-10-24',
    );
  });

  it('crosses month and year ends, and follows the time zone', () => {
    expect(localDateOf(new Date('2027-01-01T01:00:00Z'), 'UTC')).toBe(
      '2026-12-31',
    );
    const instant = new Date('2026-11-11T20:00:00Z');
    expect(localDateOf(instant, 'Asia/Tokyo')).toBe('2026-11-12');
    expect(localDateOf(instant, 'America/Los_Angeles')).toBe('2026-11-11');
  });

  it('takes another start of day, and checks time zone names', () => {
    expect(localDateOf(new Date('2026-11-11T23:30:00Z'), 'UTC', 0)).toBe(
      '2026-11-11',
    );
    expect(isValidTimeZone('Africa/Tunis')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});

describe('SyncRequestSchema', () => {
  it('accepts a push of each kind and caps its size', () => {
    const request = {
      cursor: 0,
      push: {
        topics: [sampleTopic()],
        concepts: [sampleConcept()],
        captures: [sampleCapture()],
        sessions: [],
        events: [sampleEvent()],
      },
    };
    expect(v.safeParse(SyncRequestSchema, request).success).toBe(true);
    const tooMany = Array.from({ length: SYNC_LIMITS.pushTopics + 1 }, () =>
      sampleTopic(),
    );
    expect(
      v.safeParse(SyncRequestSchema, {
        ...request,
        push: { ...request.push, topics: tooMany },
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(SyncRequestSchema, { ...request, cursor: -1 }).success,
    ).toBe(false);
  });
});
