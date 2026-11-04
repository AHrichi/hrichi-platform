import { parseYmd } from './dates';
import type { AlarmSlot } from './models';

/**
 * Escapes characters for iCalendar text format according to RFC 5545:
 * Backslashes, commas, and semicolons are escaped with a backslash.
 * Newlines are escaped as \n.
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Generates an RFC 5545 standard .ics file representing the alarm schedule.
 * Native iOS Calendar, Apple Reminders, Google Calendar, and Android Calendar
 * parse these events with alarms set to trigger at exact slot times.
 */
export function generateAlarmIcs(
  dateYmd: string,
  alarms: readonly AlarmSlot[],
  appTitle = 'Nightly Alarm Schedule',
): string {
  const { year, month, day } = parseYmd(dateYmd);
  const yStr = String(year).padStart(4, '0');
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');

  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nightly Alarm Decision Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(appTitle)}`,
  ];

  alarms.forEach((slot, index) => {
    const [hh, mm] = slot.time.split(':');
    const startHour = parseInt(hh, 10);
    const startMin = parseInt(mm, 10);

    const startHhStr = String(startHour).padStart(2, '0');
    const startMmStr = String(startMin).padStart(2, '0');
    const dtStart = `${yStr}${mStr}${dStr}T${startHhStr}${startMmStr}00`;

    // 15-minute slot duration by default
    const endMinutesTotal = startHour * 60 + startMin + 15;
    const endHh = Math.floor(endMinutesTotal / 60) % 24;
    const endMm = endMinutesTotal % 60;
    const endHhStr = String(endHh).padStart(2, '0');
    const endMmStr = String(endMm).padStart(2, '0');
    const dtEnd = `${yStr}${mStr}${dStr}T${endHhStr}${endMmStr}00`;

    const uid = `alarm-${dateYmd}-${slot.time.replace(':', '')}-${index}@alarm-engine`;
    const summary = `${slot.time} Alarm: ${slot.title}`;
    const desc = `${slot.description}\n[Nightly Alarm Decision Engine]`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(desc)}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(summary)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
