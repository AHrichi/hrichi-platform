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
    estimatedUnitCostEur: 3.2, // per meter
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
    estimatedUnitCostEur: 5.8, // per meter
    keyAttributes: {
      conductor: 'Cuivre',
      crossSectionMm2: 10,
      cores: '4 (3Ph + N)',
      insulation: 'XLPE / PVC 0.6/1kV',
      standardCompliant: 'NF C 32-321',
    },
  },
];

export const PUBLIC_MATERIALS_CATALOG = MATERIALS_CATALOG;
