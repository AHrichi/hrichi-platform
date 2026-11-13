import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningStore } from '../../store/learning.store';
import { injectStandaloneLearningUrl } from '../../store/standalone-url';

/**
 * How to use the Learning Engine, and how it works with StudyLM. Plain
 * text, one page, linked from the bar, an empty Today and Settings.
 */
@Component({
  selector: 'lrn-guide-screen',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide-screen.html',
  styleUrl: './guide-screen.scss',
})
export class GuideScreen {
  protected readonly store = inject(LearningStore);
  protected readonly standaloneUrl = injectStandaloneLearningUrl();
  private readonly document = inject(DOCUMENT);

  /**
   * In-page links scroll here: a bare `#id` would resolve against the
   * app's `<base href>` and leave the page, inside the portfolio too.
   */
  protected jump(event: Event, id: string): void {
    event.preventDefault();
    const section = this.document.getElementById(id);
    section?.scrollIntoView({ block: 'start' });
    section?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
}
