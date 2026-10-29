import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AhAccordionItem,
  AhAlert,
  AhBadge,
  AhButton,
  AhEmptyState,
  AhProgressBar,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
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
  ],
  templateUrl: './roadmap-explorer.component.html',
  styleUrls: ['./roadmap-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoadmapExplorerComponent {
  readonly store = inject(StudyLmStore);

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
    void this.store.generateFlashcardsForSection(sectionId);
  }

  onGenerateQuiz(sectionId: string): void {
    void this.store.generateQuizForSection(sectionId);
  }

  onStudySectionCards(section: RoadmapSection): void {
    this.store.setCardSectionFilter(section.id);
    this.store.setSelectedSection(section.id);
    this.store.setActiveTab('flashcards');
  }

  onTakeSectionQuiz(section: RoadmapSection): void {
    this.store.setQuizSectionFilter(section.id);
    this.store.setSelectedSection(section.id);
    this.store.setActiveTab('quiz');
  }

  getSectionCardCount(sectionId: string): number {
    return this.store.flashcards().filter((c) => c.sectionId === sectionId).length;
  }

  getSectionQuizCount(sectionId: string): number {
    return this.store.quizQuestions().filter((q) => q.sectionId === sectionId).length;
  }
}
