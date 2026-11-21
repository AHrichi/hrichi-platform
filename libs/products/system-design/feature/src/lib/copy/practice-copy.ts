/** The Practice screens' words (ADR-0018: each app owns its typed copy). */
export const PRACTICE_COPY = {
  home: {
    title: 'Practice',
    intro:
      'Short quizzes on what each lesson covered. Every answer is saved on this device, and your best score per lesson shows here.',
    mixTitle: 'Mixed practice · 10 questions',
    mixBody:
      'Questions from the lessons you have finished: the ones you missed last time first, then ones you have not seen.',
    mixStart: 'Start mixed practice',
    mixLockedHint: 'Finish one lesson to unlock mixed practice.',
    modulesHeading: 'By lesson',
    practice: 'Practice',
    review: 'Review lesson',
    best: 'Best',
    notYet: 'Not practised yet',
    soon: 'Coming soon',
    questions: (n: number) => `${n} ${n === 1 ? 'question' : 'questions'}`,
  },
  run: {
    lessonEyebrow: 'Lesson practice',
    mixTitle: 'Mixed practice',
    mixEyebrow: 'From your finished lessons',
    progress: (n: number, total: number) => `Question ${n} of ${total}`,
    from: 'From',
    next: 'Next question',
    finish: 'See results',
    back: '← Back to practice',
    loading: 'Loading questions…',
    unknownLesson: 'There is no lesson at this address.',
    noQuestions: 'This lesson has no practice questions yet.',
    noMix: 'Finish a lesson first: mixed practice draws on finished lessons.',
  },
  summary: {
    heading: 'Your score',
    score: (correct: number, total: number) => `${correct} / ${total}`,
    scoreLabel: (correct: number, total: number) =>
      `${correct} of ${total} correct`,
    allRight: 'Every answer right. Nicely done.',
    missedHeading: 'Missed questions',
    rightAnswer: 'Right answer:',
    seeInLesson: 'See it in the lesson',
    again: 'Practice again',
  },
  learnThis: {
    label: 'Add missed to my daily reviews',
    demoLabel: 'Try in demo',
    standaloneHint: 'Learning Engine, opens in a new tab',
    sentLabel: 'In your daily reviews',
  },
} as const;
