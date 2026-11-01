import { MilestoneItem, ProjectItem } from '../models/lighting.models';

/** The words a reminder needs, in the reader's language (the feature supplies them). */
export interface ReminderCopy {
  project: string;
  client: string;
  location: string;
  engineer: string;
  notes: string;
  noNotes: string;
  date: string;
  poles: string;
  dayBefore: string;
  twoHoursBefore: string;
  emailSubject: string;
  emailGreeting: string;
  emailIntro: string;
  emailChecklist: readonly string[];
  emailSignOff: string;
}

/** Escapes text for an iCalendar property value (RFC 5545 §3.3.11). */
function icsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * An iCalendar (.ics) event for a milestone, with reminders the day before and
 * two hours before. Opens in Google Calendar, Apple Calendar and Outlook.
 */
export function generateIcsCalendarEvent(
  project: ProjectItem,
  milestone: MilestoneItem,
  copy: ReminderCopy,
  now = new Date(),
): string {
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const day = milestone.date.replace(/-/g, '');
  const description = [
    `${copy.project}: ${project.title}`,
    `${copy.client}: ${project.clientOrMunicipality}`,
    `${copy.location}: ${project.locationName}`,
    `${copy.engineer}: ${project.engineerName}`,
    `${copy.notes}: ${milestone.notes || copy.noNotes}`,
  ].join('\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LuxPath Field Engineering//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:luxpath-${milestone.id}@hrichi-platform`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${day}T090000Z`,
    `DTEND:${day}T110000Z`,
    `SUMMARY:${icsText(`[LuxPath] ${milestone.title} (${project.title})`)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(project.locationName)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`${copy.dayBefore}: ${milestone.title}`)}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`${copy.twoHoursBefore}: ${milestone.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/** A mailto: link with a ready-written milestone reminder. */
export function formatMilestoneMailtoUrl(
  project: ProjectItem,
  milestone: MilestoneItem,
  copy: ReminderCopy,
  recipientEmail?: string,
): string {
  const email = recipientEmail || project.engineerEmail || '';
  const subject = encodeURIComponent(
    `[LuxPath] ${copy.emailSubject}: ${milestone.title} · ${project.title}`,
  );
  const body = encodeURIComponent(
    [
      copy.emailGreeting,
      '',
      copy.emailIntro,
      '',
      `${milestone.title}`,
      `${copy.date}: ${milestone.date}`,
      `${copy.project}: ${project.title}`,
      `${copy.client}: ${project.clientOrMunicipality}`,
      `${copy.location}: ${project.locationName}`,
      `${copy.poles}: ${project.poles.length}`,
      `${copy.notes}: ${milestone.notes || copy.noNotes}`,
      '',
      ...copy.emailChecklist.map((item) => `- ${item}`),
      '',
      copy.emailSignOff,
      project.engineerName,
    ].join('\n'),
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
