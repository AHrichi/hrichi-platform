import { filterEnabledApps } from './app-visibility';
import type { EnergyProfile, EngineeringProject } from './model';
import type { SiteLanguage } from './i18n/content-i18n.types';

/**
 * The energy engineering track, for /energy and the energy CV (/cv/energy).
 * Every claim points at work in this repo: SerraCalc (ADR-0027) and LuxPath
 * (ADR-0019). Keep it that way; add internships or a final-year project only
 * with the owner's own facts.
 */

const SERRACALC_METHODS = [
  'ASAE EP406',
  'FAO-56',
  'Boulard & Baille (1995)',
  'Stull (2011)',
  'Thimijan & Heins (1983)',
] as const;

const LUXPATH_METHODS = [
  'EN 13201',
  'NF C 11-201',
  'Eurocode 7',
  'EN 40',
] as const;

const SCHOOL = {
  en: 'National Engineering School of Monastir (ENIM)',
  fr: 'École Nationale d’Ingénieurs de Monastir (ENIM)',
  ar: 'المدرسة الوطنية للمهندسين بالمنستير (ENIM)',
  it: 'Scuola Nazionale di Ingegneri di Monastir (ENIM)',
  de: 'Nationale Ingenieurschule von Monastir (ENIM)',
} as const satisfies Record<SiteLanguage, string>;

const PERIOD = '2017 – 2020';

const EN: EnergyProfile = {
  role: 'Energy Engineer · Thermal, Solar & Engineering Software',
  summary:
    'Energy engineer (ENIM, 2020) who also writes software. I turn heat-transfer, HVAC, solar and water calculations into tested field tools that work offline: SerraCalc sizes greenhouse heating, cooling and water systems, and LuxPath sizes grid-fed and stand-alone solar street lighting. Five years of professional software engineering bring automation, data handling and reliable, tested code to energy studies, audits and design work.',
  degree: {
    title: 'National Engineering Degree in Energy Engineering',
    school: SCHOOL.en,
    period: PERIOD,
  },
  skills: [
    {
      name: 'Thermal & HVAC',
      items: [
        'Heat loss and peak heating load',
        'Monthly heating demand, fuel, cost and CO₂',
        'Hot-water and geothermal pipe networks',
        'Natural ventilation and fan & pad cooling',
        'Psychrometrics: wet bulb, dew point, condensation',
      ],
    },
    {
      name: 'Solar & electrical',
      items: [
        'Stand-alone PV and battery sizing',
        'LED retrofit savings and payback',
        'Cable sizing and voltage drop',
        'Grid CO₂ emission factors',
      ],
    },
    {
      name: 'Water & hydraulics',
      items: [
        'Crop water demand (FAO-56)',
        'Drip irrigation sections',
        'Pump flow and power',
        'Rainwater harvesting and storage simulation',
      ],
    },
    {
      name: 'Standards & references',
      items: [
        'ASAE EP406 (greenhouse heating)',
        'FAO-56 (evapotranspiration, day length)',
        'EN 13201 (road lighting)',
        'NF C 11-201 (overhead lines)',
      ],
    },
    {
      name: 'Engineering software',
      items: [
        'Unit-tested calculation engines in TypeScript',
        'Angular & offline PWAs',
        'Data visualisation (charts, drawings to scale)',
        'NestJS & MongoDB',
        'Automation with n8n',
      ],
    },
  ],
  projects: [
    {
      id: 'serracalc',
      name: 'SerraCalc',
      title: 'Greenhouse heating, cooling and water engineering',
      summary:
        'An offline field app for greenhouse engineers in Tunisia, in French, Arabic, English, Italian and German: describe the house once, then size its heating, cooling, lighting and water.',
      highlights: [
        {
          title: 'Heating',
          text: 'Peak load Q = (U·A + 0.335·N·V + F·P) × ΔT with ASAE EP406 U-values and thermal screens; monthly day and night demand from the FAO-56 day length; fuel, cost and CO₂ for gas, LPG, oil, heat pump, geothermal water or biomass.',
        },
        {
          title: 'Geothermal hot-water pipes',
          text: 'Pipe output by free convection and radiation, pipe length, loops, velocity, pump power and a year of geothermal water at 60–75 °C.',
        },
        {
          title: 'Cooling & climate',
          text: 'Roof vent area (Boulard & Baille), fans and wet pads with Stull’s wet bulb, supplementary lighting from the daily light integral, CO₂ enrichment, and night humidity against the dew point.',
        },
        {
          title: 'Water',
          text: 'Crop transpiration from solar radiation, drip irrigation shots and sections, and a two-year, month-by-month rainwater basin simulation.',
        },
        {
          title: 'Verified',
          text: 'Over 40 unit tests check each formula against hand-worked numbers and realistic ranges, such as a few tens of kWh/m² a year for a Tunisian tomato house.',
        },
      ],
      methods: SERRACALC_METHODS,
    },
    {
      id: 'lighting',
      name: 'LuxPath',
      title: 'Public and solar street lighting engineering',
      summary:
        'A field kit for street lighting engineers and site supervisors, for grid-fed poles and stand-alone solar poles.',
      highlights: [
        {
          title: 'Solar sizing',
          text: 'Panel and battery for stand-alone poles from peak sun hours, a multi-stage night dimming profile, days of autonomy and a performance ratio.',
        },
        {
          title: 'Energy & cost',
          text: 'LED retrofit comparison: yearly kWh with dimming, cost at a tariff, CO₂ at a grid factor (0.47 kg/kWh for Tunisia) and simple payback.',
        },
        {
          title: 'Electrical networks',
          text: 'Single- and three-phase current, cable section and voltage drop for lighting circuits (3 % limit).',
        },
        {
          title: 'Lines & structures',
          text: 'Pole spacing by EN 13201 road class, cable sag and tension by the change-of-state equation (NF C 11-201), foundations, and a plumb check with the phone.',
        },
      ],
      methods: LUXPATH_METHODS,
    },
  ],
  targetRoles: [
    'Energy efficiency and audits',
    'Renewable energy (solar PV)',
    'HVAC and thermal systems',
    'Software and digital tools for energy',
  ],
};

