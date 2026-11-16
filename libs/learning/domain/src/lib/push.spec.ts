import * as v from 'valibot';
import {
  ngswPayload,
  nudgePush,
  PushRegistrationSchema,
  pushKey,
  type StudyReminderState,
  StudyReminderStateSchema,
  studyReminderDue,
} from './push';

const TZ = 'Europe/Paris';
/** 2026-11-16 is a Monday; Paris is UTC+1 in November. */
const at = (clock: string, day = '2026-11-16') =>
  new Date(`${day}T${clock}:00+01:00`);

const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: {
    p256dh:
      'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
    auth: 'tBHItJI5svbpez7KI4CCXg',
  },
};

function reminder(extra: Partial<StudyReminderState> = {}): StudyReminderState {
  return {
    timeZone: TZ,
    at: '18:00',
    studiedDate: '2026-11-15',
    next: {
      title: 'Section 1.3: Functions & Scope',
      url: '/learn/lesson-13',
      minutes: 15,
    },
    shakyCards: 0,
    ...extra,
  };
}

describe('push contracts', () => {
  it('accepts a browser subscription and rejects plain http endpoints', () => {
    expect(
      v.safeParse(PushRegistrationSchema, { app: 'learning', subscription })
        .success,
    ).toBe(true);
    expect(
      v.safeParse(PushRegistrationSchema, {
        app: 'learning',
        subscription: { ...subscription, endpoint: 'http://evil.test/x' },
      }).success,
    ).toBe(false);
    expect(
      v.safeParse(PushRegistrationSchema, { app: 'other', subscription })
        .success,
    ).toBe(false);
  });

  it('keys a subscription by app and a stable hash of its endpoint', async () => {
    const key = await pushKey('studylm', subscription.endpoint);
    expect(key).toMatch(/^push:studylm:[0-9a-f]{24}$/);
    expect(await pushKey('studylm', subscription.endpoint)).toBe(key);
    expect(await pushKey('learning', subscription.endpoint)).not.toBe(key);
  });

  it('writes the payload ngsw shows and opens on a tap', () => {
    const payload = JSON.parse(
      ngswPayload(nudgePush('morning', '☕ Your set is ready: 7 cards.')),
    );
    expect(payload.notification).toMatchObject({
      title: 'Your Daily Set is ready',
      body: '☕ Your set is ready: 7 cards.',
      tag: 'learning-nudge',
      data: {
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: '/today' },
        },
      },
    });
    expect(nudgePush('recap', 'x').url).toBe('/garden');
  });
});

describe('studyReminderDue', () => {
  it('validates the state StudyLM sends', () => {
    expect(v.safeParse(StudyReminderStateSchema, reminder()).success).toBe(
      true,
    );
    expect(
      v.safeParse(
        StudyReminderStateSchema,
        reminder({
          next: { title: 'x', url: 'https://evil.test', minutes: null },
        }),
      ).success,
    ).toBe(false);
  });

  it('reminds from its time on, about the next lesson', () => {
    expect(studyReminderDue(reminder(), null, at('17:59'))).toBeNull();
    const due = studyReminderDue(reminder(), null, at('18:05'));
    expect(due?.localDate).toBe('2026-11-16');
    expect(due?.message).toEqual({
      title: 'Next up: Section 1.3: Functions & Scope',
      body: 'About 15 min.',
      url: '/learn/lesson-13',
      tag: 'studylm-reminder',
    });
  });

  it('stays quiet once you studied today, once sent, or late at night', () => {
    expect(
      studyReminderDue(
        reminder({ studiedDate: '2026-11-16' }),
        null,
        at('18:30'),
      ),
    ).toBeNull();
    expect(studyReminderDue(reminder(), '2026-11-16', at('18:30'))).toBeNull();
    expect(studyReminderDue(reminder(), null, at('22:30'))).toBeNull();
    expect(studyReminderDue(reminder({ at: null }), null, at('18:30'))).toBe(
      null,
    );
  });

  it('points at shaky flashcards when there is no next lesson', () => {
    const due = studyReminderDue(
      reminder({ next: null, shakyCards: 3 }),
      null,
      at('18:00'),
    );
    expect(due?.message.url).toBe('/flashcards');
    expect(due?.message.body).toBe(
      '3 cards could use another look. A few minutes keeps them fresh.',
    );
    expect(
      studyReminderDue(reminder({ shakyCards: 1 }), null, at('18:00'))?.message
        .body,
    ).toBe('About 15 min. 1 card could use another look.');
  });

  it('uses the learner’s wall clock, not UTC', () => {
    const tokyo = reminder({ timeZone: 'Asia/Tokyo', at: '07:30' });
    // 07:40 in Tokyo is 23:40 UTC the day before.
    expect(
      studyReminderDue(tokyo, null, new Date('2026-11-15T22:40:00Z'))
        ?.localDate,
    ).toBe('2026-11-16');
  });
});
