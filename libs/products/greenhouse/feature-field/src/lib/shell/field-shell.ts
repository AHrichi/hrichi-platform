import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import {
  GhAppBar,
  GhButton,
  GhKitStyles,
  GhLangSwitch,
  GREENHOUSE_BRAND,
} from '@ah/products/greenhouse/ui';
import { isSiteLanguage } from '@ah/shared/state';
import { FIELD_LANGUAGES, FieldI18n } from '../i18n/field-i18n';
import { SignInScreen } from '../screens/sign-in/sign-in-screen';
import { FieldStore } from '../store/field.store';

/** The field app's frame: brand, language, and how sending is going. */
@Component({
  selector: 'gh-field-shell',
  imports: [
    GhKitStyles,
    GhAppBar,
    GhButton,
    GhLangSwitch,
    RouterOutlet,
    SignInScreen,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The greenhouse look, and the brand pack's colours when there is one.
  host: { 'data-look': 'greenhouse', '[attr.data-brand]': 'brand.id' },
  templateUrl: './field-shell.html',
  styleUrl: './field-shell.scss',
})
export class FieldShell {
  protected readonly store = inject(FieldStore);
  protected readonly brand = inject(GREENHOUSE_BRAND);
  protected readonly i18n = inject(FieldI18n);
  protected readonly t = this.i18n.t;
  protected readonly languages = FIELD_LANGUAGES;
  /** Sign-out was refused: entries are still waiting to be sent. */
  protected readonly signOutBlocked = signal(false);

  protected setLanguage(id: string): void {
    if (isSiteLanguage(id)) this.i18n.setLanguage(id);
  }

  protected async signOut(): Promise<void> {
    this.signOutBlocked.set((await this.store.signOut()) === 'pending');
  }

  constructor() {
    // The tab and task-switcher title follow a language switch.
    const title = inject(Title);
    effect(() => title.setTitle(this.t().app.name));
  }

  /** One line on sending, worst news first. */
  protected readonly syncLine = computed(() => {
    const t = this.t().sync;
    const { pending, rejected } = this.store.counts();
    switch (this.store.sync()) {
      case 'syncing':
        return t.syncing;
      case 'offline':
        return t.offline;
      case 'auth':
        return t.auth;
      case 'error':
        return t.error;
      case 'no-server':
        return t.noServer;
      case 'idle':
        if (pending > 0) return `${t.pending}: ${this.i18n.num(pending)}`;
        if (rejected > 0) return `${t.refused}: ${this.i18n.num(rejected)}`;
        return t.allSent;
    }
  });

  /** `ok`, `waiting` or `problem`, for the coloured dot. */
  protected readonly tone = computed(() => {
    const state = this.store.sync();
    const { pending, rejected } = this.store.counts();
    if (state === 'auth' || state === 'error' || rejected > 0) return 'problem';
    if (state === 'idle' && pending === 0) return 'ok';
    return 'waiting';
  });

  protected readonly canSend = computed(
    () =>
      this.store.counts().pending > 0 &&
      this.store.sync() !== 'syncing' &&
      this.store.sync() !== 'no-server',
  );
}
