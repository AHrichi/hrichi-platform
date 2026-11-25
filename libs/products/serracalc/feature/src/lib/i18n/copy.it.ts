import type { NoteWriter, SerraCopy } from './copy.en';

export const IT: SerraCopy = {
  app: {
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
    tabs: { ventilation: 'Ventilazione', padFan: 'Pannelli e ventilatori' },
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
    tabs: { light: 'Luce', co2: 'CO₂', humidity: 'Umidità' },
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

  calc: {
    results: 'Risultati',
    how: 'Come si calcola',
    inputs: 'Dati',
    table: 'Mostra i numeri',
    dragHint:
      'Trascina le maniglie rotonde, oppure seleziona una e usa i tasti freccia.',
  },

  diagrams: {
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
