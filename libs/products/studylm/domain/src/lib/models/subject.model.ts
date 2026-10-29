import type { StudySource } from './source.model';
import type { StudyOverview } from './synthesis.model';
import type { StudyFlashcard } from './flashcard.model';
import type { StudyQuizQuestion } from './quiz.model';
import type { CurriculumRoadmap, SoftwareEngineeringDomain } from './roadmap.model';

export interface StudySubject {
  id: string;
  title: string;
  description?: string;
  domain?: SoftwareEngineeringDomain;
  roadmap?: CurriculumRoadmap | null;
  sources: StudySource[];
  overview: StudyOverview | null;
  flashcards: StudyFlashcard[];
  quizQuestions: StudyQuizQuestion[];
  lastSynthesizedAt?: string;
  createdAt: string;
}

export interface CreateSubjectInput {
  title: string;
  domain: SoftwareEngineeringDomain;
  description?: string;
  focusNotes?: string;
}

export interface StudyLmJsonImport {
  subject?: string;
  domain?: SoftwareEngineeringDomain;
  overview?: Partial<StudyOverview>;
  roadmap?: Partial<CurriculumRoadmap>;
  flashcards?: Array<{
    id?: string;
    tier?: string;
    front?: string;
    back?: string;
    category?: string;
    sectionId?: string;
    sectionCode?: string;
    codeSnippet?: string;
    codeLanguage?: string;
    sourceCitation?: string;
  }>;
  quiz?: Array<{
    id?: string;
    tier?: string;
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
    sectionId?: string;
    sectionCode?: string;
    codeSnippet?: string;
    codeLanguage?: string;
    sourceCitation?: string;
  }>;
}
