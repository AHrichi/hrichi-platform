import { MaterialItem } from '../models/lighting.models';

export const MATERIALS_CATALOG: MaterialItem[] = [
  // POLES / CANDÉLABRES
  {
    id: 'pole-steel-octo-8m',
    category: 'pole',
    name: 'Mât Octogonal Acier Galvanisé 8m',
    manufacturer: 'Valmont / Petitjean',
    specsSummary:
      'Hauteur 8m, acier galvanisé à chaud selon ISO 1461, embase carrée 300x300mm, crosse simple 1.5m.',
    estimatedUnitCostEur: 380,
    keyAttributes: {
      heightMeters: 8,
      material: 'Acier S235 galvanisé',
      shape: 'Octogonal tronconique',
      baseDiameterMm: 168,
      topDiameterMm: 76,
      baseplateMm: '300x300x15',
      boltCircleMm: 300,
      standardCompliant: 'EN 40-3',
    },
  },
  {
    id: 'pole-steel-octo-10m',
    category: 'pole',
    name: 'Mât Octogonal Acier Galvanisé 10m',
    manufacturer: 'Valmont / Petitjean',
    specsSummary:
      'Hauteur 10m, acier haute résistance galvanisé à chaud, embase 400x400mm pour voiries principales et giratoires.',
    estimatedUnitCostEur: 520,
    keyAttributes: {
      heightMeters: 10,
      material: 'Acier S235 galvanisé',
      shape: 'Octogonal tronconique',
      baseDiameterMm: 194,
      topDiameterMm: 76,
      baseplateMm: '400x400x20',
      boltCircleMm: 400,
      standardCompliant: 'EN 40-3',
    },
  },
  {
    id: 'pole-alu-conic-6m',
    category: 'pole',
    name: 'Mât Conique Aluminium Anodisé 6m',
    manufacturer: 'Europoles / Alumont',
    specsSummary:
      'Hauteur 6m en alliage d’aluminium anti-corrosion marine, idéal pour bords de mer et zones piétonnes.',
    estimatedUnitCostEur: 440,
    keyAttributes: {
      heightMeters: 6,
      material: 'Aluminium 6060-T6',
      shape: 'Conique sans soudure',
      baseDiameterMm: 145,
      topDiameterMm: 60,
      baseplateMm: '260x260x15',
      boltCircleMm: 200,
      standardCompliant: 'EN 40-6 (Alu)',
    },
  },
  {
    id: 'pole-solar-dedicated-8m',
    category: 'pole',
    name: 'Mât Candélabre Solaire Renforcé 8m',
    manufacturer: 'Sunna Design / Fonroche Specs',
    specsSummary:
      'Fût renforcé pour supporter le moment de renversement de panneau PV 250Wc en tête, compartiment batterie ventilé.',
    estimatedUnitCostEur: 590,
    keyAttributes: {
      heightMeters: 8,
      material: 'Acier S355 galvanisé thermolaqué',
      shape: 'Cylindro-conique renforcé',
      baseDiameterMm: 180,
      topDiameterMm: 89,
      baseplateMm: '350x350x20',
      boltCircleMm: 300,
      standardCompliant: 'EN 40 & Eurocode 1 Zone 4',
    },
  },

  // LUMINAIRES
  {
    id: 'lum-philips-roadflair-70w',
    category: 'luminaire',
    name: 'Philips RoadFlair Gen2 LED 70W',
    manufacturer: 'Signify (Philips)',
    specsSummary:
      '70W, 10 500 lm (150 lm/W), 4000K neutre, optique routière moyenne (DM), IP66, IK08, parasurtenseur 10kV.',
    estimatedUnitCostEur: 210,
    keyAttributes: {
      wattage: 70,
      lumens: 10500,
      efficiencyLmW: 150,
      colorTempK: 4000,
      cri: 70,
      ipRating: 'IP66',
      ikRating: 'IK08',
      driverProtocol: '1-10V / DALI / Auto-dimming 5-step',
      lifespanHours: '100 000h (L80B10)',
    },
  },
  {
    id: 'lum-schreder-teceo-100w',
    category: 'luminaire',
    name: 'Schréder Teceo 1 LED 100W',
    manufacturer: 'Schréder',
    specsSummary:
      '100W, 14 800 lm, 3000K blanc chaud écologique, optique LensoFlex4 haute performance, IP66, IK10 verre trempé.',
    estimatedUnitCostEur: 285,
    keyAttributes: {
      wattage: 100,
      lumens: 14800,
      efficiencyLmW: 148,
      colorTempK: 3000,
      cri: 70,
      ipRating: 'IP66',
      ikRating: 'IK10',
      driverProtocol: 'DALI / Bi-power autonomie',
      lifespanHours: '100 000h (L90B10)',
    },
  },
  {
    id: 'lum-solar-dc-40w',
    category: 'luminaire',
    name: 'Luminaire LED DC 40W Haute Efficience Solaire',
    manufacturer: 'HelioLux Pro / Cree LEDs',
    specsSummary:
      '40W DC 12/24V, 7 200 lm (180 lm/W ultra-haute efficacité), dimming intelligent programmable MPPT, IP67.',
    estimatedUnitCostEur: 165,
    keyAttributes: {
      wattage: 40,
      lumens: 7200,
      efficiencyLmW: 180,
      voltage: '12V / 24V DC',
      colorTempK: 4000,
      ipRating: 'IP67',
      ikRating: 'IK09',
      lifespanHours: '80 000h',
    },
  },

  // SOLAR PANELS
  {
    id: 'pv-mono-180w',
    category: 'solar_panel',
    name: 'Panneau Solaire Monocristallin PERC 180Wc',
    manufacturer: 'JA Solar / Longi Specs',
    specsSummary:
      '180 Wc, cellules mono PERC 9BB, tension Voc 24.2V, cadre aluminium anodisé noir renforcé, verre trempé 3.2mm anti-grêle.',
    estimatedUnitCostEur: 110,
    keyAttributes: {
      peakWatts: 180,
      cellType: 'Monocristallin PERC',
      dimensionsMm: '1330 x 670 x 30',
      areaM2: 0.89,
      efficiencyPct: 20.2,
      mechanicalLoadPa: 5400,
      warrantyYears: 25,
    },
  },
  {
    id: 'pv-mono-280w',
    category: 'solar_panel',
    name: 'Panneau Solaire Monocristallin PERC 280Wc',
    manufacturer: 'Trina Solar / Canadian Solar',
    specsSummary:
      '280 Wc, tension Voc 38.5V pour système 24V MPPT, support d’inclinaison réglable 20° - 40° orientable Sud.',
    estimatedUnitCostEur: 145,
    keyAttributes: {
      peakWatts: 280,
      cellType: 'Monocristallin PERC',
      dimensionsMm: '1650 x 880 x 35',
      areaM2: 1.45,
      efficiencyPct: 20.8,
      mechanicalLoadPa: 5400,
      warrantyYears: 25,
    },
  },

  // BATTERIES
  {
    id: 'bat-lifepo4-12v-60ah',
    category: 'battery',
    name: 'Batterie LiFePO4 12.8V 60Ah (768 Wh)',
    manufacturer: 'CATL / EVE Cells Grade A',
    specsSummary:
      '768 Wh, 4S LiFePO4 avec BMS intelligent intégré, 3 500 cycles à 80% DoD, boîtier étanche IP67 en aluminium.',
    estimatedUnitCostEur: 230,
    keyAttributes: {
      voltage: 12.8,
      capacityAh: 60,
      energyWh: 768,
      chemistry: 'LiFePO4 (Phosphate de fer lithié)',
      cycleLife: '3500 cycles @ 80% DoD',
      tempRangeC: '-20°C à +65°C',
      bmsProtection: 'Surcharge, décharge profonde, court-circuit, T°',
    },
  },
  {
    id: 'bat-lifepo4-24v-60ah',
    category: 'battery',
    name: 'Batterie LiFePO4 25.6V 60Ah (1 536 Wh)',
    manufacturer: 'CATL / Pylontech Specs',
    specsSummary:
      '1 536 Wh haute capacité pour candélabres solaires 8m-10m avec 3 à 4 jours d’autonomie garantie sans soleil.',
    estimatedUnitCostEur: 420,
    keyAttributes: {
      voltage: 25.6,
      capacityAh: 60,
      energyWh: 1536,
      chemistry: 'LiFePO4',
      cycleLife: '4000 cycles @ 80% DoD',
      tempRangeC: '-20°C à +65°C',
      bmsProtection: 'BMS actif avec équilibrage des cellules',
    },
  },

  // ANCHOR BOLTS / ACCESSOIRES DE FONDATION
  {
    id: 'anchor-bolts-m20-600',
    category: 'anchor_bolts',
    name: 'Kit 4 Tiges d’Ancrage M20 x 600mm + Gabarit',
    manufacturer: 'Fixations Travaux Publics',
    specsSummary:
      '4 tiges filetées M20 acier zingué 8.8 avec crosses d’ancrage 100mm, 8 écrous, 8 rondelles, gabarit en tôle 300x300mm.',
    estimatedUnitCostEur: 58,
    keyAttributes: {
      diameter: 'M20',
      lengthMm: 600,
      steelGrade: 'Classe 8.8 zingué',
      threadPitchMm: 2.5,
      gabaritPitchMm: 300,
      safeTensileLoadKn: 125,
    },
  },
  {
    id: 'anchor-bolts-m24-700',
    category: 'anchor_bolts',
    name: 'Kit 4 Tiges d’Ancrage M24 x 700mm + Gabarit',
    manufacturer: 'Fixations Travaux Publics',
    specsSummary:
      '4 tiges M24 classe 8.8 pour mâts de 10m à 12m et mâts solaires lourds, gabarit 400x400mm.',
    estimatedUnitCostEur: 85,
    keyAttributes: {
      diameter: 'M24',
      lengthMm: 700,
      steelGrade: 'Classe 8.8 zingué',
      threadPitchMm: 3.0,
      gabaritPitchMm: 400,
      safeTensileLoadKn: 180,
    },
  },

  // CABLES
  {
    id: 'cable-u1000-3g6',
    category: 'cable',
    name: 'Câble Énergie Armé U-1000 AR2V / R2V 3G6 mm²',
    manufacturer: 'Nexans / Prysmian',
    specsSummary:
      'Câble cuivre 3G6mm² pour réseau souterrain éclairage public 230V monophasé, isolation XLPE, gaine PVC noire.',
    estimatedUnitCostEur: 3.2,
    unit: 'm',
    keyAttributes: {
      conductor: 'Cuivre classe 2',
      crossSectionMm2: 6,
      cores: '3 (Ph + N + Terre)',
      insulation: 'XLPE / PVC 0.6/1kV',
      standardCompliant: 'NF C 32-321',
    },
  },
  {
    id: 'cable-u1000-4g10',
    category: 'cable',
    name: 'Câble Énergie Armé U-1000 R2V 4G10 mm²',
    manufacturer: 'Nexans / Prysmian',
    specsSummary:
      'Câble cuivre 4G10mm² pour départs triphasés 400V équilibrés sur longues distances (> 400m).',
    estimatedUnitCostEur: 5.8,
    unit: 'm',
    keyAttributes: {
      conductor: 'Cuivre',
      crossSectionMm2: 10,
      cores: '4 (3Ph + N)',
      insulation: 'XLPE / PVC 0.6/1kV',
      standardCompliant: 'NF C 32-321',
    },
  },

  // MORE POLES
  {
    id: 'pole-frp-8m',
    category: 'pole',
    name: 'Mât Composite Fibre de Verre (PRV) 8m',
    manufacturer: 'Petitjean / Shakespeare',
    specsSummary:
      'Mât composite PRV 8m, isolant (classe II sans mise à la terre), insensible à la corrosion saline, léger à poser sans grue.',
    estimatedUnitCostEur: 420,
    keyAttributes: {
      heightMeters: 8,
      material: 'Polyester renforcé fibre de verre',
      nominalLoadDaN: 120,
      standardCompliant: 'EN 40-7',
    },
  },
  {
    id: 'pole-concrete-9m',
    category: 'pole',
    name: 'Poteau Béton Armé BT 9m 250 daN',
    manufacturer: 'Sotupa / Bonna Sabla',
    specsSummary:
      'Poteau béton armé vibré 9m, effort nominal 250 daN, pour réseau aérien BT torsadé avec éclairage public.',
    estimatedUnitCostEur: 290,
    keyAttributes: {
      heightMeters: 9,
      material: 'Béton armé',
      nominalLoadDaN: 250,
      standardCompliant: 'NF C 67-200',
    },
  },
  {
    id: 'pole-steel-12m-double',
    category: 'pole',
    name: 'Mât Cylindro-conique Acier 12m Double Crosse',
    manufacturer: 'Valmont / Petitjean',
    specsSummary:
      'Mât 12m pour terre-plein central de voie rapide, double crosse 2 × 2m, acier galvanisé, platine 400 × 400mm.',
    estimatedUnitCostEur: 690,
    keyAttributes: {
      heightMeters: 12,
      material: 'Acier S355 galvanisé',
      arms: 2,
      standardCompliant: 'EN 40-5',
    },
  },
  // MORE LUMINAIRES
  {
    id: 'lum-led-residential-30w',
    category: 'luminaire',
    name: 'Luminaire LED Résidentiel 30W 3000K',
    manufacturer: 'Thorn / Ragni',
    specsSummary:
      'Luminaire LED 30W, 4 200 lm, 3000K, optique routière asymétrique, IP66 IK08, pour rues résidentielles et lotissements.',
    estimatedUnitCostEur: 140,
    keyAttributes: {
      watts: 30,
      lumens: 4200,
      colourTemperatureK: 3000,
      protection: 'IP66 IK08',
    },
  },
  {
    id: 'lum-led-flood-150w',
    category: 'luminaire',
    name: 'Projecteur LED 150W Carrefour / Rond-point',
    manufacturer: 'Schréder / Philips',
    specsSummary:
      'Projecteur LED 150W, 21 000 lm, 4000K, optique symétrique, pour carrefours, ronds-points et places.',
    estimatedUnitCostEur: 330,
    keyAttributes: {
      watts: 150,
      lumens: 21000,
      colourTemperatureK: 4000,
      protection: 'IP66 IK09',
    },
  },
  // MORE SOLAR
  {
    id: 'pv-mono-400w',
    category: 'solar_panel',
    name: 'Panneau Solaire Monocristallin Half-Cut 400Wc',
    manufacturer: 'Longi / Jinko',
    specsSummary:
      'Module 400Wc half-cut PERC, rendement 20,5 %, pour mâts solaires de grande autonomie et luminaires 60–80W.',
    estimatedUnitCostEur: 160,
    keyAttributes: { peakWatts: 400, efficiencyPct: 20.5, cells: 108 },
  },
  {
    id: 'bat-lifepo4-12v-100ah',
    category: 'battery',
    name: 'Batterie LiFePO4 12.8V 100Ah (1 280 Wh)',
    manufacturer: 'Victron / Pylontech',
    specsSummary:
      'Batterie LiFePO4 12.8V 100Ah, BMS intégré, plus de 4 000 cycles à 80 % de décharge, pour 4 à 5 nuits d’autonomie.',
    estimatedUnitCostEur: 360,
    keyAttributes: { voltage: 12.8, capacityAh: 100, cycles: 4000 },
  },
  // MORE ANCHOR BOLTS
  {
    id: 'anchor-bolts-m16-500',
    category: 'anchor_bolts',
    name: 'Kit 4 Tiges d’Ancrage M16 x 500mm + Gabarit',
    manufacturer: 'Sermeto',
    specsSummary:
      'Tiges coudées M16 galvanisées avec gabarit, pour mâts de 4 à 6m (entraxe 200mm).',
    estimatedUnitCostEur: 50,
    keyAttributes: { thread: 'M16', lengthMm: 500, boltCircleMm: 200 },
  },
  // OVERHEAD CABLE AND FITTINGS
  {
    id: 'abc-2x16',
    category: 'overhead_cable',
    name: 'Câble Torsadé BT 2 × 16 mm² Alu (éclairage public)',
    manufacturer: 'Nexans / Chakira Cable',
    specsSummary:
      'Câble aérien autoporteur 2 × 16 mm² aluminium isolé PRC, pour circuits d’éclairage public monophasés.',
    estimatedUnitCostEur: 1.4,
    unit: 'm',
    keyAttributes: {
      cores: 2,
      crossSectionMm2: 16,
      standardCompliant: 'NF C 33-209',
    },
  },
  {
    id: 'abc-4x16',
    category: 'overhead_cable',
    name: 'Câble Torsadé BT 4 × 16 mm² Alu',
    manufacturer: 'Nexans / Chakira Cable',
    specsSummary:
      'Câble aérien autoporteur 4 × 16 mm² aluminium, pour circuits triphasés d’éclairage ou branchements.',
    estimatedUnitCostEur: 2.1,
    unit: 'm',
    keyAttributes: {
      cores: 4,
      crossSectionMm2: 16,
      standardCompliant: 'NF C 33-209',
    },
  },
  {
    id: 'abc-4x25',
    category: 'overhead_cable',
    name: 'Câble Torsadé BT 4 × 25 mm² Alu',
    manufacturer: 'Nexans / Chakira Cable',
    specsSummary:
      'Câble aérien autoporteur 4 × 25 mm² aluminium, pour départs d’éclairage plus longs.',
    estimatedUnitCostEur: 2.9,
    unit: 'm',
    keyAttributes: {
      cores: 4,
      crossSectionMm2: 25,
      standardCompliant: 'NF C 33-209',
    },
  },
  {
    id: 'abc-3x35-54',
    category: 'overhead_cable',
    name: 'Câble Torsadé BT 3 × 35 + 54,6 mm² (neutre porteur)',
    manufacturer: 'Nexans / Chakira Cable',
    specsSummary:
      'Réseau aérien BT : 3 phases 35 mm² et neutre porteur Almelec 54,6 mm² (charge de rupture 1 660 daN).',
    estimatedUnitCostEur: 4.2,
    unit: 'm',
    keyAttributes: {
      phases: '3 × 35 mm²',
      messenger: 'Almelec 54,6 mm²',
      standardCompliant: 'NF C 33-209',
    },
  },
  {
    id: 'abc-anchor-clamp',
    category: 'overhead_cable',
    name: 'Pince d’Ancrage pour Torsadé (PA 25)',
    manufacturer: 'Sicame / Ensto',
    specsSummary:
      'Pince d’ancrage autoserrante pour câbles torsadés 2 × 16 à 4 × 25 mm², aux poteaux d’arrêt et d’angle.',
    estimatedUnitCostEur: 6,
    keyAttributes: { range: '2 × 16 – 4 × 25 mm²' },
  },
  {
    id: 'abc-suspension-clamp',
    category: 'overhead_cable',
    name: 'Pince de Suspension pour Torsadé',
    manufacturer: 'Sicame / Ensto',
    specsSummary:
      'Pince de suspension avec console, pour poteaux d’alignement.',
    estimatedUnitCostEur: 4.5,
    keyAttributes: { use: 'Alignement' },
  },
  {
    id: 'abc-ipc',
    category: 'overhead_cable',
    name: 'Connecteur à Perforation d’Isolant (CPI)',
    manufacturer: 'Sicame / Ensto',
    specsSummary:
      'Connecteur étanche à perforation d’isolant pour dériver l’alimentation d’un luminaire sur le torsadé.',
    estimatedUnitCostEur: 3.2,
    keyAttributes: { range: '6 – 95 mm²' },
  },
  // ELECTRICAL EQUIPMENT
  {
    id: 'ctrl-mppt-15a',
    category: 'electrical',
    name: 'Contrôleur Solaire MPPT 15A',
    manufacturer: 'Victron / Sresky',
    specsSummary:
      'Régulateur MPPT 15A 12/24V, gradation de nuit en trois paliers, détection crépusculaire, Bluetooth.',
    estimatedUnitCostEur: 85,
    keyAttributes: { amps: 15, voltage: '12/24V' },
  },
  {
    id: 'box-class2-fuse',
    category: 'electrical',
    name: 'Coffret de Porte de Mât Classe II avec Fusible',
    manufacturer: 'Hager / Legrand',
    specsSummary:
      'Coffret classe II pour porte de mât, porte-fusible 10 × 38 et bornier de raccordement 4 × 16 mm².',
    estimatedUnitCostEur: 22,
    keyAttributes: { protection: 'Classe II', fuse: '10 × 38' },
  },
  {
    id: 'cabinet-ep',
    category: 'electrical',
    name: 'Armoire de Commande Éclairage Public',
    manufacturer: 'Hager / Schneider',
    specsSummary:
      'Armoire polyester IP55 avec disjoncteur différentiel, contacteurs par départ et horloge astronomique.',
    estimatedUnitCostEur: 980,
    keyAttributes: { protection: 'IP55', departures: 4 },
  },
  {
    id: 'clock-astro',
    category: 'electrical',
    name: 'Horloge Astronomique 2 Canaux',
    manufacturer: 'Hager / Theben',
    specsSummary:
      'Allume et éteint l’éclairage au coucher et au lever du soleil calculés pour le lieu, avec abaissement de nuit.',
    estimatedUnitCostEur: 120,
    keyAttributes: { channels: 2 },
  },
  {
    id: 'photocell',
    category: 'electrical',
    name: 'Cellule Photoélectrique (Interrupteur Crépusculaire)',
    manufacturer: 'Legrand / Theben',
    specsSummary:
      'Cellule crépusculaire 16A, seuil réglable 2–200 lux, IP54, montée en tête de mât ou sur armoire.',
    estimatedUnitCostEur: 35,
    keyAttributes: { amps: 16, thresholdLux: '2–200' },
  },
  {
    id: 'earth-rod',
    category: 'electrical',
    name: 'Piquet de Terre Acier Cuivré 1,5m',
    manufacturer: 'Cadweld / Erico',
    specsSummary:
      'Piquet de terre acier cuivré 1,5m avec collier, pour la mise à la terre des mâts métalliques (≤ 100 Ω).',
    estimatedUnitCostEur: 18,
    keyAttributes: { lengthMeters: 1.5 },
  },
];

export const PUBLIC_MATERIALS_CATALOG = MATERIALS_CATALOG;
