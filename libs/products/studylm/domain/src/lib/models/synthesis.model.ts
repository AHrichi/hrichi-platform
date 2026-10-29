import type { CompetencyTier } from './tier.model';
import type { StudyFlashcard } from './flashcard.model';
import type { StudyQuizQuestion } from './quiz.model';
import type { SourceType } from './source.model';
import type {
  CurriculumRoadmap,
  RoadmapBranch,
  RoadmapSection,
  SoftwareEngineeringDomain,
} from './roadmap.model';

export interface StudyOverview {
  title: string;
  executiveSummary: string;
  keyTakeaways: string[];
}

export type StudySynthesizerAction =
  | 'ping'
  | 'generate_roadmap'
  | 'generate_section_flashcards'
  | 'generate_section_quiz'
  | 'synthesize_sources';

export interface GenerateRoadmapRequest {
  action: 'generate_roadmap';
  subject: string;
  domain: SoftwareEngineeringDomain;
  focusNotes?: string;
}

export interface GenerateRoadmapResponse {
  success: boolean;
  code?: 'OK' | 'NON_SE_TOPIC' | 'AI_FAILOVER_EXHAUSTED' | 'INVALID_RESPONSE';
  provider: string;
  message?: string;
  roadmap?: CurriculumRoadmap;
}

export interface GenerateSectionFlashcardsRequest {
  action: 'generate_section_flashcards';
  subject: string;
  domain: SoftwareEngineeringDomain;
  branchTitle: string;
  section: {
    id: string;
    code: string;
    title: string;
    summary: string;
    difficultyTier: CompetencyTier;
    subtopics: readonly string[];
    officialDocs: readonly { title: string; url: string }[];
  };
}

export interface GenerateSectionFlashcardsResponse {
  success: boolean;
  provider: string;
  sectionId: string;
  docsGrounded: string[];
  flashcards: StudyFlashcard[];
  message?: string;
}

export interface GenerateSectionQuizRequest {
  action: 'generate_section_quiz';
  subject: string;
  domain: SoftwareEngineeringDomain;
  branchTitle: string;
  section: {
    id: string;
    code: string;
    title: string;
    summary: string;
    difficultyTier: CompetencyTier;
    subtopics: readonly string[];
    officialDocs: readonly { title: string; url: string }[];
  };
}

export interface GenerateSectionQuizResponse {
  success: boolean;
  provider: string;
  sectionId: string;
  docsGrounded: string[];
  quiz: StudyQuizQuestion[];
  message?: string;
}

// Backward compatibility for legacy sources synthesis
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
