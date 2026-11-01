import {
  formatMilestoneMailtoUrl,
  generateIcsCalendarEvent,
  type MilestoneItem,
  type ProjectItem,
  type ReminderCopy,
} from '@ah/products/lighting/domain';

/** Saves a milestone as an .ics file the phone's calendar opens. */
export function downloadMilestoneIcs(
  project: ProjectItem,
  milestone: MilestoneItem,
  copy: ReminderCopy,
): void {
  const blob = new Blob([generateIcsCalendarEvent(project, milestone, copy)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `luxpath-${milestone.date}-${milestone.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Opens the mail app with a ready-written reminder. */
export function emailMilestone(
  project: ProjectItem,
  milestone: MilestoneItem,
  copy: ReminderCopy,
): void {
  window.location.href = formatMilestoneMailtoUrl(project, milestone, copy);
}
