import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SectionHeading } from '@ah/ui';
import { getLabIntro } from '@ah/shared/content';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';

const LAB_FRAME_ACTIONS: Record<
  SiteLanguage,
  {
    exitFullscreen: string;
    exitFullscreenAria: string;
    exitFullscreenTitle: string;
    enterFullscreen: string;
    enterFullscreenAria: string;
    enterFullscreenTitle: string;
  }
> = {
  en: {
    exitFullscreen: 'Exit Fullscreen',
    exitFullscreenAria: 'Exit fullscreen',
    exitFullscreenTitle: 'Exit fullscreen (Esc)',
    enterFullscreen: 'Fullscreen Remote',
    enterFullscreenAria: 'View remote in fullscreen',
    enterFullscreenTitle: 'Expand remote to fullscreen',
  },
  fr: {
    exitFullscreen: 'Quitter le plein écran',
    exitFullscreenAria: 'Quitter le mode plein écran',
    exitFullscreenTitle: 'Quitter le plein écran (Échap)',
    enterFullscreen: 'Plein écran',
    enterFullscreenAria: 'Afficher le module en plein écran',
    enterFullscreenTitle: 'Agrandir le module en plein écran',
  },
  ar: {
    exitFullscreen: 'إنهاء ملء الشاشة',
    exitFullscreenAria: 'الخروج من وضع ملء الشاشة',
    exitFullscreenTitle: 'الخروج من ملء الشاشة (Esc)',
    enterFullscreen: 'ملء الشاشة',
    enterFullscreenAria: 'عرض الوحدة في ملء الشاشة',
    enterFullscreenTitle: 'تكبير الوحدة إلى ملء الشاشة',
  },
  it: {
    exitFullscreen: 'Esci da schermo intero',
    exitFullscreenAria: 'Esci dalla modalità a schermo intero',
    exitFullscreenTitle: 'Esci da schermo intero (Esc)',
    enterFullscreen: 'Schermo intero',
    enterFullscreenAria: 'Visualizza a schermo intero',
    enterFullscreenTitle: 'Espandi a schermo intero',
  },
  de: {
    exitFullscreen: 'Vollbild beenden',
    exitFullscreenAria: 'Vollbildmodus beenden',
    exitFullscreenTitle: 'Vollbild beenden (Esc)',
    enterFullscreen: 'Vollbild',
    enterFullscreenAria: 'Modul im Vollbildmodus anzeigen',
    enterFullscreenTitle: 'Modul auf Vollbild vergrößern',
  },
};

/**
 * A lab's page around its remote: the intro, then the remote's routes. The
 * shell prerenders it, so the first paint and the LCP never wait for the
 * remote, and the body keeps a screen's height so the remote's arrival
 * doesn't push the footer around (ADR-0014). Remotes use it standalone too.
 */
@Component({
  selector: 'ah-lab-frame',
  imports: [RouterOutlet, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lab-frame.html',
  styleUrl: './lab-frame.scss',
})
export class LabFrame {
  // Bound from the route's data in the shell (withComponentInputBinding).
  readonly eyebrow = input<string>();
  readonly heading = input<string>();
  readonly lead = input<string>();
  readonly labKey = input<string>();

  private readonly preferences = inject(PreferencesStore, { optional: true });

  readonly displayEyebrow = computed(() => {
    const lang = this.preferences?.language() ?? 'en';
    const key = this.labKey();
    if (key) {
      const intro = getLabIntro(key, lang);
      if (intro?.eyebrow) return intro.eyebrow;
    }
    return this.eyebrow() ?? '';
  });

  readonly displayHeading = computed(() => {
    const lang = this.preferences?.language() ?? 'en';
    const key = this.labKey();
    if (key) {
      const intro = getLabIntro(key, lang);
      if (intro?.heading) return intro.heading;
    }
    return this.heading() ?? '';
  });

  readonly displayLead = computed(() => {
    const lang = this.preferences?.language() ?? 'en';
    const key = this.labKey();
    if (key) {
      const intro = getLabIntro(key, lang);
      if (intro?.lead) return intro.lead;
    }
    return this.lead() ?? '';
  });

  readonly actionsCopy = computed(() => {
    const lang = this.preferences?.language() ?? 'en';
    return LAB_FRAME_ACTIONS[lang] ?? LAB_FRAME_ACTIONS.en;
  });

  readonly isFullscreen = signal(false);
  private readonly labBody = viewChild<ElementRef<HTMLElement>>('labBody');
  private readonly document = inject(DOCUMENT);

  constructor() {
    const onFullscreenChange = () => {
      const el = this.labBody()?.nativeElement;
      const active = !!el && this.document.fullscreenElement === el;
      this.isFullscreen.set(active);
      if (!active && el) {
        el.classList.remove('is-fullscreen');
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isFullscreen()) {
        void this.exitFullscreen();
      }
    };

    this.document.addEventListener('fullscreenchange', onFullscreenChange);
    this.document.addEventListener('keydown', onKeyDown);

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener('fullscreenchange', onFullscreenChange);
      this.document.removeEventListener('keydown', onKeyDown);
    });
  }

  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }

  async enterFullscreen(): Promise<void> {
    const el = this.labBody()?.nativeElement;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        el.classList.add('is-fullscreen');
        this.isFullscreen.set(true);
      }
    } catch {
      el.classList.add('is-fullscreen');
      this.isFullscreen.set(true);
    }
  }

  async exitFullscreen(): Promise<void> {
    const el = this.labBody()?.nativeElement;
    try {
      if (this.document.fullscreenElement) {
        await this.document.exitFullscreen();
      }
    } catch {
      // Ignore exit failures
    }
    el?.classList.remove('is-fullscreen');
    this.isFullscreen.set(false);
  }
}
