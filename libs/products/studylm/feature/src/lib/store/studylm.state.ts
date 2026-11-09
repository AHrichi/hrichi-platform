import type {
  CompetencyTier,
  ConceptElaboration,
  CurriculumRoadmap,
  N8nConnectionConfig,
  StudyFlashcard,
  StudyQuizQuestion,
  StudySource,
  StudySubject,
} from '@ah/products/studylm/domain';

export interface StudyLmCardFilter {
  tier: CompetencyTier | 'all';
  sectionId: string | 'all';
  searchQuery: string;
  onlyBookmarked: boolean;
}

export interface StudyLmQuizFilter {
  tier: CompetencyTier | 'all';
  sectionId: string | 'all';
}

export interface StudyLmState {
  subjects: StudySubject[];
  activeSubjectId: string;
  activeTier: CompetencyTier | 'all';
  selectedSectionId: string | null;
  isGeneratingRoadmap: boolean;
  generatingFlashcardSectionIds: string[];
  generatingQuizSectionIds: string[];
  roadmapRejectionReason: string | null;
  /** Why the AI couldn't make a roadmap (not a refused topic). */
  roadmapError: string | null;
  isSynthesizing: boolean;
  /** Why the last synthesis failed, shown with a retry. */
  synthesisError: string | null;
  synthesisProvider: string;
  activeCardIndex: number;
  isCardFlipped: boolean;
  cardFilter: StudyLmCardFilter;
  quizFilter: StudyLmQuizFilter;
  activeQuizIndex: number;
  quizSubmitted: boolean;
  n8nConfig: N8nConnectionConfig;
  showSettingsModal: boolean;
  showAddSourceModal: boolean;
  editingSource: StudySource | null;
  selectedSourceForPreview: StudySource | null;
  showCreateSubjectModal: boolean;
  showAddFlashcardModal: boolean;
  showAddQuizModal: boolean;
  showJsonImportModal: boolean;
  activeElaboration: ConceptElaboration | null;
  isLoadingElaboration: boolean;
  showElaborationModal: boolean;
  elaborationError: string | null;
}

const initialSubjectId = 'subj-default-js';

const seededRoadmap: CurriculumRoadmap = {
  canonicalSubject: 'JavaScript Internals & Modern Runtime',
  domain: 'languages-runtimes',
  officialDocPortal: 'https://tc39.es/ecma262/',
  overviewSummary:
    'Comprehensive technical exploration of ECMAScript runtime semantics, V8 execution pipeline, memory management, and asynchronous event scheduling.',
  branches: [
    {
      id: 'branch-runtime-foundations',
      order: 1,
      title: 'Runtime Architecture & Execution Contexts',
      description:
        'Lexical environments, execution context stack, and scope chains.',
      sections: [
        {
          id: 'sec-v8-pipeline',
          code: '1.1',
          title: 'V8 Execution Pipeline: Ignition & TurboFan',
          summary:
            'Bytecode generation, feedback vectors, inline caches, and JIT deoptimization loops.',
          difficultyTier: 'intermediate',
          subtopics: [
            'Ignition Bytecode',
            'TurboFan JIT Compiler',
            'Deoptimization Triggers',
            'Inline Caching',
          ],
          officialDocs: [
            {
              title: 'V8 Engine Architecture & Ignition Interpreter',
              url: 'https://v8.dev/docs/ignition',
            },
          ],
          approved: true,
          flashcardsStatus: 'ready',
          quizStatus: 'ready',
        },
        {
          id: 'sec-event-loop',
          code: '1.2',
          title: 'Event Loop & Task Scheduling',
          summary:
            'Microtask queue drain rules, macrotasks, UI rendering frames, and starvation avoidance.',
          difficultyTier: 'beginner',
          subtopics: [
            'Macrotasks vs Microtasks',
            'queueMicrotask()',
            'Animation Frame Scheduling',
            'Task Starvation',
          ],
          officialDocs: [
            {
              title: 'HTML Event Loops Processing Model',
              url: 'https://html.spec.whatwg.org/multipage/webappapis.html#event-loops',
            },
          ],
          approved: true,
          flashcardsStatus: 'ready',
          quizStatus: 'ready',
        },
      ],
    },
    {
      id: 'branch-memory-concurrency',
      order: 2,
      title: 'Memory Management & Asynchronous Concurrency',
      description:
        'Generational garbage collection and memory leak mitigation.',
      sections: [
        {
          id: 'sec-gc-internals',
          code: '2.1',
          title: 'Generational GC & Orinoco Collector',
          summary:
            'Scavenger nursery collection, Major Mark-Sweep-Compact, concurrent marking, and weak references.',
          difficultyTier: 'expert',
          subtopics: [
            'Scavenger (Minor GC)',
            'Full Mark-Sweep (Major GC)',
            'Concurrent Marking',
            'WeakRef & FinalizationRegistry',
          ],
          officialDocs: [
            {
              title: 'V8 Garbage Collection (Orinoco)',
              url: 'https://v8.dev/blog/trash-talk',
            },
          ],
          approved: true,
          flashcardsStatus: 'ready',
          quizStatus: 'ready',
        },
      ],
    },
  ],
};

