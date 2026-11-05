import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { getProfile } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { SectionHeading } from '@ah/ui';
import { ContactForm } from './contact/contact-form';
import { SERVICES_COPY } from './services-copy';

@Component({
  selector: 'ah-contact-page',
  imports: [ContactForm, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => SERVICES_COPY[this.preferences.language()] ?? SERVICES_COPY.en,
  );
  protected readonly profile = computed(() =>
    getProfile(this.preferences.language()),
  );

  constructor() {
    inject(Seo).update({
      title: 'Contact',
      description:
        'Contact Ahmed Hrichi about a full-time role or a freelance project: a contact form, email, LinkedIn and GitHub.',
      path: '/contact',
    });
  }
}
