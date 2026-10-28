// src/app/exercises/quiz/quiz.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  computed,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { AhButton, SectionHeading, Tag } from '@ah/ui';
import { QuizService } from '../../shared/services/quiz.service';
import { QuizQuestion, Difficulty } from '../../shared/models/quiz.model';
import { NotificationService } from '../../shared/services/notification.service';

type QuizState = 'selecting' | 'in-progress' | 'finished';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [AhButton, Tag, SectionHeading],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent {
  private quizService = inject(QuizService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  quizState = signal<QuizState>('selecting');
  questions = signal<QuizQuestion[]>([]);
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
    this.questions.set(this.quizService.getQuestionsByDifficulty(difficulty));
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
      this.notificationService.show('Correct!', 'success');
    } else {
      this.notificationService.show(
        'Not quite! Review the concept for help.',
        'error',
      );
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
    this.questions.set([]);
    this.currentQuestionIndex.set(0);
    this.userAnswers.set({});
    this.selectedAnswer.set(null);
    this.score.set(0);
  }
}
