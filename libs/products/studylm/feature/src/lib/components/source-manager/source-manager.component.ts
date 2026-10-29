import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, SlicePipe, UpperCasePipe } from '@angular/common';
import { form, FormField, FormRoot, minLength, required } from '@angular/forms/signals';
import { StudyLmStore } from '../../store/studylm.store';
import type { AddSourceInput, SourceType, StudySource } from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-source-manager',
  imports: [FormField, FormRoot, DecimalPipe, SlicePipe, UpperCasePipe],
  templateUrl: './source-manager.component.html',
  styleUrl: './source-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceManagerComponent {
  readonly store = inject(StudyLmStore);

  readonly model = signal<AddSourceInput>({
    title: '',
    type: 'document',
    content: '',
    url: '',
  });

  readonly sourceForm = form(this.model, (path) => {
    required(path.title, { message: 'Source title is required' });
    minLength(path.title, 3, { message: 'Title must be at least 3 characters' });
    required(path.content, { message: 'Content or summary is required' });
    minLength(path.content, 20, { message: 'Please provide at least 20 characters for meaningful synthesis' });
  });

  setType(type: SourceType) {
    this.model.update((m) => ({ ...m, type }));
  }

  submitSource() {
    const val = this.model();
    if (!val.title.trim() || !val.content.trim()) return;

    this.store.addSource(val);
    this.model.set({
      title: '',
      type: 'document',
      content: '',
      url: '',
    });
  }

  cancelAdd() {
    this.store.toggleAddSourceModal(false);
  }

  previewSource(source: StudySource) {
    this.store.selectSourceForPreview(source);
  }

  closePreview() {
    this.store.selectSourceForPreview(null);
  }

  getSourceIcon(type: SourceType): string {
    switch (type) {
      case 'slide':
        return '📑';
      case 'link':
        return '🔗';
      case 'note':
        return '📝';
      case 'document':
      default:
        return '📄';
    }
  }
}
