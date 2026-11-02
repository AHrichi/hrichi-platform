import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AhAccordionItem,
  AhAlert,
  AhBadge,
  AhButton,
  AhEmptyState,
  AhProgressBar,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import { StudyLmScreens } from '../../shell/studylm-screens';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import type { RoadmapSection } from '@ah/products/studylm/domain';

@Component({
  selector: 'studylm-roadmap-explorer',
  standalone: true,
  imports: [
    CommonModule,
    AhAccordionItem,
    AhAlert,
    AhBadge,
    AhButton,
    AhEmptyState,
    AhProgressBar,
    RouterLink,
  ],
  templateUrl: './roadmap-explorer.component.html',
  styleUrls: ['./roadmap-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapExplorerComponent {
  readonly store = inject(StudyLmStore);
  private readonly screens = inject(StudyLmScreens);
  private readonly lessons = inject(LessonGenerationService);

  /**
   * Set of section IDs that are currently expanded.
   */
  readonly expandedSectionIds = signal<Set<string>>(new Set<string>());

  private lastSubjectId: string | null = null;

  constructor() {
    // When active subject changes, initialize expanded sections (first section open by default)
    effect(() => {
      const currentSubjectId = this.store.activeSubjectId();
      if (currentSubjectId !== this.lastSubjectId) {
        this.lastSubjectId = currentSubjectId;
        const branches = this.store.activeBranches();
        const firstSecId = branches[0]?.sections[0]?.id;
        this.expandedSectionIds.set(
          firstSecId ? new Set([firstSecId]) : new Set(),
        );
      }
    });

    // Auto-expand selected section when user navigates to it
    effect(() => {
      const selectedId = this.store.selectedSectionId();
      if (selectedId && !this.expandedSectionIds().has(selectedId)) {
        this.expandSection(selectedId);
      }
    });
  }

  isSectionExpanded(sectionId: string): boolean {
    if (
      this.isSectionGeneratingCards(sectionId) ||
      this.isSectionGeneratingQuiz(sectionId)
    ) {
      return true;
    }
    return this.expandedSectionIds().has(sectionId);
  }

  toggleSection(sectionId: string): void {
    const next = new Set(this.expandedSectionIds());
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    this.expandedSectionIds.set(next);
  }

  expandSection(sectionId: string): void {
    const next = new Set(this.expandedSectionIds());
    next.add(sectionId);
    this.expandedSectionIds.set(next);
  }

  collapseSection(sectionId: string): void {
    const next = new Set(this.expandedSectionIds());
    next.delete(sectionId);
    this.expandedSectionIds.set(next);
  }

  areAllSectionsExpanded(branchSections: readonly RoadmapSection[]): boolean {
    if (branchSections.length === 0) return false;
    return branchSections.every((s) => this.isSectionExpanded(s.id));
  }

  toggleAllSectionsInBranch(branchSections: readonly RoadmapSection[]): void {
    const allExpanded = this.areAllSectionsExpanded(branchSections);
    const next = new Set(this.expandedSectionIds());
    for (const s of branchSections) {
      if (allExpanded) {
        next.delete(s.id);
      } else {
        next.add(s.id);
      }
    }
    this.expandedSectionIds.set(next);
  }

  isSectionGeneratingCards(sectionId: string): boolean {
    return this.store.generatingFlashcardSectionIds().includes(sectionId);
  }

  isSectionGeneratingQuiz(sectionId: string): boolean {
    return this.store.generatingQuizSectionIds().includes(sectionId);
  }

  onGenerateRoadmap(): void {
    void this.store.generateRoadmapForSubject();
  }

  onApproveSection(sectionId: string): void {
    this.store.approveSection(sectionId);
  }

  onApproveAll(): void {
    this.store.approveAllSections();
  }

  onGenerateFlashcards(sectionId: string): void {
    this.expandSection(sectionId);
    void this.store.generateFlashcardsForSection(sectionId);
  }

  onGenerateQuiz(sectionId: string): void {
    this.expandSection(sectionId);
    void this.store.generateQuizForSection(sectionId);
  }

  /** Whether this section's lesson is saved, being written, or failed. */
  lessonState(section: RoadmapSection): {
    status: string | null;
    saved: boolean;
    error: string | null;
  } {
    const subject = this.store.activeSubject();
    if (!subject) return { status: null, saved: false, error: null };
    const id = this.lessons.idFor(subject, section);
    const job = this.lessons.jobs()[id];
    return {
      status: job?.status ?? null,
      saved: this.lessons.saved().has(id),
      error: job?.error ?? null,
    };
  }

  writeLesson(section: RoadmapSection): void {
    const subject = this.store.activeSubject();
    if (!subject) return;
    const id = this.lessons.start(subject, section);
    void this.screens.go('learn', id);
  }

  openLesson(section: RoadmapSection): void {
    const subject = this.store.activeSubject();
    if (subject)
      void this.screens.go('learn', this.lessons.idFor(subject, section));
  }

  onStudySectionCards(section: RoadmapSection): void {
    this.store.setCardSectionFilter(section.id);
    this.store.setSelectedSection(section.id);
    void this.screens.go('flashcards');
  }

  onTakeSectionQuiz(section: RoadmapSection): void {
    this.store.setQuizSectionFilter(section.id);
    this.store.setSelectedSection(section.id);
    void this.screens.go('quiz');
  }

  getSectionCardCount(sectionId: string): number {
    return this.store.flashcards().filter((c) => c.sectionId === sectionId)
      .length;
  }

  getSectionQuizCount(sectionId: string): number {
    return this.store.quizQuestions().filter((q) => q.sectionId === sectionId)
      .length;
  }
}
