import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StudyLmStore } from '../../store/studylm.store';
import { PRESEEDED_STUDY_DECKS } from '@ah/products/studylm/domain';
import { SourceManagerComponent } from '../source-manager/source-manager.component';
import { StudyBriefComponent } from '../study-brief/study-brief.component';
import { FlashcardDeckComponent } from '../flashcard-deck/flashcard-deck.component';
import { QuizArenaComponent } from '../quiz-arena/quiz-arena.component';
import { AudioOverviewComponent } from '../audio-overview/audio-overview.component';
import { N8nSettingsModalComponent } from '../n8n-settings-modal/n8n-settings-modal.component';

@Component({
  selector: 'ah-studylm-shell',
  imports: [
    SourceManagerComponent,
    StudyBriefComponent,
    FlashcardDeckComponent,
    QuizArenaComponent,
    AudioOverviewComponent,
    N8nSettingsModalComponent,
  ],
  templateUrl: './studylm-shell.component.html',
  styleUrl: './studylm-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyLmShellComponent {
  readonly store = inject(StudyLmStore);
  readonly preseededDecks = PRESEEDED_STUDY_DECKS;

  selectPresetDeck(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.store.loadPreseededDeck(target.value);
    }
  }
}
