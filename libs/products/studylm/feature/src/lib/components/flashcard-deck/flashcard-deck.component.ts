import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AhBadge,
  AhButton,
  AhCodeBlock,
  AhEmptyState,
  AhFlipCard,
  AhSegmentedControl,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import {
  COMPETENCY_TIERS,
  type CompetencyTier,
  type MasteryRating,
} from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-flashcard-deck',
  standalone: true,
  imports: [
    CommonModule,
    AhFlipCard,
    AhCodeBlock,
    AhButton,
    AhBadge,
    AhEmptyState,
    AhSegmentedControl,
  ],
  templateUrl: './flashcard-deck.component.html',
  styleUrl: './flashcard-deck.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlashcardDeckComponent {
  readonly store = inject(StudyLmStore);
  readonly tiersInfo = COMPETENCY_TIERS;

  readonly tierOptions: { label: string; value: CompetencyTier | 'all' }[] = [
    { label: 'All Tiers', value: 'all' },
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' },
  ];

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.store.flipCard();
    } else if (event.code === 'ArrowRight') {
      event.preventDefault();
      this.store.nextCard(this.store.filteredCards().length);
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault();
      this.store.prevCard(this.store.filteredCards().length);
    } else if (event.key === '1') {
      this.rate('again');
    } else if (event.key === '2') {
      this.rate('hard');
    } else if (event.key === '3') {
      this.rate('good');
    } else if (event.key === '4') {
      this.rate('easy');
    }
  }

  setTier(tier: CompetencyTier | 'all'): void {
    this.store.setActiveTier(tier);
  }

  onSectionChange(event: Event): void {
    const sel = event.target as HTMLSelectElement;
    this.store.setCardSectionFilter(sel.value);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.store.setCardSearchQuery(target.value);
  }

  rate(rating: MasteryRating): void {
    const card = this.store.currentCard();
    if (!card) return;
    this.store.rateCard(card.id, rating, this.store.filteredCards().length);
  }

  openAddCardModal(): void {
    this.store.setShowAddFlashcardModal(true);
  }

  exportAnki(): void {
    const subj = this.store.activeSubject();
    if (subj) {
      this.store.exportAnki(subj.title, this.store.filteredCards());
    }
  }
}
