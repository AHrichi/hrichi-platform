import type { CompetencyTier } from './tier.model';

export type MasteryRating = 'again' | 'hard' | 'good' | 'easy';

export interface StudyFlashcard {
  id: string;
  tier: CompetencyTier;
  front: string;
  back: string;
  sourceCitation: string;
  category: string;
  sectionId?: string;
  sectionCode?: string;
  codeSnippet?: string;
  codeLanguage?: string;
  masteryCount: number;
  lastRating?: MasteryRating;
  lastReviewedAt?: string;
  isBookmarked?: boolean;
}

export interface CreateFlashcardInput {
  tier: CompetencyTier;
  front: string;
  back: string;
  category: string;
  sourceCitation: string;
  sectionId?: string;
  sectionCode?: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

export interface FlashcardFilter {
  tier: CompetencyTier | 'all';
  sectionId?: string | 'all';
  searchQuery: string;
  onlyBookmarked: boolean;
}
