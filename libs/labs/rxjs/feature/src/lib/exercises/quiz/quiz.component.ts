// src/app/exercises/quiz/quiz.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { AhButton, AhCodeBlock, SectionHeading, Tag } from '@ah/ui';
import { QuizService } from '../../shared/services/quiz.service';
import { QuizQuestion, Difficulty } from '../../shared/models/quiz.model';
import { NotificationService } from '../../shared/services/notification.service';
import {
  injectRxjsLabCopy,
  injectRxjsLabLanguage,
} from '../../i18n/rxjs-lab-copy';

type QuizState = 'selecting' | 'in-progress' | 'finished';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [AhButton, Tag, SectionHeading, AhCodeBlock],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent {
  readonly copy = injectRxjsLabCopy();
  private readonly lang = injectRxjsLabLanguage();
  private quizService = inject(QuizService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  quizState = signal<QuizState>('selecting');
  selectedDifficulty = signal<Difficulty | null>(null);
  questions = computed<QuizQuestion[]>(() => {
    const diff = this.selectedDifficulty();
    return diff
      ? this.quizService.getQuestionsByDifficulty(diff, this.lang())
      : [];
  });
  currentQuestionIndex = signal(0);
  userAnswers = signal<Record<number, string>>({});
  selectedAnswer = signal<string | null>(null);
  score = signal(0);

  currentQuestion = computed(
    () => this.questions()[this.currentQuestionIndex()],
  );
  isAnswered = computed(() => !!this.userAnswers()[this.currentQuestion()?.id]);
  isCorrect = computed(() => {
    const question = this.currentQuestion();
    if (!question || !this.isAnswered()) return false;

    const userAnswer = this.userAnswers()
      [question.id].trim()
      .replace(/\(\)$/, '')
      .toLowerCase();
    const correctAnswer = question.answer
      .toString()
      .trim()
      .replace(/\(\)$/, '')
      .toLowerCase();

    return userAnswer === correctAnswer;
  });

  startQuiz(difficulty: Difficulty) {
    this.selectedDifficulty.set(difficulty);
    this.quizState.set('in-progress');
  }

  selectAnswer(option: string) {
    this.selectedAnswer.set(option);
  }

  submitAnswer() {
    if (this.selectedAnswer() === null) return;

    const questionId = this.currentQuestion().id;
    this.userAnswers.update((answers) => ({
      ...answers,
      [questionId]: this.selectedAnswer()!,
    }));

    if (this.isCorrect()) {
      this.score.update((s) => s + 1);
      this.notificationService.show(this.copy().quiz.correctToast, 'success');
    } else {
      this.notificationService.show(this.copy().quiz.incorrectToast, 'error');
    }
    this.selectedAnswer.set(null);
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.questions().length - 1) {
      this.currentQuestionIndex.update((i) => i + 1);
    } else {
      this.quizState.set('finished');
    }
  }

  navigateToConcept(conceptRoute: string) {
    const clean = conceptRoute.replace(/^\//, '');
    this.router.navigate(['../', clean], { relativeTo: this.route });
  }

  restart() {
    this.quizState.set('selecting');
    this.selectedDifficulty.set(null);
    this.currentQuestionIndex.set(0);
    this.userAnswers.set({});
    this.selectedAnswer.set(null);
    this.score.set(0);
  }
}
