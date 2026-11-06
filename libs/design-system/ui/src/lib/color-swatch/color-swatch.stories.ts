import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { ColorSwatch, type ColorSwatchItem } from './color-swatch';

const mockPalette: ColorSwatchItem[] = [
  {
    id: 'alpin',
    name: 'Alpine White',
    hex: '#f8fafc',
    finish: 'gloss',
    priceLabel: 'Included',
  },
  {
    id: 'nardo',
    name: 'Nardo Grey',
    hex: '#64748b',
    finish: 'gloss',
    priceLabel: 'Included',
  },
  {
    id: 'monaco',
    name: 'Monaco Blue',
    hex: '#1e3a8a',
    finish: 'metallic',
    priceLabel: '+€1,250',
  },
  {
    id: 'rosso',
    name: 'Sunset Rosso',
    hex: '#b91c1c',
    finish: 'metallic',
    priceLabel: '+€1,250',
  },
  {
    id: 'titan',
    name: 'Frozen Titanium',
    hex: '#475569',
    finish: 'matte',
    priceLabel: '+€2,600',
  },
  {
    id: 'pearl',
    name: 'Arctic Iridescent',
    hex: '#e2e8f0',
    finish: 'pearl',
    priceLabel: '+€3,100',
  },
];

/**
 * ColorSwatch renders an accessible radio group of swatches
 * with realistic metallic, matte, gloss and pearl sheen reflections.
 */
const meta: Meta<ColorSwatch> = {
  title: 'Inputs/ColorSwatch',
  component: ColorSwatch,
  args: {
    items: mockPalette,
    value: 'monaco',
    label: 'Exterior Finish',
    size: 'md',
    disabled: false,
  },
};
export default meta;

export const Default: StoryObj<ColorSwatch> = {};

export const Sizes: StoryObj<ColorSwatch> = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: bold;">Small (2rem)</p>
          <ah-color-swatch [items]="items" [value]="value" size="sm" />
        </div>
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: bold;">Medium (2.5rem)</p>
          <ah-color-swatch [items]="items" [value]="value" size="md" />
        </div>
        <div>
          <p style="margin-bottom: 0.5rem; font-weight: bold;">Large (3.25rem)</p>
          <ah-color-swatch [items]="items" [value]="value" size="lg" />
        </div>
      </div>
    `,
  }),
};
