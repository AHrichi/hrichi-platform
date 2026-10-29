import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { StudyLmStore } from '../../store/studylm.store';
import { PRESEEDED_STUDY_DECKS } from '@ah/products/studylm/domain';

interface CreateSubjectModel {
  title: string;
  description: string;
}

@Component({
  selector: 'ah-create-subject-modal',
  imports: [FormField, FormRoot],
  templateUrl: './create-subject-modal.component.html',
  styleUrl: './create-subject-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSubjectModalComponent {
  readonly store = inject(StudyLmStore);
  readonly sampleTemplates = PRESEEDED_STUDY_DECKS;

  readonly model = signal<CreateSubjectModel>({
    title: '',
    description: '',
  });

  readonly subjectForm = form(this.model, (path) => {
    required(path.title, { message: 'Subject title is required' });
    minLength(path.title, 3, { message: 'Subject title must be at least 3 characters' });
  });

  submitSubject() {
    const val = this.model();
    if (!val.title.trim()) return;
    this.store.createSubject({
      title: val.title,
      description: val.description,
    });
    this.model.set({ title: '', description: '' });
  }

  loadTemplate(templateId: string) {
    this.store.loadPreseededTemplate(templateId);
    this.store.toggleCreateSubjectModal(false);
  }

  close() {
    this.store.toggleCreateSubjectModal(false);
  }
}
