import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { caseStudies } from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton, LinkCard, SectionHeading } from '@ah/ui';

@Component({
  selector: 'ah-work-list-page',
  imports: [AhButton, LinkCard, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ah-section ah-container ah-stack" style="--gap: var(--space-7)">
      <ah-section-heading
        [level]="1"
        eyebrow="Work"
        heading="Case studies"
        lead="The problem, the decisions I made and why, and what changed. Client work stays at the level of my CV: no client code or data."
      />
      <ul class="ah-grid" role="list">
        @for (study of studies; track study.slug) {
          <li>
            <ah-link-card
              [heading]="study.title"
              [href]="'/work/' + study.slug"
              [eyebrow]="study.client + ' · ' + study.period"
              [summary]="study.summary"
              [tags]="study.stack.slice(0, 4)"
            />
          </li>
        }
      </ul>

      <div
        class="ah-card ah-stack"
        style="--gap: var(--space-3); padding: var(--space-5); border-inline-start: 4px solid var(--color-accent-default);"
      >
        <p class="ah-eyebrow">Interactive Platforms</p>
        <h2 style="margin: 0; font-size: var(--font-size-400);">
          Looking for live runnable applications and labs?
        </h2>
        <p class="ah-muted" style="margin: 0;">
          Explore PulseOps (commercial logistics & dispatch), StrategyApp
          (wealth projection engine), Sky Lab (3D planetarium), and our RxJS and
          NgRx architecture workbenches in our dedicated hub.
        </p>
        <div>
          <a routerLink="/apps" ahButton="primary" size="sm"
            >Explore Apps & Labs →</a
          >
        </div>
      </div>
    </div>
  `,
})
export class WorkListPage {
  protected readonly studies = caseStudies;

  constructor() {
    inject(Seo).update({
      title: 'Case studies',
      description:
        'Case studies: instant 3D quoting, a schema-driven integration platform, a Three.js graphics library and this micro-frontend platform.',
      path: '/work',
    });
  }
}
