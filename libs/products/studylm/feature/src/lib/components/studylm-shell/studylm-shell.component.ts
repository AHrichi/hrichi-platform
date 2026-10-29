import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StudyLmStore } from '../../store/studylm.store';
import { SourceManagerComponent } from '../source-manager/source-manager.component';
import { StudyBriefComponent } from '../study-brief/study-brief.component';
import { FlashcardDeckComponent } from '../flashcard-deck/flashcard-deck.component';
import { QuizArenaComponent } from '../quiz-arena/quiz-arena.component';
import { N8nSettingsModalComponent } from '../n8n-settings-modal/n8n-settings-modal.component';
import { CreateSubjectModalComponent } from '../create-subject-modal/create-subject-modal.component';
import { AddFlashcardModalComponent } from '../add-flashcard-modal/add-flashcard-modal.component';
import { AddQuizModalComponent } from '../add-quiz-modal/add-quiz-modal.component';
import { JsonImportModalComponent } from '../json-import-modal/json-import-modal.component';

@Component({
  selector: 'ah-studylm-shell',
  imports: [
    SourceManagerComponent,
    StudyBriefComponent,
    FlashcardDeckComponent,
    QuizArenaComponent,
    N8nSettingsModalComponent,
    CreateSubjectModalComponent,
    AddFlashcardModalComponent,
    AddQuizModalComponent,
    JsonImportModalComponent,
  ],
  templateUrl: './studylm-shell.component.html',
  styleUrl: './studylm-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyLmShellComponent {
  readonly store = inject(StudyLmStore);

  selectSubject(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.store.setActiveSubject(target.value);
    }
  }

  deleteCurrentSubject() {
    const active = this.store.activeSubject();
    if (!active) return;
    if (confirm(`Are you sure you want to delete "${active.title}" and its study data?`)) {
      this.store.deleteSubject(active.id);
    }
  }
}
