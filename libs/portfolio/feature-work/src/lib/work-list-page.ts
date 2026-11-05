import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getCaseStudies } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton, LinkCard, SectionHeading } from '@ah/ui';
import { WORK_COPY } from './work-copy';

@Component({
  selector: 'ah-work-list-page',
  imports: [AhButton, LinkCard, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-list-page.html',
  styleUrl: './work-list-page.scss',
})
export class WorkListPage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => WORK_COPY[this.preferences.language()] ?? WORK_COPY.en,
  );
  protected readonly studies = computed(() =>
    getCaseStudies(this.preferences.language()),
  );

  constructor() {
    inject(Seo).update({
      title: 'Case studies',
      description:
        'Case studies: instant 3D quoting, a schema-driven integration platform, a Three.js graphics library and this micro-frontend platform.',
      path: '/work',
    });
  }
}
