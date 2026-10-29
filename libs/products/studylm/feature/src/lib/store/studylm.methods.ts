import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withMethods } from '@ngrx/signals';
import type { StudyLmCardFilter, StudyLmQuizFilter, StudyLmState, StudyLmTab } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';
import { StudyLmStorageService } from '../services/studylm-storage.service';
import {
  type AddSourceInput,
  type CompetencyTier,
  type CreateFlashcardInput,
  type CreateQuizQuestionInput,
  type CreateSubjectInput,
  type CurriculumRoadmap,
  type MasteryRating,
  type N8nConnectionConfig,
  type RoadmapSection,
  type SoftwareEngineeringDomain,
  type StudyFlashcard,
  type StudyLmJsonImport,
  type StudyQuizQuestion,
  type StudySource,
  type StudySubject,
  type UpdateSourceInput,
  exportToAnkiCsv,
  exportToMarkdown,
} from '@ah/products/studylm/domain';

export function withStudyLmMethods() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withMethods(
      (
        state,
        apiService = inject(StudyLmApiService),
        storageService = inject(StudyLmStorageService),
      ) => {
        function updateActiveSubject(
          updater: (current: StudySubject) => StudySubject,
        ) {
          const id = state.activeSubjectId();
          let targetSubject: StudySubject | null = null;
          const updatedList = state.subjects().map((s) => {
            if (s.id !== id) return s;
            const updated = updater(s);
            targetSubject = updated;
            return updated;
          });
          patchState(state, { subjects: updatedList });
          if (targetSubject) {
            storageService.saveSubject(targetSubject).catch(() => {});
          }
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
              activeTab: 'roadmap',
              roadmapRejectionReason: null,
            });

            storageService.saveSubject(newSubj).catch(() => {});
          },

          deleteSubject(subjectId: string) {
            const remaining = state.subjects().filter((s) => s.id !== subjectId);
            storageService.deleteSubject(subjectId).catch(() => {});

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
                cardFilter: { tier: 'all', sectionId: 'all', searchQuery: '', onlyBookmarked: false },
              });
              storageService.saveSubject(fresh).catch(() => {});
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
                cardFilter: { tier: 'all', sectionId: 'all', searchQuery: '', onlyBookmarked: false },
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
            });

            try {
              const endpoint = state.n8nConfig().activeEndpoint;
              const res = await apiService.generateRoadmap(
                subject.title,
                subject.domain || 'languages-runtimes',
                subject.description,
                endpoint,
              );

              if (res.code === 'NON_SE_TOPIC' || !res.success || !res.roadmap) {
                patchState(state, {
                  isGeneratingRoadmap: false,
                  roadmapRejectionReason:
                    res.message ||
                    'Subject rejected: Please provide a valid Software Engineering or Computer Science topic.',
                });
                return;
              }

              const newRoadmap: CurriculumRoadmap = res.roadmap;

              updateActiveSubject((curr) => ({
                ...curr,
                title: newRoadmap.canonicalSubject || curr.title,
                domain: newRoadmap.domain || curr.domain,
                roadmap: newRoadmap,
              }));

              patchState(state, {
                isGeneratingRoadmap: false,
                roadmapRejectionReason: null,
              });
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Roadmap generation failed';
              patchState(state, {
                isGeneratingRoadmap: false,
                roadmapRejectionReason: msg,
              });
            }
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
            const subject = state.subjects().find((s) => s.id === state.activeSubjectId());
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

              const incomingCards: StudyFlashcard[] = res.flashcards.map((c) => ({
                ...c,
                sectionId,
                sectionCode: targetSection?.code,
                masteryCount: 0,
              }));

              updateActiveSubject((curr) => {
                const existingOtherCards = curr.flashcards.filter((c) => c.sectionId !== sectionId);
                const allCards = [...existingOtherCards, ...incomingCards];

                const updatedBranches = (curr.roadmap?.branches ?? []).map((b) => ({
                  ...b,
                  sections: b.sections.map((sec) => {
                    if (sec.id !== sectionId) return sec;
                    return {
                      ...sec,
                      approved: true,
                      flashcardsStatus: 'ready' as const,
                      flashcardsProvider: res.provider,
                    };
                  }),
                }));

                return {
                  ...curr,
                  flashcards: allCards,
                  roadmap: curr.roadmap
                    ? { ...curr.roadmap, branches: updatedBranches }
                    : null,
                };
              });
            } catch (err) {
              console.error('Failed to generate flashcards for section:', err);
            } finally {
              patchState(state, {
                generatingFlashcardSectionIds: state
                  .generatingFlashcardSectionIds()
                  .filter((id) => id !== sectionId),
              });
            }
          },

          async generateQuizForSection(sectionId: string) {
            const subject = state.subjects().find((s) => s.id === state.activeSubjectId());
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

              const incomingQuestions: StudyQuizQuestion[] = res.quiz.map((q) => ({
                ...q,
                sectionId,
                sectionCode: targetSection?.code,
                isAnswered: false,
              }));

              updateActiveSubject((curr) => {
                const existingOtherQuestions = curr.quizQuestions.filter(
                  (q) => q.sectionId !== sectionId,
                );
                const allQuestions = [...existingOtherQuestions, ...incomingQuestions];

                const updatedBranches = (curr.roadmap?.branches ?? []).map((b) => ({
                  ...b,
                  sections: b.sections.map((sec) => {
                    if (sec.id !== sectionId) return sec;
                    return {
                      ...sec,
                      approved: true,
                      quizStatus: 'ready' as const,
                      quizProvider: res.provider,
                    };
                  }),
                }));

                return {
                  ...curr,
                  quizQuestions: allQuestions,
                  roadmap: curr.roadmap
                    ? { ...curr.roadmap, branches: updatedBranches }
                    : null,
                };
              });
            } catch (err) {
              console.error('Failed to generate quiz for section:', err);
            } finally {
              patchState(state, {
                generatingQuizSectionIds: state
                  .generatingQuizSectionIds()
                  .filter((id) => id !== sectionId),
              });
            }
          },

          async synthesizeCurriculum() {
            const subject = state.subjects().find((s) => s.id === state.activeSubjectId());
            if (!subject) return;

            if (subject.roadmap && subject.roadmap.branches.length > 0) {
              await this.generateRoadmapForSubject(subject.id);
              return;
            }

            patchState(state, { isSynthesizing: true });
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
                quizSubmitted: false,
              });
            } catch {
              patchState(state, { isSynthesizing: false });
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

              const importedCards: StudyFlashcard[] = (data.flashcards || []).map((c, i) => ({
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

              const importedQuiz: StudyQuizQuestion[] = (data.quiz || []).map((q, i) => {
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
              });

              const mergedRoadmap: CurriculumRoadmap | null = data.roadmap
                ? {
                    canonicalSubject: data.roadmap.canonicalSubject || updatedTitle,
                    domain: data.roadmap.domain || updatedDomain || 'languages-runtimes',
                    officialDocPortal: data.roadmap.officialDocPortal || 'Official Documentation',
                    overviewSummary: data.roadmap.overviewSummary || '',
                    branches: data.roadmap.branches || [],
                  }
                : curr.roadmap;

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

          rateCard(cardId: string, rating: MasteryRating, totalFiltered: number) {
            updateActiveSubject((curr) => ({
              ...curr,
              flashcards: curr.flashcards.map((c) => {
                if (c.id !== cardId) return c;
                let delta = 0;
                if (rating === 'easy') delta = 1;
                else if (rating === 'again') delta = -1;
                const nextCount = Math.max(0, Math.min(5, c.masteryCount + delta));
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
            const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;
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
            const wordCount = input.content.trim().split(/\s+/).filter(Boolean).length;
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

          setSelectedSourceForPreview(selectedSourceForPreview: StudySource | null) {
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
            const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subject.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_study_guide.md`;
            a.click();
            URL.revokeObjectURL(url);
          },
        };
      },
    ),
  );
}
