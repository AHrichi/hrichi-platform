import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
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
  AhSelect,
  type AhSelectOption,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import {
  COMPETENCY_TIERS,
  type CompetencyTier,
  type MasteryRating,
  type StudyFlashcard,
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
    AhSelect,
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

  readonly sectionOptions = computed<AhSelectOption[]>(() => [
    {
      value: 'all',
      label: `All Sections (${this.store.activeFlashcards().length} cards)`,
    },
    ...this.store.allSections().map((sec) => ({
      value: sec.id,
      label: `${sec.code} - ${sec.title}`,
      hint: `${sec.difficultyTier.toUpperCase()}${sec.officialDocs[0] ? ' · ' + sec.officialDocs[0].title : ''}`,
    })),
  ]);

  onSectionSelect(sectionId: string | null): void {
    this.store.setCardSectionFilter(sectionId || 'all');
  }

  getCardDocLink(card: StudyFlashcard | null): { title: string; url: string } | null {
    if (!card) return null;

    // 1. If sourceCitation itself is a URL:
    const citation = card.sourceCitation?.trim() || '';
    if (citation.startsWith('http://') || citation.startsWith('https://')) {
      return { title: citation, url: citation };
    }

    // 2. If the card belongs to a section with official docs:
    if (card.sectionId) {
      const section = this.store
        .allSections()
        .find((s) => s.id === card.sectionId);
      if (section?.officialDocs && section.officialDocs.length > 0) {
        return {
          title: citation || section.officialDocs[0].title,
          url: section.officialDocs[0].url,
        };
      }
    }

    // 3. Check active subject's sources for matching link:
    const activeSubject = this.store.activeSubject();
    if (activeSubject?.sources) {
      const matchingSource = activeSubject.sources.find(
        (s) =>
          s.type === 'link' &&
          (s.title === citation || s.content.startsWith('http')),
      );
      if (matchingSource && matchingSource.content.startsWith('http')) {
        return {
          title: citation || matchingSource.title,
          url: matchingSource.content,
        };
      }
    }

    // 4. Fallback to active subject's roadmap doc portal:
    const portal = activeSubject?.roadmap?.officialDocPortal;
    if (portal) {
      return {
        title: citation || 'Official Documentation Reference',
        url: portal,
      };
    }

    return null;
  }

  formatCardSegments(text: string): { isLink: boolean; text: string; url?: string }[] {
    if (!text) return [];
    // Matches markdown links [label](url) OR standalone URLs (https?://[^\s)]+)
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s,)]+)/g;
    const segments: { isLink: boolean; text: string; url?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ isLink: false, text: text.substring(lastIndex, match.index) });
      }
      if (match[1] && match[2]) {
        // Markdown link [label](url)
        segments.push({ isLink: true, text: match[1], url: match[2] });
      } else if (match[3]) {
        // Standalone URL
        segments.push({ isLink: true, text: match[3], url: match[3] });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({ isLink: false, text: text.substring(lastIndex) });
    }

    return segments.length > 0 ? segments : [{ isLink: false, text }];
  }

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
