import { StandardRegulationItem } from '../models/lighting.models';

export const STANDARDS_CATALOG: StandardRegulationItem[] = [
  {
    id: 'en-13201-2',
    code: 'EN 13201-2',
    title: 'Road Lighting — Part 2: Performance Requirements',
    jurisdiction: 'EU',
    category: 'photometrics',
    summary:
      'Defines photometric classes (M for motorized traffic, C for conflict areas, P for pedestrian & low-speed residential) and specifies minimum average illuminance (lux), luminance (cd/m²), and overall uniformity U0.',
    coreRequirements: [
      'Motorway classes M1 to M6 require overall uniformity U0 >= 0.35 - 0.40 and longitudinal uniformity Ul >= 0.50 - 0.70.',
      'Conflict areas C0 to C5 require average illuminance from 7.5 lux up to 50 lux with U0 >= 0.40.',
      'Residential pedestrian classes P1 to P6 require average illuminance from 2 lux (P6) to 15 lux (P1).',
      'Glare limitation: Threshold Increment TI <= 10% to 15% to prevent blinding drivers.',
    ],
    checklistItems: [
      'Determine road category and average vehicle speed (km/h).',
      'Measure road carriage width and lane configuration.',
      'Verify pole spacing ratio S/H does not exceed 4.5.',
      'Verify calculated average lux exceeds lighting class minimum.',
      'Check uniformity U0 >= 0.40 to prevent zebra dark-striping.',
    ],
  },
  {
    id: 'en-40-3',
    code: 'EN 40-3',
    title: 'Lighting Columns — Part 3: Design and Verification',
    jurisdiction: 'EU',
    category: 'mechanical_protection',
    summary:
      'Specifies structural verification, horizontal deflection limits under wind, and vertical plumb alignment tolerances for steel, aluminum, and concrete lighting columns.',
    coreRequirements: [
      'Maximum allowable vertical plumb deviation during erection: <= 1.0° (or 15 mm per meter of column height).',
      'Maximum horizontal deflection of column head under design wind: <= 0.04 * H.',
      'Baseplate must be anchored on minimum 4 bolts with dual leveling and locking nuts.',
      'Anti-shrinkage non-corrosive mortar grouting (20-30 mm) required beneath baseplate.',
    ],
    checklistItems: [
      'Check baseplate thickness (minimum 15-20 mm for 8-10m poles).',
      'Verify anchor bolts embedment depth into concrete massif.',
      'Perform 2-axis verticality check with spirit level or optical plumb line.',
      'Confirm leveling nuts torque tightening (250 N.m for M20 classe 8.8).',
      'Grout baseplate gap with non-shrink structural mortar.',
    ],
  },
  {
    id: 'eurocode-7',
    code: 'NF EN 1997-1 (Eurocode 7)',
    title: 'Geotechnical Design — Foundations for Public Works',
    jurisdiction: 'EU',
    category: 'civil_works',
    summary:
      'Rules for sizing concrete foundation massifs (massifs de candélabres) against lateral overturning moments caused by wind loads on the column and luminaires/solar panels.',
    coreRequirements: [
      'Safety Factor against overturning SF >= 1.50 under extreme gust wind.',
      'Minimum depth rule of thumb: D >= H / 10 + 0.50m (e.g. 1.30m for 8m pole, 1.50m for 10m pole).',
      'For solar poles with photovoltaic panels: minimum +25 cm foundation depth to withstand panel aerodynamic sail drag.',
      'Uncompacted loose soils or soft clay require a 10-15 cm drained gravel bed (hérisson drainant).',
    ],
    checklistItems: [
      'Inspect excavated pit depth against geotechnical minimum before pouring.',
      'Verify pit cleanliness: remove loose soil, stagnant water, and organic debris.',
      'Ensure minimum 40 mm concrete cover over steel reinforcement/anchor cages.',
      'Check anchor template (gabarit de scellement) orientation relative to street line.',
    ],
  },
  {
    id: 'nf-en-206',
    code: 'NF EN 206 / Eurocode 2',
    title: 'Concrete — Specification, Performance, Production and Conformity',
    jurisdiction: 'EU',
    category: 'civil_works',
    summary:
      'Specification of concrete compressive strength classes, minimum cement content, maximum water/cement ratio, and curing times for outdoor massifs.',
    coreRequirements: [
      'Minimum compressive strength class for public lighting massifs: C25/30.',
      'Minimum cement dosage: 350 kg/m³ (CEM II 32.5 or 42.5).',
      'Maximum Water/Cement ratio E/C <= 0.50 (excess water severely weakens foundation strength).',
      'Consistency class: S3 (Slump 10-15 cm, semi-fluid) for proper filling around anchor bolts without voids.',
      'Minimum curing time before column erection: 7 days (strength >= 70% of 28-day nominal strength).',
    ],
    checklistItems: [
      'Check delivery ticket from ready-mix truck (BPE) or verify on-site batch mixer bag counts.',
      'Perform slump test with Abrams Cone on site (target 10 - 14 cm).',
      'Prohibit unauthorized water addition into the mixer on site.',
      'Vibrate concrete thoroughly around anchor bolts to eliminate air pockets.',
      'Log pour date and enforce 7-day waiting period before column lifting.',
    ],
  },
  {
    id: 'iec-61215-62133',
    code: 'IEC 61215 & IEC 62133',
    title: 'Terrestrial PV Modules & Secondary Lithium Battery Safety',
    jurisdiction: 'IEC',
    category: 'solar_pv',
    summary:
      'Design qualification for outdoor photovoltaic modules (wind load, hail impact) and safety requirements for portable and stationary lithium LiFePO4 batteries in outdoor luminaires.',
    coreRequirements: [
      'PV modules must withstand mechanical static front load >= 2400 Pa (wind) and hail impact (25mm at 23 m/s).',
      'Lithium LiFePO4 battery pack must be IP67 sealed with BMS (Battery Management System) protecting overcharge, deep discharge, and thermal runaway.',
      'Battery operating temperature range: -20°C to +60°C.',
      'Minimum cycle life: >= 3000 cycles at 80% Depth of Discharge (DoD).',
    ],
    checklistItems: [
      'Verify solar panel tilt angle (typically 30° to 35° facing true South in Northern hemisphere).',
      'Ensure zero shadow obstruction from trees or adjacent buildings between 9h00 and 15h00.',
      'Verify battery thermal insulation if buried or mounted in column base.',
      'Inspect waterproof quick-connect cables (IP67 MC4 / aviation plugs).',
    ],
  },
  {
    id: 'iec-62262-60529',
    code: 'IEC 62262 & IEC 60529',
    title: 'IK Code (Mechanical Impact) & IP Code (Ingress Protection)',
    jurisdiction: 'IEC',
    category: 'mechanical_protection',
    summary:
      'Enclosure protection standards for road lighting luminaires and access door terminal blocks against water, dust, and vandalism.',
    coreRequirements: [
      'Optical and electrical compartments of street luminaires must be minimum IP66 (dust-tight and protected against powerful water jets).',
      'Luminaire mechanical impact resistance: minimum IK08 (5 Joules), recommended IK10 (20 Joules) in urban/vandalism-prone areas.',
      'Column access door (porte de mât) must be minimum IP44 with triangular security key lock.',
    ],
    checklistItems: [
      'Inspect luminaire glass/polycarbonate lens for IK08/IK10 certification markings.',
      'Check silicone gasket integrity before closing luminaire housing.',
      'Verify presence and tightness of access door security screw on the pole base.',
      'Ensure terminal block (coffret pied de candélabre) is mounted >= 30 cm above ground level.',
    ],
  },
  {
    id: 'nf-c-17-200',
    code: 'NF C 17-200',
    title: 'Electrical Installations for Public Lighting Networks',
    jurisdiction: 'EU',
    category: 'electrical_safety',
    summary:
      'National and international electrical installation code for underground and overhead street lighting grids, earthing, voltage drop, and protection devices.',
    coreRequirements: [
      'Maximum allowable voltage drop at furthest luminaire: <= 3% (recommended for LED) or max 5%.',
      'Minimum underground cable cross-section: 6 mm² copper (or 10 mm² aluminum) for mechanical strength.',
      'Each column base must contain a protective fuse/circuit breaker (e.g. 6A gG or 10A C-curve).',
      'Earth grounding electrode at each column (or interconnected earth wire) with resistance R <= 10 Ohms (or max 30 Ohms).',
    ],
    checklistItems: [
      'Measure loop impedance and earth resistance with grounding meter (teluromètre).',
      'Check cable burial depth in trench (minimum 60 cm under sidewalk, 80 cm under road carriage with warning mesh).',
      'Verify phase balance across the 3 phases on feeder panel.',
      'Confirm luminaire Class II electrical insulation (double insulation, no earth connection to pole shaft) or Class I with protective bonding.',
    ],
  },
];

export const LIGHTING_STANDARDS = STANDARDS_CATALOG;
