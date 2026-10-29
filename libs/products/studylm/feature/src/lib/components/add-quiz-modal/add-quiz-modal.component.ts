import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { StudyLmStore } from '../../store/studylm.store';
import type { CompetencyTier } from '@ah/products/studylm/domain';

interface AddQuizFormModel {
  tier: CompetencyTier;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
  explanation: string;
  sourceCitation: string;
}

@Component({
  selector: 'ah-add-quiz-modal',
  imports: [FormField, FormRoot],
  templateUrl: './add-quiz-modal.component.html',
  styleUrl: './add-quiz-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddQuizModalComponent {
  readonly store = inject(StudyLmStore);

  readonly model = signal<AddQuizFormModel>({
    tier: 'beginner',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctIndex: 0,
    explanation: '',
    sourceCitation: 'Manual Input',
  });

  readonly quizForm = form(this.model, (path) => {
    required(path.question, { message: 'Question statement is required' });
    minLength(path.question, 10, { message: 'Question must be at least 10 characters' });
    required(path.optionA, { message: 'Option A is required' });
    required(path.optionB, { message: 'Option B is required' });
    required(path.optionC, { message: 'Option C is required' });
    required(path.optionD, { message: 'Option D is required' });
    required(path.explanation, { message: 'Explanation / rationale is required' });
  });

  setTier(tier: CompetencyTier) {
    this.model.update((m) => ({ ...m, tier }));
  }

  setCorrectIndex(correctIndex: number) {
    this.model.update((m) => ({ ...m, correctIndex }));
  }

  submitQuiz() {
    const val = this.model();
    if (!val.question.trim() || !val.optionA.trim() || !val.optionB.trim()) return;

    this.store.createQuizQuestion({
      tier: val.tier,
      question: val.question,
      options: [val.optionA, val.optionB, val.optionC, val.optionD],
      correctIndex: val.correctIndex,
      explanation: val.explanation,
      sourceCitation: val.sourceCitation,
    });
  }

  close() {
    this.store.toggleAddQuizModal(false);
  }
}
