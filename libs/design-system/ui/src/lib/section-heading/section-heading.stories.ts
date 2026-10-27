import type { Meta, StoryObj } from '@storybook/angular-vite';
import { SectionHeading } from './section-heading';

const meta: Meta<SectionHeading> = {
  title: 'Layout/SectionHeading',
  component: SectionHeading,
  argTypes: { level: { control: 'inline-radio', options: [1, 2] } },
  args: {
    eyebrow: 'Open the hood',
    heading: 'This site is the proof',
    lead: 'Built the way I would build a client’s platform, with every decision written down.',
    level: 2,
  },
};
export default meta;

export const Section: StoryObj<SectionHeading> = {};
export const PageTitle: StoryObj<SectionHeading> = {
  args: { level: 1, eyebrow: undefined },
};
