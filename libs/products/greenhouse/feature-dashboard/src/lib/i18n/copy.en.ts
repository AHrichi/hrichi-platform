/** The manager's dashboard in English; `{name}` placeholders are filled in. */
export const EN = {
  app: {
    name: 'Labour planner',
    tagline: 'Greenhouse harvest staffing',
    language: 'Language',
    demo: 'Demo farm: made-up greenhouses, teams and four weeks of history. Changes are not saved.',
  },
  plan: {
    title: 'Weekly plan',
    week: 'Week of {date}',
    previous: 'Previous week',
    next: 'Next week',
    thisWeek: 'This week',
    hours: 'Hours per picking day',
    greenhouse: 'Greenhouse',
    total: 'Week',
    cell: '{greenhouse}, {day}: expected kg',
    workers: '{n} workers',
    tableHint:
      'Expected kg per greenhouse and day. Below each, the workers it needs at the team’s picking rate.',
    tableLabel: 'Weekly plan by greenhouse and day',
    needed: 'Workers needed',
    available: 'Available',
    short: 'Short',
    teamGap:
      'Some teams are short while others have spare workers: moving them closes part of the gap.',
    issues:
      '{n} plan entries were left out (unknown greenhouse or invalid numbers).',
  },
  kpi: {
    kg: 'Expected this week',
    workerDays: 'Worker-days needed',
    shortage: 'Worker-days short',
    worst: 'Shortest day',
    none: 'None',
  },
  report: {
    title: 'Shortage report for HR',
    subject: 'Workers needed, week of {date}',
    heading: 'Workers needed, week of {date}',
    line: '{day}: short by {n} ({required} needed, {available} available)',
    total: 'Worker-days short this week: {n}',
    none: 'No shortage this week.',
    copy: 'Copy',
    copied: 'Copied',
    whatsapp: 'Send by WhatsApp',
    email: 'Send by email',
    print: 'Print',
  },
  crops: {
    tomato: 'Tomato',
    'cherry-tomato': 'Cherry tomato',
    pepper: 'Pepper',
    cucumber: 'Cucumber',
    melon: 'Melon',
    strawberry: 'Strawberry',
    other: 'Other crop',
  },
};

export type DashboardCopy = typeof EN;
