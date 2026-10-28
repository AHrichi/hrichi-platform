import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { profile } from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { SectionHeading } from '@ah/ui';
import { ContactForm } from './contact/contact-form';

@Component({
  selector: 'ah-contact-page',
  imports: [ContactForm, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact-page.html',
  styleUrl: './contact-page.scss',
})
export class ContactPage {
  protected readonly profile = profile;

  constructor() {
    inject(Seo).update({
      title: 'Contact',
      description:
        'Contact Ahmed Hrichi about a full-time role or a freelance project: a contact form, email, LinkedIn and GitHub.',
      path: '/contact',
    });
  }
}