const FR: EnergyProfile = {
  role: 'Ingénieur énergéticien · Thermique, solaire et logiciels d’ingénierie',
  summary:
    'Ingénieur en génie énergétique (ENIM, 2020) qui développe aussi des logiciels. Je transforme les calculs de thermique, de climatisation, de solaire et d’hydraulique en outils de terrain testés, utilisables hors ligne : SerraCalc dimensionne le chauffage, le refroidissement et l’eau des serres, et LuxPath l’éclairage public raccordé au réseau ou solaire autonome. Cinq ans de développement logiciel professionnel apportent aux études, audits et projets énergétiques l’automatisation, le traitement des données et un code fiable et testé.',
  degree: {
    title: 'Diplôme National d’Ingénieur en Génie Énergétique',
    school: SCHOOL.fr,
    period: PERIOD,
  },
  skills: [
    {
      name: 'Thermique & CVC',
      items: [
        'Déperditions et puissance de chauffage de pointe',
        'Besoins mensuels de chauffage, combustible, coût et CO₂',
        'Réseaux de tubes à eau chaude et géothermale',
        'Ventilation naturelle et refroidissement par pad & ventilateurs',
        'Psychrométrie : température humide, point de rosée, condensation',
      ],
    },
    {
      name: 'Solaire & électricité',
      items: [
        'Dimensionnement PV autonome et batteries',
        'Économies et temps de retour d’une rénovation LED',
        'Section des câbles et chute de tension',
        'Facteurs d’émission CO₂ du réseau',
      ],
    },
    {
      name: 'Eau & hydraulique',
      items: [
        'Besoins en eau des cultures (FAO-56)',
        'Secteurs d’irrigation goutte-à-goutte',
        'Débit et puissance des pompes',
        'Récupération des eaux de pluie et simulation du stockage',
      ],
    },
    {
      name: 'Normes & références',
      items: [
        'ASAE EP406 (chauffage des serres)',
        'FAO-56 (évapotranspiration, durée du jour)',
        'EN 13201 (éclairage routier)',
        'NF C 11-201 (lignes aériennes)',
      ],
    },
    {
      name: 'Logiciels d’ingénierie',
      items: [
        'Moteurs de calcul TypeScript testés unitairement',
        'Angular & PWA hors ligne',
        'Visualisation de données (graphiques, plans à l’échelle)',
        'NestJS & MongoDB',
        'Automatisation avec n8n',
      ],
    },
  ],
  projects: [
    {
      id: 'serracalc',
      name: 'SerraCalc',
      title:
        'Ingénierie du chauffage, du refroidissement et de l’eau des serres',
      summary:
        'Application de terrain hors ligne pour les ingénieurs serristes en Tunisie, en français, arabe, anglais, italien et allemand : on décrit la serre une fois, puis on dimensionne son chauffage, son refroidissement, son éclairage et son eau.',
      highlights: [
        {
          title: 'Chauffage',
          text: 'Puissance de pointe Q = (U·A + 0,335·N·V + F·P) × ΔT avec les coefficients U de l’ASAE EP406 et les écrans thermiques ; besoins mensuels de jour et de nuit selon la durée du jour FAO-56 ; combustible, coût et CO₂ pour gaz, GPL, fioul, pompe à chaleur, eau géothermale ou biomasse.',
        },
        {
          title: 'Tubes à eau chaude géothermale',
          text: 'Émission des tubes par convection naturelle et rayonnement, longueur de tube, boucles, vitesse, puissance de pompe et une année d’eau géothermale à 60–75 °C.',
        },
        {
          title: 'Refroidissement & climat',
          text: 'Surface des ouvrants (Boulard & Baille), ventilateurs et pads humides avec la température humide de Stull, éclairage d’appoint à partir de l’intégrale lumineuse journalière, enrichissement en CO₂ et humidité nocturne face au point de rosée.',
        },
        {
          title: 'Eau',
          text: 'Transpiration des cultures à partir du rayonnement solaire, apports et secteurs du goutte-à-goutte, et simulation mois par mois sur deux ans d’un bassin d’eau de pluie.',
        },
        {
          title: 'Vérifié',
          text: 'Plus de 40 tests unitaires comparent chaque formule à des calculs faits à la main et à des ordres de grandeur réalistes, comme quelques dizaines de kWh/m² par an pour une serre de tomates en Tunisie.',
        },
      ],
      methods: SERRACALC_METHODS,
    },
    {
      id: 'lighting',
      name: 'LuxPath',
      title: 'Ingénierie de l’éclairage public et solaire',
      summary:
        'Outil de terrain pour les ingénieurs et conducteurs de travaux de l’éclairage public, pour les candélabres raccordés au réseau comme pour les candélabres solaires autonomes.',
      highlights: [
        {
          title: 'Dimensionnement solaire',
          text: 'Panneau et batterie des candélabres autonomes à partir des heures d’ensoleillement crête, d’un profil de gradation nocturne en plusieurs paliers, des jours d’autonomie et d’un ratio de performance.',
        },
        {
          title: 'Énergie & coût',
          text: 'Comparaison de rénovation LED : kWh annuels avec gradation, coût au tarif, CO₂ au facteur du réseau (0,47 kg/kWh pour la Tunisie) et temps de retour simple.',
        },
        {
          title: 'Réseaux électriques',
          text: 'Courant monophasé et triphasé, section de câble et chute de tension des circuits d’éclairage (limite de 3 %).',
        },
        {
          title: 'Lignes & ouvrages',
          text: 'Interdistance des candélabres selon la classe de voie EN 13201, flèche et tension des câbles par l’équation de changement d’état (NF C 11-201), fondations et contrôle d’aplomb au téléphone.',
        },
      ],
      methods: LUXPATH_METHODS,
    },
  ],
  targetRoles: [
    'Efficacité énergétique et audits',
    'Énergies renouvelables (photovoltaïque)',
    'Génie climatique et systèmes thermiques',
    'Logiciels et outils numériques pour l’énergie',
  ],
};

