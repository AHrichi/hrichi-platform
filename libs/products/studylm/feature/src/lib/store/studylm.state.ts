import {
  type CompetencyTier,
  type N8nConnectionConfig,
  type StudyFlashcard,
  type StudyOverview,
  type StudyQuizQuestion,
  type StudySource,
  PRESEEDED_STUDY_DECKS,
} from '@ah/products/studylm/domain';

export type StudyLmTab =
  | 'sources'
  | 'brief'
  | 'flashcards'
  | 'quiz'
  | 'audio-overview';

export interface StudyLmState {
  activeSubject: string;
  sources: StudySource[];
  flashcards: StudyFlashcard[];
  quizQuestions: StudyQuizQuestion[];
  overview: StudyOverview | null;
  activeTier: CompetencyTier | 'all';
  activeTab: StudyLmTab;
  isSynthesizing: boolean;
  synthesisProvider: string;
  lastSynthesizedAt: string | null;
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
  selectedSourceForPreview: StudySource | null;
}

const defaultDeck = PRESEEDED_STUDY_DECKS[0];

export const initialStudyLmState: StudyLmState = {
  activeSubject: defaultDeck.subject,
  sources: defaultDeck.sources,
  flashcards: defaultDeck.flashcards,
  quizQuestions: defaultDeck.quiz,
  overview: defaultDeck.overview,
  activeTier: 'all',
  activeTab: 'brief',
  isSynthesizing: false,
  synthesisProvider: 'Pre-seeded Grounded High-Yield Set',
  lastSynthesizedAt: new Date().toISOString(),
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
    isConnected: true,
    isChecking: false,
  },
  showSettingsModal: false,
  showAddSourceModal: false,
  selectedSourceForPreview: null,
};
