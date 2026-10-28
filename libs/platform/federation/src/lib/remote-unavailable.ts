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
  templateUrl: './remote-unavailable.html',
  styleUrl: './remote-unavailable.scss',
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
