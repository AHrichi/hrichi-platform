import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { AhAlert, AhBadge, AhButton, AhModal } from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import {
  SE_DOMAINS,
  type SoftwareEngineeringDomain,
} from '@ah/products/studylm/domain';

interface CreateSubjectModel {
  title: string;
  domain: SoftwareEngineeringDomain;
  description: string;
}

@Component({
  selector: 'ah-create-subject-modal',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, AhModal, AhButton, AhAlert],
  templateUrl: './create-subject-modal.component.html',
  styleUrl: './create-subject-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSubjectModalComponent {
  readonly store = inject(StudyLmStore);
  readonly domains = SE_DOMAINS;

  readonly model = signal<CreateSubjectModel>({
    title: '',
    domain: 'languages-runtimes',
    description: '',
  });

  readonly subjectForm = form(this.model, (path) => {
    required(path.title, { message: 'Subject title is required' });
    minLength(path.title, 2, { message: 'Subject title must be at least 2 characters' });
  });

  selectSuggestedTopic(topic: string, domainId: SoftwareEngineeringDomain): void {
    this.model.update((m) => ({ ...m, title: topic, domain: domainId }));
  }

  submitSubject(autoGenerate = false): void {
    const val = this.model();
    if (!val.title.trim()) return;

    this.store.createSubject({
      title: val.title.trim(),
      domain: val.domain,
      description: val.description.trim() || undefined,
    });

    if (autoGenerate) {
      void this.store.generateRoadmapForSubject();
    }

    this.close();
  }

  close(): void {
    this.store.setShowCreateSubjectModal(false);
  }
}
