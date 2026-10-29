import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withMethods } from '@ngrx/signals';
import type { StudyLmState, StudyLmTab } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';
import {
  type AddSourceInput,
  type CompetencyTier,
  type CreateFlashcardInput,
  type CreateQuizQuestionInput,
  type CreateSubjectInput,
  type MasteryRating,
  type N8nConnectionConfig,
  type StudyFlashcard,
  type StudyLmJsonImport,
  type StudyQuizQuestion,
  type StudySource,
  type StudySubject,
  type UpdateSourceInput,
  PRESEEDED_STUDY_DECKS,
  exportToAnkiCsv,
  exportToMarkdown,
} from '@ah/products/studylm/domain';

export function withStudyLmMethods() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withMethods((state, apiService = inject(StudyLmApiService)) => {
      // Helper to update active subject within subjects list
      function updateActiveSubject(
        updater: (current: StudySubject) => StudySubject,
      ) {
        const id = state.activeSubjectId();
        const updatedList = state.subjects().map((s) => {
          if (s.id !== id) return s;
          return updater(s);
        });
        patchState(state, { subjects: updatedList });
      }

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

        setActiveSubject(activeSubjectId: string) {
          patchState(state, {
            activeSubjectId,
            activeCardIndex: 0,
            isCardFlipped: false,
            activeQuizIndex: 0,
            quizSubmitted: false,
          });
        },

        createSubject(input: CreateSubjectInput) {
          const newSubj: StudySubject = {
            id: `subj-${Date.now()}`,
            title: input.title.trim() || 'Untitled Subject',
            description: input.description?.trim() || '',
            sources: [],
            overview: null,
            flashcards: [],
            quizQuestions: [],
            createdAt: new Date().toISOString(),
          };

          patchState(state, {
            subjects: [...state.subjects(), newSubj],
            activeSubjectId: newSubj.id,
            showCreateSubjectModal: false,
            activeTab: 'sources',
          });
        },

        deleteSubject(subjectId: string) {
          const remaining = state.subjects().filter((s) => s.id !== subjectId);
          if (remaining.length === 0) {
            // Keep at least one subject
            const fresh: StudySubject = {
              id: `subj-${Date.now()}`,
              title: 'New Study Subject',
              sources: [],
              overview: null,
              flashcards: [],
              quizQuestions: [],
              createdAt: new Date().toISOString(),
            };
            patchState(state, {
              subjects: [fresh],
              activeSubjectId: fresh.id,
            });
            return;
          }

          const nextActiveId =
            state.activeSubjectId() === subjectId
              ? remaining[0].id
              : state.activeSubjectId();

          patchState(state, {
            subjects: remaining,
            activeSubjectId: nextActiveId,
          });
        },

        loadPreseededDeck(deckId: string) {
          this.loadPreseededTemplate(deckId);
        },

        loadPreseededTemplate(deckId: string) {
          const found = PRESEEDED_STUDY_DECKS.find((d) => d.id === deckId);
          if (!found) return;

          const importedSubject: StudySubject = {
            id: `subj-template-${Date.now()}`,
            title: found.subject,
            description: found.tagline,
            sources: found.sources,
            overview: found.overview,
            flashcards: found.flashcards,
            quizQuestions: found.quiz,
            createdAt: new Date().toISOString(),
            lastSynthesizedAt: new Date().toISOString(),
          };

          patchState(state, {
            subjects: [...state.subjects(), importedSubject],
            activeSubjectId: importedSubject.id,
            activeTab: 'brief',
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

        // Modal Controls
        toggleSettingsModal(show?: boolean) {
          patchState(state, {
            showSettingsModal: show ?? !state.showSettingsModal(),
          });
        },

        toggleAddSourceModal(show?: boolean) {
          patchState(state, {
            showAddSourceModal: show ?? !state.showAddSourceModal(),
            editingSource: null,
          });
        },

        toggleCreateSubjectModal(show?: boolean) {
          patchState(state, {
            showCreateSubjectModal: show ?? !state.showCreateSubjectModal(),
          });
        },

        toggleAddFlashcardModal(show?: boolean) {
          patchState(state, {
            showAddFlashcardModal: show ?? !state.showAddFlashcardModal(),
          });
        },

        toggleAddQuizModal(show?: boolean) {
          patchState(state, {
            showAddQuizModal: show ?? !state.showAddQuizModal(),
          });
        },

        toggleJsonImportModal(show?: boolean) {
          patchState(state, {
            showJsonImportModal: show ?? !state.showJsonImportModal(),
          });
        },

        setEditingSource(source: StudySource | null) {
          patchState(state, {
            editingSource: source,
            showAddSourceModal: source !== null,
          });
        },

        selectSourceForPreview(source: StudySource | null) {
          patchState(state, { selectedSourceForPreview: source });
        },

        // Source Management
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

          updateActiveSubject((curr) => ({
            ...curr,
            sources: [...curr.sources, newSource],
          }));

          patchState(state, { showAddSourceModal: false });
        },

        updateSource(input: UpdateSourceInput) {
          const wordCount = input.content
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;

          updateActiveSubject((curr) => ({
            ...curr,
            sources: curr.sources.map((s) => {
              if (s.id !== input.id) return s;
              return {
                ...s,
                title: input.title.trim() || s.title,
                type: input.type,
                content: input.content,
                url: input.url,
                wordCount,
                updatedAt: new Date().toISOString(),
                summary: input.content.slice(0, 160) + '...',
              };
            }),
          }));

          patchState(state, {
            showAddSourceModal: false,
            editingSource: null,
          });
        },

        removeSource(sourceId: string) {
          updateActiveSubject((curr) => ({
            ...curr,
            sources: curr.sources.filter((s) => s.id !== sourceId),
          }));
        },

        // Manual Creation
        createFlashcard(input: CreateFlashcardInput) {
          const newCard: StudyFlashcard = {
            id: `fc-manual-${Date.now()}`,
            tier: input.tier,
            front: input.front.trim(),
            back: input.back.trim(),
            category: input.category.trim() || 'Custom',
            sourceCitation: input.sourceCitation.trim() || 'Manual Input',
            masteryCount: 0,
          };

          updateActiveSubject((curr) => ({
            ...curr,
            flashcards: [...curr.flashcards, newCard],
          }));

          patchState(state, { showAddFlashcardModal: false });
        },

        createQuizQuestion(input: CreateQuizQuestionInput) {
          const newQ: StudyQuizQuestion = {
            id: `qz-manual-${Date.now()}`,
            tier: input.tier,
            question: input.question.trim(),
            options: input.options,
            correctIndex: input.correctIndex,
            explanation: input.explanation.trim(),
            sourceCitation: input.sourceCitation.trim() || 'Manual Input',
          };

          updateActiveSubject((curr) => ({
            ...curr,
            quizQuestions: [...curr.quizQuestions, newQ],
          }));

          patchState(state, { showAddQuizModal: false });
        },

        // JSON Import
        importFromJson(jsonString: string): { success: boolean; message: string } {
          try {
            const parsed = JSON.parse(jsonString) as StudyLmJsonImport | StudyFlashcard[] | StudyQuizQuestion[];

            let importedCards: StudyFlashcard[] = [];
            let importedQuiz: StudyQuizQuestion[] = [];
            let newSubjectTitle: string | undefined;

            if (Array.isArray(parsed)) {
              // Could be an array of flashcards or quiz questions
              if (parsed.length > 0 && 'front' in parsed[0]) {
                const rawCards = parsed as Array<{ tier?: string; front?: string; back?: string; category?: string; sourceCitation?: string }>;
                importedCards = rawCards.map((c, i) => ({
                  id: `fc-imp-${Date.now()}-${i}`,
                  tier: (c.tier === 'beginner' || c.tier === 'intermediate' || c.tier === 'expert') ? c.tier : 'intermediate',
                  front: String(c.front || ''),
                  back: String(c.back || ''),
                  category: String(c.category || 'Imported'),
                  sourceCitation: String(c.sourceCitation || 'JSON Import'),
                  masteryCount: 0,
                }));
              } else if (parsed.length > 0 && 'question' in parsed[0]) {
                const rawQuiz = parsed as Array<{ tier?: string; question?: string; options?: string[]; correctIndex?: number; explanation?: string; sourceCitation?: string }>;
                importedQuiz = rawQuiz.map((q, i) => {
                  const opts = Array.isArray(q.options) && q.options.length >= 4
                    ? [q.options[0], q.options[1], q.options[2], q.options[3]] as [string, string, string, string]
                    : ['Option A', 'Option B', 'Option C', 'Option D'] as [string, string, string, string];
                  return {
                    id: `qz-imp-${Date.now()}-${i}`,
                    tier: (q.tier === 'beginner' || q.tier === 'intermediate' || q.tier === 'expert') ? q.tier : 'intermediate',
                    question: String(q.question || ''),
                    options: opts,
                    correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
                    explanation: String(q.explanation || 'Imported rationale'),
                    sourceCitation: String(q.sourceCitation || 'JSON Import'),
                  };
                });
              }
            } else if (typeof parsed === 'object' && parsed !== null) {
              const obj = parsed as StudyLmJsonImport;
              newSubjectTitle = obj.subject;

              if (Array.isArray(obj.flashcards)) {
                importedCards = obj.flashcards.map((c, i) => ({
                  id: c.id || `fc-imp-${Date.now()}-${i}`,
                  tier: (c.tier === 'beginner' || c.tier === 'intermediate' || c.tier === 'expert') ? c.tier : 'intermediate',
                  front: String(c.front || ''),
                  back: String(c.back || ''),
                  category: String(c.category || 'Imported'),
                  sourceCitation: String(c.sourceCitation || 'JSON Import'),
                  masteryCount: 0,
                }));
              }

              if (Array.isArray(obj.quiz)) {
                importedQuiz = obj.quiz.map((q, i) => {
                  const opts = Array.isArray(q.options) && q.options.length >= 4
                    ? [q.options[0], q.options[1], q.options[2], q.options[3]] as [string, string, string, string]
                    : ['Option A', 'Option B', 'Option C', 'Option D'] as [string, string, string, string];
                  return {
                    id: q.id || `qz-imp-${Date.now()}-${i}`,
                    tier: (q.tier === 'beginner' || q.tier === 'intermediate' || q.tier === 'expert') ? q.tier : 'intermediate',
                    question: String(q.question || ''),
                    options: opts,
                    correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
                    explanation: String(q.explanation || 'Imported rationale'),
                    sourceCitation: String(q.sourceCitation || 'JSON Import'),
                  };
                });
              }
            }

            if (importedCards.length === 0 && importedQuiz.length === 0) {
              return { success: false, message: 'No valid flashcards or quiz questions found in JSON.' };
            }

            updateActiveSubject((curr) => ({
              ...curr,
              title: newSubjectTitle || curr.title,
              flashcards: [...curr.flashcards, ...importedCards],
              quizQuestions: [...curr.quizQuestions, ...importedQuiz],
            }));

            patchState(state, { showJsonImportModal: false });
            return {
              success: true,
              message: `Successfully imported ${importedCards.length} flashcards and ${importedQuiz.length} quiz questions!`,
            };
          } catch (err) {
            return {
              success: false,
              message: `Invalid JSON format: ${err instanceof Error ? err.message : 'Parse error'}`,
            };
          }
        },

        // Flashcard Interactions
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
          updateActiveSubject((curr) => ({
            ...curr,
            flashcards: curr.flashcards.map((card) => {
              if (card.id !== cardId) return card;
              let increment = 0;
              if (rating === 'again') increment = -1;
              if (rating === 'hard') increment = 0;
              if (rating === 'good') increment = 1;
              if (rating === 'easy') increment = 2;

              return {
                ...card,
                masteryCount: Math.max(0, card.masteryCount + increment),
                lastRating: rating,
                lastReviewedAt: new Date().toISOString(),
              };
            }),
          }));

          const curr = state.activeCardIndex();
          if (curr < maxCount - 1) {
            patchState(state, {
              activeCardIndex: curr + 1,
              isCardFlipped: false,
            });
          }
        },

        toggleCardBookmark(cardId: string) {
          updateActiveSubject((curr) => ({
            ...curr,
            flashcards: curr.flashcards.map((c) =>
              c.id === cardId ? { ...c, isBookmarked: !c.isBookmarked } : c,
            ),
          }));
        },

        // Quiz Interactions
        answerQuiz(questionId: string, selectedIndex: number) {
          updateActiveSubject((curr) => ({
            ...curr,
            quizQuestions: curr.quizQuestions.map((q) => {
              if (q.id !== questionId) return q;
              return {
                ...q,
                userSelectedIndex: selectedIndex,
                isAnswered: true,
                isCorrect: selectedIndex === q.correctIndex,
              };
            }),
          }));
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
          updateActiveSubject((curr) => ({
            ...curr,
            quizQuestions: curr.quizQuestions.map((q) => ({
              ...q,
              userSelectedIndex: undefined,
              isAnswered: false,
              isCorrect: undefined,
            })),
          }));
          patchState(state, {
            activeQuizIndex: 0,
            quizSubmitted: false,
          });
        },

        // n8n Connection Configuration
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

        // AI Synthesis for active subject
        async synthesize() {
          return this.synthesizeActiveSubject();
        },

        async synthesizeActiveSubject() {
          const active = state.subjects().find((s) => s.id === state.activeSubjectId());
          if (!active || active.sources.length === 0) return;

          patchState(state, { isSynthesizing: true });

          try {
            const endpoint = state.n8nConfig().activeEndpoint;
            const res = await apiService.synthesize(
              {
                subject: active.title,
                sources: active.sources.map((s) => ({
                  title: s.title,
                  type: s.type,
                  content: s.content,
                  url: s.url,
                })),
              },
              endpoint,
            );

            updateActiveSubject((curr) => ({
              ...curr,
              overview: res.overview,
              flashcards: res.flashcards,
              quizQuestions: res.quiz,
              lastSynthesizedAt: res.timestamp,
            }));

            patchState(state, {
              isSynthesizing: false,
              synthesisProvider: res.provider,
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
          const active = state.subjects().find((s) => s.id === state.activeSubjectId());
          if (!active) return;
          const tsv = exportToAnkiCsv(active.flashcards);
          const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-anki-deck.tsv`;
          link.click();
          URL.revokeObjectURL(url);
        },

        exportMarkdown() {
          const active = state.subjects().find((s) => s.id === state.activeSubjectId());
          if (!active) return;
          const md = exportToMarkdown(
            active.title,
            active.overview,
            active.flashcards,
            active.quizQuestions,
          );
          const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.md`;
          link.click();
          URL.revokeObjectURL(url);
        },
      };
    }),
  );
}
