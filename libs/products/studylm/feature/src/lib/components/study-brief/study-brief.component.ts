import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StudyLmStore } from '../../store/studylm.store';
import { COMPETENCY_TIERS, type CompetencyTier } from '@ah/products/studylm/domain';

@Component({
  selector: 'ah-study-brief',
  imports: [],
  templateUrl: './study-brief.component.html',
  styleUrl: './study-brief.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyBriefComponent {
  readonly store = inject(StudyLmStore);
  readonly tiersInfo = COMPETENCY_TIERS;

  jumpToTier(tier: CompetencyTier, tab: 'flashcards' | 'quiz') {
    this.store.setActiveTier(tier);
    this.store.setActiveTab(tab);
  }
}
