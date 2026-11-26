import {
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ActionCard } from './action-card';

/** A change waiting for the reader's go-ahead. Its words are the app's. */
const meta: Meta<ActionCard> = {
  title: 'Chat/ActionCard',
  component: ActionCard,
  decorators: [
    componentWrapperDecorator(
      (story) => `<div style="max-inline-size: 26rem">${story}</div>`,
    ),
  ],
  args: {
    heading: 'Create the project “North house”',
    lines: ['Crop: pepper', 'Climate: Sfax', 'Currency: TND'],
    accept: fn(),
    decline: fn(),
  },
};
export default meta;

type Story = StoryObj<ActionCard>;

export const Pending: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Apply' }),
    );
    await expect(args.accept).toHaveBeenCalled();
  },
};

/** Deleting is marked as such. */
export const Danger: Story = {
  args: {
    heading: 'Delete the project “North house”',
    lines: ['Its 4 saved results go with it.'],
    tone: 'danger',
  },
};

export const Applied: Story = { args: { status: 'applied' } };

export const Failed: Story = {
  args: { status: 'failed', detail: 'insideC: 45 is outside 0–30 °C' },
};
