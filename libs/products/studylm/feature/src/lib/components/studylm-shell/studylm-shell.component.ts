import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
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
import {
  SCREENS,
  type StudyLmScreen,
  StudyLmScreens,
} from '../../shell/studylm-screens';
import {
  type AnswerEvaluationRequest,
  AI_ANSWER_EVALUATOR,
  type FeedbackRequest,
  SELF_EXPLAIN_FEEDBACK,
} from '@ah/products/studylm/learn';
import { PreferencesStore } from '@ah/shared/state';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { StudyLmReviews } from '../../services/studylm-reviews.service';
import { StudyLmNotifications } from '../../services/studylm-notifications.service';
import { StudyLmSyncService } from '../../services/studylm-sync.service';
import { NotificationsModalComponent } from '../notifications-modal/notifications-modal.component';
import { N8nSettingsModalComponent } from '../n8n-settings-modal/n8n-settings-modal.component';
import { StudyLmSyncModalComponent } from '../studylm-sync-modal/studylm-sync-modal.component';
import { CreateSubjectModalComponent } from '../create-subject-modal/create-subject-modal.component';
import { AddFlashcardModalComponent } from '../add-flashcard-modal/add-flashcard-modal.component';
import { AddQuizModalComponent } from '../add-quiz-modal/add-quiz-modal.component';
import { JsonImportModalComponent } from '../json-import-modal/json-import-modal.component';
import { ElaborationModalComponent } from '../elaboration-modal/elaboration-modal.component';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';

/** One word each, for the phone tab bar. */
const SHORT_LABELS: Record<StudyLmScreen, string> = {
  roadmap: 'Roadmap',
  learn: 'Lessons',
  flashcards: 'Cards',
  quiz: 'Quiz',
  sources: 'Docs',
  stats: 'Progress',
};

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
    StudyLmSyncModalComponent,
    NotificationsModalComponent,
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
  readonly sync = inject(StudyLmSyncService, { optional: true });
  protected readonly notifications = inject(StudyLmNotifications);
  /** Standalone (its own site or installed), not inside the portfolio. */
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  protected readonly learningOn = this.standalone || isAppEnabled('learning');
  private readonly router = inject(Router);
  /** Inside a lesson, phones give the lesson the room the stats take. */
  protected readonly inLesson = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => /\/learn\/[^/?#]+/.test(this.router.url)),
    ),
    { initialValue: /\/learn\/[^/?#]+/.test(this.router.url) },
  );
  private readonly preferences = inject(PreferencesStore, { optional: true });
  readonly copy = computed(
    () => STUDYLM_COPY[this.preferences?.language() ?? 'en'] ?? STUDYLM_COPY.en,
  );

  constructor() {
    // Created with the shell, so a link the learning app just sent back
    // (`#learning-link=…`) is read on any screen; then the lessons finished
    // before linking join the reviews (design §9).
    const reviews = inject(StudyLmReviews);
    if (this.standalone) this.notifications.start();
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
      return { ...screen, label, short: SHORT_LABELS[screen.id], count };
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

  readonly syncLabel = computed(() => {
    const c = this.copy().sync;
    switch (this.sync?.status()) {
      case 'synced':
        return c.navSynced;
      case 'syncing':
        return c.navSyncing;
      case 'offline':
        return c.navOffline;
      case 'failed':
        return c.navFailed;
      default:
        return c.navLocal;
    }
  });

  openSettingsModal(): void {
    this.store.setShowSettingsModal(true);
  }

  openSyncModal(): void {
    this.sync?.openModal();
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
