import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StudyLmStore } from '../../store/studylm.store';
import { AhBadge, AhButton, AhMetricCard, AhProgressBar } from '@ah/ui';
import {
  type StudyLmScreen,
  StudyLmScreens,
} from '../../shell/studylm-screens';

@Component({
  selector: 'ah-study-stats',
  imports: [AhBadge, AhButton, AhMetricCard, AhProgressBar, DecimalPipe],
  templateUrl: './study-stats.component.html',
  styleUrl: './study-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyStatsComponent {
  readonly store = inject(StudyLmStore);
  private readonly screens = inject(StudyLmScreens);

  selectSubjectAndTab(subjectId: string, screen: StudyLmScreen): void {
    this.store.setActiveSubject(subjectId);
    void this.screens.go(screen);
  }
}
