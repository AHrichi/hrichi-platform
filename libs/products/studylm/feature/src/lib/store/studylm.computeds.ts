import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed } from '@ngrx/signals';
import type { StudyLmState } from './studylm.state';
import type {
  CompetencyTier,
  CurriculumRoadmap,
  QuizSessionSummary,
  RoadmapBranch,
  RoadmapSection,
  StudyFlashcard,
  StudyOverview,
  StudyQuizQuestion,
  StudySource,
  StudySubject,
} from '@ah/products/studylm/domain';

export interface SubjectMasteryStats {
  id: string;
  title: string;
  domain: string;
  sectionsTotal: number;
  sectionsSynthesized: number;
  sectionsApproved: number;
  synthesisPct: number;
  cardsTotal: number;
  cardsMastered: number;
  quizTotal: number;
  quizAnswered: number;
  quizCorrect: number;
  quizAccuracyPct: number;
  sourcesCount: number;
}

export interface OverallPlatformStats {
  totalSubjects: number;
  totalSections: number;
  totalSynthesizedSections: number;
  overallCurriculumPct: number;
  totalFlashcards: number;
  totalCardsMastered: number;
  totalQuizQuestions: number;
  totalQuizAnswered: number;
  totalQuizCorrect: number;
  overallQuizAccuracyPct: number;
  totalSources: number;
}

