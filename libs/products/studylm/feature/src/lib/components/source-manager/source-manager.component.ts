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

  openAddSource() {
    this.store.setEditingSource(null);
    this.model.set({
      title: '',
      type: 'document',
      content: '',
      url: '',
    });
    this.store.setShowAddSourceModal(true);
  }

  openEditSource(source: StudySource, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.model.set({
      title: source.title,
      type: source.type,
      content: source.content,
      url: source.url,
    });
    this.store.setEditingSource(source);
  }

  submitSource() {
    const val = this.model();
    if (!val.title.trim() || !val.content.trim()) return;

    const currentEditing = this.store.editingSource();
    if (currentEditing) {
      this.store.updateSource({
        id: currentEditing.id,
        title: val.title,
        type: val.type,
        content: val.content,
        url: val.url,
      });
    } else {
      this.store.addSource(val);
    }

    this.model.set({
      title: '',
      type: 'document',
      content: '',
      url: '',
    });
  }

  cancelAdd() {
    this.store.setEditingSource(null);
    this.store.setShowAddSourceModal(false);
  }

  previewSource(source: StudySource) {
    this.store.setSelectedSourceForPreview(source);
  }

  closePreview() {
    this.store.setSelectedSourceForPreview(null);
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
