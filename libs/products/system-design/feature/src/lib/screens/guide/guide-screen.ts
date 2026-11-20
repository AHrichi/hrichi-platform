import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GUIDE_COPY } from '../../copy/guide-copy';

/**
 * Guide screen (`sd-guide-screen`): how to use the stepped lessons, keyboard
 * shortcuts, what is saved locally, and how the Learning Engine hand-off works.
 */
@Component({
  selector: 'sd-guide-screen',
  imports: [RouterLink],
  templateUrl: './guide-screen.html',
  styleUrl: './guide-screen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideScreen {
  protected readonly copy = GUIDE_COPY;
  private readonly document = inject(DOCUMENT);

  protected jump(event: Event, id: string): void {
    event.preventDefault();
    const section = this.document.getElementById(id);
    section?.scrollIntoView?.({ block: 'start' });
    section?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
}
