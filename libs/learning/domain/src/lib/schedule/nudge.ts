import * as v from 'valibot';
import { isValidTimeZone, localDateOf } from '../local-date';
import type { ReviewSession } from '../records';

/**
 * Nudges (design §10). The app sends this small state to the edge Worker
 * after each session and settings change; every 15 minutes the Worker asks
 * `nudgeDue` whether to send a Telegram message. At most two a day, none on
 * vacation, none once today's set is done.
 */

const Clock = v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/));
const LocalDate = v.pipe(v.string(), v.isoDate());

export const NudgeStateSchema = v.strictObject({
  timeZone: v.pipe(v.string(), v.maxLength(64), v.check(isValidTimeZone)),
  /** Null: no morning nudge. */
  morning: v.nullable(Clock),
  /** Null: no evening reminder. */
  evening: v.nullable(Clock),
  /** Cards in today's set, for the message. */
  setSize: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(15)),
  streak: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(100_000)),
  /** The learner's day the Daily Set was last finished. */
  doneDate: v.nullable(LocalDate),
  vacationUntil: v.nullable(LocalDate),
});

export type NudgeState = v.InferOutput<typeof NudgeStateSchema>;
export type NudgeKind = 'morning' | 'evening';

/** What the Worker remembers it sent. */
export interface NudgeLog {
  localDate: string;
  sent: NudgeKind[];
}

/** A morning nudge waits at most this long after its time. */
const MORNING_WINDOW_MIN = 180;

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

const minutes = (clock: string) =>
  Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));

export function nudgeDue(
  state: NudgeState,
  log: NudgeLog | null,
  now: Date,
): { kind: NudgeKind; localDate: string; text: string } | null {
  const today = localDateOf(now, state.timeZone);
  if (state.vacationUntil && state.vacationUntil >= today) return null;
  if (state.doneDate === today) return null;
  const sent = log?.localDate === today ? log.sent : [];
  if (sent.length >= 2) return null;
  const clock = wallClock(now, state.timeZone);
  const cards = state.setSize
    ? `${state.setSize} card${state.setSize === 1 ? '' : 's'}`
    : 'your cards';
  const minutesNeeded = Math.max(1, Math.round(state.setSize * 0.4));
  const flame = state.streak ? ` Keep the 🔥 ${state.streak} alive.` : '';

  if (
    state.morning &&
    !sent.includes('morning') &&
    clock >= minutes(state.morning) &&
    clock < minutes(state.morning) + MORNING_WINDOW_MIN
  ) {
    return {
      kind: 'morning',
      localDate: today,
      text: `☕ Your set is ready: ${cards}, about ${minutesNeeded} min.${flame}`,
    };
  }
  if (
    state.evening &&
    !sent.includes('evening') &&
    clock >= minutes(state.evening)
  ) {
    return {
      kind: 'evening',
      localDate: today,
      text: `🌙 Still time for today: ${cards}. One card keeps the streak.${flame}`,
    };
  }
  return null;
}

/**
 * The morning time learned from the last 14 sets: their median start,
 * minus 10 minutes, so the nudge comes just before the usual time.
 */
export function learnedMorning(
  sessions: readonly ReviewSession[],
  timeZone: string,
): string | null {
  const starts = sessions
    .filter((session) => session.kind === 'daily' && session.planned.length)
    .slice(-14)
    .map((session) => wallClock(new Date(session.startedAt), timeZone))
    .sort((a, b) => a - b);
  if (starts.length < 3) return null;
  const median = starts[Math.floor(starts.length / 2)];
  const at = Math.max(0, median - 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(at / 60))}:${pad(at % 60)}`;
}
