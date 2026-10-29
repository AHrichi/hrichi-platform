import type { StudySource } from './source.model';
import type { StudyOverview } from './synthesis.model';
import type { StudyFlashcard } from './flashcard.model';
import type { StudyQuizQuestion } from './quiz.model';

export interface StudySubject {
  id: string;
  title: string;
  description?: string;
  sources: StudySource[];
  overview: StudyOverview | null;
  flashcards: StudyFlashcard[];
  quizQuestions: StudyQuizQuestion[];
  lastSynthesizedAt?: string;
  createdAt: string;
}

export interface CreateSubjectInput {
  title: string;
  description?: string;
}

export interface StudyLmJsonImport {
  subject?: string;
  overview?: Partial<StudyOverview>;
  flashcards?: Array<{
    id?: string;
    tier?: string;
    front?: string;
    back?: string;
    category?: string;
    sourceCitation?: string;
  }>;
  quiz?: Array<{
    id?: string;
    tier?: string;
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
    sourceCitation?: string;
  }>;
}
