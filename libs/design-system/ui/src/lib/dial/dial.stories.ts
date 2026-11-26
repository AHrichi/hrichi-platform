import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Dial } from './dial';

const SEASONS = ['Jan', 'Apr', 'Jul', 'Oct'];

/**
 * A round control: a half-moon gauge for a share, or a clock face that wraps
 * around for an hour or a week. Drag the knob or tap the face.
 */
const meta: Meta<Dial> = {
  title: 'Inputs/Dial',
  component: Dial,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 12rem">${story}</div>`,
    ),
  ],
  args: {
    label: 'Pad efficiency',
    value: 80,
    min: 50,
    max: 95,
    step: 1,
    unit: '%',
    variant: 'gauge',
  },
};
export default meta;

type Story = StoryObj<Dial>;

export const Gauge: Story = {
  play: async ({ canvasElement }) => {
    const dial = within(canvasElement).getByRole('slider', {
      name: 'Pad efficiency',
    });
    dial.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(dial).toHaveAttribute('aria-valuenow', '81');
    await userEvent.keyboard('{End}');
    await expect(dial).toHaveAttribute('aria-valuenow', '95');
  },
};

/** An hour of the day: 23 goes round to 0. */
export const Hours: Story = {
  args: {
    label: 'CHP starts at',
    variant: 'clock',
    value: 6,
    min: 0,
    max: 23,
    unit: '',
    period: 24,
    marks: [0, 6, 12, 18].map((value) => ({ value, label: String(value) })),
    valueText: (hour: number) => `${hour}:00`,
  },
};

/** A week of the year, with the seasons marked. */
export const YearWheel: Story = {
  args: {
    label: 'Planting week',
    variant: 'clock',
    value: 32,
    min: 1,
    max: 52,
    unit: '',
    zero: 1,
    period: 52,
    marks: [1, 14, 27, 40].map((value, i) => ({
      value,
      label: SEASONS[i],
    })),
    valueText: (week: number) => `Week ${week}`,
  },
};

/** Right to left, the gauge fills from the right. */
export const RightToLeft: Story = {
  decorators: [
    componentWrapperDecorator((story) => `<div dir="rtl">${story}</div>`),
  ],
  args: { label: 'كفاءة اللوح', value: 60 },
};
