import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mailto, profile } from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { ActionLink, SectionHeading } from '@ah/ui';

@Component({
  selector: 'ah-contact-page',
  imports: [ActionLink, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ah-section ah-container ah-stack" style="--gap: var(--space-7)">
      <ah-section-heading
        [level]="1"
        eyebrow="Contact"
        heading="Let's talk"
        lead="Email is the fastest way to reach me, for a full-time role or a freelance project."
      />
      <p class="ah-badge ah-badge--success">{{ profile.availability }}</p>

      <div class="ah-grid" style="--min: 18rem">
        <section class="ah-card" aria-labelledby="hiring-heading">
          <h2 id="hiring-heading" class="card-title">Hiring?</h2>
          <p class="ah-muted">
            For full-time roles. My CV has the details recruiters ask for first.
          </p>
          <div class="ah-cluster">
            <ah-action-link [link]="hiring" />
            <a routerLink="/cv">View CV</a>
          </div>
        </section>
        <section class="ah-card" aria-labelledby="project-heading">
          <h2 id="project-heading" class="card-title">A project?</h2>
          <p class="ah-muted">
            A few lines on the goal, the timeline and your stack are enough to
            start.
          </p>
          <div class="ah-cluster">
            <ah-action-link [link]="project" />
            <a routerLink="/services">Services</a>
          </div>
        </section>
      </div>

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
    </div>
  `,
  styles: `
    .card-title {
      font-size: var(--font-size-500);
    }
    .details {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
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
  protected readonly hiring = {
    label: 'Email about a role',
    href: mailto('Opportunity for Ahmed Hrichi'),
  };
  protected readonly project = {
    label: 'Email about a project',
    href: mailto('Project enquiry'),
  };

  constructor() {
    inject(Seo).update({
      title: 'Contact',
      description:
        'Contact Ahmed Hrichi about a full-time role or a freelance project: email, LinkedIn and GitHub.',
      path: '/contact',
    });
  }
}
