import type { NoteWriter, SerraCopy } from './copy.en';

export const DE: SerraCopy = {
  app: {
    week: 'Woche',
    weekHint: 'Die aktuelle Kalenderwoche: öffnet den Anbaukalender',
    railNote:
      'Für Wüstenstandorte gemacht: starke Sonne, kalte Nächte, knappes Wasser.',
    name: 'SerraCalc',
    tagline: 'Wärme, Wasser und Klima im Gewächshaus',
    activeProject: 'Aktives Projekt',
    offline: 'Funktioniert offline',
    offlineHint:
      'Projekte werden auf diesem Gerät gespeichert; keine Verbindung nötig.',
    sunlight: 'Sonnenlicht',
    sunlightHint: 'Hoher Kontrast, um den Bildschirm im Freien zu lesen',
    dark: 'Dunkel',
    darkHint: 'Dunkles Design',
    language: 'Sprache',
    sections: 'Bereiche von SerraCalc',
    planningAid:
      'Eine Planungshilfe: Prüfen Sie die Ergebnisse mit einer Fachingenieurin oder einem Fachingenieur und den Daten der Lieferanten, bevor Sie bauen.',
  },
  nav: {
    operations: 'Betrieb',
    data: 'Live-Daten',
    site: 'Standort',
    energy: 'Energie',
    supply: 'Wasserversorgung',
    science: 'Wissen',
    calendar: 'Anbaukalender',
    projects: 'Projekte',
    greenhouse: 'Gewächshaus',
    heating: 'Heizung',
    cooling: 'Kühlung',
    water: 'Wasser',
    climate: 'Klima',
    guide: 'Anleitung',
    air: 'Licht & Luft',
    report: 'Bericht',
    more: 'Mehr',
  },
  navGroups: {
    operate: 'Betreiben',
    plan: 'Planen',
    climate: 'Klimaregelung',
    water: 'Wasser',
    reference: 'Nachschlagen',
  },
  common: {
    close: 'Schließen',
    cancel: 'Abbrechen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    rename: 'Umbenennen',
    save: 'Speichern',
    open: 'Öffnen & bearbeiten',
    yes: 'Ja',
    no: 'Nein',
    next: '→',
    none: '—',
  },
  months: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
  monthsShort: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],

  shapes: {
    gable: 'Mehrschiffig, Satteldächer',
    venlo: 'Venlo-Glashaus',
    tunnel: 'Folientunnel (Bogendach)',
  },
  covers: {
    glass_single: 'Einfachglas',
    glass_double: 'Doppelglas',
    pe_single: 'Einfachfolie (PE)',
    pe_double: 'Aufgeblasene Doppelfolie (PE)',
    pc_twin: 'Polycarbonat, Stegdoppelplatte',
    pc_triple: 'Polycarbonat, Stegdreifachplatte',
    acrylic_double: 'Acrylglas, doppelt',
  },
  screens: {
    none: 'Kein Schirm',
    clear: 'Transparenter Energieschirm',
    shade_energy: 'Schattier- und Energieschirm',
    aluminised: 'Aluminiumschirm',
  },
  crops: {
    tomato: 'Tomate',
    cucumber: 'Gurke',
    pepper: 'Paprika',
    melon: 'Melone',
    strawberry: 'Erdbeere',
    lettuce: 'Salat',
    rose: 'Rose',
  },
  fuels: {
    natural_gas: 'Erdgas',
    lpg: 'Flüssiggas (Propan)',
    fuel_oil: 'Heizöl / Diesel',
    heat_pump: 'Wärmepumpe (Strom)',
    geothermal: 'Thermalwasser',
    biomass: 'Biomasse (Pellets, Oliventrester)',
  },
  fuelUnits: { m3: 'm³', kg: 'kg', L: 'L', kWh: 'kWh' },
  pipes: {
    steel_51: 'Stahlrohr (Rohrschiene), 51 mm',
    steel_33: 'Stahlrohr, 33,7 mm',
    pe_40: 'Kunststoffrohr (PE/PP), 40 mm',
    pe_32: 'Kunststoffrohr (PE/PP), 32 mm',
    pe_25: 'Kunststoffrohr (PE/PP), 25 mm',
  },
  currencies: {
    TND: 'Tunesischer Dinar',
    EUR: 'Euro',
    USD: 'US-Dollar',
  },

  fields: {
    sourceClMmolL: 'Chlorid im Frischwasser',
    sourceHco3MmolL: 'Hydrogencarbonat im Frischwasser',
    clLimitMmolL: 'Spülen über Chlorid',
    coolFromC: 'Kühlen über (außen)',
    fullAtK: 'Volle Luftmenge, über dem Start um',
    airflowM3hM2: 'Volle Luftmenge',
    fanWPerM3h: 'Lüfterleistung je m³/h',
    pumpWm2: 'Pumpen für Pads oder Nebel',
    emptyFromWeek: 'Haus leer ab Woche',
    emptyWeeks: 'Wochen leer',
    gridCo2KgKwh: 'CO₂ des Stromnetzes',
    gasPerM3: 'Gas',
    electricityPerKwh: 'Strom bezogen',
    exportPerKwh: 'Strom verkauft',
    waterPerM3: 'Wasser',
    lossCoefficientWK: 'Wärmeverlust je Kelvin',
    outsideMinC: 'Außen, Nachttief',
    outsideMaxC: 'Außen, Nachmittagshoch',
    chpElectricKw: 'BHKW-Strom',
    chpThermalKw: 'BHKW-Wärme',
    chpElectricPct: 'Elektrischer Wirkungsgrad',
    chpStartHour: 'BHKW startet um',
    chpEndHour: 'BHKW stoppt um',
    bufferM3: 'Pufferspeicher',
    bufferDeltaK: 'Temperaturspanne des Puffers',
    boilerEfficiencyPct: 'Kesselwirkungsgrad',
    co2NeedKgH: 'Von der Kultur aufgenommenes CO₂',
    powerPrice: 'Preis des verkauften Stroms',
    waterM3Day: 'Gekühltes Wasser pro Tag',
    inC: 'Wasser zu',
    outC: 'Wasser ab',
    heatDemandKwhDay: 'Wärmebedarf an dem Tag',
    areaHa: 'Fläche',
    yieldTHa: 'Ertrag',
    pricePerKg: 'Erzielter Preis',
    labourDaysHa: 'Arbeit',
    wagePerDay: 'Tageslohn',
    heatMwhYear: 'Wärme pro Jahr',
    heatPricePerMwh: 'Wärmepreis',
    waterM3Year: 'Wasser pro Jahr',
    waterPricePerM3: 'Wasserpreis',
    inputsPerM2: 'Dünger und Pflanzenschutz',
    otherPerM2: 'Verpackung und Gemeinkosten',
    capexPerM2: 'Baukosten',
    demandM3Day: 'Wasserbedarf am Spitzentag',
    lossesPct: 'Verluste',
    feedSalinityGL: 'Salzgehalt des Meerwassers',
    recoveryPct: 'Ausbeute',
    rejectionPct: 'Salzrückhalt',
    secKwhM3: 'Spezifische Energie',
    storageDays: 'Speicher',
    capacityM3Day: 'Installierte Leistung',
    availabilityPct: 'Laufzeit',
    appliedM3Day: 'Gegebenes Wasser pro Tag',
    recyclePct: 'Wiederverwendeter Drain',
    sourceEcDsM: 'EC des Frischwassers',
    sourceNaMmolL: 'Natrium im Frischwasser',
    targetEcDsM: 'EC am Tropfer',
    uptakeEcDsM: 'Von der Kultur aufgenommene EC',
    flushEcDsM: 'Spülen über EC',
    naLimitMmolL: 'Spülen über Natrium',
    systemM3: 'Wasser im Kreislauf',
    dilution: 'Verdünnung der Stammlösung',
    stockTankM3: 'Jeder Stammlösungstank',
    yieldSlopePct: 'Ertragsverlust je dS/m',
    yieldThresholdEc: 'Verluste ab',
    rhPct: 'Relative Luftfeuchte',
    ventPct: 'Geöffnete Lüftung',
    nozzlesPer100M2: 'Düsen',
    nozzleLh: 'Durchfluss je Düse',
    pressureBar: 'Pumpendruck',
    onS: 'Nebelstoß',
    maxRhPct: 'Feuchtegrenze',
    plantingWeek: 'Pflanzwoche',
    nurseryWeeks: 'Wochen in der Anzucht',
    vegetativeWeeks: 'Pflanzung bis erste Blüten',
    floweringWeeks: 'Blüten bis erste Ernte',
    cropWeeks: 'Pflanzung bis Kulturende',
    ventilateAboveC: 'Lüftung öffnet über',
    coolAboveC: 'Nebel über (außen)',
    spans: 'Schiffe',
    spanWidthM: 'Schiffbreite',
    lengthM: 'Länge',
    gutterHeightM: 'Traufhöhe',
    ridgeHeightM: 'Firsthöhe',
    floorAreaM2: 'Grundfläche',
    coverAreaM2: 'Hüllfläche',
    volumeM3: 'Luftvolumen',
    perimeterM: 'Umfang',
    uValue: 'U-Wert der Eindeckung',
    airChangesPerHour: 'Luftundichtheit',
    screenSavingPct: 'Einsparung durch den Schirm',
    insideC: 'Innen, nachts',
    outsideDesignC: 'Kälteste Nacht draußen',
    marginPct: 'Sicherheitszuschlag',
    nightSetC: 'Nachtsollwert',
    daySetC: 'Tagsollwert',
    transmissionPct: 'Lichtdurchlässigkeit',
    solarGainPct: 'Sonne, die die Luft erwärmt',
    efficiencyPct: 'Wirkungsgrad (COP × 100)',
    fuelPrice: 'Preis pro Einheit',
    heatDemandKw: 'Zu liefernde Wärme',
    supplyC: 'Vorlauf',
    returnC: 'Rücklauf',
    airC: 'Lufttemperatur',
    loopLengthM: 'Länge eines Kreises',
    pumpHeadM: 'Förderhöhe der Pumpe',
    pumpEfficiencyPct: 'Wirkungsgrad der Pumpe',
    annualHeatKwh: 'Wärme im Jahr',
    radiationWm2: 'Sonnenstrahlung draußen',
    shadingPct: 'Schattierung',
    evapotranspirationPct: 'Sonne, die die Kultur zur Transpiration nutzt',
    outsideC: 'Außentemperatur',
    maxRiseK: 'Erlaubte Erwärmung über außen',
    windMs: 'Windgeschwindigkeit',
    ventOpeningM: 'Öffnung der Lüftungsklappen',
    fanCapacityM3h: 'Luft je Ventilator',
    outsideRhPct: 'Außenluftfeuchte',
    padEfficiencyPct: 'Wirkungsgrad des Pads',
    riseK: 'Erwärmung vom Pad zu den Ventilatoren',
    padFaceVelocityMs: 'Luftgeschwindigkeit durch das Pad',
    padHeightM: 'Pad-Höhe',
    padToFanM: 'Pad bis Ventilatoren',
    hoursPerDay: 'Stunden am Tag',
    cropAreaPct: 'Bepflanzte Fläche',
    transpirationPct: 'Sonne, die zu Transpiration wird',
    canopyPct: 'Bestandesdeckung',
    drainPct: 'Drain / Verluste',
    plantsPerM2: 'Pflanzen pro m²',
    emittersPerPlant: 'Tropfer pro Pflanze',
    emitterLh: 'Tropferleistung',
    shotMl: 'Gabe pro Tropfer',
    pumpM3h: 'Pumpenförderstrom',
    catchmentM2: 'Dachfläche zum Becken',
    runoffPct: 'Abfluss, der das Becken erreicht',
    basinM3: 'Beckengröße',
    targetDli: 'Ziellicht (DLI)',
    maxDli: 'Schattieren über (DLI)',
    lampHours: 'Lampenstunden am Tag',
    efficacyUmolJ: 'Effizienz der Leuchte',
    fixtureW: 'Leistung der Leuchte',
    electricityPrice: 'Strompreis',
    co2KgPerKwh: 'CO₂ des Stromnetzes',
    targetPpm: 'CO₂-Ziel',
    outsidePpm: 'CO₂ draußen',
    uptakeGm2h: 'Aufnahme durch die Kultur',
    daysPerYear: 'Tage im Jahr',
    burnerEfficiencyPct: 'Wirkungsgrad des Brenners',
    co2Price: 'Preis für Flüssig-CO₂',
    gasPrice: 'Gaspreis',
    insideRhPct: 'Höchste Luftfeuchte innen',
    transpirationGm2h: 'Nächtliche Transpiration',
    nightHours: 'Nachtlänge',
  } as Record<string, string>,
  hints: {
    sourceClMmolL: 'UO-Wasser: etwa so viel wie Natrium',
    sourceHco3MmolL: 'UO-Wasser: unter 0,5; Brunnen: 2–6, laut Analyse',
    clLimitMmolL: 'Richtwert: etwa 10 im Drain; fragen Sie Ihre Beratung',
    coolFromC: 'Lüfter und Pads starten; darunter reichen die Lüftungsklappen',
    airflowM3hM2: 'Pad und Lüfter: 120–150 m³/h je m² Boden',
    fanWPerM3h:
      'Lüftertest oder Datenblatt beim Druck der Pads: etwa 0,03–0,04',
    pumpWm2: 'Padpumpen: etwa 0,4 W je m² Boden',
    emptyWeeks: 'Zwischen zwei Kulturen, wie im Kulturkalender',
    gridCo2KgKwh: 'Der Wert Ihres Netzes; 0,45 ist ein Beispiel',
    waterPerM3: 'Gekauft, oder die Vollkosten Ihres UO-Wassers',
    exportPerKwh: 'Was das Netz für den BHKW-Strom zahlt',
    chpElectricKw: 'Wüstenbetriebe: etwa 10 MW für 50 ha (20 W/m²)',
    chpStartHour:
      'Tagsüber laufen, wenn das CO₂ bei geschlossener Lüftung genutzt wird',
    bufferM3: 'Üblich 50–100 m³ je Hektar',
    bufferDeltaK: '90 → 50 °C: 40 K',
    inC: 'Tiefe Brunnen im Süden liefern Wasser mit etwa 40 °C',
    yieldTHa: 'Glashaustomate in der Wüste: etwa 250 t/ha',
    labourDaysHa: 'Geschützte Tomate: etwa 1.000 Tage/ha (Studie 2018)',
    pricePerKg: 'Exporttomaten erzielten 1,24–1,94 EUR/kg, Januar–April 2016',
    capexPerM2: 'Ihr eigenes Angebot; dies ist ein Beispiel',
    feedSalinityGL: 'Das Meer vor Gabès: 39–40 g/L',
    recoveryPct: 'Meerwasser-UO: 40–50 %; darüber steigt die Sole schnell',
    secKwhM3: 'Üblich 3–4 mit Energierückgewinnung; mit dem Lieferanten klären',
    storageDays: 'Ein bis drei Tage überbrücken einen Reinigungsstopp',
    recyclePct: 'Wüstenbetriebe nutzen 30–50 % ihres Wassers wieder',
    targetEcDsM: 'Tomate, Nachfülllösung: etwa 2,7',
    flushEcDsM: 'Eine übliche Obergrenze: 4,5',
    naLimitMmolL: 'Tomate: etwa 8 mmol/L im Drain',
    systemM3: 'Matten, Rohre und Tanks: etwa 4 L je m²',
    yieldSlopePct: 'Richtwert: 7,3 % aus einem Versuch; eigenen Wert setzen',
    ventPct: 'Beim Nebeln die Lüftung drosseln: 5–15 % der Fläche',
    nozzlesPer100M2: '27 Düsen mit 5,4 L/h geben etwa 24 g/m² pro Minute',
    pressureBar: 'Hochdruck, 40–70 bar, für Tröpfchen von 10–30 µm',
    onS: 'Die Pause danach wird so berechnet, dass die Grenze hält',
    maxRhPct: '65–75 % zu halten sparte etwa 21 % Wasser',
    plantingWeek: 'Tomatenbetriebe in der Wüste pflanzen um Woche 36',
    nurseryWeeks: 'Tomatenjungpflanzen: etwa 7 Wochen',
    floweringWeeks: 'Tomate: etwa 8 Wochen',
    cropWeeks: 'Woche 36 bis Woche 29: 46 Wochen',
    coolAboveC: 'Heißere Nachmittage brauchen Nebel oder Pads',
    spanWidthM: 'Üblich: 8, 9,6 oder 12,8 m',
    gutterHeightM: 'Höhere Häuser puffern Wärme und Feuchte besser',
    uValue:
      'Aus der Eindeckung übernommen; Ihr Lieferant nennt evtl. einen anderen',
    airChangesPerHour:
      'Luftwechsel pro Stunde: 0,5 dichte Folie bis 2 altes Glas',
    screenSavingPct:
      'Transparent 25 %, Schattier-/Energie 35 %, Aluminium 45 %',
    outsideDesignC: 'Eine kalte Nacht, die fast jeden Winter wiederkommt',
    marginPct: 'Für Wind, klaren Himmel und Rohrverluste',
    transmissionPct:
      'Durch Eindeckung und Konstruktion; staubige Folie verliert 10–20 %',
    solarGainPct: 'Etwa die Hälfte des Lichts innen erwärmt die Luft',
    efficiencyPct: 'Kessel 85–95 %; Wärmepumpe COP 3 = 300',
    fuelPrice: 'Ihr eigener Tarif, in der Währung des Projekts',
    heatDemandKw:
      'Startet mit der Spitzenlast; die Schaltfläche oben übernimmt sie erneut',
    supplyC: 'Thermalbrunnen liefern hier 60–75 °C',
    loopLengthM: 'Hin und zurück entlang des Hauses',
    annualHeatKwh:
      'Für die Wassermenge; die Schaltfläche oben übernimmt den Jahreswert',
    radiationWm2: 'Mittags im Sommer, auf die Horizontale',
    evapotranspirationPct: 'Etwa 50 % bei vollem Bestand, 0 im leeren Haus',
    maxRiseK: '3–5 K sind üblich',
    ventOpeningM: 'Höhe der offenen Klappe',
    fanCapacityM3h: 'Bei etwa 30 Pa, aus der Ventilatorkennlinie',
    padEfficiencyPct: '75–85 % bei sauberem Pad',
    padFaceVelocityMs: '1,25 m/s bei 100-mm-Pads, 1,75 bei 150 mm',
    padToFanM: 'Unter 40–50 m bleiben',
    transpirationPct: 'Voller Bestand: etwa 65 %',
    canopyPct: 'Junge Pflanzen 30 %, voller Bestand 100 %',
    drainPct: 'Substratkultur 20–35 %; mehr bei salzigem Wasser',
    shotMl: 'Meist 100–200 mL',
    runoffPct: 'Glas 85 %, Folie 80 %, nach dem ersten Spülstoß',
    targetDli: 'Tomate 20–30, Salat 12–17, Erdbeere 15–20',
    maxDli: 'Darüber schattieren; Salat verbrennt über etwa 17',
    lampHours: 'Meist 12–18 h',
    efficacyUmolJ: 'LED 2,5–3,2, Natriumdampflampen etwa 1,8',
    co2KgPerKwh: 'Tunesisches Netz: etwa 0,47',
    targetPpm: 'Der meiste Gewinn kommt bis 800–1000 ppm',
    uptakeGm2h: 'Volle Sonne, voller Bestand: 2–4',
    insideRhPct: 'Über 85–90 % nachts lädt Botrytis ein',
    transpirationGm2h: 'Tomate nachts: etwa 10–20',
  } as Record<string, string>,

  context: {
    from: 'Aus',
    defaultHouse: 'Beispielhaus, Monastir, Tomate',
    reset: 'Aus dem Projekt neu laden',
    house: 'Das Haus',
    sun: 'Sonne und Haus',
    demand: 'Was die Kultur braucht',
  },

  projects: {
    title: 'Projekte',
    lead: 'Jedes Gewächshaus: Haus, Klima und Kultur, und jedes in den Werkzeugen gespeicherte Ergebnis.',
    new: 'Neues Projekt',
    newTitle: 'Neues Projekt',
    editTitle: 'Projekt bearbeiten',
    create: 'Projekt anlegen',
    saveChanges: 'Änderungen speichern',
    loading: 'Projekte werden geladen…',
    switch: 'Projekt',
    name: 'Projektname',
    site: 'Standort',
    climate: 'Klima',
    crop: 'Kultur',
    currency: 'Währung',
    shape: 'Haustyp',
    cover: 'Eindeckung',
    screen: 'Schirm',
    insulated: 'Gedämmter Sockel',
    required: 'Geben Sie dem Projekt einen Namen.',
    emptyTitle: 'Noch kein Projekt',
    emptyLead:
      'Legen Sie ein Projekt für Ihr Gewächshaus an, oder laden Sie die Beispiele, um die Werkzeuge erst auszuprobieren. Die Rechner funktionieren auch ohne; zum Speichern von Ergebnissen brauchen Sie ein Projekt.',
    samples: 'Beispielprojekte laden',
    deleteConfirm: (title: string) =>
      `„${title}“ und seine gespeicherten Ergebnisse löschen? Das lässt sich nicht rückgängig machen.`,
    floor: 'Fläche',
    saved: 'Gespeicherte Ergebnisse',
    savedEmpty:
      'Noch nichts gespeichert. Jeder Rechner hat unten eine Schaltfläche Speichern.',
    renameTitle: 'Ergebnis umbenennen',
    renameLabel: 'Name',
    deleteResult: (label: string) => `„${label}“ löschen?`,
  },
  kinds: {
    coolingYear: 'Kühlung übers Jahr',
    energy: 'Energiezentrale (BHKW)',
    heatReuse: 'Wärme aus gekühltem Wasser',
    economics: 'Wirtschaftlichkeit',
    ro: 'Meerwasser-Umkehrosmose',
    fertigation: 'Fertigation und Drain',
    vpd: 'Feuchte und VPD',
    fog: 'Hochdrucknebel',
    calendar: 'Anbaukalender',
    heatPeak: 'Heizlast (Spitze)',
    heatYear: 'Heizung übers Jahr',
    hotWater: 'Warmwasserrohre',
    ventilation: 'Lüftung',
    padFan: 'Pad-and-Fan-Kühlung',
    cropWater: 'Wasser für die Kultur',
    rainwater: 'Regenwasser',
    light: 'Belichtung und Schattierung',
    co2: 'CO₂-Düngung',
    humidity: 'Nächtliche Luftfeuchte',
  },

  greenhouse: {
    title: 'Gewächshaus',
    lead: 'Das Haus, von dem jeder Rechner ausgeht: Grundfläche, Hülle und Luftvolumen.',
    sectionAlt: (spans: string, width: string, gutter: string, ridge: string) =>
      `Querschnitt: ${spans} Schiffe zu ${width} m, Traufe ${gutter} m, First ${ridge} m`,
    saveToProject: 'Im Projekt speichern',
    savedToProject: 'Im Projekt gespeichert.',
    noProject:
      'Nicht gespeichert: Legen Sie ein Projekt an, um dieses Haus zu behalten.',
    floor: 'Grundfläche',
    cover: 'Hüllfläche',
    volume: 'Luftvolumen',
    meanHeight: 'Mittlere Höhe',
    coverRatio: 'Hülle / Grundfläche',
    perimeter: 'Umfang',
    roof: 'Dach',
    sideWalls: 'Seitenwände',
    gables: 'Giebelwände',
    width: 'Breite',
    formulas: {
      floor: 'Grundfläche = Schiffe × Schiffbreite × Länge',
      roof: 'Dach: jede Dachfläche √((b/2)² + h²), oder eine halbe Ellipse beim Bogen',
      ends: 'Giebel: Wände bis zur Traufe, plus ein Dreieck (oder eine halbe Ellipse) je Dach',
      volume: 'Volumen = Grundfläche × Traufe + Dachquerschnitt × Länge',
    },
  },

  heating: {
    title: 'Heizung',
    lead: 'Die Heizanlage auslegen, ein Jahr Brennstoff zählen und Warmwasserrohre für Thermalwasser oder einen Kessel verlegen.',
    tabs: {
      peak: 'Spitzenlast',
      year: 'Übers Jahr',
      pipes: 'Warmwasserrohre',
    },
    cover: 'Eindeckung',
    screen: 'Schirm',
    insulated: 'Gedämmter Sockel',
    screenClosed: 'Schirm in der kältesten Nacht geschlossen',
    designNight: (place: string, t: string) =>
      `Auslegungsnacht in ${place}: ${t} °C`,
    climate: 'Klima',
    fuel: 'Brennstoff',
    pipe: 'Rohr',
    designKw: 'Heizanlage',
    totalKw: 'Wärmeverlust',
    perM2: 'Pro m² Grundfläche',
    deltaT: 'Innen − außen',
    breakdown: 'Wohin die Wärme geht',
    parts: {
      transmission: 'Durch die Eindeckung',
      infiltration: 'Undichtheiten',
      perimeter: 'Sockel',
    },
    annual: 'Wärme im Jahr',
    perM2Year: 'Pro m² und Jahr',
    fuelYear: 'Brennstoff im Jahr',
    cost: 'Brennstoffkosten im Jahr',
    co2: 'CO₂ im Jahr',
    monthly: 'Wärme je Monat, Nacht und Tag',
    night: 'Nacht',
    day: 'Tag',
    monthlyAlt: (peak: string, total: string) =>
      `Balkendiagramm der Wärme je Monat; Spitze im ${peak}; ${total} MWh im Jahr`,
    flow: 'Wasserstrom',
    perMetre: 'Wärme pro Meter Rohr',
    pipeLength: 'Zu verlegendes Rohr',
    perM2Pipe: 'Rohr pro m² Grundfläche',
    loops: 'Heizkreise',
    velocity: 'Geschwindigkeit in einem Kreis',
    pump: 'Pumpenleistung',
    waterYear: 'Wasser im Jahr',
    usePeak: (kw: string) => `Spitzenlast übernehmen (${kw} kW)`,
    useYear: (kwh: string) => `Jahreswert übernehmen (${kwh} kWh)`,
    formulas: {
      transmission: 'Eindeckung: U × A × ΔT',
      infiltration: 'Undichtheiten: 0,335 × N × V × ΔT',
      perimeter: 'Sockel: F × Umfang × ΔT',
      design: 'Anlage = Summe × (1 + Zuschlag)',
      night:
        'Nacht (Januar): Verluste × (Sollwert − Nachtmittel) × Stunden × Tage',
      day: 'Tag (Januar): Verluste × (Sollwert − Tagesmittel) × Stunden − Sonne',
      fuel: 'Brennstoff = Wärme / (Energie pro Einheit × Wirkungsgrad)',
      flow: 'Strom = Q / (1,163 × ΔT Wasser)',
      output: 'Pro Meter = π × D × (h_konv + h_rad) × ΔT',
      length: 'Länge = Q / Leistung pro Meter',
      pump: 'Pumpe = ρ × g × Strom × Förderhöhe / Wirkungsgrad',
    },
  },

  cooling: {
    title: 'Kühlung',
    lead: 'Wie viel Luft das Haus an einem sonnigen Tag bewegen muss, die Lüftungsklappen oder Ventilatoren dafür, und Pad-and-Fan-Kühlung für heißes, trockenes Wetter.',
    tabs: { ventilation: 'Lüftung', padFan: 'Pad and Fan', fog: 'Nebel' },
    fogInside: 'Innen mit Nebel',
    ventOnly: 'Nur Lüftung',
    fogRh: 'Feuchte innen',
    fogRate: 'Nebel im Betrieb',
    fogMean: 'Im Mittel',
    fogCycle: 'Takt an / aus',
    fogOn: 'der Zeit an',
    nozzles: 'Düsen',
    padCompare: 'Pads bräuchten',
    solar: 'Sonne, die die Luft erwärmt',
    flow: 'Zu bewegende Luft',
    ach: 'Luftwechsel',
    perM2: 'Pro m² Grundfläche',
    vents: 'Lüftungsöffnung (natürlich)',
    ventShare: 'der Grundfläche',
    fans: 'Ventilatoren (mechanisch)',
    wetBulb: 'Feuchtkugel draußen',
    padOutlet: 'Luft hinter dem Pad',
    exhaust: 'Luft an den Ventilatoren',
    padArea: 'Pad-Fläche',
    padLength: 'Länge der Pad-Wand',
    evaporation: 'Verdunstetes Wasser',
    waterDay: 'Wasser am Tag',
    perHour: 'pro Stunde',
    formulas: {
      fogRate: 'Nebel = Düsen × L/h / Fläche',
      fogBalance:
        'Innen = T_außen + (Sonne − λ × Nebel) / (ρ × cp × Luft + U × A)',
      fogCycle:
        'Takt: der Anteil Nebel, den die Luft unter der Grenze aufnimmt',
      fogWater: 'Wasser = q × A × t / 10⁶',
      solar: 'Sonne = τ × (1 − Schatten) × G × Fläche × (1 − ET)',
      conduction: 'Durch die Eindeckung: U × A × ΔT',
      flow: 'Luft = (Sonne − Hülle) / (ρ × cp × ΔT)',
      vents:
        'Klappen (Boulard & Baille): G = Cd × A/2 × √(2g × ΔT/T × h/4 + Cw × u²)',
      padOutlet: 'Pad: T − η × (T − T_feucht)',
      padFlow: 'Luft = (Sonne + Hülle) / (ρ × cp × Erwärmung)',
      pad: 'Pad-Fläche = Luft / Anströmgeschwindigkeit',
      water: 'Wasser = ρ × Luft × cp × (T − T_Pad) / λ',
    },
  },

  water: {
    title: 'Wasser',
    lead: 'Was die Kultur Monat für Monat trinkt, die Tropfbewässerung dafür, und wie viel davon der Regen vom Dach decken kann.',
    tabs: { crop: 'Wasser für die Kultur', rain: 'Regenwasser' },
    climate: 'Klima',
    peak: 'Spitze, gegeben',
    peakDay: 'Spitzentag, ganzes Haus',
    year: 'Wasser im Jahr',
    perM2Year: 'pro m² Grundfläche',
    emitters: 'Tropfer',
    perEmitter: 'Pro Tropfer, Spitzentag',
    shots: 'Gaben am Tag',
    shotLength: 'Jede Gabe dauert',
    systemFlow: 'Alle Tropfer zugleich',
    sections: 'Bewässerungssektoren',
    monthly: 'Gegebenes Wasser je Monat, L pro m² und Tag',
    monthlyAlt: (peak: string, value: string) =>
      `Balkendiagramm des täglichen Wassers je Monat; Spitze im ${peak} mit ${value} L/m²`,
    rainYear: 'Regen im Jahr',
    harvest: 'Gesammelter Regen',
    demand: 'Bewässerung',
    coverage: 'Regen deckt',
    maxCoverage: (pct: string) =>
      `höchstens ${pct} % mit einem ausreichend großen Becken`,
    suggested: 'Empfohlenes Becken',
    storm: (mm: string, m3: string) => `Ein Starkregen von ${mm} mm: ${m3} m³`,
    rainChart: 'Gesammelter Regen und Bewässerung je Monat, m³',
    rainAlt: (pct: string) =>
      `Balkendiagramm von gesammeltem Regen und Bewässerung je Monat; Regen deckt ${pct} %`,
    table: {
      month: 'Monat',
      harvest: 'Gesammelt',
      demand: 'Bedarf',
      used: 'Genutzt',
      stored: 'Im Becken',
      overflow: 'Überlauf',
    },
    formulas: {
      inside: 'Licht innen = Rg × τ × (1 − Schatten)',
      net: 'Verbrauch der Kultur = k × Bestand × Licht innen / 2,45',
      gross: 'Gegeben = Verbrauch / (1 − Drain)',
      house: 'Haus = gegeben × bepflanzte Fläche',
      drippers: 'Tropfer = bepflanzte Fläche × Pflanzen × Tropfer pro Pflanze',
      shots: 'Gaben = pro Tropfer / Gabe',
      harvest: 'Gesammelt = Regen × Dach × Abfluss',
      basin:
        'Becken: Monat für Monat Regen hinein, Bewässerung hinaus, Überlauf wenn voll',
    },
  },

  air: {
    title: 'Licht & Luft',
    lead: 'Belichtung für die dunklen Monate und Schatten für die hellen, CO₂ für die Kultur, und die Luft, die nachts getauscht werden muss, damit Feuchte und Tropfen gering bleiben.',
    tabs: { light: 'Licht', co2: 'CO₂', humidity: 'Nachtfeuchte', vpd: 'VPD' },
    source: 'CO₂ aus',
    sources: { burner: 'Gasbrenner (Rauchgas)', liquid: 'Flüssig-CO₂-Tank' },
    fixtures: 'Leuchten',
    ppfd: 'Licht der Leuchten',
    energy: 'Leuchten im Jahr',
    co2Grid: 'CO₂ des Stroms',
    shade: 'Stärkste Schattierung',
    shadeMonths: (n: string) => `${n} Monate schattiert`,
    sunDli: 'Sonne innen',
    chart: 'Sonnenlicht innen je Monat, mol/m² am Tag',
    chartAlt: (place: string, target: string) =>
      `Balkendiagramm des täglichen Lichts innen je Monat in ${place}, gegenüber einem Ziel von ${target}`,
    table: { sun: 'Sonne', lamps: 'Lampen h', shade: 'Schatten %' },
    supply: 'Zu lieferndes CO₂',
    used: 'Von der Kultur aufgenommen',
    leak: 'Entweicht',
    year: 'CO₂ im Jahr',
    cost: 'Kosten im Jahr',
    burner: 'Gas für den Brenner',
    air: 'Hereinzuholende Außenluft',
    heat: 'Wärme für diese Luft',
    night: 'Nacht',
    vpd: 'Dampfdruckdefizit',
    dew: 'Taupunkt',
    cover: 'Eindeckung innen',
    water: 'Abzuführendes Wasser',
    formulas: {
      saturation: 'Sättigung: e_s = 0,6108 × exp(17,27 T / (T + 237,3))',
      vpd: 'VPD = e_s × (1 − rF / 100)',
      headroom: 'Reserve = gesättigt − Wasser in der Luft',
      dli: 'Sonne innen = Rg × 0,47 × 4,57 × τ (dunkelster Monat)',
      ppfd: 'PPFD = (Ziel − Sonne) × 10⁶ / (Stunden × 3600)',
      fixtures: 'Leuchten = PPFD / Effizienz × Fläche / Watt',
      shade: 'Schatten = 1 − Grenze / Sonne (hellster Monat)',
      leak: 'Verlust = N × V × (Ziel − außen) × 1,83 × 10⁻⁶',
      uptake: 'Aufnahme = g/m²·h × Fläche',
      burner: 'Gas = CO₂ / 1,96; Wärme = Gas × 9,77 × η',
      water: 'Wasser = Transpiration × Fläche',
      air: 'Luft = Wasser / (ρ × (x_innen − x_außen))',
      heat: 'Wärme = ρ × cp × Luft × (T_innen − T_außen)',
      surface: 'Eindeckung innen = T_innen − U/8 × (T_innen − T_außen)',
    },
  },

  climate: {
    title: 'Klima',
    lead: 'Monatsmittel für Gewächshausregionen. Sie reichen zur Auslegung einer Anlage; die Aufzeichnungen Ihrer eigenen Station sind besser.',
    choose: 'Ort',
    use: 'Für dieses Projekt verwenden',
    inUse: 'Von diesem Projekt verwendet',
    lat: 'Breitengrad',
    designWinter: 'Auslegungsnacht',
    designSummer: 'Auslegungsnachmittag',
    peakSun: 'Mittagssonne im Sommer',
    rainYear: 'Regen im Jahr',
    chart: 'Temperaturen (Linien) und Regen (Balken) je Monat',
    chartAlt: (place: string) =>
      `Diagramm der monatlichen Temperaturen und Niederschläge in ${place}`,
    table: {
      month: 'Monat',
      tMin: 'Min °C',
      tMax: 'Max °C',
      sun: 'Sonne MJ/m²·d',
      rain: 'Regen mm',
      day: 'Tag h',
    },
    source:
      'Gerundete Stationsmittel (etwa 1991–2020). Eine spätere Version holt Mittelwerte für jeden Ort auf der Karte.',
  },

  stages: {
    nursery: 'Anzucht',
    vegetative: 'Wachstum',
    flowering: 'Blüte',
    harvest: 'Ernte',
    cleanOut: 'Räumung',
  },
  vpd: {
    stage: 'Kulturstadium',
    light: 'Licht',
    lights: {
      sun: 'Sonnig',
      cloud: 'Bewölkt',
      night: 'Nacht',
    },
    status: {
      tooWet: 'Zu feucht',
      good: 'Gut',
      tooDry: 'Zu trocken',
    },
    ideal: 'ideal',
    actions: {
      hold: 'Klima so halten',
      ventilate: 'Lüften, um die Luft zu trocknen',
      heatAndVent: 'Etwas heizen und die Lüftung öffnen',
      heat: 'Heizen: die Außenluft ist feuchter',
      humidify: 'Befeuchten: Nebel oder Sprühnebel',
      coolAndHumidify: 'Schattieren und nebeln: kühlen und befeuchten',
    },
    band: 'Bereich',
    absolute: 'Wasser in der Luft',
    headroom: 'Reserve bis zur Sättigung',
    pairsTitle: 'Dasselbe VPD bei anderen Temperaturen',
    targetsTitle: (stage: string) => `Sollwerte · ${stage}`,
    day: 'Tag',
    night: 'Nacht',
    source: 'Quelle',
  },
  advice: {
    title: 'Kühlstrategie',
    strategies: {
      vents: 'Die Dachlüftung reicht',
      ventsAndShade: 'Lüftung mit Schattierung',
      shadeAndFog: 'Schattierung und Hochdrucknebel',
      shadeAndPad: 'Schattierung und Pad and Fan',
    },
    ventsNeeded: 'Nötige Lüftung, ohne zusätzliche Schattierung',
    withShade: (pct: string) => `Lüftung mit ${pct} % Schattierung`,
    fogInside: 'Innen mit Schattierung und Nebel',
    padOutlet: 'Luft hinter einem nassen Pad',
    openFog: 'Nebelanlage auslegen',
    rule: 'Regel: über 38 °C außen oder bei Lüftung über einem Viertel der Fläche schattieren und durch Verdunstung kühlen, statt die Lüftung zu vergrößern.',
  },
  calendar: {
    title: 'Anbaukalender',
    lead: 'Das Kulturjahr Woche für Woche: die Stadien, das Klima, das jedes will, und wann Heizung, CO₂, Schattierung und Nebel laufen.',
    rows: {
      temp: 'Außen',
      stage: 'Kultur',
      heating: 'Heizung',
      co2: 'CO₂',
      shade: 'Schatten',
      fog: 'Nebel',
    },
    targets: 'Sollwerte je Stadium',
    stage: 'Stadium',
    weeks: 'Wochen',
    week: 'Woche',
    firstHarvest: 'Erste Ernte',
    weeksOfPicking: 'Wochen Ernte',
    end: 'Kulturende',
    heatingFrom: 'Heizung ab',
    systems: 'Anlagen',
    harvestWeeks: 'Wochen Ernte',
    heatingWeeks: 'Wochen Heizung',
    fogWeeks: 'Wochen Nebel',
  },
  science: {
    title: 'Wissen',
    lead: 'Die Phänomene hinter jedem Rechner: was passiert, die Formel, was sie annimmt und wie man jede eingegebene Zahl misst.',
    search: 'Thema suchen',
    empty: 'Kein Thema passt.',
    contents: 'Themen',
    formula: 'Formel',
    inputs: 'Eingaben und wie man sie bekommt',
    input: 'Eingabe',
    method: 'Wie',
    instrument: 'Messgerät',
    assumptions: 'Annahmen',
    related: 'Verwandt',
    usedIn: 'Verwendet in',
    sources: 'Quellen',
    instrumentsTitle: 'Messgeräte',
    foldAll: 'Alle einklappen',
    unfoldAll: 'Alle ausklappen',
    instrumentsLead: 'Womit man misst, und wie man richtig abliest.',
    photo: 'Foto',
    photoCaptions: {
      airLeakage:
        'In einem Folientunnel: jede Lücke in der Hülle lässt warme Luft hinaus.',
      cogeneration: 'Der Gasmotor eines Blockheizkraftwerks.',
      coolingEnergy:
        'Ein Abluftventilator: im Pad-and-Fan-Haus machen die Ventilatoren den Großteil der Kühlkosten aus.',
      cropCalendar: 'Jungpflanzen im Anzuchtbeet, vor dem Auspflanzen.',
      desalination:
        'In einer Umkehrosmose-Anlage: Reihen von Druckrohren mit den Membranen.',
      dewPoint:
        'Wasser kondensiert auf Glas, das kälter ist als der Taupunkt der Luft.',
      fertigation:
        'Ein Tropfer versorgt eine Pflanze auf Substrat: hier beginnt der Fertigationskreislauf.',
      geometry:
        'Eine Glashausanlage: Schiffe nebeneinander unter einer Rinnenlinie.',
      heatLoss:
        'Ein doppelter Energieschirm unter dem Dach senkt den Wärmeverlust in der Nacht.',
      rainHarvest:
        'Regenwassertanks: was das Dach auffängt, wird für die trockenen Monate gespeichert.',
      siteScale:
        'Die Gewächshäuser von Almería aus der Umlaufbahn, fotografiert von einem NASA-Astronauten.',
      transpiration:
        'Ein Tomatenblatt unter dem Mikroskop (100×): die Spaltöffnungen, durch die sein Wasser austritt.',
      ventilation:
        'Geöffnete Firstlüftungen lassen die heiße, feuchte Luft hinaus.',
    },
    howToGet: (label: string) => `So bekommen Sie „${label}“`,
    readMore: 'Mehr zu',
    close: 'Schließen',
    groups: {
      site: 'Standort und Geld',
      house: 'Das Haus',
      heat: 'Wärme',
      air: 'Luft, Feuchte und Kühlung',
      water: 'Wasser',
      crop: 'Licht, CO₂ und Kultur',
    },
    methods: {
      measure: 'Messen',
      datasheet: 'Aus dem Datenblatt',
      derived: 'Berechnet',
      setpoint: 'Ihre Einstellung',
      assume: 'Planungsannahme',
      bill: 'Aus Ihren Rechnungen',
    },
    methodHints: {
      measure: 'Vor Ort mit dem Gerät unten ablesen.',
      datasheet:
        'Aus dem Datenblatt des Lieferanten; der Hinweis nennt einen üblichen Wert.',
      derived:
        'SerraCalc berechnet es aus dem Haus oder einem anderen Werkzeug; überschreiben, wenn Sie es besser wissen.',
      setpoint:
        'Eine Wahl: ein Sollwert oder ein Ziel, mit dem Sie das Haus führen.',
      assume: 'Ein üblicher Praxiswert; mit eigenen Aufzeichnungen verfeinern.',
      bill: 'Ihr eigener Tarif oder Faktor, in der Währung des Projekts.',
    },
    topics: {
      coolingEnergy: {
        title: 'Kühlstrom übers Jahr',
        what: 'Pad-und-Lüfter-Kühlung läuft mit Strom: Lüfter ziehen 120–150 m³/h Luft je m² Boden durch nasse Pads, Pumpen halten die Pads feucht. Übers Jahr laufen die Lüfter nur in warmen Stunden, umso schneller, je heißer es ist; der Jahresverbrauch folgt also dem Klima. Ein Mittelmeer-Gewächshaus braucht etwa 10 kWh/m² im Jahr: ein Abgleich für die Zahl.',
        assumptions: [
          'Jeder Monat ist sein mittlerer Tag: Außentemperatur als Kosinus, am wärmsten um 15 Uhr.',
          'Die Lüfterleistung folgt dem Anteil laufender Lüfter (gestufte Lüfter).',
          'Die Padpumpen laufen, wann immer die Lüfter laufen.',
        ],
      },
      cogeneration: {
        title: 'Kraft-Wärme-Kopplung (BHKW) und Wärmespeicher',
        what: 'Ein Gasmotor erzeugt Strom und aus Kühlwasser und Abgas Wärme; sein gereinigtes Abgas liefert CO₂ für die Kultur. Läuft er tagsüber, wenn die Kultur das CO₂ nutzen kann, erzeugt er mehr Wärme, als das Haus braucht: ein Warmwasserpuffer trägt sie in die Nacht, ein Kessel deckt den Rest.',
        assumptions: [
          'Ein winterlicher Auslegungstag, außen ein Kosinus von 3 bis 15 Uhr.',
          'Das BHKW läuft in seinen Stunden mit voller Leistung.',
        ],
      },
      heatReuse: {
        title: 'Wärme in gekühltem Brunnenwasser',
        what: 'Warm aus einem tiefen Brunnen gepumptes und für Bewässerung oder Kühlung gekühltes Wasser gibt je m³ und Kelvin 1,163 kWh ab. Von 40 auf 15 °C gekühlt, werden etwa 29 kWh je m³ frei: Wärme, die eine Wärmepumpe oder ein Niedertemperaturkreis ins Haus zurückbringen kann.',
        assumptions: [
          'Die ganze freigesetzte Wärme wird genutzt.',
          'Wasser mit 1.000 kg/m³ und 4,19 kJ/kg·K.',
        ],
      },
      siteScale: {
        title: 'Standortgröße und Wirtschaftlichkeit',
        what: 'Ein großer Standort besteht aus Abteilungen von einigen Hektar, jede ein über ihre Fläche wiederholtes Haus, die UO, BHKW und Packhalle teilen. Zusammengezählt ergeben sie Wasser, Wärme, Arbeit und Ertrag, die die gemeinsamen Anlagen bedienen müssen, und die Kosten jedes Kilos.',
        assumptions: [
          'Jede Abteilung verhält sich je m² wie das Haus ihres Projekts.',
          'Preise, Löhne und Erträge sind Beispiele, die Sie ersetzen.',
        ],
      },
      desalination: {
        title: 'Meerwasserentsalzung durch Umkehrosmose',
        what: 'Hoher Druck presst Meerwasser durch Membranen, die das Salz zurückhalten. Die Ausbeute ist der Anteil, der als Permeat durchkommt; der Rest geht als Sole, entsprechend salziger. Das Pumpen gegen den osmotischen Druck braucht mit Energierückgewinnung 3–4 kWh je m³.',
        assumptions: [
          'Das Permeat behält (1 − Rückhalt) des mittleren Salzgehalts entlang der Membranen.',
          'Energie und Ausbeute sind übliche Werte; mit dem Lieferanten bestätigen.',
        ],
      },
      fertigation: {
        title: 'Fertigation und Drainrecycling',
        what: 'Die Kultur trinkt das Wasser, lässt aber das meiste Natrium und Chlorid zurück, also ist der Drain salziger als die Gabe. Den Drain wiederzuverwenden spart Wasser und Dünger, doch sein Salz reichert sich an, bis der Kreislauf gespült werden muss; einen Teil abzugeben hält das Natrium auf einem Niveau. Die Grenzen für Natrium und Chlorid gelten im Drain, wo man die Wurzelzone beprobt.',
        assumptions: [
          'Natrium gelangt kaum in die Kultur.',
          'Der Ertragsverlust ist über 2 dS/m linear: ein Richtwert aus einem Versuch und einer Sorte.',
        ],
      },
      geometry: {
        title: 'Geometrie des Gewächshauses',
        what: 'Jede Last hängt an drei Zahlen: der Grundfläche (auf der man anbaut und auf die die Sonne fällt), der Hülle (die Wärme verliert) und dem Luftvolumen (das Wärme, Feuchte und CO₂ puffert). Höhere Häuser haben mehr Luft je m² und schwanken weniger.',
        assumptions: [
          'Dächer sind gerade Flächen, bei Bögen eine halbe Ellipse.',
          'Giebel zählen zur Hülle; Türen und Rinnen werden vernachlässigt.',
        ],
      },
      heatLoss: {
        title: 'Wärmeverlust durch die Hülle',
        what: 'Wärme fließt durch die Hülle vom warmen Haus in die kalte Nacht, proportional zur Fläche, zur Temperaturdifferenz und zum U-Wert. Ein geschlossener Energieschirm senkt sie; der Sockel verliert am Umfang etwas mehr.',
        assumptions: [
          'U-Werte sind Auslegungswerte für eine ruhige, klare Nacht (ASAE EP406).',
          'Die Auslegungsnacht kommt fast jeden Winter wieder, sie ist nicht der Rekord.',
        ],
      },
      airLeakage: {
        title: 'Luftundichtheit',
        what: 'Kalte Außenluft dringt durch Spalten, Lüftungen und Türen ein und muss erwärmt werden. Die Luftwechselrate N gibt an, wie oft pro Stunde das ganze Volumen ersetzt wird: etwa 0,5 bei dichter Doppelfolie, 1,5–2 bei altem Glas.',
        assumptions: [
          'Die Undichtheit ändert sich in diesen Werkzeugen nicht mit dem Wind.',
          '0,335 Wh je m³ und K ist die Wärmekapazität der Luft bei etwa 20 °C.',
        ],
      },
      hotWater: {
        title: 'Warmwasser-Heizrohre',
        what: 'Ein Heizkreis gibt Wärme durch Konvektion und Strahlung ab. Die Spreizung des Wassers bestimmt den Durchfluss (1,163 kWh je m³ und K), die Leistung je Meter die Rohrlänge. Geothermales Wasser mit 60–75 °C braucht mehr Rohr als ein Kessel mit 80–90 °C.',
        assumptions: [
          'Freie Konvektion um ein waagrechtes Rohr: h = 1,32 (ΔT/D)^0,25.',
          'Die Rohroberfläche hat die mittlere Wassertemperatur.',
        ],
      },
      solarGain: {
        title: 'Solarer Wärmeeintrag',
        what: 'Sonnenlicht durch die Hülle wird zu Wärme. Einen Teil verbraucht die Kultur zum Verdunsten; der Rest erwärmt die Luft und muss über Lüftung, Pads oder Nebel hinaus. Schattierung und Kalkung kappen ihn an der Quelle.',
        assumptions: [
          'Die Transmission enthält Konstruktion und Staub.',
          'Eine volle Kultur verbraucht etwa die Hälfte der Sonne für die Transpiration.',
        ],
      },
      ventilation: {
        title: 'Natürliche Lüftung',
        what: 'Warme Luft steigt durch die Dachlüftung auf (Kamineffekt) und der Wind zieht Luft hindurch. Die nötige Lüftungsfläche wächst schnell, wenn das Haus nur wenige Grad über außen liegen darf; ab etwa 30 % der Fläche reicht Lüftung allein nicht.',
        assumptions: [
          'Boulard und Baille (1995): Cd 0,65 und Cw 0,1 für Dachlüftungen.',
          'Luft mit 1,2 kg/m³ und 1005 J/kg·K.',
        ],
      },
      evaporativeCooling: {
        title: 'Verdunstungskühlung und Feuchtkugel',
        what: 'Wasser, das in trockene Luft verdunstet, entzieht ihr Wärme. Unter ihre Feuchtkugeltemperatur lässt sich Luft nicht kühlen, und die sinkt, je trockener die Luft ist: bei 44 °C und 15 % liegt sie nahe 22 °C. Ein nasses Pad schafft 75–85 % des Weges.',
        assumptions: [
          'Feuchtkugel nach Stull (2011), auf etwa 0,3 K genau.',
          'Die Luft erwärmt sich gleichmäßig zwischen Pads und Ventilatoren.',
        ],
      },
      fogging: {
        title: 'Hochdrucknebel',
        what: 'Düsen mit 40–70 bar erzeugen Tröpfchen von 10–30 µm, die verdunsten, bevor sie fallen, und die Luft bei offener Lüftung kühlen. Die Grenze ist die Feuchte: Der Nebel wird gedrosselt, damit die Luft unter einer Grenze bleibt, meist 70–80 %.',
        assumptions: [
          'Aller Nebel verdunstet, solange die Luft unter der Grenze bleibt.',
          'Der Luftstrom der Lüftung folgt Boulard und Baille, aus Wind und Temperaturdifferenz.',
        ],
      },
      vpd: {
        title: 'Sättigungsdefizit (VPD)',
        what: 'Das VPD gibt an, wie viel Wasser die Luft bei ihrer Temperatur noch aufnehmen könnte. Es treibt die Transpiration: zu niedrig, und die Pflanze transportiert kein Wasser und Calcium und Pilze breiten sich aus; zu hoch, und die Stomata schließen sich und die Pflanze welkt. Dasselbe VPD passt zu vielen Paaren aus Temperatur und Feuchte.',
        assumptions: [
          'Blatt und Luft haben dieselbe Temperatur.',
          'Sättigungsdampfdruck nach Tetens, wie in FAO-56.',
        ],
      },
      dewPoint: {
        title: 'Taupunkt und Kondensation',
        what: 'Luft, die auf ihren Taupunkt abkühlt, gibt Wasser ab. Nachts ist die Innenseite der Hülle kälter als die Luft; fällt sie unter den Taupunkt, tropft sie auf die Kultur und verbreitet Krankheiten.',
        assumptions: [
          'Die Innenseite tauscht etwa 8 W/m²·K mit der Luft.',
          'Kalter Nachthimmel und Wind stecken im U-Wert.',
        ],
      },
      nightHumidity: {
        title: 'Nachts entfeuchten',
        what: 'Nachts transpiriert die Kultur weiter. Dieses Wasser muss mit Außenluft hinaus, die weniger enthält, und diese Luft muss erwärmt werden. Lüften trocknet das Haus nicht, wenn die Außenluft absolut mehr Wasser enthält.',
        assumptions: [
          'Wasser in Gramm je kg trockener Luft, bei Meereshöhendruck.',
          'Kondensation an der Hülle zählt nicht als Ausweg.',
        ],
      },
      transpiration: {
        title: 'Transpiration und Bewässerung',
        what: 'Eine Kultur transpiriert etwa zwei Drittel der empfangenen Sonne; der Wasserbedarf folgt der Strahlung im Haus. Substratkulturen bekommen zusätzlich den Drain, um Salze auszuwaschen; mit Brackwasser muss der Drainanteil steigen.',
        assumptions: [
          '2,45 MJ verdunsten einen Liter Wasser.',
          'Der Bestandesschluss senkt den Verbrauch einer jungen Kultur.',
        ],
      },
      rainHarvest: {
        title: 'Regenwassernutzung',
        what: 'Ein Gewächshausdach ist eine große Auffangfläche. Ein Becken speichert Regen zwischen Gewittern: Monat für Monat füllt es sich, gibt an die Bewässerung ab und läuft über, wenn es voll ist.',
        assumptions: [
          'Monatssummen; ein starkes Gewitter wird gesondert geprüft.',
          'Die ersten Millimeter jedes Regens gehen verloren.',
        ],
      },
      light: {
        title: 'Licht für die Kultur (DLI)',
        what: 'Pflanzen zählen Photonen, nicht Watt: Das Tageslichtintegral ist die Menge photosynthetischen Lichts in Mol je m² und Tag, und etwa 47 % der Sonne sind PAR. Lampen schließen die Lücke in dunklen Monaten; Schattierung hält helle Monate unter der Obergrenze der Kultur.',
        assumptions: [
          '4,57 µmol Photonen je Joule PAR im Sonnenlicht.',
          'Die Lampen werden für den dunkelsten Monat ausgelegt.',
        ],
      },
      co2: {
        title: 'CO₂-Düngung',
        what: 'Die Kultur nimmt CO₂ aus der Luft, und 700–900 ppm steigern den Ertrag. Was man zuführt, geht in die Kultur oder mit der Luft hinaus: Düngung lohnt, wenn die Lüftung fast zu ist. Ein Gasbrenner oder ein BHKW liefert CO₂ und Wärme zusammen.',
        assumptions: [
          '1,83 g CO₂ je m³ Luft für 1000 ppm.',
          '1 m³ verbranntes Erdgas ergibt 1,96 kg CO₂.',
        ],
      },
      cropCalendar: {
        title: 'Das Kulturjahr',
        what: 'Eine Kultur durchläuft Stadien, die unterschiedliches Klima wollen. Mit den Klimanormalen gelesen zeigt der Kalender, wann die Nächte Wärme brauchen, wann das Haus lange genug zu bleibt für CO₂ und wann die Sonne Schattierung und Nebel verlangt.',
        assumptions: [
          'Wochenwerte werden zwischen den Monatsnormalen gelesen.',
          'Die Stadienlängen sind üblich; mit dem Saatgutzüchter prüfen.',
        ],
      },
    },
    instruments: {
      ecMeter: {
        name: 'EC- und pH-Messgerät',
        how: 'Ein Hand- oder Inline-Leitfähigkeitsmesser, auf 25 °C kompensiert. Wöchentlich mit einem 1,41-dS/m-Puffer kalibrieren und Gabe und Drain zur selben Tageszeit messen.',
      },
      labAnalysis: {
        name: 'Wasseranalyse im Labor',
        how: 'Quelle, Gabe und Drain alle zwei bis vier Wochen beproben; das Labor liefert Natrium, Chlorid, Nährstoffe und Hydrogencarbonat in mmol/L.',
      },
      tape: {
        name: 'Maßband oder Laser-Entfernungsmesser',
        how: 'Schiffe, Längen und Höhen vom Boden bis zur Rinne messen. Schiffe, Pflanzen, Tropfer und Düsen in einigen Reihen zählen und hochrechnen.',
      },
      thermometer: {
        name: 'Belüftetes Luftthermometer',
        how: 'Ein Sensor in einer weißen, belüfteten Messbox in Bestandeshöhe, im Schatten. Ein unbeschatteter Sensor misst mehrere Grad zu hoch.',
      },
      hygrometer: {
        name: 'Feuchtesensor oder Psychrometer',
        how: 'Ein kapazitiver Feuchtesensor in derselben belüfteten Box, jährlich mit einem Psychrometer (trockene und feuchte Kugel) geprüft. Temperatur und Feuchte zusammen ablesen.',
      },
      weatherStation: {
        name: 'Wetterstation außen',
        how: 'Temperatur und Feuchte in einer Strahlungshütte auf 2 m, abseits der Häuser. Für Auslegungswerte die kalten Nächte und heißen Nachmittage mehrerer Jahre nehmen.',
      },
      pyranometer: {
        name: 'Pyranometer',
        how: 'Globalstrahlung in W/m², waagrecht und sauber über dem Dach. Der Klimacomputer hat meist eines; seine Tagessummen in MJ/m² speisen die Wasser- und Lichtwerkzeuge.',
      },
      parSensor: {
        name: 'PAR-Quantensensor',
        how: 'Photonen in µmol/m²·s. Außen und in Bestandeshöhe zur selben Zeit messen: innen durch außen ist die Transmission. Über den Tag summiert ergibt es das DLI.',
      },
      anemometer: {
        name: 'Anemometer',
        how: 'Ein Schalen- oder Ultraschallanemometer an einem Mast über dem First; einen üblichen Sommernachmittag nehmen, nicht die Böen. Ein Flügelrad-Handgerät misst die Luftgeschwindigkeit durch ein Pad oder einen Ventilator.',
      },
      co2Sensor: {
        name: 'CO₂-Sensor (NDIR)',
        how: 'Ein belüfteter Infrarotsensor in Bestandeshöhe. Vor jeder Saison an Außenluft prüfen, etwa 420 ppm.',
      },
      tracerGas: {
        name: 'Tracergas-Abklingtest',
        how: 'In einer ruhigen Nacht das Haus schließen, CO₂ auf etwa 1000 ppm bringen und den Abfall aufzeichnen: N = ln((C₁ − C_außen) / (C₂ − C_außen)) / Stunden.',
      },
      flowMeter: {
        name: 'Durchflussmesser',
        how: 'Ein Clamp-on-Ultraschall- oder Inline-Zähler an der Hauptleitung. Den Durchfluss ablesen, während eine Sektion läuft, oder die Pumpenkennlinie bei ihrer Förderhöhe.',
      },
      catchCups: {
        name: 'Becher-Test',
        how: '10–20 Tropfer oder Düsen einige gestoppte Minuten auffangen, jedes Volumen mit einem Messzylinder messen und mitteln. Die Streuung zeigt, wie gleichmäßig die Anlage ist.',
      },
      drainTray: {
        name: 'Drainschale auf einer Waage',
        how: 'Einige Matten auf einer Schale mit Kippwaage oder Waage: Drainanteil = Drain ÷ gegebenes Wasser. Gleichzeitig die EC von Tropfer und Drain messen.',
      },
      pressureGauge: {
        name: 'Manometer',
        how: 'Ein Glyzerin-Manometer am Pumpenausgang (1 bar entspricht etwa 10 m Förderhöhe), oder ein Differenzdruckmesser an einem Ventilator für seinen statischen Druck.',
      },
      infrared: {
        name: 'Kontakt- oder Infrarotthermometer',
        how: 'Einen Kontaktfühler an Vor- und Rücklauf klemmen oder deren Oberfläche mit einem Infrarotthermometer messen, eingestellt auf den Emissionsgrad des Rohres.',
      },
      meters: {
        name: 'Gas-, Wärme- und Stromzähler',
        how: 'Monatliche Zählerstände und Rechnungen geben den echten Verbrauch, die Leistung und die Tarife, um die Werkzeuge zu prüfen.',
      },
      climateComputer: {
        name: 'Protokolle des Klimacomputers',
        how: 'Sollwerte, Laufstunden, Nebeltakte und Bewässerungsgaben kommen aus den Einstellungen und Tagesprotokollen des Klimacomputers.',
      },
    },
  },
  supply: {
    limitBy: {
      na: 'Natrium erreicht zuerst seine Grenze',
      cl: 'Chlorid erreicht zuerst seine Grenze',
      ec: 'Die EC-Obergrenze kommt zuerst',
    },
    strategies: {
      title: 'Salz niedrig halten: ein Jahr im Vergleich',
      lead: 'Derselbe Kreislauf über ein Jahr, mit fünf Wegen, das Salz zu handhaben, das die Kultur zurücklässt. Fett: der niedrigste Wert der Spalte.',
      table: 'Spülstrategien über ein Jahr',
      strategy: 'Strategie',
      flushes: 'Spülungen',
      letGo: 'Abgelassen',
      fresh: 'Frischwasser',
      stockLost: 'Stammlösung verloren',
      minNutrient: 'Niedrigste Nährstoff-EC',
      names: {
        current: 'Wie eingestellt',
        flush: 'Spülen an der EC-Obergrenze',
        acid: 'Angesäuertes Nachfüllen',
        variable: 'Niedrigere Nachfüll-EC',
        bleed: 'Stetiges Ablassen',
      },
      assume:
        'Ein Jahr Tag für Tag, Kreislauf geschlossen (alles Drainwasser wiederverwendet) außer „wie eingestellt“ und dem stetigen Ablassen. Säure im Nachfüllwasser macht Hydrogencarbonat zu CO₂ und Nitrat: Es erhöht die EC nicht mehr. Eine niedrigere Nachfüll-EC hält die EC am Tropfer, düngt aber weniger. Stammlösung verloren: L von A und B je, das abgelassene Wasser in Zulaufkonzentration gerechnet. Ertragsverlust als Richtwert.',
    },
    title: 'Wasserversorgung',
    lead: 'Vom Meer zur Wurzel: eine Meerwasser-Umkehrosmose für den Spitzentag der Kultur und der Nährstoffkreislauf, der den Drain wiederverwendet und spült, bevor sich Salz anreichert.',
    tabs: {
      ro: 'Meerwasser-UO',
      fertigation: 'Fertigation',
    },
    sea: 'Meer',
    membranes: 'Membranen',
    brine: 'Sole',
    fresh: 'Frischwasser',
    drain: 'Drain',
    reused: 'Wiederverwendet',
    letGo: 'Abgegeben',
    days: 'Tage',
    flush: 'Spülen',
    takeDemand: (m3: string) => `Spitzentag der Kultur übernehmen: ${m3} m³`,
    useRo: (ec: string) => `Osmosewasser verwenden: EC ${ec}`,
    feed: 'Gepumptes Meerwasser',
    product: 'Permeat',
    productEc: 'EC des Permeats',
    energy: 'Energie pro Tag',
    costDay: 'Strom pro Tag',
    coverage: 'Die Anlage deckt',
    tank: 'Tank',
    waterSaved: 'Gespartes Wasser',
    fertSaved: 'Gesparter Dünger',
    drainEc: 'EC des Drains',
    rootEc: 'Wurzelraum',
    yieldLoss: 'Ertragsverlust durch Salz',
    flushIn: 'Spülen in',
    never: 'Nicht nötig',
    levelsAt: 'Drain pendelt sich ein bei',
    naInDrain: 'Na im Drain, mmol/L',
    stock: 'Stammlösung A und B, je',
    stockDays: (days: string) => `ein Tank reicht ${days} Tage`,
    formulas: {
      roFeed: 'Zulauf = Permeat / Ausbeute',
      roBrine: 'Sole = Zulauf − Permeat; Salzgehalt ≈ S_Meer / (1 − R)',
      roEnergy: 'Energie = SEC × Permeat',
      fertDrain: 'Drain-EC = (A × EC_Gabe − U × EC_Aufnahme) / D',
      fertNa:
        'Natrium im Drain (A/D × Gabe): geschlossen t = V (C_lim × D/A − C_0) / (C_in × Frischwasser); sonst pendelt es sich bei C_in × Frischwasser / Abgabe ein',
      fertYield: 'Ertrag = 1 − Steigung × (EC_Wurzel − Schwelle)',
      fertStock: 'Stammlösung = benötigte Nährstoffe / Verdünnung',
    },
  },
  energy: {
    coolKwhM2: 'Kühlstrom',
    coolChartAlt: (place: string, total: string) =>
      `Kühlstrom je Monat in ${place}: ${total} kWh je m² im Jahr.`,
    coolCaption:
      'Lüfter und Pumpen über den mittleren Tag jedes Monats; nichts, solange das Haus leer steht.',
    coolYear: 'Kühlung im Jahr',
    coolBenchmark: (bench: string, pct: string) =>
      `${pct} % der veröffentlichten ${bench} kWh/m²`,
    coolSite: 'Für das ganze Haus',
    coolPeak: 'Alles in Betrieb:',
    coolCost: 'Strom im Jahr',
    coolCo2: 'Netz-CO₂ im Jahr',
    coolHours: 'Kühlstunden',
    coolTable: 'Kühlung je Monat',
    month: 'Monat',
    coolOfBenchmark: 'Der veröffentlichten 10 kWh/m²',
    title: 'Energie',
    lead: 'Ein Gas-BHKW, das über einen Wintertag Wärme, Strom und CO₂ liefert, ein Warmwasserpuffer für die Nacht und ein Kessel für den Rest; und die Wärme in gekühltem Brunnenwasser.',
    tabs: {
      cooling: 'Kühlung übers Jahr',
      chp: 'BHKW und Puffer',
      reuse: 'Wärmerückgewinnung',
    },
    buffer: 'Puffer',
    fromChp: 'BHKW',
    fromBuffer: 'Puffer',
    fromBoiler: 'Kessel',
    demand: 'Bedarf',
    chpShare: 'Das BHKW deckt',
    dayNeed: 'Wärme des Tages',
    dumped: 'Abgeführt',
    gas: 'Gas pro Tag',
    power: 'Erzeugter Strom',
    netCost: 'Gas abzüglich verkauften Stroms',
    co2: 'CO₂ für die Kultur',
    co2Need: 'Benötigt',
    inWater: 'Wärme im Wasser',
    need: 'Wärmebedarf',
    covers: 'Deckt',
    takeLinks:
      'Spitzentag-Wasser der Kultur und Wärme des Wintertags übernehmen',
    formulas: {
      coolPower: 'Leistung = Luftmenge × Lüfter-W je m³/h + Pumpen',
      coolShare:
        'Die Lüfter folgen der Wärme: f = min(1, (T − Start) / Spanne)',
      coolYear: 'Jahr = Σ Tage × Σ Stunden Leistung',
      coolCheck: 'Abgleich mit etwa 10 kWh/m² im Jahr',
      demand:
        'Bedarf = H × (T_soll − T_außen) − Sonne, nachts abzüglich Schirm',
      buffer: 'Puffer = 1,163 × V × ΔT',
      gas: 'Gas = P_el / η_el / 9,77 × Stunden + Kessel',
      co2: 'CO₂ = 1,96 kg je m³ Gas',
      reuse: 'Wärme = 1,163 × V × ΔT',
    },
  },
  site: {
    plantList: 'Die Anlagen des Standorts',
    plantHint:
      'Erfassen Sie die Anlagen, die sich die Abteilungen teilen; die Prüfungen setzen sie gegen den Spitzentag des Standorts.',
    noPlants:
      'Noch keine Anlage erfasst: UO, BHKW, Kessel, Kältemaschinen, Tanks und Pumpen hinzufügen.',
    plantTypes: {
      ro: 'Meerwasser-UO',
      chp: 'BHKW',
      boiler: 'Kessel',
      chiller: 'Kältemaschine',
      tank: 'Tank',
      pump: 'Pumpe',
    },
    plantName: 'Name',
    plantField: {
      capacity: 'Leistung',
      efficiency: 'Wirkungsgrad',
      hoursDay: 'Stunden am Tag',
    },
    removePlant: (name: string) => `${name} entfernen`,
    plantType: 'Anlage',
    addPlant: 'Anlage hinzufügen',
    tariffs: 'Tarife',
    tariffHint:
      'Was der Standort für Gas, Strom und Wasser zahlt und für verkauften Strom erhält. Die Wirtschaftlichkeit kann sie übernehmen.',
    checksTitle: 'Anlagen gegen den Spitzentag',
    noChecks:
      'Fügen Sie eine UO, ein BHKW oder einen Kessel, einen Tank oder eine Pumpe hinzu, um sie zu prüfen.',
    checks: {
      water: 'UO-Wasser',
      heat: 'Wärme (BHKW und Kessel)',
      storage: 'Wasserspeicher',
      pumping: 'Pumpen',
    },
    checkLine: (pct: string) => `${pct} % des Bedarfs`,
    fromSaved:
      'Aus den unter Anlagen und Tarife erfassten Anlagen; darunter aus gespeicherten Ergebnissen.',
    takeTariffs: 'Tarife des Standorts übernehmen',
    title: 'Standort',
    lead: 'Der ganze Betrieb: Jedes Projekt ist eine Abteilung, sein Haus über ihre Fläche wiederholt; die Summen, die gemeinsame UO und das BHKW im Vergleich, und die Wirtschaftlichkeit des Jahres.',
    tabs: {
      plants: 'Anlagen und Tarife',
      overview: 'Überblick',
      economics: 'Wirtschaftlichkeit',
    },
    choose: 'Standort',
    unnamed: 'Standort ohne Namen',
    empty:
      'Noch kein Projekt. Projekte mit demselben „Standort“ bilden einen Standort; geben Sie hier jedem seine Fläche.',
    compartments: (n: string) => `Abteilungen: ${n}`,
    area: 'Fläche',
    peakWater: 'Wasser am Spitzentag',
    meanWater: 'Mittel',
    heatPeak: 'Wärme in der Auslegungsnacht',
    yield: 'Ertrag pro Jahr',
    labour: 'Arbeit pro Jahr',
    days: 'Tage',
    people: (n: string) => `etwa ${n} Vollzeitkräfte`,
    co2e: 'CO₂-Fußabdruck',
    co2eHint: '1,9 kg CO₂e je kg (veröffentlichte Schätzung)',
    sharesAlt: 'Abteilungen nach Flächenanteil',
    plants: 'Gemeinsame Anlagen',
    roPlant: 'Meerwasser-UO',
    chpPlant: 'BHKW',
    covers: (pct: string) => `deckt ${pct} % des Spitzentags`,
    chpOfPeak: (pct: string) => `${pct} % der Spitzenwärme`,
    noRo: 'Speichern Sie ein Meerwasser-UO-Ergebnis in einem dieser Projekte, um es hier zu prüfen.',
    noChp:
      'Speichern Sie ein Energiezentralen-Ergebnis in einem dieser Projekte, um es hier zu prüfen.',
    table: 'Abteilungen',
    tableHint:
      'Fläche jeder Abteilung festlegen: ihr Haus wird darüber wiederholt.',
    compartment: 'Abteilung',
    houses: 'Häuser',
    areaOf: (name: string) => `Fläche von ${name}, ha`,
    takeTotals: (ha: string) => `Standortsummen übernehmen: ${ha} ha`,
    costPerKg: 'Kosten je kg',
    price: 'Preis',
    margin: 'Marge',
    revenue: 'Umsatz',
    payback: 'Amortisation',
    years: 'Jahre',
    waterPerKg: 'Wasser je kg',
    costTitle: 'Wohin das Geld geht',
    costs: {
      labour: 'Arbeit',
      energy: 'Energie',
      water: 'Wasser',
      inputs: 'Dünger und Schutz',
      other: 'Verpackung und Gemeinkosten',
    },
    formulas: {
      yield: 'Ertrag = Fläche × t/ha',
      cost: 'Kosten je kg = Kosten / kg',
      payback: 'Amortisation = Bau / Marge',
    },
  },
  ops: {
    title: 'Betrieb',
    lead: 'Das Kulturtagebuch, der tägliche Hygienerundgang, die Wartung der Anlagen und ein Hitzeplan für die Menschen, die drinnen arbeiten.',
    noProject: 'Öffnen Sie ein Projekt, um sein Tagebuch zu führen.',
    tabs: {
      log: 'Tagebuch',
      hygiene: 'Hygiene',
      maintenance: 'Wartung',
      heat: 'Hitzebelastung',
    },
    newEntry: 'Neuer Eintrag',
    date: 'Datum',
    kind: 'Art',
    kinds: {
      scouting: 'Kontrolle',
      release: 'Nützlingsfreilassung',
      spray: 'Spritzung',
      maintenance: 'Wartung',
      hygiene: 'Hygienekontrolle',
      harvest: 'Ernte',
    },
    subjects: {
      scouting: 'Gesehener Schädling oder Krankheit, und wo',
      release: 'Freigelassener Nützling',
      spray: 'Gespritztes Mittel',
      maintenance: 'Was gemacht wurde',
      hygiene: 'Checkliste',
      harvest: 'Abteilung oder Reihen',
    },
    task: 'Aufgabe',
    amount: 'Menge',
    unit: 'Einheit',
    who: 'WHO-Klasse',
    note: 'Notiz',
    add: 'Ins Tagebuch eintragen',
    entries: (n: string) => `Tagebucheinträge: ${n}`,
    all: 'Alle',
    empty: 'Noch nichts eingetragen.',
    remove: (what: string) => `„${what}“ löschen`,
    checklist: 'Hygiene-Checkliste',
    saveChecklist: (done: string, total: string) =>
      `Checkliste von heute speichern (${done} von ${total})`,
    recent: 'Letzte Checklisten',
    every: 'Alle',
    last: 'Zuletzt',
    due: 'Fällig',
    state: 'Status',
    done: 'Heute erledigt',
    days: 'Tage',
    states: {
      ok: 'Im Plan',
      soon: 'Bald fällig',
      overdue: 'Überfällig',
    },
    overdue: (n: string) => `Überfällige Aufgaben: ${n}`,
    tasks: {
      filters: 'Bewässerungsfilter reinigen',
      nozzles: 'Nebeldüsen prüfen',
      pads: 'Pads reinigen und spülen',
      sensors: 'Klima- und EC-Sensoren kalibrieren',
      pumps: 'Pumpen warten',
      fans: 'Ventilatoren und Riemen prüfen',
      drainDisinfection: 'Draindesinfektion prüfen',
      roMembranes: 'UO-Membranen reinigen (CIP)',
      chp: 'BHKW warten',
    },
    hygiene: {
      footbath: 'Fußbäder aufgefüllt',
      handwash: 'Händewaschen und Handschuhe an der Tür',
      clothing: 'Saubere Kleidung für diese Abteilung',
      tools: 'Messer und Werkzeuge desinfiziert',
      visitors: 'Besucher erfasst und eingewiesen',
      waste: 'Pflanzenabfälle entfernt und abgedeckt',
      doors: 'Türen und Insektennetze geschlossen',
    },
    heatTitle: 'Hitzebelastung bei der Arbeit',
    heatIndex: 'Hitzeindex',
    rest: 'Pause je Stunde',
    water: 'Wasser je Stunde',
    risks: {
      none: 'Keine Hitzegefahr',
      caution: 'Vorsicht',
      extremeCaution: 'Große Vorsicht',
      danger: 'Gefahr',
      extremeDanger: 'Extreme Gefahr',
    },
    plan: 'Der Hitzeplan',
    advice: {
      caution: 'Wasser griffbereit; schwere Arbeit früh am Tag.',
      extremeCaution:
        '20 min Pause je Stunde im Schatten; 0,75 L Wasser je Stunde.',
      danger:
        '40 min Pause je Stunde; keine schwere Arbeit drinnen; gegenseitig aufeinander achten.',
      extremeDanger: 'Arbeit im Haus einstellen.',
    },
    heatSource:
      'Hitzeindex nach dem US-Wetterdienst (Rothfusz); Arbeit und Pausen nach gängigen Arbeitsschutzempfehlungen. Eine Planungshilfe, kein medizinischer Rat.',
  },
  data: {
    title: 'Live-Daten',
    lead: 'Messwerte Ihrer Sensoren oder Datenlogger, als CSV importiert und mit dem verglichen, was die Rechner erwarten: VPD für das Stadium, Tag- und Nachttemperaturen, Drain; VPD je Stunde; und Alarme.',
    import: 'Messwerte importieren',
    importHint:
      'Eine CSV mit einer Zeitspalte und beliebigen von: Temperatur, rF, PAR, EC, pH, Drain %, Drain-EC, Außentemperatur und -feuchte. Kommas oder Semikolons, Dezimalpunkt oder -komma.',
    file: 'CSV-Datei',
    paste: 'Oder hier einfügen',
    importPasted: 'Eingefügten Text importieren',
    sample: 'Beispielwoche laden',
    download: 'Beispiel-CSV herunterladen',
    clear: 'Messwerte löschen',
    noProject: 'Öffnen Sie ein Projekt, um seine Messwerte zu behalten.',
    imported: (n: string, skipped: string) =>
      `${n} Messwerte importiert; ${skipped} Zeilen übersprungen.`,
    errors: {
      empty: 'Die Datei ist leer.',
      noTime: 'Keine Zeitspalte gefunden.',
      noData: 'Keine Messwerte gefunden.',
    },
    targets: 'Vergleichen mit',
    summary: 'Gemessen gegen erwartet',
    empty: 'Noch keine Messwerte: CSV importieren oder Beispielwoche laden.',
    period: (from: string, to: string, n: string, step: string) =>
      `${from} bis ${to}: ${n} Messwerte, alle ${step} min.`,
    vpdInBand: 'VPD im Bereich',
    dayMean: 'Tage, Mittel',
    nightMean: 'Nächte, Mittel',
    drainMean: 'Drain, Mittel',
    plan: 'Plan',
    alertCount: 'Alarme',
    byHour: 'Nach Tagesstunde',
    vpdByHour: 'VPD je Stunde, kPa (grün: Tagbereich)',
    tempByHour: 'Temperatur je Stunde, °C (grün: Tagbereich)',
    alertsTitle: 'Alarme',
    noAlerts: 'Keine Alarme in diesen Messwerten.',
    alerts: {
      vpdLow: 'VPD unter 0,3 kPa: Krankheitsrisiko',
      vpdHigh: 'VPD über 1,5 kPa am Tag',
      heatStress: 'Hitzebelastung für die Arbeitenden',
      heatDanger: 'Hitzegefahr für die Arbeitenden',
      drainEcHigh: 'Drain-EC an der Spülgrenze',
      tempLow: 'Zu kalt für das Stadium',
      tempHigh: 'Zu warm für das Stadium',
      phOut: 'pH außerhalb 5,2–6,8',
    },
    alertDetail: (n: string, worst: string) =>
      `${n} Messwerte, schlechtester ${worst}`,
    days: 'Tag für Tag',
    outOfBand: 'VPD außerhalb',
  },
  calc: {
    science: 'Die Physik dahinter',
    results: 'Ergebnisse',
    how: 'So wird gerechnet',
    inputs: 'Eingaben',
    table: 'Zahlen zeigen',
    dragHint:
      'Ziehen Sie die runden Griffe, oder wählen Sie einen und nutzen Sie die Pfeiltasten.',
  },

  diagrams: {
    energyAlt: (peak: string, start: string, end: string, share: string) =>
      `Winterlicher Auslegungstag: Der Wärmebedarf erreicht ${peak} kW; das BHKW läuft von ${start}:00 bis ${end}:00 und deckt ${share} %. Griffe stellen Start und Stopp ein.`,
    reuseAlt: (water: string, need: string) =>
      `Wärme im gekühlten Wasser, ${water} kWh, gegen den Wärmebedarf des Tages, ${need} kWh.`,
    roAlt: (feed: string, product: string, brine: string, salinity: string) =>
      `Meerwasser-UO: ${feed} m³ pro Tag gepumpt, ${product} m³ Permeat, ${brine} m³ Sole mit ${salinity} g/L. Griffe stellen Ausbeute und Speicher ein.`,
    fertAlt: (recycle: string, ec: string, flush: string) =>
      `Nährstoffkreislauf: ${recycle} % des Drains wiederverwendet, Drain-EC ${ec} dS/m, spülen in ${flush} Tagen. Griffe stellen den wiederverwendeten Anteil und die Natriumgrenze ein.`,
    vpdAlt: (air: string, rh: string, vpd: string, status: string) =>
      `VPD-Karte: Luft mit ${air} °C und ${rh} % ergibt ${vpd} kPa, ${status}. Griffe stellen Temperatur und Feuchte ein.`,
    fogAlt: (
      outside: string,
      inside: string,
      rh: string,
      on: string,
      off: string,
    ) =>
      `Nebel bringt das Haus an einem Nachmittag mit ${outside} °C auf ${inside} °C bei ${rh} %, ${on} s an und ${off} s aus. Griffe stellen die Feuchtegrenze und den Stoß ein.`,
    calendarAlt: (plant: string, harvest: string, end: string, heat: string) =>
      `Anbaukalender: Pflanzung in Woche ${plant}, erste Ernte in Woche ${harvest}, Kulturende in Woche ${end}, Heizung ab Woche ${heat}. Griffe stellen die Pflanzwoche und das Kulturende ein.`,
    ventsOnly: 'Nur Lüftung',
    withFog: 'Mit Nebel',
    wetBulb: 'Feuchtkugel',
    cap: 'Grenze',
    heatAlt: (inside: string, outside: string, kw: string) =>
      `Wärme, die das Haus verlässt: ${kw} kW, von ${inside} °C innen zu ${outside} °C außen. Griffe stellen beide Temperaturen ein.`,
    pipesAlt: (loops: string, length: string, supply: string, back: string) =>
      `Heizrohre im Grundriss: ${loops} Kreise zu ${length} m, Vorlauf ${supply} °C, Rücklauf ${back} °C. Griffe stellen die Temperaturen und die Kreislänge ein.`,
    ventAlt: (outside: string, rise: string, vents: string) =>
      `Lüftung an einem sonnigen Tag: ${outside} °C draußen, das Haus höchstens ${rise} K wärmer, ${vents} m² Firstlüftung. Griffe stellen die Temperaturen und die Klappenöffnung ein.`,
    padAlt: (outside: string, pad: string, exhaust: string, distance: string) =>
      `Pad and Fan: Luft mit ${outside} °C verlässt das Pad mit ${pad} °C und erreicht die Ventilatoren in ${distance} m mit ${exhaust} °C. Griffe stellen den Abstand und die Erwärmung ein.`,
    cropAlt: (applied: string, used: string, drain: string) =>
      `Ein Spitzentag pro m²: ${applied} L gegeben, ${used} L transpiriert, ${drain} % Drain. Griffe stellen den Bestand und den Drainanteil ein.`,
    rainAlt: (basin: string, pct: string) =>
      `Regen vom Dach in ein Becken von ${basin} m³, das ${pct} % der Bewässerung deckt. Ein Griff stellt die Beckengröße ein.`,
    inside: 'Innen',
    outside: 'Außen',
    screen: 'Schirm',
    cover: 'Hülle',
    leaks: 'Undicht',
    footing: 'Sockel',
    supply: 'Vorlauf',
    return: 'Rücklauf',
    air: 'Luft',
    loop: 'Kreis',
    loops: 'Kreise',
    vents: 'Klappen',
    shade: 'Schatten',
    pad: 'Pad',
    fans: 'Ventilatoren',
    canopy: 'Bestand',
    transpired: 'Transpiriert',
    drain: 'Drain',
    suggested: 'Empfohlen',
    overflow: 'Überlauf',
    lightAlt: (month: string, sun: string, target: string, ppfd: string) =>
      `Licht im ${month}: ${sun} mol/m² von der Sonne gegenüber einem Ziel von ${target}; die Leuchten geben ${ppfd} µmol/m²·s. Griffe stellen das Ziel, die Schattiergrenze und die Lampenstunden ein.`,
    co2Alt: (target: string, supply: string, used: string) =>
      `CO₂ bei ${target} ppm: ${supply} kg/h geliefert, ${used} % von der Kultur aufgenommen. Griffe stellen das Ziel und den Luftwechsel ein.`,
    humidityAlt: (inside: string, rh: string, dew: string, cover: string) =>
      `Eine Nacht bei ${inside} °C und ${rh} %: Taupunkt ${dew} °C, Eindeckung ${cover} °C. Griffe stellen beide Temperaturen und die Feuchte ein.`,
    target: 'Ziel',
    ceiling: 'Grenze',
    noLamps: 'Keine Leuchten nötig',
    crop: 'Kultur',
    used: 'genutzt',
    coverAt: 'Hülle',
    dew: 'Tau',
    wetterOutside: 'Außenluft ist feuchter',
  },

  save: {
    title: 'Im Projekt speichern',
    label: 'Name',
    save: 'Speichern',
    update: 'Gespeichertes Ergebnis aktualisieren',
    saveCopy: 'Als Kopie speichern',
    stopEditing: 'Bearbeitung beenden',
    editing: 'In Bearbeitung',
    editingHint: 'Sie ändern ein gespeichertes Ergebnis.',
    savedTo: 'Gespeichert in',
    viewSaved: 'gespeicherte Ergebnisse ansehen',
    noProject: 'Legen Sie ein Projekt an, um Ergebnisse zu speichern.',
  },

  backup: {
    title: 'Sichern und wiederherstellen',
    lead: 'Ihre Projekte liegen nur in diesem Browser. Behalten Sie eine Kopie: Speichern Sie eine Sicherungsdatei auf dem Telefon oder teilen Sie sie in Google Drive, und öffnen Sie sie auf jedem Gerät wieder.',
    download: 'Sicherungsdatei speichern',
    share: 'Teilen oder in Drive speichern',
    shareTitle: 'SerraCalc-Sicherung',
    open: 'Sicherung öffnen',
    driveHint:
      'Unter Android zeigt „Teilen oder in Drive speichern“ Drive im Teilen-Menü, und „Sicherung öffnen“ kann die Datei aus Drive wählen. Auf dem iPhone wählen Sie Dateien oder die Drive-App.',
    saved: (n: number) =>
      `Sicherung von ${n} Projekt${n === 1 ? '' : 'en'} bereit.`,
    restored: (n: number, skipped: number) =>
      `${n} Projekt${n === 1 ? '' : 'e'} wiederhergestellt${skipped ? ` (${skipped} beschädigte${skipped === 1 ? 'r Eintrag' : ' Einträge'} ausgelassen)` : ''}. Bereits vorhandene kamen als Kopie hinzu.`,
    shareFailed:
      'Teilen hat hier nicht funktioniert: Speichern Sie stattdessen die Sicherungsdatei.',
    errors: {
      notJson: 'Diese Datei ist keine SerraCalc-Sicherung (kein JSON).',
      notSerraCalc: 'Diese JSON-Datei ist keine SerraCalc-Sicherung.',
      newerVersion:
        'Diese Sicherung stammt aus einer neueren SerraCalc-Version: Laden Sie die App neu und versuchen Sie es noch einmal.',
      empty: 'Diese Sicherung enthält kein Projekt, das SerraCalc lesen kann.',
    },
  },

  report: {
    title: 'Bericht',
    lead: 'Das Projekt auf Papier: das Haus, sein Klima und jedes gespeicherte Ergebnis mit seinen Befunden, zum Drucken oder als PDF.',
    print: 'Drucken oder als PDF speichern',
    tip: 'Wählen Sie im Druckdialog „Als PDF speichern“, um eine Datei zu behalten. Menüs und Schaltflächen werden nicht gedruckt.',
    kicker: 'Projektbericht',
    date: 'Datum',
    house: 'Das Haus',
    layout: (
      spans: string,
      width: string,
      length: string,
      gutter: string,
      ridge: string,
    ) =>
      `${spans} Schiffe zu ${width} m, ${length} m lang, Traufe ${gutter} m, First ${ridge} m`,
    noProject:
      'Legen Sie ein Projekt an oder öffnen Sie eines, um seinen Bericht zu drucken.',
    footer:
      'Die Ergebnisse werden aus den gespeicherten Eingaben mit den aktuellen Regeln von SerraCalc neu berechnet; die Anleitung nennt ihre Quellen.',
  },

  guide: {
    title: 'Anleitung',
    lead: 'Was jedes Werkzeug tut, was es annimmt und woher seine Zahlen kommen.',
    tools: [
      {
        id: 'projects',
        title: 'Projekte und Sicherungen',
        body: 'Ein Projekt enthält ein Haus, sein Klima, seine Kultur und Währung, und jedes Ergebnis, das Sie in den Werkzeugen speichern. Gespeicherte Ergebnisse behalten nur ihre Eingaben und öffnen sich daher mit den aktuellen Regeln. Projekte bleiben in diesem Browser: Speichern Sie eine Sicherungsdatei oder teilen Sie sie in Drive, und öffnen Sie sie auf einem anderen Gerät.',
      },
      {
        id: 'greenhouse',
        title: 'Gewächshaus',
        body: 'Beschreiben Sie das Haus einmal: Typ, Schiffe, Länge, Höhen, Eindeckung und Schirm. SerraCalc berechnet Grundfläche, Hülle (Dach, Seitenwände und Giebel) und Luftvolumen. Jeder Rechner geht davon aus und behält beim Speichern eine eigene Kopie.',
      },
      {
        id: 'heating',
        title: 'Heizung',
        body: 'Spitzenlast: die Wärme, die in einer kalten Nacht durch die Eindeckung (U × A × ΔT), durch Undichtheiten (0,335 × N × V × ΔT) und über den Sockel verloren geht, plus ein Zuschlag. Übers Jahr: jeder Monat nach der Tageslänge in Nacht und Tag geteilt, die Nächte mit der Einsparung des Schirms, die Tage um die Sonne verringert. Dann Brennstoff, Kosten und CO₂. Warmwasserrohre: der Strom an Thermal- oder Kesselwasser und das Rohr, das zu verlegen ist, damit das Haus seine Wärme bekommt.',
      },
      {
        id: 'cooling',
        title: 'Kühlung',
        body: 'Lüftung: die Luft, die die Sonnenwärme hinausträgt, während das Haus einige Grad über außen bleibt, die Firstlüftung für natürliche Lüftung (Boulard und Baille) oder die Zahl der Ventilatoren. Pad and Fan: Luft, die ein nasses Pad verlässt, nähert sich der Feuchtkugeltemperatur; das Werkzeug legt Ventilatoren, Pad-Wand und Wasser aus.',
      },
      {
        id: 'water',
        title: 'Wasser',
        body: 'Die Kultur transpiriert etwa zwei Drittel des Lichts, das sie erhält: Liter pro m² je Monat aus dem Klima, plus der Drain. Dann Tropfer, Gaben und Bewässerungssektoren. Regenwasser: was das Dach Monat für Monat in ein Becken sammelt, und das Becken, das das meiste davon auffängt.',
      },
      {
        id: 'climate',
        title: 'Klima',
        body: 'Monatliche Temperaturen, Sonnenlicht und Regen für neun Orte, mit einer Auslegungsnacht und einem Auslegungsnachmittag. Wählen Sie den nächsten; ersetzen Sie ihn durch die Daten Ihrer Station, sobald Sie sie haben.',
      },
      {
        id: 'air',
        title: 'Licht & Luft',
        body: 'Licht: das tägliche Lichtintegral der Sonne innen je Monat, die Leuchten, die im dunkelsten Monat die Lücke zum Ziel schließen, und die Schattierung, die die hellsten Monate unter der Grenze der Kultur hält. CO₂: die Zufuhr, die ein Ziel gegen die entweichende Luft und die Aufnahme der Kultur hält, aus einem Gasbrenner oder einem Tank. Feuchte: die Außenluft, die nachts hereingeholt werden muss, um das Wasser der Kultur abzuführen, die Wärme dafür, und ob die Eindeckung tropft.',
      },
      {
        id: 'report',
        title: 'Bericht',
        body: 'Das Projekt auf einer druckbaren Seite: das Haus, sein Klima und jedes gespeicherte Ergebnis mit seinen wichtigsten Zahlen und Befunden. Drucken Sie es, oder wählen Sie im Druckdialog „Als PDF speichern“, um es zu versenden.',
      },
      {
        id: 'calendar',
        title: 'Anbaukalender',
        body: 'Die Wochen für Pflanzung, Blüte, Ernte und Räumung mit den Klimasollwerten jedes Stadiums und die Wochen, in denen Heizung, CO₂, Schattierung und Nebel laufen, aus den Klimanormalen. Tomatenbetriebe in der Wüste pflanzen um Woche 36, heizen ab etwa Woche 42 und enden nach Woche 29.',
      },
      {
        id: 'vpd',
        title: 'Feuchte und VPD',
        body: 'Das Sättigungsdefizit aus Temperatur und Feuchte (Tetens, wie in FAO-56), der Taupunkt und das Wasser, das die Luft noch aufnehmen kann, gegen den Bereich für Kulturstadium und Licht. Die Karte zeigt jedes Paar aus Temperatur und Feuchte, denn ein VPD passt zu vielen.',
      },
      {
        id: 'fog',
        title: 'Hochdrucknebel und Kühlstrategie',
        body: 'Hochdrucknebel in einem gelüfteten Haus: die Innentemperatur aus einer Wärme- und Wasserbilanz, der An/Aus-Takt, der eine Feuchtegrenze hält, und das Wasser pro Tag. Der Berater prüft den Auslegungsnachmittag: Bräuchte die Lüftung allein mehr, als ein Dach öffnet, schlägt er Schattierung mit Nebel oder Pads vor.',
      },
      {
        id: 'science',
        title: 'Wissen',
        body: 'Jedes Phänomen, auf dem die Werkzeuge beruhen, erklärt: was passiert, die Formel, was sie annimmt und wie man jede Eingabe misst, mit welchem Gerät. Das ⓘ neben jedem Feld öffnet denselben Rat und führt hierher.',
      },
      {
        id: 'supply',
        title: 'Wasserversorgung',
        body: 'Meerwasser-Umkehrosmose für den Spitzentag der Kultur: Zulauf, Sole und ihr Salzgehalt, Energie, Kosten und Speicher. Fertigation mit Drainrecycling: gespartes Wasser und gesparter Dünger, Drain-EC, Natriumanreicherung und wann gespült wird, und der Ertragsverlust durch Salz.',
      },
      {
        id: 'site',
        title: 'Standort und Wirtschaftlichkeit',
        body: 'Projekte mit demselben Standortnamen sind seine Abteilungen; geben Sie jeder ihre Fläche, und der Standort summiert Wasser, Wärme, Ertrag, Arbeit und CO₂, prüft gemeinsame UO und BHKW und berechnet Kosten je kg, Marge und Amortisation.',
      },
      {
        id: 'energy',
        title: 'Energiezentrale',
        body: 'Ein Wintertag Stunde für Stunde: der Wärmebedarf des Hauses, ein tagsüber für sein CO₂ laufendes Gas-BHKW, der Puffer, der seine Wärme in die Nacht trägt, und der Kessel für den Rest; Gas, Strom und Kosten. Und die Wärme in gekühltem Brunnenwasser.',
      },
      {
        id: 'operations',
        title: 'Betrieb',
        body: 'Ein Tagebuch für Kontrollen, Nützlinge, Spritzungen (WHO-Klasse Ia und Ib abgelehnt), Wartung und Ernte; die tägliche Hygiene-Checkliste; der Wartungsplan mit Fälligem und Überfälligem; und ein Hitzeplan für die Arbeitenden nach dem Hitzeindex.',
      },
      {
        id: 'data',
        title: 'Live-Daten',
        body: 'Die CSV eines Datenloggers importieren oder eine Beispielwoche laden und mit dem vergleichen, was die Werkzeuge erwarten: VPD im Bereich, Tag- und Nachttemperaturen, Drain; VPD und Temperatur je Tagesstunde; und Alarme für Krankheitsrisiko, Hitzebelastung, Drain-EC, Temperatur und pH.',
      },
    ],
    sourcesTitle: 'Quellen',
    sources: [
      'ASAE EP406: Heizen, Lüften und Kühlen von Gewächshäusern (U-Werte, Undichtheiten, Sockelverluste, Pad and Fan).',
      'Boulard & Baille (1995): natürliche Lüftung von Gewächshäusern über Firstklappen.',
      'FAO Irrigation and Drainage Paper 56: Dampfdruck, Tageslänge, latente Wärme.',
      'Stull (2011): Feuchtkugeltemperatur aus Temperatur und Luftfeuchte.',
      'Stanghellini (1987) und niederländische Praxis: Transpiration aus der Strahlung.',
      'Thimijan & Heins (1983): Umrechnung von Sonnenlicht in Photonen für Pflanzen.',
      'Nederhoff (1994): CO₂-Düngung, Verluste und Aufnahme im Gewächshaus.',
      'Campen et al. (2003): Entfeuchtung von Gewächshäusern durch Lüftung und Wärme.',
      'Soussi et al. (2022): Klimaregelung und Kühlung von Gewächshäusern in heißen, trockenen Regionen.',
      'Shamshiri et al. (2018): optimale Temperatur, Feuchte und VPD für Gewächshaustomaten.',
      'Ishii et al.: Nebelkühlung gegen Pad and Fan in einem Gewächshaus in Arizona.',
    ],
    limitsTitle: 'Grenzen',
    limits: [
      'Monatsmittel verdecken Kälte- und Hitzewellen: Die Spitzenwerkzeuge nutzen dafür Auslegungswerte.',
      'Wärme- und Wasserzahlen dienen der Planung; messen Sie das echte Haus und passen Sie an.',
      'Preise sind Beispiele; geben Sie Ihren eigenen Tarif ein.',
    ],
    open: 'Öffnen',
  },

  notes: {
    'fert.flushCl': (v) =>
      `Chlorid im Drain erreicht ${v['cl']} mmol/L in etwa ${v['days']} Tagen: dann den Kreislauf spülen.`,
    'fert.flushEc': (v) =>
      `Das Salz hebt die EC in etwa ${v['days']} Tagen auf die Obergrenze von ${v['ec']} dS/m: dann den Kreislauf spülen.`,
    'fert.bleed': (v) =>
      `Täglich ${v['m3']} m³ Drainwasser abzulassen hält den Kreislauf ohne Spülen unter seinen Grenzen: ${v['saved']} m³ weniger im Jahr als beim Spülen an der Obergrenze.`,
    'coolYear.range': (v) =>
      `${v['kwh']} kWh/m² im Jahr: im veröffentlichten Bereich für Mittelmeer-Gewächshäuser (etwa 10; hier ${v['pct']} %).`,
    'coolYear.high': (v) =>
      `${v['kwh']} kWh/m² im Jahr, ${v['pct']} % der veröffentlichten 10: Lüfterleistung prüfen, früher schattieren oder nebeln statt Pads.`,
    'coolYear.low': (v) =>
      `${v['kwh']} kWh/m² im Jahr, deutlich unter den veröffentlichten 10 (${v['pct']} %): milder Standort oder leerer Sommer; Starttemperatur prüfen.`,
    'coolYear.fans': (v) =>
      `Lüfter mit ${v['w']} W je m³/h sind verschlissen oder kämpfen gegen verschmutzte Pads: ein Lüftertest und saubere Pads senken die Rechnung.`,
    'coolYear.airflow': (v) =>
      `${v['q']} m³/h je m² liegt außerhalb der üblichen 120–150 für Pad und Lüfter.`,
    'coolYear.peakMonth': (v) =>
      `${v['month']} braucht ${v['pct']} % des Kühlstroms im Jahr.`,
    'data.vpdBand': (v) =>
      `Das VPD lag ${v['pct']} % der Zeit in seinem Bereich.`,
    'data.dayOk': (v) =>
      `Die Tage lagen im Mittel bei ${v['t']} °C, innerhalb ${v['min']}–${v['max']} °C.`,
    'data.dayOff': (v) =>
      `Die Tage lagen im Mittel bei ${v['t']} °C, außerhalb ${v['min']}–${v['max']} °C.`,
    'data.nightOk': (v) =>
      `Die Nächte lagen im Mittel bei ${v['t']} °C, innerhalb ${v['min']}–${v['max']} °C.`,
    'data.nightOff': (v) =>
      `Die Nächte lagen im Mittel bei ${v['t']} °C, außerhalb ${v['min']}–${v['max']} °C.`,
    'data.drain': (v) =>
      `Der Drain lag im Mittel bei ${v['pct']} % bei ${v['plan']} % Plan.`,
    'data.alerts': (v) => `${v['n']} Alarme: siehe Liste unten.`,
    'data.noAlerts': (v) => `Keine Alarme (${v['n']}).`,
    'ops.bannedSpray': (v) =>
      `Mittel der WHO-Klasse ${v['cls']} sind nicht erlaubt: ein anderes Mittel wählen.`,
    'heat.none': (v) =>
      `Hitzeindex ${v['hi']} °C: keine Hitzegefahr (${v['rest']} min Pause, ${v['water']} L je Stunde).`,
    'heat.caution': (v) =>
      `Hitzeindex ${v['hi']} °C: Vorsicht. ${v['rest']} min Pause je Stunde und ${v['water']} L je Stunde trinken.`,
    'heat.extremeCaution': (v) =>
      `Hitzeindex ${v['hi']} °C: große Vorsicht. ${v['rest']} min Pause je Stunde und ${v['water']} L je Stunde trinken.`,
    'heat.danger': (v) =>
      `Hitzeindex ${v['hi']} °C: Gefahr. ${v['rest']} min Pause je Stunde, ${v['water']} L je Stunde trinken, keine schwere Arbeit.`,
    'heat.extremeDanger': (v) =>
      `Hitzeindex ${v['hi']} °C: extreme Gefahr. Arbeit drinnen einstellen (${v['rest']} min Pause, ${v['water']} L je Stunde).`,
    'energy.share': (v) =>
      `Das BHKW deckt ${v['pct']} % der Tageswärme; der Kessel ergänzt ${v['boiler']} MWh.`,
    'energy.dump': (v) =>
      `${v['mwh']} MWh BHKW-Wärme werden abgeführt: ein größerer Puffer oder eine kürzere Laufzeit würde sie halten.`,
    'energy.buffer': (v) =>
      `Der Puffer hält ${v['mwh']} MWh, um die Tageswärme in die Nacht zu tragen.`,
    'energy.co2Enough': (v) =>
      `Das Abgas des BHKW liefert ${v['kg']} kg CO₂, genug für die ${v['need']} kg, die die Kultur aufnimmt.`,
    'energy.co2Short': (v) =>
      `Das Abgas des BHKW liefert ${v['kg']} kg CO₂, weniger als die ${v['need']} kg, die die Kultur aufnimmt: flüssiges CO₂ ergänzen oder länger laufen.`,
    'energy.ventsShut': () =>
      'BHKW-CO₂ lohnt nur bei fast geschlossener Lüftung (über etwa 5 % offen hält es sich nicht): für Wintertage planen.',
    'reuse.heat': (v) =>
      `Jeder gekühlte m³ hält ${v['kwh']} kWh: ${v['mwh']} MWh pro Tag zur Rückgewinnung.`,
    'reuse.cover': (v) =>
      `Das deckt ${v['pct']} % des Wärmebedarfs am Wintertag.`,
    'reuse.heatPump': () =>
      'Bei 15–40 °C braucht diese Wärme eine Wärmepumpe oder einen Niedertemperaturkreis.',
    'econ.margin': (v) => `Eine Marge von ${v['pct']} % des Umsatzes.`,
    'econ.loss': (v) =>
      `Die Kosten übersteigen den Umsatz (Marge ${v['pct']} %).`,
    'econ.biggest.labour': (v) =>
      `Arbeit ist der größte Kostenblock: ${v['pct']} %.`,
    'econ.biggest.energy': (v) =>
      `Energie ist der größte Kostenblock: ${v['pct']} %.`,
    'econ.biggest.water': (v) =>
      `Wasser ist der größte Kostenblock: ${v['pct']} %.`,
    'econ.biggest.inputs': (v) =>
      `Dünger und Pflanzenschutz sind der größte Kostenblock: ${v['pct']} %.`,
    'econ.biggest.other': (v) =>
      `Verpackung und Gemeinkosten sind der größte Kostenblock: ${v['pct']} %.`,
    'econ.payback': (v) =>
      `Der Bau amortisiert sich in etwa ${v['years']} Jahren.`,
    'econ.prices': () =>
      'Die Preise sind Beispiele (Exporttomaten erzielten von Januar bis April 2016 1,24–1,94 EUR/kg): eigene eingeben.',
    'ro.balance': (v) =>
      `${v['feed']} m³ Meerwasser pro Tag ergeben das Permeat und ${v['brine']} m³ Sole mit ${v['salinity']} g/L.`,
    'ro.recoveryHigh': (v) =>
      `Ausbeute ${v['pct']} %: über 50 % verkrustet die Sole die Membranen; Grenze des Lieferanten prüfen.`,
    'ro.short': (v) =>
      `Die Anlage deckt nur ${v['pct']} % des Bedarfs: es fehlen ${v['m3']} m³ pro Tag. Leistung oder Speicher ergänzen.`,
    'ro.headroom': (v) =>
      `Die Anlage hat ${v['pct']} % Reserve über dem Spitzentag.`,
    'ro.lowSec': () =>
      'Unter 2,5 kWh/m³ liegt unter dem, was Meerwasser-UO erreicht; den Wert prüfen.',
    'ro.highSec': () =>
      'Über 4,5 kWh/m³: ein Energierückgewinner brächte ihn auf 3–4.',
    'ro.product': (v) =>
      `Das Permeat enthält etwa ${v['mg']} mg/L Salz (EC ${v['ec']} dS/m); sein Natrium bestimmt, wie lange der Nährstoffkreislauf läuft.`,
    'ro.brine': () =>
      'Die Sole geht über einen Diffusor mit Einleitgenehmigung ins Meer zurück; die Einleitung mit der Behörde planen.',
    'fert.water': (v) =>
      `${v['reused']} m³ Drain pro Tag wiederverwendet: ${v['pct']} % des gegebenen Wassers.`,
    'fert.drainHigh': (v) =>
      `Drain-EC ${v['ec']} dS/m liegt an oder über der Grenze ${v['max']}: mehr Drain geben oder spülen.`,
    'fert.yield': (v) =>
      `Eine Wurzelraum-EC von ${v['ec']} dS/m kostet etwa ${v['pct']} % des Ertrags (Richtwert).`,
    'fert.flush': (v) =>
      `Natrium im Drain erreicht ${v['na']} mmol/L in etwa ${v['days']} Tagen: dann den Kreislauf spülen.`,
    'fert.levels': (v) =>
      `Im Drain pendelt sich Natrium bei ${v['na']}, Chlorid bei ${v['cl']} mmol/L unter den Grenzen ein: kein Spülen nötig.`,
    'fert.saltySource': () =>
      'Frischwasser mit über 3 mmol/L Natrium füllt den Kreislauf schnell mit Salz: mit Osmosewasser mischen oder mehr Drain abgeben.',
    'fert.lowDrain': () =>
      'Unter 20 % Drain bei salzigem Wasser: Salze reichern sich in den Matten an.',
    'fert.disinfect': () =>
      'Den wiederverwendeten Drain desinfizieren (UV, Hitze oder Langsamsandfilter), bevor er zurück zur Kultur geht.',
    'vpd.tooWet': (v) =>
      `VPD ${v['vpd']} kPa: unter ${v['min']} kPa für dieses Stadium, die Luft ist zu feucht.`,
    'vpd.good': (v) =>
      `VPD ${v['vpd']} kPa: im Bereich ${v['min']}–${v['max']} kPa für dieses Stadium.`,
    'vpd.tooDry': (v) =>
      `VPD ${v['vpd']} kPa: über ${v['max']} kPa für dieses Stadium, die Luft ist zu trocken.`,
    'vpd.disease': () =>
      'Unter 0,3 kPa: Botrytis, Mehltau und weiches Wachstum.',
    'vpd.wilting': () =>
      'Über 1,5 kPa welkt die Kultur: schattieren und befeuchten.',
    'vpd.arid': () =>
      '3 kPa oder mehr: Wüstenluft, das Wachstum stockt. Nebel oder Pads, und Schattierung.',
    'vpd.cold': (v) =>
      `Unter ${v['min']} °C für dieses Stadium: erst heizen, dann lüften.`,
    'vpd.hot': (v) =>
      `Über ${v['max']} °C für dieses Stadium: schattieren und kühlen.`,
    'vpd.outsideWetter': () =>
      'Die Außenluft hält mehr Wasser als die Innenluft: Lüften trocknet das Haus nicht, Heizen schon.',
    'vpd.samePairs': (v) =>
      `Ein VPD passt zu vielen Paaren: ${v['vpd']} kPa braucht bei 15 °C trockenere Luft als bei 35 °C, also Temperatur und Feuchte zusammen lesen.`,
    'fog.cooling': (v) =>
      `Nebel bringt das Haus auf ${v['inside']} °C, ${v['drop']} K unter außen, bei ${v['rh']} % Feuchte.`,
    'fog.tooHumid': () =>
      'Das Haus liegt ohne Nebel über der Feuchtegrenze: Nebeln würde nur die Kultur nässen.',
    'fog.moreNozzles': () =>
      'Die Düsen laufen unter der Grenze ständig: mehr Düsen würden weiter kühlen.',
    'fog.cycle': (v) =>
      `${v['on']} s an und ${v['off']} s aus halten die Luft nahe ${v['rh']} % (60 s an, 180 s aus ist ein üblicher Start).`,
    'fog.lowPressure': () =>
      'Unter 40 bar sind die Tröpfchen zu groß, um in der Luft zu verdunsten: sie nässen die Blätter.',
    'fog.droplets': () =>
      'Hochdruck gibt Tröpfchen von 10–30 µm, die verdunsten, bevor sie fallen.',
    'fog.trimVents': () =>
      'Weit offene Lüftung trägt den Nebel fort: beim Nebeln auf 5–15 % der Fläche drosseln.',
    'fog.waterQuality': () =>
      'Entsalztes oder enthärtetes Wasser nehmen: Salze verstopfen die Düsen und machen die Früchte fleckig.',
    'advice.notBuildable': (v) =>
      `${v['pct']} % der Fläche als Lüftung und ${v['flow']} Millionen m³/h Luft: mehr, als ein Dach öffnet (höchstens etwa ${v['limit']} %).`,
    'advice.vents': () => 'Die Dachlüftung schafft diesen Nachmittag.',
    'advice.ventsAndShade': (v) =>
      `Mit ${v['shade']} % Schattierung braucht die Lüftung ${v['pct']} % der Fläche: zuerst schattieren.`,
    'advice.shadeAndFog': (v) =>
      `${v['shade']} % Schattierung und Nebel halten das Haus nahe ${v['inside']} °C bei gedrosselter Lüftung. Nebel passt zu langen, großen Häusern.`,
    'advice.shadeAndPad': (v) =>
      `${v['shade']} % Schattierung und Pads: Die Luft verlässt das nasse Pad mit etwa ${v['pad']} °C. Mit ${v['length']} m ist das Haus kurz genug für Pads.`,
    'advice.humid': () =>
      'Feuchte Außenluft: Verdunstung kühlt wenig. Schattieren, und nachts kühlen.',
    'calendar.season': (v) =>
      `Gepflanzt in Woche ${v['plant']}, endet die Kultur in Woche ${v['end']}: ${v['weeks']} Wochen im Haus.`,
    'calendar.harvest': (v) =>
      `Ernte ab Woche ${v['first']}, ${v['weeks']} Wochen lang.`,
    'calendar.heating': (v) =>
      `Heizung ab Woche ${v['from']}, ${v['weeks']} Wochen im Jahr.`,
    'calendar.co2': (v) =>
      `CO₂ lohnt sich ${v['weeks']} Wochen, wenn das Haus geschlossen bleibt.`,
    'calendar.fog': (v) =>
      `Nebel oder Pads für ${v['weeks']} Wochen heißer Nachmittage.`,
    'calendar.shade': (v) =>
      `Schattierung für ${v['weeks']} Wochen starker Sonne.`,
    'calendar.shortCleanOut': (v) =>
      `Nur ${v['weeks']} Wochen zwischen zwei Kulturen: wenig Zeit zum Reinigen und Desinfizieren.`,
    'geometry.lowGutter': (v) =>
      `Traufe bei ${v['gutter']} m: Ein niedriges Haus heizt sich auf und bleibt feucht. 4 m oder mehr puffern besser.`,
    'geometry.goodVolume': (v) =>
      `Mittlere Höhe ${v['height']} m: genug Luft, um Wärme und Feuchte zu puffern.`,
    'geometry.flatRoof': (v) =>
      `Dachneigung ${v['slope']}°: Unter etwa 20° tropft Kondenswasser auf die Kultur, und im Winter kommt weniger Sonne herein.`,
    'geometry.longHouse': (v) =>
      `${v['length']} m lang: Pad-and-Fan-Kühlung arbeitet am besten unter 40–50 m vom Pad zum Ventilator.`,
    'heat.noLoad': () =>
      'Draußen ist es nicht kälter als drinnen: keine Wärme nötig.',
    'heat.perM2': (v) =>
      `${v['w']} W pro m² Grundfläche in der Auslegungsnacht.`,
    'heat.leaky': (v) =>
      `${v['pct']} % der Wärme gehen durch Undichtheiten verloren: Dichten Sie zuerst Türen, Klappen und Folienränder ab.`,
    'heat.screenOpen': () =>
      'Der Schirm ist offen gerechnet. Ihn in kalten Nächten zu schließen, senkt die Last.',
    'heat.addScreen': () =>
      'Kein Schirm: Ein Energieschirm spart 25–45 % der Nachtwärme.',
    'year.none': () =>
      'In einem durchschnittlichen Jahr ist keine Heizung nötig.',
    'year.season': (v) =>
      `Heizen ${v['months']} Monate im Jahr, am meisten im ${v['peak']}.`,
    'year.mostlyNights': (v) =>
      `${v['pct']} % der Wärme fallen nachts an: Ein Schirm und ein dichtes Haus zahlen sich am schnellsten aus.`,
    'year.screenSaves': () =>
      'Ein Energieschirm würde dies um ein Viertel oder mehr senken.',
    'year.geothermal': () =>
      'Thermalwasser: kein Brennstoff verbrannt, nur der Strom der Pumpe.',
    'year.high': (v) =>
      `${v['kwh']} kWh pro m²: hoch für ein Mittelmeerhaus. Prüfen Sie die Sollwerte und die Eindeckung.`,
    'pipes.tooCold': () =>
      'Das Wasser ist nicht wärmer als die Luft: Es kann das Haus nicht heizen.',
    'pipes.tooMany': (v) =>
      `${v['m']} m Rohr pro m² Grundfläche: zu viel zum Verlegen. Nehmen Sie wärmeres Wasser, ein dickeres Rohr oder weniger Grad.`,
    'pipes.fits': (v) => `${v['m']} m Rohr pro m² Grundfläche: Das passt.`,
    'pipes.smallDrop': () =>
      'Unter 5 K zwischen Vor- und Rücklauf: Der Strom wird groß; streben Sie 15–25 K an.',
    'pipes.fast': (v) =>
      `${v['v']} m/s in jedem Kreis: laut und teuer zu pumpen. Fügen Sie Kreise hinzu oder nehmen Sie ein dickeres Rohr.`,
    'pipes.slow': (v) =>
      `${v['v']} m/s in jedem Kreis: Das Wasser kühlt entlang des Kreises ab, das ferne Ende bleibt kälter. Weniger, längere Kreise helfen.`,
    'pipes.peOk': () =>
      'Kunststoffrohr eignet sich für Thermalwasser bis etwa 70 °C; prüfen Sie seine Einstufung.',
    'pipes.peHot': () =>
      'Über 75 °C ist für die meisten Kunststoffrohre zu heiß: Nehmen Sie Stahl, oder mischen Sie das Wasser herunter.',
    'vent.coverEnough': () =>
      'Die Hülle allein gibt diese Wärme ab: keine zusätzliche Lüftung nötig.',
    'vent.naturalOk': (v) =>
      `Firstklappen von ${v['pct']} % der Grundfläche: für ein normales Haus erreichbar.`,
    'vent.naturalTight': (v) =>
      `Klappen von ${v['pct']} % der Grundfläche: mehr, als die meisten Dächer öffnen. Ergänzen Sie Seitenlüftung oder Schattierung.`,
    'vent.naturalShort': (v) =>
      `Klappen von ${v['pct']} % der Grundfläche: Natürliche Lüftung schafft das nicht. Schattieren Sie, oder nutzen Sie Pad and Fan.`,
    'vent.extreme': (v) =>
      `${v['ach']} Luftwechsel pro Stunde: mehr als einer pro Minute ist hart für die Kultur. Schattieren oder verdunstend kühlen.`,
    'vent.hotOutside': () =>
      'Bei 30 °C draußen kann Luft allein das Haus nicht unter die Außentemperatur kühlen: siehe Pad and Fan.',
    'vent.tryShade': () =>
      'Keine Schattierung gerechnet: Ein Schirm mit 30–50 % oder Kalken senkt die nötige Luft um ebenso viel.',
    'pad.cooling': (v) =>
      `Das Pad kühlt die Luft um ${v['drop']} K; sie verlässt das Haus mit ${v['exhaust']} °C.`,
    'pad.humid': () =>
      'Feuchte Außenluft: Verdunstung kühlt wenig. Pads arbeiten am besten unter etwa 50 % Luftfeuchte.',
    'pad.tooLong': (v) =>
      `${v['m']} m von den Pads zu den Ventilatoren: Das ferne Ende wird heiß. Bleiben Sie unter 40–50 m, oder kühlen Sie von beiden Enden.`,
    'pad.fastFace': () =>
      'Luft zu schnell durch das Pad: Tropfen werden mitgerissen, der Wirkungsgrad sinkt.',
    'pad.waterQuality': () =>
      'Salziges oder hartes Wasser verkalkt die Pads: Leiten Sie einen Teil des Wassers ab und prüfen Sie seine Qualität.',
    'water.peak': (v) =>
      `Spitze im ${v['month']}: ${v['l']} L pro m² am Tag, Drain eingerechnet.`,
    'water.highPeak': () =>
      'Über 9 L pro m² am Tag: Prüfen Sie den Drain und die Schattierung.',
    'water.lowDrain': () =>
      'Unter 15 % Drain: Salze reichern sich in der Matte an, erst recht bei Brackwasser.',
    'water.manyShots': (v) =>
      `${v['shots']} Gaben am Tag: Nehmen Sie größere Gaben oder mehr Tropfer.`,
    'water.sections': (v) =>
      `Die Pumpe kann nicht alle Tropfer zugleich versorgen: in ${v['sections']} Sektoren bewässern.`,
    'rain.coverage': (v) => `Regen deckt ${v['pct']} % der Bewässerung.`,
    'rain.basinSmall': (v) =>
      `Das Becken läuft mit nutzbarem Regen über: etwa ${v['m3']} m³ fangen das meiste auf.`,
    'rain.basinBig': (v) =>
      `Etwa ${v['m3']} m³ reichen: Ein größeres Becken bringt wenig.`,
    'rain.storm': (v) =>
      `Ein Starkregen von ${v['mm']} mm bringt ${v['m3']} m³ vom Dach: Das Becken sollte mindestens so viel fassen.`,
    'rain.dry': (v) =>
      `${v['mm']} mm Regen im Jahr: Das hilft, aber die Bewässerung braucht eine weitere Quelle.`,
    'rain.firstFlush': () =>
      'Leiten Sie die ersten Millimeter jedes Regens ab: Sie spülen Staub und Vogelkot vom Dach.',
    'light.none': () =>
      'Die Sonne erreicht das Ziel in jedem Monat: keine Leuchten nötig.',
    'light.months': (v) =>
      `Leuchten helfen ${v['months']} Monate im Jahr; der ${v['month']} bestimmt ihre Größe.`,
    'light.highPpfd': (v) =>
      `${v['ppfd']} µmol/m²·s sind viele Leuchten: Senken Sie das Ziel oder lassen Sie sie länger brennen.`,
    'light.shade': (v) =>
      `Schattieren ${v['months']} Monate im Jahr, bis zu ${v['pct']} % im ${v['peak']}.`,
    'light.targetOverCeiling': () =>
      'Das Ziel liegt über der Schattiergrenze: Heben Sie die Grenze an oder senken Sie das Ziel.',
    'co2.noLift': () =>
      'Das Ziel liegt nicht über dem Außenwert: nichts hinzuzufügen.',
    'co2.leaky': (v) =>
      `${v['pct']} % des CO₂ entweichen mit der Luft: Düngen Sie bei geschlossenen Klappen, oder zielen Sie niedriger, wenn sie öffnen.`,
    'co2.used': (v) =>
      `Die Kultur nimmt ${v['pct']} % dessen auf, was Sie zuführen.`,
    'co2.highTarget': () =>
      'Über etwa 1000 ppm gewinnt die Kultur für das zusätzliche CO₂ kaum noch etwas.',
    'co2.burnerHeat': (v) =>
      `Der Brenner liefert mit dem CO₂ ${v['kw']} kW Wärme: Speichern Sie sie für die Nacht in einem Pufferspeicher.`,
    'co2.flue': () =>
      'Nur ein für CO₂-Dosierung gebauter Brenner mit sauberem Erdgas, dessen Rauchgas auf CO und NOₓ geprüft wird.',
    'humidity.vpdLow': (v) =>
      `VPD ${v['vpd']} kPa: Die Luft ist nahezu gesättigt, Botrytis und Mehltau gedeihen. Streben Sie über 0,3 kPa an.`,
    'humidity.vpdOk': (v) => `VPD ${v['vpd']} kPa: ein gesundes Nachtklima.`,
    'humidity.vpdHigh': (v) =>
      `VPD ${v['vpd']} kPa: trocken für die Nacht; die Kultur kann gestresst werden.`,
    'humidity.condensation': (v) =>
      `Die Eindeckung hat ${v['surface']} °C, unter dem Taupunkt (${v['dew']} °C): Sie tropft auf die Kultur. Ein Schirm, etwas Luft oder Rohre nahe dem Dach helfen.`,
    'humidity.outsideWetter': () =>
      'Die Außenluft enthält mehr Wasser als die Innenluft: Lüften kann das Haus nicht trocknen. Heizen Sie, oder nutzen Sie einen Entfeuchter.',
    'humidity.heat': (v) =>
      `Die hereingeholte Luft zu erwärmen, braucht ${v['kw']} kW (${v['wm2']} W/m²).`,
  } as Record<string, NoteWriter>,
};