const seededFlashcards: StudyFlashcard[] = [
  {
    id: 'fc-1',
    tier: 'beginner',
    sectionId: 'sec-event-loop',
    sectionCode: '1.2',
    category: 'Event Loop',
    front:
      'Under what condition does the microtask queue run relative to the current macrotask in the ECMAScript event loop?',
    back:
      'Microtasks (Promises, queueMicrotask, MutationObserver) drain completely after the current macrotask completes and before any subsequent macrotask or browser rendering tick begins.',
    sourceCitation: 'HTML Living Standard § 8.1.6 Event loops',
    codeSnippet:
      'console.log("1");\nsetTimeout(() => console.log("2"), 0);\nPromise.resolve().then(() => console.log("3"));\nconsole.log("4");\n// Output: 1, 4, 3, 2',
    codeLanguage: 'javascript',
    masteryCount: 2,
    lastRating: 'good',
  },
  {
    id: 'fc-2',
    tier: 'intermediate',
    sectionId: 'sec-v8-pipeline',
    sectionCode: '1.1',
    category: 'V8 Engine',
    front:
      'What triggers a deoptimization (bailout) in V8 TurboFan compiled machine code?',
    back:
      'A type-feedback violation — when dynamic property shapes (Hidden Classes/Shapes) or operand types deviate from the recorded feedback vector upon which TurboFan speculative optimizations were based.',
    sourceCitation: 'V8 Dev Blog: An Overview of the TurboFan Compiler',
    codeSnippet:
      'function compute(a) { return a.x + 1; }\ncompute({ x: 10 }); // Monomorphic feedback recorded\ncompute({ x: "invalid" }); // Deopt: type violation',
    codeLanguage: 'javascript',
    masteryCount: 1,
    lastRating: 'hard',
  },
  {
    id: 'fc-3',
    tier: 'expert',
    sectionId: 'sec-gc-internals',
    sectionCode: '2.1',
    category: 'Garbage Collection',
    front:
      'How does V8 prevent UI jank during the Major Mark-Sweep-Compact phase in Orinoco?',
    back:
      'Through concurrent marking on worker threads while main thread JS executes, incremental marking pauses interleaved with the event loop, and parallel sweeping/compaction.',
    sourceCitation: 'V8 Dev Blog: Trash talk: the Orinoco garbage collector',
    codeSnippet:
      '// WeakRef allows holding a reference without preventing GC\nconst cache = new Map();\nfunction cacheValue(key, obj) {\n  cache.set(key, new WeakRef(obj));\n}',
    codeLanguage: 'javascript',
    masteryCount: 0,
  },
];

