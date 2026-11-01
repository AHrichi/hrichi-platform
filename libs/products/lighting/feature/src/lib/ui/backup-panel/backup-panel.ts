import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AhButton } from '@ah/ui';
import {
  backupFileName,
  createBackup,
  readBackup,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';

type Status =
  | { kind: 'saved'; count: number }
  | { kind: 'restored'; count: number; skipped: number }
  | { kind: 'error'; message: string };

/**
 * Projects live in this browser's IndexedDB only, so this keeps a copy:
 * a JSON file saved to the device, or handed to the share sheet, where
 * Android offers Google Drive (and iOS Files or Drive) with no sign-in here.
 * Opening a backup restores it; the system file picker reaches Drive too.
 */
@Component({
  selector: 'lp-backup-panel',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './backup-panel.html',
  styleUrl: './backup-panel.scss',
})
export class BackupPanel {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  private readonly document = inject(DOCUMENT);

  /** True where the browser can share a file (most phones). */
  protected readonly canShare = signal(false);
  protected readonly status = signal<Status | null>(null);
  protected readonly message = computed(() => {
    const status = this.status();
    const b = this.t().backup;
    switch (status?.kind) {
      case 'saved':
        return `✓ ${b.saved(status.count)}`;
      case 'restored':
        return `✓ ${b.restored(status.count, status.skipped)}`;
      case 'error':
        return status.message;
      default:
        return '';
    }
  });

  constructor() {
    afterNextRender(() => {
      const probe = new File(['{}'], 'probe.json', {
        type: 'application/json',
      });
      this.canShare.set(
        typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [probe] }),
      );
    });
  }

  private file(): File {
    return new File([createBackup(this.store.projects())], backupFileName(), {
      type: 'application/json',
    });
  }

  protected download(): void {
    const file = this.file();
    const url = URL.createObjectURL(file);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    this.status.set({ kind: 'saved', count: this.store.projects().length });
  }

  protected async share(): Promise<void> {
    try {
      await navigator.share({
        files: [this.file()],
        title: this.t().backup.shareTitle,
      });
      this.status.set({ kind: 'saved', count: this.store.projects().length });
    } catch (error) {
      // Closing the share sheet is not an error worth showing.
      if ((error as DOMException)?.name !== 'AbortError') {
        this.status.set({
          kind: 'error',
          message: this.t().backup.shareFailed,
        });
      }
    }
  }

  protected async open(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const read = readBackup(await file.text());
    if ('error' in read) {
      this.status.set({
        kind: 'error',
        message: this.t().backup.errors[read.error],
      });
      return;
    }
    const count = await this.store.importProjects(read.projects);
    this.status.set({ kind: 'restored', count, skipped: read.skipped });
  }
}
