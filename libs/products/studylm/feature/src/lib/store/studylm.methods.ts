import { inject } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  type,
  withMethods,
} from '@ngrx/signals';
import type { StudyLmState } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';

/**
 * In-flight AI requests a learner can walk away from, per store instance:
 * closing the explanation modal or pressing "Cancel" aborts them, so a late
 * reply never lands on top of a newer one.
 */
const inFlight = new WeakMap<
  object,
  { roadmap?: AbortController; elaboration?: AbortController }
>();
function startRequest(
  store: object,
  kind: 'roadmap' | 'elaboration',
): AbortController {
  const slots = inFlight.get(store) ?? {};
  slots[kind]?.abort();
  const controller = new AbortController();
  slots[kind] = controller;
  inFlight.set(store, slots);
  return controller;
}
function cancelRequest(store: object, kind: 'roadmap' | 'elaboration'): void {
  inFlight.get(store)?.[kind]?.abort();
}

/** What a hint or deep dive is about. */
export type ElaborationContext = Omit<
  ConceptElaborationRequest,
  'action' | 'mode'
>;
import { StudyLmStorageService } from '../services/studylm-storage.service';
import {
  type AddSourceInput,
  type CompetencyTier,
  type ConceptElaborationRequest,
  type CreateFlashcardInput,
  type CreateQuizQuestionInput,
  type CreateSubjectInput,
  type CurriculumRoadmap,
  type MasteryRating,
  type N8nConnectionConfig,
  type RoadmapSection,
  type StudyFlashcard,
  type StudyLmJsonImport,
  type StudyQuizQuestion,
  type StudySource,
  type StudySubject,
  type UpdateSourceInput,
  exportToAnkiCsv,
  exportToMarkdown,
} from '@ah/products/studylm/domain';

/** Saving runs in the background; a failure leaves the in-memory state intact. */
function warnStorageFailure(error: unknown): void {
  console.warn('[studylm] could not persist a change', error);
}

/** Keys in the settings table. */
export const ACTIVE_SUBJECT_SETTING = 'activeSubjectId';
export const N8N_SETTING = 'n8n';

function failureMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * A regenerated roadmap keeps the learner's approvals: a section with the
 * same code as an approved one starts approved.
 */
export function keepApprovals(
  next: CurriculumRoadmap,
  previous: CurriculumRoadmap | null | undefined,
): CurriculumRoadmap {
  const approved = new Set(
    (previous?.branches ?? []).flatMap((b) =>
      b.sections.filter((sec) => sec.approved).map((sec) => sec.code),
    ),
  );
  if (approved.size === 0) return next;
  return {
    ...next,
    branches: next.branches.map((b) => ({
      ...b,
      sections: b.sections.map((sec) =>
        approved.has(sec.code) ? { ...sec, approved: true } : sec,
      ),
    })),
  };
}

