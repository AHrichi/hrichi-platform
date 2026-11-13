import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LearningToday } from '@ah/learning/client';
import { APP_MODE } from '@ah/platform/app-mode';
import { isAppEnabled } from '@ah/shared/content';
import {
  AhButton,
  AhMetricCard,
  AhScrollHint,
  AhSelect,
  type AhSelectOption,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import { SCREENS, StudyLmScreens } from '../../shell/studylm-screens';
import {
  type AnswerEvaluationRequest,
  AI_ANSWER_EVALUATOR,
  type FeedbackRequest,
  SELF_EXPLAIN_FEEDBACK,
} from '@ah/products/studylm/learn';
import { PreferencesStore } from '@ah/shared/state';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { StudyLmReviews } from '../../services/studylm-reviews.service';
import { N8nSettingsModalComponent } from '../n8n-settings-modal/n8n-settings-modal.component';
import { CreateSubjectModalComponent } from '../create-subject-modal/create-subject-modal.component';
import { AddFlashcardModalComponent } from '../add-flashcard-modal/add-flashcard-modal.component';
import { AddQuizModalComponent } from '../add-quiz-modal/add-quiz-modal.component';
import { JsonImportModalComponent } from '../json-import-modal/json-import-modal.component';
import { ElaborationModalComponent } from '../elaboration-modal/elaboration-modal.component';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';

@Component({
  selector: 'ah-studylm-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LearningToday,
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
  providers: [
    StudyLmScreens,
    {
      provide: SELF_EXPLAIN_FEEDBACK,
      useFactory: () => {
        const lessons = inject(LessonGenerationService);
        return (request: FeedbackRequest) => lessons.feedback(request);
      },
    },
    {
      provide: AI_ANSWER_EVALUATOR,
      useFactory: () => {
        const lessons = inject(LessonGenerationService);
        return (request: AnswerEvaluationRequest) =>
          lessons.evaluateAnswer(request);
      },
    },
  ],
  templateUrl: './studylm-shell.component.html',
  styleUrl: './studylm-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyLmShellComponent {
  readonly store = inject(StudyLmStore);
  protected readonly learningOn =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone' ||
    isAppEnabled('learning');
  private readonly preferences = inject(PreferencesStore, { optional: true });
  readonly copy = computed(
    () => STUDYLM_COPY[this.preferences?.language() ?? 'en'] ?? STUDYLM_COPY.en,
  );

  constructor() {
    // Created with the shell, so a link the learning app just sent back
    // (`#learning-link=…`) is read on any screen; then the lessons finished
    // before linking join the reviews (design §9).
    const reviews = inject(StudyLmReviews);
    effect(() => {
      if (reviews.justLinked()) {
        untracked(() => void reviews.sendFinishedLessons());
      }
    });
  }

  /** The screens, each with how many items it holds when that helps. */
  readonly screens = computed(() => {
    const labels = this.copy().screens;
    return SCREENS.map((screen) => {
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
      const label = labels[screen.id] ?? screen.label;
      return { ...screen, label, count };
    });
  });

  /** "Checking…" until the first ping answers, so it never claims a connection. */
  readonly connection = computed(() => {
    const config = this.store.n8nConfig();
    const c = this.copy();
    return config.isChecking
      ? c.checking
      : config.isConnected
        ? c.online
        : c.offline;
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
