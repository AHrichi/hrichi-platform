import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AhBadge,
  AhButton,
  AhCodeBlock,
  AhEmptyState,
  AhSegmentedControl,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import {
  COMPETENCY_TIERS,
  type CompetencyTier,
} from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-quiz-arena',
  standalone: true,
  imports: [
    CommonModule,
    AhCodeBlock,
    AhButton,
    AhBadge,
    AhEmptyState,
    AhSegmentedControl,
  ],
  templateUrl: './quiz-arena.component.html',
  styleUrl: './quiz-arena.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizArenaComponent {
  readonly store = inject(StudyLmStore);
  readonly tiersInfo = COMPETENCY_TIERS;

  readonly tierOptions: { label: string; value: CompetencyTier | 'all' }[] = [
    { label: 'All Tiers', value: 'all' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' },
  ];

  selectOption(index: number): void {
    const question = this.store.currentQuizQuestion();
    if (!question || question.isAnswered) return;
    this.store.selectQuizAnswer(question.id, index);
  }

  setTier(tier: CompetencyTier | 'all'): void {
    this.store.setActiveTier(tier);
  }

  onSectionChange(event: Event): void {
    const sel = event.target as HTMLSelectElement;
    this.store.setQuizSectionFilter(sel.value);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  openAddQuestionModal(): void {
    this.store.setShowAddQuizModal(true);
  }

  openImportModal(): void {
    this.store.setShowJsonImportModal(true);
  }

  onResetQuiz(): void {
    this.store.resetQuiz();
  }

  onSubmitQuiz(): void {
    this.store.submitQuizSession();
  }

  onPrevQuestion(): void {
    this.store.prevQuizQuestion(this.store.filteredQuiz().length);
  }

  onNextQuestion(): void {
    this.store.nextQuizQuestion(this.store.filteredQuiz().length);
  }
}
