import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  HYGIENE_TEXT_MAX,
  type HygieneAnswer,
  type HygieneItem,
  hygieneProgress,
  itemLabel,
  newId,
} from '@ah/products/greenhouse/domain';
import { GhButton, GhStatusChip } from '@ah/products/greenhouse/ui';
import { FieldI18n } from '../../i18n/field-i18n';
import { FieldStore } from '../../store/field.store';
import { shrinkPhoto } from './shrink-photo';

/**
 * Today's hygiene check of one greenhouse: each item fine or not, a note
 * when it isn't, photos where the farm asks for them, then the sign-off.
 * Everything is saved on the phone as it is touched; a signed check is
 * read-only.
 */
@Component({
  selector: 'gh-hygiene-screen',
  imports: [GhButton, GhStatusChip, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hygiene-screen.html',
  styleUrl: './hygiene-screen.scss',
})
export class HygieneScreen {
  /** From the route, `/hygiene/:greenhouseId`. */
  readonly greenhouseId = input.required<string>();

  protected readonly store = inject(FieldStore);
  protected readonly i18n = inject(FieldI18n);
  protected readonly t = this.i18n.t;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly greenhouse = computed(
    () =>
      this.store.greenhouses().find((g) => g.id === this.greenhouseId()) ??
      null,
  );
  /** The check as saved on the phone (with its sync status), if started. */
  protected readonly row = computed(
    () => this.store.checksByGreenhouse().get(this.greenhouseId()) ?? null,
  );
  /** The id a check started on this screen gets. */
  private readonly newCheckId = newId();
  protected readonly check = computed(() =>
    this.store.checkOf(this.greenhouseId(), this.newCheckId),
  );
  protected readonly signed = computed(() => Boolean(this.check().signedAt));
  protected readonly progress = computed(() =>
    hygieneProgress(this.store.hygieneItems(), this.check().answers),
  );
  protected readonly busy = signal(false);

  /** Object URLs of photos still on the phone, by path. */
  protected readonly thumbs = signal<ReadonlyMap<string, string>>(new Map());

  constructor() {
    // Show the photos the phone still holds; sent ones are on the server.
    effect(() => {
      const paths = this.check().answers.flatMap((a) => a.photoPaths);
      const known = this.thumbs();
      for (const path of paths) {
        if (known.has(path)) continue;
        void this.store.photo(path).then((blob) => {
          if (!blob || this.thumbs().has(path)) return;
          const url = URL.createObjectURL(blob);
          this.thumbs.update((m) => new Map(m).set(path, url));
        });
      }
    });
    inject(DestroyRef).onDestroy(() => {
      for (const url of this.thumbs().values()) URL.revokeObjectURL(url);
    });
  }

  protected label(item: HygieneItem): string {
    return itemLabel(item, this.i18n.lang());
  }

  protected answerOf(itemId: string): HygieneAnswer | null {
    return this.check().answers.find((a) => a.itemId === itemId) ?? null;
  }

  protected needsPhoto(itemId: string): boolean {
    return this.progress().missingPhotos.includes(itemId);
  }

  protected setOk(item: HygieneItem, ok: boolean): void {
    const answer = this.answerOf(item.id);
    void this.store.answer(this.check(), {
      itemId: item.id,
      ok,
      ...(answer?.note ? { note: answer.note } : {}),
      photoPaths: answer?.photoPaths ?? [],
    });
  }

  protected setNote(answer: HygieneAnswer, text: string): void {
    const note = text.trim().replace(/\s+/g, ' ').slice(0, HYGIENE_TEXT_MAX);
    if (note === (answer.note ?? '')) return;
    void this.store.answer(this.check(), {
      itemId: answer.itemId,
      ok: answer.ok,
      ...(note ? { note } : {}),
      photoPaths: answer.photoPaths,
    });
  }

  protected async addPhoto(
    answer: HygieneAnswer,
    box: HTMLInputElement,
  ): Promise<void> {
    const file = box.files?.[0];
    box.value = '';
    if (!file) return;
    this.busy.set(true);
    try {
      await this.store.addPhoto(this.check(), answer, await shrinkPhoto(file));
    } finally {
      this.busy.set(false);
    }
  }

  protected removePhoto(answer: HygieneAnswer, path: string): void {
    if (!this.window?.confirm(this.t().hygiene.removePhotoConfirm)) return;
    const url = this.thumbs().get(path);
    if (url) URL.revokeObjectURL(url);
    this.thumbs.update((m) => {
      const next = new Map(m);
      next.delete(path);
      return next;
    });
    void this.store.removePhoto(this.check(), answer, path);
  }

  protected sign(): void {
    if (!this.progress().complete) return;
    if (!this.window?.confirm(this.t().hygiene.signConfirm)) return;
    void this.store.sign(this.check());
  }
}
