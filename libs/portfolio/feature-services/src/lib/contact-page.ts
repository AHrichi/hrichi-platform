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
  template: `
    <div class="ah-section ah-container ah-stack" style="--gap: var(--space-7)">
      <ah-section-heading
        [level]="1"
        eyebrow="Contact"
        heading="Let's talk"
        lead="About a full-time role or a freelance project. The form reaches me directly; email works too."
      />
      <p class="ah-badge ah-badge--success">{{ profile.availability }}</p>

      <div class="layout">
        <ah-contact-form />

        <aside class="ah-stack" aria-label="Other ways to reach me">
          <dl class="details">
            <div>
              <dt>Email</dt>
              <dd>
                <a [href]="'mailto:' + profile.email">{{ profile.email }}</a>
              </dd>
            </div>
            <div>
              <dt>LinkedIn</dt>
              <dd>
                <a [href]="profile.linkedin" target="_blank" rel="noopener"
                  >linkedin.com/in/a-hrichi</a
                >
              </dd>
            </div>
            <div>
              <dt>GitHub</dt>
              <dd>
                <a [href]="profile.github" target="_blank" rel="noopener"
                  >github.com/AHrichi</a
                >
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{{ profile.location }} · {{ profile.workSetup }}</dd>
            </div>
            <div>
              <dt>Time zone</dt>
              <dd>{{ profile.timezone }}</dd>
            </div>
          </dl>
          <p class="ah-muted">
            Hiring? <a routerLink="/cv">My CV</a> has the details recruiters ask
            for first. A project? See <a routerLink="/services">services</a>.
          </p>
        </aside>
      </div>
    </div>
  `,
  styles: `
    .layout {
      display: grid;
      gap: var(--space-7);
      align-items: start;
    }
    @media (min-width: 60rem) {
      .layout {
        grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
      }
    }
    .details {
      display: grid;
      gap: var(--space-4);
    }
    dt {
      font-size: var(--font-size-100);
      color: var(--color-text-muted);
    }
    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
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
