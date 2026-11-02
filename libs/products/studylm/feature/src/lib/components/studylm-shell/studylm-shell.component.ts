import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  AhButton,
  AhMetricCard,
  AhScrollHint,
  AhSelect,
  type AhSelectOption,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import { SCREENS, StudyLmScreens } from '../../shell/studylm-screens';
import { N8nSettingsModalComponent } from '../n8n-settings-modal/n8n-settings-modal.component';
import { CreateSubjectModalComponent } from '../create-subject-modal/create-subject-modal.component';
import { AddFlashcardModalComponent } from '../add-flashcard-modal/add-flashcard-modal.component';
import { AddQuizModalComponent } from '../add-quiz-modal/add-quiz-modal.component';
import { JsonImportModalComponent } from '../json-import-modal/json-import-modal.component';
import { ElaborationModalComponent } from '../elaboration-modal/elaboration-modal.component';

@Component({
  selector: 'ah-studylm-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AhScrollHint,
    AhMetricCard,
    AhButton,
    AhSelect,
    N8nSettingsModalComponent,
    CreateSubjectModalComponent,
    AddFlashcardModalComponent,
    AddQuizModalComponent,
    JsonImportModalComponent,
    ElaborationModalComponent,
  ],
  providers: [StudyLmScreens],
  templateUrl: './studylm-shell.component.html',
  styleUrl: './studylm-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyLmShellComponent {
  readonly store = inject(StudyLmStore);

  /** The screens, each with how many items it holds when that helps. */
  readonly screens = computed(() =>
    SCREENS.map((screen) => {
      const count =
        screen.id === 'roadmap'
          ? this.store.totalSectionsCount()
          : screen.id === 'flashcards'
            ? this.store.flashcards().length
            : screen.id === 'quiz'
              ? this.store.quizQuestions().length
              : screen.id === 'sources'
                ? this.store.sourcesCount()
                : 0;
      return { ...screen, count };
    }),
  );

  /** "Checking…" until the first ping answers, so it never claims a connection. */
  readonly connection = computed(() => {
    const config = this.store.n8nConfig();
    return config.isChecking
      ? 'Checking…'
      : config.isConnected
        ? 'Online'
        : 'Offline';
  });

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
    if (
      confirm(
        `Are you sure you want to delete "${active.title}" and its study data?`,
      )
    ) {
      this.store.deleteSubject(active.id);
    }
  }
}
