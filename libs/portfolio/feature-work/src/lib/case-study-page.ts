import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { caseStudies, caseStudyBySlug } from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { Tag } from '@ah/ui';

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

  protected readonly study = computed(() => caseStudyBySlug(this.slug()));
  protected readonly next = computed(() => {
    const index = caseStudies.findIndex((s) => s.slug === this.slug());
    return index === -1
      ? undefined
      : caseStudies[(index + 1) % caseStudies.length];
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
