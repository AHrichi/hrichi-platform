import {
  type Meta,
  moduleMetadata,
  type StoryObj,
} from '@storybook/angular-vite';
import { SwipeCard } from './swipe-card';

interface Args {
  allowUp: boolean;
  disabled: boolean;
  label: string;
}

const meta: Meta<Args> = {
  title: 'Learning/Swipe card',
  decorators: [moduleMetadata({ imports: [SwipeCard] })],
  parameters: { layout: 'padded' },
  args: {
    allowUp: true,
    disabled: false,
    label: 'Swipe right to keep, up for shaky, left to discard',
  },
  render: (args) => ({
    props: args,
    template: `
      <lrn-swipe-card
        [allowUp]="allowUp"
        [disabled]="disabled"
        [label]="label"
        style="
          max-width: 24rem;
          padding: var(--space-4);
          border: 1px solid var(--color-border-default);
          border-radius: var(--radius-lg);
          background: var(--color-bg-raised);
        "
      >
        <p style="margin: 0 0 var(--space-2); font-weight: var(--font-weight-semibold);">
          Opportunity cost
        </p>
        <p style="margin: 0; color: var(--color-text-muted);">
          The value of the next best alternative given up when making a choice.
        </p>
      </lrn-swipe-card>
    `,
  }),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
