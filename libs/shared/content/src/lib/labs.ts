import type { SiteLanguage } from './i18n/content-i18n.types';

/** What opens a lab's page, before the remote that runs it arrives. */
export interface LabIntro {
  eyebrow: string;
  heading: string;
  lead: string;
}

export const LABS_BY_LANGUAGE: Record<
  SiteLanguage,
  Record<string, LabIntro>
> = {
  en: {
    'lab-sky': {
      eyebrow: 'Lab · Three.js, custom shaders and astronomy in the browser',
      heading: 'The sky above any campsite, any night',
      lead: 'Pick a place on the globe, dive down to the ground and look up: 5,000 real stars, the constellations, the Moon in its true phase, the planets, the Milky Way and meteor showers, for any date and time.',
    },
    'lab-rxjs': {
      eyebrow: 'Lab · Reactive Streams & Signals',
      heading: 'RxJS Practice Pad',
      lead: 'Interactive laboratory for reactive stream patterns, multicast subjects, error handling strategies, caching architectures, and Angular signal interoperability in zoneless Angular.',
    },
    'lab-ngrx': {
      eyebrow: 'Lab · NgRx State Architecture & Signals',
      heading: 'NgRx State Lab & Architecture Guide',
      lead: 'Interactive laboratory for state transitions, animated store cycles, SignalStore plugins, side-effect pipelines, entity normalization, and an architectural showdown comparing NgRx with service-based state.',
    },
  },
  fr: {
    'lab-sky': {
      eyebrow:
        'Labo · Three.js, shaders personnalisés et astronomie dans le navigateur',
      heading: 'Le ciel au-dessus de chaque campement, chaque nuit',
      lead: 'Choisissez un point sur le globe terrestre, descendez au sol et observez : 5 000 étoiles réelles, constellations, Lune dans sa phase exacte, planètes, Voie lactée et pluies de météores, à toute date et heure.',
    },
    'lab-rxjs': {
      eyebrow: 'Labo · Flux réactifs et signaux',
      heading: 'Banc d’essai interactif RxJS',
      lead: 'Laboratoire interactif dédié aux flux réactifs, sujets multicast, stratégies de résilience, architectures de cache et interopérabilité avec les signaux Angular en mode sans zone.js.',
    },
    'lab-ngrx': {
      eyebrow: 'Labo · Architecture d’état NgRx et signaux',
      heading: 'Laboratoire d’état NgRx & guide architectural',
      lead: 'Laboratoire interactif explorant transitions d’état, cycles d’actions animés, extensions SignalStore, pipelines d’effets secondaires, normalisation d’entités et comparatif complet avec la gestion d’état par services.',
    },
  },
  ar: {
    'lab-sky': {
      eyebrow: 'مختبر · Three.js ومظللات مخصصة وعلم الفلك في المتصفح',
      heading: 'سماء أي مخيم في أي ليلة',
      lead: 'اختر موقعًا على الكرة الأرضية، واهبط إلى الأرض وانظر إلى الأعلى: 5,000 نجم حقيقي، والكوكبات، والقمر في طوره الفعلي، والكواكب، ودرب التبانة، وزخات الشهب في أي تاريخ ووقت.',
    },
    'lab-rxjs': {
      eyebrow: 'مختبر · التدفقات التفاعلية والإشارات',
      heading: 'منصة تمارين وتدفقات RxJS',
      lead: 'مختبر تفاعلي متقدم لأنماط التدفقات التفاعلية، والمواضيع متعددة البث، واستراتيجيات إدارة الأخطاء، وبنى التخزين المؤقت، والتوافقية مع إشارات Angular في بيئة دون zone.js.',
    },
    'lab-ngrx': {
      eyebrow: 'مختبر · بنية إدارة الحالة NgRx والإشارات',
      heading: 'مختبر حالة NgRx ودليل البنية البرمجية',
      lead: 'مختبر تفاعلي لدورات الحالة والانتقالات المتحركة، ومكونات SignalStore الإضافية، وخطوط التأثيرات الجانبية، وتطبيع الكيانات، ومقارنة معمارية شاملة بين NgRx وإدارة الحالة المستندة إلى الخدمات.',
    },
  },
  it: {
    'lab-sky': {
      eyebrow:
        'Laboratorio · Three.js, shader personalizzati e astronomia nel browser',
      heading: 'Il cielo sopra ogni accampamento, in qualsiasi notte',
      lead: 'Scegli un punto sul globo, scendi a terra e guarda verso l’alto: 5.000 stelle reali, le costellazioni, la Luna nella sua fase reale, i pianeti, la Via Lattea e sciami meteorici, per qualsiasi data e ora.',
    },
    'lab-rxjs': {
      eyebrow: 'Laboratorio · Stream reattivi e Signals',
      heading: 'Banco di prova pratico RxJS',
      lead: 'Laboratorio interattivo per padroneggiare pattern reattivi, subject multicast, strategie di gestione errori, architetture di caching e interoperabilità con i Signals in Angular zoneless.',
    },
    'lab-ngrx': {
      eyebrow: 'Laboratorio · Architettura di stato NgRx e Signals',
      heading: 'Laboratorio NgRx & guida architetturale',
      lead: 'Laboratorio interattivo per transizioni di stato, cicli di store animati, plugin SignalStore, pipeline di side-effect, normalizzazione entità e confronto dettagliato tra NgRx e gestione stato con servizi.',
    },
  },
  de: {
    'lab-sky': {
      eyebrow: 'Lab · Three.js, Custom Shaders und Astronomie im Browser',
      heading: 'Der Himmel über jedem Campingplatz, zu jeder Nacht',
      lead: 'Wählen Sie einen beliebigen Ort auf dem Globus und blicken Sie hinauf: 5.000 echte Sterne, Sternbilder, der Mond in seiner exakten Phase, Planeten, die Milchstraße und Meteorschauer zu jedem Datum und jeder Uhrzeit.',
    },
    'lab-rxjs': {
      eyebrow: 'Lab · Reaktive Datenströme & Signals',
      heading: 'RxJS-Praxislabor',
      lead: 'Interaktives Labor für reaktive Datenstrommuster, Multicast-Subjects, Fehlerbehandlungsstrategien, Caching-Architekturen und Angular-Signal-Interoperabilität im Zoneless-Modus.',
    },
    'lab-ngrx': {
      eyebrow: 'Lab · NgRx-Zustandsarchitektur & Signals',
      heading: 'NgRx State Lab & Architekturleitfaden',
      lead: 'Interaktives Labor für Zustandsübergänge, animierte Store-Zyklen, SignalStore-Plugins, Side-Effect-Pipelines, Entity-Normalisierung und Architekturvergleich zwischen NgRx und servicebasiertem State.',
    },
  },
};

/**
 * The shell prerenders each lab's intro around the remote (ADR-0014), so a
 * lab's first paint never waits for its micro-frontend. A remote's standalone
 * mode shows the same intro.
 */
export const labs = LABS_BY_LANGUAGE.en;

export function getLabs(lang: SiteLanguage = 'en'): Record<string, LabIntro> {
  return LABS_BY_LANGUAGE[lang] ?? LABS_BY_LANGUAGE.en;
}

export function getLabIntro(
  key: string,
  lang: SiteLanguage = 'en',
): LabIntro | undefined {
  return (LABS_BY_LANGUAGE[lang] ?? LABS_BY_LANGUAGE.en)[key];
}
