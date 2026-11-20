/** Typed copy for the Guide screen (ADR-0018). */
export const GUIDE_COPY = {
  title: 'How the System Design course works',
  intro:
    'Each concept is taught as a short sequence of 6 to 12 steps over an animated isometric diagram. Step forward and back at your own pace, watch traffic flow through the architecture, and test yourself with practice checks and the traffic simulator.',
  sections: [
    {
      id: 'lessons',
      title: 'Stepped lessons',
      items: [
        'Each step updates the isometric diagram, the HUD metric chips, and the explanation panel on the right.',
        'The timeline below the diagram lets you jump straight to any step in the lesson.',
        'The "You\'ll learn" checklist ticks off concepts as you reach the steps that introduce them.',
        'Reaching the final Recap step marks the lesson complete (✓) in the course sidebar.',
      ],
    },
    {
      id: 'keys',
      title: 'Keyboard shortcuts',
      shortcuts: [
        { key: '← / →', action: 'Previous or next step in the current lesson' },
        { key: 'Home / End', action: 'Jump to the first or last step' },
        { key: 'R', action: 'Replay the current step’s packet animation' },
        { key: 'Space', action: 'Pause or resume packet animation' },
        { key: 'Ctrl / ⌘ + K', action: 'Open the course search dialog' },
        { key: 'Esc', action: 'Close the search dialog or course drawer' },
      ],
    },
    {
      id: 'data',
      title: 'What is saved',
      items: [
        'All progress, practice attempts and Design Lab architectures are saved locally in your browser (IndexedDB).',
        'There is no account or backend required — opening the course automatically resumes at your last visited lesson and step.',
        'When opened inside the portfolio demo, data is stored in an isolated demo database so it never overwrites standalone progress.',
      ],
    },
    {
      id: 'learning-engine',
      title: 'With the Learning Engine',
      items: [
        'On any lesson’s Recap step, use "Add to my daily reviews" to send that lesson’s review cards to the Learning Engine Inbox.',
        'Spaced repetition (FSRS) schedules those cards in your daily set just before you would forget them.',
      ],
    },
  ],
} as const;
