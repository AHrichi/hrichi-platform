import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { RichText } from './rich-text';

/**
 * Light formatting for text from a model (or anyone): paragraphs, lists,
 * bold, italic and code, drawn from a parsed tree, never as HTML.
 */
const meta: Meta<RichText> = {
  title: 'Typography/RichText',
  component: RichText,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 30rem">${story}</div>`,
    ),
  ],
  args: {
    text: [
      'In a greenhouse, water does four jobs:',
      '',
      '1. **Crop irrigation**: drip lines deliver what the crop *transpires*, plus a drain share.',
      '2. **Fertigation**: nutrients travel with the water; the drain EC stays under `6 dS/m` for tomato.',
      '3. **Cooling**: fog or wet pads turn water into cooler air on hot days.',
      '4. **Humidity**: a little vapour keeps the VPD in range.',
      '',
      'Open **Water** to size the first two for your house.',
    ].join('\n'),
  },
};
export default meta;

type Story = StoryObj<RichText>;

export const Answer: Story = {};

/** Bullets, a heading shown as a bold line, and marks left as typed. */
export const BulletsAndHeading: Story = {
  args: {
    text: [
      '### Before you save',
      '- check the *design night* temperature',
      '- 2 * 3 stays arithmetic, and **unclosed stays as typed',
    ].join('\n'),
  },
};

/** Arabic reads right to left; numbers, units and code stay left to right. */
export const RightToLeft: Story = {
  decorators: [
    componentWrapperDecorator(
      (story) => `<div dir="rtl" lang="ar">${story}</div>`,
    ),
  ],
  args: {
    text: [
      'يُستعمل الماء في البيت المحمي لـ:',
      '',
      '1. **الري**: يصل الماء إلى النباتات بالتنقيط.',
      '2. **التسميد**: يبقى `EC` الصرف تحت 6.',
    ].join('\n'),
  },
};