const AR: EnergyProfile = {
  role: 'مهندس طاقة · الحراريات والطاقة الشمسية وبرمجيات الهندسة',
  summary:
    'مهندس في الهندسة الطاقية (ENIM، 2020) أطوّر البرمجيات أيضاً. أحوّل حسابات انتقال الحرارة والتكييف والطاقة الشمسية والمياه إلى أدوات ميدانية مُختبَرة تعمل دون اتصال: SerraCalc يحدّد أبعاد تدفئة البيوت المحمية وتبريدها ومياهها، وLuxPath يحدّد أبعاد الإنارة العمومية الموصولة بالشبكة أو الشمسية المستقلة. وتضيف خمس سنوات من تطوير البرمجيات الاحترافي إلى الدراسات والتدقيقات والمشاريع الطاقية الأتمتةَ ومعالجةَ البيانات وشيفرةً موثوقة ومُختبَرة.',
  degree: {
    title: 'الشهادة الوطنية لمهندس في الهندسة الطاقية',
    school: SCHOOL.ar,
    period: PERIOD,
  },
  skills: [
    {
      name: 'الحراريات والتكييف',
      items: [
        'الضياع الحراري وقدرة التدفئة القصوى',
        'احتياجات التدفئة الشهرية والوقود والكلفة وثاني أكسيد الكربون',
        'شبكات أنابيب الماء الساخن والمياه الجيوحرارية',
        'التهوئة الطبيعية والتبريد بالوسائد المبللة والمراوح',
        'خصائص الهواء الرطب: درجة الحرارة الرطبة ونقطة الندى والتكاثف',
      ],
    },
    {
      name: 'الطاقة الشمسية والكهرباء',
      items: [
        'تحديد أبعاد المنظومات الكهروضوئية المستقلة والبطاريات',
        'وفورات التحويل إلى LED ومدة استرداد كلفته',
        'مقطع الكوابل وهبوط الجهد',
        'معاملات انبعاث ثاني أكسيد الكربون للشبكة',
      ],
    },
    {
      name: 'المياه والهيدروليك',
      items: [
        'احتياجات الزراعات من الماء (FAO-56)',
        'قطاعات الري قطرة قطرة',
        'تدفق المضخات وقدرتها',
        'تجميع مياه الأمطار ومحاكاة التخزين',
      ],
    },
    {
      name: 'المعايير والمراجع',
      items: [
        'ASAE EP406 (تدفئة البيوت المحمية)',
        'FAO-56 (التبخر والنتح وطول النهار)',
        'EN 13201 (إنارة الطرق)',
        'NF C 11-201 (الخطوط الهوائية)',
      ],
    },
    {
      name: 'برمجيات الهندسة',
      items: [
        'محركات حساب بلغة TypeScript مع اختبارات وحدات',
        'Angular وتطبيقات PWA تعمل دون اتصال',
        'عرض البيانات (رسوم بيانية ومخططات بمقياس رسم)',
        'NestJS وMongoDB',
        'الأتمتة بـ n8n',
      ],
    },
  ],
  projects: [
    {
      id: 'serracalc',
      name: 'SerraCalc',
      title: 'هندسة تدفئة البيوت المحمية وتبريدها ومياهها',
      summary:
        'تطبيق ميداني يعمل دون اتصال لمهندسي البيوت المحمية في تونس، بالفرنسية والعربية والإنجليزية والإيطالية والألمانية: تصف البيت مرة واحدة، ثم تحدّد أبعاد تدفئته وتبريده وإضاءته ومياهه.',
      highlights: [
        {
          title: 'التدفئة',
          text: 'القدرة القصوى Q = (U·A + 0.335·N·V + F·P) × ΔT بمعاملات U من ASAE EP406 مع الستائر الحرارية؛ احتياجات شهرية ليلاً ونهاراً حسب طول النهار وفق FAO-56؛ والوقود والكلفة وثاني أكسيد الكربون للغاز وغاز البترول المسال والمازوت والمضخة الحرارية والمياه الجيوحرارية والكتلة الحيوية.',
        },
        {
          title: 'أنابيب المياه الجيوحرارية',
          text: 'حرارة الأنبوب بالحمل الطبيعي والإشعاع، وطول الأنابيب والحلقات والسرعة وقدرة المضخة وكمية المياه الجيوحرارية لسنة كاملة بين 60 و75 °م.',
        },
        {
          title: 'التبريد والمناخ',
          text: 'مساحة فتحات السقف (Boulard وBaille)، والمراوح والوسائد المبللة بدرجة الحرارة الرطبة لـ Stull، والإضاءة التكميلية انطلاقاً من التكامل الضوئي اليومي، والتسميد بثاني أكسيد الكربون، والرطوبة الليلية مقارنةً بنقطة الندى.',
        },
        {
          title: 'المياه',
          text: 'نتح الزراعات انطلاقاً من الإشعاع الشمسي، ودفعات الري قطرة قطرة وقطاعاته، ومحاكاة شهرية لحوض مياه الأمطار على مدى سنتين.',
        },
        {
          title: 'مُتحقَّق منه',
          text: 'أكثر من 40 اختبار وحدة تقارن كل معادلة بحسابات يدوية وبمجالات واقعية، مثل بضع عشرات من الكيلوواط ساعة للمتر المربع سنوياً لبيت طماطم في تونس.',
        },
      ],
      methods: SERRACALC_METHODS,
    },
    {
      id: 'lighting',
      name: 'LuxPath',
      title: 'هندسة الإنارة العمومية والشمسية',
      summary:
        'عدّة ميدانية لمهندسي الإنارة العمومية ومشرفي أشغالها، للأعمدة الموصولة بالشبكة وللأعمدة الشمسية المستقلة.',
      highlights: [
        {
          title: 'تحديد أبعاد المنظومة الشمسية',
          text: 'اللوح والبطارية للأعمدة المستقلة انطلاقاً من ساعات الذروة الشمسية، وبرنامج تخفيض إضاءة ليلي متعدد المراحل، وأيام الاستقلالية، ونسبة الأداء.',
        },
        {
          title: 'الطاقة والكلفة',
          text: 'مقارنة التحويل إلى LED: الكيلوواط ساعة السنوية مع تخفيض الإضاءة، والكلفة حسب التعريفة، وثاني أكسيد الكربون حسب معامل الشبكة (0.47 كغ/كيلوواط ساعة لتونس)، ومدة الاسترداد البسيطة.',
        },
        {
          title: 'الشبكات الكهربائية',
          text: 'التيار أحادي الطور وثلاثي الأطوار، ومقطع الكابل وهبوط الجهد لدوائر الإنارة (حدّ 3 %).',
        },
        {
          title: 'الخطوط والمنشآت',
          text: 'التباعد بين الأعمدة حسب صنف الطريق وفق EN 13201، وترخيم الكوابل وشدّها بمعادلة تغيّر الحالة (NF C 11-201)، والأساسات، والتحقق من شاقولية العمود بالهاتف.',
        },
      ],
      methods: LUXPATH_METHODS,
    },
  ],
  targetRoles: [
    'النجاعة الطاقية والتدقيق الطاقي',
    'الطاقات المتجددة (الكهروضوئية)',
    'هندسة التكييف والأنظمة الحرارية',
    'البرمجيات والأدوات الرقمية للطاقة',
  ],
};

