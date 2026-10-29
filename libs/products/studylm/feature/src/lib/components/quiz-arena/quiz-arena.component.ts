import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AhBadge,
  AhButton,
  AhCodeBlock,
  AhEmptyState,
  AhSegmentedControl,
  AhSelect,
  type AhSelectOption,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import {
  COMPETENCY_TIERS,
  type CompetencyTier,
  type StudyQuizQuestion,
} from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-quiz-arena',
  standalone: true,
  imports: [
    CommonModule,
    AhCodeBlock,
    AhButton,
    AhBadge,
    AhEmptyState,
    AhSegmentedControl,
    AhSelect,
  ],
  templateUrl: './quiz-arena.component.html',
  styleUrl: './quiz-arena.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizArenaComponent {
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
      label: `All Sections (${this.store.activeQuizQuestions().length} questions)`,
    },
    ...this.store.allSections().map((sec) => ({
      value: sec.id,
      label: `${sec.code} - ${sec.title}`,
      hint: `${sec.difficultyTier.toUpperCase()}${sec.officialDocs[0] ? ' · ' + sec.officialDocs[0].title : ''}`,
    })),
  ]);

  onSectionSelect(sectionId: string | null): void {
    this.store.setQuizSectionFilter(sectionId || 'all');
  }

  getQuestionDocLink(q: StudyQuizQuestion | null): { title: string; url: string } | null {
    if (!q) return null;

    const citation = q.sourceCitation?.trim() || '';
    if (citation.startsWith('http://') || citation.startsWith('https://')) {
      return { title: citation, url: citation };
    }

    if (q.sectionId) {
      const section = this.store
        .allSections()
        .find((s) => s.id === q.sectionId);
      if (section?.officialDocs && section.officialDocs.length > 0) {
        return {
          title: citation || section.officialDocs[0].title,
          url: section.officialDocs[0].url,
        };
      }
    }

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

    const portal = activeSubject?.roadmap?.officialDocPortal;
    if (portal) {
      return {
        title: citation || 'Official Documentation Reference',
        url: portal,
      };
    }

    return null;
  }

  selectOption(index: number): void {
    const question = this.store.currentQuizQuestion();
    if (!question || question.isAnswered) return;
    this.store.selectQuizAnswer(question.id, index);
  }

  setTier(tier: CompetencyTier | 'all'): void {
    this.store.setActiveTier(tier);
  }

  onSectionChange(event: Event): void {
    const sel = event.target as HTMLSelectElement;
    this.store.setQuizSectionFilter(sel.value);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  openAddQuestionModal(): void {
    this.store.setShowAddQuizModal(true);
  }

  openImportModal(): void {
    this.store.setShowJsonImportModal(true);
  }

  onResetQuiz(): void {
    this.store.resetQuiz();
  }

  onSubmitQuiz(): void {
    this.store.submitQuizSession();
  }

  onPrevQuestion(): void {
    this.store.prevQuizQuestion(this.store.filteredQuiz().length);
  }

  onNextQuestion(): void {
    this.store.nextQuizQuestion(this.store.filteredQuiz().length);
  }

  requestHint(q: StudyQuizQuestion): void {
    const subj = this.store.activeSubject()?.title || 'Software Engineering';
    this.store.requestHint({
      subject: subj,
      conceptTitle: q.sectionCode ? `Section ${q.sectionCode}` : 'Quiz Concept',
      difficultyTier: q.tier,
      sectionCode: q.sectionCode,
      promptOrQuestion: q.question,
      answerOrExplanation: q.explanation,
      codeSnippet: q.codeSnippet,
    });
  }

  requestDeepDive(q: StudyQuizQuestion): void {
    const subj = this.store.activeSubject()?.title || 'Software Engineering';
    this.store.requestDeepDive({
      subject: subj,
      conceptTitle: q.sectionCode ? `Section ${q.sectionCode} Invariants` : 'Architecture & Invariants',
      difficultyTier: q.tier,
      sectionCode: q.sectionCode,
      promptOrQuestion: q.question,
      answerOrExplanation: q.explanation,
      codeSnippet: q.codeSnippet,
    });
  }
}
