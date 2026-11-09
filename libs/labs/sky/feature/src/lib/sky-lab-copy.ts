import type { Twilight } from '@ah/labs/sky/domain';
import type { SiteLanguage } from '@ah/shared/state';

export interface SkyLabCopy {
  twilight: Record<Twilight, string>;
  speeds: {
    paused: string;
    live: string;
    x60: string;
    x600: string;
    x3600: string;
  };
  directions: {
    n: string;
    e: string;
    s: string;
    w: string;
  };
  lookUpAtSky: string;
  backToEarth: string;
  face: string;
  time: string;
  dateAndTime: string;
  localTimeIn: (place: string) => string;
  yourTimeZone: string;
  now: string;
  speed: string;
  throughTonight: string;
  show: string;
  constellations: string;
  names: string;
  milkyWay: string;
  yourSky: string;
  campsiteOrCity: string;
  chooseACity: string;
  useMyLocation: string;
  yourLocation: string;
  locatingAsking: string;
  locatingDenied: string;
  locatingUnavailable: string;
  locatingDefault: string;
  where: string;
  belowTheHorizon: string;
  highInThe: (alt: number, dir: string) => string;
  theMoon: string;
  theSun: string;
  rises: string;
  sets: string;
  planetSubtitle: (mag: string) => string;
  aStar: string;
  starSubtitle: (constellation: string, mag: string) => string;
  starTooFaint: string;
  constellation: string;
  close: string;
  lit: (pct: string) => string;
  whatsUpTonight: string;
  sunset: string;
  sunDoesNotSet: string;
  trulyDark: string;
  notTonight: string;
  sunrise: string;
  moon: string;
  moonFact: (phase: string, pct: string, rise: string, set: string) => string;
  planets: string;
  planetUpNow: (alt: number, dir: string, mag: string) => string;
  planetBelowHorizon: (rise: string, set: string) => string;
  meteorShowers: string;
  showerText: (
    rate: number,
    rad: string,
    speed: number,
    parent: string,
  ) => string;
  radiantUp: (alt: number) => string;
  radiantBelowHorizon: string;
  constellationsUpHigh: string;
  noneHighUp: string;
  bestNightsToGo: string;
  plannerLoading: string;
  plannerWaking: string;
  plannerUnavailable: string;
  moonlessDark: (dur: string) => string;
  noMoonlessDarkness: string;
  moonPct: (pct: string) => string;
  best: string;
  plannerNote: string;
  linkToThisSky: string;
  copied: string;
  copyLink: string;
  webglFallback: string;
  credits: string;
}

