import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Shown in place of a remote that failed to load; the rest of the shell keeps working. */
@Component({
  selector: 'ah-remote-unavailable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="remote-unavailable" role="alert">
      <h1>This section didn't load</h1>
      <p>
        The <code>{{ remoteName }}</code> micro-frontend is unreachable right
        now. The rest of the site still works.
      </p>
      <button type="button" (click)="retry()">Try again</button>
    </section>
  `,
  styles: `
    .remote-unavailable {
      max-inline-size: 40rem;
      margin-inline: auto;
      padding-block: 3rem;
    }
    button {
      font: inherit;
      padding-block: 0.5rem;
      padding-inline: 1rem;
      cursor: pointer;
    }
  `,
})
export class RemoteUnavailable {
  private readonly document = inject(DOCUMENT);
  protected readonly remoteName: string =
    inject(ActivatedRoute).snapshot.data['remoteName'] ?? 'unknown';

  /** Reload, because the router caches the fallback routes for this path. */
  protected retry(): void {
    this.document.defaultView?.location.reload();
  }
}
