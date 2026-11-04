import type { AlarmEngineDictionary } from './i18n.types';

export const enDictionary: AlarmEngineDictionary = {
  meta: {
    title: 'Nightly Alarm Decision Engine',
    tagline:
      'Your 60-second bedtime algorithm: log daily learning, auto-calculate D-3/D-7/D-14 spaced reviews, auto-detect consolidation milestones, and copy exact alarm titles into your phone Clock app.',
    badgeAlgorithm: 'Nightly Algorithm',
    badgeDarkMode: 'Dark & Light Mode',
    badgeSpacedRepetition: 'Spaced Repetition D-3 / D-7 / D-14',
  },
  actions: {
    jsonBackup: 'JSON Backup',
    resetChecklist: 'Reset Checklist',
    clearData: 'Clear All Data',
    loadDemoData: 'Load Sample Data',
    saveAndCommit: 'Save & Commit Nightly Ritual',
    copyAll: 'Copy All',
    copySlot: 'Copy',
    downloadIcs: 'Export .ics',
    quickRecall: 'Quick Recall',
    addChapter: 'New Chapter',
    editChapter: 'Edit Chapter',
    deleteChapter: 'Delete',
    toggleTheme: 'Toggle Theme',
    language: 'Language',
    viewAllTopics: 'All Topics',
    newTopic: '+ Topic / Syllabus',
    editTopic: 'Edit Topic',
  },
  stepsGuide: {
    step1Title: 'Review Today',
    step1Desc: "Log today's chapter, quiz score, and any coding carryover.",
    step2Title: 'Spaced Reviews',
    step2Desc:
      'Check off due flashcards. Unchecked reviews roll over automatically without stress.',
    step3Title: 'Copy Alarms',
    step3Desc:
      "1-Click copy tomorrow's generated titles directly into your recurring phone alarms.",
  },
  kpi: {
    tomorrowProtocol: 'Tomorrow Protocol',
    targetChapter: 'Target Chapter',
    nextStep: 'Next milestone step',
    activeWeakChapters: 'Active Weak Chapters',
    flaggedReinforce: 'flagged for reinforcement',
    milestoneConsolidation: 'Milestone Consolidation',
    chaptersLeft: 'Ch left',
    cycle6Ch: '6-chapter milestone cycle',
    topicFilter: 'Topic Scope',
  },
  nav: {
    decision: 'Nightly Decision',
    tracker: 'Study Tracker',
    guide: 'Mastery Guide & 1-Week Example',
    reference: '8 Phone Alarms Guide',
    decisionShort: 'Decision',
    trackerShort: 'Tracker',
    guideShort: 'Guide',
    referenceShort: 'Alarms',
  },
  collapse: {
    collapse: 'Collapse section',
    expand: 'Expand section',
    collapsedSummary: 'Click to expand this section',
  },
  notifications: {
    title: 'Alarm Push Notifications',
    subtitle:
      'Receive timely browser notifications matching your exact phone alarms (06:00, 08:15, 10:00, etc.)',
    enableBtn: 'Enable Notifications',
    disableBtn: 'Disable Notifications',
    testBtn: '🔔 Test Notification',
    statusGranted: 'Active & Scheduled',
    statusDenied: 'Blocked in Browser',
    statusDefault: 'Permission Needed',
    statusUnsupported: 'Unsupported Browser',
    nextAlarmAlert: 'Next alarm alert',
    testNotificationTitle: '⏰ Alarm Engine Alert Test',
    testNotificationBody:
      'Push alerts are working! You will be notified at your exact phone alarm times tomorrow.',
    permissionDeniedNotice:
      'Notifications are blocked in your browser settings. Please enable them for this site.',
    enabledNotice:
      'Push notifications enabled! Browser alerts will fire at your scheduled alarm times.',
    disabledNotice: 'Push notifications disabled.',
  },
  checklist: {
    title: 'Nightly Ritual Checklist',
    resetTooltip: 'Reset the 9-step nightly checklist to 0/9',
    step1: "1. Record today's completed chapter and original study date",
    step2: "2. Record today's quiz score and weak chapters",
    step3: '3. Check chapters due for D-3 flashcards',
    step4: '4. Check chapters due for D-7 quizzes',
    step5: '5. Check chapters due for D-14 oral recall',
    step6: "6. Determine tomorrow's day type",
    step7: '7. Check whether tomorrow is a consolidation day',
    step8: '8. Generate and update alarm titles',
    step9: '9. Verify all alarm times in phone Clock app',
  },
  questionnaire: {
    title: 'Bedtime Diagnostic',
    subtitle: "Answer 3 quick questions about today's performance",
    tonightDate: "Tonight's Date",
    defaultsToday: 'Defaults to current date',
    topic: 'Topic / Course',
    targetChapterNum: "Today's Target Chapter #",
    targetChapterTitle: 'Chapter Title / Subtopic',
    targetChapterTitlePlaceholder:
      'e.g. B-Trees & LSM-Trees, TCP Primitives...',
    highestCompletedPlusOne: 'Defaults to highest completed + 1',
    didYouFinish: "Did you finish today's chapter?",
    optFinished: 'Finished Chapter',
    optRepeat: 'Repeat Chapter',
    optConsolidation: 'Consolidation Done',
    optMissed: 'Missed Goals / Off Track',
    advancesNotice:
      "Advances tomorrow's target to the next chapter and schedules D-3, D-7, and D-14 spaced repetition.",
    repeatNotice:
      "Tomorrow's target remains on this chapter. Reinforces core mastery before moving forward.",
    consolidationNotice:
      'Marks current 6-chapter consolidation cycle complete, clears weak flags, and resumes new chapter intake.',
    missedNotice:
      "Adaptive protocol activated: pauses new chapter intake, de-escalates tomorrow's workload, and prevents task avalanches.",
    missedReasonLabel: 'What happened today?',
    missedReasonOffTrack: 'Off Track / Distracted (Standard Catch-up)',
    missedReasonOverwhelmed: 'Mental Fatigue / Cognitive Overload (Gentle)',
    missedReasonEmergency: 'Life Emergency / Illness (Recovery Day)',
    quizPerformance: 'Quiz Performance Today',
    strongPass: 'Strong Pass (>= 75%)',
    weakWarning: 'Weak Threshold (< 75% or >= 3 missed)',
    questionsMissed: 'Questions Missed',
    quizScore: 'Quiz Score (%)',
    codingProgress: 'Coding Progress Today',
    codingClean: 'Cleanly Completed',
    codingCarryover: 'Unfinished — Carry Over',
    spacedReviewsDue: 'Spaced Reviews Due Tonight',
    rolloverRuleTitle: 'Rollover Rule',
    rolloverRuleDesc:
      "If you leave a due review unchecked tonight, its original study date is NEVER altered; it automatically rolls forward into tomorrow's 06:00 alarm.",
    noReviewsDue: '🎉 No pending spaced reviews due for tonight!',
    errorNotesLabel: 'Weak Subtopics / Error Notes',
    errorNotesPlaceholder:
      'e.g. Async/await error handling, Pointer arithmetic...',
    errorNotesHint:
      "Injected directly into tomorrow's testing and refactoring alarm titles.",
    tomorrowDayType: "Tomorrow's Day Type Selector",
  },
  schedule: {
    title: "Tomorrow's Alarm Schedule",
    subtitle: 'Exact titles generated for your recurring phone alarms',
    oneMinuteSetupNotice:
      "Set up recurring alarms once in your native Clock app. Every night, copy-paste tomorrow's titles in under 60 seconds!",
    copiedToast: 'Copied to clipboard: ',
    allCopiedToast: 'All alarm titles copied to clipboard!',
  },
  tracker: {
    title: 'Study Tracker (Source of Truth)',
    subtitle:
      'Immutable study dates, spaced repetition schedules, and mastery metrics',
    emptyTitle: 'No Chapters Logged Yet',
    emptyDesc:
      'Start your learning journey clean! Complete tonight\'s bedtime ritual or click "New Chapter" to log your first chapter.',
    startFirstChapter: 'Log First Chapter',
    filterAll: 'All Chapters',
    filterWeak: 'Weak Only',
    filterDue: 'Due Reviews',
    filterCarryover: 'Coding Carryover',
    thChapter: 'Chapter',
    thTopic: 'Topic',
    thStudied: 'First Studied',
    thD3: 'D-3 (Flashcards)',
    thD7: 'D-7 (Quiz)',
    thD14: 'D-14 (Oral Recall)',
    thQuiz: 'Quiz Score',
    thStatus: 'Flags',
    thNotes: 'Error Notes',
    thActions: 'Actions',
    badgeDue: 'DUE',
    badgeDone: 'DONE ✓',
    badgePending: 'PENDING',
    badgeWeak: 'WEAK',
    badgeCarryover: 'CARRYOVER',
  },
  modal: {
    addChapterTitle: 'Add New Chapter',
    editChapterTitle: 'Edit Chapter',
    chapterNumber: 'Chapter Number',
    chapterTitle: 'Chapter Title',
    topic: 'Topic',
    studyDate: 'Original Study Date',
    autoFillNotice:
      '⚡ D-3 (+3d), D-7 (+7d), and D-14 (+14d) dates are automatically computed from your study date.',
    d3Label: 'D-3 Flashcards Date',
    d7Label: 'D-7 Quiz Date',
    d14Label: 'D-14 Oral Recall Date',
    quizScore: 'Quiz Score (%)',
    questionsMissed: 'Questions Missed',
    codingCarryover: 'Coding Carryover',
    errorNotes: 'Weak Subtopics / Error Notes',
    cancel: 'Cancel',
    save: 'Save Chapter',
    backupTitle: 'JSON Backup & Restore',
    backupDesc:
      'Copy your raw JSON backup or paste a previous backup to restore your exact study data.',
    copyJson: 'Copy Backup JSON',
    importJson: 'Import JSON',
    uploadFile: 'Upload Backup File (.json)',
  },
  tooltips: {
    d3Title: 'D-3 Flashcards Recall',
    d3Body:
      'First spaced repetition checkpoint (+3 days). Reviews high-density flashcards to halt the initial steep forgetting curve.',
    d3Formula: 'originalStudyDate + 3 days',
    d3Meaning: 'Stabilizes new memory traces before rapid decay occurs.',
    d7Title: 'D-7 Diagnostic Quiz',
    d7Body:
      'Second spaced repetition checkpoint (+7 days). Diagnostic testing to assess comprehension and identify weak subtopics.',
    d7Formula: 'originalStudyDate + 7 days',
    d7Meaning: 'Active retrieval practice produces durable neural encoding.',
    d14Title: 'D-14 Feynman Oral Recall',
    d14Body:
      'Third spaced repetition checkpoint (+14 days). Closed-book oral explanation to cement permanent long-term retention.',
    d14Formula: 'originalStudyDate + 14 days',
    d14Meaning: 'Validates complete conceptual mastery through teaching.',
    consolidationTitle: 'Consolidation Day Trigger',
    consolidationBody:
      'Automatically triggered after 6 completed chapters or upon accumulating 3+ weak chapters. Halts new intake to run mixed recall and coding challenges.',
    consolidationMeaning:
      'Eliminates illusion of competence and reinforces weak foundations.',
    rolloverTitle: 'Rollover Rule (Zero Penalty)',
    rolloverBody:
      "Unchecked reviews tonight roll forward into tomorrow's 06:00 alarm without altering their original study dates.",
    rolloverMeaning:
      'Prevents database corruption while keeping due tasks visible.',
    blindRecallTitle: 'Blind Recall Block',
    blindRecallBody:
      'Retrieval practice performed closed-book without notes or IDE autocompletion.',
    blindRecallMeaning:
      'Maximizes the testing effect for durable memory retention.',
    adaptiveTitle: 'Adaptive Reset (Zero Guilt)',
    adaptiveBody:
      "When daily goals are missed, the engine de-escalates tomorrow's workload, pauses new material, and eliminates task avalanches.",
    adaptiveMeaning: 'Sustained consistency beats rigid perfection.',
  },
  guide: {
    tabTitle: 'How to Use Efficiently (1-Week Blueprint)',
    heroTitle: 'The Repeatable Bedtime Algorithm',
    heroSubtitle:
      'Master any complex technical subject in under 60 seconds each night by bridging spaced repetition science directly into your phone’s native recurring alarms.',
    loadSimulationBtn: 'Load 1-Week Walkthrough into Tracker',
    simulationLoadedNotice:
      '1-Week Walkthrough loaded into your Study Tracker! Navigate to Study Tracker or Nightly Decision to explore.',
    philosophyTitle: '5 Core Principles for Maximum Efficiency',
    principle1Title: '1. Set Alarms Once in Your Phone (Never Create New Ones)',
    principle1Body:
      'Set up the 8 recurring alarms in your phone Clock app once (06:00, 08:15, 09:30/10:00, 15:15, 16:15, 17:00, 19:30). Every night before sleeping, this app generates the exact title strings. Simply copy-paste into the matching slot. Zero daily friction.',
    principle2Title: '2. The Ebbinghaus Spaced Triad (D-3, D-7, D-14)',
    principle2Body:
      '• D-3 Flashcards (+3d) halt the steepest initial forgetting curve.\n• D-7 Diagnostic Quiz (+7d) harnesses the testing effect to pinpoint gaps.\n• D-14 Feynman Oral Recall (+14d) cements permanent retention through closed-book explanation.',
    principle3Title: '3. Consolidation Milestones (No Illusion of Competence)',
    principle3Body:
      'Every 6 completed chapters OR whenever 3+ weak chapters accumulate, the engine halts new intake. The schedule shifts into 6-chapter mixed recall, practical cross-chapter challenges, and bug post-mortems.',
    principle4Title: '4. Zero-Guilt Adaptive Protocol (Maximum Flexibility)',
    principle4Body:
      'When emergencies, illness, or mental fatigue strike, never panic. Select "Missed Goals / Off Track" and the engine automatically de-escalates tomorrow\'s schedule, pausing new chapters to protect your momentum.',
    principle5Title: '5. The Rollover Rule (Zero Penalty)',
    principle5Body:
      "If a due review is left unchecked tonight, its original study date is NEVER altered. The engine automatically rolls it forward into tomorrow's 06:00 alarm title.",
    timelineTitle: 'A Real-World 1-Week Walkthrough (Monday to Sunday)',
    timelineSubtitle:
      'See exactly how the algorithm adapts day by day through weak scores, fasting energy locks, missed days, and consolidation.',
    monBadge: 'Monday · Fasting Launch',
    monTitle: 'Ch. 1: TCP/IP & Socket Architecture',
    monWhatHappened:
      'Started the Distributed Systems topic. Finished Ch. 1 cleanly. Quiz Score: 95% (Strong Pass). No coding carryover.',
    monAlgorithmReaction:
      'Engine records original study date, auto-computes D-3 (Thu), D-7 (Mon), D-14 (Mon+1w). Advances tomorrow’s target to Ch. 2.',
    monAlarmPreview:
      'Tomorrow 06:00 -> D-3: None | D-7: None | D-14: None | NEW: Ch. 2 (Memory & Pointers)',
    tueBadge: 'Tuesday · Standard Day · Weak Score!',
    tueTitle: 'Ch. 2: Memory Management & Pointer Arithmetic',
    tueWhatHappened:
      'Tough subtopic! Finished chapter, but Quiz Score was 65% (4 missed!) and pointer arithmetic coding exercises were left unfinished.',
    tueAlgorithmReaction:
      'Engine auto-flags Ch. 2 as WEAK and marks CARRYOVER. Automatically schedules Ch. 2 to be paired into Wednesday’s 10:00 coding session.',
    tueAlarmPreview:
      'Tomorrow 10:00 -> Coding: Ch. 2 (Carryover) + Ch. 3 (Concurrency)',
    wedBadge: 'Wednesday · Standard Day · Paired Repair',
    wedTitle: 'Ch. 3: Concurrency & Lock-Free Caches',
    wedWhatHappened:
      'Completed Ch. 3 and fixed the Ch. 2 pointer overflow bug during the paired coding block. Quiz Score: 88%.',
    wedAlgorithmReaction:
      'Advances target to Ch. 4. Keeps weak history for upcoming consolidation tracking.',
    wedAlarmPreview:
      'Tomorrow is Thursday (Fasting Day) -> Triggers fasting time slots & 15:15 CLOSE IDE lock.',
    thuBadge: 'Thursday · Fasting Day · D-3 Review Due!',
    thuTitle: 'Ch. 4: Event Loops & Ring Buffers (+ Ch. 1 D-3)',
    thuWhatHappened:
      'Exactly 3 days have elapsed since Monday! Ch. 1 is now DUE for D-3 Flashcard recall.',
    thuAlgorithmReaction:
      'Engine detects D-3 for Ch. 1 and injects it into 06:00 recall alarm. Enforces 15:15 energy checkpoint: CLOSE IDE for passive review.',
    thuAlarmPreview:
      '06:00 -> D-3/D-7 Recall (Ch. 1) + NEW: Ch. 4 + Blind Test | 15:15 -> CLOSE IDE: Passive Review',
    friBadge: 'Friday · Recovery Day · 15:15 Hard Stop',
    friTitle: 'Ch. 5: WebSockets & Heartbeat Monitors',
    friWhatHappened:
      'Studied Ch. 5 foundation. Quiz: 85%. Friday recovery constraints active.',
    friAlgorithmReaction:
      'Limits morning implementation blocks. At 15:15, triggers complete mental shutdown: OFF — Recovery to recharge cognitive batteries.',
    friAlarmPreview: '15:15 -> OFF — Recovery (No evening work, full rest)',
    satBadge: 'Saturday · Standard Day · Goal Missed (Adaptive Reset)',
    satTitle: 'Ch. 5 Carryover & Life Emergency',
    satWhatHappened:
      'Severe migraine & unexpected family urgency. Could not complete study goals for the day.',
    satAlgorithmReaction:
      'User marks "Missed Goals / Off Track" -> "Mental Fatigue". Engine halts new chapters, eliminates task backlog anxiety, and schedules a gentle Sunday catch-up.',
    satAlarmPreview:
      'Tomorrow 06:00 -> DE-ESCALATE: Ch. 5 (Core Focus) | 08:15 -> Light Review (Stress-Free)',
    sunBadge: 'Sunday · 6-Chapter Milestone Consolidation Day!',
    sunTitle: '6-Chapter Milestone Consolidation Cycle',
    sunWhatHappened:
      'Ch. 5 completed smoothly. That makes 6 completed chapters since baseline (Ch. 1–6)!',
    sunAlgorithmReaction:
      'CONSOLIDATION TRIGGERED! No new chapter tomorrow. Entire day shifts into 6-chapter mixed recall, practical challenge, and Feynman synthesis short.',
    sunAlarmPreview:
      '06:00 -> Consolidation Recall: Weak Flashcards (Ch. 2) | 08:15 -> Mixed Quiz Ch. 1–6 | 10:00 -> Practical Coding Ch. 1–6',
    routineTitle: 'The Daily 3-Step Execution Cheat Sheet',
    morningTitle: '1. Morning Launch (06:00 - 06:45)',
    morningDesc:
      'Wake up to phone alarm title. Review due D-3/D-7 flashcards for 20 minutes, then do a 10-minute conceptual preview of today’s chapter.',
    workTitle: '2. Active Implementation (08:15 & 10:00)',
    workDesc:
      '08:15: Closed-book diagnostic quiz. 10:00: Deep implementation coding block pairing yesterday’s weak code with today’s new chapter.',
    bedtimeTitle: '3. Bedtime 60-Second Ritual (22:30)',
    bedtimeDesc:
      'Open this web app on your phone. Tap 3 quick inputs. Click "Copy All Alarms". Paste labels into tomorrow’s Clock app slots. Sleep with total clarity.',
  },
  topicModal: {
    modalTitleCreate: 'Create Topic & Course Syllabus',
    modalTitleEdit: 'Edit Topic & Manage Syllabus',
    nameLabel: 'Topic / Course Name',
    namePlaceholder:
      'e.g. Distributed Systems, MIT 6.824, Network Protocols...',
    descLabel: 'Topic Description / Overview',
    descPlaceholder:
      'Provide a brief summary of the domain, key goals, and focus areas (e.g. Consensus, Raft, Paxos, and fault tolerance).',
    colorLabel: 'Theme Color',
    syllabusLabel: 'Chapters / Syllabus Outline (Optional - One per line)',
    syllabusPlaceholder:
      '1. Introduction to Distributed Systems\n2. RPC & Network Serialization\n3. Primary-Backup Replication\n4. Raft Consensus Algorithm\n5. Fault-Tolerant Key-Value Store\n6. MapReduce & Data Parallelism',
    syllabusHint:
      'Paste titles from your textbook table of contents or course syllabus. Numbers are auto-detected.',
    parsedCountNotice: 'Chapters parsed and ready to import',
    scheduleModeLabel: 'Syllabus Import Mode',
    scheduleModeQueue:
      'Add to Syllabus Queue (Uncompleted, ready for nightly study)',
    scheduleModeBackfill:
      'Backfill as Completed (Generate initial spaced reviews)',
    cancel: 'Cancel',
    save: 'Save Topic & Syllabus',
    docParserTitle: '📄 Parse Syllabus from Any File (n8n Workflow)',
    docParserSubtitle:
      'Upload any document, presentation, spreadsheet, notes, or syllabus file (.md, .pdf, .docx, .doc, .xlsx, .pptx, etc.) to automatically extract chapter outlines and topic descriptions without manual typing.',
    docUploadLabel:
      'Drop or Browse Any File (.md, .pdf, .docx, .xlsx, .pptx, etc.)',
    docUploadHint:
      'Accepts all file types: PDF, Markdown, Word, PowerPoint, Excel, CSV, Text notes, etc. Direct extraction or via n8n webhook.',
    docPromptLabel: 'AI Extraction Prompt & Section Filter (Optional)',
    docPromptPlaceholder:
      'e.g., "Only extract chapters 3 to 7", "Focus on distributed systems section", "Omit appendix"',
    docPromptHint:
      'AI will intelligently filter and tailor the syllabus based on your instructions.',
    parseErrorTitle: 'Document Extraction Error',
    n8nWebhookUrlLabel: 'n8n Parser Webhook URL',
    n8nWebhookPlaceholder: 'http://localhost:5678/webhook/parse-chapter-doc',
    downloadWorkflowBtn: '📥 Download n8n Workflow (.json)',
    parseBtn: '⚡ Parse Document',
    parsingInProgress: 'Extracting chapters...',
    parseSuccessNotice: 'Successfully parsed chapters from document!',
    parseErrorNotice:
      'Could not parse document. Check n8n webhook or file format.',
    workflowGuideTitle: 'How to use with n8n:',
    workflowGuideStep1:
      '1. Download the workflow JSON above and import it into your n8n workspace.',
    workflowGuideStep2:
      '2. Activate the workflow in n8n (Webhook path: /webhook/parse-chapter-doc).',
    workflowGuideStep3:
      '3. Drop your document here to auto-fill topic name, overview, and all chapters instantly!',
  },
  outlook: {
    title: '7-Day Spaced Repetition Outlook & Collision Forecast',
    subtitle:
      'Anticipate upcoming D-3, D-7, and D-14 review clusters to balance mental bandwidth',
    collisionAlert: 'High Review Collision (>= 3 reviews)',
    milestoneAlert: 'Consolidation Milestone',
    reviewsScheduled: 'reviews scheduled',
    noReviews: 'No reviews due',
    todayBadge: 'Tonight',
    tomorrowBadge: 'Tomorrow',
  },
  recallModal: {
    title: 'Rapid Active Recall & Flashcard Diagnostic',
    subtitle:
      'Retrieve principles and core models before viewing your solutions',
    topicLabel: 'Topic',
    chapterLabel: 'Chapter',
    quizScoreLabel: 'Previous Quiz',
    errorNotesLabel: 'Prior Weak Subtopics / Edge Cases',
    promptChallengeTitle: 'Active Retrieval Prompt',
    d3PromptText:
      'Active Retrieval: Without glancing at your notes or IDE, write down or state aloud the 3 core principles, formulas, and data structures from this chapter.',
    d7PromptText:
      'Synthesis & Quiz Check: Explain the failure modes, corner cases, and how this chapter directly connects to prior topics.',
    d14PromptText:
      'Feynman Oral Recall: Teach this concept aloud in under 90 seconds in plain language as if explaining to a junior colleague.',
    actionMastered: 'Mastered ✓ (Mark Done)',
    actionReinforce: 'Needs Work ⚠️ (Retain Weak Flag)',
    close: 'Close',
  },
};
