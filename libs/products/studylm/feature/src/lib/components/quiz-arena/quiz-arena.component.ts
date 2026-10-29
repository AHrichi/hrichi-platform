import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StudyLmStore } from '../../store/studylm.store';
import {
  COMPETENCY_TIERS,
  type CompetencyTier,
} from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-quiz-arena',
  imports: [],
  templateUrl: './quiz-arena.component.html',
  styleUrl: './quiz-arena.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizArenaComponent {
  readonly store = inject(StudyLmStore);
  readonly tiersInfo = COMPETENCY_TIERS;

  selectOption(index: number) {
    const question = this.store.currentQuizQuestion();
    if (!question || question.isAnswered) return;
    this.store.answerQuiz(question.id, index);
  }

  setTier(tier: CompetencyTier | 'all') {
    this.store.setActiveTier(tier);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
