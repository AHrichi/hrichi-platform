/** The cheatsheet screens' words (ADR-0018: each app owns its typed copy). */
export const CHEATSHEET_COPY = {
  indexTitle: 'Cheatsheets',
  indexIntro:
    'One printable reference sheet per module: the numbers, tables and patterns worth keeping at hand.',
  modulesLabel: 'Module cheatsheets',
  lessonCount: (n: number) => (n === 1 ? '1 lesson' : `${n} lessons`),
  openSheet: 'Open sheet',
  backToIndex: '← All cheatsheets',
  breadcrumbRoot: 'Cheatsheets',
  print: 'Print',
  printHint: 'Prints on A4 without the app around it.',
  onThisPage: 'On this sheet',
  loading: 'Loading the cheatsheet…',
  loadFailed: 'This cheatsheet could not be loaded. Try again in a moment.',
  notFoundTitle: 'No such cheatsheet',
  notFoundBody: 'That module has no cheatsheet. Pick one from the list.',
  lessonLink: (title: string) => `Lesson: ${title} →`,
  patternLabels: { when: 'When', how: 'How', watch: 'Watch out' },
} as const;
