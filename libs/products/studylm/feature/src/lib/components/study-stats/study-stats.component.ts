import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { StudyLmStore } from '../../store/studylm.store';
import { AhBadge, AhButton, AhMetricCard, AhProgressBar } from '@ah/ui';
import {
  type StudyLmScreen,
  StudyLmScreens,
} from '../../shell/studylm-screens';
import { PreferencesStore } from '@ah/shared/state';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';
import { ReviewsPanelComponent } from '../reviews-panel/reviews-panel.component';

@Component({
  selector: 'ah-study-stats',
  imports: [
    AhBadge,
    AhButton,
    AhMetricCard,
    AhProgressBar,
    DecimalPipe,
    ReviewsPanelComponent,
  ],
  templateUrl: './study-stats.component.html',
  styleUrl: './study-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyStatsComponent {
  readonly store = inject(StudyLmStore);
  private readonly screens = inject(StudyLmScreens);
  private readonly preferences = inject(PreferencesStore, { optional: true });
  readonly copy = computed(
    () => STUDYLM_COPY[this.preferences?.language() ?? 'en'] ?? STUDYLM_COPY.en,
  );

  selectSubjectAndTab(subjectId: string, screen: StudyLmScreen): void {
    this.store.setActiveSubject(subjectId);
    void this.screens.go(screen);
  }
}
