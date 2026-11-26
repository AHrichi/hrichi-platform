import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Thermometer } from './thermometer';

/**
 * A temperature on a thermometer: the column turns from blue to red as it
 * warms. Drag it, tap the tube, or use the arrow keys.
 */
const meta: Meta<Thermometer> = {
  title: 'Inputs/Thermometer',
  component: Thermometer,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 20rem">${story}</div>`,
    ),
  ],
  args: {
    label: 'Inside temperature',
    value: 21,
    min: 0,
    max: 35,
    step: 0.5,
  },
};
export default meta;

type Story = StoryObj<Thermometer>;

export const Mild: Story = {
  play: async ({ canvasElement }) => {
    const scale = within(canvasElement).getByRole('slider', {
      name: 'Inside temperature',
    });
    scale.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(scale).toHaveAttribute('aria-valuenow', '21.5');
  },
};

/** A design night below freezing: 0 °C is marked on the tube. */
export const Frost: Story = {
  args: { label: 'Outside design night', value: -8, min: -25, max: 20 },
};

/** A hot water loop: the bulb glows. */
export const HotWater: Story = {
  args: { label: 'Supply', value: 80, min: 20, max: 95, step: 1 },
};

/** Right to left, the bulb sits on the right and the column grows left. */
export const RightToLeft: Story = {
  decorators: [
    componentWrapperDecorator((story) => `<div dir="rtl">${story}</div>`),
  ],
  args: { label: 'الحرارة في الداخل', value: 28 },
};