const IT: EnergyProfile = {
  role: 'Ingegnere energetico · Termotecnica, solare e software di ingegneria',
  summary:
    'Ingegnere energetico (ENIM, 2020) che sviluppa anche software. Trasformo i calcoli di trasmissione del calore, climatizzazione, solare e idraulica in strumenti da campo testati e utilizzabili offline: SerraCalc dimensiona riscaldamento, raffrescamento e acqua delle serre, e LuxPath l’illuminazione pubblica collegata alla rete o solare autonoma. Cinque anni di sviluppo software professionale portano a studi, audit e progetti energetici automazione, gestione dei dati e codice affidabile e testato.',
  degree: {
    title: 'Laurea Magistrale in Ingegneria Energetica',
    school: SCHOOL.it,
    period: PERIOD,
  },
  skills: [
    {
      name: 'Termotecnica & HVAC',
      items: [
        'Dispersioni termiche e potenza di picco',
        'Fabbisogno mensile di riscaldamento, combustibile, costo e CO₂',
        'Reti di tubi ad acqua calda e geotermica',
        'Ventilazione naturale e raffrescamento con pannelli evaporativi',
        'Psicrometria: bulbo umido, punto di rugiada, condensa',
      ],
    },
    {
      name: 'Solare & impianti elettrici',
      items: [
        'Dimensionamento fotovoltaico autonomo e batterie',
        'Risparmio e ritorno di una sostituzione con LED',
        'Sezione dei cavi e caduta di tensione',
        'Fattori di emissione CO₂ della rete',
      ],
    },
    {
      name: 'Acqua & idraulica',
      items: [
        'Fabbisogno idrico delle colture (FAO-56)',
        'Settori di irrigazione a goccia',
        'Portata e potenza delle pompe',
        'Raccolta dell’acqua piovana e simulazione dell’accumulo',
      ],
    },
    {
      name: 'Norme & riferimenti',
      items: [
        'ASAE EP406 (riscaldamento delle serre)',
        'FAO-56 (evapotraspirazione, durata del giorno)',
        'EN 13201 (illuminazione stradale)',
        'NF C 11-201 (linee aeree)',
      ],
    },
    {
      name: 'Software di ingegneria',
      items: [
        'Motori di calcolo in TypeScript con test unitari',
        'Angular & PWA offline',
        'Visualizzazione dei dati (grafici, disegni in scala)',
        'NestJS & MongoDB',
        'Automazione con n8n',
      ],
    },
  ],
  projects: [
    {
      id: 'serracalc',
      name: 'SerraCalc',
      title: 'Ingegneria del riscaldamento, raffrescamento e acqua delle serre',
      summary:
        'App da campo offline per gli ingegneri delle serre in Tunisia, in francese, arabo, inglese, italiano e tedesco: si descrive la serra una volta, poi se ne dimensionano riscaldamento, raffrescamento, illuminazione e acqua.',
      highlights: [
        {
          title: 'Riscaldamento',
          text: 'Potenza di picco Q = (U·A + 0,335·N·V + F·P) × ΔT con i valori U dell’ASAE EP406 e gli schermi termici; fabbisogno mensile di giorno e di notte dalla durata del giorno FAO-56; combustibile, costo e CO₂ per gas, GPL, gasolio, pompa di calore, acqua geotermica o biomassa.',
        },
        {
          title: 'Tubi ad acqua geotermica',
          text: 'Resa dei tubi per convezione naturale e irraggiamento, lunghezza, circuiti, velocità, potenza della pompa e un anno di acqua geotermica a 60–75 °C.',
        },
        {
          title: 'Raffrescamento & clima',
          text: 'Superficie delle aperture (Boulard & Baille), ventilatori e pannelli evaporativi con il bulbo umido di Stull, illuminazione supplementare dall’integrale di luce giornaliero, arricchimento di CO₂ e umidità notturna rispetto al punto di rugiada.',
        },
        {
          title: 'Acqua',
          text: 'Traspirazione delle colture dalla radiazione solare, turni e settori dell’irrigazione a goccia e una simulazione mese per mese su due anni di una vasca di acqua piovana.',
        },
        {
          title: 'Verificato',
          text: 'Oltre 40 test unitari confrontano ogni formula con calcoli svolti a mano e con ordini di grandezza realistici, come qualche decina di kWh/m² all’anno per una serra di pomodori in Tunisia.',
        },
      ],
      methods: SERRACALC_METHODS,
    },
    {
      id: 'lighting',
      name: 'LuxPath',
      title: 'Ingegneria dell’illuminazione pubblica e solare',
      summary:
        'Kit da campo per ingegneri e direttori di cantiere dell’illuminazione pubblica, per pali collegati alla rete e pali solari autonomi.',
      highlights: [
        {
          title: 'Dimensionamento solare',
          text: 'Pannello e batteria dei pali autonomi a partire dalle ore di sole di picco, da un profilo di regolazione notturna in più fasi, dai giorni di autonomia e da un performance ratio.',
        },
        {
          title: 'Energia & costi',
          text: 'Confronto per la sostituzione con LED: kWh annui con regolazione, costo a tariffa, CO₂ con il fattore della rete (0,47 kg/kWh per la Tunisia) e tempo di ritorno semplice.',
        },
        {
          title: 'Reti elettriche',
          text: 'Corrente monofase e trifase, sezione dei cavi e caduta di tensione dei circuiti di illuminazione (limite del 3 %).',
        },
        {
          title: 'Linee & strutture',
          text: 'Interdistanza dei pali secondo la categoria stradale EN 13201, freccia e tiro dei cavi con l’equazione del cambiamento di stato (NF C 11-201), fondazioni e verifica della verticalità con il telefono.',
        },
      ],
      methods: LUXPATH_METHODS,
    },
  ],
  targetRoles: [
    'Efficienza energetica e audit',
    'Energie rinnovabili (fotovoltaico)',
    'HVAC e sistemi termici',
    'Software e strumenti digitali per l’energia',
  ],
};

