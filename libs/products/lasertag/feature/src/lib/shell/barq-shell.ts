import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import type { Lang } from '@ah/products/lasertag/domain';
import { AhSegmentedControl } from '@ah/ui';
import { BARQ_LANGUAGES, BarqI18n } from '../i18n/barq-i18n';
import { BarqSession } from '../state/barq-session';
import { BoltMark } from '../ui/bolt-mark';

/** BARQ's frame: the brand, the places to go, the language, the page. */
@Component({
  selector: 'lt-shell',
  imports: [
    AhSegmentedControl,
    BoltMark,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './barq-shell.html',
  styleUrl: './barq-shell.scss',
})
export class BarqShell {
  protected readonly i18n = inject(BarqI18n);
  protected readonly session = inject(BarqSession);
  private readonly router = inject(Router);

  protected readonly languages = BARQ_LANGUAGES.map((l) => ({
    value: l.id,
    label: l.nativeName,
  }));
  protected readonly isStaff = computed(
    () => this.session.staffVenues().length > 0,
  );

  constructor() {
    const title = inject(Title);
    effect(() => {
      const t = this.i18n.t();
      title.setTitle(`${t.app.name} · ${t.app.tagline}`);
    });
    // Learn early whether the service is on, so the banner can say so.
    void this.session.api();
  }

  protected setLanguage(lang: Lang): void {
    this.i18n.setLanguage(lang);
  }

  protected signOut(): void {
    this.session.signOut();
    void this.router.navigateByUrl('/');
  }
}
