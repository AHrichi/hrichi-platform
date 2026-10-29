import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withMethods } from '@ngrx/signals';
import type { StudyLmState, StudyLmTab } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';
import {
  type AddSourceInput,
  type CompetencyTier,
  type MasteryRating,
  type N8nConnectionConfig,
  type StudyFlashcard,
  type StudySource,
  PRESEEDED_STUDY_DECKS,
  exportToAnkiCsv,
  exportToMarkdown,
} from '@ah/products/studylm/domain';

export function withStudyLmMethods() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withMethods((state, apiService = inject(StudyLmApiService)) => {
      return {
        setActiveTab(activeTab: StudyLmTab) {
          patchState(state, { activeTab });
        },

        setActiveTier(activeTier: CompetencyTier | 'all') {
          patchState(state, {
            activeTier,
            activeCardIndex: 0,
            isCardFlipped: false,
            activeQuizIndex: 0,
          });
        },

        setCardSearchQuery(searchQuery: string) {
          patchState(state, {
            cardFilter: { ...state.cardFilter(), searchQuery },
            activeCardIndex: 0,
          });
        },

        toggleCardBookmarkFilter() {
          const current = state.cardFilter().onlyBookmarked;
          patchState(state, {
            cardFilter: { ...state.cardFilter(), onlyBookmarked: !current },
            activeCardIndex: 0,
          });
        },

        toggleSettingsModal(show?: boolean) {
          const next = show ?? !state.showSettingsModal();
          patchState(state, { showSettingsModal: next });
        },

        toggleAddSourceModal(show?: boolean) {
          const next = show ?? !state.showAddSourceModal();
          patchState(state, { showAddSourceModal: next });
        },

        selectSourceForPreview(source: StudySource | null) {
          patchState(state, { selectedSourceForPreview: source });
        },

        addSource(input: AddSourceInput) {
          const wordCount = input.content
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

          const newSource: StudySource = {
            id: `src-${Date.now()}`,
            title: input.title.trim() || 'Untitled Source Document',
            type: input.type,
            content: input.content,
            url: input.url,
            wordCount,
            addedAt: new Date().toISOString(),
            summary: input.content.slice(0, 160) + '...',
          };

          patchState(state, {
            sources: [...state.sources(), newSource],
            showAddSourceModal: false,
          });
        },

        removeSource(sourceId: string) {
          patchState(state, {
            sources: state.sources().filter((s) => s.id !== sourceId),
          });
        },

        loadPreseededDeck(deckId: string) {
          const found = PRESEEDED_STUDY_DECKS.find((d) => d.id === deckId);
          if (!found) return;

          patchState(state, {
            activeSubject: found.subject,
            sources: found.sources,
            flashcards: found.flashcards,
            quizQuestions: found.quiz,
            overview: found.overview,
            activeCardIndex: 0,
            isCardFlipped: false,
            activeQuizIndex: 0,
            quizSubmitted: false,
            synthesisProvider: 'Pre-seeded Verified Deck',
          });
        },

        flipCard() {
          patchState(state, { isCardFlipped: !state.isCardFlipped() });
        },

        nextCard(maxCount: number) {
          const curr = state.activeCardIndex();
          if (curr < maxCount - 1) {
            patchState(state, {
              activeCardIndex: curr + 1,
              isCardFlipped: false,
            });
          }
        },

        prevCard() {
          const curr = state.activeCardIndex();
          if (curr > 0) {
            patchState(state, {
              activeCardIndex: curr - 1,
              isCardFlipped: false,
            });
          }
        },

        rateCard(cardId: string, rating: MasteryRating, maxCount: number) {
          const updatedCards = state.flashcards().map((card) => {
            if (card.id !== cardId) return card;
            let increment = 0;
            if (rating === 'again') increment = -1;
            if (rating === 'hard') increment = 0;
            if (rating === 'good') increment = 1;
            if (rating === 'easy') increment = 2;

            const masteryCount = Math.max(0, card.masteryCount + increment);
            return {
              ...card,
              masteryCount,
              lastRating: rating,
              lastReviewedAt: new Date().toISOString(),
            };
          });

          patchState(state, { flashcards: updatedCards });

          // Auto-advance to next card
          const curr = state.activeCardIndex();
          if (curr < maxCount - 1) {
            patchState(state, {
              activeCardIndex: curr + 1,
              isCardFlipped: false,
            });
          }
        },

        toggleCardBookmark(cardId: string) {
          const updatedCards = state.flashcards().map((c) =>
            c.id === cardId ? { ...c, isBookmarked: !c.isBookmarked } : c,
          );
          patchState(state, { flashcards: updatedCards });
        },

        answerQuiz(questionId: string, selectedIndex: number) {
          const updated = state.quizQuestions().map((q) => {
            if (q.id !== questionId) return q;
            return {
              ...q,
              userSelectedIndex: selectedIndex,
              isAnswered: true,
              isCorrect: selectedIndex === q.correctIndex,
            };
          });
          patchState(state, { quizQuestions: updated });
        },

        nextQuiz(maxCount: number) {
          const curr = state.activeQuizIndex();
          if (curr < maxCount - 1) {
            patchState(state, { activeQuizIndex: curr + 1 });
          }
        },

        prevQuiz() {
          const curr = state.activeQuizIndex();
          if (curr > 0) {
            patchState(state, { activeQuizIndex: curr - 1 });
          }
        },

        resetQuiz() {
          const reset = state.quizQuestions().map((q) => ({
            ...q,
            userSelectedIndex: undefined,
            isAnswered: false,
            isCorrect: undefined,
          }));
          patchState(state, {
            quizQuestions: reset,
            activeQuizIndex: 0,
            quizSubmitted: false,
          });
        },

        updateN8nConfig(partial: Partial<N8nConnectionConfig>) {
          const current = state.n8nConfig();
          const updated: N8nConnectionConfig = {
            ...current,
            ...partial,
          };
          if (partial.mode) {
            if (partial.mode === 'local') updated.activeEndpoint = updated.localUrl;
            if (partial.mode === 'tunnel') updated.activeEndpoint = updated.tunnelUrl;
            if (partial.mode === 'custom') updated.activeEndpoint = updated.customUrl;
          }
          patchState(state, { n8nConfig: updated });
        },

        async testN8nConnection() {
          const cfg = state.n8nConfig();
          patchState(state, {
            n8nConfig: { ...cfg, isChecking: true, lastError: undefined },
          });

          const res = await apiService.testConnection(cfg.activeEndpoint);
          patchState(state, {
            n8nConfig: {
              ...state.n8nConfig(),
              isChecking: false,
              isConnected: res.ok,
              lastPingMs: res.latencyMs,
              lastError: res.error,
            },
          });
        },

        async synthesize() {
          if (state.sources().length === 0) return;

          patchState(state, { isSynthesizing: true });

          try {
            const endpoint = state.n8nConfig().activeEndpoint;
            const res = await apiService.synthesize(
              {
                subject: state.activeSubject(),
                sources: state.sources().map((s) => ({
                  title: s.title,
                  type: s.type,
                  content: s.content,
                  url: s.url,
                })),
              },
              endpoint,
            );

            patchState(state, {
              isSynthesizing: false,
              overview: res.overview,
              flashcards: res.flashcards,
              quizQuestions: res.quiz,
              synthesisProvider: res.provider,
              lastSynthesizedAt: res.timestamp,
              activeCardIndex: 0,
              isCardFlipped: false,
              activeQuizIndex: 0,
              activeTab: 'brief',
            });
          } catch (err) {
            console.error('Synthesis failed:', err);
            patchState(state, { isSynthesizing: false });
          }
        },

        exportAnki() {
          const tsv = exportToAnkiCsv(state.flashcards());
          const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${state.activeSubject().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-anki-deck.tsv`;
          link.click();
          URL.revokeObjectURL(url);
        },

        exportMarkdown() {
          const md = exportToMarkdown(
            state.activeSubject(),
            state.overview(),
            state.flashcards(),
            state.quizQuestions(),
          );
          const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${state.activeSubject().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.md`;
          link.click();
          URL.revokeObjectURL(url);
        },
      };
    }),
  );
}
