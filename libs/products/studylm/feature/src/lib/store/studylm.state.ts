import type {
  CompetencyTier,
  N8nConnectionConfig,
  SoftwareEngineeringDomain,
  StudySource,
  StudySubject,
} from '@ah/products/studylm/domain';

export type StudyLmTab = 'roadmap' | 'flashcards' | 'quiz' | 'sources' | 'stats';

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
  activeTab: StudyLmTab;
  selectedSectionId: string | null;
  isGeneratingRoadmap: boolean;
  generatingFlashcardSectionIds: string[];
  generatingQuizSectionIds: string[];
  roadmapRejectionReason: string | null;
  isSynthesizing: boolean;
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
}

const initialSubjectId = 'subj-default-js';

export const initialStudyLmState: StudyLmState = {
  subjects: [
    {
      id: initialSubjectId,
      title: 'JavaScript Internals & Modern Runtime',
      domain: 'languages-runtimes',
      description: 'Progressive roadmap covering ECMAScript specifications, lexical environments, event loop mechanics, and prototype inheritance.',
      roadmap: null,
      sources: [
        {
          id: 'src-1',
          title: 'MDN Web Docs (JavaScript Guide)',
          type: 'link',
          content: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
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
  activeTab: 'roadmap',
  selectedSectionId: null,
  isGeneratingRoadmap: false,
  generatingFlashcardSectionIds: [],
  generatingQuizSectionIds: [],
  roadmapRejectionReason: null,
  isSynthesizing: false,
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
  n8nConfig: {
    mode: 'tunnel',
    localUrl: 'http://127.0.0.1:5678/webhook/study-synthesizer',
    tunnelUrl: 'https://saffron-glacial-uncork.ngrok-free.dev/webhook/study-synthesizer',
    customUrl: '',
    activeEndpoint: 'https://saffron-glacial-uncork.ngrok-free.dev/webhook/study-synthesizer',
    isConnected: true,
    isChecking: false,
  },
  showSettingsModal: false,
  showAddSourceModal: false,
  editingSource: null,
  selectedSourceForPreview: null,
  showCreateSubjectModal: false,
  showAddFlashcardModal: false,
  showAddQuizModal: false,
  showJsonImportModal: false,
};
