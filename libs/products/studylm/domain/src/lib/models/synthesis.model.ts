import type { CompetencyTier } from './tier.model';
import type { StudyFlashcard } from './flashcard.model';
import type { StudyQuizQuestion } from './quiz.model';
import type { SourceType } from './source.model';

export interface AudioOverviewTurn {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface StudyOverview {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
  audioOverviewScript: AudioOverviewTurn[];
}

export interface SynthesisRequest {
  subject: string;
  sources: Array<{
    title: string;
    type: SourceType;
    content: string;
    url?: string;
  }>;
  targetTiers?: CompetencyTier[];
}

export interface SynthesisResponse {
  success: boolean;
  provider: string;
  timestamp: string;
  subject: string;
  overview: StudyOverview;
  flashcards: StudyFlashcard[];
  quiz: StudyQuizQuestion[];
}

export type N8nConnectionMode = 'local' | 'tunnel' | 'custom' | 'fallback';

export interface N8nConnectionConfig {
  mode: N8nConnectionMode;
  localUrl: string;
  tunnelUrl: string;
  customUrl: string;
  activeEndpoint: string;
  isConnected: boolean;
  isChecking: boolean;
  lastPingMs?: number;
  lastError?: string;
}
