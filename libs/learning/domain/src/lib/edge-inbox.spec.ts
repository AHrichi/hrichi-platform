import * as v from 'valibot';
import {
  captureFromInbox,
  type EdgeInboxItem,
  EdgeInboxItemSchema,
  inboxKey,
} from './edge-inbox';
import { CaptureSchema } from './records';
import { memoryOf } from './schedule/memory';
import {
  type NudgeState,
  NudgeStateSchema,
  recapDue,
  weekStart,
  weekStats,
} from './schedule/nudge';
import {
  sampleConcept,
  sampleEvent,
  sampleTeachBack,
} from './testing/fixtures';

const item: EdgeInboxItem = {
  key: inboxKey(812),
  id: '0b6f0c30-0000-4000-8000-0000000002a1',
  updateId: 812,
  at: '2026-11-12T07:00:00.000Z',
  text: '  Sunk cost: money spent that can’t come back.  ',
  voice: null,
};

describe('the Telegram inbox', () => {
  it('turns a text message into a queued capture from Telegram', () => {
    expect(inboxKey(812)).toBe('inbox:000000000812');
    expect(v.safeParse(EdgeInboxItemSchema, item).success).toBe(true);
    const capture = captureFromInbox(item, new Date('2026-11-12T08:00:00Z'));
    expect(v.safeParse(CaptureSchema, capture).success).toBe(true);
    expect(capture).toMatchObject({
      id: item.id,
      modality: 'text',
      text: 'Sunk cost: money spent that can’t come back.',
      hasAudio: false,
      status: 'queued',
      source: { app: 'telegram', objectId: '812' },
    });
  });

  it('turns a voice note into a capture that waits for its audio', () => {
    const voice = captureFromInbox(
      {
        ...item,
        text: null,
        voice: { fileId: 'AwACAg', mimeType: 'audio/ogg', seconds: 14 },
      },
      new Date('2026-11-12T08:00:00Z'),
    );
    expect(voice).toMatchObject({
      modality: 'voice',
      text: null,
      hasAudio: true,
      transcript: null,
    });
  });

  it('refuses a voice note over two minutes and a foreign key', () => {
    const long = {
      ...item,
      voice: { fileId: 'x', mimeType: 'audio/ogg', seconds: 300 },
    };
    expect(v.safeParse(EdgeInboxItemSchema, long).success).toBe(false);
    expect(
      v.safeParse(EdgeInboxItemSchema, { ...item, key: 'state' }).success,
    ).toBe(false);
  });
});

describe('the weekly recap', () => {
  const week = {
    start: '2026-11-09',
    days: 5,
    reviews: 42,
    kept: 3,
    teachBacks: 1,
    strong: 12,
  };
  const base: NudgeState = v.parse(NudgeStateSchema, {
    timeZone: 'Europe/Paris',
    morning: null,
    evening: null,
    setSize: 7,
    streak: 9,
    doneDate: null,
    vacationUntil: null,
    recap: true,
    week,
  });
  // Sunday 15 November 2026, 18:30 in Paris.
  const sunday = new Date('2026-11-15T17:30:00Z');

  it('starts weeks on Monday', () => {
    expect(weekStart('2026-11-15')).toBe('2026-11-09');
    expect(weekStart('2026-11-09')).toBe('2026-11-09');
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });

  it('counts the week so far', () => {
    const concept = sampleConcept({ confirmedAt: '2026-11-10T08:00:00.000Z' });
    const events = [
      sampleEvent({ localDate: '2026-11-08' }),
      sampleEvent({ id: crypto.randomUUID(), localDate: '2026-11-10' }),
      sampleEvent({ id: crypto.randomUUID(), localDate: '2026-11-12' }),
      sampleEvent({ id: crypto.randomUUID(), localDate: '2026-11-12' }),
    ];
    expect(
      weekStats({
        events,
        concepts: [concept],
        memory: memoryOf([concept], events),
        teachBacks: [sampleTeachBack()],
        today: '2026-11-12',
        timeZone: 'Europe/Paris',
      }),
    ).toMatchObject({
      start: '2026-11-09',
      days: 2,
      reviews: 3,
      kept: 1,
      teachBacks: 1,
    });
  });

  it('sends once, on Sunday evening', () => {
    const recap = recapDue(base, null, sunday);
    expect(recap?.week).toBe('2026-11-09');
    expect(recap?.text).toBe(
      '🌱 Your week: 5 days, 42 cards. 3 new concepts kept, 1 teach-back. 12 concepts at Leaf or better. 🔥 9',
    );
    expect(recapDue(base, '2026-11-09', sunday)).toBeNull();
    expect(recapDue(base, null, new Date('2026-11-15T16:30:00Z'))).toBeNull();
    expect(recapDue(base, null, new Date('2026-11-14T17:30:00Z'))).toBeNull();
  });

  it('stays quiet when off or away, and is kind after a quiet week', () => {
    expect(recapDue({ ...base, recap: false }, null, sunday)).toBeNull();
    expect(
      recapDue({ ...base, vacationUntil: '2026-11-20' }, null, sunday),
    ).toBeNull();
    const stale = { ...base, week: { ...week, start: '2026-11-02' } };
    expect(recapDue(stale, null, sunday)?.text).toBe(
      '🌱 A quiet week. Your garden is still there whenever you are. 12 concepts at Leaf or better. 🔥 9',
    );
  });

  it('accepts the state of an app from before the recap', () => {
    const { recap, week, ...older } = base;
    expect(recap && week).toBeTruthy();
    expect(v.parse(NudgeStateSchema, older)).toMatchObject({
      recap: false,
      week: null,
    });
  });
});
