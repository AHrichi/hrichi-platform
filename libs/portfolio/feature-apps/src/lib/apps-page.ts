import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '@ah/portfolio/util-seo';
import { PreferencesStore } from '@ah/shared/state';
import { AhButton, AhScrollHint, Badge, SectionHeading, Tag } from '@ah/ui';

interface AppItem {
  id: string;
  title: string;
  category: 'production' | 'lab';
  badge: {
    label: string;
    variant: 'success' | 'accent' | 'info' | 'warning' | 'neutral';
    pulse?: boolean;
  };
  eyebrow: string;
  summary: string;
  route: string;
  stack: string[];
  features: string[];
  architectureNotes: string;
  credentialsNote?: string;
  icon: string;
  ctaLabel?: string;
}

type LabText = Pick<
  AppItem,
  'title' | 'eyebrow' | 'summary' | 'features' | 'architectureNotes'
> & {
  badge: string;
};

const LAB_COPY: Partial<Record<'en' | 'fr' | 'ar', Record<string, LabText>>> = {
  fr: {
    sky: {
      title: 'Sky Lab · Planétarium 3D interactif et éphémérides',
      badge: '🌌 Moteur 3D WebGL',
      eyebrow: 'Astronomie et 3D · WebGL et Orekit Spring Boot',
      summary:
        'Choisissez un lieu sur Terre, plongez depuis l’orbite jusqu’au sol et explorez le ciel nocturne en temps réel : 5 000 étoiles réelles, constellations, phases exactes de la Lune, planètes visibles, Voie lactée et étoiles filantes.',
      features: [
        'Globe terrestre 3D avec plongée fluide jusqu’au point de vue de l’observateur',
        'Ciel de 5 000 étoiles réelles avec les figures des constellations',
        'Phase de la Lune et position des planètes pour n’importe quelle date',
        'Crépuscules, fenêtres de nuit noire et planificateur des meilleures nuits',
      ],
      architectureNotes:
        'Moteur Three.js sans framework, rendu à la demande, pause hors écran et adaptation automatique pour tenir 60 i/s sur mobile comme sur ordinateur.',
    },
    rxjs: {
      title: 'Labo RxJS · Opérateurs de flux et architecture réactive',
      badge: '🧪 Labo réactif',
      eyebrow: 'Programmation réactive · Diagrammes marbre et contre-pression',
      summary:
        'Un laboratoire interactif pour maîtriser les flux RxJS : diagrammes marbre animés, comparaison d’opérateurs, stratégies de contre-pression, sujets multicast et interopérabilité avec les signaux.',
      features: [
        'Diagrammes marbre en direct : émissions asynchrones et propagation des erreurs',
        'Contre-pression côte à côte : debounceTime, throttleTime, auditTime, sampleTime',
        'Simulateur d’opérateurs : switchMap, mergeMap, concatMap, exhaustMap',
        'Modèles robustes : nouvelle tentative exponentielle et dédoublonnage des requêtes',
      ],
      architectureNotes:
        'Visualiseur réactif sans zone.js reliant directement les Observables RxJS aux Signals Angular.',
    },
    ngrx: {
      title: 'Labo NgRx · SignalStore et architecture Redux',
      badge: '🏛️ Labo d’architecture',
      eyebrow: 'Architecture d’état · NgRx Store et @ngrx/signals',
      summary:
        'Un atelier complet sur les architectures d’état : flux Redux unidirectionnel visualisé, effets asynchrones, SignalStore déclaratif avec entités normalisées et matrice de comparaison.',
      features: [
        'Cycle Redux interactif en 4 étapes (action → reducer → sélecteur → effet)',
        'SignalStore déclaratif avec withEntities(), withComputed() et rxMethod()',
        'Débogage « voyage dans le temps » : instantanés, relecture et retour arrière',
        'Comparatif détaillé : NgRx Store, SignalStore et état par services',
      ],
      architectureNotes:
        'Montre les modèles d’état Angular modernes sans zone.js, entre composition fonctionnelle légère et invariants solides.',
    },
  },
  ar: {
    sky: {
      title: 'مختبر السماء · قبة فلكية ثلاثية الأبعاد ومحرّك تقويم فلكي',
      badge: '🌌 محرّك WebGL ثلاثي الأبعاد',
      eyebrow:
        'علم الفلك والرسوم ثلاثية الأبعاد · WebGL وOrekit مع Spring Boot',
      summary:
        'اختر أي مكان على الأرض، واهبط من المدار إلى سطح الأرض، واستكشف سماء الليل في الوقت الحقيقي: 5000 نجم حقيقي، والكوكبات، وأطوار القمر الدقيقة، والكواكب المرئية، ودرب التبانة، وزخات الشهب.',
      features: [
        'كرة أرضية ثلاثية الأبعاد مع هبوط سلس حتى منظور الراصد على الأرض',
        'سماء من 5000 نجم حقيقي مع رسوم الكوكبات',
        'طور القمر ومواقع الكواكب لأي تاريخ ماضٍ أو قادم',
        'الشفق ونوافذ الظلام ومخطِّط لأفضل ليالي الرصد',
      ],
      architectureNotes:
        'محرّك Three.js دون إطار عمل، يرسم عند الحاجة فقط ويتوقف خارج الشاشة ويتكيّف تلقائيًا ليحافظ على 60 إطارًا في الثانية على الهاتف والحاسوب.',
    },
    rxjs: {
      title: 'مختبر RxJS · مشغّلات التدفق والبنية التفاعلية',
      badge: '🧪 مختبر تفاعلي',
      eyebrow: 'البرمجة التفاعلية · مخططات الكرات والضغط العكسي',
      summary:
        'مختبر تفاعلي لإتقان تدفقات RxJS: مخططات كرات متحركة، ومقارنة المشغّلات، واستراتيجيات الضغط العكسي، والمواضيع متعددة البث، والتكامل مع الإشارات.',
      features: [
        'مخططات كرات حيّة للقيم غير المتزامنة وانتشار الأخطاء',
        'مقارنة الضغط العكسي جنبًا إلى جنب: debounceTime وthrottleTime وauditTime وsampleTime',
        'محاكي المشغّلات: switchMap وmergeMap وconcatMap وexhaustMap',
        'أنماط متينة: إعادة المحاولة بتأخير متزايد وإزالة الطلبات المكررة',
      ],
      architectureNotes:
        'أداة عرض تفاعلية دون zone.js تربط Observables من RxJS مباشرة بإشارات Angular.',
    },
    ngrx: {
      title: 'مختبر NgRx · SignalStore وبنية Redux',
      badge: '🏛️ مختبر البنية',
      eyebrow: 'بنية الحالة · NgRx Store و@ngrx/signals',
      summary:
        'ورشة شاملة لبُنى إدارة الحالة: تدفق Redux أحادي الاتجاه مرئيًا، والتأثيرات غير المتزامنة، وSignalStore التصريحي مع الكيانات المنظَّمة، ومصفوفة مقارنة.',
      features: [
        'دورة Redux تفاعلية من 4 مراحل (إجراء ← مُخفِّض ← مُحدِّد ← تأثير)',
        'SignalStore تصريحي مع withEntities() وwithComputed() وrxMethod()',
        'تصحيح بالسفر عبر الزمن: لقطات وإعادة تشغيل وتراجع',
        'مقارنة مفصّلة بين NgRx Store وSignalStore والحالة عبر الخدمات',
      ],
      architectureNotes:
        'يعرض أنماط الحالة الحديثة في Angular دون zone.js، بين التركيب الوظيفي الخفيف والثوابت المتينة.',
    },
  },
};

