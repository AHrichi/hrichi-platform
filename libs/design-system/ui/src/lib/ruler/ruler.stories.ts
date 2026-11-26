import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Ruler } from './ruler';

/**
 * A tape under a fixed needle: swipe it, flick it and let it coast, or tap a
 * mark to bring it to the needle.
 */
const meta: Meta<Ruler> = {
  title: 'Inputs/Ruler',
  component: Ruler,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 22rem">${story}</div>`,
    ),
  ],
  args: {
    label: 'Ridge height',
    value: 6.3,
    min: 1.5,
    max: 12,
    step: 0.1,
    unit: 'm',
  },
};
export default meta;

type Story = StoryObj<Ruler>;

export const Fine: Story = {
  play: async ({ canvasElement }) => {
    const ruler = within(canvasElement).getByRole('slider', {
      name: 'Ridge height',
    });
    ruler.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(ruler).toHaveAttribute('aria-valuenow', '6.4');
    await userEvent.keyboard('{PageUp}');
    await expect(ruler).toHaveAttribute('aria-valuenow', '7.4');
  },
};

/** A coarse scale: a label every 100 ppm. */
export const Coarse: Story = {
  args: {
    label: 'Target CO₂',
    value: 800,
    min: 400,
    max: 1500,
    step: 10,
    unit: 'ppm',
  },
};

/** Near an end, the tape runs out under the needle. */
export const AtTheStart: Story = {
  args: { value: 1.7 },
};

/** Right to left, bigger numbers lie to the left. */
export const RightToLeft: Story = {
  decorators: [
    componentWrapperDecorator((story) => `<div dir="rtl">${story}</div>`),
  ],
  args: { label: 'ارتفاع القمة', value: 4.2 },
};
