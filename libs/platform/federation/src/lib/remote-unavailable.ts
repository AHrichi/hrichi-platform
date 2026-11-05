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
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';

interface RemoteUnavailableCopy {
  needs: (missing: string) => string;
  needsDesc: (remote: string) => string;
  unreachable: string;
  unreachableDesc: (remote: string) => string;
  retry: string;
}

const UNAVAILABLE_COPY: Record<SiteLanguage, RemoteUnavailableCopy> = {
  en: {
    needs: (missing) => `This section needs ${missing}`,
    needsDesc: (remote) =>
      `The ${remote} micro-frontend needs a browser feature that is turned off or unsupported here. The rest of the site works as usual.`,
    unreachable: "This section didn't load",
    unreachableDesc: (remote) =>
      `The ${remote} micro-frontend is unreachable right now. The rest of the site still works.`,
    retry: 'Try again',
  },
  fr: {
    needs: (missing) => `Cette section nécessite ${missing}`,
    needsDesc: (remote) =>
      `Le micro-frontend ${remote} requiert une fonctionnalité de navigateur désactivée ou non prise en charge. Le reste du site continue de fonctionner normalement.`,
    unreachable: 'Impossible de charger cette section',
    unreachableDesc: (remote) =>
      `Le micro-frontend ${remote} est temporairement inaccessible. Le reste du site continue de fonctionner normalement.`,
    retry: 'Réessayer',
  },
  ar: {
    needs: (missing) => `يتطلب هذا القسم ${missing}`,
    needsDesc: (remote) =>
      `تتطلب الواجهة المصغرة ${remote} ميزة في المتصفح غير مدعومة أو تم تعطيلها. باقي أجزاء الموقع تعمل كالمعتاد.`,
    unreachable: 'تعذر تحميل هذا القسم',
    unreachableDesc: (remote) =>
      `الواجهة المصغرة ${remote} غير متاحة حاليًا. باقي أجزاء الموقع تعمل كالمعتاد.`,
    retry: 'إعادة المحاولة',
  },
  it: {
    needs: (missing) => `Questa sezione richiede ${missing}`,
    needsDesc: (remote) =>
      `Il micro-frontend ${remote} richiede una funzionalità del browser disattivata o non supportata. Il resto del sito continua a funzionare normalmente.`,
    unreachable: 'Impossibile caricare questa sezione',
    unreachableDesc: (remote) =>
      `Il micro-frontend ${remote} non è al momento raggiungibile. Il resto del sito continua a funzionare normalmente.`,
    retry: 'Riprova',
  },
  de: {
    needs: (missing) => `Dieser Bereich erfordert ${missing}`,
    needsDesc: (remote) =>
      `Das Micro-Frontend ${remote} benötigt eine Browserfunktion, die deaktiviert ist oder nicht unterstützt wird. Der Rest der Website funktioniert weiterhin wie gewohnt.`,
    unreachable: 'Dieser Bereich konnte nicht geladen werden',
    unreachableDesc: (remote) =>
      `Das Micro-Frontend ${remote} ist derzeit nicht erreichbar. Der Rest der Website funktioniert weiterhin wie gewohnt.`,
    retry: 'Erneut versuchen',
  },
};

const capabilityNames: Record<
  SiteLanguage,
  Record<RemoteCapability, string>
> = {
  en: {
    webgl: 'WebGL (3D graphics)',
    worker: 'Web Workers',
    indexeddb: 'IndexedDB storage',
  },
  fr: {
    webgl: 'WebGL (graphismes 3D)',
    worker: 'Web Workers',
    indexeddb: 'Stockage IndexedDB',
  },
  ar: {
    webgl: 'WebGL (رسوميات ثلاثية الأبعاد)',
    worker: 'Web Workers',
    indexeddb: 'تخزين IndexedDB',
  },
  it: {
    webgl: 'WebGL (grafica 3D)',
    worker: 'Web Workers',
    indexeddb: 'Archiviazione IndexedDB',
  },
  de: {
    webgl: 'WebGL (3D-Grafik)',
    worker: 'Web Workers',
    indexeddb: 'IndexedDB-Speicher',
  },
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
  private readonly preferences = inject(PreferencesStore, { optional: true });

  protected readonly remoteName: string =
    inject(ActivatedRoute).snapshot.data['remoteName'] ?? 'unknown';

  protected readonly copy = computed(() => {
    const lang = this.preferences?.language() ?? 'en';
    return UNAVAILABLE_COPY[lang] ?? UNAVAILABLE_COPY.en;
  });

  protected readonly missing = computed(() => {
    const failure = this.store.entityMap()[this.remoteName]?.failure;
    const lang = this.preferences?.language() ?? 'en';
    const names = capabilityNames[lang] ?? capabilityNames.en;
    return failure?.kind === 'capability'
      ? failure.missing.map((c) => names[c]).join(', ')
      : null;
  });

  /** Reload, because the router caches the fallback routes for this path. */
  protected retry(): void {
    this.document.defaultView?.location.reload();
  }
}
