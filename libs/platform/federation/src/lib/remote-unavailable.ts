import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FederationStore } from './federation.store';
import type { RemoteCapability } from './remote-contract';

const capabilityNames: Record<RemoteCapability, string> = {
  webgl: 'WebGL (3D graphics)',
  worker: 'Web Workers',
  indexeddb: 'IndexedDB storage',
};

/**
 * Shown in place of a remote that can't run, inside the lab's frame; the rest
 * of the shell keeps working. A missing browser feature gets its own message, because trying
 * again won't help.
 */
@Component({
  selector: 'ah-remote-unavailable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="remote-unavailable" role="alert">
      @if (missing(); as missing) {
        <h2>This section needs {{ missing }}</h2>
        <p>
          The <code>{{ remoteName }}</code> micro-frontend needs a browser
          feature that is turned off or unsupported here. The rest of the site
          works as usual.
        </p>
      } @else {
        <h2>This section didn't load</h2>
        <p>
          The <code>{{ remoteName }}</code> micro-frontend is unreachable right
          now. The rest of the site still works.
        </p>
        <button type="button" (click)="retry()">Try again</button>
      }
    </section>
  `,
  styles: `
    .remote-unavailable {
      max-inline-size: var(--layout-prose);
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
  private readonly store = inject(FederationStore);
  protected readonly remoteName: string =
    inject(ActivatedRoute).snapshot.data['remoteName'] ?? 'unknown';

  protected readonly missing = computed(() => {
    const failure = this.store.entityMap()[this.remoteName]?.failure;
    return failure?.kind === 'capability'
      ? failure.missing.map((c) => capabilityNames[c]).join(' and ')
      : null;
  });

  /** Reload, because the router caches the fallback routes for this path. */
  protected retry(): void {
    this.document.defaultView?.location.reload();
  }
}
