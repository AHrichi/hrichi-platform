import type { SiteLanguage } from '@ah/shared/state';

export interface StudyLmCopy {
  tagline: string;
  selectSubject: string;
  newSubject: string;
  deleteSubject: string;
  n8nEngine: string;
  checking: string;
  online: string;
  offline: string;
  exportGuide: string;
  metrics: {
    roadmap: string;
    roadmapHint: string;
    progress: string;
    progressHint: string;
    cardsDue: string;
    cardsDueHint: string;
    quizAccuracy: string;
    quizAccuracyHint: string;
  };
  screens: {
    roadmap: string;
    learn: string;
    flashcards: string;
    quiz: string;
    sources: string;
    stats: string;
  };
  shell: {
    engineBadge: string;
    flashcardBank: string;
    mastered: string;
    ready: string;
    correct: string;
    of: string;
  };
  roadmap: {
    defaultTitle: string;
    sections: string;
    sectionsLower: string;
    groundingPortal: string;
    defaultDescription: string;
    generatingRoadmap: string;
    resynthesizeRoadmap: string;
    generateRoadmap: string;
    approveAllSections: string;
    generatingLessons: string;
    bulkGenerateLessons: string;
    bulkBannerTitle: string;
    cancel: string;
    batch: string;
    of: string;
    aiPausedTitle: string;
    aiPausedHintPrefix: string;
    builtInLessonsLink: string;
    aiPausedHintSuffix: string;
    roadmapErrorTitle: string;
    roadmapErrorHintPrefix: string;
    roadmapErrorHintSuffix: string;
    tryAgain: string;
    topicRequiredTitle: string;
    topicRequiredHint: string;
    synthesisProgressTitle: string;
    sectionsReady: string;
    collapseAllSections: string;
    expandAllSections: string;
    approved: string;
    pendingReview: string;
    cardsLower: string;
    quizLower: string;
    subtopicsLabel: string;
    officialGroundingLabel: string;
    approveSection: string;
    generatingCards: string;
    regenerateFlashcards: string;
    retryFlashcards: string;
    generateFlashcards: string;
    generatingQuiz: string;
    regenerateQuiz: string;
    retryQuiz: string;
    generateQuiz: string;
    writingLesson: string;
    openLesson: string;
    rewriteLesson: string;
    writeLesson: string;
    studyCards: string;
    takeQuiz: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
  };
  learn: {
    heading: string;
    description: string;
    bulkTitle: string;
    bulkPill: string;
    bulkGeneratingSubtitle: string;
    bulkReadyPrefix: string;
    bulkReadySuffix: string;
    bulkAllDonePrefix: string;
    bulkAllDoneSuffix: string;
    cancel: string;
    bulkGenerateBtn: string;
    batch: string;
    of: string;
    retryAttempts: string;
    failedToWritePrefix: string;
    failedToWriteSuffix: string;
    attempts: string;
    searchPlaceholder: string;
    tierLabel: string;
    allTiers: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    expert: string;
    statusLabel: string;
    allStatuses: string;
    notStarted: string;
    inProgress: string;
    completed: string;
    sourceLabel: string;
    allLessons: string;
    activePrefix: string;
    aiGenerated: string;
    builtInOffline: string;
    resetFilters: string;
    loadingLessons: string;
    loadError: string;
    emptyTitle: string;
    emptyDescription: string;
    clearAllFilters: string;
    showing: string;
    lessonSingular: string;
    lessonPlural: string;
    builtInLessonsHeading: string;
    builtInBadge: string;
    minUnit: string;
    complete: string;
    inProgressPrefix: string;
    checksSuffix: string;
    notStartedCard: string;
    jumpCards: string;
    jumpQuiz: string;
    jumpRoadmap: string;
    allLessonsBack: string;
    sectionPrefix: string;
    planningLesson: string;
    writingBlockPrefix: string;
    errorWritingPrefix: string;
    backToRoadmap: string;
    toTryAgain: string;
    writingCancelled: string;
    skippedBlockSingular: string;
    skippedBlockPlural: string;
    tryBlockAgain: string;
    loadingLesson: string;
    noLessonAtAddress: string;
    practiceTag: string;
    continueMastering: string;
    nextStepsDesc: string;
    practiceFlashcardsBtn: string;
    takeDiagnosticQuizBtn: string;
    backToRoadmapCardBtn: string;
  };
  flashcards: {
    filterByTierLabel: string;
    allTiers: string;
    beginner: string;
    intermediate: string;
    expert: string;
    allSections: string;
    cardsUnit: string;
    filterBySectionPlaceholder: string;
    filterCardsPlaceholder: string;
    addCard: string;
    exportAnki: string;
    sectionPrefix: string;
    openLesson: string;
    takeQuiz: string;
    roadmap: string;
    cardWord: string;
    of: string;
    bookmarked: string;
    bookmark: string;
    promptLabel: string;
    hint: string;
    flipToReveal: string;
    explanationLabel: string;
    deepDive: string;
    verifiedCodeTitle: string;
    interactiveSnippet: string;
    groundedCitation: string;
    flipBackHint: string;
    previous: string;
    next: string;
    selfAssessment: string;
    again: string;
    hard: string;
    good: string;
    easy: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
  };
  quiz: {
    filterByTierLabel: string;
    allTiers: string;
    beginner: string;
    intermediate: string;
    expert: string;
    allSections: string;
    questionsUnit: string;
    filterBySectionPlaceholder: string;
    addQuestion: string;
    importJson: string;
    sectionPrefix: string;
    openLesson: string;
    flashcards: string;
    roadmap: string;
    questionWord: string;
    of: string;
    scoreLabel: string;
    needHint: string;
    codeUnderEvaluation: string;
    analyzeSnippetHint: string;
    correctBadge: string;
    incorrectBadge: string;
    correctAssessment: string;
    misconception: string;
    deepDive: string;
    groundedReference: string;
    previous: string;
    nextQuestion: string;
    resetTest: string;
    submitSession: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
  };
  sources: {
    eyebrow: string;
    sourcesGrounded: string;
    totalWords: string;
    subtitle: string;
    addSourceDoc: string;
    synthesizingAi: string;
    resynthesizeSubject: string;
    synthesisFailedPrefix: string;
    synthesisFailedSuffix: string;
    emptyTitle: string;
    emptyDescription: string;
    addFirstSource: string;
    wordsUnit: string;
    readDocument: string;
    edit: string;
    editModalTitle: string;
    addModalTitle: string;
    modalEyebrow: string;
    sourceTypeLabel: string;
    typeDocument: string;
    typeSlide: string;
    typeLink: string;
    typeNote: string;
    sourceTitleLabel: string;
    sourceTitlePlaceholder: string;
    sourceUrlLabel: string;
    sourceContentLabel: string;
    sourceContentPlaceholder: string;
    cancel: string;
    updateSource: string;
    addToSources: string;
    externalReference: string;
    doneReading: string;
  };
  stats: {
    eyebrow: string;
    title: string;
    subtitle: string;
    trackedSubjects: string;
    trackedSubjectsHint: string;
    overallSynthesis: string;
    of: string;
    sectionsReady: string;
    cardMastery: string;
    cardMasteryHint: string;
    diagnosticAccuracy: string;
    correct: string;
    breakdownTitle: string;
    subjectsUnit: string;
    activeTrack: string;
    roadmapBtn: string;
    cardsBtn: string;
    quizBtn: string;
    curriculumSynthesis: string;
    sectionsUnit: string;
    flashcardDeck: string;
    mastered: string;
    quizAccuracy: string;
    answered: string;
    sourcesAttached: string;
    groundedIngests: string;
  };
  modals: {
    n8nTitle: string;
    n8nEyebrow: string;
    currentConnection: string;
    routingMode: string;
    modeTunnel: string;
    modeLocal: string;
    modeCustom: string;
    tunnelUrlLabel: string;
    localUrlLabel: string;
    customUrlLabel: string;
    cancel: string;
    pinging: string;
    testConnection: string;
    saveSettings: string;
    createSubjectTitle: string;
    createSubjectEyebrow: string;
    guardrailTitle: string;
    guardrailDesc: string;
    domainLabel: string;
    subjectNameLabel: string;
    subjectNamePlaceholder: string;
    focusNotesLabel: string;
    focusNotesPlaceholder: string;
    suggestedLabel: string;
    createBlank: string;
    createAndGenerate: string;
  };
}