const DE: EnergyProfile = {
  role: 'Ingenieur Energietechnik · Wärme, Solar & Ingenieursoftware',
  summary:
    'Ingenieur der Energietechnik (ENIM, 2020), der auch Software entwickelt. Ich mache aus Berechnungen zu Wärmeübertragung, Klimatechnik, Solarenergie und Wasser getestete Feldwerkzeuge, die offline funktionieren: SerraCalc dimensioniert Heizung, Kühlung und Wasser von Gewächshäusern, LuxPath die netzgebundene und die autarke solare Straßenbeleuchtung. Fünf Jahre professionelle Softwareentwicklung bringen Automatisierung, Datenverarbeitung und zuverlässigen, getesteten Code in Energiestudien, Audits und Planungsprojekte.',
  degree: {
    title: 'Staatliches Ingenieurdiplom in Energietechnik',
    school: SCHOOL.de,
    period: PERIOD,
  },
  skills: [
    {
      name: 'Wärme- & Klimatechnik',
      items: [
        'Wärmeverluste und Spitzenheizlast',
        'Monatlicher Heizbedarf, Brennstoff, Kosten und CO₂',
        'Heizrohrnetze mit Warm- und Thermalwasser',
        'Natürliche Lüftung und Kühlung mit Pad & Ventilator',
        'Psychrometrie: Feuchtkugeltemperatur, Taupunkt, Kondensation',
      ],
    },
    {
      name: 'Solar & Elektrotechnik',
      items: [
        'Auslegung autarker PV-Anlagen und Batterien',
        'Einsparung und Amortisation einer LED-Umrüstung',
        'Kabelquerschnitt und Spannungsfall',
        'CO₂-Emissionsfaktoren des Netzes',
      ],
    },
    {
      name: 'Wasser & Hydraulik',
      items: [
        'Wasserbedarf von Kulturen (FAO-56)',
        'Abschnitte der Tropfbewässerung',
        'Förderstrom und Pumpenleistung',
        'Regenwassernutzung und Speichersimulation',
      ],
    },
    {
      name: 'Normen & Referenzen',
      items: [
        'ASAE EP406 (Gewächshausheizung)',
        'FAO-56 (Evapotranspiration, Tageslänge)',
        'EN 13201 (Straßenbeleuchtung)',
        'NF C 11-201 (Freileitungen)',
      ],
    },
    {
      name: 'Ingenieursoftware',
      items: [
        'Getestete Berechnungskerne in TypeScript',
        'Angular & Offline-PWAs',
        'Datenvisualisierung (Diagramme, maßstäbliche Zeichnungen)',
        'NestJS & MongoDB',
        'Automatisierung mit n8n',
      ],
    },
  ],
  projects: [
    {
      id: 'serracalc',
      name: 'SerraCalc',
      title: 'Heizung, Kühlung und Wasser für Gewächshäuser',
      summary:
        'Offline-Feld-App für Gewächshausingenieure in Tunesien, auf Französisch, Arabisch, Englisch, Italienisch und Deutsch: Das Gewächshaus wird einmal beschrieben, dann werden Heizung, Kühlung, Belichtung und Wasser ausgelegt.',
      highlights: [
        {
          title: 'Heizung',
          text: 'Spitzenlast Q = (U·A + 0,335·N·V + F·P) × ΔT mit U-Werten nach ASAE EP406 und Energieschirmen; monatlicher Bedarf bei Tag und Nacht aus der Tageslänge nach FAO-56; Brennstoff, Kosten und CO₂ für Gas, Flüssiggas, Heizöl, Wärmepumpe, Thermalwasser oder Biomasse.',
        },
        {
          title: 'Thermalwasser-Heizrohre',
          text: 'Rohrleistung aus freier Konvektion und Strahlung, Rohrlänge, Heizkreise, Fließgeschwindigkeit, Pumpenleistung und ein Jahr Thermalwasser bei 60–75 °C.',
        },
        {
          title: 'Kühlung & Klima',
          text: 'Lüftungsfläche (Boulard & Baille), Ventilatoren und Kühlpads mit der Feuchtkugeltemperatur nach Stull, Zusatzbelichtung aus dem Tageslichtintegral, CO₂-Düngung und nächtliche Feuchte gegenüber dem Taupunkt.',
        },
        {
          title: 'Wasser',
          text: 'Transpiration der Kulturen aus der Globalstrahlung, Gaben und Abschnitte der Tropfbewässerung sowie eine monatliche Zwei-Jahres-Simulation eines Regenwasserbeckens.',
        },
        {
          title: 'Geprüft',
          text: 'Über 40 Unit-Tests vergleichen jede Formel mit Handrechnungen und realistischen Größenordnungen, etwa einigen Dutzend kWh/m² im Jahr für ein tunesisches Tomatengewächshaus.',
        },
      ],
      methods: SERRACALC_METHODS,
    },
    {
      id: 'lighting',
      name: 'LuxPath',
      title: 'Öffentliche und solare Straßenbeleuchtung',
      summary:
        'Feldwerkzeug für Ingenieure und Bauleiter der öffentlichen Beleuchtung, für netzgebundene Masten und autarke Solarmasten.',
      highlights: [
        {
          title: 'Solarauslegung',
          text: 'Modul und Batterie autarker Masten aus den Spitzensonnenstunden, einem mehrstufigen Nachtabsenkungsprofil, den Autonomietagen und einer Performance Ratio.',
        },
        {
          title: 'Energie & Kosten',
          text: 'LED-Umrüstung im Vergleich: Jahres-kWh mit Absenkung, Kosten zum Tarif, CO₂ mit dem Netzfaktor (0,47 kg/kWh für Tunesien) und einfache Amortisationszeit.',
        },
        {
          title: 'Elektrische Netze',
          text: 'Ein- und dreiphasiger Strom, Kabelquerschnitt und Spannungsfall von Beleuchtungsstromkreisen (Grenze 3 %).',
        },
        {
          title: 'Leitungen & Bauwerke',
          text: 'Mastabstand nach EN-13201-Beleuchtungsklasse, Durchhang und Zug der Kabel mit der Zustandsgleichung (NF C 11-201), Fundamente und Lotprüfung per Smartphone.',
        },
      ],
      methods: LUXPATH_METHODS,
    },
  ],
  targetRoles: [
    'Energieeffizienz und Energieaudits',
    'Erneuerbare Energien (Photovoltaik)',
    'HLK und thermische Systeme',
    'Software und digitale Werkzeuge für Energie',
  ],
};

const ENERGY: Record<SiteLanguage, EnergyProfile> = {
  en: EN,
  fr: FR,
  ar: AR,
  it: IT,
  de: DE,
};

export function getEnergyProfile(lang: SiteLanguage = 'en'): EnergyProfile {
  return ENERGY[lang] ?? EN;
}

/** The projects whose apps are switched on (PORTFOLIO_APPS_CONFIG). */
export function energyProjects(
  lang: SiteLanguage = 'en',
): readonly EngineeringProject[] {
  return filterEnabledApps(getEnergyProfile(lang).projects);
}
