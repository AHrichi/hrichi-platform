import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SectionHeading } from '@ah/ui';

/**
 * A lab's page around its remote: the intro, then the remote's routes. The
 * shell prerenders it, so the first paint and the LCP never wait for the
 * remote, and the body keeps a screen's height so the remote's arrival
 * doesn't push the footer around (ADR-0014). Remotes use it standalone too.
 */
@Component({
  selector: 'ah-lab-frame',
  imports: [RouterOutlet, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="lab ah-container" aria-labelledby="lab-heading">
      <ah-section-heading
        class="lab__intro"
        headingId="lab-heading"
        [level]="1"
        [eyebrow]="eyebrow()"
        [heading]="heading()"
        [lead]="lead()"
      />
      <div class="lab__body">
        <router-outlet />
      </div>
    </section>
  `,
  styles: `
    .lab {
      display: grid;
      gap: var(--space-5);
      padding-block: var(--space-7) var(--space-8);
    }
    .lab__intro {
      max-inline-size: var(--layout-prose);
    }
    .lab__body {
      min-block-size: 100svh;
    }
  `,
})
export class LabFrame {
  // Bound from the route's data in the shell (withComponentInputBinding).
  readonly eyebrow = input.required<string>();
  readonly heading = input.required<string>();
  readonly lead = input.required<string>();
}
