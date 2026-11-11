import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  inject,
} from '@angular/core';
import { type CaptureItem, LearnThis } from '@ah/learning/client';
import { APP_MODE } from '@ah/platform/app-mode';
import { isAppEnabled } from '@ah/shared/content';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
import { StudyLmScreens } from '../../shell/studylm-screens';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { PreferencesStore } from '@ah/shared/state';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';
import {
  COMPETENCY_TIERS,
  type CompetencyTier,
  type MasteryRating,
  type RoadmapSection,
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
    LearnThis,
  ],
  templateUrl: './flashcard-deck.component.html',
  styleUrl: './flashcard-deck.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlashcardDeckComponent {
  readonly store = inject(StudyLmStore);
  protected readonly screens = inject(StudyLmScreens);
  private readonly preferences = inject(PreferencesStore, { optional: true });
  /**
   * The Learning Engine is reachable: always from standalone StudyLM (it
   * opens the learning app), and inside the portfolio only while the
   * learning app is visible there.
   */
  protected readonly learningOn =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone' ||
    isAppEnabled('learning');

  /** The current card as a capture for the Learning Engine (ADR-0024). */
  protected learnItems(card: {
    id: string;
    front: string;
    back: string;
    category: string;
  }): CaptureItem[] {
    return [
      {
        text: `${card.front}\n${card.back}`,
        source: {
          app: 'studylm',
          objectType: 'flashcard',
          objectId: card.id.slice(0, 120),
          deepLink: null,
          excerpt: card.category.slice(0, 500),
        },
      },
    ];
  }

  readonly copy = computed(
    () => STUDYLM_COPY[this.preferences?.language() ?? 'en'] ?? STUDYLM_COPY.en,
  );
  private readonly lessonService = inject(LessonGenerationService);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap);
  readonly tiersInfo = COMPETENCY_TIERS;

  constructor() {
    effect(() => {
      const qSec = this.queryParams()?.get('section');
      if (qSec && qSec !== this.store.cardFilter().sectionId) {
        this.store.setCardSectionFilter(qSec);
      }
    });
  }

  readonly activeSection = computed<RoadmapSection | null>(() => {
    const filterSecId = this.store.cardFilter().sectionId;
    if (filterSecId && filterSecId !== 'all') {
      return this.store.allSections().find((s) => s.id === filterSecId) ?? null;
    }
    const current = this.store.currentCard();
    if (current?.sectionId) {
      return (
        this.store.allSections().find((s) => s.id === current.sectionId) ?? null
      );
    }
    return null;
  });

  goToLesson(section: RoadmapSection): void {
    const subject = this.store.activeSubject();
    if (!subject) return;
    const lessonId = this.lessonService.idFor(subject, section);
    if (!this.lessonService.saved().has(lessonId)) {
      this.lessonService.start(subject, section);
    }
    void this.screens.goToLesson(lessonId);
  }

  goToQuiz(section: RoadmapSection): void {
    this.store.setQuizSectionFilter(section.id);
    void this.screens.goToSectionQuiz(section.id);
  }

  goToRoadmap(section: RoadmapSection): void {
    this.store.setSelectedSection(section.id);
    void this.screens.goToSectionRoadmap(section.id);
  }

  readonly tierOptions = computed<
    { label: string; value: CompetencyTier | 'all' }[]
  >(() => {
    const f = this.copy().flashcards;
    return [
      { label: f.allTiers, value: 'all' },
      { label: f.beginner, value: 'beginner' },
      { label: f.intermediate, value: 'intermediate' },
      { label: f.expert, value: 'expert' },
    ];
  });

  readonly sectionOptions = computed<AhSelectOption[]>(() => {
    const f = this.copy().flashcards;
    return [
      {
        value: 'all',
        label: `${f.allSections} (${this.store.activeFlashcards().length} ${f.cardsUnit})`,
      },
      ...this.store.allSections().map((sec) => ({
        value: sec.id,
        label: `${sec.code} - ${sec.title}`,
        hint: `${sec.difficultyTier.toUpperCase()}${sec.officialDocs[0] ? ' · ' + sec.officialDocs[0].title : ''}`,
      })),
    ];
  });

  onSectionSelect(sectionId: string | null): void {
    this.store.setCardSectionFilter(sectionId || 'all');
  }

  getCardDocLink(
    card: StudyFlashcard | null,
  ): { title: string; url: string } | null {
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

  formatCardSegments(
    text: string,
  ): { isLink: boolean; text: string; url?: string }[] {
    if (!text) return [];
    // Matches markdown links [label](url) OR standalone URLs (https?://[^\s)]+)
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s,)]+)/g;
    const segments: { isLink: boolean; text: string; url?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          isLink: false,
          text: text.substring(lastIndex, match.index),
        });
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
    // Typing in a field, clicking an interactive control, or anything behind an open dialog, isn't for the deck shortcuts.
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      (target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            'button, a, [role="button"], input, textarea, select, dialog',
          ))) ||
      document.querySelector('dialog[open], [role="dialog"]')
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

  requestHint(card: StudyFlashcard): void {
    const subj = this.store.activeSubject()?.title || 'Software Engineering';
    this.store.requestHint({
      subject: subj,
      conceptTitle: card.category || 'Core Specification Concept',
      difficultyTier: card.tier,
      sectionCode: card.sectionCode,
      promptOrQuestion: card.front,
      answerOrExplanation: card.back,
      codeSnippet: card.codeSnippet,
    });
  }

  requestDeepDive(card: StudyFlashcard): void {
    const subj = this.store.activeSubject()?.title || 'Software Engineering';
    this.store.requestDeepDive({
      subject: subj,
      conceptTitle: card.category || 'Architecture & Invariants',
      difficultyTier: card.tier,
      sectionCode: card.sectionCode,
      promptOrQuestion: card.front,
      answerOrExplanation: card.back,
      codeSnippet: card.codeSnippet,
    });
  }
}
