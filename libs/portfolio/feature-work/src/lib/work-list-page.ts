import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { caseStudies } from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { LinkCard, SectionHeading } from '@ah/ui';

@Component({
  selector: 'ah-work-list-page',
  imports: [LinkCard, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ah-section ah-container ah-stack" style="--gap: var(--space-7)">
      <ah-section-heading
        [level]="1"
        eyebrow="Interactive Products"
        heading="Applications & Platforms"
        lead="Production-grade, fully interactive web applications demonstrating real-world logistics, operations coordination, financial modeling, and micro-frontend architecture."
      />
      <ul class="ah-grid" role="list">
        <li>
          <ah-link-card
            heading="PulseOps · Commercial Operations & Dispatch Hub"
            href="/apps/dispatch"
            eyebrow="Commercial Services · Logistics & Subcontractor Plants"
            summary="Full coordinator control center: 6-stage order Kanban, partner laundry plant tracking, driver route dispatch, simulated WhatsApp order intake, Google Sheets sync, and automated shift handover reports."
            [tags]="[
              'Angular 22',
              'NgRx SignalStore',
              'Logistics & Dispatch',
              'Google Sheets XLSX',
            ]"
          />
        </li>
        <li>
          <ah-link-card
            heading="StrategyApp · Financial Planning & Projection Engine"
            href="/apps/strategy"
            eyebrow="Fintech · Interactive Forecasting"
            summary="Multi-scenario financial projection engine, interactive budget ledgers, and cashflow modeling powered by client-side IndexedDB and NgRx SignalStore."
            [tags]="['Angular 22', 'IndexedDB', 'Chart.js', 'SignalStore']"
          />
        </li>
      </ul>

      <ah-section-heading
        [level]="2"
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
