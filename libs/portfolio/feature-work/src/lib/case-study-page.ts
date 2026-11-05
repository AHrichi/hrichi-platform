import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getCaseStudies, getCaseStudyBySlug } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { Tag } from '@ah/ui';
import { WORK_COPY } from './work-copy';

@Component({
  selector: 'ah-case-study-page',
  imports: [RouterLink, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-study-page.html',
  styleUrl: './case-study-page.scss',
})
export class CaseStudyPage {
  /** Bound from the :slug route parameter. */
  readonly slug = input.required<string>();

  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => WORK_COPY[this.preferences.language()] ?? WORK_COPY.en,
  );
  protected readonly study = computed(() =>
    getCaseStudyBySlug(this.slug(), this.preferences.language()),
  );
  protected readonly next = computed(() => {
    const studies = getCaseStudies(this.preferences.language());
    const index = studies.findIndex((s) => s.slug === this.slug());
    return index === -1 ? undefined : studies[(index + 1) % studies.length];
  });

  constructor() {
    const seo = inject(Seo);
    effect(() => {
      const study = this.study();
      seo.update(
        study
          ? {
              title: study.title,
              description: study.summary,
              path: `/work/${study.slug}`,
              type: 'article',
            }
          : {
              title: 'Case study not found',
              description: 'This case study does not exist.',
              path: '/work',
            },
      );
    });
  }
}
