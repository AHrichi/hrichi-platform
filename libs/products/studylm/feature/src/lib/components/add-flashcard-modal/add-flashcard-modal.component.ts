import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { AhButton, AhModal, AhSegmentedControl } from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import type { CompetencyTier, CreateFlashcardInput } from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-add-flashcard-modal',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, AhModal, AhButton, AhSegmentedControl],
  templateUrl: './add-flashcard-modal.component.html',
  styleUrl: './add-flashcard-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFlashcardModalComponent {
  readonly store = inject(StudyLmStore);

  readonly tierOptions: { label: string; value: CompetencyTier }[] = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' },
  ];

  readonly model = signal<CreateFlashcardInput>({
    tier: 'beginner',
    front: '',
    back: '',
    category: 'Core Concepts',
    codeSnippet: '',
    codeLanguage: 'typescript',
    sourceCitation: 'Manual Input',
    sectionId: undefined,
  });

  readonly flashcardForm = form(this.model, (path) => {
    required(path.front, { message: 'Front prompt / question is required' });
    minLength(path.front, 5, { message: 'Front text must be at least 5 characters' });
    required(path.back, { message: 'Back answer / explanation is required' });
    minLength(path.back, 5, { message: 'Back text must be at least 5 characters' });
    required(path.category, { message: 'Category tag is required' });
  });

  setTier(tier: CompetencyTier): void {
    this.model.update((m) => ({ ...m, tier }));
  }

  submitCard(): void {
    const val = this.model();
    if (!val.front.trim() || !val.back.trim()) return;

    this.store.addManualFlashcard({
      ...val,
      sectionId: this.store.selectedSectionId() || undefined,
    });
    this.close();
  }

  close(): void {
    this.store.setShowAddFlashcardModal(false);
  }
}
