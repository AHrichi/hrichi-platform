import type { NoteWriter, SerraCopy } from './copy.en';

export const IT: SerraCopy = {
  app: {
    week: 'Settimana',
    weekHint: 'La settimana in corso: apre il calendario colturale',
    railNote:
      'Pensato per i siti desertici: sole forte, notti fredde, acqua scarsa.',
    name: 'SerraCalc',
    tagline: 'Calore, acqua e clima della serra',
    activeProject: 'Progetto attivo',
    offline: 'Funziona offline',
    offlineHint:
      'I progetti sono salvati su questo dispositivo; non serve la connessione.',
    sunlight: 'Pieno sole',
    sunlightHint: 'Contrasto alto per leggere lo schermo all’aperto',
    dark: 'Scuro',
    darkHint: 'Tema scuro',
    language: 'Lingua',
    sections: 'Sezioni di SerraCalc',
    planningAid:
      'Uno strumento di progettazione: verifica i risultati con un tecnico abilitato e con i dati dei fornitori prima di costruire.',
  },
  nav: {
    operations: 'Gestione',
    data: 'Dati in diretta',
    site: 'Sito',
    energy: 'Energia',
    supply: 'Acqua irrigua',
    science: 'Scienza',
    calendar: 'Calendario colturale',
    projects: 'Progetti',
    greenhouse: 'Serra',
    heating: 'Riscaldamento',
    cooling: 'Raffrescamento',
    water: 'Acqua',
    climate: 'Clima',
    guide: 'Guida',
    air: 'Luce e aria',
    report: 'Relazione',
    more: 'Altro',
  },
  navGroups: {
    operate: 'Gestire',
    plan: 'Pianificare',
    climate: 'Controllo del clima',
    water: 'Acqua',
    reference: 'Riferimenti',
  },
  common: {
    close: 'Chiudi',
    cancel: 'Annulla',
    edit: 'Modifica',
    delete: 'Elimina',
    rename: 'Rinomina',
    save: 'Salva',
    open: 'Apri e modifica',
    yes: 'Sì',
    no: 'No',
    next: '→',
    none: '—',
  },
  months: [
    'gennaio',
    'febbraio',
    'marzo',
    'aprile',
    'maggio',
    'giugno',
    'luglio',
    'agosto',
    'settembre',
    'ottobre',
    'novembre',
    'dicembre',
  ],
  monthsShort: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'],

  shapes: {
    gable: 'Multicampata, tetti a falde',
    venlo: 'Serra Venlo in vetro',
    tunnel: 'Tunnel (tetto ad arco)',
  },
  covers: {
    glass_single: 'Vetro singolo',
    glass_double: 'Vetro doppio',
    pe_single: 'Film singolo (PE)',
    pe_double: 'Doppio film gonfiato (PE)',
    pc_twin: 'Policarbonato alveolare, doppia parete',
    pc_triple: 'Policarbonato alveolare, tripla parete',
    acrylic_double: 'Acrilico, doppio',
  },
  screens: {
    none: 'Nessuno schermo',
    clear: 'Schermo energetico trasparente',
    shade_energy: 'Schermo ombreggiante ed energetico',
    aluminised: 'Schermo alluminizzato',
  },
  crops: {
    tomato: 'Pomodoro',
    cucumber: 'Cetriolo',
    pepper: 'Peperone',
    melon: 'Melone',
    strawberry: 'Fragola',
    lettuce: 'Lattuga',
    rose: 'Rosa',
  },
  fuels: {
    natural_gas: 'Gas naturale',
    lpg: 'GPL (propano)',
    fuel_oil: 'Gasolio da riscaldamento',
    heat_pump: 'Pompa di calore (elettricità)',
    geothermal: 'Acqua geotermica',
    biomass: 'Biomassa (pellet, sansa)',
  },
  fuelUnits: { m3: 'm³', kg: 'kg', L: 'L', kWh: 'kWh' },
  pipes: {
    steel_51: 'Tubo in acciaio (binario), 51 mm',
    steel_33: 'Tubo in acciaio, 33,7 mm',
    pe_40: 'Tubo in plastica (PE/PP), 40 mm',
    pe_32: 'Tubo in plastica (PE/PP), 32 mm',
    pe_25: 'Tubo in plastica (PE/PP), 25 mm',
  },
  currencies: {
    TND: 'Dinaro tunisino',
    EUR: 'Euro',
    USD: 'Dollaro USA',
  },

  fields: {
    lossCoefficientWK: 'Dispersione per kelvin',
    outsideMinC: 'Fuori, minima notturna',
    outsideMaxC: 'Fuori, massima pomeridiana',
    chpElectricKw: 'Potenza elettrica',
    chpThermalKw: 'Potenza termica',
    chpElectricPct: 'Rendimento elettrico',
    chpStartHour: 'Avvio della cogenerazione',
    chpEndHour: 'Arresto della cogenerazione',
    bufferM3: 'Serbatoio di accumulo',
    bufferDeltaK: 'Salto termico dell’accumulo',
    boilerEfficiencyPct: 'Rendimento della caldaia',
    co2NeedKgH: 'CO₂ assorbita dalla coltura',
    powerPrice: 'Prezzo dell’elettricità venduta',
    waterM3Day: 'Acqua raffreddata al giorno',
    inC: 'Acqua in ingresso',
    outC: 'Acqua in uscita',
    heatDemandKwhDay: 'Calore necessario quel giorno',
    areaHa: 'Superficie',
    yieldTHa: 'Resa',
    pricePerKg: 'Prezzo ricevuto',
    labourDaysHa: 'Manodopera',
    wagePerDay: 'Paga giornaliera',
    heatMwhYear: 'Calore all’anno',
    heatPricePerMwh: 'Prezzo del calore',
    waterM3Year: 'Acqua all’anno',
    waterPricePerM3: 'Prezzo dell’acqua',
    inputsPerM2: 'Concimi e difesa',
    otherPerM2: 'Confezionamento e spese generali',
    capexPerM2: 'Costo di costruzione',
    demandM3Day: 'Acqua necessaria, giorno di punta',
    lossesPct: 'Perdite',
    feedSalinityGL: 'Salinità dell’acqua di mare',
    recoveryPct: 'Recupero',
    rejectionPct: 'Reiezione salina',
    secKwhM3: 'Energia specifica',
    storageDays: 'Accumulo',
    capacityM3Day: 'Capacità installata',
    availabilityPct: 'Tempo di funzionamento',
    appliedM3Day: 'Acqua data al giorno',
    recyclePct: 'Drenaggio riutilizzato',
    sourceEcDsM: 'EC dell’acqua dolce',
    sourceNaMmolL: 'Sodio nell’acqua dolce',
    targetEcDsM: 'EC al gocciolatore',
    uptakeEcDsM: 'EC assorbita dalla coltura',
    flushEcDsM: 'Scarico sopra EC',
    naLimitMmolL: 'Scarico sopra il sodio',
    systemM3: 'Acqua nel circuito',
    dilution: 'Diluizione delle soluzioni madre',
    stockTankM3: 'Ogni serbatoio di soluzione madre',
    yieldSlopePct: 'Resa persa per dS/m',
    yieldThresholdEc: 'Le perdite iniziano sopra',
    rhPct: 'Umidità relativa',
    ventPct: 'Aperture aperte',
    nozzlesPer100M2: 'Ugelli',
    nozzleLh: 'Portata per ugello',
    pressureBar: 'Pressione della pompa',
    onS: 'Getto di nebbia',
    maxRhPct: 'Tetto di umidità',
    plantingWeek: 'Settimana di trapianto',
    nurseryWeeks: 'Settimane in vivaio',
    vegetativeWeeks: 'Dal trapianto ai primi fiori',
    floweringWeeks: 'Dai fiori alla prima raccolta',
    cropWeeks: 'Dal trapianto a fine coltura',
    ventilateAboveC: 'Aperture aperte sopra',
    coolAboveC: 'Nebbia sopra (fuori)',
    spans: 'Campate',
    spanWidthM: 'Larghezza della campata',
    lengthM: 'Lunghezza',
    gutterHeightM: 'Altezza in gronda',
    ridgeHeightM: 'Altezza al colmo',
    floorAreaM2: 'Superficie coperta',
    coverAreaM2: 'Superficie della copertura',
    volumeM3: 'Volume d’aria',
    perimeterM: 'Perimetro',
    uValue: 'Trasmittanza U della copertura',
    airChangesPerHour: 'Infiltrazioni d’aria',
    screenSavingPct: 'Risparmio dello schermo',
    insideC: 'Interno, di notte',
    outsideDesignC: 'Notte più fredda all’esterno',
    marginPct: 'Margine di sicurezza',
    nightSetC: 'Temperatura notturna',
    daySetC: 'Temperatura diurna',
    transmissionPct: 'Trasmissione della luce',
    solarGainPct: 'Sole che scalda l’aria',
    efficiencyPct: 'Rendimento (COP × 100)',
    fuelPrice: 'Prezzo per unità',
    heatDemandKw: 'Calore da fornire',
    supplyC: 'Acqua in mandata',
    returnC: 'Acqua di ritorno',
    airC: 'Temperatura dell’aria',
    loopLengthM: 'Lunghezza di un circuito',
    pumpHeadM: 'Prevalenza della pompa',
    pumpEfficiencyPct: 'Rendimento della pompa',
    annualHeatKwh: 'Calore nell’anno',
    radiationWm2: 'Radiazione solare esterna',
    shadingPct: 'Ombreggiamento',
    evapotranspirationPct: 'Sole usato dalla coltura per traspirare',
    outsideC: 'Temperatura esterna',
    maxRiseK: 'Aumento ammesso sull’esterno',
    windMs: 'Velocità del vento',
    ventOpeningM: 'Apertura delle finestre',
    fanCapacityM3h: 'Aria per ventilatore',
    outsideRhPct: 'Umidità esterna',
    padEfficiencyPct: 'Efficienza del pannello',
    riseK: 'Aumento dal pannello ai ventilatori',
    padFaceVelocityMs: 'Velocità dell’aria nel pannello',
    padHeightM: 'Altezza del pannello',
    padToFanM: 'Dal pannello ai ventilatori',
    hoursPerDay: 'Ore al giorno',
    cropAreaPct: 'Superficie coltivata',
    transpirationPct: 'Sole trasformato in traspirazione',
    canopyPct: 'Copertura della chioma',
    drainPct: 'Drenaggio / perdite',
    plantsPerM2: 'Piante per m²',
    emittersPerPlant: 'Gocciolatori per pianta',
    emitterLh: 'Portata del gocciolatore',
    shotMl: 'Turno per gocciolatore',
    pumpM3h: 'Portata della pompa',
    catchmentM2: 'Tetto che scarica nella vasca',
    runoffPct: 'Deflusso che arriva alla vasca',
    basinM3: 'Volume della vasca',
    targetDli: 'Luce obiettivo (DLI)',
    maxDli: 'Ombreggiare oltre (DLI)',
    lampHours: 'Ore di lampade al giorno',
    efficacyUmolJ: 'Efficienza della lampada',
    fixtureW: 'Potenza della lampada',
    electricityPrice: 'Prezzo dell’elettricità',
    co2KgPerKwh: 'CO₂ della rete',
    targetPpm: 'Obiettivo di CO₂',
    outsidePpm: 'CO₂ esterna',
    uptakeGm2h: 'Assorbimento della coltura',
    daysPerYear: 'Giorni all’anno',
    burnerEfficiencyPct: 'Rendimento del bruciatore',
    co2Price: 'Prezzo della CO₂ liquida',
    gasPrice: 'Prezzo del gas',
    insideRhPct: 'Umidità interna massima',
    transpirationGm2h: 'Traspirazione notturna',
    nightHours: 'Durata della notte',
  } as Record<string, string>,
  hints: {
    chpElectricKw: 'Siti nel deserto: circa 10 MW per 50 ha (20 W/m²)',
    chpStartHour: 'Di giorno, quando la CO₂ si usa con le aperture chiuse',
    bufferM3: 'Tipico 50–100 m³ per ettaro',
    bufferDeltaK: '90 → 50 °C: 40 K',
    inC: 'I pozzi profondi del sud danno acqua verso 40 °C',
    yieldTHa: 'Pomodoro in serra di vetro nel deserto: circa 250 t/ha',
    labourDaysHa: 'Pomodoro protetto: circa 1.000 giornate/ha (studio 2018)',
    pricePerKg:
      'Il pomodoro esportato valeva 1,24–1,94 EUR/kg, gennaio–aprile 2016',
    capexPerM2: 'Il tuo preventivo; questo è un esempio',
    feedSalinityGL: 'Il mare al largo di Gabès: 39–40 g/L',
    recoveryPct:
      'Osmosi di acqua di mare: 40–50 %; oltre la salamoia sale in fretta',
    secKwhM3: 'Tipico 3–4 con recupero energetico; da confermare col fornitore',
    storageDays: 'Da uno a tre giorni coprono un fermo per lavaggio',
    recyclePct: 'I siti del deserto riutilizzano il 30–50 % dell’acqua',
    targetEcDsM: 'Pomodoro, soluzione di reintegro: circa 2,7',
    flushEcDsM: 'Un tetto comune: 4,5',
    naLimitMmolL: 'Pomodoro: scaricare verso 8 mmol/L',
    systemM3: 'Lastre, tubi e serbatoi: circa 4 L per m²',
    yieldSlopePct: 'Indicativo: 7,3 % da una prova; metti il tuo',
    ventPct: 'Riduci le aperture durante la nebulizzazione: 5–15 % del suolo',
    nozzlesPer100M2: '27 ugelli da 5,4 L/h danno circa 24 g/m² al minuto',
    pressureBar: 'Alta pressione, 40–70 bar, per gocce di 10–30 µm',
    onS: 'La pausa dopo è calcolata per tenere il tetto',
    maxRhPct: 'Tenere il 65–75 % ha risparmiato circa il 21 % dell’acqua',
    plantingWeek:
      'I siti di pomodoro nel deserto trapiantano verso la settimana 36',
    nurseryWeeks: 'Piantine di pomodoro: circa 7 settimane',
    floweringWeeks: 'Pomodoro: circa 8 settimane',
    cropWeeks: 'Dalla settimana 36 alla 29: 46 settimane',
    coolAboveC: 'I pomeriggi più caldi richiedono nebbia o pannelli',
    spanWidthM: 'Tipiche: 8, 9,6 o 12,8 m',
    gutterHeightM: 'Le serre più alte tamponano meglio calore e umidità',
    uValue: 'Preso dalla copertura; il fornitore può indicarne un altro',
    airChangesPerHour:
      'Ricambi d’aria all’ora: 0,5 film ben teso, 2 vetro vecchio',
    screenSavingPct:
      'Trasparente 25 %, ombreggiante/energetico 35 %, alluminizzato 45 %',
    outsideDesignC: 'Una notte fredda che torna quasi ogni inverno',
    marginPct: 'Per vento, cielo sereno e perdite delle tubazioni',
    transmissionPct:
      'Attraverso copertura e struttura; un film polveroso perde il 10–20 %',
    solarGainPct: 'Circa metà della luce entrata scalda l’aria',
    efficiencyPct: 'Caldaia 85–95 %; pompa di calore COP 3 = 300',
    fuelPrice: 'La tua tariffa, nella valuta del progetto',
    heatDemandKw: 'Parte dal carico di punta; il pulsante sopra lo riprende',
    supplyC: 'I pozzi geotermici qui danno 60–75 °C',
    loopLengthM: 'Andata e ritorno lungo la serra',
    annualHeatKwh:
      'Per il volume d’acqua; il pulsante sopra riprende quello dell’anno',
    radiationWm2: 'A mezzogiorno d’estate, sul piano orizzontale',
    evapotranspirationPct: 'Circa 50 % con coltura piena, 0 con la serra vuota',
    maxRiseK: 'Di solito 3–5 K',
    ventOpeningM: 'Altezza della finestra aperta',
    fanCapacityM3h: 'A circa 30 Pa, dalla curva del ventilatore',
    padEfficiencyPct: '75–85 % per un pannello pulito',
    padFaceVelocityMs: '1,25 m/s per pannelli da 100 mm, 1,75 per 150 mm',
    padToFanM: 'Restare sotto i 40–50 m',
    transpirationPct: 'Chioma piena: circa 65 %',
    canopyPct: 'Piante giovani 30 %, coltura piena 100 %',
    drainPct: 'Fuori suolo 20–35 %; di più con acqua salmastra',
    shotMl: 'Di solito 100–200 mL',
    runoffPct: 'Vetro 85 %, film 80 %, dopo la prima pioggia',
    targetDli: 'Pomodoro 20–30, lattuga 12–17, fragola 15–20',
    maxDli: 'Ombreggiare oltre; la lattuga brucia sopra circa 17',
    lampHours: 'Di solito 12–18 h',
    efficacyUmolJ: 'LED 2,5–3,2, lampade al sodio circa 1,8',
    co2KgPerKwh: 'Rete tunisina: circa 0,47',
    targetPpm: 'Il grosso del guadagno arriva entro 800–1000 ppm',
    uptakeGm2h: 'Pieno sole, chioma piena: 2–4',
    insideRhPct: 'Oltre l’85–90 % di notte favorisce la botrite',
    transpirationGm2h: 'Pomodoro di notte: circa 10–20',
  } as Record<string, string>,

  context: {
    from: 'Da',
    defaultHouse: 'Serra di esempio, Monastir, pomodoro',
    reset: 'Riprendi dal progetto',
    house: 'La serra',
    sun: 'Sole e serra',
    demand: 'Il fabbisogno della coltura',
  },

  projects: {
    title: 'Progetti',
    lead: 'Ogni serra: struttura, clima e coltura, e ogni risultato salvato dagli strumenti.',
    new: 'Nuovo progetto',
    newTitle: 'Nuovo progetto',
    editTitle: 'Modifica progetto',
    create: 'Crea progetto',
    saveChanges: 'Salva le modifiche',
    loading: 'Caricamento dei progetti…',
    switch: 'Progetto',
    name: 'Nome del progetto',
    site: 'Luogo',
    climate: 'Clima',
    crop: 'Coltura',
    currency: 'Valuta',
    shape: 'Tipo di serra',
    cover: 'Copertura',
    screen: 'Schermo',
    insulated: 'Zoccolo isolato',
    required: 'Dai un nome al progetto.',
    emptyTitle: 'Ancora nessun progetto',
    emptyLead:
      'Crea un progetto per la tua serra, o carica gli esempi per provare prima gli strumenti. I calcolatori funzionano anche senza; per salvare i risultati serve un progetto.',
    samples: 'Carica i progetti di esempio',
    deleteConfirm: (title: string) =>
      `Eliminare «${title}» e i suoi risultati salvati? Non si può annullare.`,
    floor: 'Superficie',
    saved: 'Risultati salvati',
    savedEmpty:
      'Ancora niente di salvato. Ogni calcolatore ha un pulsante Salva in fondo.',
    renameTitle: 'Rinomina il risultato',
    renameLabel: 'Nome',
    deleteResult: (label: string) => `Eliminare «${label}»?`,
  },
  kinds: {
    energy: 'Centrale energetica (cogenerazione)',
    heatReuse: 'Calore dell’acqua raffreddata',
    economics: 'Economia',
    ro: 'Osmosi inversa di acqua di mare',
    fertigation: 'Fertirrigazione e drenaggio',
    vpd: 'Umidità e VPD',
    fog: 'Nebulizzazione',
    calendar: 'Calendario colturale',
    heatPeak: 'Carico termico di punta',
    heatYear: 'Riscaldamento nell’anno',
    hotWater: 'Tubi ad acqua calda',
    ventilation: 'Ventilazione',
    padFan: 'Pannelli e ventilatori',
    cropWater: 'Acqua per la coltura',
    rainwater: 'Acqua piovana',
    light: 'Illuminazione e ombreggiamento',
    co2: 'Concimazione carbonica',
    humidity: 'Umidità notturna',
  },

  greenhouse: {
    title: 'Serra',
    lead: 'La serra da cui parte ogni calcolatore: superficie, copertura e volume d’aria.',
    sectionAlt: (spans: string, width: string, gutter: string, ridge: string) =>
      `Sezione: ${spans} campate da ${width} m, gronda ${gutter} m, colmo ${ridge} m`,
    saveToProject: 'Salva nel progetto',
    savedToProject: 'Salvata nel progetto.',
    noProject: 'Non salvata: crea un progetto per conservare questa serra.',
    floor: 'Superficie coperta',
    cover: 'Superficie della copertura',
    volume: 'Volume d’aria',
    meanHeight: 'Altezza media',
    coverRatio: 'Copertura / superficie',
    perimeter: 'Perimetro',
    roof: 'Tetto',
    sideWalls: 'Pareti laterali',
    gables: 'Testate',
    width: 'Larghezza',
    formulas: {
      floor: 'Superficie = campate × larghezza × lunghezza',
      roof: 'Tetto: ogni falda √((l/2)² + h²), o mezza ellisse per un arco',
      ends: 'Testate: pareti fino alla gronda, più un triangolo (o mezza ellisse) per tetto',
      volume: 'Volume = superficie × gronda + sezione del tetto × lunghezza',
    },
  },

  heating: {
    title: 'Riscaldamento',
    lead: 'Dimensiona l’impianto di riscaldamento, conta un anno di combustibile e disponi i tubi ad acqua calda per l’acqua geotermica o una caldaia.',
    tabs: {
      peak: 'Carico di punta',
      year: 'Nell’anno',
      pipes: 'Tubi ad acqua calda',
    },
    cover: 'Copertura',
    screen: 'Schermo',
    insulated: 'Zoccolo isolato',
    screenClosed: 'Schermo chiuso nella notte più fredda',
    designNight: (place: string, t: string) =>
      `Notte di progetto a ${place}: ${t} °C`,
    climate: 'Clima',
    fuel: 'Combustibile',
    pipe: 'Tubo',
    designKw: 'Impianto di riscaldamento',
    totalKw: 'Calore disperso',
    perM2: 'Per m² di superficie',
    deltaT: 'Interno − esterno',
    breakdown: 'Dove va il calore',
    parts: {
      transmission: 'Attraverso la copertura',
      infiltration: 'Infiltrazioni d’aria',
      perimeter: 'Zoccolo',
    },
    annual: 'Calore all’anno',
    perM2Year: 'Per m² all’anno',
    fuelYear: 'Combustibile all’anno',
    cost: 'Costo del combustibile all’anno',
    co2: 'CO₂ all’anno',
    monthly: 'Calore di ogni mese, notte e giorno',
    night: 'Notte',
    day: 'Giorno',
    monthlyAlt: (peak: string, total: string) =>
      `Grafico a barre del calore per mese; picco a ${peak}; ${total} MWh nell’anno`,
    flow: 'Portata d’acqua',
    perMetre: 'Calore per metro di tubo',
    pipeLength: 'Tubo da posare',
    perM2Pipe: 'Tubo per m² di superficie',
    loops: 'Circuiti',
    velocity: 'Velocità in un circuito',
    pump: 'Potenza della pompa',
    waterYear: 'Acqua all’anno',
    usePeak: (kw: string) => `Usa il carico di punta (${kw} kW)`,
    useYear: (kwh: string) => `Usa l’anno (${kwh} kWh)`,
    formulas: {
      transmission: 'Copertura: U × A × ΔT',
      infiltration: 'Infiltrazioni: 0,335 × N × V × ΔT',
      perimeter: 'Zoccolo: F × perimetro × ΔT',
      design: 'Impianto = totale × (1 + margine)',
      night:
        'Notte (gennaio): dispersioni × (consegna − media notturna) × ore × giorni',
      day: 'Giorno (gennaio): dispersioni × (consegna − media diurna) × ore − sole',
      fuel: 'Combustibile = calore / (energia per unità × rendimento)',
      flow: 'Portata = Q / (1,163 × ΔT acqua)',
      output: 'Per metro = π × D × (h_conv + h_rad) × ΔT',
      length: 'Lunghezza = Q / resa per metro',
      pump: 'Pompa = ρ × g × portata × prevalenza / rendimento',
    },
  },

  cooling: {
    title: 'Raffrescamento',
    lead: 'Quanta aria deve muovere la serra in una giornata di sole, le finestre o i ventilatori che la muovono, e il raffrescamento con pannelli evaporativi per il caldo secco.',
    tabs: {
      ventilation: 'Ventilazione',
      padFan: 'Pannelli e ventilatori',
      fog: 'Nebulizzazione',
    },
    fogInside: 'Dentro con la nebbia',
    ventOnly: 'Solo aperture',
    fogRh: 'Umidità dentro',
    fogRate: 'Nebbia in funzione',
    fogMean: 'In media',
    fogCycle: 'Ciclo acceso / spento',
    fogOn: 'del tempo acceso',
    nozzles: 'Ugelli',
    padCompare: 'I pannelli userebbero',
    solar: 'Sole che scalda l’aria',
    flow: 'Aria da muovere',
    ach: 'Ricambi d’aria',
    perM2: 'Per m² di superficie',
    vents: 'Apertura delle finestre (naturale)',
    ventShare: 'della superficie',
    fans: 'Ventilatori (meccanica)',
    wetBulb: 'Bulbo umido esterno',
    padOutlet: 'Aria in uscita dal pannello',
    exhaust: 'Aria ai ventilatori',
    padArea: 'Superficie del pannello',
    padLength: 'Lunghezza della parete di pannelli',
    evaporation: 'Acqua evaporata',
    waterDay: 'Acqua al giorno',
    perHour: 'all’ora',
    formulas: {
      fogRate: 'Nebbia = ugelli × L/h / suolo',
      fogBalance:
        'Dentro = T_est + (sole − λ × nebbia) / (ρ × cp × aria + U × A)',
      fogCycle: 'Ciclo: la quota di nebbia che l’aria assorbe sotto il tetto',
      fogWater: 'Acqua = q × A × t / 10⁶',
      solar: 'Sole = τ × (1 − ombra) × G × superficie × (1 − ET)',
      conduction: 'Attraverso la copertura: U × A × ΔT',
      flow: 'Aria = (sole − copertura) / (ρ × cp × ΔT)',
      vents:
        'Finestre (Boulard & Baille): G = Cd × A/2 × √(2g × ΔT/T × h/4 + Cw × u²)',
      padOutlet: 'Pannello: T − η × (T − T_umido)',
      padFlow: 'Aria = (sole + copertura) / (ρ × cp × aumento)',
      pad: 'Superficie del pannello = aria / velocità frontale',
      water: 'Acqua = ρ × aria × cp × (T − T_pannello) / λ',
    },
  },

  water: {
    title: 'Acqua',
    lead: 'Quanto beve la coltura mese per mese, l’impianto a goccia che la distribuisce, e quanto ne può coprire la pioggia del tetto.',
    tabs: { crop: 'Acqua per la coltura', rain: 'Acqua piovana' },
    climate: 'Clima',
    peak: 'Picco, apportato',
    peakDay: 'Giorno di picco, tutta la serra',
    year: 'Acqua all’anno',
    perM2Year: 'per m² di superficie',
    emitters: 'Gocciolatori',
    perEmitter: 'Per gocciolatore, giorno di picco',
    shots: 'Turni al giorno',
    shotLength: 'Ogni turno dura',
    systemFlow: 'Tutti i gocciolatori insieme',
    sections: 'Settori irrigui',
    monthly: 'Acqua apportata ogni mese, L per m² al giorno',
    monthlyAlt: (peak: string, value: string) =>
      `Grafico a barre dell’acqua giornaliera per mese; picco a ${peak} con ${value} L/m²`,
    rainYear: 'Pioggia all’anno',
    harvest: 'Pioggia raccolta',
    demand: 'Irrigazione',
    coverage: 'La pioggia copre',
    maxCoverage: (pct: string) =>
      `al massimo ${pct} % con una vasca abbastanza grande`,
    suggested: 'Vasca consigliata',
    storm: (mm: string, m3: string) => `Un temporale di ${mm} mm: ${m3} m³`,
    rainChart: 'Pioggia raccolta e irrigazione ogni mese, m³',
    rainAlt: (pct: string) =>
      `Grafico a barre della pioggia raccolta e dell’irrigazione per mese; irrigazione coperta dalla pioggia: ${pct} %`,
    table: {
      month: 'Mese',
      harvest: 'Raccolta',
      demand: 'Necessaria',
      used: 'Usata',
      stored: 'In vasca',
      overflow: 'Tracimata',
    },
    formulas: {
      inside: 'Luce interna = Rg × τ × (1 − ombra)',
      net: 'Uso della coltura = k × chioma × luce interna / 2,45',
      gross: 'Apportata = uso / (1 − drenaggio)',
      house: 'Serra = apportata × superficie coltivata',
      drippers:
        'Gocciolatori = superficie coltivata × piante × gocciolatori per pianta',
      shots: 'Turni = per gocciolatore / turno',
      harvest: 'Raccolta = pioggia × tetto × deflusso',
      basin:
        'Vasca: mese per mese, entra la pioggia, esce l’irrigazione, tracima quando è piena',
    },
  },

  air: {
    title: 'Luce e aria',
    lead: 'Lampade per i mesi bui e ombra per quelli luminosi, CO₂ per nutrire la coltura, e l’aria da cambiare di notte per tenere basse umidità e gocciolamento.',
    tabs: {
      light: 'Luce',
      co2: 'CO₂',
      humidity: 'Umidità notturna',
      vpd: 'VPD',
    },
    source: 'CO₂ da',
    sources: {
      burner: 'Bruciatore a gas (fumi)',
      liquid: 'Serbatoio di CO₂ liquida',
    },
    fixtures: 'Lampade',
    ppfd: 'Luce dalle lampade',
    energy: 'Lampade all’anno',
    co2Grid: 'CO₂ dell’elettricità',
    shade: 'Ombra massima',
    shadeMonths: (n: string) => `${n} mesi ombreggiati`,
    sunDli: 'Sole all’interno',
    chart: 'Luce solare interna ogni mese, mol/m² al giorno',
    chartAlt: (place: string, target: string) =>
      `Grafico a barre della luce giornaliera interna per mese a ${place}, rispetto a un obiettivo di ${target}`,
    table: { sun: 'Sole', lamps: 'Lampade h', shade: 'Ombra %' },
    supply: 'CO₂ da fornire',
    used: 'Assorbita dalla coltura',
    leak: 'Persa con l’aria',
    year: 'CO₂ all’anno',
    cost: 'Costo all’anno',
    burner: 'Gas per il bruciatore',
    air: 'Aria esterna da far entrare',
    heat: 'Calore per quell’aria',
    night: 'notte',
    vpd: 'Deficit di pressione di vapore',
    dew: 'Punto di rugiada',
    cover: 'Copertura, lato interno',
    water: 'Acqua da togliere',
    formulas: {
      saturation: 'Saturazione: e_s = 0,6108 × exp(17,27 T / (T + 237,3))',
      vpd: 'VPD = e_s × (1 − UR / 100)',
      headroom: 'Margine = saturo − acqua nell’aria',
      dli: 'Sole interno = Rg × 0,47 × 4,57 × τ (mese più buio)',
      ppfd: 'PPFD = (obiettivo − sole) × 10⁶ / (ore × 3600)',
      fixtures: 'Lampade = PPFD / efficienza × superficie / watt',
      shade: 'Ombra = 1 − soglia / sole (mese più luminoso)',
      leak: 'Perdita = N × V × (obiettivo − esterno) × 1,83 × 10⁻⁶',
      uptake: 'Assorbimento = g/m²·h × superficie',
      burner: 'Gas = CO₂ / 1,96; calore = gas × 9,77 × η',
      water: 'Acqua = traspirazione × superficie',
      air: 'Aria = acqua / (ρ × (x_int − x_est))',
      heat: 'Calore = ρ × cp × aria × (T_int − T_est)',
      surface: 'Copertura interna = T_int − U/8 × (T_int − T_est)',
    },
  },

  climate: {
    title: 'Clima',
    lead: 'Medie mensili per le zone serricole. Servono a dimensionare un impianto; i dati della tua stazione sono migliori.',
    choose: 'Località',
    use: 'Usa per questo progetto',
    inUse: 'Usato da questo progetto',
    lat: 'Latitudine',
    designWinter: 'Notte di progetto',
    designSummer: 'Pomeriggio di progetto',
    peakSun: 'Sole di mezzogiorno d’estate',
    rainYear: 'Pioggia all’anno',
    chart: 'Temperature (linee) e pioggia (barre) per mese',
    chartAlt: (place: string) =>
      `Grafico delle temperature e della pioggia mensili a ${place}`,
    table: {
      month: 'Mese',
      tMin: 'Min °C',
      tMax: 'Max °C',
      sun: 'Sole MJ/m²·g',
      rain: 'Pioggia mm',
      day: 'Giorno h',
    },
    source:
      'Medie di stazione arrotondate (circa 1991–2020). Una versione futura prenderà le medie di qualsiasi luogo sulla mappa.',
  },

  stages: {
    nursery: 'Vivaio',
    vegetative: 'Crescita',
    flowering: 'Fioritura',
    harvest: 'Raccolta',
    cleanOut: 'Pulizia',
  },
  vpd: {
    stage: 'Fase colturale',
    light: 'Luce',
    lights: {
      sun: 'Sole',
      cloud: 'Nuvoloso',
      night: 'Notte',
    },
    status: {
      tooWet: 'Troppo umido',
      good: 'Buono',
      tooDry: 'Troppo secco',
    },
    ideal: 'ideale',
    actions: {
      hold: 'Mantieni il clima così',
      ventilate: 'Ventila per asciugare l’aria',
      heatAndVent: 'Riscalda un poco e apri le aperture',
      heat: 'Riscalda: l’aria fuori è più umida',
      humidify: 'Alza l’umidità: nebbia o nebulizzazione',
      coolAndHumidify: 'Ombreggia e nebulizza: raffredda e inumidisci',
    },
    band: 'Fascia',
    absolute: 'Acqua nell’aria',
    headroom: 'Margine prima della saturazione',
    pairsTitle: 'Lo stesso VPD ad altre temperature',
    targetsTitle: (stage: string) => `Obiettivi · ${stage}`,
    day: 'Giorno',
    night: 'Notte',
    source: 'Fonte',
  },
  advice: {
    title: 'Strategia di raffrescamento',
    strategies: {
      vents: 'Bastano le aperture al colmo',
      ventsAndShade: 'Aperture con ombreggio',
      shadeAndFog: 'Ombreggio e nebbia ad alta pressione',
      shadeAndPad: 'Ombreggio e pannelli evaporativi',
    },
    ventsNeeded: 'Aperture necessarie, senza ombreggio in più',
    withShade: (pct: string) => `Aperture con il ${pct} % di ombreggio`,
    fogInside: 'Dentro con ombreggio e nebbia',
    padOutlet: 'Aria all’uscita del pannello bagnato',
    openFog: 'Dimensiona la nebulizzazione',
    rule: 'Regola: sopra 38 °C fuori, o con aperture oltre un quarto del suolo, ombreggia e raffresca per evaporazione invece di ingrandire le aperture.',
  },
  calendar: {
    title: 'Calendario colturale',
    lead: 'L’anno colturale settimana per settimana: le fasi, il clima che ognuna vuole, e quando funzionano riscaldamento, CO₂, ombreggio e nebbia.',
    rows: {
      temp: 'Fuori',
      stage: 'Coltura',
      heating: 'Riscaldamento',
      co2: 'CO₂',
      shade: 'Ombreggio',
      fog: 'Nebbia',
    },
    targets: 'Obiettivi per fase',
    stage: 'Fase',
    weeks: 'settimane',
    week: 'Settimana',
    firstHarvest: 'Prima raccolta',
    weeksOfPicking: 'settimane di raccolta',
    end: 'Fine coltura',
    heatingFrom: 'Riscaldamento dalla',
    systems: 'Impianti',
    harvestWeeks: 'Settimane di raccolta',
    heatingWeeks: 'Settimane di riscaldamento',
    fogWeeks: 'Settimane di nebbia',
  },
  science: {
    title: 'Scienza',
    lead: 'I fenomeni dietro ogni calcolatore: cosa succede, la formula, cosa assume e come misurare ogni numero che inserisci.',
    search: 'Cerca un argomento',
    empty: 'Nessun argomento corrisponde.',
    contents: 'Argomenti',
    formula: 'Formula',
    inputs: 'Dati e come ottenerli',
    input: 'Dato',
    method: 'Come',
    instrument: 'Strumento',
    assumptions: 'Ipotesi',
    related: 'Collegati',
    usedIn: 'Usato in',
    sources: 'Fonti',
    instrumentsTitle: 'Strumenti di misura',
    instrumentsLead: 'Con cosa misurare, e come leggere bene.',
    howToGet: (label: string) => `Come ottenere «${label}»`,
    readMore: 'Leggi:',
    close: 'Chiudi',
    groups: {
      site: 'Sito e conti',
      house: 'La serra',
      heat: 'Calore',
      air: 'Aria, umidità e raffrescamento',
      water: 'Acqua',
      crop: 'Luce, CO₂ e coltura',
    },
    methods: {
      measure: 'Da misurare',
      datasheet: 'Dalla scheda tecnica',
      derived: 'Calcolato',
      setpoint: 'Tua impostazione',
      assume: 'Ipotesi di progetto',
      bill: 'Dalle bollette',
    },
    methodHints: {
      measure: 'Da rilevare sul posto con lo strumento qui sotto.',
      datasheet:
        'Dalla scheda tecnica del fornitore; il suggerimento dà un valore tipico.',
      derived:
        'SerraCalc lo ricava dalla serra o da un altro strumento; sostituiscilo se conosci un valore migliore.',
      setpoint: 'Una scelta: un set point o un obiettivo di conduzione.',
      assume: 'Un valore tipico della pratica; affinalo con i tuoi dati.',
      bill: 'La tua tariffa o il tuo fattore, nella valuta del progetto.',
    },
    topics: {
      cogeneration: {
        title: 'Cogenerazione e accumulo di calore',
        what: 'Un motore a gas produce elettricità e, dall’acqua di raffreddamento e dai fumi, calore; i fumi depurati portano CO₂ alla coltura. Girando di giorno, quando la coltura può usare la CO₂, produce più calore di quanto serva alla serra: un accumulo d’acqua calda lo porta nella notte e una caldaia copre il resto.',
        assumptions: [
          'Una giornata d’inverno di progetto, con l’esterno che segue un coseno dalle 3 alle 15.',
          'La cogenerazione gira a piena potenza nelle sue ore.',
        ],
      },
      heatReuse: {
        title: 'Calore dell’acqua di pozzo raffreddata',
        what: 'L’acqua pompata calda da un pozzo profondo e raffreddata per l’irrigazione o il raffrescamento cede 1,163 kWh per m³ e per kelvin. Raffreddarla da 40 a 15 °C libera circa 29 kWh per m³, che una pompa di calore o un circuito a bassa temperatura può restituire alla serra.',
        assumptions: [
          'Tutto il calore liberato viene recuperato.',
          'Acqua a 1.000 kg/m³ e 4,19 kJ/kg·K.',
        ],
      },
      siteScale: {
        title: 'Scala del sito ed economia',
        what: 'Un grande sito è fatto di compartimenti di pochi ettari, ciascuno una serra ripetuta sulla superficie, che condividono osmosi, cogenerazione e magazzino di confezionamento. Sommandoli si ottengono l’acqua, il calore, la manodopera e la produzione che gli impianti condivisi devono servire, e il costo di ogni chilo.',
        assumptions: [
          'Ogni compartimento si comporta come la serra del suo progetto, al m².',
          'Prezzi, paghe e rese sono esempi da sostituire con i tuoi.',
        ],
      },
      desalination: {
        title: 'Dissalazione dell’acqua di mare per osmosi inversa',
        what: 'Un’alta pressione spinge l’acqua di mare attraverso membrane che trattengono il sale. Il recupero è la quota che passa come permeato; il resto esce come salamoia, più salata in proporzione. Pompare contro la pressione osmotica richiede 3–4 kWh per m³ con recupero energetico.',
        assumptions: [
          'Il permeato mantiene (1 − reiezione) della salinità media lungo le membrane.',
          'Energia e recupero sono tipici; confermali col fornitore.',
        ],
      },
      fertigation: {
        title: 'Fertirrigazione e riuso del drenaggio',
        what: 'La coltura beve l’acqua ma lascia quasi tutto il sodio e il cloruro, quindi il drenaggio è più salato dell’apporto. Riutilizzare il drenaggio risparmia acqua e concime, ma il suo sale si accumula finché il circuito va scaricato; scaricarne una parte stabilizza il sodio.',
        assumptions: [
          'Il sodio entra appena nella coltura.',
          'La perdita di resa è lineare sopra 2 dS/m: indicativa, da una prova e una varietà.',
        ],
      },
      geometry: {
        title: 'Geometria della serra',
        what: 'Ogni carico dipende da tre numeri: il suolo (dove si coltiva e dove cade il sole), la copertura (che perde calore) e il volume d’aria (che smorza calore, umidità e CO₂). Una serra alta ha più aria per m² e oscilla meno.',
        assumptions: [
          'I tetti sono falde dritte, o mezza ellisse per un arco.',
          'Le testate contano come copertura; porte e grondaie sono ignorate.',
        ],
      },
      heatLoss: {
        title: 'Dispersioni attraverso la copertura',
        what: 'Il calore attraversa la copertura dalla serra calda alla notte fredda, in proporzione alla superficie, alla differenza di temperatura e alla trasmittanza U. Uno schermo termico chiuso la riduce; lo zoccolo perde un po’ di più lungo il perimetro.',
        assumptions: [
          'I valori U sono di progetto per una notte calma e serena (ASAE EP406).',
          'La notte di progetto torna quasi ogni inverno: non è il record.',
        ],
      },
      airLeakage: {
        title: 'Infiltrazioni d’aria',
        what: 'L’aria fredda entra da fessure, aperture e porte e va riscaldata. Il ricambio N dice quante volte all’ora l’intero volume viene sostituito: circa 0,5 per un doppio film stagno, 1,5–2 per un vetro vecchio.',
        assumptions: [
          'Le infiltrazioni non cambiano col vento in questi strumenti.',
          '0,335 Wh per m³ e per K è la capacità termica dell’aria verso 20 °C.',
        ],
      },
      hotWater: {
        title: 'Tubi di riscaldamento ad acqua calda',
        what: 'Un circuito cede calore per convezione e irraggiamento. Il salto termico dell’acqua fissa la portata (1,163 kWh per m³ e per K) e la resa per metro fissa la lunghezza dei tubi. L’acqua geotermica a 60–75 °C richiede più tubo di una caldaia a 80–90 °C.',
        assumptions: [
          'Convezione naturale attorno a un tubo orizzontale: h = 1,32 (ΔT/D)^0,25.',
          'La superficie del tubo è alla temperatura media dell’acqua.',
        ],
      },
      solarGain: {
        title: 'Apporto solare',
        what: 'Il sole che attraversa la copertura diventa calore. Una parte la coltura la spende per evaporare acqua; il resto scalda l’aria e deve uscire dalle aperture, dai pannelli o con la nebbia. Ombreggio e imbiancatura lo tagliano alla fonte.',
        assumptions: [
          'La trasmissione comprende struttura e polvere.',
          'Una coltura piena spende circa metà del sole nella traspirazione.',
        ],
      },
      ventilation: {
        title: 'Ventilazione naturale',
        what: 'L’aria calda sale ed esce dalle aperture al colmo (effetto camino) e il vento la fa passare. La superficie d’apertura necessaria cresce in fretta se la serra può superare l’esterno di pochi gradi; oltre circa il 30 % del suolo le aperture da sole non bastano.',
        assumptions: [
          'Boulard e Baille (1995): Cd 0,65 e Cw 0,1 per le aperture al colmo.',
          'Aria a 1,2 kg/m³ e 1005 J/kg·K.',
        ],
      },
      evaporativeCooling: {
        title: 'Raffrescamento evaporativo e bulbo umido',
        what: 'L’acqua che evapora nell’aria secca le sottrae calore. Non si può raffreddare l’aria sotto il suo bulbo umido, che scende quanto più l’aria è secca: a 44 °C e 15 % il bulbo umido è verso 22 °C. Un pannello bagnato fa il 75–85 % del percorso.',
        assumptions: [
          'Bulbo umido secondo Stull (2011), entro circa 0,3 K.',
          'L’aria si scalda in modo uniforme tra pannelli e ventilatori.',
        ],
      },
      fogging: {
        title: 'Nebulizzazione ad alta pressione',
        what: 'Ugelli a 40–70 bar producono gocce di 10–30 µm che evaporano prima di cadere, raffrescando l’aria con le aperture aperte. Il limite è l’umidità: la nebbia viene ridotta perché l’aria resti sotto un tetto, di solito il 70–80 %.',
        assumptions: [
          'Tutta la nebbia evapora finché l’aria resta sotto il tetto.',
          'La portata delle aperture segue Boulard e Baille, da vento e differenza di temperatura.',
        ],
      },
      vpd: {
        title: 'Deficit di pressione di vapore (VPD)',
        what: 'Il VPD è quanta acqua in più l’aria potrebbe contenere alla sua temperatura. Guida la traspirazione: troppo basso e la pianta non muove acqua e calcio e i funghi si diffondono; troppo alto e gli stomi si chiudono e la pianta appassisce. Lo stesso VPD vale per molte coppie di temperatura e umidità.',
        assumptions: [
          'Foglia e aria alla stessa temperatura.',
          'Pressione di vapore saturo secondo Tetens, come nella FAO-56.',
        ],
      },
      dewPoint: {
        title: 'Punto di rugiada e condensa',
        what: 'L’aria raffreddata fino al punto di rugiada comincia a cedere acqua. Di notte la faccia interna della copertura è più fredda dell’aria; sotto il punto di rugiada gocciola sulla coltura e diffonde malattie.',
        assumptions: [
          'La faccia interna scambia circa 8 W/m²·K con l’aria.',
          'Il cielo notturno e il vento sono compresi nel valore U.',
        ],
      },
      nightHumidity: {
        title: 'Deumidificare di notte',
        what: 'Di notte la coltura traspira ancora. Quell’acqua deve uscire con aria esterna che ne contiene meno, e quell’aria va riscaldata. Ventilare non asciuga la serra quando l’aria esterna contiene più acqua in valore assoluto.',
        assumptions: [
          'Acqua in grammi per kg d’aria secca, alla pressione del livello del mare.',
          'La condensa sulla copertura non è contata come uscita.',
        ],
      },
      transpiration: {
        title: 'Traspirazione e irrigazione',
        what: 'Una coltura traspira circa due terzi del sole che riceve: il fabbisogno segue la radiazione interna. In fuori suolo si aggiunge il drenaggio per lavare i sali; con acqua salmastra la quota di drenaggio deve salire.',
        assumptions: [
          '2,45 MJ evaporano un litro d’acqua.',
          'La copertura vegetale riduce il consumo di una coltura giovane.',
        ],
      },
      rainHarvest: {
        title: 'Raccolta dell’acqua piovana',
        what: 'Il tetto di una serra è un grande bacino di raccolta. Una vasca conserva la pioggia tra un temporale e l’altro: mese per mese si riempie, si svuota nell’irrigazione e trabocca quando è piena.',
        assumptions: [
          'Totali mensili; un forte temporale è verificato a parte.',
          'I primi millimetri di ogni pioggia vanno persi.',
        ],
      },
      light: {
        title: 'Luce per la coltura (DLI)',
        what: 'Le piante contano fotoni, non watt: l’integrale di luce giornaliero è il numero di moli di luce fotosintetica per m² al giorno, e circa il 47 % del sole è PAR. Le lampade colmano il divario nei mesi bui; l’ombreggio tiene i mesi luminosi sotto il tetto della coltura.',
        assumptions: [
          '4,57 µmol di fotoni per joule di PAR solare.',
          'Le lampade sono dimensionate per il mese più buio.',
        ],
      },
      co2: {
        title: 'Arricchimento in CO₂',
        what: 'La coltura prende la CO₂ dall’aria e 700–900 ppm alzano la resa. Quello che fornisci entra nella coltura o se ne va con l’aria: l’arricchimento rende quando le aperture sono quasi chiuse. Un bruciatore a gas o una cogenerazione danno CO₂ e calore insieme.',
        assumptions: [
          '1,83 g di CO₂ per m³ d’aria ogni 1000 ppm.',
          '1 m³ di gas naturale bruciato dà 1,96 kg di CO₂.',
        ],
      },
      cropCalendar: {
        title: 'L’anno colturale',
        what: 'Una coltura passa per fasi che vogliono climi diversi. Letto con le normali climatiche, il calendario mostra quando le notti chiedono calore, quando la serra resta chiusa abbastanza per la CO₂, e quando il sole chiede ombreggio e nebbia.',
        assumptions: [
          'I valori settimanali sono letti tra le normali mensili.',
          'Le durate delle fasi sono tipiche; verificale con la ditta sementiera.',
        ],
      },
    },
    instruments: {
      ecMeter: {
        name: 'Conduttimetro e pH-metro',
        how: 'Un conduttimetro portatile o in linea, compensato a 25 °C. Taralo ogni settimana con un tampone da 1,41 dS/m e leggi apporto e drenaggio alla stessa ora.',
      },
      labAnalysis: {
        name: 'Analisi dell’acqua in laboratorio',
        how: 'Campiona la fonte, l’apporto e il drenaggio ogni due-quattro settimane; il laboratorio dà sodio, cloruro, nutrienti e bicarbonati in mmol/L.',
      },
      tape: {
        name: 'Metro a nastro o distanziometro laser',
        how: 'Misura campate, lunghezze e altezze da terra alla grondaia. Conta campate, piante, gocciolatori e ugelli su alcune file e proporziona.',
      },
      thermometer: {
        name: 'Termometro d’aria ventilato',
        how: 'Un sensore in una cassetta bianca ventilata, ad altezza coltura e all’ombra. Un sensore al sole legge parecchi gradi in più.',
      },
      hygrometer: {
        name: 'Sensore di umidità o psicrometro',
        how: 'Un sensore capacitivo nella stessa cassetta ventilata, verificato ogni anno con uno psicrometro a bulbo secco e umido. Leggi temperatura e umidità insieme.',
      },
      weatherStation: {
        name: 'Stazione meteo esterna',
        how: 'Temperatura e umidità in uno schermo antiradiazione a 2 m, lontano dalle serre. Per i valori di progetto prendi le notti fredde e i pomeriggi caldi di più anni.',
      },
      pyranometer: {
        name: 'Piranometro',
        how: 'La radiazione globale in W/m², in piano e pulito, sopra il tetto. Il computer climatico spesso ne ha uno; le sue somme giornaliere in MJ/m² alimentano gli strumenti acqua e luce.',
      },
      parSensor: {
        name: 'Sensore quantico PAR',
        how: 'I fotoni in µmol/m²·s. Leggi fuori e ad altezza coltura nello stesso momento: dentro su fuori è la trasmissione. Sommato sul giorno dà il DLI.',
      },
      anemometer: {
        name: 'Anemometro',
        how: 'Un anemometro a coppe o a ultrasuoni su un palo sopra il colmo; prendi un pomeriggio estivo tipico, non le raffiche. Un anemometro a elica a mano legge la velocità attraverso un pannello o un ventilatore.',
      },
      co2Sensor: {
        name: 'Sensore di CO₂ (NDIR)',
        how: 'Un sensore infrarosso ventilato ad altezza coltura. Verificalo sull’aria esterna, circa 420 ppm, prima di ogni stagione.',
      },
      tracerGas: {
        name: 'Prova di decadimento di un gas traccia',
        how: 'In una notte calma chiudi la serra, porta la CO₂ a circa 1000 ppm e registra il calo: N = ln((C₁ − C_est) / (C₂ − C_est)) / ore.',
      },
      flowMeter: {
        name: 'Misuratore di portata',
        how: 'Un misuratore a ultrasuoni a pinza o in linea sulla condotta principale. Leggi la portata mentre funziona un settore, o la curva della pompa alla sua prevalenza di lavoro.',
      },
      catchCups: {
        name: 'Prova con i bicchieri',
        how: 'Raccogli da 10–20 gocciolatori o ugelli per qualche minuto cronometrato, misura ogni volume con un cilindro graduato e fai la media. Lo scarto mostra l’uniformità dell’impianto.',
      },
      drainTray: {
        name: 'Vaschetta di drenaggio su bilancia',
        how: 'Qualche lastra su una vaschetta con pluviometro a bascula o bilancia: quota di drenaggio = drenaggio ÷ acqua data. Misura insieme l’EC del gocciolatore e del drenaggio.',
      },
      pressureGauge: {
        name: 'Manometro',
        how: 'Un manometro a glicerina sulla mandata della pompa (1 bar vale circa 10 m di prevalenza), o un manometro differenziale su un ventilatore per la pressione statica.',
      },
      infrared: {
        name: 'Termometro a contatto o a infrarossi',
        how: 'Una sonda a contatto sui tubi di mandata e ritorno, o un termometro a infrarossi impostato sull’emissività del tubo.',
      },
      meters: {
        name: 'Contatori di gas, calore ed elettricità',
        how: 'Le letture mensili e le bollette danno il consumo reale, la potenza e le tariffe per verificare gli strumenti.',
      },
      climateComputer: {
        name: 'Registri del computer climatico',
        how: 'Set point, ore di funzionamento, cicli di nebbia e turni d’irrigazione vengono dalle impostazioni e dai registri giornalieri del computer climatico.',
      },
    },
  },
  supply: {
    title: 'Acqua irrigua',
    lead: 'Dal mare alla radice: un impianto di osmosi inversa dimensionato sul giorno di punta della coltura, e il circuito nutritivo che riutilizza il drenaggio e scarica prima che il sale si accumuli.',
    tabs: {
      ro: 'Osmosi di acqua di mare',
      fertigation: 'Fertirrigazione',
    },
    sea: 'Mare',
    membranes: 'Membrane',
    brine: 'Salamoia',
    fresh: 'Acqua dolce',
    drain: 'Drenaggio',
    reused: 'Riutilizzato',
    letGo: 'Scaricato',
    days: 'giorni',
    flush: 'Scarico',
    takeDemand: (m3: string) => `Prendi il giorno di punta: ${m3} m³`,
    useRo: (ec: string) => `Usa l’acqua osmotizzata: EC ${ec}`,
    feed: 'Acqua di mare pompata',
    product: 'Permeato',
    productEc: 'EC del permeato',
    energy: 'Energia al giorno',
    costDay: 'Elettricità al giorno',
    coverage: 'L’impianto copre',
    tank: 'Serbatoio',
    waterSaved: 'Acqua risparmiata',
    fertSaved: 'Concime risparmiato',
    drainEc: 'EC del drenaggio',
    rootEc: 'Zona radicale',
    yieldLoss: 'Resa persa per il sale',
    flushIn: 'Scarico fra',
    never: 'Non serve',
    levelsAt: 'Si stabilizza a',
    stock: 'Soluzioni A e B, ciascuna',
    stockDays: (days: string) => `un serbatoio dura ${days} giorni`,
    formulas: {
      roFeed: 'Alimentazione = permeato / recupero',
      roBrine:
        'Salamoia = alimentazione − permeato; salinità ≈ S_mare / (1 − R)',
      roEnergy: 'Energia = SEC × permeato',
      fertDrain: 'EC drenaggio = (A × EC_apporto − U × EC_assorbita) / D',
      fertNa:
        'Sodio: chiuso, t = V (C_lim − C_0) / (C_in × acqua dolce); altrimenti si stabilizza a C_in × acqua dolce × D / (A × scarico)',
      fertYield: 'Resa = 1 − pendenza × (EC_radici − soglia)',
      fertStock: 'Soluzione madre = nutrienti necessari / diluizione',
    },
  },
  energy: {
    title: 'Energia',
    lead: 'Una cogenerazione a gas che dà calore, elettricità e CO₂ lungo una giornata d’inverno, un accumulo d’acqua calda per la notte e una caldaia per il resto; e il calore contenuto nell’acqua di pozzo raffreddata.',
    tabs: {
      chp: 'Cogenerazione e accumulo',
      reuse: 'Recupero di calore',
    },
    buffer: 'Accumulo',
    fromChp: 'Cogenerazione',
    fromBuffer: 'Accumulo',
    fromBoiler: 'Caldaia',
    demand: 'Fabbisogno',
    chpShare: 'La cogenerazione copre',
    dayNeed: 'Calore del giorno',
    dumped: 'Disperso',
    gas: 'Gas al giorno',
    power: 'Elettricità prodotta',
    netCost: 'Gas meno elettricità venduta',
    co2: 'CO₂ alla coltura',
    co2Need: 'Necessaria',
    inWater: 'Calore nell’acqua',
    need: 'Fabbisogno di calore',
    covers: 'Copre',
    takeLinks:
      'Prendi l’acqua del giorno di punta e il calore del giorno d’inverno',
    formulas: {
      demand:
        'Fabbisogno = H × (T_set − T_est) − sole, meno lo schermo di notte',
      buffer: 'Accumulo = 1,163 × V × ΔT',
      gas: 'Gas = P_el / η_el / 9,77 × ore + caldaia',
      co2: 'CO₂ = 1,96 kg per m³ di gas',
      reuse: 'Calore = 1,163 × V × ΔT',
    },
  },
  site: {
    title: 'Sito',
    lead: 'L’intera azienda: ogni progetto è un compartimento, la sua serra ripetuta sulla superficie; i totali, l’osmosi e la cogenerazione condivise a confronto, e l’economia dell’anno.',
    tabs: {
      overview: 'Panoramica',
      economics: 'Economia',
    },
    choose: 'Sito',
    unnamed: 'Sito senza nome',
    empty:
      'Nessun progetto. I progetti con lo stesso «Sito» formano un sito; dai qui a ciascuno la sua superficie.',
    compartments: (n: string) => `Compartimenti: ${n}`,
    area: 'Superficie',
    peakWater: 'Acqua, giorno di punta',
    meanWater: 'media',
    heatPeak: 'Calore, notte di progetto',
    yield: 'Produzione all’anno',
    labour: 'Manodopera all’anno',
    days: 'giornate',
    people: (n: string) => `circa ${n} persone a tempo pieno`,
    co2e: 'Impronta di carbonio',
    co2eHint: '1,9 kg CO₂e per kg (stima pubblicata)',
    sharesAlt: 'Compartimenti per quota della superficie',
    plants: 'Impianti condivisi',
    roPlant: 'Osmosi di acqua di mare',
    chpPlant: 'Cogenerazione',
    covers: (pct: string) => `copre il ${pct} % del giorno di punta`,
    chpOfPeak: (pct: string) => `${pct} % del picco di calore`,
    noRo: 'Salva un risultato di osmosi di acqua di mare in uno di questi progetti per verificarlo qui.',
    noChp:
      'Salva un risultato della centrale energetica in uno di questi progetti per verificarlo qui.',
    table: 'Compartimenti',
    tableHint:
      'Imposta la superficie di ogni compartimento: la sua serra vi è ripetuta.',
    compartment: 'Compartimento',
    houses: 'Serre',
    areaOf: (name: string) => `Superficie di ${name}, ha`,
    takeTotals: (ha: string) => `Prendi i totali del sito: ${ha} ha`,
    costPerKg: 'Costo per kg',
    price: 'Prezzo',
    margin: 'Margine',
    revenue: 'Ricavi',
    payback: 'Rientro dell’investimento',
    years: 'anni',
    waterPerKg: 'Acqua per kg',
    costTitle: 'Dove vanno i soldi',
    costs: {
      labour: 'Manodopera',
      energy: 'Energia',
      water: 'Acqua',
      inputs: 'Concimi e difesa',
      other: 'Confezionamento e spese',
    },
    formulas: {
      yield: 'Produzione = superficie × t/ha',
      cost: 'Costo per kg = costi / kg',
      payback: 'Rientro = costruzione / margine',
    },
  },
  ops: {
    title: 'Gestione',
    lead: 'Il registro colturale, il giro d’igiene del giorno, la manutenzione degli impianti e un piano caldo per chi lavora dentro.',
    noProject: 'Apri un progetto per tenere il suo registro.',
    tabs: {
      log: 'Registro',
      hygiene: 'Igiene',
      maintenance: 'Manutenzione',
      heat: 'Stress da caldo',
    },
    newEntry: 'Nuova voce',
    date: 'Data',
    kind: 'Tipo',
    kinds: {
      scouting: 'Monitoraggio',
      release: 'Lancio di ausiliari',
      spray: 'Trattamento',
      maintenance: 'Manutenzione',
      hygiene: 'Controllo igiene',
      harvest: 'Raccolta',
    },
    subjects: {
      scouting: 'Parassita o malattia visti, e dove',
      release: 'Ausiliare lanciato',
      spray: 'Prodotto distribuito',
      maintenance: 'Cosa è stato fatto',
      hygiene: 'Lista di controllo',
      harvest: 'Compartimento o file',
    },
    task: 'Compito',
    amount: 'Quantità',
    unit: 'Unità',
    who: 'Classe OMS',
    note: 'Nota',
    add: 'Aggiungi al registro',
    entries: (n: string) => `Voci del registro: ${n}`,
    all: 'Tutto',
    empty: 'Ancora niente nel registro.',
    remove: (what: string) => `Elimina «${what}»`,
    checklist: 'Lista d’igiene',
    saveChecklist: (done: string, total: string) =>
      `Salva la lista di oggi (${done} su ${total})`,
    recent: 'Ultime liste',
    every: 'Ogni',
    last: 'Ultima volta',
    due: 'Scadenza',
    state: 'Stato',
    done: 'Fatto oggi',
    days: 'giorni',
    states: {
      ok: 'In regola',
      soon: 'A breve',
      overdue: 'In ritardo',
    },
    overdue: (n: string) => `Compiti in ritardo: ${n}`,
    tasks: {
      filters: 'Pulire i filtri dell’irrigazione',
      nozzles: 'Controllare gli ugelli della nebbia',
      pads: 'Pulire e lavare i pannelli',
      sensors: 'Tarare i sensori di clima ed EC',
      pumps: 'Manutenzione delle pompe',
      fans: 'Controllare ventilatori e cinghie',
      drainDisinfection: 'Controllare la disinfezione del drenaggio',
      roMembranes: 'Pulire le membrane dell’osmosi (CIP)',
      chp: 'Manutenzione della cogenerazione',
    },
    hygiene: {
      footbath: 'Pediluvi riempiti',
      handwash: 'Lavaggio mani e guanti all’ingresso',
      clothing: 'Indumenti puliti per questo compartimento',
      tools: 'Coltelli e attrezzi disinfettati',
      visitors: 'Visitatori registrati e informati',
      waste: 'Residui vegetali portati via e coperti',
      doors: 'Porte e reti antinsetto chiuse',
    },
    heatTitle: 'Stress da caldo al lavoro',
    heatIndex: 'Indice di calore',
    rest: 'Pausa ogni ora',
    water: 'Acqua ogni ora',
    risks: {
      none: 'Nessun rischio',
      caution: 'Attenzione',
      extremeCaution: 'Massima attenzione',
      danger: 'Pericolo',
      extremeDanger: 'Pericolo estremo',
    },
    plan: 'Il piano caldo',
    advice: {
      caution: 'Acqua a portata di mano; lavori pesanti al mattino presto.',
      extremeCaution:
        'Pausa di 20 min ogni ora all’ombra; 0,75 L d’acqua all’ora.',
      danger:
        'Pausa di 40 min ogni ora; niente lavori pesanti dentro; i lavoratori si controllano a vicenda.',
      extremeDanger: 'Sospendere il lavoro in serra.',
    },
    heatSource:
      'Indice di calore del servizio meteorologico statunitense (Rothfusz); lavoro e pause secondo le indicazioni comuni di salute sul lavoro. Un aiuto alla pianificazione, non un parere medico.',
  },
  data: {
    title: 'Dati in diretta',
    lead: 'Le letture dei tuoi sensori o datalogger, importate in CSV e confrontate con ciò che si aspettano i calcolatori: VPD per la fase, temperature di giorno e di notte, drenaggio; VPD per ora; e allarmi.',
    import: 'Importa letture',
    importHint:
      'Un CSV con una colonna del tempo e a scelta: temperatura, UR, PAR, EC, pH, drenaggio %, EC del drenaggio, temperatura e UR esterne. Virgole o punti e virgola, decimali con punto o virgola.',
    file: 'File CSV',
    paste: 'Oppure incollalo qui',
    importPasted: 'Importa il testo incollato',
    sample: 'Carica una settimana di esempio',
    download: 'Scarica il CSV di esempio',
    clear: 'Cancella le letture',
    noProject: 'Apri un progetto per tenere le sue letture.',
    imported: (n: string, skipped: string) =>
      `Importate ${n} letture; ${skipped} righe saltate.`,
    errors: {
      empty: 'Il file è vuoto.',
      noTime: 'Nessuna colonna del tempo trovata.',
      noData: 'Nessuna lettura trovata.',
    },
    targets: 'Confronta con',
    summary: 'Misurato contro atteso',
    empty:
      'Ancora nessuna lettura: importa un CSV o carica la settimana di esempio.',
    period: (from: string, to: string, n: string, step: string) =>
      `Da ${from} a ${to}: ${n} letture, ogni ${step} min.`,
    vpdInBand: 'VPD nella sua fascia',
    dayMean: 'Giorni, media',
    nightMean: 'Notti, media',
    drainMean: 'Drenaggio, media',
    plan: 'previsto',
    alertCount: 'Allarmi',
    byHour: 'Per ora del giorno',
    vpdByHour: 'VPD per ora, kPa (verde: fascia diurna)',
    tempByHour: 'Temperatura per ora, °C (verde: fascia diurna)',
    alertsTitle: 'Allarmi',
    noAlerts: 'Nessun allarme in queste letture.',
    alerts: {
      vpdLow: 'VPD sotto 0,3 kPa: rischio di malattie',
      vpdHigh: 'VPD sopra 1,5 kPa di giorno',
      heatStress: 'Stress da caldo per i lavoratori',
      heatDanger: 'Pericolo caldo per i lavoratori',
      drainEcHigh: 'EC del drenaggio al tetto di scarico',
      tempLow: 'Troppo freddo per la fase',
      tempHigh: 'Troppo caldo per la fase',
      phOut: 'pH fuori da 5,2–6,8',
    },
    alertDetail: (n: string, worst: string) =>
      `${n} letture, peggiore ${worst}`,
    days: 'Giorno per giorno',
    outOfBand: 'VPD fuori fascia',
  },
  calc: {
    science: 'La scienza dietro il calcolo',
    results: 'Risultati',
    how: 'Come si calcola',
    inputs: 'Dati',
    table: 'Mostra i numeri',
    dragHint:
      'Trascina le maniglie rotonde, oppure seleziona una e usa i tasti freccia.',
  },

  diagrams: {
    energyAlt: (peak: string, start: string, end: string, share: string) =>
      `Giornata d’inverno di progetto: il fabbisogno di calore arriva a ${peak} kW; la cogenerazione gira dalle ${start}:00 alle ${end}:00 e copre il ${share} %. Le maniglie regolano avvio e arresto.`,
    reuseAlt: (water: string, need: string) =>
      `Calore nell’acqua raffreddata, ${water} kWh, a confronto con il fabbisogno del giorno, ${need} kWh.`,
    roAlt: (feed: string, product: string, brine: string, salinity: string) =>
      `Osmosi di acqua di mare: ${feed} m³ pompati al giorno, ${product} m³ di permeato, ${brine} m³ di salamoia a ${salinity} g/L. Le maniglie regolano il recupero e l’accumulo.`,
    fertAlt: (recycle: string, ec: string, flush: string) =>
      `Circuito nutritivo: ${recycle} % del drenaggio riutilizzato, EC del drenaggio ${ec} dS/m, scarico fra ${flush} giorni. Le maniglie regolano la quota riutilizzata e il limite di sodio.`,
    vpdAlt: (air: string, rh: string, vpd: string, status: string) =>
      `Mappa del VPD: aria a ${air} °C e ${rh} % dà ${vpd} kPa, ${status}. Le maniglie regolano temperatura e umidità.`,
    fogAlt: (
      outside: string,
      inside: string,
      rh: string,
      on: string,
      off: string,
    ) =>
      `La nebbia, in un pomeriggio a ${outside} °C, porta la serra a ${inside} °C e ${rh} %, con ${on} s acceso e ${off} s spento. Le maniglie regolano il tetto di umidità e il getto.`,
    calendarAlt: (plant: string, harvest: string, end: string, heat: string) =>
      `Calendario: trapianto nella settimana ${plant}, prima raccolta nella settimana ${harvest}, fine coltura nella settimana ${end}, riscaldamento dalla settimana ${heat}. Le maniglie regolano la settimana di trapianto e la fine della coltura.`,
    ventsOnly: 'Solo aperture',
    withFog: 'Con nebbia',
    wetBulb: 'Bulbo umido',
    cap: 'Tetto',
    heatAlt: (inside: string, outside: string, kw: string) =>
      `Calore che esce dalla serra: ${kw} kW, da ${inside} °C dentro a ${outside} °C fuori. Le maniglie regolano le due temperature.`,
    pipesAlt: (loops: string, length: string, supply: string, back: string) =>
      `Tubi di riscaldamento in pianta: ${loops} circuiti da ${length} m, acqua in mandata a ${supply} °C e di ritorno a ${back} °C. Le maniglie regolano le temperature e la lunghezza del circuito.`,
    ventAlt: (outside: string, rise: string, vents: string) =>
      `Ventilazione in una giornata di sole: ${outside} °C fuori, la serra al massimo ${rise} K più calda, ${vents} m² di finestre al colmo. Le maniglie regolano le temperature e l’apertura delle finestre.`,
    padAlt: (outside: string, pad: string, exhaust: string, distance: string) =>
      `Pannelli e ventilatori: l’aria a ${outside} °C esce dal pannello a ${pad} °C e arriva ai ventilatori, a ${distance} m, a ${exhaust} °C. Le maniglie regolano la distanza e il riscaldamento.`,
    cropAlt: (applied: string, used: string, drain: string) =>
      `Un giorno di picco per m²: ${applied} L apportati, ${used} L traspirati, ${drain} % di drenaggio. Le maniglie regolano la chioma e il drenaggio.`,
    rainAlt: (basin: string, pct: string) =>
      `La pioggia del tetto in una vasca da ${basin} m³: irrigazione coperta per ${pct} %. Una maniglia regola il volume della vasca.`,
    inside: 'Dentro',
    outside: 'Fuori',
    screen: 'Schermo',
    cover: 'Copertura',
    leaks: 'Infiltrazioni',
    footing: 'Zoccolo',
    supply: 'Mandata',
    return: 'Ritorno',
    air: 'Aria',
    loop: 'Circuito',
    loops: 'circuiti',
    vents: 'Finestre',
    shade: 'Ombra',
    pad: 'Pannello',
    fans: 'Ventilatori',
    canopy: 'Chioma',
    transpired: 'Traspirata',
    drain: 'Drenaggio',
    suggested: 'Consigliata',
    overflow: 'Troppo pieno',
    lightAlt: (month: string, sun: string, target: string, ppfd: string) =>
      `Luce a ${month}: ${sun} mol/m² dal sole contro un obiettivo di ${target}; le lampade danno ${ppfd} µmol/m²·s. Le maniglie regolano l’obiettivo, la soglia d’ombra e le ore di lampade.`,
    co2Alt: (target: string, supply: string, used: string) =>
      `CO₂ a ${target} ppm: ${supply} kg/h forniti, ${used} % assorbiti dalla coltura. Le maniglie regolano l’obiettivo e i ricambi d’aria.`,
    humidityAlt: (inside: string, rh: string, dew: string, cover: string) =>
      `Una notte a ${inside} °C e ${rh} %: punto di rugiada ${dew} °C, copertura a ${cover} °C. Le maniglie regolano le due temperature e l’umidità.`,
    target: 'Obiettivo',
    ceiling: 'Soglia',
    noLamps: 'Niente lampade',
    crop: 'Coltura',
    used: 'usata',
    coverAt: 'Copertura',
    dew: 'Rugiada',
    wetterOutside: 'L’aria esterna è più umida',
  },

  save: {
    title: 'Salva nel progetto',
    label: 'Nome',
    save: 'Salva',
    update: 'Aggiorna il risultato salvato',
    saveCopy: 'Salva come copia',
    stopEditing: 'Smetti di modificare',
    editing: 'In modifica',
    editingHint: 'Stai cambiando un risultato salvato.',
    savedTo: 'Salvato in',
    viewSaved: 'vedi i risultati salvati',
    noProject: 'Crea un progetto per salvare i risultati.',
  },

  backup: {
    title: 'Backup e ripristino',
    lead: 'I tuoi progetti sono conservati solo in questo browser. Tienine una copia: salva un file di backup sul telefono, o condividilo su Google Drive, e riaprilo su qualsiasi dispositivo.',
    download: 'Salva un file di backup',
    share: 'Condividi o salva su Drive',
    shareTitle: 'Backup di SerraCalc',
    open: 'Apri un backup',
    driveHint:
      'Su Android, «Condividi o salva su Drive» mostra Drive nel menu di condivisione, e «Apri un backup» può scegliere il file da Drive. Su iPhone, scegli File o l’app Drive.',
    saved: (n: number) =>
      `Backup di ${n} progett${n === 1 ? 'o' : 'i'} pronto.`,
    restored: (n: number, skipped: number) =>
      `${n} progett${n === 1 ? 'o ripristinato' : 'i ripristinati'}${skipped ? ` (${skipped} voc${skipped === 1 ? 'e danneggiata esclusa' : 'i danneggiate escluse'})` : ''}. Quelli già presenti sono entrati come copia.`,
    shareFailed:
      'Qui la condivisione non ha funzionato: salva invece il file di backup.',
    errors: {
      notJson: 'Questo file non è un backup di SerraCalc (non è JSON).',
      notSerraCalc: 'Questo file JSON non è un backup di SerraCalc.',
      newerVersion:
        'Questo backup viene da una versione più recente di SerraCalc: ricarica l’app e riprova.',
      empty: 'Questo backup non contiene progetti leggibili da SerraCalc.',
    },
  },

  report: {
    title: 'Relazione',
    lead: 'Il progetto su carta: la serra, il suo clima e ogni risultato salvato con le sue osservazioni, da stampare o conservare in PDF.',
    print: 'Stampa o salva in PDF',
    tip: 'Nella finestra di stampa scegli «Salva come PDF» per tenere un file. Schermate, menu e pulsanti restano fuori dalla carta.',
    kicker: 'Relazione di progetto',
    date: 'Data',
    house: 'La serra',
    layout: (
      spans: string,
      width: string,
      length: string,
      gutter: string,
      ridge: string,
    ) =>
      `${spans} campate da ${width} m, lunga ${length} m, gronda ${gutter} m, colmo ${ridge} m`,
    noProject: 'Crea o apri un progetto per stamparne la relazione.',
    footer:
      'I risultati sono ricalcolati dai dati salvati con le regole attuali di SerraCalc; la Guida ne elenca le fonti.',
  },

  guide: {
    title: 'Guida',
    lead: 'Cosa fa ogni strumento, cosa assume e da dove vengono i suoi numeri.',
    tools: [
      {
        id: 'projects',
        title: 'Progetti e backup',
        body: 'Un progetto contiene una serra, il suo clima, la coltura e la valuta, e ogni risultato che salvi dagli strumenti. I risultati salvati conservano solo i dati, quindi si riaprono con le regole attuali. I progetti restano in questo browser: salva un file di backup, o condividilo su Drive, e aprilo su un altro dispositivo.',
      },
      {
        id: 'greenhouse',
        title: 'Serra',
        body: 'Descrivi la serra una volta: tipo, campate, lunghezza, altezze, copertura e schermo. SerraCalc ricava la superficie, la copertura (tetto, pareti laterali e testate) e il volume d’aria. Ogni calcolatore parte da questi valori e ne tiene una copia quando salvi.',
      },
      {
        id: 'heating',
        title: 'Riscaldamento',
        body: 'Carico di punta: il calore perso in una notte fredda attraverso la copertura (U × A × ΔT), per infiltrazioni (0,335 × N × V × ΔT) e dallo zoccolo, più un margine. Nell’anno: ogni mese diviso in notte e giorno secondo la durata del giorno, le notti con il risparmio dello schermo, i giorni compensati dal sole. Poi combustibile, costo e CO₂. Tubi ad acqua calda: la portata d’acqua geotermica o di caldaia e il tubo da posare perché la serra riceva il suo calore.',
      },
      {
        id: 'cooling',
        title: 'Raffrescamento',
        body: 'Ventilazione: l’aria che porta fuori il calore del sole con la serra pochi gradi sopra l’esterno, le finestre al colmo per la ventilazione naturale (Boulard e Baille) o il numero di ventilatori. Pannelli e ventilatori: l’aria che lascia un pannello bagnato si avvicina alla temperatura di bulbo umido; lo strumento dimensiona ventilatori, parete di pannelli e acqua.',
      },
      {
        id: 'water',
        title: 'Acqua',
        body: 'La coltura traspira circa due terzi della luce che riceve: litri per m² ogni mese dal clima, più il drenaggio. Poi gocciolatori, turni e settori irrigui. Acqua piovana: quanto raccoglie il tetto in una vasca, mese per mese, e la vasca che ne trattiene la maggior parte.',
      },
      {
        id: 'climate',
        title: 'Clima',
        body: 'Temperature, luce solare e pioggia mensili per nove località, con una notte e un pomeriggio di progetto. Scegli la più vicina; sostituiscila con i dati della tua stazione quando li hai.',
      },
      {
        id: 'air',
        title: 'Luce e aria',
        body: 'Luce: l’integrale di luce giornaliera del sole all’interno ogni mese, le lampade che colmano lo scarto dall’obiettivo nel mese più buio, e l’ombra che tiene i mesi luminosi sotto la soglia della coltura. CO₂: l’apporto che mantiene un obiettivo nonostante l’aria che esce e ciò che la coltura assorbe, da un bruciatore a gas o da un serbatoio. Umidità: l’aria esterna da far entrare di notte per portare via l’acqua della coltura, il calore per scaldarla, e se la copertura gocciola.',
      },
      {
        id: 'report',
        title: 'Relazione',
        body: 'Il progetto in una pagina stampabile: la serra, il suo clima e ogni risultato salvato con i numeri principali e le osservazioni. Stampala, o scegli «Salva come PDF» nella finestra di stampa per inviarla.',
      },
      {
        id: 'calendar',
        title: 'Calendario colturale',
        body: 'Le settimane di trapianto, fioritura, raccolta e pulizia con gli obiettivi climatici di ogni fase, e le settimane in cui funzionano riscaldamento, CO₂, ombreggio e nebbia, ricavate dalle normali climatiche. I siti di pomodoro nel deserto trapiantano verso la settimana 36, riscaldano dalla 42 circa e finiscono dopo la 29.',
      },
      {
        id: 'vpd',
        title: 'Umidità e VPD',
        body: 'Il deficit di pressione di vapore da temperatura e umidità (Tetens, come nella FAO-56), il punto di rugiada e l’acqua che l’aria può ancora prendere, rispetto alla fascia della fase colturale e della luce. La mappa mostra ogni coppia di temperatura e umidità, perché uno stesso VPD vale per molte di esse.',
      },
      {
        id: 'fog',
        title: 'Nebulizzazione e strategia di raffrescamento',
        body: 'Nebbia ad alta pressione in una serra ventilata: la temperatura interna da un bilancio di calore e acqua, il ciclo acceso/spento che tiene un tetto di umidità, e l’acqua al giorno. Il consigliere verifica il pomeriggio di progetto: se le sole aperture richiedono più di quanto apra un tetto, propone ombreggio con nebbia o pannelli.',
      },
      {
        id: 'science',
        title: 'Scienza',
        body: 'Ogni fenomeno usato dagli strumenti, spiegato: cosa succede, la formula, cosa assume e come misurare ogni dato, con quale strumento. La ⓘ accanto a ogni campo apre gli stessi consigli e rimanda qui.',
      },
      {
        id: 'supply',
        title: 'Acqua irrigua',
        body: 'L’osmosi di acqua di mare dimensionata sul giorno di punta: alimentazione, salamoia e sua salinità, energia, costo e accumulo. La fertirrigazione con riuso del drenaggio: acqua e concime risparmiati, EC del drenaggio, accumulo del sodio e quando scaricare, e la resa persa per il sale.',
      },
      {
        id: 'site',
        title: 'Sito ed economia',
        body: 'I progetti con lo stesso nome di sito ne sono i compartimenti; dai a ciascuno la sua superficie e il sito somma acqua, calore, produzione, manodopera e carbonio, verifica osmosi e cogenerazione condivise e calcola costo per kg, margine e rientro.',
      },
      {
        id: 'energy',
        title: 'Centrale energetica',
        body: 'Una giornata d’inverno ora per ora: il fabbisogno di calore della serra, una cogenerazione a gas che gira di giorno per la sua CO₂, l’accumulo che porta il calore nella notte e la caldaia per il resto; gas, elettricità e costi. E il calore contenuto nell’acqua di pozzo raffreddata.',
      },
      {
        id: 'operations',
        title: 'Gestione',
        body: 'Un registro di monitoraggi, lanci di ausiliari, trattamenti (classi OMS Ia e Ib rifiutate), manutenzioni e raccolte; la lista d’igiene del giorno; il calendario di manutenzione con ciò che scade o è in ritardo; e un piano contro lo stress da caldo per i lavoratori dall’indice di calore.',
      },
      {
        id: 'data',
        title: 'Dati in diretta',
        body: 'Importa il CSV di un datalogger, o carica una settimana di esempio, e confrontalo con ciò che si aspettano gli strumenti: VPD nella sua fascia, temperature di giorno e di notte, drenaggio; VPD e temperatura per ora; e allarmi per rischio di malattie, stress da caldo, EC del drenaggio, temperatura e pH.',
      },
    ],
    sourcesTitle: 'Fonti',
    sources: [
      'ASAE EP406: riscaldamento, ventilazione e raffrescamento delle serre (trasmittanze, infiltrazioni, perdite dallo zoccolo, pannelli e ventilatori).',
      'Boulard & Baille (1995): ventilazione naturale delle serre dalle finestre al colmo.',
      'FAO Irrigation and Drainage Paper 56: pressione di vapore, durata del giorno, calore latente.',
      'Stull (2011): temperatura di bulbo umido da temperatura e umidità.',
      'Stanghellini (1987) e pratica olandese: traspirazione dalla radiazione.',
      'Thimijan & Heins (1983): conversione della luce solare in fotoni per le piante.',
      'Nederhoff (1994): concimazione carbonica, perdite e assorbimento in serra.',
      'Campen et al. (2003): deumidificazione delle serre con ventilazione e calore.',
      'Soussi et al. (2022): controllo del clima e raffrescamento delle serre nelle regioni calde e aride.',
      'Shamshiri et al. (2018): temperatura, umidità e VPD ottimali per il pomodoro in serra.',
      'Ishii et al.: raffrescamento a nebbia contro pannelli e ventilatori in una serra in Arizona.',
    ],
    limitsTitle: 'Limiti',
    limits: [
      'Le medie mensili nascondono ondate di freddo e di caldo: gli strumenti di punta usano per questo valori di progetto.',
      'I valori di calore e acqua servono a progettare; misura la serra reale e correggi.',
      'I prezzi sono esempi; inserisci la tua tariffa.',
    ],
    open: 'Apri',
  },

  notes: {
    'data.vpdBand': (v) =>
      `Il VPD è rimasto nella sua fascia il ${v['pct']} % del tempo.`,
    'data.dayOk': (v) =>
      `I giorni hanno fatto in media ${v['t']} °C, dentro ${v['min']}–${v['max']} °C.`,
    'data.dayOff': (v) =>
      `I giorni hanno fatto in media ${v['t']} °C, fuori da ${v['min']}–${v['max']} °C.`,
    'data.nightOk': (v) =>
      `Le notti hanno fatto in media ${v['t']} °C, dentro ${v['min']}–${v['max']} °C.`,
    'data.nightOff': (v) =>
      `Le notti hanno fatto in media ${v['t']} °C, fuori da ${v['min']}–${v['max']} °C.`,
    'data.drain': (v) =>
      `Il drenaggio è stato in media del ${v['pct']} % contro un ${v['plan']} % previsto.`,
    'data.alerts': (v) => `${v['n']} allarmi: vedi l’elenco qui sotto.`,
    'data.noAlerts': (v) => `Nessun allarme (${v['n']}).`,
    'ops.bannedSpray': (v) =>
      `I prodotti di classe OMS ${v['cls']} non sono ammessi: scegli un altro prodotto.`,
    'heat.none': (v) =>
      `Indice di calore ${v['hi']} °C: nessun rischio (${v['rest']} min di pausa, ${v['water']} L all’ora).`,
    'heat.caution': (v) =>
      `Indice di calore ${v['hi']} °C: attenzione. Pausa di ${v['rest']} min ogni ora e bere ${v['water']} L all’ora.`,
    'heat.extremeCaution': (v) =>
      `Indice di calore ${v['hi']} °C: massima attenzione. Pausa di ${v['rest']} min ogni ora e bere ${v['water']} L all’ora.`,
    'heat.danger': (v) =>
      `Indice di calore ${v['hi']} °C: pericolo. Pausa di ${v['rest']} min ogni ora, bere ${v['water']} L all’ora, niente lavori pesanti.`,
    'heat.extremeDanger': (v) =>
      `Indice di calore ${v['hi']} °C: pericolo estremo. Sospendere il lavoro dentro (${v['rest']} min di pausa, ${v['water']} L all’ora).`,
    'energy.share': (v) =>
      `La cogenerazione copre il ${v['pct']} % del calore del giorno; la caldaia aggiunge ${v['boiler']} MWh.`,
    'energy.dump': (v) =>
      `${v['mwh']} MWh di calore di cogenerazione vanno dispersi: un accumulo più grande o una marcia più corta li terrebbe.`,
    'energy.buffer': (v) =>
      `L’accumulo conserva ${v['mwh']} MWh per portare il calore del giorno nella notte.`,
    'energy.co2Enough': (v) =>
      `I fumi della cogenerazione danno ${v['kg']} kg di CO₂, abbastanza per i ${v['need']} kg assorbiti dalla coltura.`,
    'energy.co2Short': (v) =>
      `I fumi della cogenerazione danno ${v['kg']} kg di CO₂, meno dei ${v['need']} kg assorbiti: aggiungi CO₂ liquida o fai girare più a lungo.`,
    'energy.ventsShut': () =>
      'La CO₂ da cogenerazione rende solo con le aperture quasi chiuse (oltre circa il 5 % non si tiene): pianificala per i giorni d’inverno.',
    'reuse.heat': (v) =>
      `Ogni m³ raffreddato contiene ${v['kwh']} kWh: ${v['mwh']} MWh al giorno da recuperare.`,
    'reuse.cover': (v) =>
      `Copre il ${v['pct']} % del fabbisogno di calore del giorno d’inverno.`,
    'reuse.heatPump': () =>
      'Tra 15 e 40 °C questo calore richiede una pompa di calore o un circuito a bassa temperatura.',
    'econ.margin': (v) => `Un margine del ${v['pct']} % dei ricavi.`,
    'econ.loss': (v) => `I costi superano i ricavi (margine ${v['pct']} %).`,
    'econ.biggest.labour': (v) =>
      `La manodopera è il costo maggiore: ${v['pct']} %.`,
    'econ.biggest.energy': (v) =>
      `L’energia è il costo maggiore: ${v['pct']} %.`,
    'econ.biggest.water': (v) => `L’acqua è il costo maggiore: ${v['pct']} %.`,
    'econ.biggest.inputs': (v) =>
      `Concimi e difesa sono il costo maggiore: ${v['pct']} %.`,
    'econ.biggest.other': (v) =>
      `Confezionamento e spese generali sono il costo maggiore: ${v['pct']} %.`,
    'econ.payback': (v) =>
      `La costruzione rientra in circa ${v['years']} anni.`,
    'econ.prices': () =>
      'I prezzi sono esempi (il pomodoro esportato valeva 1,24–1,94 EUR/kg da gennaio ad aprile 2016): inserisci i tuoi.',
    'ro.balance': (v) =>
      `${v['feed']} m³ di acqua di mare al giorno danno il permeato e ${v['brine']} m³ di salamoia a ${v['salinity']} g/L.`,
    'ro.recoveryHigh': (v) =>
      `Recupero del ${v['pct']} %: oltre il 50 % la salamoia incrosta le membrane; verifica il limite del fornitore.`,
    'ro.short': (v) =>
      `L’impianto copre solo il ${v['pct']} % del fabbisogno: mancano ${v['m3']} m³ al giorno. Aggiungi capacità o accumulo.`,
    'ro.headroom': (v) =>
      `L’impianto ha un margine del ${v['pct']} % sul giorno di punta.`,
    'ro.lowSec': () =>
      'Sotto 2,5 kWh/m³ è meno di quanto raggiunga l’osmosi di acqua di mare; verifica il dato.',
    'ro.highSec': () =>
      'Oltre 4,5 kWh/m³: un recuperatore di energia lo porterebbe a 3–4.',
    'ro.product': (v) =>
      `Il permeato contiene circa ${v['mg']} mg/L di sale (EC ${v['ec']} dS/m); il suo sodio decide quanto dura il circuito nutritivo.`,
    'ro.brine': () =>
      'La salamoia torna in mare tramite un diffusore, con autorizzazione allo scarico; progetta lo scarico con l’autorità.',
    'fert.water': (v) =>
      `${v['reused']} m³ di drenaggio riutilizzati al giorno: il ${v['pct']} % dell’acqua data.`,
    'fert.drainHigh': (v) =>
      `EC del drenaggio ${v['ec']} dS/m, al tetto di ${v['max']} o sopra: aumenta il drenaggio o scarica.`,
    'fert.yield': (v) =>
      `Una EC radicale di ${v['ec']} dS/m costa circa il ${v['pct']} % della resa (indicativo).`,
    'fert.flush': (v) =>
      `Il sodio raggiunge ${v['na']} mmol/L in circa ${v['days']} giorni: scarica il circuito allora.`,
    'fert.levels': (v) =>
      `Il sodio si stabilizza a ${v['na']} mmol/L, sotto il limite: nessuno scarico per il sodio.`,
    'fert.saltySource': () =>
      'Acqua dolce con più di 3 mmol/L di sodio riempie presto il circuito di sale: miscela con acqua osmotizzata o scarica più drenaggio.',
    'fert.lowDrain': () =>
      'Meno del 20 % di drenaggio con acqua salata: i sali si accumulano nelle lastre.',
    'fert.disinfect': () =>
      'Disinfetta il drenaggio riutilizzato (UV, calore o filtro a sabbia lento) prima di ridarlo alla coltura.',
    'vpd.tooWet': (v) =>
      `VPD ${v['vpd']} kPa: sotto ${v['min']} kPa per questa fase, l’aria è troppo umida.`,
    'vpd.good': (v) =>
      `VPD ${v['vpd']} kPa: dentro la fascia ${v['min']}–${v['max']} kPa di questa fase.`,
    'vpd.tooDry': (v) =>
      `VPD ${v['vpd']} kPa: sopra ${v['max']} kPa per questa fase, l’aria è troppo secca.`,
    'vpd.disease': () => 'Sotto 0,3 kPa: botrite, oidio e crescita molle.',
    'vpd.wilting': () =>
      'Sopra 1,5 kPa la coltura appassisce: ombreggia e aggiungi umidità.',
    'vpd.arid': () =>
      '3 kPa o più: aria del deserto, la crescita si ferma. Nebbia o pannelli, e ombreggio.',
    'vpd.cold': (v) =>
      `Sotto ${v['min']} °C per questa fase: riscalda prima di ventilare.`,
    'vpd.hot': (v) =>
      `Sopra ${v['max']} °C per questa fase: ombreggia e raffresca.`,
    'vpd.outsideWetter': () =>
      'L’aria esterna contiene più acqua di quella interna: ventilare non asciuga la serra, riscaldare sì.',
    'vpd.samePairs': (v) =>
      `Uno stesso VPD vale per molte coppie: ${v['vpd']} kPa richiede aria più secca a 15 °C che a 35 °C, quindi leggi temperatura e umidità insieme.`,
    'fog.cooling': (v) =>
      `La nebbia porta la serra a ${v['inside']} °C, ${v['drop']} K sotto l’esterno, al ${v['rh']} % di umidità.`,
    'fog.tooHumid': () =>
      'La serra supera il tetto di umidità senza nebbia: nebulizzare bagnerebbe solo la coltura.',
    'fog.moreNozzles': () =>
      'Gli ugelli funzionano di continuo sotto il tetto: più ugelli raffrescherebbero di più.',
    'fog.cycle': (v) =>
      `${v['on']} s acceso e ${v['off']} s spento tengono l’aria vicino al ${v['rh']} % (60 s acceso e 180 s spento è un inizio comune).`,
    'fog.lowPressure': () =>
      'Sotto 40 bar le gocce sono troppo grandi per evaporare in aria: bagnano le foglie.',
    'fog.droplets': () =>
      'L’alta pressione dà gocce di 10–30 µm che evaporano prima di cadere.',
    'fog.trimVents': () =>
      'Le aperture spalancate portano via la nebbia: riducile al 5–15 % del suolo mentre nebulizzi.',
    'fog.waterQuality': () =>
      'Usa acqua dissalata o addolcita: i sali intasano gli ugelli e macchiano i frutti.',
    'advice.notBuildable': (v) =>
      `${v['pct']} % del suolo in aperture e ${v['flow']} milioni di m³/h d’aria: più di quanto apra un tetto (al massimo circa il ${v['limit']} %).`,
    'advice.vents': () => 'Le aperture al colmo bastano per questo pomeriggio.',
    'advice.ventsAndShade': (v) =>
      `Con il ${v['shade']} % di ombreggio le aperture richiedono il ${v['pct']} % del suolo: prima ombreggia.`,
    'advice.shadeAndFog': (v) =>
      `Il ${v['shade']} % di ombreggio e la nebbia tengono la serra vicino a ${v['inside']} °C con le aperture ridotte. La nebbia si adatta alle serre lunghe e grandi.`,
    'advice.shadeAndPad': (v) =>
      `Il ${v['shade']} % di ombreggio e i pannelli: l’aria esce dal pannello bagnato vicino a ${v['pad']} °C. Con ${v['length']} m la serra è abbastanza corta per i pannelli.`,
    'advice.humid': () =>
      'Aria umida fuori: l’evaporazione raffresca poco. Ombreggia, e raffresca di notte.',
    'calendar.season': (v) =>
      `Trapiantata nella settimana ${v['plant']}, la coltura finisce nella settimana ${v['end']}: ${v['weeks']} settimane in serra.`,
    'calendar.harvest': (v) =>
      `Raccolta dalla settimana ${v['first']}, per ${v['weeks']} settimane.`,
    'calendar.heating': (v) =>
      `Riscaldamento dalla settimana ${v['from']}, ${v['weeks']} settimane all’anno.`,
    'calendar.co2': (v) =>
      `La CO₂ rende in ${v['weeks']} settimane, quando la serra resta chiusa.`,
    'calendar.fog': (v) =>
      `Nebbia o pannelli per ${v['weeks']} settimane di pomeriggi caldi.`,
    'calendar.shade': (v) =>
      `Ombreggio per ${v['weeks']} settimane di sole forte.`,
    'calendar.shortCleanOut': (v) =>
      `Solo ${v['weeks']} settimane tra due colture: poco tempo per pulire e disinfettare.`,
    'geometry.lowGutter': (v) =>
      `Gronda a ${v['gutter']} m: una serra bassa si scalda e resta umida. 4 m o più tamponano meglio.`,
    'geometry.goodVolume': (v) =>
      `Altezza media ${v['height']} m: aria sufficiente a tamponare calore e umidità.`,
    'geometry.flatRoof': (v) =>
      `Pendenza del tetto ${v['slope']}°: sotto circa 20° la condensa gocciola sulla coltura ed entra meno sole d’inverno.`,
    'geometry.longHouse': (v) =>
      `Lunga ${v['length']} m: il raffrescamento con pannelli e ventilatori funziona meglio sotto i 40–50 m tra pannello e ventilatore.`,
    'heat.noLoad': () =>
      'Fuori non fa più freddo che dentro: non serve calore.',
    'heat.perM2': (v) =>
      `${v['w']} W per m² di superficie nella notte di progetto.`,
    'heat.leaky': (v) =>
      `${v['pct']} % del calore esce dalle infiltrazioni: sigilla prima porte, finestre e bordi del film.`,
    'heat.screenOpen': () =>
      'Lo schermo è contato aperto. Chiuderlo nelle notti fredde riduce il carico.',
    'heat.addScreen': () =>
      'Nessuno schermo: uno schermo energetico risparmia il 25–45 % del calore della notte.',
    'year.none': () => 'In un anno medio non serve riscaldare.',
    'year.season': (v) =>
      `Riscaldamento ${v['months']} mesi all’anno, soprattutto a ${v['peak']}.`,
    'year.mostlyNights': (v) =>
      `${v['pct']} % del calore va di notte: uno schermo e una serra ben chiusa si ripagano prima.`,
    'year.screenSaves': () =>
      'Uno schermo energetico ridurrebbe questo valore di un quarto o più.',
    'year.geothermal': () =>
      'Acqua geotermica: nessun combustibile bruciato, solo l’elettricità della pompa.',
    'year.high': (v) =>
      `${v['kwh']} kWh per m²: alto per una serra mediterranea. Controlla le temperature impostate e la copertura.`,
    'pipes.tooCold': () =>
      'L’acqua non è più calda dell’aria: non può scaldare la serra.',
    'pipes.tooMany': (v) =>
      `${v['m']} m di tubo per m² di superficie: troppo da posare. Usa acqua più calda, un tubo più grande o meno gradi.`,
    'pipes.fits': (v) => `${v['m']} m di tubo per m² di superficie: ci sta.`,
    'pipes.smallDrop': () =>
      'Meno di 5 K tra mandata e ritorno: la portata diventa grande; punta a 15–25 K.',
    'pipes.fast': (v) =>
      `${v['v']} m/s in ogni circuito: rumoroso e costoso da pompare. Aggiungi circuiti o usa un tubo più grande.`,
    'pipes.slow': (v) =>
      `${v['v']} m/s in ogni circuito: l’acqua si raffredda lungo il circuito, così il fondo resta più freddo. Meno circuiti, più lunghi, aiutano.`,
    'pipes.peOk': () =>
      'Il tubo in plastica va bene per acqua geotermica fino a circa 70 °C; controllane la classe.',
    'pipes.peHot': () =>
      'Oltre 75 °C è troppo caldo per la maggior parte dei tubi in plastica: usa l’acciaio, o miscela l’acqua.',
    'vent.coverEnough': () =>
      'La copertura da sola smaltisce questo calore: non serve altra ventilazione.',
    'vent.naturalOk': (v) =>
      `Finestre al colmo pari a ${v['pct']} % della superficie: alla portata di una serra normale.`,
    'vent.naturalTight': (v) =>
      `Finestre pari a ${v['pct']} % della superficie: più di quanto apra la maggior parte dei tetti. Aggiungi aperture laterali o ombreggiamento.`,
    'vent.naturalShort': (v) =>
      `Finestre pari a ${v['pct']} % della superficie: la ventilazione naturale non basta. Ombreggia, o usa pannelli e ventilatori.`,
    'vent.extreme': (v) =>
      `${v['ach']} ricambi d’aria all’ora: più di uno al minuto è duro per la coltura. Ombreggia o raffresca per evaporazione.`,
    'vent.hotOutside': () =>
      'Con 30 °C fuori, l’aria da sola non porta la serra sotto l’esterno: vedi Pannelli e ventilatori.',
    'vent.tryShade': () =>
      'Nessun ombreggiamento contato: uno schermo al 30–50 % o l’imbiancatura riducono l’aria necessaria di altrettanto.',
    'pad.cooling': (v) =>
      `Il pannello raffredda l’aria di ${v['drop']} K; esce dalla serra a ${v['exhaust']} °C.`,
    'pad.humid': () =>
      'Aria esterna umida: l’evaporazione raffredda poco. I pannelli rendono meglio sotto circa il 50 % di umidità.',
    'pad.tooLong': (v) =>
      `${v['m']} m dai pannelli ai ventilatori: il fondo resta caldo. Resta sotto i 40–50 m, o raffresca dai due lati.`,
    'pad.fastFace': () =>
      'Aria troppo veloce nel pannello: trascina gocce e l’efficienza cala.',
    'pad.waterQuality': () =>
      'L’acqua salata o dura incrosta i pannelli: scarica parte dell’acqua e controllane la qualità.',
    'water.peak': (v) =>
      `Picco a ${v['month']}: ${v['l']} L per m² al giorno, drenaggio compreso.`,
    'water.highPeak': () =>
      'Oltre 9 L per m² al giorno: controlla il drenaggio e l’ombreggiamento.',
    'water.lowDrain': () =>
      'Drenaggio sotto il 15 %: i sali si accumulano nel substrato, tanto più con acqua salmastra.',
    'water.manyShots': (v) =>
      `${v['shots']} turni al giorno: usa turni più grandi o più gocciolatori.`,
    'water.sections': (v) =>
      `La pompa non può alimentare tutti i gocciolatori insieme: irriga in ${v['sections']} settori.`,
    'rain.coverage': (v) => `Irrigazione coperta dalla pioggia: ${v['pct']} %.`,
    'rain.basinSmall': (v) =>
      `La vasca tracima pioggia che potresti usare: circa ${v['m3']} m³ ne trattengono la maggior parte.`,
    'rain.basinBig': (v) =>
      `Bastano circa ${v['m3']} m³: una vasca più grande aggiunge poco.`,
    'rain.storm': (v) =>
      `Un temporale di ${v['mm']} mm porta ${v['m3']} m³ dal tetto: la vasca dovrebbe contenerne almeno tanti.`,
    'rain.dry': (v) =>
      `${v['mm']} mm di pioggia all’anno: aiuta, ma l’irrigazione ha bisogno di un’altra fonte.`,
    'rain.firstFlush': () =>
      'Scarta i primi millimetri di ogni pioggia: lavano dal tetto polvere ed escrementi di uccelli.',
    'light.none': () =>
      'Il sole raggiunge l’obiettivo ogni mese: non servono lampade.',
    'light.months': (v) =>
      `Le lampade servono ${v['months']} mesi all’anno; ${v['month']} le dimensiona.`,
    'light.highPpfd': (v) =>
      `${v['ppfd']} µmol/m²·s sono molte lampade: abbassa l’obiettivo o accendile più a lungo.`,
    'light.shade': (v) =>
      `Ombreggia ${v['months']} mesi all’anno, fino a ${v['pct']} % a ${v['peak']}.`,
    'light.targetOverCeiling': () =>
      'L’obiettivo supera la soglia d’ombra: alza la soglia o abbassa l’obiettivo.',
    'co2.noLift': () =>
      'L’obiettivo non supera l’esterno: non c’è niente da aggiungere.',
    'co2.leaky': (v) =>
      `${v['pct']} % della CO₂ esce con l’aria: arricchisci con le finestre chiuse, o punta più in basso quando si aprono.`,
    'co2.used': (v) =>
      `Assorbito dalla coltura: ${v['pct']} % di quanto fornisci.`,
    'co2.highTarget': () =>
      'Oltre circa 1000 ppm la coltura guadagna poco in più per la CO₂ aggiunta.',
    'co2.burnerHeat': (v) =>
      `Il bruciatore dà ${v['kw']} kW di calore insieme alla CO₂: accumulalo in un serbatoio tampone per la notte.`,
    'co2.flue': () =>
      'Solo un bruciatore fatto per il dosaggio di CO₂, a gas naturale pulito, con i fumi controllati per CO e NOₓ.',
    'humidity.vpdLow': (v) =>
      `VPD ${v['vpd']} kPa: l’aria è quasi satura, botrite e oidio prosperano. Punta sopra 0,3 kPa.`,
    'humidity.vpdOk': (v) => `VPD ${v['vpd']} kPa: un clima notturno sano.`,
    'humidity.vpdHigh': (v) =>
      `VPD ${v['vpd']} kPa: secco per la notte; la coltura può andare in stress.`,
    'humidity.condensation': (v) =>
      `La copertura è a ${v['surface']} °C, sotto il punto di rugiada (${v['dew']} °C): gocciola sulla coltura. Uno schermo, un po’ d’aria o tubi vicino al tetto aiutano.`,
    'humidity.outsideWetter': () =>
      'L’aria esterna contiene più acqua di quella interna: ventilare non può asciugare la serra. Riscalda, o usa un deumidificatore.',
    'humidity.heat': (v) =>
      `Scaldare l’aria che entra richiede ${v['kw']} kW (${v['wm2']} W/m²).`,
  } as Record<string, NoteWriter>,
};