export const STUDYLM_COPY: Record<SiteLanguage, StudyLmCopy> = {
  en: {
    tagline: 'Pedagogical Curriculum & Drill Engine',
    selectSubject: 'Select Subject...',
    newSubject: 'New Subject',
    deleteSubject: 'Delete',
    n8nEngine: 'n8n Engine',
    checking: 'Checking…',
    online: 'Online',
    offline: 'Offline',
    exportGuide: 'Export Guide',
    metrics: {
      roadmap: 'Roadmap Sections',
      roadmapHint: 'Chapters & Phases',
      progress: 'Synthesis Progress',
      progressHint: 'Active Curriculum Mastery',
      cardsDue: 'Review Cards Due',
      cardsDueHint: 'Spaced Repetition Queue',
      quizAccuracy: 'Arena Accuracy',
      quizAccuracyHint: 'Historical Retention',
    },
    screens: {
      roadmap: 'Roadmap',
      learn: 'Lessons',
      flashcards: 'Flashcards',
      quiz: 'Quiz',
      sources: 'Reference docs',
      stats: 'Progress',
    },
    shell: {
      engineBadge: 'Engine',
      flashcardBank: 'Flashcard Bank',
      mastered: 'Mastered',
      ready: 'Ready',
      correct: 'Correct',
      of: 'of',
    },
    roadmap: {
      defaultTitle: 'Technical Roadmap',
      sections: 'Sections',
      sectionsLower: 'sections',
      groundingPortal: 'Grounding Portal:',
      defaultDescription:
        'Decompose this software engineering concept into progressive chapters, atomic sections, and authoritative documentation references.',
      generatingRoadmap: 'Generating Roadmap...',
      resynthesizeRoadmap: 'Resynthesize Roadmap',
      generateRoadmap: 'Generate Roadmap',
      approveAllSections: 'Approve All Sections',
      generatingLessons: 'Generating Lessons',
      bulkGenerateLessons: 'Bulk Generate Lessons',
      bulkBannerTitle: '⚡ Bulk Lesson Generation',
      cancel: 'Cancel',
      batch: 'Batch',
      of: 'of',
      aiPausedTitle: 'AI features are paused',
      aiPausedHintPrefix: 'The',
      builtInLessonsLink: 'built-in lessons',
      aiPausedHintSuffix: 'work without it.',
      roadmapErrorTitle: 'The AI couldn’t make a roadmap',
      roadmapErrorHintPrefix:
        'Nothing was changed. Try again in a moment, or open the',
      roadmapErrorHintSuffix: ', which work offline.',
      tryAgain: 'Try again',
      topicRequiredTitle: 'Software Engineering Topic Required',
      topicRequiredHint:
        'StudyLM utilizes specialized technical engines grounded in authoritative software engineering specifications (e.g. JavaScript V8, Angular Signals, PostgreSQL MVCC, Distributed Systems). Please select a valid Software Engineering domain topic.',
      synthesisProgressTitle: 'Curriculum Synthesis Progress',
      sectionsReady: 'Sections Ready',
      collapseAllSections: 'Collapse all sections',
      expandAllSections: 'Expand all sections',
      approved: 'Approved',
      pendingReview: 'Pending Review',
      cardsLower: 'cards',
      quizLower: 'quiz',
      subtopicsLabel: 'Subtopics:',
      officialGroundingLabel: 'Official Grounding:',
      approveSection: 'Approve Section',
      generatingCards: 'Generating Cards...',
      regenerateFlashcards: 'Regenerate Flashcards',
      retryFlashcards: 'Retry Flashcards',
      generateFlashcards: 'Generate Flashcards',
      generatingQuiz: 'Generating Quiz...',
      regenerateQuiz: 'Regenerate Quiz',
      retryQuiz: 'Retry Quiz',
      generateQuiz: 'Generate Quiz',
      writingLesson: 'Writing lesson…',
      openLesson: 'Open Lesson',
      rewriteLesson: 'Rewrite Lesson',
      writeLesson: 'Write a Lesson',
      studyCards: 'Study Cards',
      takeQuiz: 'Take Quiz',
      emptyTitle: 'No Curriculum Roadmap Yet',
      emptyDescription:
        'StudyLM uses multi-model free-tier AI engines grounded in official specifications to break down software engineering concepts into structured chapters and atomic sections.',
      emptyAction: 'Generate Technical Roadmap',
    },
    learn: {
      heading: 'Lessons',
      description:
        'Each lesson explains one idea with visuals you step through, and asks you to predict, explain and practise as you go. Write one for any roadmap section from the Roadmap screen; the built-in ones work offline.',
      bulkTitle: 'Bulk Lesson Generation',
      bulkPill: 'Batches of 2 • Auto-retry',
      bulkGeneratingSubtitle:
        'Generating lessons in concurrent batches with automatic backoff retry...',
      bulkReadyPrefix: 'section(s) in',
      bulkReadySuffix: 'ready to generate.',
      bulkAllDonePrefix: 'All roadmap sections in',
      bulkAllDoneSuffix: 'have lessons!',
      cancel: 'Cancel',
      bulkGenerateBtn: 'Bulk Generate',
      batch: 'Batch',
      of: 'of',
      retryAttempts: 'retry attempt(s)',
      failedToWritePrefix: 'Failed to write',
      failedToWriteSuffix: 'lesson(s):',
      attempts: 'attempts',
      searchPlaceholder: 'Search lessons by title, topic, or objective...',
      tierLabel: 'Tier',
      allTiers: 'All Tiers',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert',
      statusLabel: 'Status',
      allStatuses: 'All Statuses',
      notStarted: 'Not Started',
      inProgress: 'In Progress',
      completed: 'Completed',
      sourceLabel: 'Source',
      allLessons: 'All Lessons',
      activePrefix: 'Active',
      aiGenerated: 'AI Generated',
      builtInOffline: 'Built-in (Offline)',
      resetFilters: 'Reset Filters',
      loadingLessons: 'Loading the lessons…',
      loadError: 'The lessons couldn’t be loaded. Reload to try again.',
      emptyTitle: 'No matching lessons found',
      emptyDescription:
        'Try adjusting your search terms or relaxing your filter criteria.',
      clearAllFilters: 'Clear all filters',
      showing: 'Showing',
      lessonSingular: 'lesson',
      lessonPlural: 'lessons',
      builtInLessonsHeading: 'Built-in lessons',
      builtInBadge: 'Built-in',
      minUnit: 'min',
      complete: 'Complete',
      inProgressPrefix: 'In progress:',
      checksSuffix: 'checks',
      notStartedCard: 'Not started',
      jumpCards: 'Cards',
      jumpQuiz: 'Quiz',
      jumpRoadmap: 'Roadmap',
      allLessonsBack: '← All lessons',
      sectionPrefix: 'Section',
      planningLesson: 'Planning the lesson…',
      writingBlockPrefix: 'Writing block',
      errorWritingPrefix: 'The lesson couldn’t be written:',
      backToRoadmap: 'Back to the roadmap',
      toTryAgain: 'to try again.',
      writingCancelled: 'Writing was cancelled.',
      skippedBlockSingular:
        "block was left out: the AI's version failed the checks, even after a repair.",
      skippedBlockPlural:
        "blocks were left out: the AI's version failed the checks, even after a repair.",
      tryBlockAgain: 'Try this block again',
      loadingLesson: 'Loading the lesson…',
      noLessonAtAddress: 'There’s no lesson at this address.',
      practiceTag: 'Practice & Reinforce',
      continueMastering: 'Continue mastering',
      nextStepsDesc:
        'Test your recall with flashcards and check your conceptual understanding with quiz questions designed for this section.',
      practiceFlashcardsBtn: '🃏 Practice Flashcards',
      takeDiagnosticQuizBtn: '🎯 Take Diagnostic Quiz',
      backToRoadmapCardBtn: '🗺️ Back to Roadmap Card',
    },
    flashcards: {
      filterByTierLabel: 'Filter Flashcards by Tier',
      allTiers: 'All Tiers',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      expert: 'Expert',
      allSections: 'All Sections',
      cardsUnit: 'cards',
      filterBySectionPlaceholder: 'Filter by section...',
      filterCardsPlaceholder: 'Filter cards...',
      addCard: '+ Add Card',
      exportAnki: 'Export Anki',
      sectionPrefix: 'Section',
      openLesson: '📖 Open Lesson',
      takeQuiz: '🎯 Take Quiz',
      roadmap: '🗺️ Roadmap',
      cardWord: 'Card',
      of: 'of',
      bookmarked: '★ Bookmarked',
      bookmark: '☆ Bookmark',
      promptLabel: 'PROMPT',
      hint: 'Hint',
      flipToReveal: 'Press Space or Click to reveal answer',
      explanationLabel: 'EXPLANATION',
      deepDive: 'Deep Dive & Diagram',
      verifiedCodeTitle: 'Verified Code Example',
      interactiveSnippet: 'Interactive snippet',
      groundedCitation: 'Grounded Citation:',
      flipBackHint: 'Click or Space to flip back to question 🔄',
      previous: '← Previous',
      next: 'Next →',
      selfAssessment: 'Self-Assessment:',
      again: 'Again',
      hard: 'Hard',
      good: 'Good',
      easy: 'Easy',
      emptyTitle: 'No Flashcards Available',
      emptyDescription:
        'Generate flashcards for any section in the Curriculum Roadmap tab, or add cards manually.',
      emptyAction: 'Go to Roadmap',
    },
    quiz: {
      filterByTierLabel: 'Filter Quiz Questions by Tier',
      allTiers: 'All Tiers',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      expert: 'Expert',
      allSections: 'All Sections',
      questionsUnit: 'questions',
      filterBySectionPlaceholder: 'Filter by section...',
      addQuestion: '+ Add Question',
      importJson: '📥 Import JSON',
      sectionPrefix: 'Section',
      openLesson: '📖 Open Lesson',
      flashcards: '🃏 Flashcards',
      roadmap: '🗺️ Roadmap',
      questionWord: 'Question',
      of: 'of',
      scoreLabel: 'Score:',
      needHint: 'Need a Hint?',
      codeUnderEvaluation: 'Code Under Evaluation',
      analyzeSnippetHint: 'Analyze the snippet to determine outcome',
      correctBadge: '✓ Correct',
      incorrectBadge: '✕ Incorrect',
      correctAssessment: '✓ Correct Assessment',
      misconception: '✕ Specification Misconception',
      deepDive: 'Deep Dive & Diagram',
      groundedReference: 'Grounded Reference:',
      previous: '← Previous',
      nextQuestion: 'Next Question →',
      resetTest: 'Reset Test',
      submitSession: 'Submit Session',
      emptyTitle: 'No Quiz Questions Available',
      emptyDescription:
        'Generate diagnostic quizzes for any section in the Curriculum Roadmap tab, or add questions manually.',
      emptyAction: 'Go to Roadmap',
    },
    sources: {
      eyebrow: 'Subject Knowledge Base',
      sourcesGrounded: 'Sources Grounded',
      totalWords: 'Total Words',
      subtitle:
        'Ground all flashcards, quizzes, and briefing notes directly in these materials. You can edit, add, or update sources anytime and re-synthesize.',
      addSourceDoc: 'Add Source Document',
      synthesizingAi: '⚡ Synthesizing with AI...',
      resynthesizeSubject: '✨ Re-synthesize Subject',
      synthesisFailedPrefix: 'Synthesis failed:',
      synthesisFailedSuffix:
        'Your subject is unchanged; try again when n8n is reachable.',
      emptyTitle: 'No sources added yet for this subject',
      emptyDescription:
        'Add documents, paste slide notes, or link reference documentation to begin generating grounded study materials.',
      addFirstSource: '+ Add First Source',
      wordsUnit: 'words',
      readDocument: 'Read Document',
      edit: '✏️ Edit',
      editModalTitle: 'Edit Knowledge Source',
      addModalTitle: 'Add Knowledge Source',
      modalEyebrow: 'Ingestion Pipeline',
      sourceTypeLabel: 'Source Type',
      typeDocument: '📄 Document / Text',
      typeSlide: '📑 Slide Presentation',
      typeLink: '🔗 Web Documentation Link',
      typeNote: '📝 Personal Note',
      sourceTitleLabel: 'Source Title / Reference Name *',
      sourceTitlePlaceholder:
        'e.g. Raft Consensus Paper, or Angular 19 Zoneless Architecture',
      sourceUrlLabel: 'Reference URL (Optional)',
      sourceContentLabel: 'Content / Slides / Notes / Extracted Text *',
      sourceContentPlaceholder:
        'Paste the full text, markdown, slide contents, or summary to ground AI generation...',
      cancel: 'Cancel',
      updateSource: 'Update Source',
      addToSources: 'Add to StudyLM Sources',
      externalReference: 'External Reference:',
      doneReading: 'Done Reading',
    },
    stats: {
      eyebrow: 'Learning Analytics & Retention Engine',
      title: 'Study Mastery & Progress Dashboard',
      subtitle:
        'Across your subjects: roadmap progress, how well you know your flashcards, and your quiz accuracy.',
      trackedSubjects: 'Tracked Subjects',
      trackedSubjectsHint: 'Active Learning Tracks',
      overallSynthesis: 'Overall Synthesis',
      of: 'of',
      sectionsReady: 'Sections Ready',
      cardMastery: 'Card Mastery',
      cardMasteryHint: 'Rated good or easy 3+ times',
      diagnosticAccuracy: 'Diagnostic Accuracy',
      correct: 'Correct',
      breakdownTitle: 'Subject-by-Subject Breakdown',
      subjectsUnit: 'Subjects',
      activeTrack: 'Active Track',
      roadmapBtn: '🗺️ Roadmap',
      cardsBtn: '🃏 Cards',
      quizBtn: '🎯 Quiz',
      curriculumSynthesis: 'Curriculum Synthesis',
      sectionsUnit: 'Sections',
      flashcardDeck: 'Flashcard Deck',
      mastered: 'Mastered',
      quizAccuracy: 'Quiz Accuracy',
      answered: 'Answered',
      sourcesAttached: 'Sources Attached',
      groundedIngests: 'Grounded Ingests',
    },
    modals: {
      n8nTitle: 'n8n Synthesis Engine Settings',
      n8nEyebrow: 'Engine Infrastructure Configuration',
      currentConnection: 'Current Connection:',
      routingMode: 'Routing Mode',
      modeTunnel: 'Cloud Tunnel (ngrok)',
      modeLocal: 'Localhost (Docker)',
      modeCustom: 'Custom Webhook',
      tunnelUrlLabel: 'ngrok / Cloud Tunnel URL *',
      localUrlLabel: 'Localhost Docker Webhook *',
      customUrlLabel: 'Custom Webhook URL *',
      cancel: 'Cancel',
      pinging: 'Pinging...',
      testConnection: 'Test Connection',
      saveSettings: 'Save Settings',
      createSubjectTitle: 'New Software Engineering Subject',
      createSubjectEyebrow: 'Pedagogical Curriculum Deconstruction',
      guardrailTitle: 'Software Engineering Guardrail',
      guardrailDesc:
        'StudyLM is strictly calibrated for Software Engineering, Computer Science, and System Architecture concepts (e.g., JavaScript internals, React/Angular architectures, Distributed Consensus, PostgreSQL MVCC).',
      domainLabel: 'Software Engineering Domain *',
      subjectNameLabel: 'Subject / Concept Name *',
      subjectNamePlaceholder:
        'e.g. JavaScript Internals & V8, Distributed Consensus (Raft), PostgreSQL Indexing',
      focusNotesLabel: 'Focus Notes & Constraints (Optional)',
      focusNotesPlaceholder:
        'e.g. Focus deeply on memory layouts, garbage collection, event loop microtasks, and gotchas.',
      suggestedLabel: 'Or Pick a Standard Curriculum Track:',
      createBlank: 'Create Blank',
      createAndGenerate: 'Create & Generate Roadmap',
    },
  },
  fr: {
    tagline: 'Moteur pédagogique de cours et d’entraînement',
    selectSubject: 'Choisir une matière...',
    newSubject: 'Nouvelle matière',
    deleteSubject: 'Supprimer',
    n8nEngine: 'Moteur n8n',
    checking: 'Vérification…',
    online: 'En ligne',
    offline: 'Hors-ligne',
    exportGuide: 'Exporter le guide',
    metrics: {
      roadmap: 'Sections du parcours',
      roadmapHint: 'Chapitres & modules',
      progress: 'Progression globale',
      progressHint: 'Maîtrise du programme',
      cardsDue: 'Cartes à réviser',
      cardsDueHint: 'File de répétition espacée',
      quizAccuracy: 'Précision des quiz',
      quizAccuracyHint: 'Rétention mesurée',
    },
    screens: {
      roadmap: 'Feuille de route',
      learn: 'Leçons',
      flashcards: 'Cartes mémoire',
      quiz: 'Quiz & arène',
      sources: 'Documentation',
      stats: 'Statistiques',
    },
    shell: {
      engineBadge: 'Moteur',
      flashcardBank: 'Banque de cartes',
      mastered: 'Maîtrisées',
      ready: 'Prêtes',
      correct: 'Correctes',
      of: 'sur',
    },
    roadmap: {
      defaultTitle: 'Feuille de route technique',
      sections: 'Sections',
      sectionsLower: 'sections',
      groundingPortal: 'Portail de référence :',
      defaultDescription:
        'Décomposez ce concept de génie logiciel en chapitres progressifs, sections atomiques et références officielles.',
      generatingRoadmap: 'Génération du parcours...',
      resynthesizeRoadmap: 'Resynthétiser le parcours',
      generateRoadmap: 'Générer le parcours',
      approveAllSections: 'Tout approuver',
      generatingLessons: 'Génération des leçons',
      bulkGenerateLessons: 'Générer les leçons en lot',
      bulkBannerTitle: '⚡ Génération groupée de leçons',
      cancel: 'Annuler',
      batch: 'Lot',
      of: 'sur',
      aiPausedTitle: 'Les fonctions IA sont en pause',
      aiPausedHintPrefix: 'Les',
      builtInLessonsLink: 'leçons intégrées',
      aiPausedHintSuffix: 'fonctionnent hors-ligne.',
      roadmapErrorTitle: 'L’IA n’a pas pu créer le parcours',
      roadmapErrorHintPrefix:
        'Aucune modification n’a été appliquée. Réessayez dans un instant ou ouvrez les',
      roadmapErrorHintSuffix: ', disponibles hors-ligne.',
      tryAgain: 'Réessayer',
      topicRequiredTitle: 'Sujet de génie logiciel requis',
      topicRequiredHint:
        'StudyLM utilise des moteurs techniques fondés sur des spécifications officielles (ex. JavaScript V8, Angular Signals, PostgreSQL MVCC, Systèmes distribués). Veuillez choisir un sujet de génie logiciel valide.',
      synthesisProgressTitle: 'Progression de la synthèse du programme',
      sectionsReady: 'Sections prêtes',
      collapseAllSections: 'Tout réduire',
      expandAllSections: 'Tout développer',
      approved: 'Approuvé',
      pendingReview: 'En attente',
      cardsLower: 'cartes',
      quizLower: 'quiz',
      subtopicsLabel: 'Sous-thèmes :',
      officialGroundingLabel: 'Références officielles :',
      approveSection: 'Approuver la section',
      generatingCards: 'Génération des cartes...',
      regenerateFlashcards: 'Régénérer les cartes',
      retryFlashcards: 'Réessayer les cartes',
      generateFlashcards: 'Générer les cartes',
      generatingQuiz: 'Génération du quiz...',
      regenerateQuiz: 'Régénérer le quiz',
      retryQuiz: 'Réessayer le quiz',
      generateQuiz: 'Générer le quiz',
      writingLesson: 'Rédaction de la leçon…',
      openLesson: 'Ouvrir la leçon',
      rewriteLesson: 'Réécrire la leçon',
      writeLesson: 'Rédiger une leçon',
      studyCards: 'Étudier les cartes',
      takeQuiz: 'Passer le quiz',
      emptyTitle: 'Aucune feuille de route pour l’instant',
      emptyDescription:
        'StudyLM utilise des moteurs IA multi-modèles ancrés dans les spécifications officielles pour découper les concepts logiciels en chapitres structurés.',
      emptyAction: 'Générer la feuille de route technique',
    },
    learn: {
      heading: 'Leçons',
      description:
        'Chaque leçon explique un concept étape par étape avec des visuels interactifs, et vous invite à prédire, expliquer et pratiquer. Générez-en depuis la feuille de route ; les leçons intégrées fonctionnent hors-ligne.',
      bulkTitle: 'Génération groupée de leçons',
      bulkPill: 'Lots de 2 • Réessai auto',
      bulkGeneratingSubtitle:
        'Génération des leçons par lots parallèles avec réessai automatique...',
      bulkReadyPrefix: 'section(s) dans',
      bulkReadySuffix: 'prête(s) à générer.',
      bulkAllDonePrefix: 'Toutes les sections de',
      bulkAllDoneSuffix: 'ont des leçons !',
      cancel: 'Annuler',
      bulkGenerateBtn: 'Générer en lot',
      batch: 'Lot',
      of: 'sur',
      retryAttempts: 'tentative(s) de réessai',
      failedToWritePrefix: 'Échec de génération pour',
      failedToWriteSuffix: 'leçon(s) :',
      attempts: 'tentatives',
      searchPlaceholder: 'Rechercher par titre, sujet ou objectif...',
      tierLabel: 'Niveau',
      allTiers: 'Tous les niveaux',
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      advanced: 'Avancé',
      expert: 'Expert',
      statusLabel: 'Statut',
      allStatuses: 'Tous les statuts',
      notStarted: 'Non commencé',
      inProgress: 'En cours',
      completed: 'Terminé',
      sourceLabel: 'Source',
      allLessons: 'Toutes les leçons',
      activePrefix: 'Actif',
      aiGenerated: 'Généré par IA',
      builtInOffline: 'Intégré (Hors-ligne)',
      resetFilters: 'Réinitialiser',
      loadingLessons: 'Chargement des leçons…',
      loadError:
        'Impossible de charger les leçons. Rechargez la page pour réessayer.',
      emptyTitle: 'Aucune leçon correspondante',
      emptyDescription:
        'Essayez de modifier vos termes de recherche ou vos filtres.',
      clearAllFilters: 'Effacer tous les filtres',
      showing: 'Affichage de',
      lessonSingular: 'leçon',
      lessonPlural: 'leçons',
      builtInLessonsHeading: 'Leçons intégrées',
      builtInBadge: 'Intégré',
      minUnit: 'min',
      complete: 'Terminé',
      inProgressPrefix: 'En cours :',
      checksSuffix: 'vérifications',
      notStartedCard: 'Non commencé',
      jumpCards: 'Cartes',
      jumpQuiz: 'Quiz',
      jumpRoadmap: 'Parcours',
      allLessonsBack: '← Toutes les leçons',
      sectionPrefix: 'Section',
      planningLesson: 'Planification de la leçon…',
      writingBlockPrefix: 'Rédaction du bloc',
      errorWritingPrefix: 'Impossible de rédiger la leçon :',
      backToRoadmap: 'Retour à la feuille de route',
      toTryAgain: 'pour réessayer.',
      writingCancelled: 'La rédaction a été annulée.',
      skippedBlockSingular:
        'bloc a été ignoré : la version IA a échoué aux vérifications.',
      skippedBlockPlural:
        'blocs ont été ignorés : la version IA a échoué aux vérifications.',
      tryBlockAgain: 'Réessayer ce bloc',
      loadingLesson: 'Chargement de la leçon…',
      noLessonAtAddress: 'Aucune leçon à cette adresse.',
      practiceTag: 'Pratiquer & Renforcer',
      continueMastering: 'Continuer à maîtriser',
      nextStepsDesc:
        'Testez votre mémorisation avec des cartes mémoire et vérifiez votre compréhension avec les quiz de cette section.',
      practiceFlashcardsBtn: '🃏 Pratiquer les cartes',
      takeDiagnosticQuizBtn: '🎯 Passer le quiz diagnostique',
      backToRoadmapCardBtn: '🗺️ Retour à la carte du parcours',
    },
    flashcards: {
      filterByTierLabel: 'Filtrer les cartes par niveau',
      allTiers: 'Tous les niveaux',
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      expert: 'Expert',
      allSections: 'Toutes les sections',
      cardsUnit: 'cartes',
      filterBySectionPlaceholder: 'Filtrer par section...',
      filterCardsPlaceholder: 'Filtrer les cartes...',
      addCard: '+ Ajouter une carte',
      exportAnki: 'Exporter Anki',
      sectionPrefix: 'Section',
      openLesson: '📖 Ouvrir la leçon',
      takeQuiz: '🎯 Passer le quiz',
      roadmap: '🗺️ Parcours',
      cardWord: 'Carte',
      of: 'sur',
      bookmarked: '★ Favori',
      bookmark: '☆ Favori',
      promptLabel: 'QUESTION',
      hint: 'Indice',
      flipToReveal: 'Appuyez sur Espace ou cliquez pour révéler la réponse',
      explanationLabel: 'EXPLICATION',
      deepDive: 'Analyse approfondie & schéma',
      verifiedCodeTitle: 'Exemple de code vérifié',
      interactiveSnippet: 'Extrait interactif',
      groundedCitation: 'Référence officielle :',
      flipBackHint: 'Cliquez ou appuyez sur Espace pour revenir 🔄',
      previous: '← Précédent',
      next: 'Suivant →',
      selfAssessment: 'Auto-évaluation :',
      again: 'À revoir',
      hard: 'Difficile',
      good: 'Bien',
      easy: 'Facile',
      emptyTitle: 'Aucune carte mémoire disponible',
      emptyDescription:
        'Générez des cartes mémoire pour n’importe quelle section depuis la feuille de route, ou ajoutez-en manuellement.',
      emptyAction: 'Aller au parcours',
    },
    quiz: {
      filterByTierLabel: 'Filtrer les questions par niveau',
      allTiers: 'Tous les niveaux',
      beginner: 'Débutant',
      intermediate: 'Intermédiaire',
      expert: 'Expert',
      allSections: 'Toutes les sections',
      questionsUnit: 'questions',
      filterBySectionPlaceholder: 'Filtrer par section...',
      addQuestion: '+ Ajouter une question',
      importJson: '📥 Importer JSON',
      sectionPrefix: 'Section',
      openLesson: '📖 Ouvrir la leçon',
      flashcards: '🃏 Cartes mémoire',
      roadmap: '🗺️ Parcours',
      questionWord: 'Question',
      of: 'sur',
      scoreLabel: 'Score :',
      needHint: 'Besoin d’un indice ?',
      codeUnderEvaluation: 'Code à analyser',
      analyzeSnippetHint: 'Analysez l’extrait pour déterminer le résultat',
      correctBadge: '✓ Correct',
      incorrectBadge: '✕ Incorrect',
      correctAssessment: '✓ Évaluation correcte',
      misconception: '✕ Erreur d’interprétation',
      deepDive: 'Analyse approfondie & schéma',
      groundedReference: 'Référence officielle :',
      previous: '← Précédent',
      nextQuestion: 'Question suivante →',
      resetTest: 'Réinitialiser le test',
      submitSession: 'Valider la session',
      emptyTitle: 'Aucune question de quiz disponible',
      emptyDescription:
        'Générez des quiz diagnostiques depuis l’onglet Feuille de route, ou ajoutez des questions manuellement.',
      emptyAction: 'Aller au parcours',
    },
    sources: {
      eyebrow: 'Base de connaissances de la matière',
      sourcesGrounded: 'Sources intégrées',
      totalWords: 'Mots au total',
      subtitle:
        'Ancrez toutes vos cartes mémoire, quiz et notes de synthèse directement dans ces documents. Vous pouvez ajouter ou modifier vos sources à tout moment.',
      addSourceDoc: 'Ajouter un document source',
      synthesizingAi: '⚡ Synthèse IA en cours...',
      resynthesizeSubject: '✨ Resynthétiser la matière',
      synthesisFailedPrefix: 'Échec de la synthèse :',
      synthesisFailedSuffix:
        'Votre matière est inchangée ; réessayez lorsque n8n est joignable.',
      emptyTitle: 'Aucune source ajoutée pour cette matière',
      emptyDescription:
        'Ajoutez des documents, notes de présentation ou liens de documentation officielle pour générer des supports ancrés.',
      addFirstSource: '+ Ajouter une première source',
      wordsUnit: 'mots',
      readDocument: 'Lire le document',
      edit: '✏️ Modifier',
      editModalTitle: 'Modifier la source',
      addModalTitle: 'Ajouter une source de connaissances',
      modalEyebrow: 'Pipeline d’ingestion',
      sourceTypeLabel: 'Type de source',
      typeDocument: '📄 Document / Texte',
      typeSlide: '📑 Présentation / Slides',
      typeLink: '🔗 Lien de documentation web',
      typeNote: '📝 Note personnelle',
      sourceTitleLabel: 'Titre de la source / Nom de référence *',
      sourceTitlePlaceholder:
        'ex. Article Consensus Raft, ou Architecture Angular Zoneless',
      sourceUrlLabel: 'URL de référence (Optionnel)',
      sourceContentLabel: 'Contenu / Notes / Texte extrait *',
      sourceContentPlaceholder:
        'Collez le texte complet, le markdown ou le résumé pour ancrer la génération IA...',
      cancel: 'Annuler',
      updateSource: 'Mettre à jour la source',
      addToSources: 'Ajouter aux sources StudyLM',
      externalReference: 'Référence externe :',
      doneReading: 'Fermer la lecture',
    },
    stats: {
      eyebrow: 'Analytique d’apprentissage & moteur de rétention',
      title: 'Tableau de bord de maîtrise et de progression',
      subtitle:
        'Sur l’ensemble de vos matières : avancement du parcours, maîtrise des cartes mémoire et précision aux quiz.',
      trackedSubjects: 'Matières suivies',
      trackedSubjectsHint: 'Parcours d’apprentissage actifs',
      overallSynthesis: 'Synthèse globale',
      of: 'sur',
      sectionsReady: 'Sections prêtes',
      cardMastery: 'Maîtrise des cartes',
      cardMasteryHint: 'Notées bien ou facile 3+ fois',
      diagnosticAccuracy: 'Précision diagnostique',
      correct: 'Correctes',
      breakdownTitle: 'Détail par matière',
      subjectsUnit: 'Matières',
      activeTrack: 'Parcours actif',
      roadmapBtn: '🗺️ Parcours',
      cardsBtn: '🃏 Cartes',
      quizBtn: '🎯 Quiz',
      curriculumSynthesis: 'Synthèse du programme',
      sectionsUnit: 'Sections',
      flashcardDeck: 'Jeu de cartes',
      mastered: 'Maîtrisées',
      quizAccuracy: 'Précision des quiz',
      answered: 'Répondues',
      sourcesAttached: 'Sources jointes',
      groundedIngests: 'Ingestions ancrées',
    },
    modals: {
      n8nTitle: 'Paramètres du moteur de synthèse n8n',
      n8nEyebrow: 'Configuration de l’infrastructure',
      currentConnection: 'Connexion actuelle :',
      routingMode: 'Mode de routage',
      modeTunnel: 'Tunnel Cloud (ngrok)',
      modeLocal: 'Localhost (Docker)',
      modeCustom: 'Webhook personnalisé',
      tunnelUrlLabel: 'URL du tunnel Cloud / ngrok *',
      localUrlLabel: 'Webhook Docker Localhost *',
      customUrlLabel: 'URL du Webhook personnalisé *',
      cancel: 'Annuler',
      pinging: 'Test en cours...',
      testConnection: 'Tester la connexion',
      saveSettings: 'Enregistrer',
      createSubjectTitle: 'Nouvelle matière de génie logiciel',
      createSubjectEyebrow: 'Déconstruction pédagogique du programme',
      guardrailTitle: 'Garde-fou Génie Logiciel',
      guardrailDesc:
        'StudyLM est strictement calibré pour les concepts de génie logiciel, d’informatique et d’architecture système (ex. moteur V8, architectures React/Angular, consensus distribué, PostgreSQL MVCC).',
      domainLabel: 'Domaine de génie logiciel *',
      subjectNameLabel: 'Nom de la matière / du concept *',
      subjectNamePlaceholder:
        'ex. Fonctionnement interne JavaScript & V8, Consensus Raft, Indexation PostgreSQL',
      focusNotesLabel: 'Notes de cadrage & contraintes (Optionnel)',
      focusNotesPlaceholder:
        'ex. Insister sur la gestion mémoire, le ramasse-miettes, la boucle d’événements et les pièges courants.',
      suggestedLabel: 'Ou choisir un parcours standard :',
      createBlank: 'Créer à vide',
      createAndGenerate: 'Créer & générer le parcours',
    },
  },
  ar: {
    tagline: 'محرك المسارات التعليمية والتدريب التفاعلي',
    selectSubject: 'اختر مادة دراسية...',
    newSubject: 'مادة جديدة',
    deleteSubject: 'حذف',
    n8nEngine: 'محرك n8n',
    checking: 'جارٍ التحقق…',
    online: 'متصل',
    offline: 'غير متصل',
    exportGuide: 'تصدير الدليل',
    metrics: {
      roadmap: 'أقسام المسار',
      roadmapHint: 'الفصول والمراحل',
      progress: 'معدل الإتقان',
      progressHint: 'استيعاب المنهاج النشط',
      cardsDue: 'بطاقات مستحقة للمراجعة',
      cardsDueHint: 'طابور التكرار المتباعد',
      quizAccuracy: 'دقة الإجابات',
      quizAccuracyHint: 'مستوى التذكر التاريخي',
    },
    screens: {
      roadmap: 'خارطة التعلم',
      learn: 'الدروس',
      flashcards: 'بطاقات التذكر',
      quiz: 'الاختبارات',
      sources: 'المراجع والوثائق',
      stats: 'التقدم والإحصائيات',
    },
    shell: {
      engineBadge: 'محرك',
      flashcardBank: 'بنك البطاقات',
      mastered: 'متقنة',
      ready: 'جاهزة',
      correct: 'صحيحة',
      of: 'من',
    },
    roadmap: {
      defaultTitle: 'خارطة التعلم التقنية',
      sections: 'أقسام',
      sectionsLower: 'أقسام',
      groundingPortal: 'بوابة التوثيق المرجعي:',
      defaultDescription:
        'فكّك هذا المفهوم الهندسي البرمجي إلى فصول متدرجة وأقسام مركزة ومراجع توثيقية معتمدة.',
      generatingRoadmap: 'جارٍ توليد خارطة التعلم...',
      resynthesizeRoadmap: 'إعادة توليد الخارطة',
      generateRoadmap: 'توليد خارطة التعلم',
      approveAllSections: 'اعتماد جميع الأقسام',
      generatingLessons: 'جارٍ توليد الدروس',
      bulkGenerateLessons: 'توليد الدروس دفعة واحدة',
      bulkBannerTitle: '⚡ التوليد الجماعي للدروس',
      cancel: 'إلغاء',
      batch: 'الدفعة',
      of: 'من',
      aiPausedTitle: 'ميزات الذكاء الاصطناعي متوقفة مؤقتاً',
      aiPausedHintPrefix: 'إن',
      builtInLessonsLink: 'الدروس المدمجة',
      aiPausedHintSuffix: 'تعمل بدون اتصال.',
      roadmapErrorTitle: 'تعذّر على الذكاء الاصطناعي إنشاء خارطة التعلم',
      roadmapErrorHintPrefix:
        'لم يتم تغيير أي شيء. حاول مرة أخرى بعد قليل، أو افتح',
      roadmapErrorHintSuffix: 'التي تعمل دون اتصال.',
      tryAgain: 'إعادة المحاولة',
      topicRequiredTitle: 'مطلوب موضوع في هندسة البرمجيات',
      topicRequiredHint:
        'يعتمد StudyLM على محركات تقنية متخصصة مستندة إلى المواصفات القياسية لهندسة البرمجيات (مثل JavaScript V8 وAngular Signals وPostgreSQL MVCC والأنظمة الموزعة). يرجى اختيار موضوع صالح في هندسة البرمجيات.',
      synthesisProgressTitle: 'تقدم بناء المنهاج الدراسي',
      sectionsReady: 'أقسام جاهزة',
      collapseAllSections: 'طي جميع الأقسام',
      expandAllSections: 'توسيع جميع الأقسام',
      approved: 'معتمد',
      pendingReview: 'قيد المراجعة',
      cardsLower: 'بطاقات',
      quizLower: 'اختبار',
      subtopicsLabel: 'المواضيع الفرعية:',
      officialGroundingLabel: 'المراجع الرسمية:',
      approveSection: 'اعتماد القسم',
      generatingCards: 'جارٍ توليد البطاقات...',
      regenerateFlashcards: 'إعادة توليد البطاقات',
      retryFlashcards: 'إعادة محاولة البطاقات',
      generateFlashcards: 'توليد البطاقات',
      generatingQuiz: 'جارٍ توليد الاختبار...',
      regenerateQuiz: 'إعادة توليد الاختبار',
      retryQuiz: 'إعادة محاولة الاختبار',
      generateQuiz: 'توليد الاختبار',
      writingLesson: 'جارٍ كتابة الدرس…',
      openLesson: 'فتح الدرس',
      rewriteLesson: 'إعادة كتابة الدرس',
      writeLesson: 'كتابة درس',
      studyCards: 'دراسة البطاقات',
      takeQuiz: 'بدء الاختبار',
      emptyTitle: 'لا توجد خارطة تعلم بعد',
      emptyDescription:
        'يستخدم StudyLM محركات ذكاء اصطناعي متعددة النماذج وموثقة بالمصادر الرسمية لتقسيم مفاهيم هندسة البرمجيات إلى فصول وأقسام منظمة.',
      emptyAction: 'توليد خارطة التعلم التقنية',
    },
    learn: {
      heading: 'الدروس',
      description:
        'يشرح كل درس فكرة واحدة عبر رسوم توضيحية تفاعلية خطوة بخطوة، ويطلب منك التوقع والشرح والتطبيق أثناء التعلم. يمكنك إنشاء درس لأي قسم من شاشة خارطة التعلم؛ بينما تعمل الدروس المدمجة دون اتصال.',
      bulkTitle: 'التوليد الجماعي للدروس',
      bulkPill: 'دفعات من 2 • إعادة محاولة تلقائية',
      bulkGeneratingSubtitle:
        'جارٍ توليد الدروس على دفعات متزامنة مع إعادة المحاولة التلقائية...',
      bulkReadyPrefix: 'قسم في',
      bulkReadySuffix: 'جاهز للتوليد.',
      bulkAllDonePrefix: 'جميع أقسام الخارطة في',
      bulkAllDoneSuffix: 'لديها دروس جاهزة!',
      cancel: 'إلغاء',
      bulkGenerateBtn: 'توليد جماعي',
      batch: 'الدفعة',
      of: 'من',
      retryAttempts: 'محاولات إعادة',
      failedToWritePrefix: 'تعذّر كتابة',
      failedToWriteSuffix: 'درس:',
      attempts: 'محاولات',
      searchPlaceholder: 'ابحث في الدروس حسب العنوان أو الموضوع أو الهدف...',
      tierLabel: 'المستوى',
      allTiers: 'جميع المستويات',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
      expert: 'خبير',
      statusLabel: 'الحالة',
      allStatuses: 'جميع الحالات',
      notStarted: 'لم يبدأ',
      inProgress: 'قيد التقدم',
      completed: 'مكتمل',
      sourceLabel: 'المصدر',
      allLessons: 'جميع الدروس',
      activePrefix: 'النشط',
      aiGenerated: 'مولّد بالذكاء الاصطناعي',
      builtInOffline: 'مدمج (دون اتصال)',
      resetFilters: 'إعادة ضبط الفلاتر',
      loadingLessons: 'جارٍ تحميل الدروس…',
      loadError: 'تعذّر تحميل الدروس. أعد تحميل الصفحة للمحاولة مجدداً.',
      emptyTitle: 'لم يتم العثور على دروس مطابقة',
      emptyDescription: 'جرّب تعديل كلمات البحث أو تخفيف شروط التصفية.',
      clearAllFilters: 'مسح جميع الفلاتر',
      showing: 'عرض',
      lessonSingular: 'درس',
      lessonPlural: 'دروس',
      builtInLessonsHeading: 'الدروس المدمجة',
      builtInBadge: 'مدمج',
      minUnit: 'دقيقة',
      complete: 'مكتمل',
      inProgressPrefix: 'قيد التقدم:',
      checksSuffix: 'تحققات',
      notStartedCard: 'لم يبدأ',
      jumpCards: 'البطاقات',
      jumpQuiz: 'الاختبار',
      jumpRoadmap: 'الخارطة',
      allLessonsBack: '← جميع الدروس',
      sectionPrefix: 'القسم',
      planningLesson: 'جارٍ تخطيط الدرس…',
      writingBlockPrefix: 'جارٍ كتابة الجزء',
      errorWritingPrefix: 'تعذّر كتابة الدرس:',
      backToRoadmap: 'العودة إلى خارطة التعلم',
      toTryAgain: 'للمحاولة مرة أخرى.',
      writingCancelled: 'تم إلغاء كتابة الدرس.',
      skippedBlockSingular:
        'تم تخطي جزء واحد لأن نسخة الذكاء الاصطناعي لم تجتز فحوصات الجودة.',
      skippedBlockPlural:
        'أجزاء تم تخطيها لأن نسخة الذكاء الاصطناعي لم تجتز فحوصات الجودة.',
      tryBlockAgain: 'إعادة محاولة هذا الجزء',
      loadingLesson: 'جارٍ تحميل الدرس…',
      noLessonAtAddress: 'لا يوجد درس في هذا العنوان.',
      practiceTag: 'التدريب والتعزيز',
      continueMastering: 'واصل إتقان',
      nextStepsDesc:
        'اختبر تذكرك عبر البطاقات التعليمية وتحقق من فهمك المفاهيمي من خلال أسئلة الاختبار المخصصة لهذا القسم.',
      practiceFlashcardsBtn: '🃏 التدرب على البطاقات',
      takeDiagnosticQuizBtn: '🎯 خوض الاختبار التشخيصي',
      backToRoadmapCardBtn: '🗺️ العودة إلى بطاقة الخارطة',
    },
    flashcards: {
      filterByTierLabel: 'تصفية البطاقات حسب المستوى',
      allTiers: 'جميع المستويات',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      expert: 'خبير',
      allSections: 'جميع الأقسام',
      cardsUnit: 'بطاقات',
      filterBySectionPlaceholder: 'تصفية حسب القسم...',
      filterCardsPlaceholder: 'ابحث في البطاقات...',
      addCard: '+ إضافة بطاقة',
      exportAnki: 'تصدير Anki',
      sectionPrefix: 'القسم',
      openLesson: '📖 فتح الدرس',
      takeQuiz: '🎯 بدء الاختبار',
      roadmap: '🗺️ الخارطة',
      cardWord: 'بطاقة',
      of: 'من',
      bookmarked: '★ محفوظة',
      bookmark: '☆ حفظ',
      promptLabel: 'السؤال',
      hint: 'تلميح',
      flipToReveal: 'اضغط المسافة أو انقر لإظهار الإجابة',
      explanationLabel: 'الشرح التفصيلي',
      deepDive: 'شرح معمّق ومخطط',
      verifiedCodeTitle: 'مثال برمجي موثق',
      interactiveSnippet: 'مقطع تفاعلي',
      groundedCitation: 'المرجع الموثق:',
      flipBackHint: 'انقر أو اضغط المسافة للعودة إلى السؤال 🔄',
      previous: '← السابق',
      next: 'التالي →',
      selfAssessment: 'التقييم الذاتي:',
      again: 'مجدداً',
      hard: 'صعب',
      good: 'جيد',
      easy: 'سهل',
      emptyTitle: 'لا توجد بطاقات تذكر متاحة',
      emptyDescription:
        'قم بتوليد بطاقات تذكر لأي قسم في تبويب خارطة التعلم، أو أضف بطاقات يدوياً.',
      emptyAction: 'الانتقال إلى الخارطة',
    },
    quiz: {
      filterByTierLabel: 'تصفية أسئلة الاختبار حسب المستوى',
      allTiers: 'جميع المستويات',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      expert: 'خبير',
      allSections: 'جميع الأقسام',
      questionsUnit: 'أسئلة',
      filterBySectionPlaceholder: 'تصفية حسب القسم...',
      addQuestion: '+ إضافة سؤال',
      importJson: '📥 استيراد JSON',
      sectionPrefix: 'القسم',
      openLesson: '📖 فتح الدرس',
      flashcards: '🃏 البطاقات',
      roadmap: '🗺️ الخارطة',
      questionWord: 'السؤال',
      of: 'من',
      scoreLabel: 'النتيجة:',
      needHint: 'هل تحتاج تلميحاً؟',
      codeUnderEvaluation: 'الكود قيد التحليل',
      analyzeSnippetHint: 'حلّل المقطع البرمجي لتحديد النتيجة',
      correctBadge: '✓ إجابة صحيحة',
      incorrectBadge: '✕ إجابة خاطئة',
      correctAssessment: '✓ تقييم صحيح',
      misconception: '✕ التباس في فهم المواصفات',
      deepDive: 'شرح معمّق ومخطط',
      groundedReference: 'المرجع الموثق:',
      previous: '← السابق',
      nextQuestion: 'السؤال التالي →',
      resetTest: 'إعادة ضبط الاختبار',
      submitSession: 'إرسال الجلسة',
      emptyTitle: 'لا توجد أسئلة اختبار متاحة',
      emptyDescription:
        'قم بتوليد اختبارات تشخيصية لأي قسم من تبويب خارطة التعلم، أو أضف الأسئلة يدوياً.',
      emptyAction: 'الانتقال إلى الخارطة',
    },
    sources: {
      eyebrow: 'قاعدة المعرفة للمادة',
      sourcesGrounded: 'مصادر موثقة',
      totalWords: 'إجمالي الكلمات',
      subtitle:
        'اربط جميع البطاقات والاختبارات والملخصات مباشرة بهذه المراجع. يمكنك إضافة أو تعديل المصادر في أي وقت وإعادة التوليد.',
      addSourceDoc: 'إضافة وثيقة مصدرية',
      synthesizingAi: '⚡ جارٍ التوليف بالذكاء الاصطناعي...',
      resynthesizeSubject: '✨ إعادة توليف المادة',
      synthesisFailedPrefix: 'فشل التوليف:',
      synthesisFailedSuffix:
        'لم تتغير بيانات المادة؛ حاول مجدداً عندما يكون محرك n8n متصلاً.',
      emptyTitle: 'لم تتم إضافة مصادر لهذه المادة بعد',
      emptyDescription:
        'أضف وثائق أو ملاحظات عروض تقديمية أو روابط توثيق رسمية للبدء في توليد مواد دراسية موثقة.',
      addFirstSource: '+ إضافة أول مصدر',
      wordsUnit: 'كلمة',
      readDocument: 'قراءة الوثيقة',
      edit: '✏️ تعديل',
      editModalTitle: 'تعديل المصدر المعرفي',
      addModalTitle: 'إضافة مصدر معرفي',
      modalEyebrow: 'خط أنابيب الاستيعاب',
      sourceTypeLabel: 'نوع المصدر',
      typeDocument: '📄 وثيقة / نص',
      typeSlide: '📑 عرض تقديمي',
      typeLink: '🔗 رابط توثيق ويب',
      typeNote: '📝 ملاحظة شخصية',
      sourceTitleLabel: 'عنوان المصدر / اسم المرجع *',
      sourceTitlePlaceholder:
        'مثال: ورقة خوارزمية Raft، أو معمارية Angular بدون Zone',
      sourceUrlLabel: 'رابط المرجع (اختياري)',
      sourceContentLabel: 'المحتوى / الشرائح / الملاحظات / النص المستخرج *',
      sourceContentPlaceholder:
        'الصق النص الكامل أو Markdown أو ملخص الشرائح لتأسيس توليد الذكاء الاصطناعي...',
      cancel: 'إلغاء',
      updateSource: 'تحديث المصدر',
      addToSources: 'إضافة إلى مصادر StudyLM',
      externalReference: 'مرجع خارجي:',
      doneReading: 'إنهاء القراءة',
    },
    stats: {
      eyebrow: 'تحليلات التعلم ومحرك الاستبقاء المعرفي',
      title: 'لوحة إتقان الدراسة والتقدم',
      subtitle:
        'عبر جميع موادك الدراسية: تقدم خارطة التعلم، مستوى إتقان البطاقات، ودقة إجاباتك في الاختبارات.',
      trackedSubjects: 'المواد المتتبعة',
      trackedSubjectsHint: 'مسارات التعلم النشطة',
      overallSynthesis: 'التوليف الكلي',
      of: 'من',
      sectionsReady: 'أقسام جاهزة',
      cardMastery: 'إتقان البطاقات',
      cardMasteryHint: 'تم تقييمها جيد أو سهل 3+ مرات',
      diagnosticAccuracy: 'الدقة التشخيصية',
      correct: 'صحيحة',
      breakdownTitle: 'التفصيل حسب المادة',
      subjectsUnit: 'مواد',
      activeTrack: 'المسار النشط',
      roadmapBtn: '🗺️ الخارطة',
      cardsBtn: '🃏 البطاقات',
      quizBtn: '🎯 الاختبار',
      curriculumSynthesis: 'توليف المنهاج',
      sectionsUnit: 'أقسام',
      flashcardDeck: 'حزمة البطاقات',
      mastered: 'متقنة',
      quizAccuracy: 'دقة الاختبار',
      answered: 'مجاب عنها',
      sourcesAttached: 'المصادر المرفقة',
      groundedIngests: 'مدخلات موثقة',
    },
    modals: {
      n8nTitle: 'إعدادات محرك التوليف n8n',
      n8nEyebrow: 'تهيئة البنية التحتية للمحرك',
      currentConnection: 'الاتصال الحالي:',
      routingMode: 'وضع التوجيه',
      modeTunnel: 'نفق سحابي (ngrok)',
      modeLocal: 'محلي (Docker)',
      modeCustom: 'Webhook مخصص',
      tunnelUrlLabel: 'رابط نفق ngrok / السحابي *',
      localUrlLabel: 'رابط Webhook المحلي (Docker) *',
      customUrlLabel: 'رابط Webhook المخصص *',
      cancel: 'إلغاء',
      pinging: 'جارٍ الفحص...',
      testConnection: 'اختبار الاتصال',
      saveSettings: 'حفظ الإعدادات',
      createSubjectTitle: 'مادة جديدة في هندسة البرمجيات',
      createSubjectEyebrow: 'تفكيك تربوي للمنهاج الدراسي',
      guardrailTitle: 'ضوابط هندسة البرمجيات',
      guardrailDesc:
        'تمت معايرة StudyLM خصيصاً لمفاهيم هندسة البرمجيات وعلوم الحاسوب وهندسة الأنظمة (مثل تفاصيل JavaScript V8 ومعماريات React/Angular والإجماع الموزع وPostgreSQL MVCC).',
      domainLabel: 'مجال هندسة البرمجيات *',
      subjectNameLabel: 'اسم المادة / المفهوم *',
      subjectNamePlaceholder:
        'مثال: خبايا JavaScript ومحرك V8، الإجماع الموزع (Raft)، فهرسة PostgreSQL',
      focusNotesLabel: 'ملاحظات التركيز والقيود (اختياري)',
      focusNotesPlaceholder:
        'مثال: التركيز بعمق على تخطيط الذاكرة، جامع المهملات، المهام الدقيقة في حلقة الأحداث.',
      suggestedLabel: 'أو اختر مساراً دراسياً قياسياً:',
      createBlank: 'إنشاء فارغ',
      createAndGenerate: 'إنشاء وتوليد الخارطة',
    },
  },
  it: {
    tagline: 'Motore pedagogico di studio e allenamento continuo',
    selectSubject: 'Seleziona materia...',
    newSubject: 'Nuova materia',
    deleteSubject: 'Elimina',
    n8nEngine: 'Motore n8n',
    checking: 'Verifica in corso…',
    online: 'Online',
    offline: 'Offline',
    exportGuide: 'Esporta guida',
    metrics: {
      roadmap: 'Sezioni della roadmap',
      roadmapHint: 'Capitoli e moduli',
      progress: 'Progresso di sintesi',
      progressHint: 'Padronanza del programma',
      cardsDue: 'Carte da ripassare',
      cardsDueHint: 'Coda di ripetizione spaziata',
      quizAccuracy: 'Precisione quiz',
      quizAccuracyHint: 'Tasso di memorizzazione',
    },
    screens: {
      roadmap: 'Roadmap',
      learn: 'Lezioni',
      flashcards: 'Flashcard',
      quiz: 'Quiz',
      sources: 'Fonti e riferimenti',
      stats: 'Statistiche',
    },
    shell: {
      engineBadge: 'Motore',
      flashcardBank: 'Banca Flashcard',
      mastered: 'Padroneggiate',
      ready: 'Pronte',
      correct: 'Corrette',
      of: 'di',
    },
    roadmap: {
      defaultTitle: 'Roadmap Tecnica',
      sections: 'Sezioni',
      sectionsLower: 'sezioni',
      groundingPortal: 'Portale di riferimento:',
      defaultDescription:
        'Scomponi questo concetto di ingegneria del software in capitoli progressivi, sezioni atomiche e riferimenti ufficiali.',
      generatingRoadmap: 'Generazione roadmap...',
      resynthesizeRoadmap: 'Risintetizza Roadmap',
      generateRoadmap: 'Genera Roadmap',
      approveAllSections: 'Approva tutte le sezioni',
      generatingLessons: 'Generazione lezioni',
      bulkGenerateLessons: 'Genera lezioni in blocco',
      bulkBannerTitle: '⚡ Generazione massiva di lezioni',
      cancel: 'Annulla',
      batch: 'Lotto',
      of: 'di',
      aiPausedTitle: 'Le funzioni IA sono in pausa',
      aiPausedHintPrefix: 'Le',
      builtInLessonsLink: 'lezioni integrate',
      aiPausedHintSuffix: 'funzionano senza connessione.',
      roadmapErrorTitle: 'L’IA non è riuscita a creare la roadmap',
      roadmapErrorHintPrefix:
        'Nessuna modifica effettuata. Riprova tra poco oppure apri le',
      roadmapErrorHintSuffix: ', che funzionano offline.',
      tryAgain: 'Riprova',
      topicRequiredTitle: 'Richiesto argomento di Ingegneria del Software',
      topicRequiredHint:
        'StudyLM utilizza motori tecnici fondati su specifiche ufficiali di ingegneria del software (es. JavaScript V8, Angular Signals, PostgreSQL MVCC, Sistemi Distribuiti). Seleziona un argomento valido.',
      synthesisProgressTitle: 'Progresso di sintesi del programma',
      sectionsReady: 'Sezioni pronte',
      collapseAllSections: 'Comprimi tutte le sezioni',
      expandAllSections: 'Espandi tutte le sezioni',
      approved: 'Approvata',
      pendingReview: 'In revisione',
      cardsLower: 'carte',
      quizLower: 'quiz',
      subtopicsLabel: 'Sotto-argomenti:',
      officialGroundingLabel: 'Fonti ufficiali:',
      approveSection: 'Approva sezione',
      generatingCards: 'Generazione carte...',
      regenerateFlashcards: 'Rigenera Flashcard',
      retryFlashcards: 'Riprova Flashcard',
      generateFlashcards: 'Genera Flashcard',
      generatingQuiz: 'Generazione quiz...',
      regenerateQuiz: 'Rigenera Quiz',
      retryQuiz: 'Riprova Quiz',
      generateQuiz: 'Genera Quiz',
      writingLesson: 'Scrittura lezione…',
      openLesson: 'Apri lezione',
      rewriteLesson: 'Riscrivi lezione',
      writeLesson: 'Scrivi una lezione',
      studyCards: 'Studia carte',
      takeQuiz: 'Fai il quiz',
      emptyTitle: 'Nessuna roadmap presente',
      emptyDescription:
        'StudyLM usa motori IA multi-modello basati su specifiche ufficiali per suddividere i concetti di ingegneria del software in capitoli strutturati e sezioni atomiche.',
      emptyAction: 'Genera Roadmap Tecnica',
    },
    learn: {
      heading: 'Lezioni',
      description:
        'Ogni lezione spiega un concetto passo dopo passo con schemi visivi e ti chiede di prevedere, spiegare e fare pratica. Scrivi una lezione da qualsiasi sezione della Roadmap; quelle integrate funzionano offline.',
      bulkTitle: 'Generazione massiva di lezioni',
      bulkPill: 'Lotti da 2 • Riprova auto',
      bulkGeneratingSubtitle:
        'Generazione lezioni in lotti concorrenti con tentativi automatici...',
      bulkReadyPrefix: 'sezioni in',
      bulkReadySuffix: 'pronte da generare.',
      bulkAllDonePrefix: 'Tutte le sezioni della roadmap in',
      bulkAllDoneSuffix: 'hanno una lezione!',
      cancel: 'Annulla',
      bulkGenerateBtn: 'Genera in blocco',
      batch: 'Lotto',
      of: 'di',
      retryAttempts: 'tentativi di ripristino',
      failedToWritePrefix: 'Impossibile generare',
      failedToWriteSuffix: 'lezioni:',
      attempts: 'tentativi',
      searchPlaceholder: 'Cerca lezioni per titolo, argomento o obiettivo...',
      tierLabel: 'Livello',
      allTiers: 'Tutti i livelli',
      beginner: 'Base',
      intermediate: 'Intermedio',
      advanced: 'Avanzato',
      expert: 'Esperto',
      statusLabel: 'Stato',
      allStatuses: 'Tutti gli stati',
      notStarted: 'Non iniziata',
      inProgress: 'In corso',
      completed: 'Completata',
      sourceLabel: 'Origine',
      allLessons: 'Tutte le lezioni',
      activePrefix: 'Attiva',
      aiGenerated: 'Generata da IA',
      builtInOffline: 'Integrata (Offline)',
      resetFilters: 'Reimposta filtri',
      loadingLessons: 'Caricamento lezioni…',
      loadError:
        'Impossibile caricare le lezioni. Ricarica la pagina per riprovare.',
      emptyTitle: 'Nessuna lezione trovata',
      emptyDescription:
        'Prova a modificare i termini di ricerca o i filtri selezionati.',
      clearAllFilters: 'Cancella tutti i filtri',
      showing: 'Visualizzate',
      lessonSingular: 'lezione',
      lessonPlural: 'lezioni',
      builtInLessonsHeading: 'Lezioni integrate',
      builtInBadge: 'Integrata',
      minUnit: 'min',
      complete: 'Completata',
      inProgressPrefix: 'In corso:',
      checksSuffix: 'verifiche',
      notStartedCard: 'Non iniziata',
      jumpCards: 'Carte',
      jumpQuiz: 'Quiz',
      jumpRoadmap: 'Roadmap',
      allLessonsBack: '← Tutte le lezioni',
      sectionPrefix: 'Sezione',
      planningLesson: 'Pianificazione della lezione…',
      writingBlockPrefix: 'Scrittura blocco',
      errorWritingPrefix: 'Impossibile scrivere la lezione:',
      backToRoadmap: 'Torna alla roadmap',
      toTryAgain: 'per riprovare.',
      writingCancelled: 'Scrittura annullata.',
      skippedBlockSingular:
        'blocco è stato omesso: la versione IA non ha superato le verifiche.',
      skippedBlockPlural:
        'blocchi sono stati omessi: la versione IA non ha superato le verifiche.',
      tryBlockAgain: 'Riprova questo blocco',
      loadingLesson: 'Caricamento della lezione…',
      noLessonAtAddress: 'Nessuna lezione a questo indirizzo.',
      practiceTag: 'Pratica e consolida',
      continueMastering: 'Continua a padroneggiare',
      nextStepsDesc:
        'Metti alla prova la memoria con le flashcard e verifica la comprensione concettuale con i quiz dedicati a questa sezione.',
      practiceFlashcardsBtn: '🃏 Pratica Flashcard',
      takeDiagnosticQuizBtn: '🎯 Fai il Quiz Diagnostico',
      backToRoadmapCardBtn: '🗺️ Torna alla scheda Roadmap',
    },
    flashcards: {
      filterByTierLabel: 'Filtra Flashcard per livello',
      allTiers: 'Tutti i livelli',
      beginner: 'Base',
      intermediate: 'Intermedio',
      expert: 'Esperto',
      allSections: 'Tutte le sezioni',
      cardsUnit: 'carte',
      filterBySectionPlaceholder: 'Filtra per sezione...',
      filterCardsPlaceholder: 'Filtra carte...',
      addCard: '+ Aggiungi carta',
      exportAnki: 'Esporta Anki',
      sectionPrefix: 'Sezione',
      openLesson: '📖 Apri lezione',
      takeQuiz: '🎯 Fai il quiz',
      roadmap: '🗺️ Roadmap',
      cardWord: 'Carta',
      of: 'di',
      bookmarked: '★ Salvata',
      bookmark: '☆ Salva',
      promptLabel: 'DOMANDA',
      hint: 'Suggerimento',
      flipToReveal: 'Premi Spazio o clicca per rivelare la risposta',
      explanationLabel: 'SPIEGAZIONE',
      deepDive: 'Approfondimento e diagramma',
      verifiedCodeTitle: 'Esempio di codice verificato',
      interactiveSnippet: 'Snippet interattivo',
      groundedCitation: 'Fonte ufficiale:',
      flipBackHint: 'Clicca o premi Spazio per tornare alla domanda 🔄',
      previous: '← Precedente',
      next: 'Successiva →',
      selfAssessment: 'Autovalutazione:',
      again: 'Ancora',
      hard: 'Difficile',
      good: 'Bene',
      easy: 'Facile',
      emptyTitle: 'Nessuna Flashcard disponibile',
      emptyDescription:
        'Genera flashcard per qualsiasi sezione nella scheda Roadmap, oppure aggiungile manualmente.',
      emptyAction: 'Vai alla Roadmap',
    },
    quiz: {
      filterByTierLabel: 'Filtra domande del quiz per livello',
      allTiers: 'Tutti i livelli',
      beginner: 'Base',
      intermediate: 'Intermedio',
      expert: 'Esperto',
      allSections: 'Tutte le sezioni',
      questionsUnit: 'domande',
      filterBySectionPlaceholder: 'Filtra per sezione...',
      addQuestion: '+ Aggiungi domanda',
      importJson: '📥 Importa JSON',
      sectionPrefix: 'Sezione',
      openLesson: '📖 Apri lezione',
      flashcards: '🃏 Flashcard',
      roadmap: '🗺️ Roadmap',
      questionWord: 'Domanda',
      of: 'di',
      scoreLabel: 'Punteggio:',
      needHint: 'Serve un suggerimento?',
      codeUnderEvaluation: 'Codice in esame',
      analyzeSnippetHint: 'Analizza il codice per determinare il risultato',
      correctBadge: '✓ Corretto',
      incorrectBadge: '✕ Errato',
      correctAssessment: '✓ Valutazione corretta',
      misconception: '✕ Misconcezione della specifica',
      deepDive: 'Approfondimento e diagramma',
      groundedReference: 'Riferimento ufficiale:',
      previous: '← Precedente',
      nextQuestion: 'Domanda successiva →',
      resetTest: 'Ripristina test',
      submitSession: 'Invia sessione',
      emptyTitle: 'Nessuna domanda disponibile',
      emptyDescription:
        'Genera quiz diagnostici per qualsiasi sezione nella scheda Roadmap, oppure aggiungi domande manualmente.',
      emptyAction: 'Vai alla Roadmap',
    },
    sources: {
      eyebrow: 'Base di conoscenza della materia',
      sourcesGrounded: 'Fonti collegate',
      totalWords: 'Parole totali',
      subtitle:
        'Basa flashcard, quiz e note di sintesi direttamente su questi materiali. Puoi modificare o aggiungere fonti in qualsiasi momento e risintetizzare.',
      addSourceDoc: 'Aggiungi documento fonte',
      synthesizingAi: '⚡ Sintesi con IA in corso...',
      resynthesizeSubject: '✨ Risintetizza materia',
      synthesisFailedPrefix: 'Sintesi non riuscita:',
      synthesisFailedSuffix:
        'La materia non è stata modificata; riprova quando n8n è raggiungibile.',
      emptyTitle: 'Nessuna fonte aggiunta per questa materia',
      emptyDescription:
        'Aggiungi documenti, note di slide o link alla documentazione per iniziare a generare materiali di studio verificati.',
      addFirstSource: '+ Aggiungi prima fonte',
      wordsUnit: 'parole',
      readDocument: 'Leggi documento',
      edit: '✏️ Modifica',
      editModalTitle: 'Modifica fonte di conoscenza',
      addModalTitle: 'Aggiungi fonte di conoscenza',
      modalEyebrow: 'Pipeline di acquisizione',
      sourceTypeLabel: 'Tipo di fonte',
      typeDocument: '📄 Documento / Testo',
      typeSlide: '📑 Presentazione / Slide',
      typeLink: '🔗 Link documentazione web',
      typeNote: '📝 Nota personale',
      sourceTitleLabel: 'Titolo della fonte / Nome di riferimento *',
      sourceTitlePlaceholder:
        'es. Paper consenso Raft, o Architettura Angular Zoneless',
      sourceUrlLabel: 'URL di riferimento (Opzionale)',
      sourceContentLabel: 'Contenuto / Slide / Note / Testo estratto *',
      sourceContentPlaceholder:
        'Incolla il testo completo, markdown o riassunto per fondare la generazione IA...',
      cancel: 'Annulla',
      updateSource: 'Aggiorna fonte',
      addToSources: 'Aggiungi alle fonti StudyLM',
      externalReference: 'Riferimento esterno:',
      doneReading: 'Chiudi lettura',
    },
    stats: {
      eyebrow: 'Analisi dell’apprendimento e motore di ritenzione',
      title: 'Dashboard padronanza e progressi di studio',
      subtitle:
        'In tutte le tue materie: avanzamento della roadmap, padronanza delle flashcard e precisione nei quiz.',
      trackedSubjects: 'Materie seguite',
      trackedSubjectsHint: 'Percorsi di studio attivi',
      overallSynthesis: 'Sintesi complessiva',
      of: 'di',
      sectionsReady: 'Sezioni pronte',
      cardMastery: 'Padronanza carte',
      cardMasteryHint: 'Valutate bene o facile 3+ volte',
      diagnosticAccuracy: 'Precisione diagnostica',
      correct: 'Corrette',
      breakdownTitle: 'Dettaglio per materia',
      subjectsUnit: 'Materie',
      activeTrack: 'Percorso attivo',
      roadmapBtn: '🗺️ Roadmap',
      cardsBtn: '🃏 Carte',
      quizBtn: '🎯 Quiz',
      curriculumSynthesis: 'Sintesi del programma',
      sectionsUnit: 'Sezioni',
      flashcardDeck: 'Mazzo Flashcard',
      mastered: 'Padroneggiate',
      quizAccuracy: 'Precisione Quiz',
      answered: 'Risposte date',
      sourcesAttached: 'Fonti allegate',
      groundedIngests: 'Fonti acquisite',
    },
    modals: {
      n8nTitle: 'Impostazioni motore di sintesi n8n',
      n8nEyebrow: 'Configurazione infrastruttura motore',
      currentConnection: 'Connessione attuale:',
      routingMode: 'Modalità di routing',
      modeTunnel: 'Cloud Tunnel (ngrok)',
      modeLocal: 'Localhost (Docker)',
      modeCustom: 'Webhook personalizzato',
      tunnelUrlLabel: 'URL Cloud Tunnel / ngrok *',
      localUrlLabel: 'Webhook Docker Localhost *',
      customUrlLabel: 'URL Webhook personalizzato *',
      cancel: 'Annulla',
      pinging: 'Ping in corso...',
      testConnection: 'Testa connessione',
      saveSettings: 'Salva impostazioni',
      createSubjectTitle: 'Nuova materia di Ingegneria del Software',
      createSubjectEyebrow: 'Decostruzione pedagogica del programma',
      guardrailTitle: 'Guardrail Ingegneria del Software',
      guardrailDesc:
        'StudyLM è calibrato rigorosamente per concetti di Ingegneria del Software, Informatica e Architettura dei Sistemi (es. JavaScript internals, architetture React/Angular, Consenso Distribuito, PostgreSQL MVCC).',
      domainLabel: 'Dominio Ingegneria del Software *',
      subjectNameLabel: 'Nome materia / concetto *',
      subjectNamePlaceholder:
        'es. Internals JavaScript & V8, Consenso Distribuito (Raft), Indicizzazione PostgreSQL',
      focusNotesLabel: 'Note di focus e vincoli (Opzionale)',
      focusNotesPlaceholder:
        'es. Approfondire layout di memoria, garbage collection, microtask dell’event loop e casi limite.',
      suggestedLabel: 'Oppure scegli un percorso standard:',
      createBlank: 'Crea vuota',
      createAndGenerate: 'Crea e genera Roadmap',
    },
  },
  de: {
    tagline: 'Pädagogische Lehrplan- & Übungs-Engine',
    selectSubject: 'Fach auswählen...',
    newSubject: 'Neues Fach',
    deleteSubject: 'Löschen',
    n8nEngine: 'n8n-Engine',
    checking: 'Wird geprüft…',
    online: 'Online',
    offline: 'Offline',
    exportGuide: 'Leitfaden exportieren',
    metrics: {
      roadmap: 'Lehrplan-Abschnitte',
      roadmapHint: 'Kapitel & Module',
      progress: 'Lernfortschritt',
      progressHint: 'Beherrschung des Curriculums',
      cardsDue: 'Fällige Karteikarten',
      cardsDueHint: 'Spaced-Repetition-Warteschlange',
      quizAccuracy: 'Quiz-Genauigkeit',
      quizAccuracyHint: 'Gemessene Wissensretention',
    },
    screens: {
      roadmap: 'Lehrplan',
      learn: 'Lektionen',
      flashcards: 'Karteikarten',
      quiz: 'Quiz',
      sources: 'Referenzen & Quellen',
      stats: 'Fortschritt',
    },
    shell: {
      engineBadge: 'Engine',
      flashcardBank: 'Karteikarten-Bank',
      mastered: 'Gemeistert',
      ready: 'Bereit',
      correct: 'Richtig',
      of: 'von',
    },
    roadmap: {
      defaultTitle: 'Technischer Lehrplan',
      sections: 'Abschnitte',
      sectionsLower: 'Abschnitte',
      groundingPortal: 'Referenzportal:',
      defaultDescription:
        'Zerlegen Sie dieses Software-Engineering-Konzept in aufeinander aufbauende Kapitel, atomare Abschnitte und offizielle Dokumentationsreferenzen.',
      generatingRoadmap: 'Lehrplan wird erstellt...',
      resynthesizeRoadmap: 'Lehrplan neu generieren',
      generateRoadmap: 'Lehrplan generieren',
      approveAllSections: 'Alle Abschnitte freigeben',
      generatingLessons: 'Lektionen werden erstellt',
      bulkGenerateLessons: 'Lektionen gesammelt erstellen',
      bulkBannerTitle: '⚡ Stapel-Erstellung von Lektionen',
      cancel: 'Abbrechen',
      batch: 'Stapel',
      of: 'von',
      aiPausedTitle: 'KI-Funktionen sind pausiert',
      aiPausedHintPrefix: 'Die',
      builtInLessonsLink: 'integrierten Lektionen',
      aiPausedHintSuffix: 'funktionieren auch ohne KI.',
      roadmapErrorTitle: 'Die KI konnte keinen Lehrplan erstellen',
      roadmapErrorHintPrefix:
        'Es wurde nichts geändert. Versuchen Sie es gleich erneut oder öffnen Sie die',
      roadmapErrorHintSuffix: ', die offline funktionieren.',
      tryAgain: 'Erneut versuchen',
      topicRequiredTitle: 'Software-Engineering-Thema erforderlich',
      topicRequiredHint:
        'StudyLM nutzt spezialisierte technische Engines auf Basis offizieller Software-Engineering-Spezifikationen (z. B. JavaScript V8, Angular Signals, PostgreSQL MVCC, Verteilte Systeme). Bitte wählen Sie ein gültiges Fachthema.',
      synthesisProgressTitle: 'Lehrplan-Synthesefortschritt',
      sectionsReady: 'Abschnitte bereit',
      collapseAllSections: 'Alle Abschnitte einklappen',
      expandAllSections: 'Alle Abschnitte ausklappen',
      approved: 'Freigegeben',
      pendingReview: 'Prüfung ausstehend',
      cardsLower: 'Karten',
      quizLower: 'Quiz',
      subtopicsLabel: 'Unterthemen:',
      officialGroundingLabel: 'Offizielle Quellen:',
      approveSection: 'Abschnitt freigeben',
      generatingCards: 'Karten werden erstellt...',
      regenerateFlashcards: 'Karteikarten neu erstellen',
      retryFlashcards: 'Karteikarten erneut versuchen',
      generateFlashcards: 'Karteikarten erstellen',
      generatingQuiz: 'Quiz wird erstellt...',
      regenerateQuiz: 'Quiz neu erstellen',
      retryQuiz: 'Quiz erneut versuchen',
      generateQuiz: 'Quiz erstellen',
      writingLesson: 'Lektion wird geschrieben…',
      openLesson: 'Lektion öffnen',
      rewriteLesson: 'Lektion neu schreiben',
      writeLesson: 'Lektion schreiben',
      studyCards: 'Karten lernen',
      takeQuiz: 'Quiz starten',
      emptyTitle: 'Noch kein Lehrplan vorhanden',
      emptyDescription:
        'StudyLM nutzt KI-Engines auf Basis offizieller Spezifikationen, um Software-Engineering-Konzepte in strukturierte Kapitel und atomare Abschnitte zu gliedern.',
      emptyAction: 'Technischen Lehrplan erstellen',
    },
    learn: {
      heading: 'Lektionen',
      description:
        'Jede Lektion erklärt ein Konzept Schritt für Schritt mit interaktiven Grafiken und lädt zum Vorhersagen, Erklären und Üben ein. Erstellen Sie Lektionen über den Lehrplan; integrierte Lektionen funktionieren offline.',
      bulkTitle: 'Stapel-Erstellung von Lektionen',
      bulkPill: '2er-Stapel • Auto-Retry',
      bulkGeneratingSubtitle:
        'Lektionen werden in parallelen Stapeln mit automatischer Wiederholung generiert...',
      bulkReadyPrefix: 'Abschnitt(e) in',
      bulkReadySuffix: 'bereit zur Generierung.',
      bulkAllDonePrefix: 'Alle Lehrplan-Abschnitte in',
      bulkAllDoneSuffix: 'haben bereits Lektionen!',
      cancel: 'Abbrechen',
      bulkGenerateBtn: 'Alle generieren',
      batch: 'Stapel',
      of: 'von',
      retryAttempts: 'Wiederholungsversuch(e)',
      failedToWritePrefix: 'Fehler beim Erstellen von',
      failedToWriteSuffix: 'Lektion(en):',
      attempts: 'Versuche',
      searchPlaceholder: 'Lektionen nach Titel, Thema oder Ziel durchsuchen...',
      tierLabel: 'Stufe',
      allTiers: 'Alle Stufen',
      beginner: 'Einsteiger',
      intermediate: 'Fortgeschritten',
      advanced: 'Anspruchsvoll',
      expert: 'Experte',
      statusLabel: 'Status',
      allStatuses: 'Alle Status',
      notStarted: 'Nicht begonnen',
      inProgress: 'In Bearbeitung',
      completed: 'Abgeschlossen',
      sourceLabel: 'Quelle',
      allLessons: 'Alle Lektionen',
      activePrefix: 'Aktiv',
      aiGenerated: 'KI-generiert',
      builtInOffline: 'Integriert (Offline)',
      resetFilters: 'Filter zurücksetzen',
      loadingLessons: 'Lektionen werden geladen…',
      loadError:
        'Die Lektionen konnten nicht geladen werden. Bitte Seite neu laden.',
      emptyTitle: 'Keine passenden Lektionen gefunden',
      emptyDescription:
        'Passen Sie Ihre Suchbegriffe an oder lockern Sie die Filterkriterien.',
      clearAllFilters: 'Alle Filter zurücksetzen',
      showing: 'Zeige',
      lessonSingular: 'Lektion',
      lessonPlural: 'Lektionen',
      builtInLessonsHeading: 'Integrierte Lektionen',
      builtInBadge: 'Integriert',
      minUnit: 'Min.',
      complete: 'Abgeschlossen',
      inProgressPrefix: 'In Bearbeitung:',
      checksSuffix: 'Checks',
      notStartedCard: 'Nicht begonnen',
      jumpCards: 'Karten',
      jumpQuiz: 'Quiz',
      jumpRoadmap: 'Lehrplan',
      allLessonsBack: '← Alle Lektionen',
      sectionPrefix: 'Abschnitt',
      planningLesson: 'Lektion wird geplant…',
      writingBlockPrefix: 'Schreibe Block',
      errorWritingPrefix: 'Die Lektion konnte nicht erstellt werden:',
      backToRoadmap: 'Zurück zum Lehrplan',
      toTryAgain: ', um es erneut zu versuchen.',
      writingCancelled: 'Erstellung wurde abgebrochen.',
      skippedBlockSingular:
        'Block wurde ausgelassen: Die KI-Version hat die Qualitätsprüfung nicht bestanden.',
      skippedBlockPlural:
        'Blöcke wurden ausgelassen: Die KI-Version hat die Qualitätsprüfung nicht bestanden.',
      tryBlockAgain: 'Diesen Block erneut versuchen',
      loadingLesson: 'Lektion wird geladen…',
      noLessonAtAddress: 'Unter dieser Adresse existiert keine Lektion.',
      practiceTag: 'Üben & Vertiefen',
      continueMastering: 'Weiter vertiefen:',
      nextStepsDesc:
        'Testen Sie Ihr Wissen mit Karteikarten und prüfen Sie Ihr Konzeptverständnis mit Quizfragen zu diesem Abschnitt.',
      practiceFlashcardsBtn: '🃏 Karteikarten üben',
      takeDiagnosticQuizBtn: '🎯 Diagnose-Quiz starten',
      backToRoadmapCardBtn: '🗺️ Zurück zum Lehrplan',
    },
    flashcards: {
      filterByTierLabel: 'Karteikarten nach Stufe filtern',
      allTiers: 'Alle Stufen',
      beginner: 'Einsteiger',
      intermediate: 'Fortgeschritten',
      expert: 'Experte',
      allSections: 'Alle Abschnitte',
      cardsUnit: 'Karten',
      filterBySectionPlaceholder: 'Nach Abschnitt filtern...',
      filterCardsPlaceholder: 'Karten filtern...',
      addCard: '+ Karte hinzufügen',
      exportAnki: 'Anki exportieren',
      sectionPrefix: 'Abschnitt',
      openLesson: '📖 Lektion öffnen',
      takeQuiz: '🎯 Quiz starten',
      roadmap: '🗺️ Lehrplan',
      cardWord: 'Karte',
      of: 'von',
      bookmarked: '★ Gemerkt',
      bookmark: '☆ Merken',
      promptLabel: 'FRAGE',
      hint: 'Hinweis',
      flipToReveal: 'Leertaste drücken oder klicken, um Antwort aufzudecken',
      explanationLabel: 'ERKLÄRUNG',
      deepDive: 'Deep Dive & Diagramm',
      verifiedCodeTitle: 'Verifiziertes Codebeispiel',
      interactiveSnippet: 'Interaktives Snippet',
      groundedCitation: 'Offizielle Quelle:',
      flipBackHint: 'Klicken oder Leertaste drücken, um zurückzudrehen 🔄',
      previous: '← Zurück',
      next: 'Weiter →',
      selfAssessment: 'Selbsteinschätzung:',
      again: 'Nochmal',
      hard: 'Schwer',
      good: 'Gut',
      easy: 'Einfach',
      emptyTitle: 'Keine Karteikarten verfügbar',
      emptyDescription:
        'Erstellen Sie Karteikarten für beliebige Abschnitte im Reiter Lehrplan oder fügen Sie manuell Karten hinzu.',
      emptyAction: 'Zum Lehrplan',
    },
    quiz: {
      filterByTierLabel: 'Quizfragen nach Stufe filtern',
      allTiers: 'Alle Stufen',
      beginner: 'Einsteiger',
      intermediate: 'Fortgeschritten',
      expert: 'Experte',
      allSections: 'Alle Abschnitte',
      questionsUnit: 'Fragen',
      filterBySectionPlaceholder: 'Nach Abschnitt filtern...',
      addQuestion: '+ Frage hinzufügen',
      importJson: '📥 JSON importieren',
      sectionPrefix: 'Abschnitt',
      openLesson: '📖 Lektion öffnen',
      flashcards: '🃏 Karteikarten',
      roadmap: '🗺️ Lehrplan',
      questionWord: 'Frage',
      of: 'von',
      scoreLabel: 'Punktestand:',
      needHint: 'Hinweis benötigt?',
      codeUnderEvaluation: 'Zu prüfender Code',
      analyzeSnippetHint:
        'Analysieren Sie das Code-Snippet, um das Ergebnis zu bestimmen',
      correctBadge: '✓ Richtig',
      incorrectBadge: '✕ Falsch',
      correctAssessment: '✓ Richtige Einschätzung',
      misconception: '✕ Spezifikations-Irrtum',
      deepDive: 'Deep Dive & Diagramm',
      groundedReference: 'Offizielle Referenz:',
      previous: '← Zurück',
      nextQuestion: 'Nächste Frage →',
      resetTest: 'Test zurücksetzen',
      submitSession: 'Sitzung abschließen',
      emptyTitle: 'Keine Quizfragen verfügbar',
      emptyDescription:
        'Erstellen Sie Diagnose-Quizze im Reiter Lehrplan oder fügen Sie Fragen manuell hinzu.',
      emptyAction: 'Zum Lehrplan',
    },
    sources: {
      eyebrow: 'Fach-Wissensdatenbank',
      sourcesGrounded: 'Verankerte Quellen',
      totalWords: 'Wörter insgesamt',
      subtitle:
        'Verankern Sie alle Karteikarten, Quizfragen und Zusammenfassungen direkt in diesen Materialien. Sie können Quellen jederzeit bearbeiten oder ergänzen.',
      addSourceDoc: 'Quelldokument hinzufügen',
      synthesizingAi: '⚡ KI-Synthese läuft...',
      resynthesizeSubject: '✨ Fach neu synthetisieren',
      synthesisFailedPrefix: 'Synthese fehlgeschlagen:',
      synthesisFailedSuffix:
        'Ihr Fach bleibt unverändert; versuchen Sie es erneut, sobald n8n erreichbar ist.',
      emptyTitle: 'Noch keine Quellen für dieses Fach hinzugefügt',
      emptyDescription:
        'Fügen Sie Dokumente, Foliennotizen oder Dokumentationslinks hinzu, um fundierte Lernmaterialien zu generieren.',
      addFirstSource: '+ Erste Quelle hinzufügen',
      wordsUnit: 'Wörter',
      readDocument: 'Dokument lesen',
      edit: '✏️ Bearbeiten',
      editModalTitle: 'Wissensquelle bearbeiten',
      addModalTitle: 'Wissensquelle hinzufügen',
      modalEyebrow: 'Ingestions-Pipeline',
      sourceTypeLabel: 'Quellentyp',
      typeDocument: '📄 Dokument / Text',
      typeSlide: '📑 Folienpräsentation',
      typeLink: '🔗 Web-Dokumentationslink',
      typeNote: '📝 Persönliche Notiz',
      sourceTitleLabel: 'Quellentitel / Referenzname *',
      sourceTitlePlaceholder:
        'z. B. Raft-Konsens-Paper oder Angular Zoneless Architektur',
      sourceUrlLabel: 'Referenz-URL (Optional)',
      sourceContentLabel: 'Inhalt / Folien / Notizen / Extrahierter Text *',
      sourceContentPlaceholder:
        'Volltext, Markdown oder Zusammenfassung einfügen, um die KI-Generierung zu fundieren...',
      cancel: 'Abbrechen',
      updateSource: 'Quelle aktualisieren',
      addToSources: 'Zu StudyLM-Quellen hinzufügen',
      externalReference: 'Externe Referenz:',
      doneReading: 'Lesen beenden',
    },
    stats: {
      eyebrow: 'Lernanalytik & Wissensretentions-Engine',
      title: 'Lernfortschritt & Mastery-Dashboard',
      subtitle:
        'Über alle Fächer hinweg: Lehrplanfortschritt, Karteikarten-Beherrschung und Quiz-Genauigkeit.',
      trackedSubjects: 'Verfolgte Fächer',
      trackedSubjectsHint: 'Aktive Lernpfade',
      overallSynthesis: 'Gesamtsynthese',
      of: 'von',
      sectionsReady: 'Abschnitte bereit',
      cardMastery: 'Karten-Beherrschung',
      cardMasteryHint: '3+ Mal mit Gut oder Einfach bewertet',
      diagnosticAccuracy: 'Diagnose-Genauigkeit',
      correct: 'Richtig',
      breakdownTitle: 'Aufschlüsselung nach Fach',
      subjectsUnit: 'Fächer',
      activeTrack: 'Aktiver Pfad',
      roadmapBtn: '🗺️ Lehrplan',
      cardsBtn: '🃏 Karten',
      quizBtn: '🎯 Quiz',
      curriculumSynthesis: 'Lehrplan-Synthese',
      sectionsUnit: 'Abschnitte',
      flashcardDeck: 'Karteikarten-Deck',
      mastered: 'Gemeistert',
      quizAccuracy: 'Quiz-Genauigkeit',
      answered: 'Beantwortet',
      sourcesAttached: 'Verknüpfte Quellen',
      groundedIngests: 'Verankerte Quellen',
    },
    modals: {
      n8nTitle: 'n8n-Synthese-Engine Einstellungen',
      n8nEyebrow: 'Engine-Infrastruktur-Konfiguration',
      currentConnection: 'Aktuelle Verbindung:',
      routingMode: 'Routing-Modus',
      modeTunnel: 'Cloud-Tunnel (ngrok)',
      modeLocal: 'Localhost (Docker)',
      modeCustom: 'Eigener Webhook',
      tunnelUrlLabel: 'ngrok / Cloud-Tunnel-URL *',
      localUrlLabel: 'Localhost Docker-Webhook *',
      customUrlLabel: 'Eigene Webhook-URL *',
      cancel: 'Abbrechen',
      pinging: 'Ping läuft...',
      testConnection: 'Verbindung testen',
      saveSettings: 'Einstellungen speichern',
      createSubjectTitle: 'Neues Software-Engineering-Fach',
      createSubjectEyebrow: 'Pädagogische Lehrplan-Dekomposition',
      guardrailTitle: 'Software-Engineering-Leitplanke',
      guardrailDesc:
        'StudyLM ist strikt auf Konzepte aus Software Engineering, Informatik und Systemarchitektur ausgelegt (z. B. JavaScript Internals, React/Angular-Architekturen, Verteilter Konsens, PostgreSQL MVCC).',
      domainLabel: 'Software-Engineering-Domäne *',
      subjectNameLabel: 'Fach- / Konzeptname *',
      subjectNamePlaceholder:
        'z. B. JavaScript Internals & V8, Verteilter Konsens (Raft), PostgreSQL-Indizierung',
      focusNotesLabel: 'Fokus-Notizen & Rahmenbedingungen (Optional)',
      focusNotesPlaceholder:
        'z. B. Fokus auf Speicherlayout, Garbage Collection, Event-Loop-Microtasks und Fallstricke.',
      suggestedLabel: 'Oder wählen Sie einen Standard-Lehrplan:',
      createBlank: 'Leer erstellen',
      createAndGenerate: 'Erstellen & Lehrplan generieren',
    },
  },
};
