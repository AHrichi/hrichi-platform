import type { CompetencyTier } from './tier.model';

export type MasteryRating = 'again' | 'hard' | 'good' | 'easy';

export interface StudyFlashcard {
  id: string;
  tier: CompetencyTier;
  front: string;
  back: string;
  sourceCitation: string;
  category: string;
  masteryCount: number;
  lastRating?: MasteryRating;
  lastReviewedAt?: string;
  isBookmarked?: boolean;
}

export interface FlashcardFilter {
  tier: CompetencyTier | 'all';
  searchQuery: string;
  onlyBookmarked: boolean;
}
