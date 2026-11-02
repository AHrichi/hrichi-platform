import type {
  CompetencyTier,
  ConceptElaboration,
  N8nConnectionConfig,
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
  ],
  activeSubjectId: initialSubjectId,
  activeTier: 'all',
  selectedSectionId: null,
  isGeneratingRoadmap: false,
  generatingFlashcardSectionIds: [],
  generatingQuizSectionIds: [],
  roadmapRejectionReason: null,
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
  // The tunnel URL arrives from site config on init (withStudyLmHooks).
  n8nConfig: {
    mode: 'local',
    localUrl: 'http://127.0.0.1:5678/webhook/study-synthesizer',
    tunnelUrl: '',
    customUrl: '',
    activeEndpoint: 'http://127.0.0.1:5678/webhook/study-synthesizer',
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
