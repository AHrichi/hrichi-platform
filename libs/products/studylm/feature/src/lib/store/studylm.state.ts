import type {
  CompetencyTier,
  N8nConnectionConfig,
  StudySource,
  StudySubject,
} from '@ah/products/studylm/domain';

export type StudyLmTab = 'brief' | 'sources' | 'flashcards' | 'quiz';

export interface StudyLmState {
  subjects: StudySubject[];
  activeSubjectId: string;
  activeTier: CompetencyTier | 'all';
  activeTab: StudyLmTab;
  isSynthesizing: boolean;
  synthesisProvider: string;
  activeCardIndex: number;
  isCardFlipped: boolean;
  cardFilter: {
    tier: CompetencyTier | 'all';
    searchQuery: string;
    onlyBookmarked: boolean;
  };
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

const initialSubjectId = 'subj-default-1';

export const initialStudyLmState: StudyLmState = {
  subjects: [
    {
      id: initialSubjectId,
      title: 'New Study Subject',
      description: 'Add your documents, slides, and links to generate grounded flashcards and quizzes.',
      sources: [],
      overview: null,
      flashcards: [],
      quizQuestions: [],
      createdAt: new Date().toISOString(),
    },
  ],
  activeSubjectId: initialSubjectId,
  activeTier: 'all',
  activeTab: 'sources',
  isSynthesizing: false,
  synthesisProvider: 'n8n AI Engine / Grounded Synthesizer',
  activeCardIndex: 0,
  isCardFlipped: false,
  cardFilter: {
    tier: 'all',
    searchQuery: '',
    onlyBookmarked: false,
  },
  activeQuizIndex: 0,
  quizSubmitted: false,
  n8nConfig: {
    mode: 'tunnel',
    localUrl: 'http://127.0.0.1:5678/webhook/study-synthesizer',
    tunnelUrl: 'https://saffron-glacial-uncork.ngrok-free.dev/webhook/study-synthesizer',
    customUrl: '',
    activeEndpoint: 'https://saffron-glacial-uncork.ngrok-free.dev/webhook/study-synthesizer',
    isConnected: false,
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
