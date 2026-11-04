import { describe, expect, it } from 'vitest';
import type { AlarmSlot } from './models';
import { generateAlarmIcs } from './ics-exporter';

describe('generateAlarmIcs', () => {
  it('generates valid VCALENDAR with events and alarms', () => {
    const alarms: AlarmSlot[] = [
      {
        time: '06:00',
        title: 'D-3: Ch. 1 | NEW: Ch. 2',
        badgeVariant: 'accent',
        badgeLabel: 'Spaced Repetition',
        description: 'Morning study routine launch',
      },
      {
        time: '08:15',
        title: 'Blind Recall: Ch. 2 + Quiz',
        badgeVariant: 'accent',
        badgeLabel: 'Blind Recall',
        description: 'Active recall and daily quiz',
      },
    ];

    const ics = generateAlarmIcs('2026-11-05', alarms);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261105T060000');
    expect(ics).toContain('DTSTART:20261105T081500');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT0M');
    expect(ics).toContain('SUMMARY:06:00 Alarm: D-3: Ch. 1 | NEW: Ch. 2');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('handles empty alarms gracefully', () => {
    const ics = generateAlarmIcs('2026-11-05', []);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });
});
