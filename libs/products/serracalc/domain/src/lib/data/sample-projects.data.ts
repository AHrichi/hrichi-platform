import type { GreenhouseProject } from '../models/serra.models';
import { DEFAULT_GREENHOUSE } from './catalogue.data';

const CREATED = '2026-11-24T08:00:00.000Z';

/**
 * Made-up houses to try the tools on; they load only on request and sit
 * beside the user's own projects.
 */
export const SAMPLE_PROJECTS: readonly GreenhouseProject[] = [
  {
    id: 'sample_geothermal_tomato',
    title: 'Geothermal tomato house (sample)',
    site: 'Oasis block 3',
    climateId: 'kebili',
    crop: 'tomato',
    currency: 'TND',
    greenhouse: {
      ...DEFAULT_GREENHOUSE,
      spans: 10,
      lengthM: 100,
      cover: 'pe_double',
      screen: 'clear',
    },
    notes:
      'Heated with 68 °C water from a geothermal well, cooled for irrigation.',
    calculations: [],
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'sample_venlo_pepper',
    title: 'Venlo glasshouse, sweet pepper (sample)',
    site: 'Coastal plain',
    climateId: 'monastir',
    crop: 'pepper',
    currency: 'TND',
    greenhouse: {
      shape: 'venlo',
      spans: 12,
      spanWidthM: 9.6,
      lengthM: 80,
      gutterHeightM: 6,
      ridgeHeightM: 6.9,
      cover: 'glass_single',
      screen: 'shade_energy',
      perimeterInsulated: true,
    },
    calculations: [],
    createdAt: CREATED,
    updatedAt: CREATED,
  },
  {
    id: 'sample_tunnel_strawberry',
    title: 'Strawberry tunnels (sample)',
    site: 'Hillside farm',
    climateId: 'tunis',
    crop: 'strawberry',
    currency: 'TND',
    greenhouse: {
      shape: 'tunnel',
      spans: 1,
      spanWidthM: 8,
      lengthM: 50,
      gutterHeightM: 1.5,
      ridgeHeightM: 3.5,
      cover: 'pe_single',
      screen: 'none',
      perimeterInsulated: false,
    },
    calculations: [],
    createdAt: CREATED,
    updatedAt: CREATED,
  },
];
