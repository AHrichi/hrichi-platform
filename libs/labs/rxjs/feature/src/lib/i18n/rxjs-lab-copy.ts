import { computed, inject, type Signal } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import type { LabCategory } from '../navigation/navigation.component';
import { TIER1_COPY, type Tier1Copy } from './tier1-copy';
import { TIER2_COPY, type Tier2Copy } from './tier2-copy';
import { TIER3_COPY, type Tier3Copy } from './tier3-copy';

export interface RxjsCommonCopy {
  focusedView: string;
  focusedPrefix: string;
  showAll: string;
  showAllTitle: string;
  filterUseCases: string;
  reset: string;
  resetAll: string;
  resetStreamState: string;
  loading: string;
  showCodeExample: string;
  hideCodeExample: string;
  showCode: string;
  hideCode: string;
  na: string;
}

export interface RxjsShellCopy {
  title: string;
  subtitle: string;
  toggleDrawerAria: string;
  collapseNav: string;
  expandNav: string;
}

export interface RxjsNavCopy {
  ariaLabel: string;
  categories: readonly LabCategory[];
}

export interface RxjsLabCopy extends Tier1Copy, Tier2Copy, Tier3Copy {
  common: RxjsCommonCopy;
  shell: RxjsShellCopy;
  nav: RxjsNavCopy;
}

const SHELL_NAV_COPY: Record<
  SiteLanguage,
  { common: RxjsCommonCopy; shell: RxjsShellCopy; nav: RxjsNavCopy }