const seededQuizQuestions: StudyQuizQuestion[] = [
  {
    id: 'quiz-1',
    tier: 'beginner',
    sectionId: 'sec-event-loop',
    sectionCode: '1.2',
    question:
      'Given the code below, what is the exact execution order logged to the console?',
    options: [
      'Start -> End -> Promise -> Timeout',
      'Start -> Promise -> Timeout -> End',
      'Start -> Timeout -> Promise -> End',
      'Start -> End -> Timeout -> Promise',
    ],
    correctIndex: 0,
    explanation:
      'Synchronous statements run first ("Start", "End"). When the call stack empties, the microtask queue drains ("Promise") before the timer macrotask executes ("Timeout").',
    sourceCitation: 'https://tc39.es/ecma262/#sec-jobs-and-job-queues',
    codeSnippet:
      'console.log("Start");\nsetTimeout(() => console.log("Timeout"), 0);\nPromise.resolve().then(() => console.log("Promise"));\nconsole.log("End");',
    codeLanguage: 'javascript',
  },
  {
    id: 'quiz-2',
    tier: 'intermediate',
    sectionId: 'sec-v8-pipeline',
    sectionCode: '1.1',
    question:
      'How do V8 Hidden Classes (Maps/Shapes) optimize property access on JavaScript objects?',
    options: [
      'They transform object property lookups into fixed offset indexing in memory via inline caches.',
      'They compile every object into a C++ struct at runtime.',
      'They replace JavaScript prototype lookups with hash table lookups.',
      'They freeze object prototypes to prevent monkey-patching.',
    ],
    correctIndex: 0,
    explanation:
      'Objects sharing the same transition tree share the same hidden class (Map). Inline caches remember this shape and access fields by fixed byte offset without hash table searches.',
    sourceCitation: 'https://v8.dev/blog/fast-properties',
  },
  {
    id: 'quiz-3',
    tier: 'expert',
    sectionId: 'sec-gc-internals',
    sectionCode: '2.1',
    question:
      'Under what condition does FinalizationRegistry NOT execute its registered cleanup callback?',
    options: [
      'If the program terminates or enters an unrecoverable crash before the GC sweeps the object.',
      'If the target object is an Array rather than a plain Object.',
      'If the cleanup token is a primitive string.',
      'If the registry was declared in global scope.',
    ],
    correctIndex: 0,
    explanation:
      'ECMAScript specifications do not guarantee that FinalizationRegistry callbacks will run before program termination; host environments may exit before garbage collection triggers.',
    sourceCitation: 'ECMA-262 § 26.2 FinalizationRegistry Objects',
  },
];

export const initialStudyLmState: StudyLmState = {
  subjects: [
    {
      id: initialSubjectId,
      title: 'JavaScript Internals & Modern Runtime',
      domain: 'languages-runtimes',
      description:
        'Progressive roadmap covering ECMAScript specifications, lexical environments, event loop mechanics, and prototype inheritance.',
      roadmap: null,
      sources: [
        {
          id: 'src-1',
          title: 'MDN Web Docs (JavaScript Guide)',
          type: 'link',
          content:
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          addedAt: new Date().toISOString(),
          wordCount: 150,
        },
      ],
      overview: null,
      flashcards: [],
      quizQuestions: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'subj-demo-v8',
      title: 'V8 Engine & Async Runtime (Demo)',
      domain: 'languages-runtimes',
      description:
        'Seeded demonstration curriculum showcasing progressive chapters, verified code snippets, technical flashcards, and diagnostic quiz.',
      roadmap: seededRoadmap,
      sources: [
        {
          id: 'src-demo-1',
          title: 'ECMA-262 Specification & V8 Architecture',
          type: 'link',
          content: 'https://v8.dev/docs',
          addedAt: new Date().toISOString(),
          wordCount: 320,
        },
      ],
      overview: null,
      flashcards: seededFlashcards,
      quizQuestions: seededQuizQuestions,
      createdAt: new Date().toISOString(),
    },
  ],
  activeSubjectId: initialSubjectId,
  activeTier: 'all',
  selectedSectionId: null,
  isGeneratingRoadmap: false,
  generatingFlashcardSectionIds: [],
  generatingQuizSectionIds: [],
  roadmapRejectionReason: null,
  roadmapError: null,
  isSynthesizing: false,
  synthesisError: null,
  synthesisProvider: 'Groq LPU (openai/gpt-oss-120b)',
  activeCardIndex: 0,
  isCardFlipped: false,
  cardFilter: {
    tier: 'all',
    sectionId: 'all',
    searchQuery: '',
    onlyBookmarked: false,
  },
  quizFilter: {
    tier: 'all',
    sectionId: 'all',
  },
  activeQuizIndex: 0,
  quizSubmitted: false,
  // The endpoint arrives from site config on init (withStudyLmHooks). Until
  // then there is none, so nothing can call localhost from a public page.
  n8nConfig: {
    mode: 'unavailable',
    localUrl: 'http://127.0.0.1:5678/webhook/study-synthesizer',
    tunnelUrl: '',
    customUrl: '',
    activeEndpoint: '',
    // Unknown until the first ping answers (withStudyLmHooks).
    isConnected: false,
    isChecking: true,
  },
  showSettingsModal: false,
  showAddSourceModal: false,
  editingSource: null,
  selectedSourceForPreview: null,
  showCreateSubjectModal: false,
  showAddFlashcardModal: false,
  showAddQuizModal: false,
  showJsonImportModal: false,
  activeElaboration: null,
  isLoadingElaboration: false,
  showElaborationModal: false,
  elaborationError: null,
};
