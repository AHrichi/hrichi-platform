import type { NoteWriter, SerraCopy } from './copy.en';

export const FR: SerraCopy = {
  app: {
    week: 'Semaine',
    weekHint: 'La semaine en cours : ouvre le calendrier de culture',
    railNote:
      'Pensé pour les sites désertiques : soleil fort, nuits froides, eau rare.',
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
    operations: 'Exploitation',
    data: 'Données en direct',
    site: 'Site',
    energy: 'Énergie',
    supply: 'Eau d’irrigation',
    science: 'Science',
    calendar: 'Calendrier de culture',
    projects: 'Projets',
    greenhouse: 'Serre',
    heating: 'Chauffage',
    cooling: 'Refroidissement',
    water: 'Eau',
    climate: 'Climat',
    guide: 'Guide',
    air: 'Lumière & air',
    report: 'Rapport',
    more: 'Plus',
  },
  navGroups: {
    operate: 'Exploiter',
    plan: 'Planifier',
    climate: 'Pilotage du climat',
    water: 'Eau',
    reference: 'Références',
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
    sourceClMmolL: 'Chlorure dans l’eau douce',
    sourceHco3MmolL: 'Bicarbonate dans l’eau douce',
    clLimitMmolL: 'Vidange au-dessus du chlorure',
    coolFromC: 'Refroidissement au-dessus de (dehors)',
    fullAtK: 'Débit plein, au-delà du départ de',
    airflowM3hM2: 'Débit d’air plein',
    fanWPerM3h: 'Puissance des ventilateurs par m³/h',
    pumpWm2: 'Pompes des pads ou du brouillard',
    emptyFromWeek: 'Serre vide à partir de la semaine',
    emptyWeeks: 'Semaines à vide',
    gridCo2KgKwh: 'CO₂ du réseau',
    gasPerM3: 'Gaz',
    electricityPerKwh: 'Électricité achetée',
    exportPerKwh: 'Électricité vendue',
    waterPerM3: 'Eau',
    lossCoefficientWK: 'Pertes par kelvin',
    outsideMinC: 'Dehors, minimum de la nuit',
    outsideMaxC: 'Dehors, maximum de l’après-midi',
    chpElectricKw: 'Puissance électrique',
    chpThermalKw: 'Puissance thermique',
    chpElectricPct: 'Rendement électrique',
    chpStartHour: 'Démarrage de la cogénération',
    chpEndHour: 'Arrêt de la cogénération',
    bufferM3: 'Ballon tampon',
    bufferDeltaK: 'Écart de température du tampon',
    boilerEfficiencyPct: 'Rendement de la chaudière',
    co2NeedKgH: 'CO₂ absorbé par la culture',
    powerPrice: 'Prix de l’électricité vendue',
    waterM3Day: 'Eau refroidie par jour',
    inC: 'Eau entrante',
    outC: 'Eau sortante',
    heatDemandKwhDay: 'Chaleur nécessaire ce jour-là',
    areaHa: 'Surface',
    yieldTHa: 'Rendement',
    pricePerKg: 'Prix obtenu',
    labourDaysHa: 'Main-d’œuvre',
    wagePerDay: 'Salaire journalier',
    heatMwhYear: 'Chaleur par an',
    heatPricePerMwh: 'Prix de la chaleur',
    waterM3Year: 'Eau par an',
    waterPricePerM3: 'Prix de l’eau',
    inputsPerM2: 'Engrais et soins',
    otherPerM2: 'Conditionnement et frais généraux',
    capexPerM2: 'Coût de construction',
    demandM3Day: 'Eau nécessaire, jour de pointe',
    lossesPct: 'Pertes',
    feedSalinityGL: 'Salinité de l’eau de mer',
    recoveryPct: 'Taux de conversion',
    rejectionPct: 'Rejet de sel',
    secKwhM3: 'Énergie spécifique',
    storageDays: 'Stockage',
    capacityM3Day: 'Capacité installée',
    availabilityPct: 'Temps de marche',
    appliedM3Day: 'Eau apportée par jour',
    recyclePct: 'Drainage réutilisé',
    sourceEcDsM: 'EC de l’eau douce',
    sourceNaMmolL: 'Sodium dans l’eau douce',
    targetEcDsM: 'EC au goutteur',
    uptakeEcDsM: 'EC absorbée par la culture',
    flushEcDsM: 'Vidange au-dessus de l’EC',
    naLimitMmolL: 'Vidange au-dessus du sodium',
    systemM3: 'Eau dans la boucle',
    dilution: 'Dilution des solutions mères',
    stockTankM3: 'Chaque bac de solution mère',
    yieldSlopePct: 'Rendement perdu par dS/m',
    yieldThresholdEc: 'Pertes au-dessus de',
    rhPct: 'Humidité relative',
    ventPct: 'Ouvrants ouverts',
    nozzlesPer100M2: 'Buses',
    nozzleLh: 'Débit par buse',
    pressureBar: 'Pression de la pompe',
    onS: 'Salve de brouillard',
    maxRhPct: 'Plafond d’humidité',
    plantingWeek: 'Semaine de plantation',
    nurseryWeeks: 'Semaines en pépinière',
    vegetativeWeeks: 'Plantation aux premières fleurs',
    floweringWeeks: 'Fleurs à la première récolte',
    cropWeeks: 'Plantation à la fin de culture',
    ventilateAboveC: 'Ouvrants ouverts au-dessus de',
    coolAboveC: 'Brumisation au-dessus de (dehors)',
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
    sourceClMmolL: 'Eau d’osmose : à peu près autant que de sodium',
    sourceHco3MmolL:
      'Eau d’osmose : moins de 0,5 ; puits : 2 à 6, selon l’analyse',
    clLimitMmolL:
      'Indicatif : environ 10 dans le drainage ; demandez à votre conseiller',
    coolFromC:
      'Ventilateurs et pads démarrent ; en dessous, les ouvrants suffisent',
    airflowM3hM2: 'Pad et ventilateur : 120 à 150 m³/h par m² de sol',
    fanWPerM3h:
      'Essai ou fiche du ventilateur à la pression des pads : environ 0,03 à 0,04',
    pumpWm2: 'Pompes des pads : environ 0,4 W par m² de sol',
    emptyWeeks: 'Entre deux cultures, comme dans le calendrier',
    gridCo2KgKwh: 'Le chiffre de votre réseau ; 0,45 est un exemple',
    waterPerM3: 'Achetée, ou le coût complet de votre eau d’osmose',
    exportPerKwh: 'Ce que le réseau paie pour l’électricité de la cogénération',
    chpElectricKw: 'Sites du désert : environ 10 MW pour 50 ha (20 W/m²)',
    chpStartHour: 'Tourner de jour, quand le CO₂ sert ouvrants fermés',
    bufferM3: 'Courant 50–100 m³ par hectare',
    bufferDeltaK: '90 → 50 °C : 40 K',
    inC: 'Les forages profonds du Sud donnent une eau vers 40 °C',
    yieldTHa: 'Tomate sous verre du désert : environ 250 t/ha',
    labourDaysHa: 'Tomate sous abri : environ 1 000 jours/ha (étude 2018)',
    pricePerKg:
      'La tomate exportée valait 1,24–1,94 EUR/kg, janvier–avril 2016',
    capexPerM2: 'Votre propre devis ; ceci est un exemple',
    feedSalinityGL: 'La mer au large de Gabès : 39–40 g/L',
    recoveryPct:
      'Osmose d’eau de mer : 40–50 % ; la saumure monte vite au-delà',
    secKwhM3:
      'Courant 3–4 avec récupération d’énergie ; à confirmer avec le fournisseur',
    storageDays: 'Un à trois jours couvrent un arrêt de nettoyage',
    recyclePct: 'Les sites du désert réutilisent 30–50 % de leur eau',
    targetEcDsM: 'Tomate, solution de recharge : environ 2,7',
    flushEcDsM: 'Un plafond courant : 4,5',
    naLimitMmolL: 'Tomate : environ 8 mmol/L dans le drainage',
    systemM3: 'Pains, tuyaux et bacs : environ 4 L par m²',
    yieldSlopePct: 'Indicatif : 7,3 % d’un essai ; mettez le vôtre',
    ventPct: 'Réduire les ouvrants pendant la brumisation : 5–15 % du sol',
    nozzlesPer100M2: '27 buses de 5,4 L/h donnent environ 24 g/m² par minute',
    pressureBar: 'Haute pression, 40–70 bar, pour des gouttelettes de 10–30 µm',
    onS: 'La pause qui suit est calculée pour tenir le plafond',
    maxRhPct: 'Tenir 65–75 % a économisé environ 21 % de l’eau',
    plantingWeek: 'Les sites de tomate du désert plantent vers la semaine 36',
    nurseryWeeks: 'Plants de tomate : environ 7 semaines',
    floweringWeeks: 'Tomate : environ 8 semaines',
    cropWeeks: 'Semaine 36 à semaine 29 : 46 semaines',
    coolAboveC: 'Les après-midi plus chauds demandent brouillard ou pads',
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
    coolingYear: 'Refroidissement sur l’année',
    energy: 'Pôle énergie (cogénération)',
    heatReuse: 'Chaleur de l’eau refroidie',
    economics: 'Économie',
    ro: 'Osmose inverse d’eau de mer',
    fertigation: 'Fertirrigation et drainage',
    vpd: 'Humidité et VPD',
    fog: 'Brumisation',
    calendar: 'Calendrier de culture',
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
    tabs: {
      ventilation: 'Aération',
      padFan: 'Pad & ventilateurs',
      fog: 'Brumisation',
    },
    fogInside: 'Dedans avec brouillard',
    ventOnly: 'Ouvrants seuls',
    fogRh: 'Humidité dedans',
    fogRate: 'Brouillard en marche',
    fogMean: 'En moyenne',
    fogCycle: 'Cycle marche / arrêt',
    fogOn: 'du temps en marche',
    nozzles: 'Buses',
    padCompare: 'Des pads utiliseraient',
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
      fogRate: 'Brouillard = buses × L/h / sol',
      fogBalance:
        'Dedans = T_ext + (soleil − λ × brouillard) / (ρ × cp × air + U × A)',
      fogCycle:
        'Cycle : la part de brouillard que l’air absorbe sous le plafond',
      fogWater: 'Eau = q × A × t / 10⁶',
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
    tabs: {
      light: 'Lumière',
      co2: 'CO₂',
      humidity: 'Humidité de nuit',
      vpd: 'VPD',
    },
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
      saturation: 'Saturation : e_s = 0,6108 × exp(17,27 T / (T + 237,3))',
      vpd: 'VPD = e_s × (1 − HR / 100)',
      headroom: 'Marge = saturé − eau dans l’air',
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

  stages: {
    nursery: 'Pépinière',
    vegetative: 'Croissance',
    flowering: 'Floraison',
    harvest: 'Récolte',
    cleanOut: 'Vide sanitaire',
  },
  vpd: {
    stage: 'Stade de la culture',
    light: 'Lumière',
    lights: {
      sun: 'Ensoleillé',
      cloud: 'Nuageux',
      night: 'Nuit',
    },
    status: {
      tooWet: 'Trop humide',
      good: 'Bon',
      tooDry: 'Trop sec',
    },
    ideal: 'idéal',
    actions: {
      hold: 'Garder le climat tel quel',
      ventilate: 'Aérer pour sécher l’air',
      heatAndVent: 'Chauffer un peu et ouvrir les ouvrants',
      heat: 'Chauffer : l’air extérieur est plus humide',
      humidify: 'Humidifier : brouillard ou brumisation',
      coolAndHumidify: 'Ombrer et brumiser : rafraîchir et humidifier',
    },
    band: 'Plage',
    absolute: 'Eau dans l’air',
    headroom: 'Marge avant saturation',
    pairsTitle: 'Le même VPD à d’autres températures',
    targetsTitle: (stage: string) => `Consignes · ${stage}`,
    day: 'Jour',
    night: 'Nuit',
    source: 'Source',
  },
  advice: {
    title: 'Stratégie de refroidissement',
    strategies: {
      vents: 'Les ouvrants suffisent',
      ventsAndShade: 'Ouvrants et ombrage',
      shadeAndFog: 'Ombrage et brouillard haute pression',
      shadeAndPad: 'Ombrage et pad & ventilateurs',
    },
    ventsNeeded: 'Ouvrants nécessaires, sans ombrage ajouté',
    withShade: (pct: string) => `Ouvrants avec ${pct} % d’ombrage`,
    fogInside: 'Dedans avec ombrage et brouillard',
    padOutlet: 'Air sortant d’un pad mouillé',
    openFog: 'Dimensionner la brumisation',
    rule: 'Règle : au-dessus de 38 °C dehors, ou d’ouvrants sur plus d’un quart du sol, ombrer et refroidir par évaporation plutôt que d’agrandir les ouvrants.',
  },
  calendar: {
    title: 'Calendrier de culture',
    lead: 'L’année de culture semaine par semaine : ses stades, le climat de chacun, et quand tournent le chauffage, le CO₂, l’ombrage et le brouillard.',
    rows: {
      temp: 'Dehors',
      stage: 'Culture',
      heating: 'Chauffage',
      co2: 'CO₂',
      shade: 'Ombrage',
      fog: 'Brouillard',
    },
    targets: 'Consignes par stade',
    stage: 'Stade',
    weeks: 'semaines',
    week: 'Semaine',
    firstHarvest: 'Première récolte',
    weeksOfPicking: 'semaines de cueillette',
    end: 'Fin de culture',
    heatingFrom: 'Chauffage dès',
    systems: 'Systèmes',
    harvestWeeks: 'Semaines de cueillette',
    heatingWeeks: 'Semaines de chauffage',
    fogWeeks: 'Semaines de brouillard',
  },
  science: {
    title: 'Science',
    lead: 'Les phénomènes derrière chaque calculateur : ce qui se passe, la formule, ce qu’elle suppose, et comment mesurer chaque nombre saisi.',
    search: 'Chercher un sujet',
    empty: 'Aucun sujet ne correspond.',
    contents: 'Sujets',
    formula: 'Formule',
    inputs: 'Données et comment les obtenir',
    input: 'Donnée',
    method: 'Comment',
    instrument: 'Instrument',
    assumptions: 'Hypothèses',
    related: 'Liés',
    usedIn: 'Utilisé dans',
    sources: 'Sources',
    instrumentsTitle: 'Instruments',
    foldAll: 'Tout replier',
    unfoldAll: 'Tout déplier',
    instrumentsLead: 'Avec quoi mesurer, et comment bien lire.',
    photo: 'Photo',
    photoCaptions: {
      airLeakage:
        'Dans un tunnel en film : chaque jour dans la couverture laisse fuir l’air chaud.',
      cogeneration: 'Le moteur à gaz d’une unité de cogénération.',
      coolingEnergy:
        'Un ventilateur d’extraction : en pad-and-fan, les ventilateurs font l’essentiel de la facture de froid.',
      cropCalendar: 'Des plants en pépinière, avant la plantation.',
      desalination:
        'Dans une usine d’osmose inverse : des rangées de tubes de pression qui portent les membranes.',
      dewPoint:
        'L’eau se condense sur un verre plus froid que le point de rosée de l’air.',
      fertigation:
        'Un goutteur qui nourrit une plante sur substrat : là où commence la boucle de fertirrigation.',
      geometry:
        'Un ensemble de serres verre : des chapelles côte à côte sous une même ligne de chéneau.',
      heatLoss:
        'Un double écran énergétique tiré sous le toit réduit la chaleur perdue la nuit.',
      rainHarvest:
        'Des cuves d’eau de pluie : ce que le toit recueille est gardé pour les mois secs.',
      siteScale:
        'Les serres d’Almería vues de l’orbite par un astronaute de la NASA.',
      transpiration:
        'Une feuille de tomate au microscope (100×) : les stomates, par où sort son eau.',
      ventilation:
        'Des ouvrants de toit le long du faîtage laissent sortir l’air chaud et humide.',
    },
    howToGet: (label: string) => `Comment obtenir « ${label} »`,
    readMore: 'Lire :',
    close: 'Fermer',
    groups: {
      site: 'Site et argent',
      house: 'La serre',
      heat: 'Chaleur',
      air: 'Air, humidité et refroidissement',
      water: 'Eau',
      crop: 'Lumière, CO₂ et culture',
    },
    methods: {
      measure: 'À mesurer',
      datasheet: 'Fiche technique',
      derived: 'Calculé',
      setpoint: 'Votre réglage',
      assume: 'Hypothèse de calcul',
      bill: 'Vos factures',
    },
    methodHints: {
      measure: 'À relever sur place avec l’instrument ci-dessous.',
      datasheet:
        'À prendre sur la fiche technique du fournisseur ; l’aide donne une valeur courante.',
      derived:
        'SerraCalc le calcule à partir de la serre ou d’un autre outil ; remplacez-le si vous savez mieux.',
      setpoint: 'Un choix : une consigne ou un objectif de conduite.',
      assume:
        'Une valeur courante de la pratique ; affinez-la avec vos propres relevés.',
      bill: 'Votre tarif ou facteur, dans la devise du projet.',
    },
    topics: {
      coolingEnergy: {
        title: 'L’électricité du refroidissement sur l’année',
        what: 'Le refroidissement par pad et ventilateur fonctionne à l’électricité : les ventilateurs tirent 120 à 150 m³/h d’air par m² de sol à travers des pads mouillés, et des pompes gardent les pads humides. Sur l’année, les ventilateurs ne tournent qu’aux heures chaudes, d’autant plus vite qu’il fait chaud : la consommation suit le climat. Une serre méditerranéenne consomme environ 10 kWh/m² par an : un repère pour le chiffre.',
        assumptions: [
          'Chaque mois est sa journée moyenne : température extérieure en cosinus, maximale à 15 h.',
          'La puissance des ventilateurs suit la part des ventilateurs en marche (ventilateurs par paliers).',
          'Les pompes des pads tournent dès que les ventilateurs tournent.',
        ],
      },
      cogeneration: {
        title: 'Cogénération et stockage de chaleur',
        what: 'Un moteur à gaz produit de l’électricité et, de son eau de refroidissement et de ses fumées, de la chaleur ; ses fumées épurées apportent du CO₂ à la culture. Tournant de jour, quand la culture peut utiliser le CO₂, il produit plus de chaleur que la serre n’en demande : un ballon tampon la porte dans la nuit et une chaudière couvre le reste.',
        assumptions: [
          'Un jour d’hiver de calcul, l’extérieur suivant un cosinus de 3 h à 15 h.',
          'La cogénération tourne à pleine puissance pendant ses heures.',
        ],
      },
      heatReuse: {
        title: 'Chaleur de l’eau de forage refroidie',
        what: 'L’eau tirée chaude d’un forage profond puis refroidie pour l’irrigation ou le refroidissement cède 1,163 kWh par m³ et par kelvin. La refroidir de 40 à 15 °C libère environ 29 kWh par m³, qu’une pompe à chaleur ou une boucle basse température peut rendre à la serre.',
        assumptions: [
          'Toute la chaleur libérée est récupérée.',
          'Eau à 1 000 kg/m³ et 4,19 kJ/kg·K.',
        ],
      },
      siteScale: {
        title: 'Échelle du site et économie',
        what: 'Un grand site se compose de compartiments de quelques hectares, chacun une serre répétée sur sa surface, qui partagent l’osmose, la cogénération et la station de conditionnement. Les additionner donne l’eau, la chaleur, la main-d’œuvre et la production que les équipements partagés doivent servir, et le coût de chaque kilo.',
        assumptions: [
          'Chaque compartiment se comporte comme la serre de son projet, au m².',
          'Prix, salaires et rendements sont des exemples à remplacer par les vôtres.',
        ],
      },
      desalination: {
        title: 'Dessalement de l’eau de mer par osmose inverse',
        what: 'Une forte pression pousse l’eau de mer à travers des membranes qui retiennent le sel. La conversion est la part qui passe comme perméat ; le reste sort en saumure, plus salée d’autant. Pomper contre la pression osmotique demande 3–4 kWh par m³ avec récupération d’énergie.',
        assumptions: [
          'Le perméat garde (1 − rejet) de la salinité moyenne le long des membranes.',
          'Énergie et conversion sont courantes ; confirmez-les avec le fournisseur.',
        ],
      },
      fertigation: {
        title: 'Fertirrigation et recyclage du drainage',
        what: 'La culture boit l’eau mais laisse l’essentiel du sodium et du chlorure : le drainage est plus salé que l’apport. Réutiliser le drainage économise eau et engrais, mais son sel s’accumule jusqu’à la vidange ; rejeter une part du drainage stabilise le sodium. Les limites de sodium et de chlorure se lisent dans le drainage, là où l’on prélève la zone racinaire.',
        assumptions: [
          'Le sodium n’entre presque pas dans la culture.',
          'La perte de rendement est linéaire au-dessus de 2 dS/m : indicatif, d’un essai et d’une variété.',
        ],
      },
      geometry: {
        title: 'Géométrie de la serre',
        what: 'Toutes les charges dépendent de trois nombres : le sol (où l’on cultive et où tombe le soleil), la couverture (qui perd la chaleur) et le volume d’air (qui amortit chaleur, humidité et CO₂). Une serre haute a plus d’air par m² et varie moins.',
        assumptions: [
          'Les toits sont des pentes droites, ou une demi-ellipse pour un arceau.',
          'Les pignons comptent comme couverture ; portes et chéneaux sont ignorés.',
        ],
      },
      heatLoss: {
        title: 'Pertes de chaleur par la couverture',
        what: 'La chaleur traverse la couverture de la serre chaude vers la nuit froide, selon la surface, l’écart de température et le coefficient U. Un écran thermique fermé la réduit ; le soubassement perd un peu plus le long du périmètre.',
        assumptions: [
          'Les U sont des valeurs de calcul pour une nuit calme et claire (ASAE EP406).',
          'La nuit de calcul revient la plupart des hivers ; ce n’est pas le record.',
        ],
      },
      airLeakage: {
        title: 'Fuites d’air',
        what: 'L’air froid entre par les jointures, les ouvrants et les portes, et doit être chauffé. Le taux de renouvellement N dit combien de fois par heure tout le volume est remplacé : près de 0,5 pour un double film étanche, 1,5–2 pour un vieux verre.',
        assumptions: [
          'Les fuites ne varient pas avec le vent dans ces outils.',
          '0,335 Wh par m³ et par K est la capacité calorifique de l’air vers 20 °C.',
        ],
      },
      hotWater: {
        title: 'Tubes de chauffage à eau chaude',
        what: 'Une boucle cède sa chaleur par convection et rayonnement. La chute de température de l’eau fixe le débit (1,163 kWh par m³ et par K) et la puissance par mètre fixe la longueur de tube. L’eau géothermale à 60–75 °C demande plus de tube qu’une chaudière à 80–90 °C.',
        assumptions: [
          'Convection libre autour d’un tube horizontal : h = 1,32 (ΔT/D)^0,25.',
          'La surface du tube est à la température moyenne de l’eau.',
        ],
      },
      solarGain: {
        title: 'Apport solaire',
        what: 'Le soleil qui traverse la couverture devient chaleur. Une partie sert à la culture pour évaporer l’eau ; le reste chauffe l’air et doit sortir par les ouvrants, les pads ou le brouillard. L’ombrage et le blanchiment la coupent à la source.',
        assumptions: [
          'La transmission inclut la structure et la poussière.',
          'Une culture pleine consacre environ la moitié du soleil à la transpiration.',
        ],
      },
      ventilation: {
        title: 'Aération naturelle',
        what: 'L’air chaud monte et sort par les ouvrants du faîtage (effet cheminée) et le vent fait passer l’air. La surface d’ouvrants nécessaire grimpe vite quand la serre ne doit dépasser l’extérieur que de quelques degrés ; au-delà d’environ 30 % du sol, les ouvrants seuls ne suffisent plus.',
        assumptions: [
          'Boulard et Baille (1995) : Cd 0,65 et Cw 0,1 pour les ouvrants de toit.',
          'Air à 1,2 kg/m³ et 1005 J/kg·K.',
        ],
      },
      evaporativeCooling: {
        title: 'Refroidissement par évaporation et bulbe humide',
        what: 'L’eau qui s’évapore dans l’air sec lui prend de la chaleur. On ne peut pas refroidir l’air sous sa température de bulbe humide, qui baisse quand l’air est plus sec : à 44 °C et 15 %, le bulbe humide est vers 22 °C. Un pad mouillé fait 75–85 % du chemin.',
        assumptions: [
          'Bulbe humide selon Stull (2011), à environ 0,3 K près.',
          'L’air se réchauffe régulièrement entre les pads et les ventilateurs.',
        ],
      },
      fogging: {
        title: 'Brumisation haute pression',
        what: 'Des buses à 40–70 bar font des gouttelettes de 10–30 µm qui s’évaporent avant de tomber, rafraîchissant l’air pendant que les ouvrants restent ouverts. L’humidité est la limite : le brouillard est réduit pour rester sous un plafond, en général 70–80 %.',
        assumptions: [
          'Tout le brouillard s’évapore tant que l’air reste sous le plafond.',
          'Le débit des ouvrants suit Boulard et Baille, selon le vent et l’écart de température.',
        ],
      },
      vpd: {
        title: 'Déficit de pression de vapeur (VPD)',
        what: 'Le VPD est la quantité d’eau que l’air pourrait encore prendre à sa température. Il pilote la transpiration : trop bas, la plante ne fait plus circuler l’eau et le calcium et les champignons s’installent ; trop haut, les stomates se ferment et la plante flétrit. Un même VPD correspond à beaucoup de couples température–humidité.',
        assumptions: [
          'La feuille et l’air sont pris à la même température.',
          'Pression de vapeur saturante selon Tetens, comme la FAO-56.',
        ],
      },
      dewPoint: {
        title: 'Point de rosée et condensation',
        what: 'L’air refroidi jusqu’à son point de rosée commence à perdre de l’eau. La nuit, la face intérieure de la couverture est plus froide que l’air ; sous le point de rosée, elle goutte sur la culture et propage les maladies.',
        assumptions: [
          'La face intérieure échange environ 8 W/m²·K avec l’air.',
          'Le ciel nocturne et le vent sont compris dans le coefficient U.',
        ],
      },
      nightHumidity: {
        title: 'Déshumidifier la nuit',
        what: 'La nuit, la culture transpire encore. Cette eau doit sortir avec un air extérieur qui en contient moins, et cet air doit être chauffé. Aérer ne sèche pas la serre quand l’air extérieur contient plus d’eau en valeur absolue.',
        assumptions: [
          'Eau en grammes par kg d’air sec, à la pression du niveau de la mer.',
          'La condensation sur la couverture n’est pas comptée comme sortie.',
        ],
      },
      transpiration: {
        title: 'Transpiration et irrigation',
        what: 'Une culture transpire environ les deux tiers du soleil reçu : ses besoins suivent le rayonnement intérieur. En hors-sol on ajoute le drainage pour lessiver les sels ; avec une eau saumâtre, la part de drainage doit augmenter.',
        assumptions: [
          '2,45 MJ évaporent un litre d’eau.',
          'Le couvert végétal réduit la consommation d’une jeune culture.',
        ],
      },
      rainHarvest: {
        title: 'Récupération d’eau de pluie',
        what: 'Le toit d’une serre est un grand impluvium. Un bassin garde la pluie entre deux orages : mois après mois il se remplit, se vide dans l’irrigation et déborde quand il est plein.',
        assumptions: [
          'Totaux mensuels ; un gros orage est vérifié à part.',
          'Les premiers millimètres de chaque pluie sont perdus.',
        ],
      },
      light: {
        title: 'Lumière pour la culture (DLI)',
        what: 'Les plantes comptent des photons, pas des watts : l’intégrale lumineuse journalière est le nombre de moles de lumière photosynthétique par m² et par jour, et environ 47 % du soleil est du PAR. Les lampes comblent l’écart des mois sombres ; l’ombrage garde les mois lumineux sous le plafond de la culture.',
        assumptions: [
          '4,57 µmol de photons par joule de PAR solaire.',
          'Les lampes sont dimensionnées pour le mois le plus sombre.',
        ],
      },
      co2: {
        title: 'Enrichissement en CO₂',
        what: 'La culture prend le CO₂ de l’air, et 700–900 ppm augmentent le rendement. Ce qu’on apporte va dans la culture ou part avec l’air : l’enrichissement paie quand les ouvrants sont presque fermés. Un brûleur à gaz ou une cogénération donnent CO₂ et chaleur ensemble.',
        assumptions: [
          '1,83 g de CO₂ par m³ d’air pour 1000 ppm.',
          '1 m³ de gaz naturel brûlé donne 1,96 kg de CO₂.',
        ],
      },
      cropCalendar: {
        title: 'L’année de culture',
        what: 'Une culture passe par des stades qui veulent des climats différents. Lu avec les normales climatiques, le calendrier montre quand les nuits demandent de la chaleur, quand la serre reste assez fermée pour le CO₂, et quand le soleil appelle ombrage et brouillard.',
        assumptions: [
          'Les valeurs hebdomadaires sont lues entre les normales mensuelles.',
          'Les durées des stades sont courantes ; vérifiez-les avec le semencier.',
        ],
      },
    },
    instruments: {
      ecMeter: {
        name: 'Conductimètre et pH-mètre',
        how: 'Un conductimètre portable ou en ligne, compensé à 25 °C. Étalonnez-le chaque semaine avec un tampon à 1,41 dS/m et lisez l’apport et le drainage à la même heure.',
      },
      labAnalysis: {
        name: 'Analyse d’eau en laboratoire',
        how: 'Prélevez la source, l’apport et le drainage toutes les deux à quatre semaines ; le laboratoire donne sodium, chlorure, éléments nutritifs et bicarbonates en mmol/L.',
      },
      tape: {
        name: 'Mètre ruban ou télémètre laser',
        how: 'Mesurer chapelles, longueurs et hauteurs du sol au chéneau. Compter chapelles, plants, goutteurs et buses sur quelques rangs, puis extrapoler.',
      },
      thermometer: {
        name: 'Thermomètre d’air ventilé',
        how: 'Un capteur dans un abri blanc ventilé, à hauteur de culture, à l’ombre. Un capteur au soleil lit plusieurs degrés de trop.',
      },
      hygrometer: {
        name: 'Capteur d’humidité ou psychromètre',
        how: 'Un capteur capacitif dans le même abri ventilé, vérifié chaque année avec un psychromètre à bulbes sec et humide. Lire température et humidité ensemble.',
      },
      weatherStation: {
        name: 'Station météo extérieure',
        how: 'Température et humidité sous abri à 2 m, loin des serres. Pour les valeurs de calcul, prendre les nuits froides et les après-midi chauds de plusieurs années.',
      },
      pyranometer: {
        name: 'Pyranomètre',
        how: 'Le rayonnement global en W/m², horizontal et propre, au-dessus du toit. L’ordinateur climatique en a souvent un ; ses sommes journalières en MJ/m² alimentent les outils eau et lumière.',
      },
      parSensor: {
        name: 'Capteur PAR (quantique)',
        how: 'Les photons en µmol/m²·s. Lire dehors et à hauteur de culture au même moment : dedans sur dehors donne la transmission. Sommé sur la journée, il donne la DLI.',
      },
      anemometer: {
        name: 'Anémomètre',
        how: 'Un anémomètre à coupelles ou ultrasonique sur un mât au-dessus du faîtage ; prendre un après-midi d’été courant, pas les rafales. Un anémomètre à hélice à main lit la vitesse dans un pad ou un ventilateur.',
      },
      co2Sensor: {
        name: 'Capteur de CO₂ (NDIR)',
        how: 'Un capteur infrarouge ventilé à hauteur de culture. Le vérifier sur l’air extérieur, vers 420 ppm, avant chaque saison.',
      },
      tracerGas: {
        name: 'Test de décroissance d’un gaz traceur',
        how: 'Par une nuit calme, fermer la serre, monter le CO₂ vers 1000 ppm et enregistrer sa baisse : N = ln((C₁ − C_ext) / (C₂ − C_ext)) / heures.',
      },
      flowMeter: {
        name: 'Débitmètre',
        how: 'Un débitmètre à ultrasons sur tube ou en ligne sur la conduite principale. Lire le débit pendant qu’un secteur tourne, ou la courbe de la pompe à sa hauteur de travail.',
      },
      catchCups: {
        name: 'Test aux gobelets',
        how: 'Recueillir 10–20 goutteurs ou buses pendant quelques minutes chronométrées, mesurer chaque volume à l’éprouvette et faire la moyenne. L’écart montre l’uniformité du réseau.',
      },
      drainTray: {
        name: 'Bac de drainage sur balance',
        how: 'Quelques pains sur un bac avec auget basculeur ou balance : part de drainage = drainage ÷ eau apportée. Mesurer en même temps l’EC du goutteur et du drainage.',
      },
      pressureGauge: {
        name: 'Manomètre',
        how: 'Un manomètre à glycérine à la sortie de la pompe (1 bar vaut environ 10 m de hauteur), ou un manomètre différentiel sur un ventilateur pour sa pression statique.',
      },
      infrared: {
        name: 'Thermomètre de contact ou infrarouge',
        how: 'Une sonde de contact sur les tubes aller et retour, ou un thermomètre infrarouge réglé sur l’émissivité du tube.',
      },
      meters: {
        name: 'Compteurs de gaz, de chaleur et d’électricité',
        how: 'Les relevés mensuels et les factures donnent la consommation réelle, la puissance et les tarifs pour vérifier les outils.',
      },
      climateComputer: {
        name: 'Journaux de l’ordinateur climatique',
        how: 'Consignes, heures de marche, cycles de brouillard et apports d’irrigation viennent des réglages et des journaux de l’ordinateur climatique.',
      },
    },
  },
  supply: {
    limitBy: {
      na: 'Le sodium atteint sa limite en premier',
      cl: 'Le chlorure atteint sa limite en premier',
      ec: 'Le plafond d’EC arrive en premier',
    },
    strategies: {
      title: 'Contenir le sel : une année comparée',
      lead: 'La même boucle sur une année, selon cinq façons de gérer le sel que la culture laisse. En gras : le plus bas de sa colonne.',
      table: 'Stratégies de vidange sur une année',
      strategy: 'Stratégie',
      flushes: 'Vidanges',
      letGo: 'Rejeté',
      fresh: 'Eau douce',
      stockLost: 'Solution mère perdue',
      minNutrient: 'EC nutritive la plus basse',
      names: {
        current: 'Réglage actuel',
        flush: 'Vidange au plafond d’EC',
        acid: 'Appoint acidifié',
        variable: 'EC d’appoint abaissée',
        bleed: 'Purge continue',
      },
      assume:
        'Une année jour par jour, boucle fermée (tout le drainage réutilisé) sauf « réglage actuel » et la purge. L’acide dans l’appoint transforme le bicarbonate en CO₂ et en nitrate : il n’ajoute plus à l’EC. Abaisser l’EC d’appoint tient l’EC au goutteur mais nourrit moins. Solution mère perdue : L de chacune des solutions A et B, l’eau rejetée comptée à la concentration d’apport. Perte de rendement indicative.',
    },
    title: 'Eau d’irrigation',
    lead: 'De la mer à la racine : une osmose inverse dimensionnée pour le jour de pointe de la culture, et la boucle nutritive qui réutilise le drainage et vidange avant que le sel s’accumule.',
    tabs: {
      ro: 'Osmose d’eau de mer',
      fertigation: 'Fertirrigation',
    },
    sea: 'Mer',
    membranes: 'Membranes',
    brine: 'Saumure',
    fresh: 'Eau douce',
    drain: 'Drainage',
    reused: 'Réutilisé',
    letGo: 'Rejeté',
    days: 'jours',
    flush: 'Vidange',
    takeDemand: (m3: string) => `Prendre le jour de pointe : ${m3} m³`,
    useRo: (ec: string) => `Utiliser l’eau osmosée : EC ${ec}`,
    feed: 'Eau de mer pompée',
    product: 'Perméat',
    productEc: 'EC du perméat',
    energy: 'Énergie par jour',
    costDay: 'Électricité par jour',
    coverage: 'L’usine couvre',
    tank: 'Réservoir',
    waterSaved: 'Eau économisée',
    fertSaved: 'Engrais économisé',
    drainEc: 'EC du drainage',
    rootEc: 'Zone racinaire',
    yieldLoss: 'Rendement perdu au sel',
    flushIn: 'Vidange dans',
    never: 'Inutile',
    levelsAt: 'Drainage stable à',
    naInDrain: 'Na du drainage, mmol/L',
    stock: 'Solutions A et B, chacune',
    stockDays: (days: string) => `un bac dure ${days} jours`,
    formulas: {
      roFeed: 'Alimentation = perméat / conversion',
      roBrine: 'Saumure = alimentation − perméat ; salinité ≈ S_mer / (1 − R)',
      roEnergy: 'Énergie = SEC × perméat',
      fertDrain: 'EC drainage = (A × EC_apport − U × EC_absorbée) / D',
      fertNa:
        'Sodium du drainage (A/D × l’apport) : fermé, t = V (C_lim × D/A − C_0) / (C_in × eau douce) ; sinon il se stabilise à C_in × eau douce / rejet',
      fertYield: 'Rendement = 1 − pente × (EC_racines − seuil)',
      fertStock: 'Solution mère = éléments nécessaires / dilution',
    },
  },
  energy: {
    coolKwhM2: 'Électricité de refroidissement',
    coolChartAlt: (place: string, total: string) =>
      `Électricité de refroidissement par mois à ${place} : ${total} kWh par m² sur l’année.`,
    coolCaption:
      'Ventilateurs et pompes sur la journée moyenne de chaque mois ; rien tant que la serre est vide.',
    coolYear: 'Refroidissement par an',
    coolBenchmark: (bench: string, pct: string) =>
      `${pct} % des ${bench} kWh/m² publiés`,
    coolSite: 'Pour toute la serre',
    coolPeak: 'Tout en marche :',
    coolCost: 'Électricité par an',
    coolCo2: 'CO₂ du réseau par an',
    coolHours: 'Heures de refroidissement',
    coolTable: 'Refroidissement par mois',
    month: 'Mois',
    coolOfBenchmark: 'Des 10 kWh/m² publiés',
    title: 'Énergie',
    lead: 'Une cogénération au gaz qui donne chaleur, électricité et CO₂ au fil d’une journée d’hiver, un ballon tampon pour la nuit et une chaudière pour le reste ; et la chaleur contenue dans l’eau de forage refroidie.',
    tabs: {
      cooling: 'Refroidissement sur l’année',
      chp: 'Cogénération et tampon',
      reuse: 'Récupération de chaleur',
    },
    buffer: 'Tampon',
    fromChp: 'Cogénération',
    fromBuffer: 'Tampon',
    fromBoiler: 'Chaudière',
    demand: 'Besoin',
    chpShare: 'La cogénération couvre',
    dayNeed: 'Chaleur du jour',
    dumped: 'Perdue',
    gas: 'Gaz par jour',
    power: 'Électricité produite',
    netCost: 'Gaz moins électricité vendue',
    co2: 'CO₂ à la culture',
    co2Need: 'Nécessaire',
    inWater: 'Chaleur dans l’eau',
    need: 'Besoin de chaleur',
    covers: 'Couvre',
    takeLinks: 'Prendre l’eau du jour de pointe et la chaleur du jour d’hiver',
    formulas: {
      coolPower: 'Puissance = débit × W des ventilateurs par m³/h + pompes',
      coolShare:
        'Les ventilateurs suivent la chaleur : f = min(1, (T − départ) / écart)',
      coolYear: 'Année = Σ jours × Σ heures de puissance',
      coolCheck: 'Comparaison avec environ 10 kWh/m² par an',
      demand:
        'Besoin = H × (T_consigne − T_ext) − soleil, moins l’écran la nuit',
      buffer: 'Tampon = 1,163 × V × ΔT',
      gas: 'Gaz = P_él / η_él / 9,77 × heures + chaudière',
      co2: 'CO₂ = 1,96 kg par m³ de gaz',
      reuse: 'Chaleur = 1,163 × V × ΔT',
    },
  },
  site: {
    plantList: 'Les équipements du site',
    plantHint:
      'Notez les équipements que les compartiments partagent ; les contrôles les comparent au jour de pointe du site.',
    noPlants:
      'Aucun équipement noté : ajoutez l’osmose, la cogénération, les chaudières, les groupes froids, les bassins et les pompes.',
    plantTypes: {
      ro: 'Osmose d’eau de mer',
      chp: 'Cogénération',
      boiler: 'Chaudière',
      chiller: 'Groupe froid',
      tank: 'Bassin',
      pump: 'Pompe',
    },
    plantName: 'Nom',
    plantField: {
      capacity: 'Capacité',
      efficiency: 'Rendement',
      hoursDay: 'Heures par jour',
    },
    removePlant: (name: string) => `Retirer ${name}`,
    plantType: 'Équipement',
    addPlant: 'Ajouter l’équipement',
    tariffs: 'Tarifs',
    tariffHint:
      'Ce que le site paie pour le gaz, l’électricité et l’eau, et reçoit pour l’électricité vendue. L’économie peut les reprendre.',
    checksTitle: 'Équipements face au jour de pointe',
    noChecks:
      'Ajoutez une osmose, une cogénération ou une chaudière, un bassin ou une pompe pour les contrôler.',
    checks: {
      water: 'Eau d’osmose',
      heat: 'Chaleur (cogénération et chaudières)',
      storage: 'Stockage d’eau',
      pumping: 'Pompage',
    },
    checkLine: (pct: string) => `${pct} % du besoin`,
    fromSaved:
      'D’après les équipements notés dans Équipements et tarifs ; plus bas, d’après les résultats enregistrés.',
    takeTariffs: 'Reprendre les tarifs du site',
    title: 'Site',
    lead: 'Toute l’exploitation : chaque projet est un compartiment, sa serre répétée sur sa surface ; les totaux, l’osmose et la cogénération partagées face à eux, et l’économie de l’année.',
    tabs: {
      plants: 'Équipements et tarifs',
      overview: 'Vue d’ensemble',
      economics: 'Économie',
    },
    choose: 'Site',
    unnamed: 'Site sans nom',
    empty:
      'Aucun projet. Les projets qui partagent le même « Site » forment un site ; donnez ici sa surface à chacun.',
    compartments: (n: string) => `Compartiments : ${n}`,
    area: 'Surface',
    peakWater: 'Eau, jour de pointe',
    meanWater: 'moyenne',
    heatPeak: 'Chaleur, nuit de calcul',
    yield: 'Production par an',
    labour: 'Main-d’œuvre par an',
    days: 'jours',
    people: (n: string) => `environ ${n} personnes à plein temps`,
    co2e: 'Empreinte carbone',
    co2eHint: '1,9 kg CO₂e par kg (estimation publiée)',
    sharesAlt: 'Compartiments selon leur part de la surface',
    plants: 'Équipements partagés',
    roPlant: 'Osmose d’eau de mer',
    chpPlant: 'Cogénération',
    covers: (pct: string) => `couvre ${pct} % du jour de pointe`,
    chpOfPeak: (pct: string) => `${pct} % de la pointe de chaleur`,
    noRo: 'Enregistrez un résultat d’osmose d’eau de mer dans l’un de ces projets pour le vérifier ici.',
    noChp:
      'Enregistrez un résultat du pôle énergie dans l’un de ces projets pour le vérifier ici.',
    table: 'Compartiments',
    tableHint:
      'Donnez la surface de chaque compartiment : sa serre y est répétée.',
    compartment: 'Compartiment',
    houses: 'Serres',
    areaOf: (name: string) => `Surface de ${name}, ha`,
    takeTotals: (ha: string) => `Prendre les totaux du site : ${ha} ha`,
    costPerKg: 'Coût par kg',
    price: 'Prix',
    margin: 'Marge',
    revenue: 'Chiffre d’affaires',
    payback: 'Retour sur investissement',
    years: 'ans',
    waterPerKg: 'Eau par kg',
    costTitle: 'Où va l’argent',
    costs: {
      labour: 'Main-d’œuvre',
      energy: 'Énergie',
      water: 'Eau',
      inputs: 'Engrais et soins',
      other: 'Conditionnement et frais',
    },
    formulas: {
      yield: 'Production = surface × t/ha',
      cost: 'Coût par kg = coûts / kg',
      payback: 'Retour = construction / marge',
    },
  },
  ops: {
    title: 'Exploitation',
    lead: 'Le cahier de culture, la tournée d’hygiène du jour, l’entretien des équipements et un plan chaleur pour les personnes qui travaillent dedans.',
    noProject: 'Ouvrez un projet pour tenir son cahier.',
    tabs: {
      log: 'Cahier',
      hygiene: 'Hygiène',
      maintenance: 'Entretien',
      heat: 'Stress thermique',
    },
    newEntry: 'Nouvelle entrée',
    date: 'Date',
    kind: 'Type',
    kinds: {
      scouting: 'Observation',
      release: 'Lâcher d’auxiliaires',
      spray: 'Traitement',
      maintenance: 'Entretien',
      hygiene: 'Contrôle d’hygiène',
      harvest: 'Récolte',
    },
    subjects: {
      scouting: 'Ravageur ou maladie vu, et où',
      release: 'Auxiliaire lâché',
      spray: 'Produit appliqué',
      maintenance: 'Ce qui a été fait',
      hygiene: 'Liste de contrôle',
      harvest: 'Compartiment ou rangs',
    },
    task: 'Tâche',
    amount: 'Quantité',
    unit: 'Unité',
    who: 'Classe OMS',
    note: 'Remarque',
    add: 'Ajouter au cahier',
    entries: (n: string) => `Entrées du cahier : ${n}`,
    all: 'Tout',
    empty: 'Rien de noté pour l’instant.',
    remove: (what: string) => `Supprimer « ${what} »`,
    checklist: 'Liste d’hygiène',
    saveChecklist: (done: string, total: string) =>
      `Enregistrer la liste du jour (${done} sur ${total})`,
    recent: 'Dernières listes',
    every: 'Tous les',
    last: 'Dernière fois',
    due: 'À faire le',
    state: 'État',
    done: 'Fait aujourd’hui',
    days: 'jours',
    states: {
      ok: 'À jour',
      soon: 'Bientôt',
      overdue: 'En retard',
    },
    overdue: (n: string) => `Tâches en retard : ${n}`,
    tasks: {
      filters: 'Nettoyer les filtres d’irrigation',
      nozzles: 'Contrôler les buses de brumisation',
      pads: 'Nettoyer et rincer les pads',
      sensors: 'Étalonner les capteurs de climat et d’EC',
      pumps: 'Entretenir les pompes',
      fans: 'Contrôler ventilateurs et courroies',
      drainDisinfection: 'Contrôler la désinfection du drainage',
      roMembranes: 'Nettoyer les membranes d’osmose (NEP)',
      chp: 'Entretenir la cogénération',
    },
    hygiene: {
      footbath: 'Pédiluves remplis',
      handwash: 'Lavage des mains et gants à l’entrée',
      clothing: 'Tenue propre pour ce compartiment',
      tools: 'Couteaux et outils désinfectés',
      visitors: 'Visiteurs enregistrés et informés',
      waste: 'Déchets végétaux sortis et couverts',
      doors: 'Portes et filets anti-insectes fermés',
    },
    heatTitle: 'Stress thermique au travail',
    heatIndex: 'Indice de chaleur',
    rest: 'Repos par heure',
    water: 'Eau par heure',
    risks: {
      none: 'Pas de risque',
      caution: 'Prudence',
      extremeCaution: 'Grande prudence',
      danger: 'Danger',
      extremeDanger: 'Danger extrême',
    },
    plan: 'Le plan chaleur',
    advice: {
      caution: 'De l’eau à portée ; travaux lourds tôt le matin.',
      extremeCaution:
        'Repos 20 min par heure à l’ombre ; 0,75 L d’eau par heure.',
      danger:
        'Repos 40 min par heure ; pas de travaux lourds dedans ; surveillance mutuelle.',
      extremeDanger: 'Arrêter le travail dans la serre.',
    },
    heatSource:
      'Indice de chaleur du service météorologique américain (Rothfusz) ; travail et repos selon les recommandations courantes de santé au travail. Une aide à la planification, pas un avis médical.',
  },
  data: {
    title: 'Données en direct',
    lead: 'Les mesures de vos capteurs ou enregistreurs, importées en CSV et comparées à ce qu’attendent les calculateurs : VPD du stade, températures de jour et de nuit, drainage ; VPD par heure ; et alertes.',
    import: 'Importer des mesures',
    importHint:
      'Un CSV avec une colonne de temps et au choix : température, HR, PAR, EC, pH, drainage %, EC du drainage, température et HR extérieures. Virgules ou points-virgules, décimales en point ou en virgule.',
    file: 'Fichier CSV',
    paste: 'Ou collez-le ici',
    importPasted: 'Importer le texte collé',
    sample: 'Charger une semaine d’exemple',
    download: 'Télécharger le CSV d’exemple',
    clear: 'Effacer les mesures',
    noProject: 'Ouvrez un projet pour garder ses mesures.',
    imported: (n: string, skipped: string) =>
      `${n} mesures importées ; ${skipped} lignes ignorées.`,
    errors: {
      empty: 'Le fichier est vide.',
      noTime: 'Aucune colonne de temps trouvée.',
      noData: 'Aucune mesure trouvée.',
    },
    targets: 'Comparer avec',
    summary: 'Mesuré face à l’attendu',
    empty:
      'Pas encore de mesures : importez un CSV ou chargez la semaine d’exemple.',
    period: (from: string, to: string, n: string, step: string) =>
      `Du ${from} au ${to} : ${n} mesures, toutes les ${step} min.`,
    vpdInBand: 'VPD dans sa plage',
    dayMean: 'Jours, moyenne',
    nightMean: 'Nuits, moyenne',
    drainMean: 'Drainage, moyenne',
    plan: 'prévu',
    alertCount: 'Alertes',
    byHour: 'Par heure de la journée',
    vpdByHour: 'VPD par heure, kPa (vert : plage de jour)',
    tempByHour: 'Température par heure, °C (vert : plage de jour)',
    alertsTitle: 'Alertes',
    noAlerts: 'Aucune alerte dans ces mesures.',
    alerts: {
      vpdLow: 'VPD sous 0,3 kPa : risque de maladie',
      vpdHigh: 'VPD au-dessus de 1,5 kPa le jour',
      heatStress: 'Stress thermique pour le personnel',
      heatDanger: 'Danger thermique pour le personnel',
      drainEcHigh: 'EC du drainage au plafond de vidange',
      tempLow: 'Trop froid pour le stade',
      tempHigh: 'Trop chaud pour le stade',
      phOut: 'pH hors de 5,2–6,8',
    },
    alertDetail: (n: string, worst: string) =>
      `${n} mesures, pire valeur ${worst}`,
    days: 'Jour par jour',
    outOfBand: 'VPD hors plage',
  },
  calc: {
    science: 'La science derrière',
    results: 'Résultats',
    how: 'Comment c’est calculé',
    inputs: 'Données',
    table: 'Voir les chiffres',
    dragHint:
      'Faites glisser les poignées rondes, ou sélectionnez-en une et utilisez les flèches du clavier.',
  },

  diagrams: {
    energyAlt: (peak: string, start: string, end: string, share: string) =>
      `Jour d’hiver de calcul : le besoin de chaleur culmine à ${peak} kW ; la cogénération tourne de ${start} h à ${end} h et couvre ${share} %. Les poignées règlent son démarrage et son arrêt.`,
    reuseAlt: (water: string, need: string) =>
      `Chaleur dans l’eau refroidie, ${water} kWh, face au besoin de chaleur du jour, ${need} kWh.`,
    roAlt: (feed: string, product: string, brine: string, salinity: string) =>
      `Osmose d’eau de mer : ${feed} m³ pompés par jour, ${product} m³ de perméat, ${brine} m³ de saumure à ${salinity} g/L. Les poignées règlent la conversion et le stockage.`,
    fertAlt: (recycle: string, ec: string, flush: string) =>
      `Boucle nutritive : ${recycle} % du drainage réutilisé, EC du drainage ${ec} dS/m, vidange dans ${flush} jours. Les poignées règlent la part réutilisée et la limite de sodium.`,
    vpdAlt: (air: string, rh: string, vpd: string, status: string) =>
      `Carte du VPD : l’air à ${air} °C et ${rh} % donne ${vpd} kPa, ${status}. Les poignées règlent la température et l’humidité.`,
    fogAlt: (
      outside: string,
      inside: string,
      rh: string,
      on: string,
      off: string,
    ) =>
      `Le brouillard, un après-midi à ${outside} °C, amène la serre à ${inside} °C et ${rh} %, ${on} s en marche et ${off} s à l’arrêt. Les poignées règlent le plafond d’humidité et la salve.`,
    calendarAlt: (plant: string, harvest: string, end: string, heat: string) =>
      `Calendrier : plantation en semaine ${plant}, première récolte en semaine ${harvest}, fin de culture en semaine ${end}, chauffage dès la semaine ${heat}. Les poignées règlent la semaine de plantation et la fin de culture.`,
    ventsOnly: 'Ouvrants seuls',
    withFog: 'Avec brouillard',
    wetBulb: 'Bulbe humide',
    cap: 'Plafond',
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

  report: {
    title: 'Rapport',
    lead: 'Le projet sur papier : la serre, son climat et chaque résultat enregistré avec ses constats, à imprimer ou garder en PDF.',
    print: 'Imprimer ou enregistrer en PDF',
    tip: 'Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF » pour garder un fichier. Menus et boutons ne sont pas imprimés.',
    kicker: 'Rapport de projet',
    date: 'Date',
    house: 'La serre',
    layout: (
      spans: string,
      width: string,
      length: string,
      gutter: string,
      ridge: string,
    ) =>
      `${spans} chapelles de ${width} m, ${length} m de long, chéneau ${gutter} m, faîtage ${ridge} m`,
    noProject: 'Créez ou ouvrez un projet pour imprimer son rapport.',
    footer:
      'Les résultats sont recalculés à partir des données enregistrées, avec les règles actuelles de SerraCalc ; le Guide en donne les sources.',
  },

  guide: {
    title: 'Guide',
    lead: 'Ce que fait chaque outil, ce qu’il suppose et d’où viennent ses chiffres.',
    tools: [
      {
        id: 'projects',
        title: 'Projets et sauvegardes',
        body: 'Un projet réunit une serre, son climat, sa culture et sa monnaie, et chaque résultat enregistré depuis les outils. Les résultats ne gardent que leurs données, et se rouvrent donc avec les règles actuelles. Les projets restent dans ce navigateur : enregistrez une sauvegarde, ou partagez-la vers Drive, et ouvrez-la sur un autre appareil.',
      },
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
      {
        id: 'report',
        title: 'Rapport',
        body: 'Le projet sur une page imprimable : la serre, son climat et chaque résultat enregistré avec ses chiffres principaux et ses constats. Imprimez-le, ou choisissez « Enregistrer au format PDF » pour l’envoyer.',
      },
      {
        id: 'calendar',
        title: 'Calendrier de culture',
        body: 'Les semaines de plantation, de floraison, de récolte et de vide sanitaire, avec les consignes de climat de chaque stade, et les semaines où tournent le chauffage, le CO₂, l’ombrage et le brouillard, tirées des normales climatiques. Les sites de tomate du désert plantent vers la semaine 36, chauffent dès la semaine 42 environ et finissent après la semaine 29.',
      },
      {
        id: 'vpd',
        title: 'Humidité et VPD',
        body: 'Le déficit de pression de vapeur à partir de la température et de l’humidité (Tetens, comme la FAO-56), le point de rosée et l’eau que l’air peut encore prendre, face à la plage du stade de la culture et de la lumière. La carte montre chaque couple température–humidité, car un même VPD correspond à beaucoup d’entre eux.',
      },
      {
        id: 'fog',
        title: 'Brumisation et stratégie de refroidissement',
        body: 'Le brouillard haute pression dans une serre aérée : la température intérieure par un bilan de chaleur et d’eau, le cycle marche/arrêt qui tient un plafond d’humidité, et l’eau par jour. Le conseiller vérifie l’après-midi de calcul : quand les ouvrants seuls demanderaient plus qu’un toit n’ouvre, il propose l’ombrage avec brouillard ou pads.',
      },
      {
        id: 'science',
        title: 'Science',
        body: 'Chaque phénomène utilisé par les outils, expliqué : ce qui se passe, la formule, ce qu’elle suppose, et comment mesurer chaque donnée, avec quel instrument. Le ⓘ à côté de chaque champ ouvre les mêmes conseils et renvoie ici.',
      },
      {
        id: 'supply',
        title: 'Eau d’irrigation',
        body: 'L’osmose d’eau de mer dimensionnée pour le jour de pointe : alimentation, saumure et sa salinité, énergie, coût et stockage. La fertirrigation avec recyclage du drainage : eau et engrais économisés, EC du drainage, accumulation du sodium et moment de la vidange, et rendement perdu au sel.',
      },
      {
        id: 'site',
        title: 'Site et économie',
        body: 'Les projets qui partagent un nom de site en sont les compartiments ; donnez à chacun sa surface et le site additionne eau, chaleur, production, main-d’œuvre et carbone, vérifie l’osmose et la cogénération partagées, et calcule le coût par kg, la marge et le retour sur investissement.',
      },
      {
        id: 'energy',
        title: 'Pôle énergie',
        body: 'Une journée d’hiver heure par heure : le besoin de chaleur de la serre, une cogénération au gaz qui tourne de jour pour son CO₂, le tampon qui porte sa chaleur dans la nuit et la chaudière pour le reste ; gaz, électricité et coût. Et la chaleur contenue dans l’eau de forage refroidie.',
      },
      {
        id: 'operations',
        title: 'Exploitation',
        body: 'Un cahier des observations, lâchers d’auxiliaires, traitements (classes OMS Ia et Ib refusées), entretiens et récoltes ; la liste d’hygiène du jour ; le planning d’entretien avec ce qui est dû ou en retard ; et un plan chaleur pour le personnel d’après l’indice de chaleur.',
      },
      {
        id: 'data',
        title: 'Données en direct',
        body: 'Importez le CSV d’un enregistreur, ou chargez une semaine d’exemple, et comparez-le à ce qu’attendent les outils : VPD dans sa plage, températures de jour et de nuit, drainage ; VPD et température par heure ; et alertes de risque de maladie, stress thermique, EC du drainage, température et pH.',
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
      'Soussi et al. (2022) : pilotage du climat et refroidissement des serres en régions chaudes et arides.',
      'Shamshiri et al. (2018) : température, humidité et VPD optimaux pour la tomate sous serre.',
      'Ishii et al. : brumisation contre pad & ventilateurs dans une serre en Arizona.',
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
    'fert.flushCl': (v) =>
      `Le chlorure du drainage atteint ${v['cl']} mmol/L en environ ${v['days']} jours : vidangez la boucle à ce moment.`,
    'fert.flushEc': (v) =>
      `Le sel porte l’EC au plafond de ${v['ec']} dS/m en environ ${v['days']} jours : vidangez la boucle à ce moment.`,
    'fert.bleed': (v) =>
      `Rejeter ${v['m3']} m³ de drainage par jour tient la boucle sous ses limites sans vidange : ${v['saved']} m³ de moins rejetés par an qu’en vidangeant au plafond.`,
    'coolYear.range': (v) =>
      `${v['kwh']} kWh/m² par an : dans la fourchette publiée pour les serres méditerranéennes (environ 10 ; ici ${v['pct']} %).`,
    'coolYear.high': (v) =>
      `${v['kwh']} kWh/m² par an, ${v['pct']} % des 10 publiés : vérifiez la puissance des ventilateurs, ombrez plus tôt ou brumisez au lieu des pads.`,
    'coolYear.low': (v) =>
      `${v['kwh']} kWh/m² par an, bien sous les 10 publiés (${v['pct']} %) : site doux ou été sans culture ; vérifiez la température de départ.`,
    'coolYear.fans': (v) =>
      `Des ventilateurs à ${v['w']} W par m³/h sont usés ou freinés par des pads encrassés : un essai et des pads propres réduisent la facture.`,
    'coolYear.airflow': (v) =>
      `${v['q']} m³/h par m² sort des 120 à 150 habituels pour pad et ventilateur.`,
    'coolYear.peakMonth': (v) =>
      `${v['month']} prend ${v['pct']} % de l’électricité de refroidissement de l’année.`,
    'data.vpdBand': (v) =>
      `Le VPD est resté dans sa plage ${v['pct']} % du temps.`,
    'data.dayOk': (v) =>
      `Les jours ont fait ${v['t']} °C en moyenne, dans ${v['min']}–${v['max']} °C.`,
    'data.dayOff': (v) =>
      `Les jours ont fait ${v['t']} °C en moyenne, hors de ${v['min']}–${v['max']} °C.`,
    'data.nightOk': (v) =>
      `Les nuits ont fait ${v['t']} °C en moyenne, dans ${v['min']}–${v['max']} °C.`,
    'data.nightOff': (v) =>
      `Les nuits ont fait ${v['t']} °C en moyenne, hors de ${v['min']}–${v['max']} °C.`,
    'data.drain': (v) =>
      `Le drainage a fait ${v['pct']} % en moyenne pour ${v['plan']} % prévus.`,
    'data.alerts': (v) => `${v['n']} alertes : voir la liste ci-dessous.`,
    'data.noAlerts': (v) => `Aucune alerte (${v['n']}).`,
    'ops.bannedSpray': (v) =>
      `Les produits de classe OMS ${v['cls']} sont interdits : choisissez un autre produit.`,
    'heat.none': (v) =>
      `Indice de chaleur ${v['hi']} °C : pas de risque (${v['rest']} min de repos, ${v['water']} L par heure).`,
    'heat.caution': (v) =>
      `Indice de chaleur ${v['hi']} °C : prudence. Repos ${v['rest']} min par heure, boire ${v['water']} L par heure.`,
    'heat.extremeCaution': (v) =>
      `Indice de chaleur ${v['hi']} °C : grande prudence. Repos ${v['rest']} min par heure, boire ${v['water']} L par heure.`,
    'heat.danger': (v) =>
      `Indice de chaleur ${v['hi']} °C : danger. Repos ${v['rest']} min par heure, boire ${v['water']} L par heure, pas de travaux lourds.`,
    'heat.extremeDanger': (v) =>
      `Indice de chaleur ${v['hi']} °C : danger extrême. Arrêter le travail dedans (${v['rest']} min de repos, ${v['water']} L par heure).`,
    'energy.share': (v) =>
      `La cogénération couvre ${v['pct']} % de la chaleur du jour ; la chaudière ajoute ${v['boiler']} MWh.`,
    'energy.dump': (v) =>
      `${v['mwh']} MWh de chaleur de cogénération sont perdus : un tampon plus grand ou une marche plus courte les garderait.`,
    'energy.buffer': (v) =>
      `Le tampon garde ${v['mwh']} MWh pour porter la chaleur du jour dans la nuit.`,
    'energy.co2Enough': (v) =>
      `Les fumées de la cogénération donnent ${v['kg']} kg de CO₂, assez pour les ${v['need']} kg absorbés par la culture.`,
    'energy.co2Short': (v) =>
      `Les fumées de la cogénération donnent ${v['kg']} kg de CO₂, moins que les ${v['need']} kg absorbés : ajoutez du CO₂ liquide ou tournez plus longtemps.`,
    'energy.ventsShut': () =>
      'Le CO₂ de cogénération ne paie qu’ouvrants presque fermés (au-delà d’environ 5 % on ne le tient pas) : prévoyez-le pour les jours d’hiver.',
    'reuse.heat': (v) =>
      `Chaque m³ refroidi contient ${v['kwh']} kWh : ${v['mwh']} MWh par jour à récupérer.`,
    'reuse.cover': (v) =>
      `Cela couvre ${v['pct']} % du besoin de chaleur du jour d’hiver.`,
    'reuse.heatPump': () =>
      'Entre 15 et 40 °C, cette chaleur demande une pompe à chaleur ou une boucle basse température.',
    'econ.margin': (v) => `Une marge de ${v['pct']} % du chiffre d’affaires.`,
    'econ.loss': (v) =>
      `Les coûts dépassent le chiffre d’affaires (marge ${v['pct']} %).`,
    'econ.biggest.labour': (v) =>
      `La main-d’œuvre est le premier coût : ${v['pct']} %.`,
    'econ.biggest.energy': (v) =>
      `L’énergie est le premier coût : ${v['pct']} %.`,
    'econ.biggest.water': (v) => `L’eau est le premier coût : ${v['pct']} %.`,
    'econ.biggest.inputs': (v) =>
      `Engrais et soins sont le premier coût : ${v['pct']} %.`,
    'econ.biggest.other': (v) =>
      `Conditionnement et frais généraux sont le premier coût : ${v['pct']} %.`,
    'econ.payback': (v) =>
      `La construction est remboursée en environ ${v['years']} ans.`,
    'econ.prices': () =>
      'Les prix sont des exemples (la tomate exportée valait 1,24–1,94 EUR/kg de janvier à avril 2016) : saisissez les vôtres.',
    'ro.balance': (v) =>
      `${v['feed']} m³ d’eau de mer par jour donnent le perméat et ${v['brine']} m³ de saumure à ${v['salinity']} g/L.`,
    'ro.recoveryHigh': (v) =>
      `Conversion de ${v['pct']} % : au-delà de 50 % la saumure entartre les membranes ; vérifiez la limite du fournisseur.`,
    'ro.short': (v) =>
      `L’usine ne couvre que ${v['pct']} % du besoin : il manque ${v['m3']} m³ par jour. Ajoutez de la capacité ou du stockage.`,
    'ro.headroom': (v) =>
      `L’usine a ${v['pct']} % de marge sur le jour de pointe.`,
    'ro.lowSec': () =>
      'Sous 2,5 kWh/m³, c’est moins que ce qu’atteint l’osmose d’eau de mer ; vérifiez le chiffre.',
    'ro.highSec': () =>
      'Au-dessus de 4,5 kWh/m³ : un récupérateur d’énergie le ramènerait à 3–4.',
    'ro.product': (v) =>
      `Le perméat garde environ ${v['mg']} mg/L de sel (EC ${v['ec']} dS/m) ; son sodium fixe la durée de la boucle nutritive.`,
    'ro.brine': () =>
      'La saumure retourne à la mer par un diffuseur, sous autorisation de rejet ; prévoyez l’émissaire avec l’administration.',
    'fert.water': (v) =>
      `${v['reused']} m³ de drainage réutilisés par jour : ${v['pct']} % de l’eau apportée.`,
    'fert.drainHigh': (v) =>
      `EC du drainage ${v['ec']} dS/m, au plafond de ${v['max']} ou au-dessus : drainez davantage ou vidangez.`,
    'fert.yield': (v) =>
      `Une EC racinaire de ${v['ec']} dS/m coûte environ ${v['pct']} % du rendement (indicatif).`,
    'fert.flush': (v) =>
      `Le sodium du drainage atteint ${v['na']} mmol/L en environ ${v['days']} jours : vidangez la boucle à ce moment.`,
    'fert.levels': (v) =>
      `Dans le drainage, le sodium se stabilise à ${v['na']} et le chlorure à ${v['cl']} mmol/L, sous les limites : pas de vidange nécessaire.`,
    'fert.saltySource': () =>
      'Une eau douce à plus de 3 mmol/L de sodium remplit vite la boucle de sel : mélangez avec de l’eau osmosée ou rejetez plus de drainage.',
    'fert.lowDrain': () =>
      'Moins de 20 % de drainage avec une eau salée : le sel s’accumule dans les pains.',
    'fert.disinfect': () =>
      'Désinfectez le drainage réutilisé (UV, chaleur ou filtre à sable lent) avant de le renvoyer à la culture.',
    'vpd.tooWet': (v) =>
      `VPD ${v['vpd']} kPa : sous ${v['min']} kPa pour ce stade, l’air est trop humide.`,
    'vpd.good': (v) =>
      `VPD ${v['vpd']} kPa : dans la plage ${v['min']}–${v['max']} kPa de ce stade.`,
    'vpd.tooDry': (v) =>
      `VPD ${v['vpd']} kPa : au-dessus de ${v['max']} kPa pour ce stade, l’air est trop sec.`,
    'vpd.disease': () =>
      'Sous 0,3 kPa : botrytis, mildiou et croissance molle.',
    'vpd.wilting': () =>
      'Au-dessus de 1,5 kPa la culture flétrit : ombrer et humidifier.',
    'vpd.arid': () =>
      '3 kPa ou plus : air du désert, la croissance s’arrête. Brouillard ou pads, et ombrage.',
    'vpd.cold': (v) =>
      `Sous ${v['min']} °C pour ce stade : chauffer avant d’aérer.`,
    'vpd.hot': (v) =>
      `Au-dessus de ${v['max']} °C pour ce stade : ombrer et refroidir.`,
    'vpd.outsideWetter': () =>
      'L’air extérieur contient plus d’eau que l’air intérieur : aérer ne séchera pas la serre, chauffer oui.',
    'vpd.samePairs': (v) =>
      `Un même VPD correspond à beaucoup de couples : ${v['vpd']} kPa demande un air plus sec à 15 °C qu’à 35 °C, lisez donc la température et l’humidité ensemble.`,
    'fog.cooling': (v) =>
      `Le brouillard amène la serre à ${v['inside']} °C, ${v['drop']} K sous l’extérieur, à ${v['rh']} % d’humidité.`,
    'fog.tooHumid': () =>
      'La serre dépasse le plafond d’humidité sans brouillard : brumiser ne ferait que mouiller la culture.',
    'fog.moreNozzles': () =>
      'Les buses tournent en continu sous le plafond : plus de buses refroidiraient davantage.',
    'fog.cycle': (v) =>
      `${v['on']} s en marche et ${v['off']} s à l’arrêt tiennent l’air près de ${v['rh']} % (60 s en marche, 180 s à l’arrêt est un départ courant).`,
    'fog.lowPressure': () =>
      'Sous 40 bar les gouttelettes sont trop grosses pour s’évaporer dans l’air : elles mouillent les feuilles.',
    'fog.droplets': () =>
      'La haute pression donne des gouttelettes de 10–30 µm qui s’évaporent avant de tomber.',
    'fog.trimVents': () =>
      'Des ouvrants grands ouverts emportent le brouillard : les réduire à 5–15 % du sol pendant la brumisation.',
    'fog.waterQuality': () =>
      'Utilisez de l’eau dessalée ou adoucie : le sel bouche les buses et tache les fruits.',
    'advice.notBuildable': (v) =>
      `${v['pct']} % du sol en ouvrants et ${v['flow']} millions de m³/h d’air : plus qu’un toit n’ouvre (environ ${v['limit']} % au plus).`,
    'advice.vents': () => 'Les ouvrants suffisent pour cet après-midi.',
    'advice.ventsAndShade': (v) =>
      `Avec ${v['shade']} % d’ombrage les ouvrants demandent ${v['pct']} % du sol : ombrer d’abord.`,
    'advice.shadeAndFog': (v) =>
      `${v['shade']} % d’ombrage et du brouillard tiennent la serre vers ${v['inside']} °C, ouvrants réduits. Le brouillard convient aux serres longues et grandes.`,
    'advice.shadeAndPad': (v) =>
      `${v['shade']} % d’ombrage et des pads : l’air sort d’un pad mouillé vers ${v['pad']} °C. Avec ${v['length']} m, la serre est assez courte pour des pads.`,
    'advice.humid': () =>
      'Air humide dehors : l’évaporation refroidit peu. Ombrer, et refroidir la nuit.',
    'calendar.season': (v) =>
      `Plantée en semaine ${v['plant']}, la culture finit en semaine ${v['end']} : ${v['weeks']} semaines en serre.`,
    'calendar.harvest': (v) =>
      `Cueillette dès la semaine ${v['first']}, pendant ${v['weeks']} semaines.`,
    'calendar.heating': (v) =>
      `Chauffage dès la semaine ${v['from']}, ${v['weeks']} semaines dans l’année.`,
    'calendar.co2': (v) =>
      `Le CO₂ rapporte ${v['weeks']} semaines, quand la serre reste fermée.`,
    'calendar.fog': (v) =>
      `Brouillard ou pads pendant ${v['weeks']} semaines d’après-midi chauds.`,
    'calendar.shade': (v) =>
      `Ombrage pendant ${v['weeks']} semaines de fort soleil.`,
    'calendar.shortCleanOut': (v) =>
      `Seulement ${v['weeks']} semaines entre deux cultures : peu de temps pour nettoyer et désinfecter.`,
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
