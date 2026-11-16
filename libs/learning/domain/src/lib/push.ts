import * as v from 'valibot';
import { isValidTimeZone, localDateOf } from './local-date';
import type { NudgeKind } from './schedule/nudge';

/**
 * Web Push (design §10, "Web Push behind the same decision function"). The
 * edge Worker keeps one subscription per device and app, and its cron sends
 * the same nudges and recap it sends to Telegram, plus StudyLM's study
 * reminder, as push notifications. Telegram is untouched: both go out.
 *
 * The payload is the Angular service worker's (`ngsw`) notification format,
 * so neither app needs custom service-worker code: `ngsw` shows it and, on a
 * tap, opens or focuses the app at `url`.
 */

/** The apps that can receive push notifications. */
export const PUSH_APPS = ['learning', 'studylm'] as const;
export type PushApp = (typeof PUSH_APPS)[number];

/** Subscriptions kept per app, at most: the oldest goes first. */
export const PUSH_MAX_SUBSCRIPTIONS = 10;

const Base64Url = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]+={0,2}$/));

/** What `PushSubscription.toJSON()` gives, minus what the Worker ignores. */
export const PushSubscriptionSchema = v.object({
  endpoint: v.pipe(
    v.string(),
    v.maxLength(1024),
    v.url(),
    v.startsWith('https://'),
  ),
  keys: v.object({
    p256dh: v.pipe(Base64Url, v.minLength(80), v.maxLength(100)),
    auth: v.pipe(Base64Url, v.minLength(16), v.maxLength(32)),
  }),
});
export type PushSubscriptionJson = v.InferOutput<typeof PushSubscriptionSchema>;

/** `PUT /push/subscription`. */
export const PushRegistrationSchema = v.strictObject({
  app: v.picklist(PUSH_APPS),
  subscription: PushSubscriptionSchema,
});
export type PushRegistration = v.InferOutput<typeof PushRegistrationSchema>;

/** `DELETE /push/subscription` and `POST /push/test`. */
export const PushEndpointSchema = v.strictObject({
  app: v.picklist(PUSH_APPS),
  endpoint: PushSubscriptionSchema.entries.endpoint,
});

/** What the Worker stores for each subscription. */
export interface StoredPushSubscription {
  app: PushApp;
  deviceId: string;
  subscription: PushSubscriptionJson;
  createdAt: string;
}

/** A notification, before it becomes the `ngsw` payload. */
export interface PushMessage {
  title: string;
  body: string;
  /** Path inside the app, opened on a tap. */
  url: string;
  /** Same tag, same slot: a newer one replaces the older. */
  tag: string;
}

/** The JSON `ngsw` expects in a push message's data. */
export function ngswPayload(message: PushMessage): string {
  return JSON.stringify({
    notification: {
      title: message.title,
      body: message.body,
      tag: message.tag,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-192x192.png',
      renotify: true,
      data: {
        url: message.url,
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: message.url },
        },
      },
    },
  });
}

/** The KV key of a subscription: the app and a hash of its endpoint. */
export async function pushKey(app: PushApp, endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(endpoint),
  );
  const hex = [...new Uint8Array(digest).slice(0, 12)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `push:${app}:${hex}`;
}

/** Learning's nudges and recap as push messages; the text is Telegram's. */
export function nudgePush(
  kind: NudgeKind | 'recap',
  text: string,
): PushMessage {
  const titles = {
    morning: 'Your Daily Set is ready',
    evening: 'Still time for today',
    recap: 'Your week in learning',
  } as const;
  return {
    title: titles[kind],
    body: text,
    url: kind === 'recap' ? '/garden' : '/today',
    tag: kind === 'recap' ? 'learning-recap' : 'learning-nudge',
  };
}

// ---------------------------------------------------------------------------
// StudyLM's study reminder

const Clock = v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/));
const LocalDate = v.pipe(v.string(), v.isoDate());
const AppPath = v.pipe(
  v.string(),
  v.maxLength(300),
  v.regex(/^\/[A-Za-z0-9/_\-.?=&%]*$/),
);

/**
 * `PUT /studylm/state`: what StudyLM tells the Worker after you study or
 * change the reminder. One state for all devices; the newest wins.
 */
export const StudyReminderStateSchema = v.strictObject({
  timeZone: v.pipe(v.string(), v.maxLength(64), v.check(isValidTimeZone)),
  /** Null: no reminder. */
  at: v.nullable(Clock),
  /** The learner's day StudyLM last saw a lesson step, card or quiz answer. */
  studiedDate: v.nullable(LocalDate),
  /** The next lesson to open, when there is one. */
  next: v.nullable(
    v.strictObject({
      title: v.pipe(v.string(), v.minLength(1), v.maxLength(140)),
      url: AppPath,
      minutes: v.nullable(
        v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(240)),
      ),
    }),
  ),
  /** Cards rated "again" or "hard" last time, waiting for another look. */
  shakyCards: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(0),
    v.maxValue(10_000),
  ),
});
export type StudyReminderState = v.InferOutput<typeof StudyReminderStateSchema>;

/** A reminder waits at most this long after its time (cron gaps, sleep). */
const REMINDER_WINDOW_MIN = 240;

function wallClock(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute');
}

const minutesOf = (clock: string) =>
  Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

/**
 * Whether StudyLM's daily reminder is due: once a day, from its time on, and
 * only when nothing was studied today. `lastSent` is the local date of the
 * last one.
 */
export function studyReminderDue(
  state: StudyReminderState,
  lastSent: string | null,
  now: Date,
): { localDate: string; message: PushMessage } | null {
  if (!state.at) return null;
  const today = localDateOf(now, state.timeZone);
  if (state.studiedDate === today || lastSent === today) return null;
  const clock = wallClock(now, state.timeZone);
  const at = minutesOf(state.at);
  if (clock < at || clock >= at + REMINDER_WINDOW_MIN) return null;

  const cards = state.shakyCards
    ? ` ${state.shakyCards} card${state.shakyCards === 1 ? '' : 's'} could use another look.`
    : '';
  const message: PushMessage = state.next
    ? {
        title: `Next up: ${state.next.title}`,
        body: `${state.next.minutes ? `About ${state.next.minutes} min.` : 'Pick up where you left off.'}${cards}`,
        url: state.next.url,
        tag: 'studylm-reminder',
      }
    : {
        title: 'Time to study',
        body: state.shakyCards
          ? `${cards.trim()} A few minutes keeps them fresh.`
          : 'Open StudyLM and keep your roadmap moving.',
        url: state.shakyCards ? '/flashcards' : '/roadmap',
        tag: 'studylm-reminder',
      };
  return { localDate: today, message };
}
