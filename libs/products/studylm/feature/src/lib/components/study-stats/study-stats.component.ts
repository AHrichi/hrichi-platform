import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StudyLmStore } from '../../store/studylm.store';
import { AhBadge, AhButton, AhMetricCard, AhProgressBar } from '@ah/ui';
import type { StudyLmTab } from '../../store/studylm.state';
import type { SubjectMasteryStats } from '../../store/studylm.computeds';

@Component({
  selector: 'ah-study-stats',
  imports: [AhBadge, AhButton, AhMetricCard, AhProgressBar, DecimalPipe],
  templateUrl: './study-stats.component.html',
  styleUrl: './study-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyStatsComponent {
  readonly store = inject(StudyLmStore);

  selectSubjectAndTab(subjectId: string, tab: StudyLmTab): void {
    this.store.setActiveSubject(subjectId);
    this.store.setActiveTab(tab);
  }
}
