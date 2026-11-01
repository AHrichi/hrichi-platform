import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  signal,
} from '@angular/core';
import type { PolePhoto } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

/** Photos per pole: enough for an as-built record without filling the phone. */
export const MAX_PHOTOS = 6;
const MAX_SIDE = 1280;
const QUALITY = 0.72;

/**
 * Shrinks a camera photo to at most 1280 px on its long side as a JPEG
 * (about 150–250 kB), so a project's photos stay small enough for the
 * phone's storage and for a backup file.
 */
export async function compressPhoto(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', QUALITY);
}

/** As-built photos of a pole: take them with the camera, or pick from the gallery. */
@Component({
  selector: 'lp-pole-photos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pole-photos.html',
  styleUrl: './pole-photos.scss',
})
export class PolePhotos {
  readonly photos = model<PolePhoto[]>([]);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly max = MAX_PHOTOS;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected async add(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = [...(input.files ?? [])].slice(
      0,
      MAX_PHOTOS - this.photos().length,
    );
    input.value = '';
    if (!files.length) return;
    this.busy.set(true);
    this.failed.set(false);
    try {
      const added: PolePhoto[] = [];
      for (const file of files) {
        added.push({
          id: `ph_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: await compressPhoto(file),
          takenAt: new Date().toISOString(),
        });
      }
      this.photos.set([...this.photos(), ...added]);
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }

  protected remove(id: string): void {
    this.photos.set(this.photos().filter((p) => p.id !== id));
  }
}
