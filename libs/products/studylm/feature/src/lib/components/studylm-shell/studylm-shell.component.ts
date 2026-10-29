import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AhBadge,
  AhButton,
  AhMetricCard,
  AhSelect,
  type AhSelectOption,
  AhTabItem,
  AhTabs,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import type { StudyLmTab } from '../../store/studylm.state';
import { RoadmapExplorerComponent } from '../roadmap-explorer/roadmap-explorer.component';
import { SourceManagerComponent } from '../source-manager/source-manager.component';
import { FlashcardDeckComponent } from '../flashcard-deck/flashcard-deck.component';
import { QuizArenaComponent } from '../quiz-arena/quiz-arena.component';
import { N8nSettingsModalComponent } from '../n8n-settings-modal/n8n-settings-modal.component';
import { CreateSubjectModalComponent } from '../create-subject-modal/create-subject-modal.component';
import { AddFlashcardModalComponent } from '../add-flashcard-modal/add-flashcard-modal.component';
import { AddQuizModalComponent } from '../add-quiz-modal/add-quiz-modal.component';
import { JsonImportModalComponent } from '../json-import-modal/json-import-modal.component';
import { StudyStatsComponent } from '../study-stats/study-stats.component';

@Component({
  selector: 'ah-studylm-shell',
  standalone: true,
  imports: [
    CommonModule,
    AhTabs,
    AhMetricCard,
    AhButton,
    RoadmapExplorerComponent,
    SourceManagerComponent,
    FlashcardDeckComponent,
    QuizArenaComponent,
    N8nSettingsModalComponent,
    CreateSubjectModalComponent,
    AddFlashcardModalComponent,
    AddQuizModalComponent,
    JsonImportModalComponent,
    StudyStatsComponent,
    AhSelect,
  ],
  templateUrl: './studylm-shell.component.html',
  styleUrl: './studylm-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyLmShellComponent {
  readonly store = inject(StudyLmStore);

  readonly navTabs = computed<AhTabItem<StudyLmTab>[]>(() => [
    {
      id: 'roadmap',
      label: 'Curriculum Roadmap',
      icon: '🗺️',
      count: this.store.totalSectionsCount() > 0 ? this.store.totalSectionsCount() : undefined,
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: '🃏',
      count: this.store.flashcards().length > 0 ? this.store.flashcards().length : undefined,
    },
    {
      id: 'quiz',
      label: 'Quiz Arena',
      icon: '🎯',
      count: this.store.quizQuestions().length > 0 ? this.store.quizQuestions().length : undefined,
    },
    {
      id: 'sources',
      label: 'Reference Docs',
      icon: '📚',
      count: this.store.sourcesCount() > 0 ? this.store.sourcesCount() : undefined,
    },
    {
      id: 'stats',
      label: 'Progress & Stats',
      icon: '📊',
    },
  ]);

  onTabChange(tabId: string): void {
    this.store.setActiveTab(tabId as StudyLmTab);
  }

  readonly subjectOptions = computed<AhSelectOption[]>(() =>
    this.store.subjects().map((s) => ({
      value: s.id,
      label: s.title,
      icon: '📁',
      hint: s.domain,
    })),
  );

  selectSubjectId(id: string | null): void {
    if (id) {
      this.store.setActiveSubject(id);
    }
  }

  selectSubject(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.store.setActiveSubject(target.value);
    }
  }

  openCreateSubjectModal(): void {
    this.store.setShowCreateSubjectModal(true);
  }

  openSettingsModal(): void {
    this.store.setShowSettingsModal(true);
  }

  exportStudyGuide(): void {
    const subj = this.store.activeSubject();
    if (subj) {
      this.store.exportMarkdown(
        subj,
        this.store.flashcards(),
        this.store.quizQuestions(),
      );
    }
  }

  deleteCurrentSubject(): void {
    const active = this.store.activeSubject();
    if (!active) return;
    if (confirm(`Are you sure you want to delete "${active.title}" and its study data?`)) {
      this.store.deleteSubject(active.id);
    }
  }
}
