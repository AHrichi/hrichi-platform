import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  type ConnectRequest,
  decodeConnect,
  encodeLink,
  HOST_APP_NAMES,
  LINK_KEY,
} from '@ah/learning/contracts';
import { AhAlert, AhButton } from '@ah/ui';
import { guessDeviceName } from '../../store/device-name';
import { LearningStore } from '../../store/learning.store';

/**
 * A host app asks to link (design §9): `/connect#link=…`. On a paired
 * device the learner allows it, and the link goes back to the host in its
 * fragment, only ever to the host's own address (decodeConnect). Nothing
 * happens without the tap: the request could have come from any page.
 */
@Component({
  selector: 'lrn-connect-screen',
  imports: [AhAlert, AhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connect-screen.html',
  styleUrl: './connect-screen.scss',
})
export class ConnectScreen {
  protected readonly store = inject(LearningStore);
  protected readonly request = signal<ConnectRequest | null>(this.read());
  protected readonly appName = computed(() => {
    const request = this.request();
    return request ? HOST_APP_NAMES[request.app] : '';
  });
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Reads the request once and cleans the address. */
  private read(): ConnectRequest | null {
    const location = globalThis.location;
    if (!location) return null;
    const request = decodeConnect(location.hash);
    if (location.hash) {
      globalThis.history?.replaceState(history.state, '', location.pathname);
    }
    return request;
  }

  protected async allow(): Promise<void> {
    const request = this.request();
    if (!request || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const device = guessDeviceName(globalThis.navigator?.userAgent ?? '');
      const linked = await this.store.linkHost(
        request.app,
        `${this.appName()} on ${device}`,
      );
      globalThis.location?.assign(
        `${request.returnTo}#${LINK_KEY}=${encodeLink({
          token: linked.token,
          expiresAt: linked.expiresAt,
        })}`,
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : String(error));
      this.busy.set(false);
    }
  }

  protected decline(): void {
    const request = this.request();
    if (request) globalThis.location?.assign(request.returnTo);
  }
}
