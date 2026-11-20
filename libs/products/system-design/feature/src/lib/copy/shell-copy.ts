/** The shell's words (ADR-0018: each app owns its typed copy). */
export const SHELL_COPY = {
  heading: 'System Design',
  brandLine: 'Scale Lab · learn how systems grow',
  comingSoon:
    'Step-by-step lessons on how systems grow, with practice, cheatsheets and a traffic lab. The first lessons are on their way.',
  courseHeading: 'Course · 44 lessons',
  searchPrompt: 'Search lessons & concepts…',
  searchShortcut: 'Ctrl K',
  menuToggleLabel: 'Toggle course menu',
  closeMenuLabel: 'Close course menu',
  tabs: {
    learn: 'Learn',
    practice: 'Practice',
    lab: 'Design Lab',
    cheatsheets: 'Cheatsheets',
    guide: 'Guide',
  },
  placeholders: {
    practiceHeading: 'Practice quizzes',
    practiceBody:
      'Per-lesson checks and a 10-question mixed practice set arrive in Phase P8.',
    labHeading: 'Design Lab simulator',
    labBody:
      'Interactive traffic simulator and scaling challenges arrive in Phase P10.',
    cheatsheetsHeading: 'Module cheatsheets',
    cheatsheetsBody:
      'Printable reference sheets for all nine modules arrive in Phase P9.',
  },
} as const;
