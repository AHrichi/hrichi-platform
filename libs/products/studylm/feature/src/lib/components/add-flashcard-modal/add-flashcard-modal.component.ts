import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { StudyLmStore } from '../../store/studylm.store';
import type { CompetencyTier, CreateFlashcardInput } from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-add-flashcard-modal',
  imports: [FormField, FormRoot],
  templateUrl: './add-flashcard-modal.component.html',
  styleUrl: './add-flashcard-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFlashcardModalComponent {
  readonly store = inject(StudyLmStore);

  readonly model = signal<CreateFlashcardInput>({
    tier: 'beginner',
    front: '',
    back: '',
    category: 'Core Concepts',
    sourceCitation: 'Manual Input',
  });

  readonly flashcardForm = form(this.model, (path) => {
    required(path.front, { message: 'Front prompt / question is required' });
    minLength(path.front, 5, { message: 'Front text must be at least 5 characters' });
    required(path.back, { message: 'Back answer / explanation is required' });
    minLength(path.back, 5, { message: 'Back text must be at least 5 characters' });
    required(path.category, { message: 'Category tag is required' });
  });

  setTier(tier: CompetencyTier) {
    this.model.update((m) => ({ ...m, tier }));
  }

  submitCard() {
    const val = this.model();
    if (!val.front.trim() || !val.back.trim()) return;

    this.store.createFlashcard(val);
  }

  close() {
    this.store.toggleAddFlashcardModal(false);
  }
}
