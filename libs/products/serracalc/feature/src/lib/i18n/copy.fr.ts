import type { NoteWriter, SerraCopy } from './copy.en';

export const FR: SerraCopy = {
  app: {
    name: 'SerraCalc',
    tagline: 'Chauffage, eau et climat des serres',
    activeProject: 'Projet actif',
    offline: 'Fonctionne hors ligne',
    offlineHint:
      'Les projets sont enregistrés sur cet appareil ; aucune connexion nécessaire.',
    sunlight: 'Plein soleil',
    sunlightHint: 'Mode contraste élevé pour lire l’écran en extérieur',
    dark: 'Sombre',
    darkHint: 'Thème sombre',
    language: 'Langue',
    sections: 'Sections de SerraCalc',
    planningAid:
      'Aide au dimensionnement : faites vérifier les résultats par un ingénieur qualifié et avec les données des fournisseurs avant de construire.',
  },
  nav: {
    projects: 'Projets',
    greenhouse: 'Serre',
    heating: 'Chauffage',
    cooling: 'Refroidissement',
    water: 'Eau',
    climate: 'Climat',
    guide: 'Guide',
    air: 'Lumière & air',
    more: 'Plus',
  },
  common: {
    close: 'Fermer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    rename: 'Renommer',
    save: 'Enregistrer',
    open: 'Ouvrir et modifier',
    yes: 'Oui',
    no: 'Non',
    next: '→',
    none: '—',
  },
  months: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  monthsShort: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],

  shapes: {
    gable: 'Multichapelle, toits à deux pentes',
    venlo: 'Serre verre type Venlo',
    tunnel: 'Tunnel (toit cintré)',
  },
  covers: {
    glass_single: 'Verre simple',
    glass_double: 'Double vitrage',
    pe_single: 'Film simple (PE)',
    pe_double: 'Double film gonflé (PE)',
    pc_twin: 'Polycarbonate alvéolaire double',
    pc_triple: 'Polycarbonate alvéolaire triple',
    acrylic_double: 'Acrylique double paroi',
  },
  screens: {
    none: 'Sans écran',
    clear: 'Écran thermique clair',
    shade_energy: 'Écran ombrage + énergie',
    aluminised: 'Écran aluminisé',
  },
  crops: {
    tomato: 'Tomate',
    cucumber: 'Concombre',
    pepper: 'Poivron',
    melon: 'Melon',
    strawberry: 'Fraise',
    lettuce: 'Laitue',
    rose: 'Rose',
  },
  fuels: {
    natural_gas: 'Gaz naturel',
    lpg: 'GPL (propane)',
    fuel_oil: 'Fioul / gasoil',
    heat_pump: 'Pompe à chaleur (électricité)',
    geothermal: 'Eau géothermale',
    biomass: 'Biomasse (granulés, grignons d’olive)',
  },
  fuelUnits: { m3: 'm³', kg: 'kg', L: 'L', kWh: 'kWh' },
  pipes: {
    steel_51: 'Tube rail acier, 51 mm',
    steel_33: 'Tube acier, 33,7 mm',
    pe_40: 'Tube plastique (PE/PP), 40 mm',
    pe_32: 'Tube plastique (PE/PP), 32 mm',
    pe_25: 'Tube plastique (PE/PP), 25 mm',
  },
  currencies: { TND: 'Dinar tunisien', EUR: 'Euro', USD: 'Dollar américain' },

  fields: {
    spans: 'Chapelles',
    spanWidthM: 'Largeur de chapelle',
    lengthM: 'Longueur',
    gutterHeightM: 'Hauteur au chéneau',
    ridgeHeightM: 'Hauteur au faîtage',
    floorAreaM2: 'Surface au sol',
    coverAreaM2: 'Surface de couverture',
    volumeM3: 'Volume d’air',
    perimeterM: 'Périmètre',
    uValue: 'Coefficient U de la couverture',
    airChangesPerHour: 'Fuites d’air',
    screenSavingPct: 'Économie de l’écran',
    insideC: 'Intérieur, la nuit',
    outsideDesignC: 'Nuit la plus froide',
    marginPct: 'Marge de sécurité',
    nightSetC: 'Consigne de nuit',
    daySetC: 'Consigne de jour',
    transmissionPct: 'Transmission lumineuse',
    solarGainPct: 'Soleil qui chauffe l’air',
    efficiencyPct: 'Rendement (COP × 100)',
    fuelPrice: 'Prix unitaire',
    heatDemandKw: 'Chaleur à fournir',
    supplyC: 'Eau aller (départ)',
    returnC: 'Eau retour',
    airC: 'Température de l’air',
    loopLengthM: 'Longueur d’une boucle',
    pumpHeadM: 'Hauteur manométrique',
    pumpEfficiencyPct: 'Rendement de la pompe',
    annualHeatKwh: 'Chaleur sur l’année',
    radiationWm2: 'Rayonnement extérieur',
    shadingPct: 'Ombrage',
    evapotranspirationPct: 'Soleil utilisé par la transpiration',
    outsideC: 'Température extérieure',
    maxRiseK: 'Écart admis avec l’extérieur',
    windMs: 'Vitesse du vent',
    ventOpeningM: 'Hauteur d’ouverture des ouvrants',
    fanCapacityM3h: 'Débit par ventilateur',
    outsideRhPct: 'Humidité extérieure',
    padEfficiencyPct: 'Rendement du pad',
    riseK: 'Échauffement du pad aux ventilateurs',
    padFaceVelocityMs: 'Vitesse d’air dans le pad',
    padHeightM: 'Hauteur du pad',
    padToFanM: 'Distance pad – ventilateurs',
    hoursPerDay: 'Heures par jour',
    cropAreaPct: 'Sol occupé par la culture',
    transpirationPct: 'Soleil converti en transpiration',
    canopyPct: 'Couverture du feuillage',
    drainPct: 'Drainage / pertes',
    plantsPerM2: 'Plants par m²',
    emittersPerPlant: 'Goutteurs par plant',
    emitterLh: 'Débit du goutteur',
    shotMl: 'Apport par goutteur',
    pumpM3h: 'Débit de la pompe',
    catchmentM2: 'Toiture reliée au bassin',
    runoffPct: 'Ruissellement atteignant le bassin',
    basinM3: 'Volume du bassin',
    targetDli: 'Lumière visée (DLI)',
    maxDli: 'Ombrer au-dessus de (DLI)',
    lampHours: 'Heures d’éclairage par jour',
    efficacyUmolJ: 'Efficacité du luminaire',
    fixtureW: 'Puissance du luminaire',
    electricityPrice: 'Prix de l’électricité',
    co2KgPerKwh: 'CO₂ du réseau',
    targetPpm: 'Consigne CO₂',
    outsidePpm: 'CO₂ extérieur',
    uptakeGm2h: 'Absorption par la culture',
    daysPerYear: 'Jours par an',
    burnerEfficiencyPct: 'Rendement du brûleur',
    co2Price: 'Prix du CO₂ liquide',
    gasPrice: 'Prix du gaz',
    insideRhPct: 'Humidité maximale dedans',
    transpirationGm2h: 'Transpiration de nuit',
    nightHours: 'Durée de la nuit',
  },
  hints: {
    spanWidthM: 'Courant : 8, 9,6 ou 12,8 m',
    gutterHeightM: 'Une serre haute amortit mieux chaleur et humidité',
    uValue:
      'Repris de la couverture ; votre fournisseur peut en donner un autre',
    airChangesPerHour:
      'Renouvellements par heure : 0,5 film étanche à 2 vieux verre',
    screenSavingPct: 'Clair 25 %, ombrage/énergie 35 %, aluminisé 45 %',
    outsideDesignC: 'Une nuit froide qui revient presque chaque hiver',
    marginPct: 'Pour le vent, le ciel clair et les pertes des tuyaux',
    transmissionPct:
      'À travers couverture et structure ; un film poussiéreux perd 10 à 20 %',
    solarGainPct: 'Environ la moitié du soleil entré chauffe l’air',
    efficiencyPct: 'Chaudière 85–95 % ; pompe à chaleur COP 3 = 300',
    fuelPrice: 'Votre tarif, dans la devise du projet',
    heatDemandKw:
      'Part de la charge de pointe ; le bouton ci-dessus la reprend',
    supplyC: 'Les forages géothermiques ici donnent 60–75 °C',
    loopLengthM: 'Aller et retour le long de la serre',
    annualHeatKwh:
      'Pour le volume d’eau ; le bouton ci-dessus reprend celle de l’année',
    radiationWm2: 'À midi en été, sur l’horizontale',
    evapotranspirationPct:
      'Environ 50 % pour une culture développée, 0 pour une serre vide',
    maxRiseK: '3 à 5 K en général',
    ventOpeningM: 'Hauteur du volet ouvert',
    fanCapacityM3h: 'À environ 30 Pa, selon la courbe du ventilateur',
    padEfficiencyPct: '75–85 % pour un pad propre',
    padFaceVelocityMs: '1,25 m/s pour un pad de 100 mm, 1,75 pour 150 mm',
    padToFanM: 'Rester sous 40–50 m',
    transpirationPct: 'Feuillage complet : environ 65 %',
    canopyPct: 'Jeunes plants 30 %, culture développée 100 %',
    drainPct: 'Hors-sol 20–35 % ; davantage avec une eau salée',
    shotMl: 'En général 100–200 mL',
    runoffPct: 'Verre 85 %, film 80 %, après les premières eaux',
    targetDli: 'Tomate 20–30, laitue 12–17, fraise 15–20',
    maxDli: 'Ombrer au-delà ; la laitue brûle au-dessus de 17 environ',
    lampHours: 'En général 12 à 18 h',
    efficacyUmolJ: 'LED 2,5–3,2, sodium environ 1,8',
    co2KgPerKwh: 'Réseau tunisien : environ 0,47',
    targetPpm: 'L’essentiel du gain est acquis vers 800–1000 ppm',
    uptakeGm2h: 'Plein soleil, feuillage complet : 2 à 4',
    insideRhPct: 'Au-dessus de 85–90 % la nuit, le botrytis s’installe',
    transpirationGm2h: 'Tomate la nuit : environ 10 à 20',
  },

  context: {
    from: 'Depuis',
    defaultHouse: 'Serre exemple, Monastir, tomate',
    reset: 'Reprendre du projet',
    house: 'La serre',
    sun: 'Soleil et serre',
    demand: 'Les besoins de la culture',
  },

  projects: {
    title: 'Projets',
    lead: 'Chaque serre : sa structure, son climat, sa culture, et tous les résultats enregistrés depuis les outils.',
    new: 'Nouveau projet',
    newTitle: 'Nouveau projet',
    editTitle: 'Modifier le projet',
    create: 'Créer le projet',
    saveChanges: 'Enregistrer',
    loading: 'Chargement des projets…',
    switch: 'Projet',
    name: 'Nom du projet',
    site: 'Site',
    climate: 'Climat',
    crop: 'Culture',
    currency: 'Devise',
    shape: 'Type de serre',
    cover: 'Couverture',
    screen: 'Écran',
    insulated: 'Soubassement isolé',
    required: 'Donnez un nom au projet.',
    emptyTitle: 'Aucun projet',
    emptyLead:
      'Créez un projet pour votre serre, ou chargez les exemples pour essayer les outils. Les calculateurs marchent sans projet ; il en faut un pour enregistrer les résultats.',
    samples: 'Charger les projets exemples',
    deleteConfirm: (title: string) =>
      `Supprimer « ${title} » et ses résultats enregistrés ? C’est définitif.`,
    floor: 'Sol',
    saved: 'Résultats enregistrés',
    savedEmpty:
      'Rien d’enregistré pour l’instant. Chaque calculateur a un bouton Enregistrer en bas.',
    renameTitle: 'Renommer le résultat',
    renameLabel: 'Nom',
    deleteResult: (label: string) => `Supprimer « ${label} » ?`,
  },
  kinds: {
    heatPeak: 'Puissance de chauffage',
    heatYear: 'Chauffage sur l’année',
    hotWater: 'Tuyaux d’eau chaude',
    ventilation: 'Aération',
    padFan: 'Pad & ventilateurs',
    cropWater: 'Eau de la culture',
    rainwater: 'Eau de pluie',
    light: 'Éclairage et ombrage',
    co2: 'Enrichissement en CO₂',
    humidity: 'Humidité de nuit',
  },

  greenhouse: {
    title: 'Serre',
    lead: 'La serre dont partent tous les calculateurs : sol, couverture et volume d’air.',
    sectionAlt: (spans, width, gutter, ridge) =>
      `Coupe : ${spans} chapelles de ${width} m, chéneau ${gutter} m, faîtage ${ridge} m`,
    saveToProject: 'Enregistrer dans le projet',
    savedToProject: 'Enregistré dans le projet.',
    noProject: 'Non enregistré : créez un projet pour garder cette serre.',
    floor: 'Surface au sol',
    cover: 'Surface de couverture',
    volume: 'Volume d’air',
    meanHeight: 'Hauteur moyenne',
    coverRatio: 'Couverture / sol',
    perimeter: 'Périmètre',
    roof: 'Toiture',
    sideWalls: 'Façades latérales',
    gables: 'Pignons',
    width: 'Largeur',
    formulas: {
      floor: 'Sol = chapelles × largeur × longueur',
      roof: 'Toiture : chaque pente √((l/2)² + flèche²), ou une demi-ellipse pour un arc',
      ends: 'Pignons : murs jusqu’au chéneau, plus un triangle (ou une demi-ellipse) par toit',
      volume: 'Volume = sol × chéneau + section du toit × longueur',
    },
  },

  heating: {
    title: 'Chauffage',
    lead: 'Dimensionner la chaufferie, compter une année de combustible et poser les tuyaux d’eau chaude pour l’eau géothermale ou une chaudière.',
    tabs: {
      peak: 'Puissance de pointe',
      year: 'Sur l’année',
      pipes: 'Tuyaux d’eau chaude',
    },
    cover: 'Couverture',
    screen: 'Écran',
    insulated: 'Soubassement isolé',
    screenClosed: 'Écran fermé la nuit la plus froide',
    designNight: (place, t) => `Nuit de calcul à ${place} : ${t} °C`,
    climate: 'Climat',
    fuel: 'Énergie',
    pipe: 'Tuyau',
    designKw: 'Chaufferie',
    totalKw: 'Déperditions',
    perM2: 'Par m² de sol',
    deltaT: 'Intérieur − extérieur',
    breakdown: 'Où part la chaleur',
    parts: {
      transmission: 'Par la couverture',
      infiltration: 'Fuites d’air',
      perimeter: 'Soubassement',
    },
    annual: 'Chaleur par an',
    perM2Year: 'Par m² et par an',
    fuelYear: 'Combustible par an',
    cost: 'Coût annuel',
    co2: 'CO₂ par an',
    monthly: 'Chaleur par mois, nuit et jour',
    night: 'Nuit',
    day: 'Jour',
    monthlyAlt: (peak, total) =>
      `Histogramme de la chaleur par mois ; maximum en ${peak} ; ${total} MWh sur l’année`,
    flow: 'Débit d’eau',
    perMetre: 'Chaleur par mètre de tuyau',
    pipeLength: 'Tuyau à poser',
    perM2Pipe: 'Tuyau par m² de sol',
    loops: 'Boucles',
    velocity: 'Vitesse dans une boucle',
    pump: 'Puissance de la pompe',
    waterYear: 'Eau par an',
    usePeak: (kw) => `Reprendre la pointe (${kw} kW)`,
    useYear: (kwh) => `Reprendre l’année (${kwh} kWh)`,
    formulas: {
      transmission: 'Couverture : U × A × ΔT',
      infiltration: 'Fuites d’air : 0,335 × N × V × ΔT',
      perimeter: 'Soubassement : F × périmètre × ΔT',
      design: 'Chaufferie = total × (1 + marge)',
      night:
        'Nuit (janvier) : pertes × (consigne − moyenne de nuit) × heures × jours',
      day: 'Jour (janvier) : pertes × (consigne − moyenne de jour) × heures − soleil',
      fuel: 'Combustible = chaleur / (énergie par unité × rendement)',
      flow: 'Débit = Q / (1,163 × ΔT eau)',
      output: 'Par mètre = π × D × (h_conv + h_ray) × ΔT',
      length: 'Longueur = Q / par mètre',
      pump: 'Pompe = ρ × g × débit × hauteur / rendement',
    },
  },

  cooling: {
    title: 'Refroidissement',
    lead: 'L’air que la serre doit renouveler par temps ensoleillé, les ouvrants ou ventilateurs pour le faire, et le refroidissement par pad pour le temps chaud et sec.',
    tabs: { ventilation: 'Aération', padFan: 'Pad & ventilateurs' },
    solar: 'Soleil qui chauffe l’air',
    flow: 'Air à renouveler',
    ach: 'Renouvellements',
    perM2: 'Par m² de sol',
    vents: 'Ouvrants (aération naturelle)',
    ventShare: 'du sol',
    fans: 'Ventilateurs (mécanique)',
    wetBulb: 'Bulbe humide extérieur',
    padOutlet: 'Air sortant du pad',
    exhaust: 'Air aux ventilateurs',
    padArea: 'Surface de pad',
    padLength: 'Longueur du mur de pad',
    evaporation: 'Eau évaporée',
    waterDay: 'Eau par jour',
    perHour: 'par heure',
    formulas: {
      solar: 'Soleil = τ × (1 − ombrage) × G × sol × (1 − ET)',
      conduction: 'Par la couverture : U × A × ΔT',
      flow: 'Air = (soleil − couverture) / (ρ × cp × ΔT)',
      vents:
        'Ouvrants (Boulard & Baille) : G = Cd × A/2 × √(2g × ΔT/T × h/4 + Cw × u²)',
      padOutlet: 'Pad : T − η × (T − T_humide)',
      padFlow: 'Air = (soleil + couverture) / (ρ × cp × échauffement)',
      pad: 'Surface de pad = air / vitesse frontale',
      water: 'Eau = ρ × air × cp × (T − T_pad) / λ',
    },
  },

  water: {
    title: 'Eau',
    lead: 'Ce que boit la culture mois par mois, le goutte-à-goutte qui l’apporte, et la part que la pluie du toit peut couvrir.',
    tabs: { crop: 'Eau de la culture', rain: 'Eau de pluie' },
    climate: 'Climat',
    peak: 'Pointe, apportée',
    peakDay: 'Jour de pointe, toute la serre',
    year: 'Eau par an',
    perM2Year: 'par m² de sol',
    emitters: 'Goutteurs',
    perEmitter: 'Par goutteur, jour de pointe',
    shots: 'Apports par jour',
    shotLength: 'Chaque apport dure',
    systemFlow: 'Tous les goutteurs ensemble',
    sections: 'Secteurs d’irrigation',
    monthly: 'Eau apportée par mois, L par m² et par jour',
    monthlyAlt: (peak, value) =>
      `Histogramme de l’eau quotidienne par mois ; maximum en ${peak} à ${value} L/m²`,
    rainYear: 'Pluie par an',
    harvest: 'Pluie récupérée',
    demand: 'Irrigation',
    coverage: 'La pluie couvre',
    maxCoverage: (pct) => `au mieux ${pct} % avec un bassin assez grand`,
    suggested: 'Bassin conseillé',
    storm: (mm, m3) => `Un orage de ${mm} mm : ${m3} m³`,
    rainChart: 'Pluie récupérée et irrigation par mois, m³',
    rainAlt: (pct) =>
      `Histogramme de la pluie récupérée face à l’irrigation par mois ; la pluie couvre ${pct} %`,
    table: {
      month: 'Mois',
      harvest: 'Récupérée',
      demand: 'Besoin',
      used: 'Utilisée',
      stored: 'Au bassin',
      overflow: 'Trop-plein',
    },
    formulas: {
      inside: 'Lumière intérieure = Rg × τ × (1 − ombrage)',
      net: 'Consommation = k × feuillage × lumière intérieure / 2,45',
      gross: 'Apport = consommation / (1 − drainage)',
      house: 'Serre = apport × surface cultivée',
      drippers: 'Goutteurs = surface cultivée × plants × goutteurs par plant',
      shots: 'Apports = par goutteur / apport',
      harvest: 'Récupéré = pluie × toiture × ruissellement',
      basin:
        'Bassin : mois par mois, pluie en entrée, irrigation en sortie, trop-plein quand il est plein',
    },
  },

  air: {
    title: 'Lumière & air',
    lead: 'L’éclairage des mois sombres et l’ombrage des mois lumineux, le CO₂ qui nourrit la culture, et l’air à renouveler la nuit pour limiter humidité et gouttes.',
    tabs: { light: 'Lumière', co2: 'CO₂', humidity: 'Humidité' },
    source: 'CO₂ issu de',
    sources: {
      burner: 'Brûleur à gaz (fumées)',
      liquid: 'Cuve de CO₂ liquide',
    },
    fixtures: 'Luminaires',
    ppfd: 'Lumière des lampes',
    energy: 'Éclairage par an',
    co2Grid: 'CO₂ de l’électricité',
    shade: 'Ombrage maximal',
    shadeMonths: (n) => `${n} mois ombrés`,
    sunDli: 'Soleil dedans',
    chart: 'Lumière du soleil dedans chaque mois, mol/m² par jour',
    chartAlt: (place, target) =>
      `Histogramme de la lumière journalière dedans par mois à ${place}, face à une cible de ${target}`,
    table: { sun: 'Soleil', lamps: 'Lampes h', shade: 'Ombrage %' },
    supply: 'CO₂ à fournir',
    used: 'Absorbé par la culture',
    leak: 'Fuit',
    year: 'CO₂ par an',
    cost: 'Coût annuel',
    burner: 'Gaz du brûleur',
    air: 'Air extérieur à faire entrer',
    heat: 'Chaleur pour cet air',
    night: 'nuit',
    vpd: 'Déficit de pression de vapeur',
    dew: 'Point de rosée',
    cover: 'Couverture côté intérieur',
    water: 'Eau à évacuer',
    formulas: {
      dli: 'Soleil dedans = Rg × 0,47 × 4,57 × τ (mois le plus sombre)',
      ppfd: 'PPFD = (cible − soleil) × 10⁶ / (heures × 3600)',
      fixtures: 'Luminaires = PPFD / efficacité × sol / watts',
      shade: 'Ombrage = 1 − plafond / soleil (mois le plus lumineux)',
      leak: 'Fuite = N × V × (consigne − extérieur) × 1,83 × 10⁻⁶',
      uptake: 'Absorption = g/m²·h × sol',
      burner: 'Gaz = CO₂ / 1,96 ; chaleur = gaz × 9,77 × η',
      water: 'Eau = transpiration × sol',
      air: 'Air = eau / (ρ × (x_in − x_out))',
      heat: 'Chaleur = ρ × cp × air × (T_in − T_out)',
      surface: 'Couverture dedans = T_in − U/8 × (T_in − T_out)',
    },
  },

  climate: {
    title: 'Climat',
    lead: 'Normales mensuelles des régions de serres. Elles servent à dimensionner ; les relevés de votre station sont meilleurs.',
    choose: 'Lieu',
    use: 'Utiliser pour ce projet',
    inUse: 'Utilisé par ce projet',
    lat: 'Latitude',
    designWinter: 'Nuit de calcul',
    designSummer: 'Après-midi de calcul',
    peakSun: 'Soleil à midi en été',
    rainYear: 'Pluie par an',
    chart: 'Températures et pluie par mois',
    chartAlt: (place) =>
      `Graphique des températures et de la pluie mensuelles à ${place}`,
    table: {
      month: 'Mois',
      tMin: 'Min °C',
      tMax: 'Max °C',
      sun: 'Soleil MJ/m²·j',
      rain: 'Pluie mm',
      day: 'Jour h',
    },
    source:
      'Normales de station arrondies (environ 1991–2020). Une prochaine version récupère les normales de n’importe quel lieu sur la carte.',
  },

  calc: {
    results: 'Résultats',
    how: 'Comment c’est calculé',
    inputs: 'Données',
    table: 'Voir les chiffres',
    dragHint:
      'Faites glisser les poignées rondes, ou sélectionnez-en une et utilisez les flèches du clavier.',
  },

  diagrams: {
    heatAlt: (inside, outside, kw) =>
      `Chaleur qui quitte la serre : ${kw} kW, de ${inside} °C dedans à ${outside} °C dehors. Les poignées règlent les deux températures.`,
    pipesAlt: (loops, length, supply, back) =>
      `Tuyaux de chauffage en plan : ${loops} boucles de ${length} m, eau au départ à ${supply} °C et au retour à ${back} °C. Les poignées règlent les températures et la longueur de boucle.`,
    ventAlt: (outside, rise, vents) =>
      `Aération par temps ensoleillé : ${outside} °C dehors, la serre au plus ${rise} K au-dessus, ${vents} m² d’ouvrants. Les poignées règlent les températures et l’ouverture.`,
    padAlt: (outside, pad, exhaust, distance) =>
      `Pad et ventilateurs : l’air à ${outside} °C sort du pad à ${pad} °C et atteint les ventilateurs, à ${distance} m, à ${exhaust} °C. Les poignées règlent la distance et l’échauffement.`,
    cropAlt: (applied, used, drain) =>
      `Un jour de pointe par m² : ${applied} L apportés, ${used} L transpirés, ${drain} % drainés. Les poignées règlent le feuillage et le drainage.`,
    rainAlt: (basin, pct) =>
      `La pluie du toit dans un bassin de ${basin} m³, qui couvre ${pct} % de l’irrigation. Une poignée règle le volume du bassin.`,
    inside: 'Dedans',
    outside: 'Dehors',
    screen: 'Écran',
    cover: 'Couverture',
    leaks: 'Fuites',
    footing: 'Soubassement',
    supply: 'Départ',
    return: 'Retour',
    air: 'Air',
    loop: 'Boucle',
    loops: 'boucles',
    vents: 'Ouvrants',
    shade: 'Ombrage',
    pad: 'Pad',
    fans: 'Ventilateurs',
    canopy: 'Feuillage',
    transpired: 'Transpiré',
    drain: 'Drainage',
    suggested: 'Conseillé',
    overflow: 'Trop-plein',
    lightAlt: (month, sun, target, ppfd) =>
      `Lumière en ${month} : ${sun} mol/m² du soleil pour une cible de ${target} ; les lampes donnent ${ppfd} µmol/m²·s. Les poignées règlent la cible, le plafond d’ombrage et les heures d’éclairage.`,
    co2Alt: (target, supply, used) =>
      `CO₂ à ${target} ppm : ${supply} kg/h fournis, ${used} % absorbés par la culture. Les poignées règlent la consigne et le renouvellement d’air.`,
    humidityAlt: (inside, rh, dew, cover) =>
      `Une nuit à ${inside} °C et ${rh} % : rosée à ${dew} °C, couverture à ${cover} °C. Les poignées règlent les deux températures et l’humidité.`,
    target: 'Cible',
    ceiling: 'Plafond',
    noLamps: 'Pas de lampes nécessaires',
    crop: 'Culture',
    used: 'absorbé',
    coverAt: 'Couverture',
    dew: 'Rosée',
    wetterOutside: 'L’air extérieur est plus humide',
  },

  save: {
    title: 'Enregistrer dans le projet',
    label: 'Nom',
    save: 'Enregistrer',
    update: 'Mettre à jour le résultat',
    saveCopy: 'Enregistrer une copie',
    stopEditing: 'Arrêter la modification',
    editing: 'Modification',
    editingHint: 'Vous modifiez un résultat enregistré.',
    savedTo: 'Enregistré dans',
    viewSaved: 'voir les résultats',
    noProject: 'Créez un projet pour enregistrer les résultats.',
  },

  backup: {
    title: 'Sauvegarder et restaurer',
    lead: 'Vos projets ne sont gardés que dans ce navigateur. Gardez-en une copie : enregistrez un fichier de sauvegarde sur le téléphone, ou partagez-le vers Google Drive, et rouvrez-le sur n’importe quel appareil.',
    download: 'Enregistrer une sauvegarde',
    share: 'Partager ou enregistrer sur Drive',
    shareTitle: 'Sauvegarde SerraCalc',
    open: 'Ouvrir une sauvegarde',
    driveHint:
      'Sur Android, « Partager ou enregistrer sur Drive » propose Drive dans le menu de partage, et « Ouvrir une sauvegarde » peut choisir le fichier dans Drive. Sur iPhone, choisissez Fichiers ou l’app Drive.',
    saved: (n: number) =>
      `Sauvegarde de ${n} projet${n === 1 ? '' : 's'} prête.`,
    restored: (n: number, skipped: number) =>
      `${n} projet${n === 1 ? '' : 's'} restauré${n === 1 ? '' : 's'}${skipped ? ` (${skipped} entrée${skipped === 1 ? '' : 's'} abîmée${skipped === 1 ? '' : 's'} ignorée${skipped === 1 ? '' : 's'})` : ''}. Un projet déjà présent arrive en copie.`,
    shareFailed:
      'Le partage n’a pas fonctionné ici : enregistrez plutôt le fichier de sauvegarde.',
    errors: {
      notJson:
        'Ce fichier n’est pas une sauvegarde SerraCalc (ce n’est pas du JSON).',
      notSerraCalc: 'Ce fichier JSON n’est pas une sauvegarde SerraCalc.',
      newerVersion:
        'Cette sauvegarde vient d’une version plus récente de SerraCalc : rechargez l’app et réessayez.',
      empty: 'Cette sauvegarde ne contient aucun projet lisible.',
    },
  },

  guide: {
    title: 'Guide',
    lead: 'Ce que fait chaque outil, ce qu’il suppose et d’où viennent ses chiffres.',
    tools: [
      {
        id: 'greenhouse',
        title: 'Serre',
        body: 'Décrivez la serre une fois : type, chapelles, longueur, hauteurs, couverture et écran. SerraCalc en déduit le sol, la couverture (toiture, façades et pignons) et le volume d’air. Chaque calculateur part de là et garde sa propre copie quand vous enregistrez.',
      },
      {
        id: 'heating',
        title: 'Chauffage',
        body: 'Puissance de pointe : la chaleur perdue une nuit froide à travers la couverture (U × A × ΔT), par les fuites d’air (0,335 × N × V × ΔT) et par le soubassement, plus une marge. Sur l’année : chaque mois découpé en nuit et jour selon la durée du jour, les nuits avec l’économie de l’écran, les jours compensés par le soleil. Puis combustible, coût et CO₂. Tuyaux d’eau chaude : le débit d’eau géothermale ou de chaudière et la longueur de tuyau à poser.',
      },
      {
        id: 'cooling',
        title: 'Refroidissement',
        body: 'Aération : l’air qui évacue la chaleur du soleil en gardant la serre quelques degrés au-dessus de l’extérieur, les ouvrants de toit en aération naturelle (Boulard et Baille) ou le nombre de ventilateurs. Pad & ventilateurs : l’air sortant d’un pad mouillé s’approche de la température humide ; l’outil dimensionne ventilateurs, mur de pad et eau.',
      },
      {
        id: 'water',
        title: 'Eau',
        body: 'La culture transpire environ les deux tiers du soleil qu’elle reçoit : des litres par m² chaque mois selon le climat, plus le drainage. Puis goutteurs, apports et secteurs. Eau de pluie : ce que la toiture récupère dans un bassin, mois par mois, et le bassin qui en garde le plus.',
      },
      {
        id: 'climate',
        title: 'Climat',
        body: 'Températures, ensoleillement et pluie mensuels pour neuf lieux, avec une nuit et un après-midi de calcul. Prenez le plus proche ; remplacez par les données de votre station quand vous les avez.',
      },
      {
        id: 'air',
        title: 'Lumière & air',
        body: 'Lumière : l’intégrale de lumière du soleil dedans chaque mois, les lampes qui comblent l’écart avec la cible le mois le plus sombre, et l’ombrage qui garde les mois lumineux sous le plafond de la culture. CO₂ : l’apport qui tient une consigne malgré l’air qui fuit et ce que la culture absorbe, d’un brûleur à gaz ou d’une cuve. Humidité : l’air extérieur à faire entrer la nuit pour évacuer l’eau de la culture, la chaleur pour le réchauffer, et si la couverture goutte.',
      },
    ],
    sourcesTitle: 'Sources',
    sources: [
      'ASAE EP406 : chauffage, ventilation et refroidissement des serres (coefficients U, fuites d’air, soubassement, pad).',
      'Boulard & Baille (1995) : aération naturelle des serres par les ouvrants de toit.',
      'FAO, Bulletin d’irrigation et de drainage 56 : pression de vapeur, durée du jour, chaleur latente.',
      'Stull (2011) : température humide à partir de la température et de l’humidité.',
      'Stanghellini (1987) et pratique néerlandaise : transpiration à partir du rayonnement.',
      'Thimijan & Heins (1983) : convertir la lumière du soleil en photons pour les plantes.',
      'Nederhoff (1994) : enrichissement en CO₂, fuites et absorption en serre.',
      'Campen et al. (2003) : déshumidifier les serres par aération et chauffage.',
    ],
    limitsTitle: 'Limites',
    limits: [
      'Les moyennes mensuelles cachent les coups de froid et les canicules : les outils de pointe utilisent des valeurs de calcul pour cela.',
      'Les chiffres de chaleur et d’eau servent à planifier ; mesurez la serre réelle et ajustez.',
      'Les prix sont des exemples ; saisissez votre tarif.',
    ],
    open: 'Ouvrir',
  },

  notes: {
    'geometry.lowGutter': (v) =>
      `Chéneau à ${v['gutter']} m : une serre basse chauffe vite et reste humide. 4 m ou plus amortit mieux.`,
    'geometry.goodVolume': (v) =>
      `Hauteur moyenne ${v['height']} m : assez d’air pour amortir chaleur et humidité.`,
    'geometry.flatRoof': (v) =>
      `Pente de toit ${v['slope']}° : sous environ 20°, la condensation goutte sur la culture et le soleil d’hiver entre moins.`,
    'geometry.longHouse': (v) =>
      `${v['length']} m de long : le refroidissement par pad marche mieux sous 40–50 m du pad aux ventilateurs.`,
    'heat.noLoad': () =>
      'Il ne fait pas plus froid dehors que dedans : pas besoin de chauffage.',
    'heat.perM2': (v) => `${v['w']} W par m² de sol la nuit de calcul.`,
    'heat.leaky': (v) =>
      `${v['pct']} % de la chaleur part par les fuites d’air : étanchez d’abord portes, ouvrants et bords de film.`,
    'heat.screenOpen': () =>
      'L’écran est compté ouvert. Le fermer les nuits froides réduit la puissance.',
    'heat.addScreen': () =>
      'Sans écran : un écran thermique économise 25 à 45 % de la chaleur de nuit.',
    'year.none': () => 'Pas de chauffage nécessaire une année moyenne.',
    'year.season': (v) =>
      `Chauffage ${v['months']} mois par an, surtout en ${v['peak']}.`,
    'year.mostlyNights': (v) =>
      `${v['pct']} % de la chaleur est consommée la nuit : un écran et une serre étanche se rentabilisent le plus vite.`,
    'year.screenSaves': () =>
      'Un écran thermique réduirait cela d’un quart ou plus.',
    'year.geothermal': () =>
      'Eau géothermale : aucun combustible brûlé, seulement l’électricité de la pompe.',
    'year.high': (v) =>
      `${v['kwh']} kWh par m² : élevé pour une serre méditerranéenne. Vérifiez les consignes et la couverture.`,
    'pipes.tooCold': () =>
      'L’eau n’est pas plus chaude que l’air : elle ne peut pas chauffer la serre.',
    'pipes.tooMany': (v) =>
      `${v['m']} m de tuyau par m² de sol : trop pour être posé. Eau plus chaude, tuyau plus gros ou moins de degrés.`,
    'pipes.fits': (v) => `${v['m']} m de tuyau par m² de sol : ça tient.`,
    'pipes.smallDrop': () =>
      'Moins de 5 K entre départ et retour : le débit devient énorme ; visez 15–25 K.',
    'pipes.fast': (v) =>
      `${v['v']} m/s dans chaque boucle : bruyant et coûteux à pomper. Ajoutez des boucles ou prenez un tuyau plus gros.`,
    'pipes.slow': (v) =>
      `${v['v']} m/s dans chaque boucle : l’eau refroidit le long de la boucle et le bout est plus froid. Des boucles moins nombreuses et plus longues aident.`,
    'pipes.peOk': () =>
      'Le tube plastique convient à l’eau géothermale jusqu’à environ 70 °C ; vérifiez sa classe.',
    'pipes.peHot': () =>
      'Au-dessus de 75 °C, trop chaud pour la plupart des tubes plastique : acier, ou mélangez l’eau.',
    'vent.coverEnough': () =>
      'La couverture évacue seule cette chaleur : pas besoin d’aération en plus.',
    'vent.naturalOk': (v) =>
      `Ouvrants de toit de ${v['pct']} % du sol : à la portée d’une serre courante.`,
    'vent.naturalTight': (v) =>
      `Ouvrants de ${v['pct']} % du sol : plus que la plupart des toits. Ajoutez des ouvrants latéraux ou de l’ombrage.`,
    'vent.naturalShort': (v) =>
      `Ouvrants de ${v['pct']} % du sol : l’aération naturelle n’y suffit pas. Ombrez, ou passez aux ventilateurs et pads.`,
    'vent.extreme': (v) =>
      `${v['ach']} renouvellements par heure : plus d’un par minute est dur pour la culture. Ombrez ou refroidissez par évaporation.`,
    'vent.hotOutside': () =>
      'À 30 °C dehors, l’air seul ne descend pas sous l’extérieur : voir Pad & ventilateurs.',
    'vent.tryShade': () =>
      'Aucun ombrage compté : un écran de 30–50 % ou un blanchiment réduit d’autant l’air nécessaire.',
    'pad.cooling': (v) =>
      `Le pad refroidit l’air de ${v['drop']} K ; il quitte la serre à ${v['exhaust']} °C.`,
    'pad.humid': () =>
      'Air extérieur humide : l’évaporation refroidit peu. Les pads marchent le mieux sous environ 50 % d’humidité.',
    'pad.tooLong': (v) =>
      `${v['m']} m des pads aux ventilateurs : le fond chauffe. Restez sous 40–50 m, ou refroidissez des deux côtés.`,
    'pad.fastFace': () =>
      'Air trop rapide dans le pad : des gouttes sont entraînées et le rendement baisse.',
    'pad.waterQuality': () =>
      'Une eau salée ou dure entartre les pads : purgez une partie de l’eau et contrôlez sa qualité.',
    'water.peak': (v) =>
      `Pointe en ${v['month']} : ${v['l']} L par m² et par jour, drainage compris.`,
    'water.highPeak': () =>
      'Plus de 9 L par m² et par jour : vérifiez le drainage et l’ombrage.',
    'water.lowDrain': () =>
      'Moins de 15 % de drainage : les sels s’accumulent dans le substrat, surtout avec une eau saumâtre.',
    'water.manyShots': (v) =>
      `${v['shots']} apports par jour : faites des apports plus gros ou ajoutez des goutteurs.`,
    'water.sections': (v) =>
      `La pompe ne peut pas alimenter tous les goutteurs à la fois : arrosez en ${v['sections']} secteurs.`,
    'rain.coverage': (v) => `La pluie couvre ${v['pct']} % de l’irrigation.`,
    'rain.basinSmall': (v) =>
      `Le bassin déborde d’eau utilisable : environ ${v['m3']} m³ en garderait l’essentiel.`,
    'rain.basinBig': (v) =>
      `Environ ${v['m3']} m³ suffiraient : un bassin plus grand apporte peu.`,
    'rain.storm': (v) =>
      `Un orage de ${v['mm']} mm apporte ${v['m3']} m³ de la toiture : le bassin doit au moins les contenir.`,
    'rain.dry': (v) =>
      `${v['mm']} mm de pluie par an : c’est une aide, mais l’irrigation a besoin d’une autre ressource.`,
    'rain.firstFlush': () =>
      'Écartez les premiers millimètres de chaque pluie : ils lavent la poussière et les fientes du toit.',
    'light.none': () =>
      'Le soleil atteint la cible chaque mois : pas besoin de lampes.',
    'light.months': (v) =>
      `Les lampes servent ${v['months']} mois par an ; ${v['month']} les dimensionne.`,
    'light.highPpfd': (v) =>
      `${v['ppfd']} µmol/m²·s, c’est beaucoup de lampes : baissez la cible ou éclairez plus longtemps.`,
    'light.shade': (v) =>
      `Ombrer ${v['months']} mois par an, jusqu’à ${v['pct']} % en ${v['peak']}.`,
    'light.targetOverCeiling': () =>
      'La cible dépasse le plafond d’ombrage : relevez le plafond ou baissez la cible.',
    'co2.noLift': () =>
      'La consigne n’est pas au-dessus de l’extérieur : rien à ajouter.',
    'co2.leaky': (v) =>
      `${v['pct']} % du CO₂ fuit avec l’air : enrichissez ouvrants fermés, ou visez plus bas quand ils s’ouvrent.`,
    'co2.used': (v) =>
      `La culture absorbe ${v['pct']} % de ce que vous apportez.`,
    'co2.highTarget': () =>
      'Au-delà d’environ 1000 ppm, la culture gagne peu pour le CO₂ en plus.',
    'co2.burnerHeat': (v) =>
      `Le brûleur donne ${v['kw']} kW de chaleur avec le CO₂ : stockez-la dans un ballon tampon pour la nuit.`,
    'co2.flue': () =>
      'Seulement un brûleur conçu pour le dosage du CO₂, au gaz naturel propre, avec des fumées contrôlées pour le CO et les NOₓ.',
    'humidity.vpdLow': (v) =>
      `DPV ${v['vpd']} kPa : l’air est presque saturé, botrytis et mildiou prospèrent. Visez au-dessus de 0,3 kPa.`,
    'humidity.vpdOk': (v) => `DPV ${v['vpd']} kPa : un climat de nuit sain.`,
    'humidity.vpdHigh': (v) =>
      `DPV ${v['vpd']} kPa : sec pour la nuit ; la culture peut souffrir.`,
    'humidity.condensation': (v) =>
      `La couverture est à ${v['surface']} °C, sous le point de rosée (${v['dew']} °C) : elle goutte sur la culture. Un écran, un peu d’air ou des tuyaux près du toit aident.`,
    'humidity.outsideWetter': () =>
      'L’air extérieur contient plus d’eau que dedans : aérer ne sèche pas la serre. Chauffez, ou déshumidifiez.',
    'humidity.heat': (v) =>
      `Réchauffer l’air entré demande ${v['kw']} kW (${v['wm2']} W/m²).`,
  } as Record<string, NoteWriter>,
};
