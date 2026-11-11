import * as v from 'valibot';
import { isValidTimeZone, localDateOf } from '../local-date';
import type {
  Concept,
  ReviewEvent,
  ReviewSession,
  TeachBack,
} from '../records';
import { type MemoryState, tierOf } from './memory';

/**
 * Nudges (design §10). The app sends this small state to the edge Worker
 * after each session and settings change; every 15 minutes the Worker asks
 * `nudgeDue` whether to send a Telegram message. At most two a day, none on
 * vacation, none once today's set is done.
 */

const Clock = v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/));
const LocalDate = v.pipe(v.string(), v.isoDate());
const Count = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(1e6));

/** The week so far (Monday to today), for the Sunday recap (design §10). */
export const WeekStatsSchema = v.strictObject({
  /** The Monday the week started on. */
  start: LocalDate,
  /** Days with at least one review. */
  days: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(7)),
  reviews: Count,
  /** Concepts kept this week. */
  kept: Count,
  teachBacks: Count,
  /** Concepts at Leaf or better now. */
  strong: Count,
});
export type WeekStats = v.InferOutput<typeof WeekStatsSchema>;

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
  /** The Sunday recap is wanted. Optional: older apps don't send it. */
  recap: v.optional(v.boolean(), false),
  week: v.optional(v.nullable(WeekStatsSchema), null),
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

/** The Monday of the week `localDate` is in. */
export function weekStart(localDate: string): string {
  const date = new Date(`${localDate}T12:00:00Z`);
  const back = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - back);
  return date.toISOString().slice(0, 10);
}

export function weekStats(input: {
  events: readonly ReviewEvent[];
  concepts: readonly Concept[];
  memory: ReadonlyMap<string, MemoryState>;
  teachBacks: readonly TeachBack[];
  today: string;
  timeZone: string;
}): WeekStats {
  const start = weekStart(input.today);
  const inWeek = (localDate: string) =>
    localDate >= start && localDate <= input.today;
  const events = input.events.filter((event) => inWeek(event.localDate));
  return {
    start,
    days: new Set(events.map((event) => event.localDate)).size,
    reviews: events.length,
    kept: input.concepts.filter(
      (concept) =>
        !concept.deletedAt &&
        concept.status !== 'draft' &&
        !!concept.confirmedAt &&
        inWeek(localDateOf(new Date(concept.confirmedAt), input.timeZone)),
    ).length,
    teachBacks: input.teachBacks.filter((t) => inWeek(t.localDate)).length,
    strong: [...input.memory.values()].filter((state) =>
      ['leaf', 'bloom', 'golden'].includes(tierOf(state)),
    ).length,
  };
}

/** Sunday, from this time on (the learner's wall clock). */
export const RECAP_AT = '18:00';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * The Sunday recap (design §10): once a week, on Sunday evening, unless
 * it's off or the learner is away. A week the app heard nothing about
 * still gets a short, kind message, never a guilt trip.
 */
export function recapDue(
  state: NudgeState,
  lastSentWeek: string | null,
  now: Date,
): { week: string; text: string } | null {
  if (!state.recap) return null;
  const today = localDateOf(now, state.timeZone);
  if (state.vacationUntil && state.vacationUntil >= today) return null;
  const isSunday = new Date(`${today}T12:00:00Z`).getUTCDay() === 0;
  if (!isSunday || wallClock(now, state.timeZone) < minutes(RECAP_AT)) {
    return null;
  }
  const week = weekStart(today);
  if (lastSentWeek === week) return null;
  const stats = state.week?.start === week ? state.week : null;
  const garden = stats?.strong ?? state.week?.strong ?? 0;
  const lines: string[] = [];
  if (!stats?.reviews) {
    lines.push('🌱 A quiet week. Your garden is still there whenever you are.');
  } else {
    lines.push(
      `🌱 Your week: ${plural(stats.days, 'day')}, ${plural(stats.reviews, 'card')}.`,
    );
    const extras = [
      stats.kept ? `${plural(stats.kept, 'new concept')} kept` : '',
      stats.teachBacks ? `${plural(stats.teachBacks, 'teach-back')}` : '',
    ].filter(Boolean);
    if (extras.length) lines.push(`${extras.join(', ')}.`);
  }
  if (garden) lines.push(`${plural(garden, 'concept')} at Leaf or better.`);
  if (state.streak) lines.push(`🔥 ${state.streak}`);
  return { week, text: lines.join(' ') };
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
