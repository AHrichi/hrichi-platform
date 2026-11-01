import type {
  CompassDirection,
  ConductorType,
  PoleKind,
  PoleRole,
  ConcreteExposure,
  PoleStatus,
  PoleType,
  ProjectStage,
  RoadLightingClass,
  SoilType,
  WindZone,
} from '@ah/products/lighting/domain';

/** Option lists shared by the screens; their labels live in the copy. */
export const ROAD_CLASSES: readonly RoadLightingClass[] = [
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'C0',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
];

export const SOIL_TYPES: readonly SoilType[] = [
  'rock',
  'compact_gravel',
  'firm_clay',
  'soft_clay_silt',
  'loose_sand',
];

export const WIND_ZONES: readonly WindZone[] = [1, 2, 3, 4];

export const EXPOSURES: readonly ConcreteExposure[] = [
  'XC1_dry',
  'XC2',
  'XC4_cycling',
  'XS1_marine',
  'XF1_frost',
];

export const POLE_TYPES: readonly PoleType[] = [
  'solar_autonomous',
  'solar_hybrid',
  'conventional_ac',
];

export const POLE_STATUSES: readonly PoleStatus[] = [
  'planned',
  'excavated',
  'poured',
  'erected',
  'active',
];

export const PROJECT_STAGES: readonly ProjectStage[] = [
  'survey',
  'excavation',
  'foundations',
  'erection',
  'cabling_mounting',
  'commissioning',
  'audited',
];

export const DIRECTIONS: readonly CompassDirection[] = [
  'N',
  'NE',
  'E',
  'SE',
  'S',
  'SW',
  'W',
  'NW',
];

export const CONDUCTOR_TYPES: readonly ConductorType[] = [
  'abc_2x16',
  'abc_4x16',
  'abc_4x25',
  'abc_3x35_54',
  'abc_3x70_54',
  'abc_3x150_70',
];

export const POLE_KINDS: readonly PoleKind[] = [
  'steel',
  'aluminium',
  'frp',
  'concrete',
  'wood',
];

export const POLE_ROLES: readonly PoleRole[] = [
  'intermediate',
  'angle',
  'terminal',
];