export function withStudyLmMethods() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withMethods(
      (
        state,
        apiService = inject(StudyLmApiService),
        storageService = inject(StudyLmStorageService),
      ) => {
        /**
         * A hint or a deep dive. The modal opens at once, empty: the previous
         * concept's explanation never shows under the new title. A newer
         * request, or closing the modal, aborts this one.
         */
        async function elaborate(
          mode: ConceptElaborationRequest['mode'],
          context: ElaborationContext,
        ): Promise<void> {
          const controller = startRequest(state, 'elaboration');
          patchState(state, {
            activeElaboration: null,
            isLoadingElaboration: true,
            showElaborationModal: true,
            elaborationError: null,
          });
          try {
            const res = await apiService.elaborateConcept(
              { action: 'elaborate_concept', mode, ...context },
              state.n8nConfig().activeEndpoint,
              controller.signal,
            );
            if (controller.signal.aborted) return;
            patchState(state, {
              activeElaboration: res.elaboration,
              isLoadingElaboration: false,
            });
          } catch (err) {
            if (controller.signal.aborted) return;
            patchState(state, {
              isLoadingElaboration: false,
              elaborationError:
                err instanceof Error
                  ? err.message
                  : 'The explanation couldn’t be loaded.',
            });
          }
        }

        /**
         * Replies change the subject that asked for them, by id: the
         * learner may have opened another subject while waiting.
         */
        function updateSubject(
          id: string,
          updater: (current: StudySubject) => StudySubject,
        ) {
          let targetSubject: StudySubject | null = null;
          const updatedList = state.subjects().map((s) => {
            if (s.id !== id) return s;
            const updated = updater(s);
            targetSubject = updated;
            return updated;
          });
          patchState(state, { subjects: updatedList });
          if (targetSubject) {
            storageService.saveSubject(targetSubject).catch(warnStorageFailure);
          }
        }

        function updateActiveSubject(
          updater: (current: StudySubject) => StudySubject,
        ) {
          updateSubject(state.activeSubjectId(), updater);
        }

        /** Changes one roadmap section of a subject. */
        function updateSection(
          subjectId: string,
          sectionId: string,
          change: Partial<RoadmapSection>,
        ) {
          updateSubject(subjectId, (curr) =>
            curr.roadmap
              ? {
                  ...curr,
                  roadmap: {
                    ...curr.roadmap,
                    branches: curr.roadmap.branches.map((b) => ({
                      ...b,
                      sections: b.sections.map((sec) =>
                        sec.id === sectionId ? { ...sec, ...change } : sec,
                      ),
                    })),
                  },
                }
              : curr,
          );
        }

        return {
          setActiveTier(activeTier: CompetencyTier | 'all') {
            patchState(state, {
              activeTier,
              activeCardIndex: 0,
              isCardFlipped: false,
              activeQuizIndex: 0,
            });
          },

          setActiveSubject(activeSubjectId: string) {
            storageService
              .saveSetting(ACTIVE_SUBJECT_SETTING, activeSubjectId)
              .catch(warnStorageFailure);
            patchState(state, {
              activeSubjectId,
              selectedSectionId: null,
              activeCardIndex: 0,
              isCardFlipped: false,
              activeQuizIndex: 0,
              quizSubmitted: false,
              cardFilter: { ...state.cardFilter(), sectionId: 'all' },
              quizFilter: { ...state.quizFilter(), sectionId: 'all' },
            });
          },

          setSelectedSection(sectionId: string | null) {
            patchState(state, { selectedSectionId: sectionId });
          },

          setCardSectionFilter(sectionId: string | 'all') {
            patchState(state, {
              cardFilter: { ...state.cardFilter(), sectionId },
              activeCardIndex: 0,
              isCardFlipped: false,
            });
          },

          setQuizSectionFilter(sectionId: string | 'all') {
            patchState(state, {
              quizFilter: { ...state.quizFilter(), sectionId },
              activeQuizIndex: 0,
              quizSubmitted: false,
            });
          },

          createSubject(input: CreateSubjectInput) {
            const newSubj: StudySubject = {
              id: `subj-${Date.now()}`,
              title: input.title.trim() || 'Untitled Subject',
              domain: input.domain || 'languages-runtimes',
              description: input.description?.trim() || '',
              roadmap: null,
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
              roadmapRejectionReason: null,
            });

            storageService.saveSubject(newSubj).catch(warnStorageFailure);
          },

          deleteSubject(subjectId: string) {
            const remaining = state
              .subjects()
              .filter((s) => s.id !== subjectId);
            storageService.deleteSubject(subjectId).catch(warnStorageFailure);
            storageService
              .deleteGeneratedLessons(subjectId)
              .catch(warnStorageFailure);

            if (remaining.length === 0) {
              const fresh: StudySubject = {
                id: `subj-${Date.now()}`,
                title: 'New Study Subject',
                domain: 'languages-runtimes',
                roadmap: null,
                sources: [],
                overview: null,
                flashcards: [],
                quizQuestions: [],
                createdAt: new Date().toISOString(),
              };
              patchState(state, {
                subjects: [fresh],
                activeSubjectId: fresh.id,
                activeCardIndex: 0,
                activeQuizIndex: 0,
                isCardFlipped: false,
                cardFilter: {
                  tier: 'all',
                  sectionId: 'all',
                  searchQuery: '',
                  onlyBookmarked: false,
                },
              });
              storageService.saveSubject(fresh).catch(warnStorageFailure);
            } else {
              patchState(state, {
                subjects: remaining,
                activeSubjectId:
                  state.activeSubjectId() === subjectId
                    ? remaining[0].id
                    : state.activeSubjectId(),
                activeCardIndex: 0,
                activeQuizIndex: 0,
                isCardFlipped: false,
                cardFilter: {
                  tier: 'all',
                  sectionId: 'all',
                  searchQuery: '',
                  onlyBookmarked: false,
                },
              });
            }
          },

          async generateRoadmapForSubject(subjectId?: string) {
            const id = subjectId || state.activeSubjectId();
            const subject = state.subjects().find((s) => s.id === id);
            if (!subject) return;

            patchState(state, {
              isGeneratingRoadmap: true,
              roadmapRejectionReason: null,
              roadmapError: null,
            });
            const controller = startRequest(state, 'roadmap');

            try {
              const endpoint = state.n8nConfig().activeEndpoint;
              const res = await apiService.generateRoadmap(
                subject.title,
                subject.domain || 'languages-runtimes',
                subject.description,
                endpoint,
                controller.signal,
              );
              if (controller.signal.aborted) return;

              if (res.code === 'NON_SE_TOPIC') {
                patchState(state, {
                  isGeneratingRoadmap: false,
                  roadmapRejectionReason:
                    res.message ||
                    'Subject rejected: Please provide a valid Software Engineering or Computer Science topic.',
                });
                return;
              }
              if (!res.success || !res.roadmap) {
                patchState(state, {
                  isGeneratingRoadmap: false,
                  roadmapError:
                    res.message || 'The AI replied without a usable roadmap.',
                });
                return;
              }

              const newRoadmap: CurriculumRoadmap = res.roadmap;

              updateSubject(id, (curr) => ({
                ...curr,
                title: newRoadmap.canonicalSubject || curr.title,
                domain: newRoadmap.domain || curr.domain,
                roadmap: keepApprovals(newRoadmap, curr.roadmap),
              }));

              patchState(state, {
                isGeneratingRoadmap: false,
                roadmapRejectionReason: null,
              });
            } catch (err) {
              if (controller.signal.aborted) return;
              const msg =
                err instanceof Error
                  ? err.message
                  : 'Roadmap generation failed';
              patchState(state, {
                isGeneratingRoadmap: false,
                roadmapError: msg,
              });
            }
          },

          /** Stop waiting for the roadmap; nothing the AI sends later is kept. */
          cancelRoadmapGeneration() {
            cancelRequest(state, 'roadmap');
            patchState(state, { isGeneratingRoadmap: false });
          },

          approveSection(sectionId: string) {
            updateActiveSubject((subj) => {
              if (!subj.roadmap) return subj;
              const updatedBranches = subj.roadmap.branches.map((branch) => ({
                ...branch,
                sections: branch.sections.map((sec) =>
                  sec.id === sectionId ? { ...sec, approved: true } : sec,
                ),
              }));
              return {
                ...subj,
                roadmap: { ...subj.roadmap, branches: updatedBranches },
              };
            });
          },

          approveAllSections() {
            updateActiveSubject((subj) => {
              if (!subj.roadmap) return subj;
              const updatedBranches = subj.roadmap.branches.map((branch) => ({
                ...branch,
                sections: branch.sections.map((sec) => ({
                  ...sec,
                  approved: true,
                })),
              }));
              return {
                ...subj,
                roadmap: { ...subj.roadmap, branches: updatedBranches },
              };
            });
          },

          async generateFlashcardsForSection(sectionId: string) {
            const subjectId = state.activeSubjectId();
            const subject = state.subjects().find((s) => s.id === subjectId);
            if (!subject || !subject.roadmap) return;

            let targetBranchTitle = 'Curriculum Branch';
            let targetSection: RoadmapSection | null = null;

            for (const branch of subject.roadmap.branches) {
              const found = branch.sections.find((s) => s.id === sectionId);
              if (found) {
                targetBranchTitle = branch.title;
                targetSection = found;
                break;
              }
            }

            if (!targetSection) return;

            patchState(state, {
              generatingFlashcardSectionIds: [
                ...state.generatingFlashcardSectionIds(),
                sectionId,
              ],
            });

            try {
              const endpoint = state.n8nConfig().activeEndpoint;
              const res = await apiService.generateSectionFlashcards(
                subject.title,
                subject.domain || 'languages-runtimes',
                targetBranchTitle,
                targetSection,
                endpoint,
              );

              const incomingCards: StudyFlashcard[] = res.flashcards.map(
                (c) => ({
                  ...c,
                  sectionId,
                  sectionCode: targetSection?.code,
                  masteryCount: 0,
                }),
              );

              updateSubject(subjectId, (curr) => {
                const existingOtherCards = curr.flashcards.filter(
                  (c) => c.sectionId !== sectionId,
                );
                const allCards = [...existingOtherCards, ...incomingCards];

                const updatedBranches = (curr.roadmap?.branches ?? []).map(
                  (b) => ({
                    ...b,
                    sections: b.sections.map((sec) => {
                      if (sec.id !== sectionId) return sec;
                      return {
                        ...sec,
                        approved: true,
                        flashcardsStatus: 'ready' as const,
                        flashcardsProvider: res.provider,
                        lastError: undefined,
                      };
                    }),
                  }),
                );

                return {
                  ...curr,
                  flashcards: allCards,
                  roadmap: curr.roadmap
                    ? { ...curr.roadmap, branches: updatedBranches }
                    : null,
                };
              });
            } catch (err) {
              // The section keeps its cards and says what went wrong.
              updateSection(subjectId, sectionId, {
                flashcardsStatus: 'error',
                lastError: failureMessage(err, 'Flashcard generation failed'),
              });
            } finally {
              patchState(state, {
                generatingFlashcardSectionIds: state
                  .generatingFlashcardSectionIds()
                  .filter((id) => id !== sectionId),
              });
            }
          },

          async generateQuizForSection(sectionId: string) {
            const subjectId = state.activeSubjectId();
            const subject = state.subjects().find((s) => s.id === subjectId);
            if (!subject || !subject.roadmap) return;

            let targetBranchTitle = 'Curriculum Branch';
            let targetSection: RoadmapSection | null = null;

            for (const branch of subject.roadmap.branches) {
              const found = branch.sections.find((s) => s.id === sectionId);
              if (found) {
                targetBranchTitle = branch.title;
                targetSection = found;
                break;
              }
            }

            if (!targetSection) return;

            patchState(state, {
              generatingQuizSectionIds: [
                ...state.generatingQuizSectionIds(),
                sectionId,
              ],
            });

            try {
              const endpoint = state.n8nConfig().activeEndpoint;
              const res = await apiService.generateSectionQuiz(
                subject.title,
                subject.domain || 'languages-runtimes',
                targetBranchTitle,
                targetSection,
                endpoint,
              );

              const incomingQuestions: StudyQuizQuestion[] = res.quiz.map(
                (q) => ({
                  ...q,
                  sectionId,
                  sectionCode: targetSection?.code,
                  isAnswered: false,
                }),
              );

              updateSubject(subjectId, (curr) => {
                const existingOtherQuestions = curr.quizQuestions.filter(
                  (q) => q.sectionId !== sectionId,
                );
                const allQuestions = [
                  ...existingOtherQuestions,
                  ...incomingQuestions,
                ];

                const updatedBranches = (curr.roadmap?.branches ?? []).map(
                  (b) => ({
                    ...b,
                    sections: b.sections.map((sec) => {
                      if (sec.id !== sectionId) return sec;
                      return {
                        ...sec,
                        approved: true,
                        quizStatus: 'ready' as const,
                        quizProvider: res.provider,
                        lastError: undefined,
                      };
                    }),
                  }),
                );

                return {
                  ...curr,
                  quizQuestions: allQuestions,
                  roadmap: curr.roadmap
                    ? { ...curr.roadmap, branches: updatedBranches }
                    : null,
                };
              });
            } catch (err) {
              updateSection(subjectId, sectionId, {
                quizStatus: 'error',
                lastError: failureMessage(err, 'Quiz generation failed'),
              });
            } finally {
              patchState(state, {
                generatingQuizSectionIds: state
                  .generatingQuizSectionIds()
                  .filter((id) => id !== sectionId),
              });
            }
          },

          async synthesizeCurriculum() {
            const subject = state
              .subjects()
              .find((s) => s.id === state.activeSubjectId());
            if (!subject) return;

            if (subject.roadmap && subject.roadmap.branches.length > 0) {
              await this.generateRoadmapForSubject(subject.id);
              return;
            }

            patchState(state, { isSynthesizing: true, synthesisError: null });
            try {
              const endpoint = state.n8nConfig().activeEndpoint;
              const res = await apiService.synthesize(
                {
                  subject: subject.title,
                  sources: subject.sources.map((s) => ({
                    title: s.title,
                    type: s.type,
                    content: s.content,
                  })),
                },
                endpoint,
              );

              updateSubject(subject.id, (curr) => ({
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
                quizSubmitted: false,
              });
            } catch (err) {
              patchState(state, {
                isSynthesizing: false,
                synthesisError: failureMessage(err, 'Synthesis failed'),
              });
            }
          },

          addManualFlashcard(input: CreateFlashcardInput) {
            const newCard: StudyFlashcard = {
              id: `fc-${Date.now()}`,
              tier: input.tier,
              front: input.front.trim(),
              back: input.back.trim(),
              category: input.category.trim() || 'General',
              codeSnippet: input.codeSnippet?.trim() || undefined,
              codeLanguage: input.codeLanguage?.trim() || undefined,
              sourceCitation: input.sourceCitation?.trim() || 'Manual Note',
              sectionId: input.sectionId,
              masteryCount: 0,
              isBookmarked: false,
            };

            updateActiveSubject((curr) => ({
              ...curr,
              flashcards: [newCard, ...curr.flashcards],
            }));

            patchState(state, { showAddFlashcardModal: false });
          },

          addManualQuizQuestion(input: CreateQuizQuestionInput) {
            const safeOptions: [string, string, string, string] = [
              input.options[0]?.trim() || 'Option A',
              input.options[1]?.trim() || 'Option B',
              input.options[2]?.trim() || 'Option C',
              input.options[3]?.trim() || 'Option D',
            ];

            const newQ: StudyQuizQuestion = {
              id: `qz-${Date.now()}`,
              tier: input.tier,
              question: input.question.trim(),
              codeSnippet: input.codeSnippet?.trim() || undefined,
              codeLanguage: input.codeLanguage?.trim() || undefined,
              options: safeOptions,
              correctIndex: input.correctIndex,
              explanation: input.explanation.trim(),
              sourceCitation: input.sourceCitation?.trim() || 'Manual Note',
              sectionId: input.sectionId,
              isAnswered: false,
            };

            updateActiveSubject((curr) => ({
              ...curr,
              quizQuestions: [newQ, ...curr.quizQuestions],
            }));

            patchState(state, { showAddQuizModal: false });
          },

          importFromJson(data: StudyLmJsonImport) {
            updateActiveSubject((curr) => {
              const updatedTitle = data.subject?.trim() || curr.title;
              const updatedDomain = data.domain || curr.domain;

              const importedCards: StudyFlashcard[] = (
                data.flashcards || []
              ).map((c, i) => ({
                id: c.id || `fc-import-${Date.now()}-${i}`,
                tier: (c.tier as CompetencyTier) || 'intermediate',
                front: c.front || '',
                back: c.back || '',
                category: c.category || 'Imported',
                sectionId: c.sectionId,
                sectionCode: c.sectionCode,
                codeSnippet: c.codeSnippet,
                codeLanguage: c.codeLanguage,
                sourceCitation: c.sourceCitation || 'JSON Import',
                masteryCount: 0,
              }));

              const importedQuiz: StudyQuizQuestion[] = (data.quiz || []).map(
                (q, i) => {
                  const rawOpts = q.options || [];
                  const safeOptions: [string, string, string, string] = [
                    rawOpts[0] || 'Option A',
                    rawOpts[1] || 'Option B',
                    rawOpts[2] || 'Option C',
                    rawOpts[3] || 'Option D',
                  ];
                  return {
                    id: q.id || `qz-import-${Date.now()}-${i}`,
                    tier: (q.tier as CompetencyTier) || 'intermediate',
                    question: q.question || '',
                    options: safeOptions,
                    correctIndex: q.correctIndex ?? 0,
                    explanation: q.explanation || '',
                    sectionId: q.sectionId,
                    sectionCode: q.sectionCode,
                    codeSnippet: q.codeSnippet,
                    codeLanguage: q.codeLanguage,
                    sourceCitation: q.sourceCitation || 'JSON Import',
                    isAnswered: false,
                  };
                },
              );

              const mergedRoadmap: CurriculumRoadmap | null = data.roadmap
                ? {
                    canonicalSubject:
                      data.roadmap.canonicalSubject || updatedTitle,
                    domain:
                      data.roadmap.domain ||
                      updatedDomain ||
                      'languages-runtimes',
                    officialDocPortal:
                      data.roadmap.officialDocPortal ||
                      'Official Documentation',
                    overviewSummary: data.roadmap.overviewSummary || '',
                    branches: data.roadmap.branches || [],
                  }
                : (curr.roadmap ?? null);

              return {
                ...curr,
                title: updatedTitle,
                domain: updatedDomain,
                roadmap: mergedRoadmap,
                flashcards: [...importedCards, ...curr.flashcards],
                quizQuestions: [...importedQuiz, ...curr.quizQuestions],
              };
            });

            patchState(state, { showJsonImportModal: false });
          },

          setCardFlipped(isCardFlipped: boolean) {
            patchState(state, { isCardFlipped });
          },

          flipCard() {
            patchState(state, { isCardFlipped: !state.isCardFlipped() });
          },

          nextCard(totalFiltered: number) {
            if (totalFiltered <= 0) return;
            const nextIdx = (state.activeCardIndex() + 1) % totalFiltered;
            patchState(state, {
              activeCardIndex: nextIdx,
              isCardFlipped: false,
            });
          },

          prevCard(totalFiltered: number) {
            if (totalFiltered <= 0) return;
            const prevIdx =
              state.activeCardIndex() <= 0
                ? totalFiltered - 1
                : state.activeCardIndex() - 1;
            patchState(state, {
              activeCardIndex: prevIdx,
              isCardFlipped: false,
            });
          },

          rateCard(
            cardId: string,
            rating: MasteryRating,
            totalFiltered: number,
          ) {
            updateActiveSubject((curr) => ({
              ...curr,
              flashcards: curr.flashcards.map((c) => {
                if (c.id !== cardId) return c;
                let delta = 0;
                if (rating === 'easy') delta = 1;
                else if (rating === 'again') delta = -1;
                const nextCount = Math.max(
                  0,
                  Math.min(5, c.masteryCount + delta),
                );
                return {
                  ...c,
                  masteryCount: nextCount,
                  lastStudiedAt: new Date().toISOString(),
                };
              }),
            }));

            this.nextCard(totalFiltered);
          },

          toggleCardBookmark(cardId: string) {
            updateActiveSubject((curr) => ({
              ...curr,
              flashcards: curr.flashcards.map((c) => {
                if (c.id !== cardId) return c;
                return { ...c, isBookmarked: !c.isBookmarked };
              }),
            }));
          },

          setCardSearchQuery(searchQuery: string) {
            patchState(state, {
              cardFilter: { ...state.cardFilter(), searchQuery },
              activeCardIndex: 0,
            });
          },

          setCardFilterTier(tier: CompetencyTier | 'all') {
            patchState(state, {
              cardFilter: { ...state.cardFilter(), tier },
              activeCardIndex: 0,
            });
          },

          toggleOnlyBookmarked() {
            patchState(state, {
              cardFilter: {
                ...state.cardFilter(),
                onlyBookmarked: !state.cardFilter().onlyBookmarked,
              },
              activeCardIndex: 0,
            });
          },

          selectQuizAnswer(questionId: string, answerIndex: number) {
            updateActiveSubject((curr) => ({
              ...curr,
              quizQuestions: curr.quizQuestions.map((q) => {
                if (q.id !== questionId) return q;
                const isCorrect = answerIndex === q.correctIndex;
                return {
                  ...q,
                  isAnswered: true,
                  userSelectedIndex: answerIndex,
                  isCorrect,
                };
              }),
            }));
          },

          nextQuizQuestion(totalFiltered: number) {
            if (totalFiltered <= 0) return;
            const nextIdx = (state.activeQuizIndex() + 1) % totalFiltered;
            patchState(state, { activeQuizIndex: nextIdx });
          },

          prevQuizQuestion(totalFiltered: number) {
            if (totalFiltered <= 0) return;
            const prevIdx =
              state.activeQuizIndex() <= 0
                ? totalFiltered - 1
                : state.activeQuizIndex() - 1;
            patchState(state, { activeQuizIndex: prevIdx });
          },

          resetQuiz() {
            updateActiveSubject((curr) => ({
              ...curr,
              quizQuestions: curr.quizQuestions.map((q) => ({
                ...q,
                isAnswered: false,
                userSelectedIndex: undefined,
                isCorrect: undefined,
              })),
            }));
            patchState(state, { activeQuizIndex: 0, quizSubmitted: false });
          },

          submitQuizSession() {
            patchState(state, { quizSubmitted: true });
          },

          addSource(input: AddSourceInput) {
            const wordCount = input.content
              .trim()
              .split(/\s+/)
              .filter(Boolean).length;
            const newSource: StudySource = {
              id: `src-${Date.now()}`,
              title: input.title.trim(),
              type: input.type,
              content: input.content.trim(),
              url: input.url,
              wordCount,
              addedAt: new Date().toISOString(),
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
                  title: input.title.trim(),
                  type: input.type,
                  content: input.content.trim(),
                  url: input.url,
                  wordCount,
                };
              }),
            }));

            patchState(state, { editingSource: null });
          },

          deleteSource(id: string) {
            updateActiveSubject((curr) => ({
              ...curr,
              sources: curr.sources.filter((s) => s.id !== id),
            }));
          },

          removeSource(id: string) {
            updateActiveSubject((curr) => ({
              ...curr,
              sources: curr.sources.filter((s) => s.id !== id),
            }));
          },

          setEditingSource(editingSource: StudySource | null) {
            patchState(state, { editingSource });
          },

          setSelectedSourceForPreview(
            selectedSourceForPreview: StudySource | null,
          ) {
            patchState(state, { selectedSourceForPreview });
          },

          setShowSettingsModal(showSettingsModal: boolean) {
            patchState(state, { showSettingsModal });
          },

          setShowAddSourceModal(showAddSourceModal: boolean) {
            patchState(state, { showAddSourceModal });
          },

          setShowCreateSubjectModal(showCreateSubjectModal: boolean) {
            patchState(state, { showCreateSubjectModal });
          },

          setShowAddFlashcardModal(showAddFlashcardModal: boolean) {
            patchState(state, { showAddFlashcardModal });
          },

          setShowAddQuizModal(showAddQuizModal: boolean) {
            patchState(state, { showAddQuizModal });
          },

          setShowJsonImportModal(showJsonImportModal: boolean) {
            patchState(state, { showJsonImportModal });
          },

          updateN8nConfig(config: Partial<N8nConnectionConfig>) {
            patchState(state, (s) => ({
              n8nConfig: { ...s.n8nConfig, ...config },
            }));
            if (config.mode !== undefined) {
              // The tunnel address comes from site config on each load, so
              // only the learner's own choices are kept.
              const { mode, localUrl, customUrl } = state.n8nConfig();
              storageService
                .saveSetting(N8N_SETTING, { mode, localUrl, customUrl })
                .catch(warnStorageFailure);
            }
          },

          exportAnki(subjectTitle: string, cards: StudyFlashcard[]) {
            const csv = exportToAnkiCsv(cards);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subjectTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_anki.csv`;
            a.click();
            URL.revokeObjectURL(url);
          },

          exportMarkdown(
            subject: StudySubject,
            cards: StudyFlashcard[],
            quiz: StudyQuizQuestion[],
          ) {
            const md = exportToMarkdown(
              subject.title,
              subject.overview,
              cards,
              quiz,
            );
            const blob = new Blob([md], {
              type: 'text/markdown;charset=utf-8;',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subject.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_study_guide.md`;
            a.click();
            URL.revokeObjectURL(url);
          },

          requestHint(context: ElaborationContext) {
            return elaborate('hint', context);
          },

          requestDeepDive(context: ElaborationContext) {
            return elaborate('deep_dive', context);
          },

          closeElaborationModal() {
            cancelRequest(state, 'elaboration');
            patchState(state, {
              showElaborationModal: false,
              isLoadingElaboration: false,
            });
          },

          clearElaboration() {
            patchState(state, {
              activeElaboration: null,
              isLoadingElaboration: false,
              showElaborationModal: false,
              elaborationError: null,
            });
          },
        };
      },
    ),
  );
}
