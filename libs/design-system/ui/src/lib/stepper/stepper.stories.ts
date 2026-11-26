import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Stepper } from './stepper';

/**
 * A number between − and +. Tap for a step, hold to keep going (it speeds
 * up), or type the value. Adaptive steppers jump between round numbers.
 */
const meta: Meta<Stepper> = {
  title: 'Inputs/Stepper',
  component: Stepper,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 16rem">${story}</div>`,
    ),
  ],
  args: {
    label: 'Spans',
    value: 6,
    min: 1,
    max: 60,
    step: 1,
    adaptive: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<Stepper>;

export const Count: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(canvas.getByRole('spinbutton', { name: 'Spans' })).toHaveValue(
      7,
    );
  },
};

/** A floor area: 9 600 m² steps up to 10 000, then 11 000. */
export const Adaptive: Story = {
  args: {
    label: 'Floor area',
    unit: 'm²',
    value: 9600,
    min: 10,
    max: 200000,
    step: 10,
    adaptive: true,
  },
};

/** At the top: + only knocks against the end. */
export const AtTheEnd: Story = {
  args: { label: 'Emitters per plant', value: 4, min: 1, max: 4 },
};

export const Disabled: Story = {
  args: { disabled: true },
};