@Component({
  selector: 'ah-apps-page',
  standalone: true,
  imports: [AhButton, AhScrollHint, Badge, RouterLink, SectionHeading, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './apps-page.html',
  styleUrl: './apps-page.scss',
})
export class AppsPage {
  /** The site's language, set by the header's switch (PreferencesStore). */
  readonly currentLang = inject(PreferencesStore).language;
  /** "Go" arrows point the way the text reads. */
  protected readonly arrow = computed(() =>
    this.currentLang() === 'ar' ? '←' : '→',
  );

  readonly t = computed(() => {
    const l = this.currentLang();
    switch (l) {
      case 'ar':
        return {
          heroEyebrow: 'هندسة المحفظة والحلول البرمجية',
          heroHeading: 'التطبيقات والمختبرات الهندسية التفاعلية',
          heroLead:
            'استكشف منصات الإنتاج والمختبرات الهندسية المتقدمة المبنية بتقنيات Angular 22 Zoneless وNative Federation وThree.js WebGL وNestJS وهياكل الحالة التفاعلية. جميع المنصات أدناه تفاعلية بالكامل وموثقة بدقة.',
          jumpProduction: 'تطبيقات الإنتاج',
          jumpLabs: 'المختبرات الهندسية التفاعلية',
          prodEyebrow: 'المنصات التجارية والهندسية',
          prodHeading: 'تطبيقات بيئة الإنتاج المباشرة',
          prodLead:
            'أنظمة برمجية متكاملة مصممة لسير العمل الواقعي، والعمليات الموزعة، والحوسبة التي تركز أولاً على الخصوصية.',
          labsEyebrow: 'البحوث التخصصية والأدوات',
          labsHeading: 'المختبرات الهندسية التفاعلية',
          labsLead:
            'بيئات عمل عملية توضح رسوميات الحاسوب ثلاثية الأبعاد WebGL، تدفقات البرمجة التفاعلية المعقدة، وهياكل الحالة الحديثة.',
          keyCapabilities: 'المميزات والقدرات الرئيسية:',
          interactiveExperiments: 'التجارب التفاعلية:',
          architectureTitle: 'الهندسة المعمارية والأمان:',
          howToTestTitle: 'طريقة التجربة:',
          launchPrefix: 'تشغيل',
        };
      case 'fr':
        return {
          heroEyebrow: 'Architecture de Portfolio & Solutions',
          heroHeading: 'Applications & Laboratoires Interactifs',
          heroLead:
            "Explorez des plateformes de production et des bancs d'essai d'ingénierie spécialisés conçus avec Angular 22 Zoneless, Native Federation, Three.js WebGL, NestJS et des architectures d'état réactives. Chaque système ci-dessous est 100% interactif et documenté.",
          jumpProduction: 'Applications de Production',
          jumpLabs: "Laboratoires d'Ingénierie",
          prodEyebrow: 'Plateformes Métier & Commerciales',
          prodHeading: 'Applications en Production',
          prodLead:
            'Systèmes complets conçus pour de véritables flux opérationnels, la logistique distribuée et la confidentialité des données.',
          labsEyebrow: 'Recherche Appliquée & Outillage',
          labsHeading: "Laboratoires d'Ingénierie Interactifs",
          labsLead:
            "Bancs d'essai interactifs démontrant le rendu 3D WebGL, les flux réactifs RxJS complexes et les architectures d'état modernes.",
          keyCapabilities: 'Capacités & Fonctionnalités Clés :',
          interactiveExperiments: 'Expériences Interactives :',
          architectureTitle: 'Architecture & Sécurité :',
          howToTestTitle: 'Comment tester :',
          launchPrefix: 'Lancer',
        };
      case 'en':
      default:
        return {
          heroEyebrow: 'Portfolio Architecture & Solutions',
          heroHeading: 'Applications & Interactive Labs',
          heroLead:
            'Explore production-grade platforms and specialized engineering workbenches built with modern zoneless Angular 22, Native Federation, Three.js WebGL, NestJS, and reactive state architectures. Every platform below is fully interactive and documented.',
          jumpProduction: 'Production Applications',
          jumpLabs: 'Interactive Engineering Labs',
          prodEyebrow: 'Commercial Platforms',
          prodHeading: 'Production Applications',
          prodLead:
            'Full-stack, domain-driven systems designed for real business workflows, distributed operations, and privacy-first computation.',
          labsEyebrow: 'Specialized Research & Tooling',
          labsHeading: 'Interactive Engineering Labs',
          labsLead:
            'Hands-on interactive workbenches demonstrating 3D WebGL computer graphics, complex reactive streams, and modern state architectures.',
          keyCapabilities: 'Key Capabilities & Features:',
          interactiveExperiments: 'Interactive Experiments:',
          architectureTitle: 'Architecture & Quota Safeguards:',
          howToTestTitle: 'How to test:',
          launchPrefix: 'Launch',
        };
    }
  });

  protected readonly productionApps = computed<AppItem[]>(() => {
    const l = this.currentLang();
    if (l === 'ar') {
      return [
        {
          id: 'lighting',
          title:
            'LuxPath (SolarLux) · منصة هندسة الإنارة العمومية والطاقة الشمسية',
          category: 'production',
          badge: {
            label: '☀️ الإنارة والطاقة الشمسية',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'الهندسة المدنية والضوئية الميدانية · EN 13201 / Eurocode 7 / NF EN 206',
          summary:
            'منصة هندسية ميدانية متكاملة لمهندسي ومشرفي تركيب الإنارة العامة (الشبكة التقليدية والأعمدة الشمسية المستقلة). حساب تباعد الأعمدة وفق EN 13201، التحقق من عمق الحفر والكتل الخرسانية وفق Eurocode 7، اختبار هبوط الخرسانة ومقاومة 7 أيام، ميزان شاقولي رقمي لانحراف الأعمدة (EN 40)، مقياس مسافات وارتفاع بالكاميرا، وخريطة تفاعلية لتحديد مواقع الأعمدة دون إنترنت.',
          route: '/apps/lighting',
          icon: '💡',
          ctaLabel: 'LuxPath',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'DeviceOrientation Gyroscope',
            'Camera WebRTC',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'حساب تباعد الأعمدة والشدة الضوئية وفق معيار EN 13201 (فئات الطرق M و C و P)',
            'التحقق من كتل الأساس الخرسانية ومقاومة الرياح تحت معيار Eurocode 7',
            'التحقق من جودة الخرسانة واختبار مخروط أبرامز ومقاومة 7 أيام وفق NF EN 206',
            'ميزان شاقولي رقمي لانحراف واستقامة العمود مع خطوات تعديل الصواميل (EN 40)',
            'مقياس مسافات وارتفاع الأعمدة عبر كاميرا الهاتف وزاوية الميلان',
            'خريطة جغرافية تفاعلية لتحديد مواقع الأعمدة وحساب المسافات بنظام GPS',
            'حساب أحجام الألواح الشمسية وبطاريات LiFePO4 مع فترات التعتيم الليلي',
            'تصدير تذكيرات المواعيد للتقويم (.ics) وإرسال البريد بنقرة واحدة',
          ],
          architectureNotes:
            'معمارية تعمل 100% دون الحاجة إلى إنترنت، مع حفظ المشاريع وسجلات الفحص محلياً في IndexedDB.',
        },
        {
          id: 'basecamp',
          title: 'Basecamp · مخطط رحلات التخييم',
          category: 'production',
          badge: { label: '🏕️ تخييم ونجوم', variant: 'success' },
          eyebrow: 'الطقس · رصد السماء · قوائم الحقيبة · يعمل دون اتصال',
          summary:
            'خطّط لرحلة تخييم على هاتفك: حدّد مكان المخيم على الخريطة، وتابع توقعات الطقس حتى 16 يومًا مع تنبيهات الصقيع والرياح والمطر، واعرف أفضل ليلة لرصد النجوم (ساعات الظلام، القمر، زخات الشهب)، وجهّز قائمة حقيبة على مقاس المجموعة، ثم شارك الرحلة مع أصدقائك برابط دون حساب ولا خادم.',
          route: '/apps/basecamp',
          icon: '🏕️',
          ctaLabel: 'Basecamp',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'Open-Meteo API',
            'astronomy-engine',
            'CompressionStream share links',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'مكان المخيم على خريطة OpenStreetMap مع البحث وتحديد الموقع',
            'توقعات Open-Meteo يومًا بيوم مع تنبيهات الصقيع والرياح والمطر والحر',
            'ليالي الرحلة محسوبة على الهاتف: الظلام التام، طور القمر، الشهب، ونتيجة للرصد',
            'رابط إلى مختبر السماء لرؤية نجوم أفضل ليلة',
            'قائمة حقيبة حسب نوع الرحلة وعدد المشاركين والليالي، مع توزيع من يحضر ماذا',
            'أغراض يضيفها الطقس تلقائيًا (غطاء مشمّع، طبقة دافئة، حبال شدّ)',
            'جرد المعدات الشخصية لمعرفة ما يجب شراؤه أو استعارته',
            'مشاركة الرحلة برابط مضغوط في جزء العنوان، ونسخة احتياطية JSON',
          ],
          architectureNotes:
            'يعمل دون اتصال: الرحلات والمعدات وآخر توقعات في IndexedDB، وحسابات السماء على الجهاز.',
        },
        {
          id: 'dispatch',
          title: 'PulseOps · مركز التحكم اللوجستي وعمليات التوزيع',
          category: 'production',
          badge: {
            label: '🟢 مباشر بالإنتاج',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'إدارة اللوجستيات والمقاولين الفرعيين · لندن',
          summary:
            'مركز قيادة متكامل للتنسيق اللوجستي التجاري وإدارة المغاسل والفنادق. إدارة الاستلام اليومي، وتخطيط مسارات السائقين، وبيانات المقاولين الفرعيين، وتتبع القطع المفقودة، وتقارير تسليم الورديات آلياً.',
          route: '/apps/dispatch',
          icon: '🧺',
          ctaLabel: 'PulseOps',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'NestJS REST API',
            'MongoDB Atlas M0',
            'AES-256-GCM',
            'PBKDF2 Auth',
            'NgRx SignalStore',
          ],
          features: [
            'لوحة كانبان بـ 6 مراحل لحظية لتتبع الطلبيات من الاستلام حتى الفوترة',
            'توزيع أسطول السائقين وترتيب محطات التوصيل مع طلب رحلات الطوارئ',
            'إدارة مصانع المقاولين الفرعيين وتتبع السعة وجودة الغسيل',
            'محاكاة مركز رسائل واتساب مع العملاء والسائقين ووحدات الإنتاج',
            'إثبات التسليم الرقمي (POD) مع التقاط التوقيع ورمز بوابة التحميل',
            'تقارير تسليم الوردية التلقائية مع قائمة الحوادث والمتابعات',
          ],
          architectureNotes:
            'حماية مشددة لقواعد البيانات مع تشفير AES-256-GCM للبيانات الحساسة كأرقام الهواتف والتواقيع.',
        },
        {
          id: 'strategy',
          title: 'StrategyApp · محرك التخطيط المالي وتوقعات الثروة',
          category: 'production',
          badge: { label: '⚡ منصة تفاعلية', variant: 'accent' },
          eyebrow: 'التكنولوجيا المالية · محاكاة السيناريوهات وموازنة التدفقات',
          summary:
            'منصة استشراف مالي متعددة السيناريوهات تحسب صافي الثروة، وفترات الأمان المالي، ومعدلات الادخار وصناديق الطوارئ عبر سنوات دون إرسال أي بيانات مالية حساسة لخوادم خارجية.',
          route: '/apps/strategy',
          icon: '📈',
          ctaLabel: 'StrategyApp',
          stack: [
            'Angular 22',
            'NgRx SignalStore',
            'Chart.js',
            'IndexedDB Local Storage',
            'PDF Export Engine',
            '@ah/ui Design Tokens',
          ],
          features: [
            'محاكاة السيناريوهات المالية (الأساسي، الادخار المكثف، المحافظ، التحول المهني)',
            'دفتر أستاذ تفاعلي بقيد مزدوج مع تتبع بنود الدخل والمصروفات',
            'توقعات بيانية لحظية لصافي الثروة ورسوم تفاعلية',
            'تصدير تقرير مالي تنفيذي بصيغة PDF بنقرة واحدة',
          ],
          architectureNotes:
            'حوسبة محلية 100% مع خصوصية مطلقة للبيانات في IndexedDB دون أي اتصال خارجي.',
        },
        {
          id: 'studylm',
          title: 'StudyLM · منصة التقييم والتدريب الهندسي بالذكاء الاصطناعي',
          category: 'production',
          badge: {
            label: '🤖 محرك الذكاء الاصطناعي Groq 120B',
            variant: 'accent',
            pulse: true,
          },
          eyebrow: 'بناء المناهج البرمجية وتقييم الكفاءات التقنية خطوة بخطوة',
          summary:
            'منصة إتقان هندسة البرمجيات تعتمد على مسارات عمل n8n ونماذج Groq LPU (120B). تفكك المواضيع المعقدة إلى فصول تدريجية مع أسئلة تشخيصية وبطاقات استذكار موثقة من المراجع الرسمية.',
          route: '/apps/studylm',
          icon: '📚',
          ctaLabel: 'StudyLM',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'n8n AI Workflow Engine',
            'Groq LPU (120B / 27B)',
            'NgRx SignalStore',
            'Dexie IndexedDB',
          ],
          features: [
            'حاجز ذكي يضمن اقتصار المواضيع على هندسة البرمجيات وتطوير الأنظمة',
            'تفكيك المناهج إلى فصول وأقسام ذرية مستندة إلى التوثيق الرسمي (MDN, React, PostgreSQL)',
            'توليد بطاقات استذكار فنية معمقة مع أمثلة برمجية وجداول تكرار متباعد',
            'اختبارات تشخيصية بـ 4 خيارات مع شرح مفصل لسبب صحة الجواب وخطأ الخيارات الأخرى',
          ],
          architectureNotes:
            'تنسيق ذكاء اصطناعي متعدد المستويات عبر n8n مع تبديل تلقائي بين النماذج لضمان التوافر.',
        },
        {
          id: 'whatsapp',
          title: 'ChatPulse · محلل محادثات واتساب وذكاء العلاقات',
          category: 'production',
          badge: {
            label: '💬 تحليل محلي + ذكاء اصطناعي n8n',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'تحليلات المراسلة الفورية المعززة بالخصوصية',
          summary:
            'جناح استخباراتي للمحادثات يحلل أرشيفات واتساب (.zip / .txt) في الذاكرة دون رفع الوسائط، ويحسب أوقات الردود، وخريطة النشاط الأسبوعية، وبطاقة الملخص السنوية مع ربط مباشر بـ n8n للتحليل السلوكي.',
          route: '/apps/whatsapp',
          icon: '💬',
          ctaLabel: 'ChatPulse',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Web DecompressionStream',
            'NgRx SignalStore',
            'n8n AI Webhook',
          ],
          features: [
            'فك ضغط وقراءة المحادثات في الذاكرة مع تخطي ملفات الصور والفيديو الكبيرة',
            'كشف تلقائي لتنسيق التاريخ (يوم/شهر مقابل شهر/يوم) لأجهزة iOS و Android',
            'تحليل سرعة الرد ومبادرة المحادثات ومؤشر الرسائل المتتالية',
            'خريطة نشاط أسبوعية 7×24 مع بطاقة ملخص قابلة للمشاركة',
          ],
          architectureNotes:
            'معالجة سحابية صفرية؛ يتم التحليل بالكامل داخل متصفح المستخدم دون تخزين على أي خادم.',
        },
      ];
    }

    if (l === 'fr') {
      return [
        {
          id: 'lighting',
          title:
            "LuxPath (SolarLux) · Plateforme d'Ingénierie Éclairage Public & Solaire",
          category: 'production',
          badge: {
            label: '☀️ Éclairage Solaire & Réseau',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'Génie Civil & Photométrie de Terrain · EN 13201 / Eurocode 7 / NF EN 206',
          summary:
            "Suite technique tout-en-un pour ingénieurs et superviseurs de chantiers d'éclairage public (réseau AC et candélabres solaires autonomes). Calcul d'espacement EN 13201, validation de profondeur de fouille et massifs béton Eurocode 7, formule béton & cône d'Abrams NF EN 206, jauge d'aplomb EN 40, télémètre optique caméra et cartographie GPS hors-ligne.",
          route: '/apps/lighting',
          icon: '💡',
          ctaLabel: 'LuxPath',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'DeviceOrientation Gyroscope',
            'Camera WebRTC',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            "Calcul d'implantation et d'éclairement EN 13201-2 (Ratios S/H, lux moyen et uniformité U0)",
            'Validation géotechnique des massifs béton et prise au vent panneau solaire Eurocode 7',
            "Contrôle formulation béton C25/30, affaissement cône d'Abrams et levage J+7 sous NF EN 206",
            "Niveau à bulle numérique et contrôle de verticalité EN 40 avec correction des écrous d'ancrage",
            'Télémètre optique caméra & clinomètre trigonométrique pour distance sol et hauteur mât',
            'Cartographie terrain GPS OpenStreetMap avec calcul des distances réelles inter-candélabres',
            "Dimensionnement panneau photovoltaïque Wc et batterie LiFePO4 avec profils d'abaissement nocturne",
            'Rappels jalons de chantier par email en 1 clic et téléchargement calendrier (.ics)',
          ],
          architectureNotes:
            'Architecture 100% hors-ligne avec persistance locale IndexedDB et calculs locaux sans aucun serveur externe requis.',
        },
        {
          id: 'basecamp',
          title: 'Basecamp · Planificateur de sorties camping',
          category: 'production',
          badge: { label: '🏕️ Camping & étoiles', variant: 'success' },
          eyebrow: 'Météo · Observation du ciel · Listes de sac · Hors ligne',
          summary:
            'Préparez une sortie camping sur votre téléphone : placez le camp sur la carte, suivez jusqu’à 16 jours de prévisions avec alertes gel, vent et pluie, trouvez la meilleure nuit pour les étoiles (nuit noire, Lune, étoiles filantes), préparez un sac à la taille du groupe, puis partagez la sortie par un lien, sans compte ni serveur.',
          route: '/apps/basecamp',
          icon: '🏕️',
          ctaLabel: 'Basecamp',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'Open-Meteo API',
            'astronomy-engine',
            'CompressionStream share links',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'Lieu de camp sur une carte OpenStreetMap, avec recherche et position',
            'Prévisions Open-Meteo jour par jour, avec alertes gel, vent, pluie et chaleur',
            'Nuits calculées sur le téléphone : nuit noire, phase de la Lune, étoiles filantes et score d’observation',
            'Lien vers le Sky lab pour voir les étoiles de la meilleure nuit',
            'Liste de sac selon le type de sortie, le groupe et les nuits, avec qui apporte quoi',
            'Articles ajoutés par la météo (bâche, couche chaude, haubans)',
            'Inventaire du matériel pour savoir quoi acheter ou emprunter',
            'Partage par lien compressé dans le fragment de l’URL, et sauvegarde JSON',
          ],
          architectureNotes:
            'Conçu hors ligne : sorties, matériel et dernières prévisions dans IndexedDB, calculs du ciel sur l’appareil.',
        },
        {
          id: 'dispatch',
          title:
            'PulseOps · Centre de Contrôle Opérationnel & Dispatch Logistique',
          category: 'production',
          badge: {
            label: '🟢 Production Live',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'Logistique Commerciale & Hub Sous-traitance · Londres',
          summary:
            "Centre de commande pour coordinateur logistique dans le secteur hôtelier et pressing commercial. Gestion des réceptions, optimisation des tournées chauffeurs, manifestes d'ateliers sous-traitants et rapports automatiques de fin de shift.",
          route: '/apps/dispatch',
          icon: '🧺',
          ctaLabel: 'PulseOps',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'NestJS REST API',
            'MongoDB Atlas M0',
            'AES-256-GCM',
            'PBKDF2 Auth',
            'NgRx SignalStore',
          ],
          features: [
            'Kanban temps réel en 6 étapes (Réception, Lavage, Prêt, Dispatché, Livré, Facturé)',
            "Dispatch flotte chauffeurs avec ordonnancement des arrêts et coursiers d'urgence",
            "Gestion des usines sous-traitantes avec suivi de capacité et fiches d'incidents qualité",
            'Hub de communication WhatsApp simulé (canaux Clients, Chauffeurs et Production)',
            "Preuve de livraison numérique (POD) avec signature et code d'accès quai de chargement",
            'Rapports de transmission de shift automatisés avec récapitulatif des litiges',
          ],
          architectureNotes:
            'Chiffrement AES-256-GCM des données sensibles et régulation stricte des quotas MongoDB Atlas Free Tier.',
        },
        {
          id: 'strategy',
          title:
            'StrategyApp · Simulateur de Projection Financière & Patrimoine',
          category: 'production',
          badge: { label: '⚡ Plateforme Interactive', variant: 'accent' },
          eyebrow: 'Fintech · Modélisation de Scénarios & Trésorerie',
          summary:
            "Plateforme de prévision financière multi-scénarios projetant le patrimoine net, le runway d'urgence et les taux d'épargne sur plusieurs années sans transmettre la moindre donnée financière vers l'extérieur.",
          route: '/apps/strategy',
          icon: '📈',
          ctaLabel: 'StrategyApp',
          stack: [
            'Angular 22',
            'NgRx SignalStore',
            'Chart.js',
            'IndexedDB Local Storage',
            'PDF Export Engine',
            '@ah/ui Design Tokens',
          ],
          features: [
            'Simulations financières multi-scénarios (Base, Épargne offensive, Prudent, Reconversion)',
            'Grand livre interactif en partie double avec ventilation budgétaire',
            'Projections du patrimoine net en temps réel et visualisations graphiques',
            'Export automatisé de rapport de synthèse patrimoniale au format PDF',
          ],
          architectureNotes:
            'Confidentialité absolue : calcul 100% côté client avec base locale IndexedDB et zéro télémétrie.',
        },
        {
          id: 'studylm',
          title:
            "StudyLM · Moteur d'Évaluation & Parcours d'Ingénierie Logicielle IA",
          category: 'production',
          badge: {
            label: '🤖 Moteur Groq 120B IA',
            variant: 'accent',
            pulse: true,
          },
          eyebrow: 'Architecte Pédagogique Autonome & Quiz Diagnostiques',
          summary:
            "Plateforme de montée en compétences logicielles orchestrée par n8n et les modèles Groq LPU (120B). Décompose les sujets d'ingénierie en chapitres progressifs avec flashcards illimitées et quiz diagnostiques à 4 options.",
          route: '/apps/studylm',
          icon: '📚',
          ctaLabel: 'StudyLM',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'n8n AI Workflow Engine',
            'Groq LPU (120B / 27B)',
            'NgRx SignalStore',
            'Dexie IndexedDB',
          ],
          features: [
            "Garde-fou thématique validant rigoureusement les sujets d'ingénierie logicielle",
            'Décomposition en chapitres et sections atomiques adossées aux documentations officielles',
            'Flashcards techniques approfondies avec extraits de code et répétition espacée Leitner',
            'Quiz diagnostiques à 4 choix avec explications détaillées de chaque distracteur',
          ],
          architectureNotes:
            'Orchestration IA multi-paliers via n8n avec basculement automatique Groq 120B / Qwen 27B.',
        },
        {
          id: 'whatsapp',
          title:
            'ChatPulse · Analyseur de Conversations WhatsApp & Intelligence Relationnelle',
          category: 'production',
          badge: {
            label: '💬 Analyse ZIP Locale + IA n8n',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'Télémétrie Relationnelle & Respect Strict de la Vie Privée',
          summary:
            "Suite d'analyse d'exports WhatsApp (.txt / .zip) directement dans la mémoire vive sans téléversement de médias. Calcule les temps de latence de réponse, les matrices d'activité 7×24, et se connecte à un webhook n8n pour l'analyse comportementale.",
          route: '/apps/whatsapp',
          icon: '💬',
          ctaLabel: 'ChatPulse',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Web DecompressionStream',
            'NgRx SignalStore',
            'n8n AI Webhook',
          ],
          features: [
            "Extraction d'archive en mémoire via DecompressionStream ignorant les médias lourds",
            'Détection intelligente des formats de date iOS et Android (JJ/MM vs MM/JJ)',
            'Statistiques de vitesse de réponse, initiateurs de conversations et double-texting',
            "Matrice heatmap d'activité 7×24 et carte Wrapped récapitulative partageable",
          ],
          architectureNotes:
            'Traitement localisé en RAM sans stockage distant pour une sécurité et une confidentialité maximales.',
        },
      ];
    }

    // Default: English
    return [
      {
        id: 'lighting',
        title:
          'LuxPath (SolarLux) · Public & Solar Street Lighting Field Engineering Platform',
        category: 'production',
        badge: {
          label: '☀️ Solar & AC Field Suite',
          variant: 'success',
          pulse: true,
        },
        eyebrow:
          'Field Civil & Photometric Engineering · EN 13201 / Eurocode 7 / NF EN 206',
        summary:
          'A mobile-first on-site engineering suite for public lighting supervisors installing autonomous photovoltaic solar and conventional AC streetlights. Features real-time EN 13201 pole spacing calculations, Eurocode 7 excavation massif depth validation, Abrams slump & concrete mix verification, digital bubble level verticality audit (EN 40 plumb tolerance ≤ 1.0°), optical camera rangefinder, interactive OpenStreetMap pole placement, commercial equipment catalog (BOM), and 1-click milestone calendar export (.ics) and email reminders.',
        route: '/apps/lighting',
        icon: '💡',
        ctaLabel: 'LuxPath',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'Leaflet OpenStreetMap',
          'DeviceOrientation Gyroscope',
          'Camera WebRTC',
          'IndexedDB Local Storage',
          'Trilingual RTL (FR/AR/EN)',
          'NgRx SignalStore',
        ],
        features: [
          'EN 13201-2 Photometrics & Spacing Engine: Evaluates S/H ratios, average lux, and overall uniformity across M1-M6, C0-C5, and P1-P6 road classes',
          'Eurocode 7 Foundation Massif Validator: Wind moment, aerodynamic solar sail drag, minimum excavation depth, and anchor bolt sizing (M16–M24)',
          'NF EN 206 Concrete Formulation & Abrams Cone: Verifies 350 kg/m³ dosage, W/C ≤ 0.50, and Eurocode 2 7-day erection permit curve',
          'EN 40 Pole Verticality & Plumb Gauge: 2D digital spirit level with real-time accelerometer tilt degrees, tip deflection mm, and nut adjustment steps',
          'Optical Camera Rangefinder: Phone camera reticle with trigonometric pitch inclinometer to measure ground distance and pole height',
          'Interactive GPS Field Map: OpenStreetMap with tap-to-place markers, inter-pole distance calculation, and geolocation centering',
          'Autonomous Solar PV & LiFePO4 Sizing: Photovoltaic peak watts, battery Ah/Wh with multi-step dimming profiles and winter solstice coverage',
          'Project Milestones & Email Reminders: 1-click .ics calendar export and mailto: reminder dispatch to clients and municipal supervisors',
        ],
        architectureNotes:
          '100% offline-first field architecture storing projects, poles, and calculation logs in local IndexedDB. All calculations execute locally on device with zero required cloud roundtrips.',
      },
      {
        id: 'basecamp',
        title: 'Basecamp · Camping Trip Planner',
        category: 'production',
        badge: { label: '🏕️ Camping & stars', variant: 'success' },
        eyebrow: 'Weather · Stargazing · Packing lists · Offline-first',
        summary:
          'Plan a camping trip on your phone: pin the campsite on a map, follow up to 16 days of forecast with frost, wind and rain warnings, find the best night for stargazing (true darkness, the Moon, meteor showers), pack a list sized to the group, then share the trip with friends as a link, with no account and no server.',
        route: '/apps/basecamp',
        icon: '🏕️',
        ctaLabel: 'Basecamp',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'Leaflet OpenStreetMap',
          'Open-Meteo API',
          'astronomy-engine',
          'CompressionStream share links',
          'IndexedDB Local Storage',
          'Trilingual RTL (FR/AR/EN)',
          'NgRx SignalStore',
        ],
        features: [
          'Campsite on an OpenStreetMap map, with place search and your location',
          'Open-Meteo forecast day by day, with frost, wind, rain and heat warnings',
          'Nights worked out on the phone: astronomical darkness, Moon phase, meteor showers and a stargazing score',
          'A link into the Sky lab to see the best night’s stars',
          'Packing list by trip type, sized to the people and nights, with who brings what',
          'Items the weather calls for added automatically (tarp, warm layer, guy lines)',
          'Your own gear inventory, showing what to buy or borrow',
          'Trips shared as a link compressed into the URL fragment, plus JSON backups',
        ],
        architectureNotes:
          'Offline-first: trips, gear and the last forecast live in IndexedDB, and the sky is computed on the device.',
      },
      {
        id: 'dispatch',
        title: 'PulseOps · Commercial Operations & Dispatch Control Center',
        category: 'production',
        badge: { label: '🟢 Production Live', variant: 'success', pulse: true },
        eyebrow: 'Commercial Logistics & Subcontractor Hub · London Zones 1–4',
        summary:
          'A comprehensive remote coordinator command center for commercial laundry and hospitality logistics. Manages daily intake, route planning, driver transport, subcontractor wash manifests, missing item chases, and automated shift handovers.',
        route: '/apps/dispatch',
        icon: '🧺',
        ctaLabel: 'PulseOps',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'NestJS REST API',
          'MongoDB Atlas M0',
          'AES-256-GCM',
          'PBKDF2 Auth',
          'NgRx SignalStore',
        ],
        features: [
          '6-Stage Real-Time Order Kanban (Intake, Wash, Ready, Dispatched, Delivered, Invoiced)',
          'Live Fleet Driver Dispatch with stop sequence ordering and emergency courier booking',
          'Subcontractor Plant Management with capacity tracking, wash claims, and QA defect flags',
          'Simulated WhatsApp Comms Hub (Customer, Driver, and Production channels with FIFO ring buffers)',
          'Digital Proof of Delivery (POD) with signature capture and Loading Bay Gate Code security',
          'Shift Handover Automated Reporting with completed orders, incidents, and pending chases',
        ],
        architectureNotes:
          'Enforces strict database overload protection for MongoDB Atlas Free Tier. Sensitive fields are encrypted with AES-256-GCM at rest.',
      },
      {
        id: 'strategy',
        title: 'StrategyApp · Financial Planning & Wealth Projection Engine',
        category: 'production',
        badge: { label: '⚡ Interactive Platform', variant: 'accent' },
        eyebrow: 'Fintech · Scenario Modeling & Cashflow Ledgers',
        summary:
          'Multi-scenario financial forecasting platform that projects net worth, runway, savings rates, and emergency fund coverage over multi-year horizons without transmitting sensitive financial data to any external server.',
        route: '/apps/strategy',
        icon: '📈',
        ctaLabel: 'StrategyApp',
        stack: [
          'Angular 22',
          'NgRx SignalStore',
          'Chart.js',
          'IndexedDB Local Storage',
          'PDF Export Engine',
          '@ah/ui Design Tokens',
        ],
        features: [
          'Multi-Scenario Financial Simulations (Base, Aggressive Savings, Conservative, Career Transition)',
          'Interactive Double-Entry Ledger with categorical income and expense budget tracking',
          'Real-time Net Worth Projections and interactive SVG/Chart visualizers',
          'Emergency Fund Runway & Milestone Target progress calculation',
          'Automated Executive Financial PDF report export',
        ],
        architectureNotes:
          'Zero external data transmission: 100% client-side privacy-first computation with IndexedDB local persistence.',
      },
      {
        id: 'studylm',
        title:
          'StudyLM · Grounded AI Software Engineering Curriculum & Drill Engine',
        category: 'production',
        badge: {
          label: '🤖 Groq 120B AI Engine',
          variant: 'accent',
          pulse: true,
        },
        eyebrow:
          'Autonomous Curriculum Architect & Section-by-Section Assessment Engine',
        summary:
          'A software engineering mastery platform powered by self-hosted n8n workflows and Groq LPU models (120B). Deconstructs complex SE topics into progressive pedagogical branches with uncapped flashcard decks and 4-option diagnostic quizzes.',
        route: '/apps/studylm',
        icon: '📚',
        ctaLabel: 'StudyLM',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'n8n AI Workflow Engine',
          'Groq LPU (120B / 27B)',
          'NgRx SignalStore',
          'Dexie IndexedDB',
        ],
        features: [
          'Software Engineering Topic Guardrail: Intelligent validator rejecting non-SE subjects',
          'Pedagogical Roadmap Deconstruction citing official documentation (MDN, React, PostgreSQL)',
          'Uncapped Technical Flashcards with code snippets and Leitner spaced-repetition ratings',
          'Diagnostic 4-Option Quizzes with comprehensive explanations for every distractor',
        ],
        architectureNotes:
          'Multi-tier AI orchestration via n8n with primary Groq 120B reasoning and automated failover.',
      },
      {
        id: 'whatsapp',
        title:
          'ChatPulse · WhatsApp Chat & AI Relationship Intelligence Analyzer',
        category: 'production',
        badge: {
          label: '💬 In-Browser ZIP + n8n AI',
          variant: 'success',
          pulse: true,
        },
        eyebrow: 'Privacy-First Messaging Analytics · Behavioral Telemetry',
        summary:
          'In-browser WhatsApp export (.txt/.zip) intelligence suite. Extracts transcripts in RAM while bypassing media, computes reply latency distributions, 7×24 activity heatmaps, shareable Wrapped summary cards, and connects to an n8n webhook for AI analysis.',
        route: '/apps/whatsapp',
        icon: '💬',
        ctaLabel: 'ChatPulse',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'Web DecompressionStream',
          'NgRx SignalStore',
          'n8n AI Webhook',
        ],
        features: [
          'In-Memory ZIP & TXT Ingestion: Extracts text while skipping heavy media files',
          'Multi-Format iOS & Android Parser: Auto-detects DD/MM vs MM/DD ordering',
          'Reply & Initiation Dynamics: Turnaround times, session starters, and double-texting index',
          '7×24 Activity Heatmap and shareable Wrapped card',
        ],
        architectureNotes:
          '100% client-side archive extraction and parsing with zero server uploads.',
      },
    ];
  });

  private readonly labsEn: AppItem[] = [
    {
      id: 'sky',
      title:
        'Sky Lab · Interactive 3D Planetarium & Celestial Ephemeris Engine',
      category: 'lab',
      badge: { label: '🌌 3D WebGL Engine', variant: 'info' },
      eyebrow: 'Astronomy & 3D Graphics · WebGL & Orekit Spring Boot',
      summary:
        'Pick any location on Earth, dive down from orbit to ground level, and explore the night sky in real time: 5,000 accurate stars, constellations, exact Moon phases, visible planets, the Milky Way, and meteor showers.',
      route: '/labs/sky',
      icon: '✨',
      ctaLabel: 'Sky Lab',
      stack: [
        'Three.js WebGL',
        'Custom GLSL Shaders',
        'Astronomy Engine',
        'Spring Boot 4 + Orekit',
        'Render Hosted Orbit API',
      ],
      features: [
        'Interactive 3D Earth Globe with smooth orbital dive down to ground observer perspective',
        'Real-Time Starfield of 5,000 real stars with constellation figure projections',
        'True Moon Phase & Planet ephemerides calculations for any historical or future date',
        'Astronomical Twilight, darkness windows, and observation condition planner',
      ],
      architectureNotes:
        'Framework-free Three.js engine with on-demand frame rendering, off-screen pausing, and automated tier scaling for 60fps performance across mobile and desktop.',
    },
    {
      id: 'rxjs',
      title: 'RxJS Interactive Lab · Stream Operators & Reactive Architecture',
      category: 'lab',
      badge: { label: '🧪 Reactive Lab', variant: 'warning' },
      eyebrow: 'Reactive Programming · Marble Visualizers & Backpressure',
      summary:
        'An interactive laboratory for mastering complex RxJS stream mechanics: animated marble diagrams, operator comparisons, backpressure strategies, multicast subjects, and signal interoperability.',
      route: '/labs/rxjs',
      icon: '⚡',
      ctaLabel: 'RxJS Lab',
      stack: [
        'Angular 22 Zoneless',
        'RxJS 7+',
        'SVG Animated Pipelines',
        'Signal-to-Observable Interop',
      ],
      features: [
        'Live Marble Diagrams showing asynchronous value emission and error propagation',
        'Side-by-Side Backpressure Showdown: debounceTime vs throttleTime vs auditTime vs sampleTime',
        'Combination Operator Simulator: switchMap vs mergeMap vs concatMap vs exhaustMap',
        'Production Resilient Patterns: exponential backoff retry and request deduplication',
      ],
      architectureNotes:
        'Zoneless reactive pipeline visualizer connecting RxJS Observables directly to Angular Signals without zone.js overhead.',
    },
    {
      id: 'ngrx',
      title: 'NgRx State Architecture Lab · SignalStore & Redux Workbench',
      category: 'lab',
      badge: { label: '🏛️ Architecture Lab', variant: 'neutral' },
      eyebrow: 'State Architecture · NgRx Store & @ngrx/signals',
      summary:
        'Comprehensive workbench exploring enterprise state architectures: visual Redux unidirectional data flow, asynchronous side-effects, declarative SignalStore with entity normalization, and an architectural comparison matrix.',
      route: '/labs/ngrx',
      icon: '🧠',
      ctaLabel: 'NgRx Lab',
      stack: [
        'Angular 22',
        '@ngrx/signals',
        '@ngrx/signals/entities',
        'NgRx Store & Effects',
        '@ah/ui Design System',
      ],
      features: [
        'Interactive 4-Stage Redux Cycle (Dispatch Action → Reducer Transition → Selector Query → Effect Execution)',
        'Declarative SignalStore with withEntities(), withComputed(), and rxMethod() async pipelines',
        'Time-Travel Debugging Panel with state snapshots, replay controls, and rollback capability',
        'Architectural Showdown: In-depth comparison matrix of NgRx Store vs SignalStore vs Service-based state',
      ],
      architectureNotes:
        'Demonstrates modern Angular state patterns with zero zone.js overhead, combining lightweight functional composition with robust enterprise invariants.',
    },
  ];

  /** The labs in the site's language: English, with French and Arabic text over it. */
  protected readonly engineeringLabs = computed<AppItem[]>(() => {
    const copy = LAB_COPY[this.currentLang()];
    return this.labsEn.map((lab) => {
      const text = copy?.[lab.id];
      return text
        ? { ...lab, ...text, badge: { ...lab.badge, label: text.badge } }
        : lab;
    });
  });

  constructor() {
    inject(Seo).update({
      title: 'Applications & Interactive Engineering Labs · Ahmed Hrichi',
      description:
        'Explore live production applications and interactive engineering laboratories: LuxPath public lighting, Basecamp camping planner, PulseOps commercial dispatch, StrategyApp financial planning, Sky Lab 3D planetarium, RxJS and NgRx architectures.',
      path: '/apps',
    });
  }
}