export const SKY_LAB_COPY: Record<SiteLanguage, SkyLabCopy> = {
  en: {
    twilight: {
      day: 'Daytime',
      civil: 'Civil twilight',
      nautical: 'Nautical twilight',
      astronomical: 'Astronomical twilight',
      night: 'Full darkness',
    },
    speeds: {
      paused: 'Paused',
      live: 'Live',
      x60: '×60',
      x600: '×600',
      x3600: '×3600',
    },
    directions: {
      n: 'N',
      e: 'E',
      s: 'S',
      w: 'W',
    },
    lookUpAtSky: 'Look up at the sky',
    backToEarth: 'Back to Earth',
    face: 'Face',
    time: 'Time',
    dateAndTime: 'Date and time',
    localTimeIn: (place) => `local time in ${place}`,
    yourTimeZone: 'your time zone',
    now: 'Now',
    speed: 'Speed',
    throughTonight: 'Through tonight, sunset to sunrise',
    show: 'Show',
    constellations: 'Constellations',
    names: 'Names',
    milkyWay: 'Milky Way',
    yourSky: 'Your sky',
    campsiteOrCity: 'Campsite or city',
    chooseACity: 'Choose a city',
    useMyLocation: 'Use my location',
    yourLocation: 'Your location',
    locatingAsking: 'Waiting for your browser…',
    locatingDenied:
      'Location access was declined; pick a city or click the globe.',
    locatingUnavailable:
      "Your location isn't available; pick a city or click the globe.",
    locatingDefault:
      'Or click anywhere on the globe. Your location stays in your browser.',
    where: 'Where',
    belowTheHorizon: 'Below the horizon',
    highInThe: (alt, dir) => `${alt}° high in the ${dir}`,
    theMoon: 'The Moon',
    theSun: 'The Sun',
    rises: 'Rises',
    sets: 'Sets',
    planetSubtitle: (mag) => `Planet · magnitude ${mag}`,
    aStar: 'A star',
    starSubtitle: (constellation, mag) =>
      `In ${constellation} · magnitude ${mag}`,
    starTooFaint: 'Too faint to have a name in this catalogue',
    constellation: 'Constellation',
    close: 'Close',
    lit: (pct) => `${pct} lit`,
    whatsUpTonight: "What's up tonight",
    sunset: 'Sunset',
    sunDoesNotSet: 'The Sun doesn’t set',
    trulyDark: 'Truly dark',
    notTonight: 'Not tonight: the Sun stays less than 18° below the horizon',
    sunrise: 'Sunrise',
    moon: 'Moon',
    moonFact: (phase, pct, rise, set) =>
      `${phase}, ${pct} lit · rises ${rise}, sets ${set}`,
    planets: 'Planets',
    planetUpNow: (alt, dir, mag) =>
      `up now, ${alt}° high in the ${dir}, magnitude ${mag}`,
    planetBelowHorizon: (rise, set) =>
      `below the horizon · rises ${rise}, sets ${set}`,
    meteorShowers: 'Meteor showers',
    showerText: (rate, rad, speed, parent) =>
      `about ${rate} an hour under a perfect sky · radiant ${rad} · ${speed} km/s, from ${parent}`,
    radiantUp: (alt) => `${alt}° up`,
    radiantBelowHorizon: 'below the horizon',
    constellationsUpHigh: 'Constellations up high',
    noneHighUp: 'None high up right now.',
    bestNightsToGo: 'Best nights to go',
    plannerLoading: 'Asking the night planner…',
    plannerWaking:
      'Waking the free-tier night planner (Spring Boot on Render); this takes up to a minute…',
    plannerUnavailable:
      "The night planner didn't answer. Tonight's sky above still works.",
    moonlessDark: (dur) => `${dur} of moonless dark`,
    noMoonlessDarkness: 'No moonless darkness',
    moonPct: (pct) => `Moon ${pct}`,
    best: 'Best',
    plannerNote:
      'From the night planner: Orekit on Spring Boot. A full bar is six hours of moonless darkness.',
    linkToThisSky: 'Link to this sky',
    copied: 'Copied',
    copyLink: 'Copy link',
    webglFallback:
      "The 3D sky needs WebGL. Tonight's sky is described next to it, and the time and place controls still work.",
    credits:
      'Stars: XHIP via d3-celestial. Sun, Moon and planets: Astronomy Engine. Meteor showers: International Meteor Organization. Coastlines: Natural Earth. Drag to look around, scroll or pinch to zoom, click a star, planet or constellation.',
  },
  fr: {
    twilight: {
      day: 'Jour',
      civil: 'Crépuscule civil',
      nautical: 'Crépuscule nautique',
      astronomical: 'Crépuscule astronomique',
      night: 'Nuit noire',
    },
    speeds: {
      paused: 'En pause',
      live: 'Direct',
      x60: '×60',
      x600: '×600',
      x3600: '×3600',
    },
    directions: {
      n: 'N',
      e: 'E',
      s: 'S',
      w: 'O',
    },
    lookUpAtSky: 'Lever les yeux vers le ciel',
    backToEarth: 'Retour sur Terre',
    face: 'Orientation',
    time: 'Heure',
    dateAndTime: 'Date et heure',
    localTimeIn: (place) => `heure locale à ${place}`,
    yourTimeZone: 'votre fuseau horaire',
    now: 'Maintenant',
    speed: 'Vitesse',
    throughTonight: 'Toute la nuit, du coucher au lever du soleil',
    show: 'Afficher',
    constellations: 'Constellations',
    names: 'Noms',
    milkyWay: 'Voie lactée',
    yourSky: 'Votre ciel',
    campsiteOrCity: 'Campement ou ville',
    chooseACity: 'Choisir une ville',
    useMyLocation: 'Utiliser ma position',
    yourLocation: 'Votre position',
    locatingAsking: 'En attente de votre navigateur…',
    locatingDenied:
      'L’accès à la position a été refusé ; choisissez une ville ou cliquez sur le globe.',
    locatingUnavailable:
      'Votre position n’est pas disponible ; choisissez une ville ou cliquez sur le globe.',
    locatingDefault:
      'Ou cliquez n’importe où sur le globe. Votre position reste dans votre navigateur.',
    where: 'Où',
    belowTheHorizon: 'Sous l’horizon',
    highInThe: (alt, dir) => `${alt}° de hauteur vers ${dir}`,
    theMoon: 'La Lune',
    theSun: 'Le Soleil',
    rises: 'Lever',
    sets: 'Coucher',
    planetSubtitle: (mag) => `Planète · magnitude ${mag}`,
    aStar: 'Une étoile',
    starSubtitle: (constellation, mag) =>
      `Dans ${constellation} · magnitude ${mag}`,
    starTooFaint: 'Trop faible pour avoir un nom dans ce catalogue',
    constellation: 'Constellation',
    close: 'Fermer',
    lit: (pct) => `éclairée à ${pct}`,
    whatsUpTonight: 'Dans le ciel ce soir',
    sunset: 'Coucher du soleil',
    sunDoesNotSet: 'Le Soleil ne se couche pas',
    trulyDark: 'Nuit noire',
    notTonight:
      'Pas ce soir : le Soleil reste à moins de 18° sous l’horizon',
    sunrise: 'Lever du soleil',
    moon: 'Lune',
    moonFact: (phase, pct, rise, set) =>
      `${phase}, éclairée à ${pct} · lever ${rise}, coucher ${set}`,
    planets: 'Planètes',
    planetUpNow: (alt, dir, mag) =>
      `visible, à ${alt}° de hauteur vers ${dir}, magnitude ${mag}`,
    planetBelowHorizon: (rise, set) =>
      `sous l’horizon · lever ${rise}, coucher ${set}`,
    meteorShowers: 'Pluies d’étoiles filantes',
    showerText: (rate, rad, speed, parent) =>
      `environ ${rate} par heure sous un ciel parfait · radiant ${rad} · ${speed} km/s, issu de ${parent}`,
    radiantUp: (alt) => `à ${alt}° de hauteur`,
    radiantBelowHorizon: 'sous l’horizon',
    constellationsUpHigh: 'Constellations haut dans le ciel',
    noneHighUp: 'Aucune bien haut en ce moment.',
    bestNightsToGo: 'Meilleures nuits pour observer',
    plannerLoading: 'Consultation du planificateur nocturne…',
    plannerWaking:
      'Réveil du planificateur nocturne gratuit (Spring Boot sur Render) ; cela peut prendre jusqu’à une minute…',
    plannerUnavailable:
      'Le planificateur nocturne n’a pas répondu. Le ciel de ce soir ci-dessus fonctionne toujours.',
    moonlessDark: (dur) => `${dur} d’obscurité sans lune`,
    noMoonlessDarkness: 'Aucune obscurité sans lune',
    moonPct: (pct) => `Lune ${pct}`,
    best: 'Idéal',
    plannerNote:
      'Depuis le planificateur nocturne : Orekit sur Spring Boot. Une barre pleine correspond à six heures d’obscurité sans lune.',
    linkToThisSky: 'Lien vers ce ciel',
    copied: 'Copié',
    copyLink: 'Copier le lien',
    webglFallback:
      'Le ciel 3D nécessite WebGL. Le ciel de ce soir est décrit à côté, et les réglages d’heure et de lieu fonctionnent toujours.',
    credits:
      'Étoiles : XHIP via d3-celestial. Soleil, Lune et planètes : Astronomy Engine. Pluies de météores : International Meteor Organization. Côtes : Natural Earth. Faites glisser pour regarder autour, défilez ou pincez pour zoomer, cliquez sur une étoile, une planète ou une constellation.',
  },
  ar: {
    twilight: {
      day: 'النهار',
      civil: 'الشفق المدني',
      nautical: 'الشفق البحري',
      astronomical: 'الشفق الفلكي',
      night: 'ظلام دامس',
    },
    speeds: {
      paused: 'متوقف',
      live: 'مباشر',
      x60: '×60',
      x600: '×600',
      x3600: '×3600',
    },
    directions: {
      n: 'ش',
      e: 'شر',
      s: 'ج',
      w: 'غ',
    },
    lookUpAtSky: 'انظر إلى السماء',
    backToEarth: 'العودة إلى الأرض',
    face: 'الاتجاه',
    time: 'الوقت',
    dateAndTime: 'التاريخ والوقت',
    localTimeIn: (place) => `التوقيت المحلي في ${place}`,
    yourTimeZone: 'منطقتك الزمنية',
    now: 'الآن',
    speed: 'السرعة',
    throughTonight: 'طوال الليلة، من الغروب إلى الشروق',
    show: 'إظهار',
    constellations: 'الكوكبات',
    names: 'الأسماء',
    milkyWay: 'درب التبانة',
    yourSky: 'سماؤك',
    campsiteOrCity: 'مخيم أو مدينة',
    chooseACity: 'اختر مدينة',
    useMyLocation: 'استخدم موقعي',
    yourLocation: 'موقعك',
    locatingAsking: 'بانتظار المتصفح…',
    locatingDenied:
      'تم رفض الوصول إلى الموقع؛ اختر مدينة أو انقر على الكرة الأرضية.',
    locatingUnavailable:
      'موقعك غير متاح؛ اختر مدينة أو انقر على الكرة الأرضية.',
    locatingDefault:
      'أو انقر في أي مكان على الكرة الأرضية. يبقى موقعك داخل متصفحك.',
    where: 'الموقع',
    belowTheHorizon: 'تحت الأفق',
    highInThe: (alt, dir) => `بارتفاع ${alt}° باتجاه ${dir}`,
    theMoon: 'القمر',
    theSun: 'الشمس',
    rises: 'الشروق',
    sets: 'الغروب',
    planetSubtitle: (mag) => `كوكب · القدر الظاهري ${mag}`,
    aStar: 'نجم',
    starSubtitle: (constellation, mag) =>
      `في كوكبة ${constellation} · القدر الظاهري ${mag}`,
    starTooFaint: 'خافت جدًا بحيث لا يحمل اسمًا في هذا الفهرس',
    constellation: 'كوكبة',
    close: 'إغلاق',
    lit: (pct) => `مضاء بنسبة ${pct}`,
    whatsUpTonight: 'ماذا في السماء الليلة',
    sunset: 'غروب الشمس',
    sunDoesNotSet: 'الشمس لا تغرب',
    trulyDark: 'ظلام تام',
    notTonight: 'ليس الليلة: تبقى الشمس أقل من 18° تحت الأفق',
    sunrise: 'شروق الشمس',
    moon: 'القمر',
    moonFact: (phase, pct, rise, set) =>
      `${phase}، مضاء بنسبة ${pct} · يشرق ${rise}، يغرب ${set}`,
    planets: 'الكواكب',
    planetUpNow: (alt, dir, mag) =>
      `مرتفع الآن، ${alt}° باتجاه ${dir}، القدر ${mag}`,
    planetBelowHorizon: (rise, set) =>
      `تحت الأفق · يشرق ${rise}، يغرب ${set}`,
    meteorShowers: 'زخات الشهب',
    showerText: (rate, rad, speed, parent) =>
      `حوالي ${rate} في الساعة تحت سماء صافية · نقطة الإشعاع ${rad} · ${speed} كم/ث، من ${parent}`,
    radiantUp: (alt) => `بارتفاع ${alt}°`,
    radiantBelowHorizon: 'تحت الأفق',
    constellationsUpHigh: 'كوكبات مرتفعة في السماء',
    noneHighUp: 'لا توجد كوكبات مرتفعة الآن.',
    bestNightsToGo: 'أفضل الليالي للرصد',
    plannerLoading: 'جارٍ سؤال مخطط الليالي…',
    plannerWaking:
      'جارٍ تشغيل مخطط الليالي المجاني (Spring Boot على Render)؛ قد يستغرق ذلك حتى دقيقة…',
    plannerUnavailable:
      'لم يستجب مخطط الليالي. سماء الليلة أعلاه لا تزال تعمل.',
    moonlessDark: (dur) => `${dur} من الظلام بلا قمر`,
    noMoonlessDarkness: 'لا يوجد ظلام بلا قمر',
    moonPct: (pct) => `القمر ${pct}`,
    best: 'الأفضل',
    plannerNote:
      'من مخطط الليالي: Orekit على Spring Boot. الشريط الكامل يمثل ست ساعات من الظلام بلا قمر.',
    linkToThisSky: 'رابط لهذه السماء',
    copied: 'تم النسخ',
    copyLink: 'نسخ الرابط',
    webglFallback:
      'تحتاج السماء ثلاثية الأبعاد إلى WebGL. سماء الليلة موصوفة بجانبها، وأدوات الوقت والمكان لا تزال تعمل.',
    credits:
      'النجوم: XHIP عبر d3-celestial. الشمس والقمر والكواكب: Astronomy Engine. زخات الشهب: منظمة الشهب الدولية. السواحل: Natural Earth. اسحب للنظر حولك، مرر أو قرّب للتكبير، وانقر على نجم أو كوكب أو كوكبة.',
  },
  it: {
    twilight: {
      day: 'Giorno',
      civil: 'Crepuscolo civile',
      nautical: 'Crepuscolo nautico',
      astronomical: 'Crepuscolo astronomico',
      night: 'Buio totale',
    },
    speeds: {
      paused: 'In pausa',
      live: 'Dal vivo',
      x60: '×60',
      x600: '×600',
      x3600: '×3600',
    },
    directions: {
      n: 'N',
      e: 'E',
      s: 'S',
      w: 'O',
    },
    lookUpAtSky: 'Guarda il cielo',
    backToEarth: 'Torna sulla Terra',
    face: 'Direzione',
    time: 'Ora',
    dateAndTime: 'Data e ora',
    localTimeIn: (place) => `ora locale a ${place}`,
    yourTimeZone: 'il tuo fuso orario',
    now: 'Adesso',
    speed: 'Velocità',
    throughTonight: 'Tutta la notte, dal tramonto all’alba',
    show: 'Mostra',
    constellations: 'Costellazioni',
    names: 'Nomi',
    milkyWay: 'Via Lattea',
    yourSky: 'Il tuo cielo',
    campsiteOrCity: 'Campo o città',
    chooseACity: 'Scegli una città',
    useMyLocation: 'Usa la mia posizione',
    yourLocation: 'La tua posizione',
    locatingAsking: 'In attesa del browser…',
    locatingDenied:
      'L’accesso alla posizione è stato negato; scegli una città o fai clic sul globo.',
    locatingUnavailable:
      'La tua posizione non è disponibile; scegli una città o fai clic sul globo.',
    locatingDefault:
      'Oppure fai clic ovunque sul globo. La tua posizione resta nel browser.',
    where: 'Dove',
    belowTheHorizon: 'Sotto l’orizzonte',
    highInThe: (alt, dir) => `${alt}° di altezza verso ${dir}`,
    theMoon: 'La Luna',
    theSun: 'Il Sole',
    rises: 'Sorge',
    sets: 'Tramonta',
    planetSubtitle: (mag) => `Pianeta · magnitudine ${mag}`,
    aStar: 'Una stella',
    starSubtitle: (constellation, mag) =>
      `In ${constellation} · magnitudine ${mag}`,
    starTooFaint: 'Troppo debole per avere un nome in questo catalogo',
    constellation: 'Costellazione',
    close: 'Chiudi',
    lit: (pct) => `illuminata al ${pct}`,
    whatsUpTonight: 'Cosa c’è stasera nel cielo',
    sunset: 'Tramonto',
    sunDoesNotSet: 'Il Sole non tramonta',
    trulyDark: 'Buio vero',
    notTonight:
      'Non stasera: il Sole resta a meno di 18° sotto l’orizzonte',
    sunrise: 'Alba',
    moon: 'Luna',
    moonFact: (phase, pct, rise, set) =>
      `${phase}, illuminata al ${pct} · sorge ${rise}, tramonta ${set}`,
    planets: 'Pianeti',
    planetUpNow: (alt, dir, mag) =>
      `visibile ora, ${alt}° di altezza verso ${dir}, magnitudine ${mag}`,
    planetBelowHorizon: (rise, set) =>
      `sotto l’orizzonte · sorge ${rise}, tramonta ${set}`,
    meteorShowers: 'Sciami meteorici',
    showerText: (rate, rad, speed, parent) =>
      `circa ${rate} all’ora sotto un cielo perfetto · radiante ${rad} · ${speed} km/s, da ${parent}`,
    radiantUp: (alt) => `${alt}° di altezza`,
    radiantBelowHorizon: 'sotto l’orizzonte',
    constellationsUpHigh: 'Costellazioni alte nel cielo',
    noneHighUp: 'Nessuna alta nel cielo in questo momento.',
    bestNightsToGo: 'Le notti migliori per osservare',
    plannerLoading: 'Consultazione del pianificatore notturno…',
    plannerWaking:
      'Avvio del pianificatore notturno gratuito (Spring Boot su Render); può richiedere fino a un minuto…',
    plannerUnavailable:
      'Il pianificatore notturno non ha risposto. Il cielo di stasera qui sopra funziona comunque.',
    moonlessDark: (dur) => `${dur} di buio senza luna`,
    noMoonlessDarkness: 'Nessun buio senza luna',
    moonPct: (pct) => `Luna ${pct}`,
    best: 'Migliore',
    plannerNote:
      'Dal pianificatore notturno: Orekit su Spring Boot. Una barra piena corrisponde a sei ore di buio senza luna.',
    linkToThisSky: 'Link a questo cielo',
    copied: 'Copiato',
    copyLink: 'Copia link',
    webglFallback:
      'Il cielo 3D richiede WebGL. Il cielo di stasera è descritto accanto e i controlli di ora e luogo funzionano comunque.',
    credits:
      'Stelle: XHIP via d3-celestial. Sole, Luna e pianeti: Astronomy Engine. Sciami meteorici: International Meteor Organization. Coste: Natural Earth. Trascina per guardarti intorno, scorri o pizzica per ingrandire, fai clic su una stella, un pianeta o una costellazione.',
  },
  de: {
    twilight: {
      day: 'Tag',
      civil: 'Bürgerliche Dämmerung',
      nautical: 'Nautische Dämmerung',
      astronomical: 'Astronomische Dämmerung',
      night: 'Völlige Dunkelheit',
    },
    speeds: {
      paused: 'Pausiert',
      live: 'Live',
      x60: '×60',
      x600: '×600',
      x3600: '×3600',
    },
    directions: {
      n: 'N',
      e: 'O',
      s: 'S',
      w: 'W',
    },
    lookUpAtSky: 'In den Himmel schauen',
    backToEarth: 'Zurück zur Erde',
    face: 'Blickrichtung',
    time: 'Zeit',
    dateAndTime: 'Datum und Uhrzeit',
    localTimeIn: (place) => `Ortszeit in ${place}`,
    yourTimeZone: 'Ihre Zeitzone',
    now: 'Jetzt',
    speed: 'Geschwindigkeit',
    throughTonight: 'Durch die Nacht, von Sonnenuntergang bis Sonnenaufgang',
    show: 'Anzeigen',
    constellations: 'Sternbilder',
    names: 'Namen',
    milkyWay: 'Milchstraße',
    yourSky: 'Ihr Himmel',
    campsiteOrCity: 'Campingplatz oder Stadt',
    chooseACity: 'Stadt auswählen',
    useMyLocation: 'Meinen Standort verwenden',
    yourLocation: 'Ihr Standort',
    locatingAsking: 'Warte auf Ihren Browser…',
    locatingDenied:
      'Standortzugriff wurde abgelehnt; wählen Sie eine Stadt oder klicken Sie auf den Globus.',
    locatingUnavailable:
      'Ihr Standort ist nicht verfügbar; wählen Sie eine Stadt oder klicken Sie auf den Globus.',
    locatingDefault:
      'Oder klicken Sie irgendwo auf den Globus. Ihr Standort bleibt in Ihrem Browser.',
    where: 'Wo',
    belowTheHorizon: 'Unter dem Horizont',
    highInThe: (alt, dir) => `${alt}° hoch im ${dir}`,
    theMoon: 'Der Mond',
    theSun: 'Die Sonne',
    rises: 'Aufgang',
    sets: 'Untergang',
    planetSubtitle: (mag) => `Planet · Magnitude ${mag}`,
    aStar: 'Ein Stern',
    starSubtitle: (constellation, mag) =>
      `In ${constellation} · Magnitude ${mag}`,
    starTooFaint: 'Zu lichtschwach für einen Namen in diesem Katalog',
    constellation: 'Sternbild',
    close: 'Schließen',
    lit: (pct) => `zu ${pct} beleuchtet`,
    whatsUpTonight: 'Heute Nacht am Himmel',
    sunset: 'Sonnenuntergang',
    sunDoesNotSet: 'Die Sonne geht nicht unter',
    trulyDark: 'Wirklich dunkel',
    notTonight:
      'Nicht heute Nacht: Die Sonne bleibt weniger als 18° unter dem Horizont',
    sunrise: 'Sonnenaufgang',
    moon: 'Mond',
    moonFact: (phase, pct, rise, set) =>
      `${phase}, zu ${pct} beleuchtet · Aufgang ${rise}, Untergang ${set}`,
    planets: 'Planeten',
    planetUpNow: (alt, dir, mag) =>
      `jetzt sichtbar, ${alt}° hoch im ${dir}, Magnitude ${mag}`,
    planetBelowHorizon: (rise, set) =>
      `unter dem Horizont · Aufgang ${rise}, Untergang ${set}`,
    meteorShowers: 'Meteorströme',
    showerText: (rate, rad, speed, parent) =>
      `etwa ${rate} pro Stunde unter perfektem Himmel · Radiant ${rad} · ${speed} km/s, von ${parent}`,
    radiantUp: (alt) => `${alt}° hoch`,
    radiantBelowHorizon: 'unter dem Horizont',
    constellationsUpHigh: 'Sternbilder hoch am Himmel',
    noneHighUp: 'Derzeit keine hoch am Himmel.',
    bestNightsToGo: 'Beste Nächte zum Beobachten',
    plannerLoading: 'Nachtplaner wird abgefragt…',
    plannerWaking:
      'Der kostenlose Nachtplaner wird geweckt (Spring Boot auf Render); dies dauert bis zu einer Minute…',
    plannerUnavailable:
      'Der Nachtplaner hat nicht geantwortet. Der Himmel heute Nacht oben funktioniert weiterhin.',
    moonlessDark: (dur) => `${dur} mondlose Dunkelheit`,
    noMoonlessDarkness: 'Keine mondlose Dunkelheit',
    moonPct: (pct) => `Mond ${pct}`,
    best: 'Beste',
    plannerNote:
      'Vom Nachtplaner: Orekit auf Spring Boot. Ein voller Balken entspricht sechs Stunden mondloser Dunkelheit.',
    linkToThisSky: 'Link zu diesem Himmel',
    copied: 'Kopiert',
    copyLink: 'Link kopieren',
    webglFallback:
      'Der 3D-Himmel benötigt WebGL. Der Himmel heute Nacht wird daneben beschrieben, und die Zeit- und Ortssteuerung funktioniert weiterhin.',
    credits:
      'Sterne: XHIP über d3-celestial. Sonne, Mond und Planeten: Astronomy Engine. Meteorströme: International Meteor Organization. Küstenlinien: Natural Earth. Ziehen zum Umsehen, scrollen oder pinchen zum Zoomen, auf einen Stern, Planeten oder ein Sternbild klicken.',
  },
};
