import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  getEducation,
  getExperience,
  getLanguages,
  getProfile,
  getSkills,
  rolePeriod,
  site,
} from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton } from '@ah/ui';
import { CV_COPY } from './cv-copy';

/**
 * The CV as a page. The deploy step prints this route to
 * /ahmed-hrichi-cv.pdf, so the site and the PDF never disagree.
 */
@Component({
  selector: 'ah-cv-page',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cv-page.html',
  styleUrl: './cv-page.scss',
})
export class CvPage {
  private readonly document = inject(DOCUMENT);
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => CV_COPY[this.preferences.language()] ?? CV_COPY.en,
  );
  protected readonly profile = computed(() =>
    getProfile(this.preferences.language()),
  );
  protected readonly pdfHref = `/${site.cvFile}`;
  protected readonly roles = computed(() => {
    const lang = this.preferences.language();
    return getExperience(lang).map((role) => ({
      ...role,
      period: rolePeriod(role, lang),
    }));
  });
  protected readonly skills = computed(() =>
    getSkills(this.preferences.language()),
  );
  protected readonly education = computed(() =>
    getEducation(this.preferences.language()),
  );
  protected readonly languages = computed(() =>
    getLanguages(this.preferences.language()),
  );

  constructor() {
    inject(Seo).update({
      title: 'CV',
      description: `CV of ${getProfile('en').name}, ${getProfile('en').role}: experience, skills, education and languages.`,
      path: '/cv',
    });
  }

  protected print(): void {
    this.document.defaultView?.print();
  }
}
