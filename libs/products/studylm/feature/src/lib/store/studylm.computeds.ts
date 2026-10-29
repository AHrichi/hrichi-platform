import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import type { StudyLmState } from './studylm.state';
import type {
  CompetencyTier,
  QuizSessionSummary,
  StudyFlashcard,
  StudyQuizQuestion,
} from '@ah/products/studylm/domain';

export function withStudyLmComputeds() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withComputed((state) => {
      const sources = state.sources;
      const flashcards = state.flashcards;
      const quizQuestions = state.quizQuestions;
      const activeTier = state.activeTier;
      const cardFilter = state.cardFilter;
      const activeCardIndex = state.activeCardIndex;
      const activeQuizIndex = state.activeQuizIndex;

      const totalWords = computed(() =>
        sources().reduce((acc, s) => acc + s.wordCount, 0),
      );

      const sourcesCount = computed(() => sources().length);

      const filteredCards = computed(() => {
        const filter = cardFilter();
        const globalTier = activeTier();
        const effectiveTier = globalTier !== 'all' ? globalTier : filter.tier;

        return flashcards().filter((card) => {
          if (effectiveTier !== 'all' && card.tier !== effectiveTier) {
            return false;
          }
          if (filter.onlyBookmarked && !card.isBookmarked) {
            return false;
          }
          if (filter.searchQuery.trim()) {
            const q = filter.searchQuery.toLowerCase();
            const matchesFront = card.front.toLowerCase().includes(q);
            const matchesBack = card.back.toLowerCase().includes(q);
            const matchesCat = card.category.toLowerCase().includes(q);
            return matchesFront || matchesBack || matchesCat;
          }
          return true;
        });
      });

      const currentCard = computed<StudyFlashcard | null>(() => {
        const list = filteredCards();
        if (list.length === 0) return null;
        const idx = Math.min(activeCardIndex(), list.length - 1);
        return list[Math.max(0, idx)];
      });

      const cardTierCounts = computed(() => {
        const list = flashcards();
        return {
          beginner: list.filter((c) => c.tier === 'beginner').length,
          intermediate: list.filter((c) => c.tier === 'intermediate').length,
          expert: list.filter((c) => c.tier === 'expert').length,
          all: list.length,
        };
      });

      const cardMasteryStats = computed(() => {
        const list = flashcards();
        const mastered = list.filter((c) => c.masteryCount >= 3).length;
        const learning = list.filter(
          (c) => c.masteryCount > 0 && c.masteryCount < 3,
        ).length;
        const unstudied = list.filter((c) => c.masteryCount === 0).length;
        const bookmarked = list.filter((c) => c.isBookmarked).length;
        return {
          total: list.length,
          mastered,
          learning,
          unstudied,
          bookmarked,
        };
      });

      const filteredQuiz = computed(() => {
        const globalTier = activeTier();
        if (globalTier === 'all') return quizQuestions();
        return quizQuestions().filter((q) => q.tier === globalTier);
      });

      const currentQuizQuestion = computed<StudyQuizQuestion | null>(() => {
        const list = filteredQuiz();
        if (list.length === 0) return null;
        const idx = Math.min(activeQuizIndex(), list.length - 1);
        return list[Math.max(0, idx)];
      });

      const quizSummary = computed<QuizSessionSummary>(() => {
        const list = filteredQuiz();
        const totalQuestions = list.length;
        const answeredCount = list.filter((q) => q.isAnswered).length;
        const correctCount = list.filter((q) => q.isCorrect).length;
        const scorePercentage =
          answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

        const tiers: CompetencyTier[] = ['beginner', 'intermediate', 'expert'];
        const tierBreakdown: Record<CompetencyTier, { total: number; correct: number }> = {
          beginner: { total: 0, correct: 0 },
          intermediate: { total: 0, correct: 0 },
          expert: { total: 0, correct: 0 },
        };

        tiers.forEach((t) => {
          const tList = list.filter((q) => q.tier === t);
          tierBreakdown[t] = {
            total: tList.length,
            correct: tList.filter((q) => q.isCorrect).length,
          };
        });

        return {
          totalQuestions,
          answeredCount,
          correctCount,
          scorePercentage,
          tierBreakdown,
        };
      });

      return {
        totalWords,
        sourcesCount,
        filteredCards,
        currentCard,
        cardTierCounts,
        cardMasteryStats,
        filteredQuiz,
        currentQuizQuestion,
        quizSummary,
      };
    }),
  );
}