> = {
  en: {
    common: {
      focusedView: 'Focused View',
      focusedPrefix: 'Focused:',
      showAll: 'Show All',
      showAllTitle: 'Show all use cases in parallel',
      filterUseCases: 'Filter use cases',
      reset: 'Reset',
      resetAll: 'Reset All',
      resetStreamState: 'Reset Stream State',
      loading: 'Loading...',
      showCodeExample: 'Show Code Example',
      hideCodeExample: 'Hide Code Example',
      showCode: 'Show Code',
      hideCode: 'Hide Code',
      na: 'N/A',
    },
    shell: {
      title: 'RxJS Practice Pad',
      subtitle: 'Interactive stream laboratory',
      toggleDrawerAria: 'Toggle navigation drawer',
      collapseNav: 'Collapse navigation',
      expandNav: 'Expand navigation',
    },
    nav: {
      ariaLabel: 'RxJS Lab navigation',
      categories: [
        {
          id: 'foundations',
          title: 'Core Mechanics',
          badge: 'Tier 1',
          exercises: [
            {
              path: './error-handling',
              label: 'Error Handling',
              description: 'catchError, retry, throwError',
              icon: 'alert-circle',
            },
            {
              path: './combining-streams',
              label: 'Combining Streams',
              description: 'withLatestFrom, combineLatest',
              icon: 'git-merge',
            },
            {
              path: './transforming-streams',
              label: 'Transforming Streams',
              description: 'concatMap, switchMap, mergeMap',
              icon: 'git-branch',
            },
            {
              path: './sharing-data',
              label: 'Sharing Data',
              description: 'Subject, BehaviorSubject',
              icon: 'share-2',
            },
          ],
        },
        {
          id: 'architecture',
          title: 'Production Resilience',
          badge: 'Tier 2',
          exercises: [
            {
              path: './multicasting',
              label: 'Multicasting',
              description: 'Hot vs Cold, shareReplay',
              icon: 'cast',
            },
            {
              path: './reactive-caching',
              label: 'Reactive Caching',
              description: 'Cache-then-network, TTL',
              icon: 'database',
            },
            {
              path: './bulk-operations',
              label: 'Bulk Operations',
              description: 'forkJoin, bufferCount, toArray',
              icon: 'layers',
            },
          ],
        },
        {
          id: 'angular22',
          title: 'Angular 22 & Interop',
          badge: 'Tier 3',
          exercises: [
            {
              path: './signals',
              label: 'Power of Signals',
              description: 'signal, linkedSignal, rxResource',
              icon: 'zap',
            },
            {
              path: './rxjs-vs-signals',
              label: 'RxJS vs Signals',
              description: 'Mental models & Coexistence',
              icon: 'refresh-cw',
            },
            {
              path: './quiz',
              label: 'RxJS Challenge',
              description: 'Interactive mastery test',
              icon: 'award',
            },
          ],
        },
      ],
    },
  },
  fr: {
    common: {
      focusedView: 'Vue ciblée',
      focusedPrefix: 'Ciblé :',
      showAll: 'Tout afficher',
      showAllTitle: 'Afficher tous les cas d’usage en parallèle',
      filterUseCases: 'Filtrer les cas d’usage',
      reset: 'Réinitialiser',
      resetAll: 'Tout réinitialiser',
      resetStreamState: 'Réinitialiser l’état du flux',
      loading: 'Chargement...',
      showCodeExample: 'Afficher l’exemple de code',
      hideCodeExample: 'Masquer l’exemple de code',
      showCode: 'Afficher le code',
      hideCode: 'Masquer le code',
      na: 'N/D',
    },
    shell: {
      title: 'Atelier RxJS',
      subtitle: 'Laboratoire interactif de flux',
      toggleDrawerAria: 'Basculer le tiroir de navigation',
      collapseNav: 'Réduire la navigation',
      expandNav: 'Développer la navigation',
    },
    nav: {
      ariaLabel: 'Navigation du laboratoire RxJS',
      categories: [
        {
          id: 'foundations',
          title: 'Mécaniques de base',
          badge: 'Niveau 1',
          exercises: [
            {
              path: './error-handling',
              label: 'Gestion des erreurs',
              description: 'catchError, retry, throwError',
              icon: 'alert-circle',
            },
            {
              path: './combining-streams',
              label: 'Combiner des flux',
              description: 'withLatestFrom, combineLatest',
              icon: 'git-merge',
            },
            {
              path: './transforming-streams',
              label: 'Transformer des flux',
              description: 'concatMap, switchMap, mergeMap',
              icon: 'git-branch',
            },
            {
              path: './sharing-data',
              label: 'Partage de données',
              description: 'Subject, BehaviorSubject',
              icon: 'share-2',
            },
          ],
        },
        {
          id: 'architecture',
          title: 'Résilience en production',
          badge: 'Niveau 2',
          exercises: [
            {
              path: './multicasting',
              label: 'Multidiffusion',
              description: 'Chaud vs Froid, shareReplay',
              icon: 'cast',
            },
            {
              path: './reactive-caching',
              label: 'Cache réactif',
              description: 'Cache puis réseau, TTL',
              icon: 'database',
            },
            {
              path: './bulk-operations',
              label: 'Opérations de masse',
              description: 'forkJoin, bufferCount, toArray',
              icon: 'layers',
            },
          ],
        },
        {
          id: 'angular22',
          title: 'Angular 22 & Interop',
          badge: 'Niveau 3',
          exercises: [
            {
              path: './signals',
              label: 'Puissance des Signals',
              description: 'signal, linkedSignal, rxResource',
              icon: 'zap',
            },
            {
              path: './rxjs-vs-signals',
              label: 'RxJS vs Signals',
              description: 'Modèles mentaux & Coexistence',
              icon: 'refresh-cw',
            },
            {
              path: './quiz',
              label: 'Défi RxJS',
              description: 'Test de maîtrise interactif',
              icon: 'award',
            },
          ],
        },
      ],
    },
  },
  ar: {
    common: {
      focusedView: 'عرض مركّز',
      focusedPrefix: 'مركّز:',
      showAll: 'عرض الكل',
      showAllTitle: 'عرض جميع حالات الاستخدام بالتوازي',
      filterUseCases: 'تصفية حالات الاستخدام',
      reset: 'إعادة تعيين',
      resetAll: 'إعادة تعيين الكل',
      resetStreamState: 'إعادة تعيين حالة التدفق',
      loading: 'جارٍ التحميل...',
      showCodeExample: 'عرض مثال الكود',
      hideCodeExample: 'إخفاء مثال الكود',
      showCode: 'عرض الكود',
      hideCode: 'إخفاء الكود',
      na: 'غير متاح',
    },
    shell: {
      title: 'مختبر تطبيقات RxJS',
      subtitle: 'مختبر تفاعلي للتدفقات البرمجية',
      toggleDrawerAria: 'تبديل درج التنقل',
      collapseNav: 'طي قائمة التنقل',
      expandNav: 'توسيع قائمة التنقل',
    },
    nav: {
      ariaLabel: 'تنقل مختبر RxJS',
      categories: [
        {
          id: 'foundations',
          title: 'الآليات الأساسية',
          badge: 'المستوى 1',
          exercises: [
            {
              path: './error-handling',
              label: 'معالجة الأخطاء',
              description: 'catchError, retry, throwError',
              icon: 'alert-circle',
            },
            {
              path: './combining-streams',
              label: 'دمج التدفقات',
              description: 'withLatestFrom, combineLatest',
              icon: 'git-merge',
            },
            {
              path: './transforming-streams',
              label: 'تحويل التدفقات',
              description: 'concatMap, switchMap, mergeMap',
              icon: 'git-branch',
            },
            {
              path: './sharing-data',
              label: 'مشاركة البيانات',
              description: 'Subject, BehaviorSubject',
              icon: 'share-2',
            },
          ],
        },
        {
          id: 'architecture',
          title: 'مرونة بيئة الإنتاج',
          badge: 'المستوى 2',
          exercises: [
            {
              path: './multicasting',
              label: 'البث المتعدد',
              description: 'الساخن مقابل البارد، shareReplay',
              icon: 'cast',
            },
            {
              path: './reactive-caching',
              label: 'التخزين المؤقت التفاعلي',
              description: 'الذاكرة المؤقتة ثم الشبكة، TTL',
              icon: 'database',
            },
            {
              path: './bulk-operations',
              label: 'العمليات المجمّعة',
              description: 'forkJoin, bufferCount, toArray',
              icon: 'layers',
            },
          ],
        },
        {
          id: 'angular22',
          title: 'Angular 22 والتكامل',
          badge: 'المستوى 3',
          exercises: [
            {
              path: './signals',
              label: 'قوة الإشارات (Signals)',
              description: 'signal, linkedSignal, rxResource',
              icon: 'zap',
            },
            {
              path: './rxjs-vs-signals',
              label: 'RxJS مقابل Signals',
              description: 'النماذج الذهنية والتعايش',
              icon: 'refresh-cw',
            },
            {
              path: './quiz',
              label: 'تحدي RxJS',
              description: 'اختبار إتقان تفاعلي',
              icon: 'award',
            },
          ],
        },
      ],
    },
  },
  it: {
    common: {
      focusedView: 'Vista focalizzata',
      focusedPrefix: 'Focalizzato:',
      showAll: 'Mostra tutto',
      showAllTitle: 'Mostra tutti i casi d’uso in parallelo',
      filterUseCases: 'Filtra casi d’uso',
      reset: 'Reimposta',
      resetAll: 'Reimposta tutto',
      resetStreamState: 'Reimposta stato del flusso',
      loading: 'Caricamento...',
      showCodeExample: 'Mostra esempio di codice',
      hideCodeExample: 'Nascondi esempio di codice',
      showCode: 'Mostra codice',
      hideCode: 'Nascondi codice',
      na: 'N/D',
    },
    shell: {
      title: 'Laboratorio RxJS',
      subtitle: 'Laboratorio interattivo di flussi',
      toggleDrawerAria: 'Attiva/disattiva menu di navigazione',
      collapseNav: 'Comprimi navigazione',
      expandNav: 'Espandi navigazione',
    },
    nav: {
      ariaLabel: 'Navigazione laboratorio RxJS',
      categories: [
        {
          id: 'foundations',
          title: 'Meccaniche di base',
          badge: 'Livello 1',
          exercises: [
            {
              path: './error-handling',
              label: 'Gestione degli errori',
              description: 'catchError, retry, throwError',
              icon: 'alert-circle',
            },
            {
              path: './combining-streams',
              label: 'Combinare i flussi',
              description: 'withLatestFrom, combineLatest',
              icon: 'git-merge',
            },
            {
              path: './transforming-streams',
              label: 'Trasformare i flussi',
              description: 'concatMap, switchMap, mergeMap',
              icon: 'git-branch',
            },
            {
              path: './sharing-data',
              label: 'Condivisione dati',
              description: 'Subject, BehaviorSubject',
              icon: 'share-2',
            },
          ],
        },
        {
          id: 'architecture',
          title: 'Resilienza in produzione',
          badge: 'Livello 2',
          exercises: [
            {
              path: './multicasting',
              label: 'Multicasting',
              description: 'Hot vs Cold, shareReplay',
              icon: 'cast',
            },
            {
              path: './reactive-caching',
              label: 'Caching reattivo',
              description: 'Cache-then-network, TTL',
              icon: 'database',
            },
            {
              path: './bulk-operations',
              label: 'Operazioni massive',
              description: 'forkJoin, bufferCount, toArray',
              icon: 'layers',
            },
          ],
        },
        {
          id: 'angular22',
          title: 'Angular 22 & Interop',
          badge: 'Livello 3',
          exercises: [
            {
              path: './signals',
              label: 'Potenza dei Signals',
              description: 'signal, linkedSignal, rxResource',
              icon: 'zap',
            },
            {
              path: './rxjs-vs-signals',
              label: 'RxJS vs Signals',
              description: 'Modelli mentali & Coesistenza',
              icon: 'refresh-cw',
            },
            {
              path: './quiz',
              label: 'Sfida RxJS',
              description: 'Test di padronanza interattivo',
              icon: 'award',
            },
          ],
        },
      ],
    },
  },
  de: {
    common: {
      focusedView: 'Fokussierte Ansicht',
      focusedPrefix: 'Fokussiert:',
      showAll: 'Alle anzeigen',
      showAllTitle: 'Alle Anwendungsfälle parallel anzeigen',
      filterUseCases: 'Anwendungsfälle filtern',
      reset: 'Zurücksetzen',
      resetAll: 'Alles zurücksetzen',
      resetStreamState: 'Stream-Status zurücksetzen',
      loading: 'Laden...',
      showCodeExample: 'Codebeispiel anzeigen',
      hideCodeExample: 'Codebeispiel ausblenden',
      showCode: 'Code anzeigen',
      hideCode: 'Code ausblenden',
      na: 'k. A.',
    },
    shell: {
      title: 'RxJS-Übungslabor',
      subtitle: 'Interaktives Stream-Labor',
      toggleDrawerAria: 'Navigationsleiste umschalten',
      collapseNav: 'Navigation einklappen',
      expandNav: 'Navigation ausklappen',
    },
    nav: {
      ariaLabel: 'RxJS-Labor-Navigation',
      categories: [
        {
          id: 'foundations',
          title: 'Kernmechaniken',
          badge: 'Stufe 1',
          exercises: [
            {
              path: './error-handling',
              label: 'Fehlerbehandlung',
              description: 'catchError, retry, throwError',
              icon: 'alert-circle',
            },
            {
              path: './combining-streams',
              label: 'Streams kombinieren',
              description: 'withLatestFrom, combineLatest',
              icon: 'git-merge',
            },
            {
              path: './transforming-streams',
              label: 'Streams transformieren',
              description: 'concatMap, switchMap, mergeMap',
              icon: 'git-branch',
            },
            {
              path: './sharing-data',
              label: 'Daten teilen',
              description: 'Subject, BehaviorSubject',
              icon: 'share-2',
            },
          ],
        },
        {
          id: 'architecture',
          title: 'Produktions-Resilienz',
          badge: 'Stufe 2',
          exercises: [
            {
              path: './multicasting',
              label: 'Multicasting',
              description: 'Hot vs. Cold, shareReplay',
              icon: 'cast',
            },
            {
              path: './reactive-caching',
              label: 'Reaktives Caching',
              description: 'Cache-then-network, TTL',
              icon: 'database',
            },
            {
              path: './bulk-operations',
              label: 'Massenoperationen',
              description: 'forkJoin, bufferCount, toArray',
              icon: 'layers',
            },
          ],
        },
        {
          id: 'angular22',
          title: 'Angular 22 & Interop',
          badge: 'Stufe 3',
          exercises: [
            {
              path: './signals',
              label: 'Stärke von Signals',
              description: 'signal, linkedSignal, rxResource',
              icon: 'zap',
            },
            {
              path: './rxjs-vs-signals',
              label: 'RxJS vs. Signals',
              description: 'Mentale Modelle & Koexistenz',
              icon: 'refresh-cw',
            },
            {
              path: './quiz',
              label: 'RxJS-Challenge',
              description: 'Interaktiver Wissenstest',
              icon: 'award',
            },
          ],
        },
      ],
    },
  },
};

function buildCopyForLang(lang: SiteLanguage): RxjsLabCopy {
  return {
    ...SHELL_NAV_COPY[lang],
    ...TIER1_COPY[lang],
    ...TIER2_COPY[lang],
    ...TIER3_COPY[lang],
  };
}

export const RXJS_LAB_COPY: Record<SiteLanguage, RxjsLabCopy> = {
  en: buildCopyForLang('en'),
  fr: buildCopyForLang('fr'),
  ar: buildCopyForLang('ar'),
  it: buildCopyForLang('it'),
  de: buildCopyForLang('de'),
};

export function getRxjsLabCopy(lang: SiteLanguage = 'en'): RxjsLabCopy {
  return RXJS_LAB_COPY[lang] ?? RXJS_LAB_COPY.en;
}

export function injectRxjsLabLanguage(): Signal<SiteLanguage> {
  const prefs = inject(PreferencesStore, { optional: true });
  return computed(() => (prefs ? prefs.language() : 'en'));
}

export function injectRxjsLabCopy(): Signal<RxjsLabCopy> {
  const prefs = inject(PreferencesStore, { optional: true });
  return computed(() => {
    const lang: SiteLanguage = prefs ? prefs.language() : 'en';
    return getRxjsLabCopy(lang);
  });
}
