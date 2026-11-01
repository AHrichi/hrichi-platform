import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import { AhButton } from '@ah/ui';
import {
  backupFileName,
  createBackup,
  readBackup,
} from '@ah/products/basecamp/domain';
import { BasecampI18n } from '../../i18n/basecamp-i18n';
import { encodeTrip } from '../../services/share-link';
import { BasecampStore } from '../../store/basecamp.store';

/**
 * Sharing a trip and backing everything up, with no server: a link that
 * carries the trip in its fragment, and a JSON file of all trips and gear.
 */
@Component({
  selector: 'bc-share-panel',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './share-panel.html',
  styleUrl: './share-panel.scss',
})
export class SharePanel {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;
  private readonly document = inject(DOCUMENT);

  /** The last link made, shown so it can be copied by hand if need be. */
  protected readonly link = signal<string | null>(null);
  protected readonly status = signal<{ text: string; error: boolean } | null>(
    null,
  );

  protected async share(): Promise<void> {
    const trip = this.store.activeTrip();
    const location = this.document.defaultView?.location;
    if (!trip || !location) return;
    // The app's base: this page's path without its screen.
    const base = location.pathname.replace(/\/[^/]*$/, '');
    const link = `${location.origin}${base}/trips#${await encodeTrip(trip)}`;
    this.link.set(link);
    const navigator = this.document.defaultView?.navigator;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: this.t().share.shareText(trip.name),
          url: link,
        });
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator?.clipboard.writeText(link);
      this.status.set({ text: `✓ ${this.t().share.copied}`, error: false });
    } catch {
      // The link stays on screen to copy by hand.
    }
  }

  protected download(): void {
    const text = createBackup(this.store.trips(), this.store.gear());
    const file = new File([text], backupFileName(), {
      type: 'application/json',
    });
    const url = URL.createObjectURL(file);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  protected async restore(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const read = readBackup(await file.text());
    if ('error' in read) {
      this.status.set({ text: this.t().share.errors[read.error], error: true });
      return;
    }
    await this.store.restore(read.trips, read.gear);
    this.status.set({
      text: `✓ ${this.t().share.restored(read.trips.length, read.gear.length)}`,
      error: false,
    });
  }

  protected select(event: Event): void {
    (event.target as HTMLInputElement).select();
  }
}
