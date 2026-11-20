import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LearnThis } from '@ah/learning/client';
import { APP_MODE } from '@ah/platform/app-mode';
import { markCheck } from '@ah/products/system-design/domain';
import {
  type CheckAnswerEvent,
  type ChoiceCheck,
  type NumericCheck,
  type OrderCheck,
  SdCheckChoice,
  SdCheckNumeric,
  SdCheckOrder,
  SdInlineText,
} from '@ah/products/system-design/ui';
import { isAppEnabled } from '@ah/shared/content';
import { PRACTICE_COPY } from '../../copy/practice-copy';
import {
  missedReviewItems,
  newRunId,
  type PracticeQuestion,
  type PracticeResult,
} from '../../practice/practice';
import { SdNav } from '../../services/sd-nav';
import { SystemDesignStore } from '../../store/system-design.store';

/** The current question, split by kind so the template stays typed. */
interface QuestionView {
  key: string;
  question: PracticeQuestion;
  choice: ChoiceCheck | null;
  numeric: NumericCheck | null;
  order: OrderCheck | null;
}

/**
 * One practice run (`sd-practice-run`), shared by `LessonPractice` and
 * `MixedPractice`: one question at a time through the `sd-check-*` widgets,
 * every answer marked with `markCheck` and saved to `attempts`, then a
 * summary with the score, the missed list and "Practice again".
 *
 * A new `questions` array starts a new run.
 */
@Component({
  selector: 'sd-practice-run',
  imports: [
    LearnThis,
    RouterLink,
    SdCheckChoice,
    SdCheckNumeric,
    SdCheckOrder,
    SdInlineText,
  ],
  templateUrl: './practice-run.html',
  styleUrl: './practice-run.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PracticeRun {
  readonly kind = input.required<'lesson' | 'mix'>();
  readonly questions = input.required<readonly PracticeQuestion[]>();
  /** "Practice again": the host builds a fresh question list. */
  readonly again = output<void>();

  protected readonly copy = PRACTICE_COPY;
  /** Same rule as StudyLM: standalone always, embedded only while visible. */
  protected readonly learningOn =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone' ||
    isAppEnabled('learning');

  private readonly store = inject(SystemDesignStore);
  private readonly nav = inject(SdNav);
  private readonly injector = inject(Injector);
  /** The shell route, so lesson links resolve from any practice depth. */
  protected readonly shellRoute = inject(ActivatedRoute).parent;
  private readonly focusTarget =
    viewChild<ElementRef<HTMLElement>>('focusTarget');

  protected readonly runId = linkedSignal(() => {
    this.questions();
    return newRunId();
  });
  protected readonly index = linkedSignal(() => {
    this.questions();
    return 0;
  });
  protected readonly results = linkedSignal<PracticeResult[]>(() => {
    this.questions();
    return [];
  });

  protected readonly total = computed(() => this.questions().length);
  protected readonly done = computed(
    () => this.total() > 0 && this.index() >= this.total(),
  );
  protected readonly answered = computed(
    () => this.results().length > this.index(),
  );
  protected readonly isLast = computed(() => this.index() === this.total() - 1);

  protected readonly view = computed<QuestionView | null>(() => {
    const question = this.questions()[this.index()];
    if (!question) return null;
    const check = question.check;
    return {
      key: `${this.runId()}:${this.index()}:${question.lessonId}:${check.id}`,
      question,
      choice: check.kind === 'choice' ? check : null,
      numeric: check.kind === 'numeric' ? check : null,
      order: check.kind === 'order' ? check : null,
    };
  });

  protected readonly correctCount = computed(
    () => this.results().filter((r) => r.correct).length,
  );
  protected readonly missed = computed(() =>
    this.results().filter((r) => !r.correct),
  );
  protected readonly reviewItems = computed(() =>
    missedReviewItems(this.missed()),
  );

  protected onAnswered(event: CheckAnswerEvent): void {
    const question = this.questions()[this.index()];
    if (!question || this.answered()) return;
    const marked = markCheck(question.check, event.response);
    this.results.update((list) => [
      ...list,
      {
        question,
        response: event.response,
        correct: marked.correct,
        expected: marked.expected,
      },
    ]);
    void this.store.recordAttempt(
      question.lessonId,
      question.check.id,
      event.response,
      marked.correct,
      undefined,
      { id: this.runId(), kind: this.kind(), size: this.total() },
    );
  }

  protected next(): void {
    if (!this.answered()) return;
    this.index.update((i) => i + 1);
    this.focusAfterRender();
  }

  protected review(question: PracticeQuestion): void {
    void this.nav.goToLesson(question.lessonId, question.stepNumber ?? 1);
  }

  protected lessonLink(question: PracticeQuestion): (string | number)[] {
    return ['learn', question.lessonId, question.stepNumber ?? 1];
  }

  private focusAfterRender(): void {
    afterNextRender(
      () => this.focusTarget()?.nativeElement.focus({ preventScroll: false }),
      { injector: this.injector },
    );
  }
}