export function withStudyLmComputeds() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withComputed((state) => {
      const subjects = state.subjects;
      const activeSubjectId = state.activeSubjectId;
      const activeTier = state.activeTier;
      const cardFilter = state.cardFilter;
      const quizFilter = state.quizFilter;
      const activeCardIndex = state.activeCardIndex;
      const activeQuizIndex = state.activeQuizIndex;

      const activeSubject = computed<StudySubject | null>(() => {
        const id = activeSubjectId();
        const list = subjects();
        return list.find((s) => s.id === id) ?? list[0] ?? null;
      });

      const activeRoadmap = computed<CurriculumRoadmap | null>(() => {
        return activeSubject()?.roadmap ?? null;
      });

      const activeBranches = computed<RoadmapBranch[]>(() => {
        return activeRoadmap()?.branches ?? [];
      });

      const allSections = computed<RoadmapSection[]>(() => {
        const branches = activeBranches();
        const sections: RoadmapSection[] = [];
        for (const b of branches) {
          if (b.sections) {
            sections.push(...b.sections);
          }
        }
        return sections;
      });

      const totalSectionsCount = computed(() => allSections().length);

      const approvedSectionsCount = computed(
        () => allSections().filter((s) => s.approved).length,
      );

      const synthesizedSectionsCount = computed(
        () =>
          allSections().filter(
            (s) => s.flashcardsStatus === 'ready' || s.quizStatus === 'ready',
          ).length,
      );

      const curriculumProgressPct = computed(() => {
        const total = totalSectionsCount();
        if (total === 0) return 0;
        return Math.round((synthesizedSectionsCount() / total) * 100);
      });

      const activeSources = computed<StudySource[]>(() => {
        return activeSubject()?.sources ?? [];
      });

      const activeOverview = computed<StudyOverview | null>(() => {
        return activeSubject()?.overview ?? null;
      });

      const activeFlashcards = computed<StudyFlashcard[]>(() => {
        return activeSubject()?.flashcards ?? [];
      });

      const activeQuizQuestions = computed<StudyQuizQuestion[]>(() => {
        return activeSubject()?.quizQuestions ?? [];
      });

      const totalWords = computed(() =>
        activeSources().reduce((acc, s) => acc + (s.wordCount ?? 0), 0),
      );

      const sourcesCount = computed(() => activeSources().length);

      const filteredCards = computed(() => {
        const filter = cardFilter();
        const globalTier = activeTier();
        const effectiveTier = globalTier !== 'all' ? globalTier : filter.tier;

        return activeFlashcards().filter((card) => {
          if (effectiveTier !== 'all' && card.tier !== effectiveTier) {
            return false;
          }
          if (filter.sectionId !== 'all' && card.sectionId !== filter.sectionId) {
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
        const list = activeFlashcards();
        return {
          beginner: list.filter((c) => c.tier === 'beginner').length,
          intermediate: list.filter((c) => c.tier === 'intermediate').length,
          expert: list.filter((c) => c.tier === 'expert').length,
          all: list.length,
        };
      });

      const cardMasteryStats = computed(() => {
        const list = activeFlashcards();
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
        const filter = quizFilter();
        const effectiveTier = globalTier !== 'all' ? globalTier : filter.tier;
        const list = activeQuizQuestions();

        return list.filter((q) => {
          if (effectiveTier !== 'all' && q.tier !== effectiveTier) {
            return false;
          }
          if (filter.sectionId !== 'all' && q.sectionId !== filter.sectionId) {
            return false;
          }
          return true;
        });
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

      const subjectStatsList = computed<SubjectMasteryStats[]>(() => {
        return subjects().map((subj) => {
          const branches = subj.roadmap?.branches ?? [];
          const sections: RoadmapSection[] = [];
          for (const b of branches) {
            if (b.sections) sections.push(...b.sections);
          }
          const sectionsTotal = sections.length;
          const sectionsApproved = sections.filter((s) => s.approved).length;
          const sectionsSynthesized = sections.filter(
            (s) => s.flashcardsStatus === 'ready' || s.quizStatus === 'ready',
          ).length;
          const synthesisPct =
            sectionsTotal > 0
              ? Math.round((sectionsSynthesized / sectionsTotal) * 100)
              : 0;

          const cardsTotal = subj.flashcards.length;
          const cardsMastered = subj.flashcards.filter(
            (c) => (c.masteryCount ?? 0) >= 3,
          ).length;

          const quizTotal = subj.quizQuestions.length;
          const quizAnswered = subj.quizQuestions.filter((q) => q.isAnswered).length;
          const quizCorrect = subj.quizQuestions.filter((q) => q.isCorrect).length;
          const quizAccuracyPct =
            quizAnswered > 0
              ? Math.round((quizCorrect / quizAnswered) * 100)
              : 0;

          return {
            id: subj.id,
            title: subj.title,
            domain: subj.domain,
            sectionsTotal,
            sectionsSynthesized,
            sectionsApproved,
            synthesisPct,
            cardsTotal,
            cardsMastered,
            quizTotal,
            quizAnswered,
            quizCorrect,
            quizAccuracyPct,
            sourcesCount: subj.sources.length,
          };
        });
      });

      const overallStats = computed<OverallPlatformStats>(() => {
        const list = subjectStatsList();
        const totalSubjects = list.length;
        const totalSections = list.reduce((acc, s) => acc + s.sectionsTotal, 0);
        const totalSynthesizedSections = list.reduce(
          (acc, s) => acc + s.sectionsSynthesized,
          0,
        );
        const overallCurriculumPct =
          totalSections > 0
            ? Math.round((totalSynthesizedSections / totalSections) * 100)
            : 0;

        const totalFlashcards = list.reduce((acc, s) => acc + s.cardsTotal, 0);
        const totalCardsMastered = list.reduce(
          (acc, s) => acc + s.cardsMastered,
          0,
        );

        const totalQuizQuestions = list.reduce((acc, s) => acc + s.quizTotal, 0);
        const totalQuizAnswered = list.reduce(
          (acc, s) => acc + s.quizAnswered,
          0,
        );
        const totalQuizCorrect = list.reduce((acc, s) => acc + s.quizCorrect, 0);
        const overallQuizAccuracyPct =
          totalQuizAnswered > 0
            ? Math.round((totalQuizCorrect / totalQuizAnswered) * 100)
            : 0;

        const totalSources = list.reduce((acc, s) => acc + s.sourcesCount, 0);

        return {
          totalSubjects,
          totalSections,
          totalSynthesizedSections,
          overallCurriculumPct,
          totalFlashcards,
          totalCardsMastered,
          totalQuizQuestions,
          totalQuizAnswered,
          totalQuizCorrect,
          overallQuizAccuracyPct,
          totalSources,
        };
      });

      return {
        activeSubject,
        activeRoadmap,
        roadmap: activeRoadmap,
        activeBranches,
        branches: activeBranches,
        allSections,
        totalSectionsCount,
        approvedSectionsCount,
        synthesizedSectionsCount,
        curriculumProgressPct,
        activeSources,
        sources: activeSources,
        activeOverview,
        overview: activeOverview,
        activeFlashcards,
        flashcards: activeFlashcards,
        activeQuizQuestions,
        quizQuestions: activeQuizQuestions,
        totalWords,
        sourcesCount,
        filteredCards,
        currentCard,
        cardTierCounts,
        cardMasteryStats,
        filteredQuiz,
        currentQuizQuestion,
        quizSummary,
        subjectStatsList,
        overallStats,
      };
    }),
  );
}
